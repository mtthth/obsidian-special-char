import { RangeSetBuilder } from "@codemirror/state";
import { Decoration, DecorationSet, EditorView, ViewPlugin, ViewUpdate } from "@codemirror/view";
import { NBSP, NNBSP } from "./chars";

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

// Décore la fenêtre d'édition (Live Preview et Source) sans toucher au texte
// lui-même : purement visuel, par des mark decorations CodeMirror 6.
function decorationPlugin(collect: (view: EditorView, push: PushRange) => void) {
	const build = (view: EditorView): DecorationSet => {
		const builder = new RangeSetBuilder<Decoration>();
		collect(view, (from, to, cls) =>
			builder.add(from, to, Decoration.mark({ class: cls }))
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
