import { App, Editor, Modal, Notice, Plugin } from "obsidian";

interface SpecialChar {
	char: string;
	label: string;
	preview: string;
}

// Caractères typographiques français difficiles à taper au clavier standard.
const SPECIAL_CHARS: SpecialChar[] = [
	{
		char: " ",
		label: "Espace fine insécable",
		preview: "A B",
	},
	{
		char: " ",
		label: "Espace insécable",
		preview: "A B",
	},
	{
		char: "«",
		label: "Guillemet français ouvrant",
		preview: "«",
	},
	{
		char: "»",
		label: "Guillemet français fermant",
		preview: "»",
	},
];

function codePointLabel(char: string): string {
	const codePoint = char.codePointAt(0) ?? 0;
	return "U+" + codePoint.toString(16).toUpperCase().padStart(4, "0");
}

export default class SpecialCharactersPlugin extends Plugin {
	async onload() {
		this.addCommand({
			id: "open-special-characters-picker",
			name: "Insérer un caractère spécial",
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
	}

	private openPicker() {
		const editor = this.app.workspace.activeEditor?.editor;
		if (!editor) {
			new Notice("Ouvrez d'abord une note pour insérer un caractère spécial.");
			return;
		}
		new SpecialCharacterModal(this.app, editor).open();
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
			text: "Cliquez sur un caractère, ou pressez sa touche numérique, pour l'insérer.",
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
		const editor = this.editor;

		if (editor.somethingSelected()) {
			editor.replaceSelection(char);
		} else {
			const cursor = editor.getCursor();
			editor.replaceRange(char, cursor);
			editor.setCursor({ line: cursor.line, ch: cursor.ch + char.length });
		}

		this.close();
		editor.focus();
	}
}
