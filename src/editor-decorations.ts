import { RangeSetBuilder } from "@codemirror/state";
import { Decoration, DecorationSet, EditorView, ViewPlugin, ViewUpdate } from "@codemirror/view";
import { NBSP, NNBSP } from "./chars";
import {
	LANGUAGE_SCAN_LIMIT,
	Lang,
	LanguageSetting,
	languageSpans,
	paragraphDetectionApplies,
	resolveLanguage,
} from "./language";
import { findFaultySigns, SignSide } from "./typography";

// Classes CSS appliquées, dans l'éditeur, aux espaces normalement invisibles.
const INVISIBLE_SPACE_CLASSES: Record<string, string> = {
	[NBSP]: "special-char-visible-nbsp",
	[NNBSP]: "special-char-visible-nnbsp",
};

type PushRange = (from: number, to: number, cls: string) => void;

function collectInvisibleSpaces(view: EditorView, push: PushRange) {
	for (const { from, to } of view.visibleRanges) {
		const text = view.state.doc.sliceString(from, to);
		for (let i = 0; i < text.length; i++) {
			const cls = INVISIBLE_SPACE_CLASSES[text[i]];
			if (cls) {
				push(from + i, from + i + 1, cls);
			}
		}
	}
}

type TextRange = { from: number; to: number };

// Fusionne les plages triées qui se touchent ou se chevauchent. Une même ligne
// peut en effet apparaître dans deux plages visibles, CodeMirror escamotant des
// portions des lignes très longues : la scanner deux fois produirait des
// positions décroissantes, que la construction des décorations rejette par une
// exception.
function mergeRanges(ranges: TextRange[]): TextRange[] {
	const merged: TextRange[] = [];

	for (const { from, to } of ranges) {
		const last = merged[merged.length - 1];

		if (last && from <= last.to) {
			last.to = Math.max(last.to, to);
		} else {
			merged.push({ from, to });
		}
	}

	return merged;
}

// Plages visibles élargies aux lignes entières — un motif coupé par la limite
// de la zone visible ne serait pas reconnu — puis fusionnées.
export function visibleLineRanges(view: EditorView): TextRange[] {
	const doc = view.state.doc;

	return mergeRanges(view.visibleRanges.map((range) => ({ from: doc.lineAt(range.from).from, to: doc.lineAt(range.to).to })));
}

// Au-delà, un « paragraphe » n'en est plus un : on cesse de l'étendre plutôt que
// de lire un document entier sans ligne vide à chaque frappe.
const MAX_PARAGRAPH_LINES = 200;

// Plages visibles élargies aux paragraphes entiers. La langue d'un paragraphe se
// juge sur tous ses mots : vu par la seule ligne qui dépasse en bas de l'écran,
// un paragraphe anglais paraîtrait trop court pour être reconnu, et ses espaces
// se mettraient à être signalées au fil du défilement.
export function visibleParagraphRanges(view: EditorView): TextRange[] {
	const doc = view.state.doc;
	const isBlank = (line: number) => doc.line(line).text.trim() === "";

	return mergeRanges(
		visibleLineRanges(view).map((range) => {
			let first = doc.lineAt(range.from).number;
			let last = doc.lineAt(range.to).number;

			// Une ligne vide en bord de plage n'appartient à aucun paragraphe :
			// il n'y a rien à rattacher de ce côté.
			for (let i = 0; !isBlank(first) && i < MAX_PARAGRAPH_LINES && first > 1 && !isBlank(first - 1); i++) {
				first--;
			}
			for (let i = 0; !isBlank(last) && i < MAX_PARAGRAPH_LINES && last < doc.lines && !isBlank(last + 1); i++) {
				last++;
			}

			return { from: doc.line(first).from, to: doc.line(last).to };
		})
	);
}

// Le bloc de métadonnées est un fait du document entier, pas de la tranche
// analysée : son motif dans PROTECTED_RE est ancré sur le début du texte reçu,
// si bien qu'une fois le « --- » ouvrant défilé hors de l'écran, plus rien ne
// distingue « clé: valeur » d'une phrase à corriger. Sa fin se calcule donc ici,
// sur le document, une fois par construction des décorations.
function frontmatterEnd(view: EditorView): number {
	const doc = view.state.doc;

	if (doc.line(1).text.trimEnd() !== "---") {
		return 0;
	}
	for (let n = 2; n <= doc.lines; n++) {
		if (doc.line(n).text.trimEnd() === "---") {
			return doc.line(n).to;
		}
	}

	return 0;
}

// Classe du repère d'espacement fautif, selon le côté du signe où l'insécable
// est attendue : la feuille de style y dessine le caret.
const SPACING_MARKER_CLASSES: Record<SignSide, string> = {
	before: "special-char-spacing-marker-before",
	after: "special-char-spacing-marker-after",
};

// Langue de la note affichée, lue sur le texte du document et non sur le cache
// de métadonnées d'Obsidian : la vue n'a pas accès au fichier, et le texte est
// toujours à jour, là où le cache peut avoir un temps de retard après une frappe.
export function viewLanguage(view: EditorView, defaultLanguage: LanguageSetting): { lang: Lang | null; paragraphs: boolean } {
	const note = resolveLanguage(view.state.doc.sliceString(0, LANGUAGE_SCAN_LIMIT), defaultLanguage);

	return { lang: note.lang, paragraphs: paragraphDetectionApplies(note) };
}

// Les espaces attendues avant la ponctuation sont une règle française : seuls
// les passages français sont examinés. Ce peut être toute la note, les
// paragraphes que `paragraphs` autorise à avoir leur propre langue, ou un passage
// forcé par `<span lang="fr">` — y compris dans une note qui n'est pas française.
//
// La langue se juge sur des paragraphes entiers, plus larges que ce qui est à
// l'écran : un passage forcé ne se lit que balises comprises, et un paragraphe vu
// par sa seule dernière ligne paraîtrait trop court. Seules les lignes visibles
// reçoivent pourtant un repère.
export function collectWrongSpaces(view: EditorView, push: PushRange, lang: Lang | null, paragraphs = false) {
	const fmEnd = frontmatterEnd(view);
	const visible = visibleLineRanges(view);
	const isVisible = (pos: number) => visible.some((range) => pos >= range.from && pos <= range.to);

	for (const { from, to } of visibleParagraphRanges(view)) {
		if (to <= fmEnd) {
			continue;
		}

		// fmEnd tombe toujours en fin de ligne : la tranche reste alignée sur
		// des lignes entières, ce dont dépendent les motifs ancrés sur ^ et $. Il
		// en va de même des frontières de paragraphe.
		const base = Math.max(from, fmEnd);
		const text = view.state.doc.sliceString(base, to);

		// Ni la note, ni un paragraphe, ni un passage forcé ne peut être français
		// ici : inutile de chercher des espaces fautives dans une note anglaise.
		if (lang !== "fr" && !paragraphs && !/lang\s*=/i.test(text)) {
			continue;
		}

		const spans = languageSpans(text, lang, paragraphs);
		const isFrench = (pos: number) => spans.some((span) => span.lang === "fr" && pos >= span.from && pos < span.to);

		// Le repère est posé sur le signe dont l'espacement est fautif, du côté
		// où l'insécable est attendue — que l'espace soit ordinaire ou absente.
		// findFaultySigns rend les signes triés, comme l'exige RangeSetBuilder.
		for (const [sign, side] of findFaultySigns(text)) {
			if (isFrench(sign) && isVisible(base + sign)) {
				push(base + sign, base + sign + 1, SPACING_MARKER_CLASSES[side]);
			}
		}
	}
}

// Info-bulle du repère. Portée par le signe lui-même, elle s'affiche au survol
// du signe comme du caret dessiné contre lui.
const SPACING_MARKER_TITLE = { title: "Espacement fautif : une espace insécable est attendue ici." };
const MARK_ATTRIBUTES: Record<string, { [name: string]: string }> = {
	[SPACING_MARKER_CLASSES.before]: SPACING_MARKER_TITLE,
	[SPACING_MARKER_CLASSES.after]: SPACING_MARKER_TITLE,
};

// Décore la fenêtre d'édition (Live Preview et Source) sans toucher au texte
// lui-même : purement visuel, par des mark decorations CodeMirror 6. Même le
// repère d'une espace absente, qu'aucun caractère ne permet de souligner, est
// une marque — posée sur le signe voisin — et non un widget inséré entre deux
// caractères : CodeMirror flanque tout widget d'une image tampon, sur laquelle
// le navigateur peut couper la ligne (« Bonjour » en fin de ligne, « ! » seul
// au début de la suivante), soit le défaut même que le repère signale.
function decorationPlugin(collect: (view: EditorView, push: PushRange) => void) {
	const build = (view: EditorView): DecorationSet => {
		const builder = new RangeSetBuilder<Decoration>();
		collect(view, (from, to, cls) =>
			builder.add(from, to, Decoration.mark({ class: cls, attributes: MARK_ATTRIBUTES[cls] }))
		);
		return builder.finish();
	};

	return ViewPlugin.fromClass(
		class {
			decorations: DecorationSet;

			constructor(view: EditorView) {
				this.decorations = build(view);
			}

			update(update: ViewUpdate) {
				if (update.docChanged || update.viewportChanged) {
					this.decorations = build(update.view);
				}
			}
		},
		{
			decorations: (plugin) => plugin.decorations,
		}
	);
}

export const invisibleSpacesViewPlugin = decorationPlugin(collectInvisibleSpaces);

// Une fabrique, et non une constante : la langue par défaut vient des réglages,
// et un plugin neuf à chaque changement de réglage est ce qui force CodeMirror à
// reconstruire les décorations des éditeurs déjà ouverts.
export const createWrongSpacesViewPlugin = (getDefaultLanguage: () => LanguageSetting) =>
	decorationPlugin((view, push) => {
		const { lang, paragraphs } = viewLanguage(view, getDefaultLanguage());
		collectWrongSpaces(view, push, lang, paragraphs);
	});
