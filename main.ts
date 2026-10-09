import { Editor, Notice, Plugin } from "obsidian";
import { Extension } from "@codemirror/state";
import { ALL_CHARS, SpecialChar, charLabel, codePointLabel, hotkey, insertSpecialChar } from "./src/chars";
import { invisibleSpacesViewPlugin } from "./src/editor-decorations";
import { setLanguage, t } from "./src/i18n";
import { SpecialCharacterModal } from "./src/picker-modal";
import { RECENT_COUNT, SpecialCharPluginSettings, normalizeSettings } from "./src/settings";
import { SpecialCharSettingTab } from "./src/settings-tab";

export default class SpecialCharactersPlugin extends Plugin {
	settings: SpecialCharPluginSettings;
	// Obsidian conserve une référence sur ce tableau et le relit pour chaque
	// éditeur, existant comme futur : le modifier puis appeler updateOptions()
	// est la façon documentée de reconfigurer une extension CodeMirror 6.
	private editorExtensions: Extension[] = [];
	private ribbonEl: HTMLElement | null = null;
	private commandIds: string[] = [];

	async onload() {
		await this.loadSettings();

		this.registerEditorExtension(this.editorExtensions);
		this.applyEditorDecorations();

		this.addSettingTab(new SpecialCharSettingTab(this.app, this));

		this.ribbonEl = this.addRibbonIcon("text-cursor-input", t("ribbon.picker"), () => {
			this.openPicker();
		});
		this.registerCommands();
	}

	// Command names are fixed at registration, so a language change removes and
	// registers them again. Ids stay the same, which keeps the hotkeys the user
	// assigned in Settings → Hotkeys.
	private registerCommands() {
		for (const id of this.commandIds) {
			this.removeCommand(id);
		}
		this.commandIds = [];

		this.addCommand({
			id: "open-special-characters-picker",
			name: t("command.picker"),
			hotkeys: [hotkey("S")],
			callback: () => this.openPicker(),
		});
		this.commandIds.push("open-special-characters-picker");

		// One command per character: each can get its own hotkey in Settings →
		// Hotkeys. Only the four most common ones have a default, to avoid the
		// conflicts that more than 300 imposed hotkeys would cause.
		for (const item of ALL_CHARS) {
			const id = `insert-${item.id}`;
			this.addCommand({
				id,
				name: t("command.insert", { label: charLabel(item) }),
				hotkeys: item.hotkey ? [item.hotkey] : [],
				editorCallback: (editor: Editor) => {
					this.insertChar(editor, item);
				},
			});
			this.commandIds.push(id);
		}
	}

	// Applies the language setting to everything already registered; the picker
	// and the settings tab read it each time they are displayed.
	applyLanguage() {
		setLanguage(this.settings.language);
		this.registerCommands();
		this.ribbonEl?.setAttribute("aria-label", t("ribbon.picker"));
	}

	private openPicker() {
		const editor = this.app.workspace.activeEditor?.editor;
		if (!editor) {
			new Notice(t("notice.noEditor"));
			return;
		}
		new SpecialCharacterModal(this, editor).open();
	}

	async loadSettings() {
		this.settings = normalizeSettings(await this.loadData());
		setLanguage(this.settings.language);
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
		this.app.workspace.updateOptions();
	}
}
