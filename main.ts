import { Editor, Notice, Plugin } from "obsidian";
import { Extension } from "@codemirror/state";
import { ALL_CHARS, SpecialChar, codePointLabel, hotkey, insertSpecialChar } from "./src/chars";
import { createWrongSpacesViewPlugin, invisibleSpacesViewPlugin } from "./src/editor-decorations";
import {
	LANGUAGE_SETTINGS,
	describeLanguage,
	languageSpans,
	paragraphDetectionApplies,
	resolveLanguage,
	resolveParagraph,
} from "./src/language";
import { SpecialCharacterModal } from "./src/picker-modal";
import { DEFAULT_SETTINGS, RECENT_COUNT, SpecialCharPluginSettings } from "./src/settings";
import { SpecialCharSettingTab } from "./src/settings-tab";
import { applyTypography } from "./src/typography";

export default class SpecialCharactersPlugin extends Plugin {
	settings: SpecialCharPluginSettings;
	// Obsidian conserve une référence sur ce tableau et le relit pour chaque
	// éditeur, existant comme futur : le modifier puis appeler updateOptions()
	// est la façon documentée de reconfigurer une extension CodeMirror 6.
	private editorExtensions: Extension[] = [];

	async onload() {
		await this.loadSettings();

		this.registerEditorExtension(this.editorExtensions);
		this.applyEditorDecorations();

		this.addSettingTab(new SpecialCharSettingTab(this.app, this));

		this.addCommand({
			id: "open-special-characters-picker",
			name: "Insérer un caractère spécial (fenêtre)",
			hotkeys: [hotkey("S")],
			callback: () => this.openPicker(),
		});

		this.addRibbonIcon("text-cursor-input", "Insérer un caractère spécial", () => {
			this.openPicker();
		});

		this.addCommand({
			id: "fix-typography-in-selection",
			name: "Corriger la typographie de la sélection",
			editorCallback: (editor: Editor) => this.fixTypography(editor),
		});

		this.addCommand({
			id: "diagnose-note-language",
			name: "Diagnostic : langue de la note",
			editorCallback: (editor: Editor) => this.diagnoseLanguage(editor),
		});

		// Une commande dédiée par caractère : chacune peut recevoir son propre
		// raccourci dans Réglages → Raccourcis clavier. Seuls les quatre
		// caractères les plus courants en ont un par défaut, pour éviter les
		// conflits qu'imposeraient une quarantaine de raccourcis imposés.
		for (const item of ALL_CHARS) {
			this.addCommand({
				id: `insert-${item.id}`,
				name: `Insérer : ${item.label}`,
				hotkeys: item.hotkey ? [item.hotkey] : [],
				editorCallback: (editor: Editor) => {
					this.insertChar(editor, item);
				},
			});
		}
	}

	private fixTypography(editor: Editor) {
		if (!editor.somethingSelected()) {
			new Notice("Sélectionnez d'abord le texte à corriger.");
			return;
		}

		// La langue vient de la note et de ses paragraphes entiers, pas des quelques
		// mots sélectionnés, qui ne permettraient pas de la deviner : une sélection
		// peut d'ailleurs couvrir des paragraphes de langues différentes, chacun
		// corrigé selon la sienne. Les positions sont ramenées au début de la
		// sélection, que le texte à corriger prend pour origine.
		const doc = editor.getValue();
		const note = resolveLanguage(doc, this.settings.defaultLanguage);
		const start = editor.posToOffset(editor.getCursor("from"));
		const end = editor.posToOffset(editor.getCursor("to"));
		const spans = languageSpans(doc, note.lang, paragraphDetectionApplies(note))
			.filter((span) => span.to > start && span.from < end)
			.map((span) => ({ ...span, from: span.from - start, to: span.to - start }));
		if (!spans.some((span) => span.lang)) {
			new Notice(
				"La langue de cette sélection est indéterminée ou non prise en charge : rien n'a été corrigé. Voir « Diagnostic : langue de la note »."
			);
			return;
		}

		const selection = editor.getSelection();
		const corrected = applyTypography(selection, spans);
		if (corrected === selection) {
			new Notice("Rien à corriger dans cette sélection.");
			return;
		}

		// Un seul replaceSelection : la correction s'annule d'un seul Ctrl+Z.
		// La sélection est rétablie ensuite, la plupart des corrections étant
		// des espaces invisibles.
		const from = editor.getCursor("from");
		editor.replaceSelection(corrected);
		editor.setSelection(from, editor.getCursor());
		new Notice("Typographie corrigée.");
	}

	private diagnoseLanguage(editor: Editor) {
		const doc = editor.getValue();
		const note = resolveLanguage(doc, this.settings.defaultLanguage);
		const paragraph = resolveParagraph(doc, editor.posToOffset(editor.getCursor()), note);
		const lines = describeLanguage(note, this.settings.defaultLanguage, paragraph);
		// Une information par ligne : la classe rend les retours à la ligne.
		new Notice(lines.join("\n"), 10000).noticeEl.addClass("special-char-diagnostic");
	}

	private openPicker() {
		const editor = this.app.workspace.activeEditor?.editor;
		if (!editor) {
			new Notice("Ouvrez d'abord une note pour insérer un caractère spécial.");
			return;
		}
		new SpecialCharacterModal(this, editor).open();
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
		// data.json peut avoir été édité à la main ou abîmé par une synchro.
		if (!Array.isArray(this.settings.recentChars)) {
			this.settings.recentChars = [];
		}
		if (!Array.isArray(this.settings.customChars)) {
			this.settings.customChars = [];
		}
		if (!LANGUAGE_SETTINGS.includes(this.settings.defaultLanguage)) {
			this.settings.defaultLanguage = DEFAULT_SETTINGS.defaultLanguage;
		}
	}

	// Entrées venant de data.json : celles qui sont inutilisables (caractère
	// vide ou champ d'un autre type) sont écartées plutôt que d'aboutir à un
	// bouton vide dans la palette. Sans libellé, le point de code fait l'appoint.
	getCustomChars(): SpecialChar[] {
		return this.settings.customChars
			.filter((item) => item && typeof item.id === "string" && typeof item.char === "string" && item.char !== "")
			.map((item) => ({
				id: item.id,
				char: item.char,
				label: typeof item.label === "string" && item.label !== "" ? item.label : codePointLabel(item.char),
			}));
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	insertChar(editor: Editor, item: SpecialChar) {
		insertSpecialChar(editor, item.char);
		this.recordRecent(item.id);
	}

	// Les identifiants inconnus sont ignorés : la liste enregistrée peut citer
	// un caractère personnalisé supprimé depuis.
	getRecentChars(): SpecialChar[] {
		const known = [...this.getCustomChars(), ...ALL_CHARS];
		return this.settings.recentChars
			.map((id) => known.find((item) => item.id === id))
			.filter((item): item is SpecialChar => item !== undefined);
	}

	private recordRecent(id: string) {
		// Insérer plusieurs fois de suite le même caractère n'écrit rien.
		if (this.settings.recentChars[0] === id) {
			return;
		}
		this.settings.recentChars = [id, ...this.settings.recentChars.filter((x) => x !== id)].slice(0, RECENT_COUNT);
		void this.saveSettings();
	}

	// Applique les réglages d'affichage à toutes les fenêtres d'édition, sans
	// recharger le plugin.
	applyEditorDecorations() {
		this.editorExtensions.length = 0;
		if (this.settings.showInvisibleSpaces) {
			this.editorExtensions.push(invisibleSpacesViewPlugin);
		}
		if (this.settings.flagWrongSpaces) {
			this.editorExtensions.push(createWrongSpacesViewPlugin(() => this.settings.defaultLanguage));
		}
		this.app.workspace.updateOptions();
	}
}
