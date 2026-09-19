import { RangeSetBuilder } from "@codemirror/state";
import { Decoration, DecorationSet, EditorView, ViewPlugin, ViewUpdate, WidgetType } from "@codemirror/view";
import { NBSP, NNBSP } from "./chars";
import {
	LANGUAGE_SCAN_LIMIT,
	Lang,
	LanguageSetting,
	languageSpans,
	paragraphDetectionApplies,
	resolveLanguage,
} from "./language";
import { findMissingSpaces, findWrongSpaces } from "./typography";

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
		const events: [number, number, string][] = [];

		// Une espace fautive reçoit à la fois le soulignement ondulé, sur le
		// caractère lui-même, et le repère très visible — au même endroit
		// qu'une espace manquante, juste avant le signe de ponctuation.
		for (const [start, end] of findWrongSpaces(text)) {
			if (isFrench(start)) {
				events.push([start, end, "special-char-wrong-space"]);
				events.push([end, end, "special-char-spacing-marker"]);
			}
		}
		for (const pos of findMissingSpaces(text)) {
			if (isFrench(pos)) {
				events.push([pos, pos, "special-char-spacing-marker"]);
			}
		}

		// Les deux motifs peuvent s'entremêler dans le texte : les fusionner
		// triés est indispensable, RangeSetBuilder exigeant des positions
		// croissantes.
		events.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
		for (const [start, end, cls] of events) {
			if (isVisible(base + start)) {
				push(base + start, base + end, cls);
			}
		}
	}
}

// Marqueur de largeur nulle posé là où une espace insécable manque ou est
// fautive : contrairement à une classe posée sur un intervalle existant, un
// widget peut signaler un point du texte qui ne contient aucun caractère à
// souligner — le seul cas possible quand l'espace manque entièrement.
class SpacingMarkerWidget extends WidgetType {
	constructor(private readonly cls: string) {
		super();
	}

	toDOM(): HTMLElement {
		const marker = document.createElement("span");
		marker.className = this.cls;
		marker.setAttribute("aria-label", "Espacement fautif : une espace insécable est attendue ici.");
		marker.title = "Espacement fautif : une espace insécable est attendue ici.";
		return marker;
	}

	eq(other: SpacingMarkerWidget): boolean {
		return other.cls === this.cls;
	}

	ignoreEvent(): boolean {
		return true;
	}
}

// Décore la fenêtre d'édition (Live Preview et Source) sans toucher au texte
// lui-même : purement visuel, via des mark et des widget decorations
// CodeMirror 6. Une plage de largeur nulle (from === to) devient un widget —
// c'est le seul moyen de marquer une espace absente, qu'aucun caractère ne
// permet de souligner.
function decorationPlugin(collect: (view: EditorView, push: PushRange) => void) {
	const build = (view: EditorView): DecorationSet => {
		const builder = new RangeSetBuilder<Decoration>();
		collect(view, (from, to, cls) =>
			builder.add(
				from,
				to,
				from === to ? Decoration.widget({ widget: new SpacingMarkerWidget(cls), side: 1 }) : Decoration.mark({ class: cls })
			)
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
