import { RangeSetBuilder } from "@codemirror/state";
import { Decoration, DecorationSet, EditorView, ViewPlugin, ViewUpdate, WidgetType } from "@codemirror/view";
import { NBSP, NNBSP } from "./chars";
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

// Plages visibles élargies aux lignes entières — un motif coupé par la limite
// de la zone visible ne serait pas reconnu — puis fusionnées. Une même ligne
// peut en effet apparaître dans deux plages visibles, CodeMirror escamotant des
// portions des lignes très longues : la scanner deux fois produirait des
// positions décroissantes, que la construction des décorations rejette par une
// exception.
export function visibleLineRanges(view: EditorView): { from: number; to: number }[] {
	const merged: { from: number; to: number }[] = [];

	for (const range of view.visibleRanges) {
		const from = view.state.doc.lineAt(range.from).from;
		const to = view.state.doc.lineAt(range.to).to;
		const last = merged[merged.length - 1];

		if (last && from <= last.to) {
			last.to = Math.max(last.to, to);
		} else {
			merged.push({ from, to });
		}
	}

	return merged;
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

export function collectWrongSpaces(view: EditorView, push: PushRange) {
	const fmEnd = frontmatterEnd(view);

	for (const { from, to } of visibleLineRanges(view)) {
		if (to <= fmEnd) {
			continue;
		}

		// fmEnd tombe toujours en fin de ligne : la tranche reste alignée sur
		// des lignes entières, ce dont dépendent les motifs ancrés sur ^ et $.
		const base = Math.max(from, fmEnd);
		const text = view.state.doc.sliceString(base, to);
		const events: [number, number, string][] = [];

		// Une espace fautive reçoit à la fois le soulignement ondulé, sur le
		// caractère lui-même, et le repère très visible — au même endroit
		// qu'une espace manquante, juste avant le signe de ponctuation.
		for (const [start, end] of findWrongSpaces(text)) {
			events.push([start, end, "special-char-wrong-space"]);
			events.push([end, end, "special-char-spacing-marker"]);
		}
		for (const pos of findMissingSpaces(text)) {
			events.push([pos, pos, "special-char-spacing-marker"]);
		}

		// Les deux motifs peuvent s'entremêler dans le texte : les fusionner
		// triés est indispensable, RangeSetBuilder exigeant des positions
		// croissantes.
		events.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
		for (const [start, end, cls] of events) {
			push(base + start, base + end, cls);
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

	// Le triangle déborde sous les caractères voisins : un clic dessus doit
	// être traité par l'éditeur comme un clic sur le texte à cet endroit —
	// placement du curseur, double-clic sur un mot, glisser —, et non
	// abandonné au navigateur, dont la sélection native diffère de la sienne.
	ignoreEvent(): boolean {
		return false;
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
export const wrongSpacesViewPlugin = decorationPlugin(collectWrongSpaces);
