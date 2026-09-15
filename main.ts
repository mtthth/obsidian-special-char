import { App, Editor, Hotkey, Modal, Notice, Platform, Plugin, PluginSettingTab, Setting } from "obsidian";
import { Extension, RangeSetBuilder } from "@codemirror/state";
import { Decoration, DecorationSet, EditorView, ViewPlugin, ViewUpdate } from "@codemirror/view";

interface SpecialChar {
	id: string;
	char: string;
	label: string;
	/** Rendu affiché dans la fenêtre quand le caractère est invisible à l'écran. */
	preview?: string;
	hotkey?: Hotkey;
}

interface CharGroup {
	category: string;
	chars: SpecialChar[];
}

// Raccourcis par défaut : toujours Mod+Maj, jamais Mod+Alt. Sous Windows,
// Ctrl+Alt est équivalent à AltGr, dont un clavier AZERTY a besoin pour saisir
// @ ~ # { } [ ] | ` \ et €.
const hotkey = (key: string): Hotkey => ({ modifiers: ["Mod", "Shift"], key });

// Note : les champs `char`/`preview` des deux espaces contiennent de véritables
// caractères espace insécable / fine insécable (U+00A0, U+202F), donc invisibles
// à l'œil nu dans un éditeur de code — ne pas les remplacer par une espace
// normale lors d'une future modification de ce fichier.
const CHAR_GROUPS: CharGroup[] = [
	{
		category: "Espaces",
		chars: [
			{ id: "narrow-nbsp", char: " ", label: "Espace fine insécable", preview: "A B", hotkey: hotkey("1") },
			{ id: "nbsp", char: " ", label: "Espace insécable", preview: "A B", hotkey: hotkey("2") },
		],
	},
	{
		category: "Guillemets et apostrophes",
		chars: [
			{ id: "guillemet-ouvrant", char: "«", label: "Guillemet français ouvrant", hotkey: hotkey("3") },
			{ id: "guillemet-fermant", char: "»", label: "Guillemet français fermant", hotkey: hotkey("4") },
			{ id: "guillemet-anglais-ouvrant", char: "“", label: "Guillemet anglais ouvrant" },
			{ id: "guillemet-anglais-fermant", char: "”", label: "Guillemet anglais fermant" },
			{ id: "apostrophe-ouvrante", char: "‘", label: "Apostrophe simple ouvrante" },
			{ id: "apostrophe-typographique", char: "’", label: "Apostrophe typographique" },
		],
	},
	{
		category: "Tirets et ponctuation",
		chars: [
			{ id: "tiret-cadratin", char: "—", label: "Tiret cadratin" },
			{ id: "tiret-demi-cadratin", char: "–", label: "Tiret demi-cadratin" },
			{ id: "point-median", char: "·", label: "Point médian" },
			{ id: "points-suspension", char: "…", label: "Points de suspension" },
		],
	},
	{
		category: "Ligatures",
		chars: [
			{ id: "oe-minuscule", char: "œ", label: "Ligature œ minuscule" },
			{ id: "oe-majuscule", char: "Œ", label: "Ligature Œ majuscule" },
			{ id: "ae-minuscule", char: "æ", label: "Ligature æ minuscule" },
			{ id: "ae-majuscule", char: "Æ", label: "Ligature Æ majuscule" },
		],
	},
	{
		category: "Capitales accentuées",
		chars: [
			{ id: "a-grave-maj", char: "À", label: "A majuscule accent grave" },
			{ id: "a-circonflexe-maj", char: "Â", label: "A majuscule accent circonflexe" },
			{ id: "c-cedille-maj", char: "Ç", label: "C majuscule cédille" },
			{ id: "e-aigu-maj", char: "É", label: "E majuscule accent aigu" },
			{ id: "e-grave-maj", char: "È", label: "E majuscule accent grave" },
			{ id: "e-circonflexe-maj", char: "Ê", label: "E majuscule accent circonflexe" },
			{ id: "e-trema-maj", char: "Ë", label: "E majuscule tréma" },
			{ id: "i-circonflexe-maj", char: "Î", label: "I majuscule accent circonflexe" },
			{ id: "i-trema-maj", char: "Ï", label: "I majuscule tréma" },
			{ id: "o-circonflexe-maj", char: "Ô", label: "O majuscule accent circonflexe" },
			{ id: "u-grave-maj", char: "Ù", label: "U majuscule accent grave" },
			{ id: "u-circonflexe-maj", char: "Û", label: "U majuscule accent circonflexe" },
			{ id: "u-trema-maj", char: "Ü", label: "U majuscule tréma" },
			{ id: "y-trema-maj", char: "Ÿ", label: "Y majuscule tréma" },
		],
	},
	{
		category: "Mathématiques",
		chars: [
			{ id: "multiplication", char: "×", label: "Signe de multiplication" },
			{ id: "division", char: "÷", label: "Signe de division" },
			{ id: "environ-egal", char: "≈", label: "Signe approximativement égal" },
			{ id: "plus-ou-moins", char: "±", label: "Signe plus ou moins" },
		],
	},
	{
		category: "Symboles et monnaies",
		chars: [
			{ id: "micro", char: "µ", label: "Symbole micro" },
			{ id: "puce", char: "•", label: "Puce" },
			{ id: "puce-creuse", char: "◦", label: "Puce creuse" },
			{ id: "yen", char: "¥", label: "Yen / Yuan" },
			{ id: "livre", char: "£", label: "Livre sterling" },
		],
	},
	{
		category: "Flèches",
		chars: [
			{ id: "fleche-gauche", char: "←", label: "Flèche vers la gauche" },
			{ id: "fleche-droite", char: "→", label: "Flèche vers la droite" },
			{ id: "fleche-haut", char: "↑", label: "Flèche vers le haut" },
			{ id: "fleche-bas", char: "↓", label: "Flèche vers le bas" },
		],
	},
];

const ALL_CHARS: SpecialChar[] = CHAR_GROUPS.flatMap((group) => group.chars);

// Accents combinés produits par la décomposition NFD : les retirer rend la
// recherche insensible aux accents (« fleche » trouve « Flèche »).
const COMBINING_ACCENTS = new RegExp("[\\u0300-\\u036F]", "g");

function normalizeForSearch(text: string): string {
	return text.normalize("NFD").replace(COMBINING_ACCENTS, "").toLowerCase();
}

function matchesQuery(item: SpecialChar, category: string, query: string): boolean {
	if (!query) {
		return true;
	}
	return (
		normalizeForSearch(item.label).includes(query) ||
		normalizeForSearch(category).includes(query) ||
		normalizeForSearch(item.char).includes(query) ||
		codePointLabel(item.char).toLowerCase().includes(query)
	);
}

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
			hotkeys: [hotkey("S")],
			callback: () => this.openPicker(),
		});

		this.addRibbonIcon("text-cursor-input", "Insérer un caractère spécial", () => {
			this.openPicker();
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
					insertSpecialChar(editor, item.char);
				},
			});
		}
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
	private searchEl: HTMLInputElement;
	private resultsEl: HTMLElement;
	private visibleChars: SpecialChar[] = [];

	constructor(app: App, editor: Editor) {
		super(app);
		this.editor = editor;
	}

	onOpen() {
		const { contentEl } = this;
		this.modalEl.addClass("special-char-modal");

		contentEl.createEl("h2", { text: "Caractères spéciaux" });

		this.searchEl = contentEl.createEl("input", {
			cls: "special-char-search",
			attr: {
				type: "text",
				placeholder: "Rechercher (cadratin, majuscule, flèche…)",
			},
		});

		this.resultsEl = contentEl.createDiv({ cls: "special-char-results" });
		this.renderResults("");

		this.searchEl.addEventListener("input", () => this.renderResults(this.searchEl.value));
		this.searchEl.addEventListener("keydown", (evt) => this.handleSearchKeydown(evt));
		this.resultsEl.addEventListener("keydown", (evt) => this.handleResultsKeydown(evt));

		// Sur mobile, donner le focus au champ ouvrirait le clavier virtuel
		// par-dessus la palette, alors que l'usage y est tactile.
		if (!Platform.isMobile) {
			this.searchEl.focus();
		}
	}

	onClose() {
		this.contentEl.empty();
	}

	private renderResults(query: string) {
		const normalizedQuery = normalizeForSearch(query.trim());

		this.resultsEl.empty();
		this.visibleChars = [];

		for (const group of CHAR_GROUPS) {
			const matches = group.chars.filter((item) => matchesQuery(item, group.category, normalizedQuery));
			if (matches.length === 0) {
				continue;
			}

			const section = this.resultsEl.createDiv({ cls: "special-char-section" });
			section.createDiv({ cls: "special-char-section-title", text: group.category });
			const list = section.createDiv({ cls: "special-char-list" });

			for (const item of matches) {
				this.visibleChars.push(item);
				this.createCharButton(list, item);
			}
		}

		if (this.visibleChars.length === 0) {
			this.resultsEl.createDiv({
				cls: "special-char-empty",
				text: "Aucun caractère ne correspond à cette recherche.",
			});
		}
	}

	private createCharButton(parent: HTMLElement, item: SpecialChar) {
		const code = codePointLabel(item.char);
		const button = parent.createEl("button", {
			cls: "special-char-button",
			attr: {
				"aria-label": `${item.label} (${code})`,
				title: `${item.label} — ${code}`,
			},
		});

		button.createDiv({ cls: "special-char-preview", text: item.preview ?? item.char });
		button.createDiv({ cls: "special-char-label", text: item.label });

		button.addEventListener("click", () => this.insertChar(item.char));
	}

	private handleSearchKeydown(evt: KeyboardEvent) {
		if (evt.key === "Enter") {
			evt.preventDefault();
			const first = this.visibleChars[0];
			if (first) {
				this.insertChar(first.char);
			}
		} else if (evt.key === "ArrowDown") {
			evt.preventDefault();
			this.focusButton(0);
		}
	}

	private handleResultsKeydown(evt: KeyboardEvent) {
		const forward = evt.key === "ArrowRight" || evt.key === "ArrowDown";
		const backward = evt.key === "ArrowLeft" || evt.key === "ArrowUp";
		if (!forward && !backward) {
			return;
		}

		const buttons = this.getButtons();
		const current = buttons.indexOf(this.resultsEl.ownerDocument.activeElement as HTMLButtonElement);
		if (current === -1) {
			return;
		}

		evt.preventDefault();
		if (backward && current === 0) {
			this.searchEl.focus();
		} else {
			this.focusButton(current + (forward ? 1 : -1));
		}
	}

	private getButtons(): HTMLButtonElement[] {
		return Array.from(this.resultsEl.querySelectorAll<HTMLButtonElement>("button"));
	}

	private focusButton(index: number) {
		const buttons = this.getButtons();
		if (buttons.length === 0) {
			return;
		}
		buttons[Math.max(0, Math.min(index, buttons.length - 1))].focus();
	}

	private insertChar(char: string) {
		insertSpecialChar(this.editor, char);
		this.close();
		this.editor.focus();
	}
}
