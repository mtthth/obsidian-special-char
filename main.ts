import { App, Editor, Modal, Notice, Plugin, PluginSettingTab, Setting } from "obsidian";
import { Extension, RangeSetBuilder } from "@codemirror/state";
import { Decoration, DecorationSet, EditorView, ViewPlugin, ViewUpdate } from "@codemirror/view";

interface SpecialChar {
	id: string;
	char: string;
	label: string;
	preview: string;
}

// Caractères typographiques français difficiles à taper au clavier standard.
// Note : les champs `char`/`preview` de narrow-nbsp et nbsp contiennent de
// véritables caractères espace insécable / fine insécable (U+00A0, U+202F),
// donc invisibles à l'œil nu dans un éditeur de code — ne pas les remplacer
// par une espace normale lors d'une future modification de ce fichier.
const SPECIAL_CHARS: SpecialChar[] = [
	{
		id: "narrow-nbsp",
		char: " ",
		label: "Espace fine insécable",
		preview: "A B",
	},
	{
		id: "nbsp",
		char: " ",
		label: "Espace insécable",
		preview: "A B",
	},
	{
		id: "guillemet-ouvrant",
		char: "«",
		label: "Guillemet français ouvrant",
		preview: "«",
	},
	{
		id: "guillemet-fermant",
		char: "»",
		label: "Guillemet français fermant",
		preview: "»",
	},
];

function codePointLabel(char: string): string {
	const codePoint = char.codePointAt(0) ?? 0;
	return "U+" + codePoint.toString(16).toUpperCase().padStart(4, "0");
}

function insertSpecialChar(editor: Editor, char: string) {
	if (editor.somethingSelected()) {
		editor.replaceSelection(char);
	} else {
		const cursor = editor.getCursor();
		editor.replaceRange(char, cursor);
		editor.setCursor({ line: cursor.line, ch: cursor.ch + char.length });
	}
	editor.focus();
}

interface SpecialCharPluginSettings {
	showInvisibleSpaces: boolean;
}

const DEFAULT_SETTINGS: SpecialCharPluginSettings = {
	showInvisibleSpaces: true,
};

// Classes CSS appliquées, dans l'éditeur, aux espaces normalement invisibles.
const INVISIBLE_SPACE_CLASSES: Record<string, string> = {
	" ": "special-char-visible-nbsp",
	" ": "special-char-visible-nnbsp",
};

function buildInvisibleSpaceDecorations(view: EditorView): DecorationSet {
	const builder = new RangeSetBuilder<Decoration>();
	for (const { from, to } of view.visibleRanges) {
		const text = view.state.doc.sliceString(from, to);
		for (let i = 0; i < text.length; i++) {
			const cls = INVISIBLE_SPACE_CLASSES[text[i]];
			if (cls) {
				const pos = from + i;
				builder.add(pos, pos + 1, Decoration.mark({ class: cls }));
			}
		}
	}
	return builder.finish();
}

// Décore les espaces insécable et fine insécable dans la fenêtre d'édition
// (Live Preview et Source) sans toucher au texte lui-même : un simple encadré
// visuel, purement cosmétique, appliqué via une mark decoration CodeMirror 6.
const invisibleSpacesViewPlugin = ViewPlugin.fromClass(
	class {
		decorations: DecorationSet;

		constructor(view: EditorView) {
			this.decorations = buildInvisibleSpaceDecorations(view);
		}

		update(update: ViewUpdate) {
			if (update.docChanged || update.viewportChanged) {
				this.decorations = buildInvisibleSpaceDecorations(update.view);
			}
		}
	},
	{
		decorations: (plugin) => plugin.decorations,
	}
);

export default class SpecialCharactersPlugin extends Plugin {
	settings: SpecialCharPluginSettings;
	// Obsidian conserve une référence sur ce tableau et le relit pour chaque
	// éditeur, existant comme futur : le modifier puis appeler updateOptions()
	// est la façon documentée de reconfigurer une extension CodeMirror 6.
	private editorExtensions: Extension[] = [];

	async onload() {
		await this.loadSettings();

		this.registerEditorExtension(this.editorExtensions);
		this.applyInvisibleSpacesSetting();

		this.addSettingTab(new SpecialCharSettingTab(this.app, this));

		this.addCommand({
			id: "open-special-characters-picker",
			name: "Insérer un caractère spécial (fenêtre)",
			hotkeys: [
				{
					modifiers: ["Mod", "Alt"],
					key: "s",
				},
			],
			callback: () => this.openPicker(),
		});

		this.addRibbonIcon("text-cursor-input", "Insérer un caractère spécial", () => {
			this.openPicker();
		});

		// Une commande dédiée par caractère : chacune dispose de son propre
		// raccourci clavier, configurable individuellement dans Réglages →
		// Raccourcis clavier (un raccourci par défaut Mod+Alt+<chiffre> est
		// proposé mais peut être réassigné ou désactivé librement).
		SPECIAL_CHARS.forEach((item, index) => {
			this.addCommand({
				id: `insert-${item.id}`,
				name: `Insérer : ${item.label} (${codePointLabel(item.char)})`,
				hotkeys: [
					{
						modifiers: ["Mod", "Alt"],
						key: String(index + 1),
					},
				],
				editorCallback: (editor: Editor) => {
					insertSpecialChar(editor, item.char);
				},
			});
		});
	}

	private openPicker() {
		const editor = this.app.workspace.activeEditor?.editor;
		if (!editor) {
			new Notice("Ouvrez d'abord une note pour insérer un caractère spécial.");
			return;
		}
		new SpecialCharacterModal(this.app, editor).open();
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	// Applique le réglage à toutes les fenêtres d'édition, sans recharger le
	// plugin.
	applyInvisibleSpacesSetting() {
		this.editorExtensions.length = 0;
		if (this.settings.showInvisibleSpaces) {
			this.editorExtensions.push(invisibleSpacesViewPlugin);
		}
		this.app.workspace.updateOptions();
	}
}

class SpecialCharSettingTab extends PluginSettingTab {
	private plugin: SpecialCharactersPlugin;

	constructor(app: App, plugin: SpecialCharactersPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName("Afficher les espaces insécables dans l'éditeur")
			.setDesc(
				"Encadre visuellement les espaces insécable et fine insécable (U+00A0, U+202F) dans la fenêtre d'édition, pour les distinguer des espaces normales."
			)
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.showInvisibleSpaces).onChange(async (value) => {
					this.plugin.settings.showInvisibleSpaces = value;
					await this.plugin.saveSettings();
					this.plugin.applyInvisibleSpacesSetting();
				})
			);
	}
}

class SpecialCharacterModal extends Modal {
	private editor: Editor;

	constructor(app: App, editor: Editor) {
		super(app);
		this.editor = editor;
	}

	onOpen() {
		const { contentEl } = this;
		this.modalEl.addClass("special-char-modal");

		contentEl.createEl("h2", { text: "Caractères spéciaux" });
		contentEl.createEl("p", {
			cls: "special-char-hint",
			text: "Cliquez sur un caractère, ou pressez sa touche numérique, pour l'insérer. Chaque caractère dispose aussi de son propre raccourci clavier configurable dans Réglages → Raccourcis clavier.",
		});

		const list = contentEl.createDiv({ cls: "special-char-list" });

		SPECIAL_CHARS.forEach((item, index) => {
			const key = String(index + 1);
			const code = codePointLabel(item.char);

			const button = list.createEl("button", {
				cls: "special-char-button",
				attr: { "aria-label": `${item.label} (${code})` },
			});

			button.createDiv({ cls: "special-char-preview", text: item.preview });

			const textEl = button.createDiv({ cls: "special-char-text" });
			textEl.createDiv({ cls: "special-char-label", text: item.label });
			textEl.createDiv({ cls: "special-char-code", text: code });

			const keyBadge = button.createDiv({ cls: "special-char-key" });
			keyBadge.setText(key);

			button.addEventListener("click", () => {
				this.insertChar(item.char);
			});

			this.scope.register([], key, () => {
				this.insertChar(item.char);
				return false;
			});
		});
	}

	onClose() {
		this.contentEl.empty();
	}

	private insertChar(char: string) {
		insertSpecialChar(this.editor, char);
		this.close();
		this.editor.focus();
	}
}
