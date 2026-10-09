import { Editor, MarkdownView, Notice, Plugin, debounce, getLanguage } from "obsidian";
import { Extension } from "@codemirror/state";
import { ALL_CHARS, SpecialChar, charLabel, codePointLabel, insertSpecialChar } from "./src/chars";
import { invisibleSpacesViewPlugin } from "./src/editor-decorations";
import { DEFAULT_LANGUAGE, Language, languageFromLocale, setLanguage, t } from "./src/i18n";
import { SpecialCharacterModal } from "./src/picker-modal";
import { CustomChar, RECENT_COUNT, SpecialCharPluginSettings, normalizeSettings } from "./src/settings";
import { SpecialCharSettingTab } from "./src/settings-tab";

// Langue de l'interface d'Obsidian. getLanguage() n'existe que depuis
// Obsidian 1.8.7 ; avant, Obsidian la rangeait dans le localStorage, où elle est
// absente pour l'anglais.
function appLanguage(): Language {
	if (typeof getLanguage === "function") {
		return languageFromLocale(getLanguage());
	}
	try {
		return languageFromLocale(window.localStorage.getItem("language"));
	} catch {
		return DEFAULT_LANGUAGE;
	}
}

export default class SpecialCharactersPlugin extends Plugin {
	// Lus dans onload(), avant tout usage.
	settings!: SpecialCharPluginSettings;
	// Obsidian conserve une référence sur ce tableau et le relit pour chaque
	// éditeur, existant comme futur : le modifier puis appeler updateOptions()
	// est la façon documentée de reconfigurer une extension CodeMirror 6.
	private editorExtensions: Extension[] = [];
	private ribbonEl: HTMLElement | null = null;
	private commandIds: string[] = [];
	// Enregistrement différé des champs de saisie des réglages : chaque frappe
	// réécrirait sinon data.json, et un vault synchronisé enverrait chaque
	// version, au risque de copies en conflit.
	private pendingSave = debounce(() => void this.saveSettings(), 500, true);

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

	onunload() {
		this.flushSave();
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
			callback: () => this.openPicker(),
		});
		this.commandIds.push("open-special-characters-picker");

		// One command per character: each can get its own hotkey in Settings →
		// Hotkeys. None has a default: Obsidian's plugin guidelines advise against
		// them, as they clash with the user's own and with other plugins.
		for (const item of ALL_CHARS) {
			const id = `insert-${item.id}`;
			this.addCommand({
				id,
				name: t("command.insert", { label: charLabel(item) }),
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
		// En mode Lecture, l'éditeur de la note existe toujours, mais caché : y
		// insérer modifierait le fichier sans que rien ne s'affiche.
		if (this.app.workspace.getActiveViewOfType(MarkdownView)?.getMode() === "preview") {
			new Notice(t("notice.readingMode"));
			return;
		}
		new SpecialCharacterModal(this, editor).open();
	}

	async loadSettings() {
		this.settings = normalizeSettings(await this.loadData(), appLanguage());
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

	requestSave() {
		this.pendingSave();
	}

	// Écrit tout de suite un enregistrement différé encore en attente.
	flushSave() {
		this.pendingSave.run();
	}

	updateCustomChar(item: CustomChar, changes: Partial<Pick<CustomChar, "char" | "label">>) {
		Object.assign(item, changes);
		this.requestSave();
	}

	// L'élément est retrouvé au moment du clic, et non par sa position à
	// l'affichage : un double-clic sur la corbeille, avant que la liste ne soit
	// redessinée, supprimerait sinon aussi son voisin. Il quitte les récents,
	// où il occuperait une place sans s'afficher.
	async removeCustomChar(item: CustomChar) {
		const index = this.settings.customChars.indexOf(item);
		if (index === -1) {
			return;
		}
		this.settings.customChars.splice(index, 1);
		this.settings.recentChars = this.settings.recentChars.filter((id) => id !== item.id);
		await this.saveSettings();
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
		// Les identifiants devenus inconnus (caractère personnalisé supprimé ou
		// vidé) sont écartés avant de couper la liste : ils y prendraient une
		// place sans s'afficher.
		const known = new Set([...this.getCustomChars(), ...ALL_CHARS].map((item) => item.id));
		this.settings.recentChars = [id, ...this.settings.recentChars.filter((x) => x !== id && known.has(x))].slice(
			0,
			RECENT_COUNT
		);
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
