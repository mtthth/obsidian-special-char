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

// Ces deux constantes contiennent de véritables caractères d'espace, invisibles
// dans un éditeur de code : les nommer évite d'avoir à les distinguer à l'œil,
// notamment dans les règles de typographie plus bas.
const NNBSP = " "; // espace fine insécable
const NBSP = " "; // espace insécable

const CHAR_GROUPS: CharGroup[] = [
	{
		category: "Espaces",
		chars: [
			{ id: "narrow-nbsp", char: NNBSP, label: "Espace fine insécable", preview: `A${NNBSP}B`, hotkey: hotkey("1") },
			{ id: "nbsp", char: NBSP, label: "Espace insécable", preview: `A${NBSP}B`, hotkey: hotkey("2") },
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

// Délimiteurs appariés : insérer l'un de ces caractères alors que du texte est
// sélectionné l'entoure au lieu de l'écraser. L'ouvrant et le fermant donnent
// la même paire — inutile de se rappeler lequel des deux insérer — et les
// guillemets français emportent leurs espaces fines insécables.
const WRAPPING_PAIRS: Record<string, [string, string]> = {
	"«": [`«${NNBSP}`, `${NNBSP}»`],
	"»": [`«${NNBSP}`, `${NNBSP}»`],
	"“": ["“", "”"],
	"”": ["“", "”"],
	"‘": ["‘", "’"],
	"’": ["‘", "’"],
};

// Entoure la sélection et la laisse sélectionnée, entre les délimiteurs.
function wrapSelection(editor: Editor, open: string, close: string) {
	const from = editor.getCursor("from");
	const to = editor.getCursor("to");
	const selection = editor.getSelection();

	editor.replaceSelection(open + selection + close);

	// Seule la première ligne de la sélection est décalée par l'insertion de
	// `open` : sur une sélection multiligne, la position de fin ne bouge pas.
	editor.setSelection(
		{ line: from.line, ch: from.ch + open.length },
		to.line === from.line ? { line: to.line, ch: to.ch + open.length } : to
	);
}

function insertSpecialChar(editor: Editor, char: string) {
	const pair = WRAPPING_PAIRS[char];

	if (editor.somethingSelected()) {
		if (pair) {
			wrapSelection(editor, pair[0], pair[1]);
		} else {
			editor.replaceSelection(char);
		}
	} else {
		const cursor = editor.getCursor();
		editor.replaceRange(char, cursor);
		editor.setCursor({ line: cursor.line, ch: cursor.ch + char.length });
	}

	editor.focus();
}

// Portions que la correction typographique ne doit jamais toucher : code,
// maths, liens, URL. Le premier motif ne s'applique qu'en début de sélection
// (pas de drapeau `m`) : c'est le bloc de métadonnées, qu'une espace insécable
// avant « : » casserait.
const PROTECTED_RE = new RegExp(
	[
		"^---\\r?\\n[\\s\\S]*?\\r?\\n---",
		"```[\\s\\S]*?```",
		"`[^`\\n]*`",
		"\\$\\$[\\s\\S]*?\\$\\$",
		"\\$[^\\s$][^$\\n]*\\$",
		"!?\\[\\[[^\\]\\n]*\\]\\]",
		"!?\\[[^\\]\\n]*\\]\\([^)\\n]*\\)",
		"<[^>\\n]+>",
		"[a-z][a-z0-9+.-]*:\\/\\/\\S+",
		"www\\.\\S+",
	].join("|"),
	"g"
);

// Règles de typographie française, appliquées dans cet ordre. Toutes n'avalent
// que des espaces horizontales ([^\S\r\n], qui couvre aussi les insécables
// existantes) : une règle ne peut donc jamais fusionner deux lignes, et
// réappliquer la commande sur un texte déjà correct ne change rien.
const TYPO_RULES: { pattern: RegExp; replacement: string }[] = [
	// Guillemets droits appariés sur une même ligne → guillemets français.
	{ pattern: /"([^"\n]*)"/g, replacement: `«${NNBSP}$1${NNBSP}»` },
	// Apostrophe droite → apostrophe typographique.
	{ pattern: /'/g, replacement: "’" },
	// Trois points → véritables points de suspension.
	{ pattern: /\.\.\./g, replacement: "…" },
	// Espace parasite avant une virgule.
	{ pattern: /[^\S\r\n]+,/g, replacement: "," },
	// Espace fine insécable avant ; ! ? — les suites comme « ?! » n'en
	// reçoivent qu'une seule, et un signe en début de ligne est laissé tel quel.
	{ pattern: /(\S)[^\S\r\n]*([;!?]+)/g, replacement: `$1${NNBSP}$2` },
	// ... et avant le % d'un pourcentage.
	{ pattern: /(\d)[^\S\r\n]*%/g, replacement: `$1${NNBSP}%` },
	// Espace insécable avant un deux-points, uniquement s'il termine un mot et
	// est suivi d'une espace, d'une fin de ligne ou d'un marqueur d'emphase :
	// 12:30, key::value, C:\dossier et les URL restent intacts.
	{ pattern: /([^\s:])[^\S\r\n]*:(?=[^\S\r\n]|[*_]|$)/gm, replacement: `$1${NBSP}:` },
	// Espaces fines à l'intérieur des guillemets français.
	{ pattern: /«[^\S\r\n]*(\S)/g, replacement: `«${NNBSP}$1` },
	{ pattern: /(\S)[^\S\r\n]*»/g, replacement: `$1${NNBSP}»` },
];

function fixPunctuation(chunk: string): string {
	let fixed = chunk;
	for (const { pattern, replacement } of TYPO_RULES) {
		fixed = fixed.replace(pattern, replacement);
	}
	return fixed;
}

function protectedRanges(text: string): [number, number][] {
	const ranges: [number, number][] = [];

	PROTECTED_RE.lastIndex = 0;
	let match: RegExpExecArray | null;
	while ((match = PROTECTED_RE.exec(text)) !== null) {
		ranges.push([match.index, match.index + match[0].length]);
	}

	return ranges;
}

function applyTypography(text: string): string {
	let result = "";
	let lastIndex = 0;

	for (const [start, end] of protectedRanges(text)) {
		result += fixPunctuation(text.slice(lastIndex, start)) + text.slice(start, end);
		lastIndex = end;
	}

	return result + fixPunctuation(text.slice(lastIndex));
}

// Espaces sécables là où le français impose une insécable. On ne signale que
// l'espace ordinaire (ou la tabulation) : c'est elle qui autorise un retour à
// la ligne avant la ponctuation, ce qui est le défaut réel. Une insécable déjà
// présente, fine ou non, n'est jamais signalée.
const WRONG_SPACE_PATTERNS: RegExp[] = [
	// Avant ; ! ? — un « ! » suivi de « [ » ouvre une image ou une intégration.
	/[ \t]+(?=[;?]|!(?!\[))/g,
	// Avant le % d'un pourcentage.
	/(?<=\d)[ \t]+(?=%)/g,
	// Avant un deux-points qui termine un mot : 12:30 ou key::value, sans
	// espace avant, ne sont pas concernés.
	/[ \t]+(?=:(?:[ \t]|$))/gm,
	// À l'intérieur des guillemets français.
	/(?<=«)[ \t]+/g,
	/[ \t]+(?=»)/g,
];

function findWrongSpaces(text: string): [number, number][] {
	const protectedSpans = protectedRanges(text);
	const found: [number, number][] = [];

	for (const pattern of WRONG_SPACE_PATTERNS) {
		pattern.lastIndex = 0;
		let match: RegExpExecArray | null;
		while ((match = pattern.exec(text)) !== null) {
			const start = match.index;
			const end = start + match[0].length;
			if (!protectedSpans.some(([s, e]) => start < e && end > s)) {
				found.push([start, end]);
			}
		}
	}

	// Une même espace peut satisfaire deux motifs (« ; ) : on ne la garde
	// qu'une fois, et triée, comme l'exige la construction des décorations.
	found.sort((a, b) => a[0] - b[0]);
	return found.filter(([start], index) => index === 0 || start !== found[index - 1][0]);
}

interface CustomChar {
	id: string;
	char: string;
	label: string;
}

interface SpecialCharPluginSettings {
	showInvisibleSpaces: boolean;
	flagWrongSpaces: boolean;
	recentChars: string[];
	customChars: CustomChar[];
}

const DEFAULT_SETTINGS: SpecialCharPluginSettings = {
	showInvisibleSpaces: true,
	flagWrongSpaces: true,
	recentChars: [],
	customChars: [],
};

// Nombre de caractères récents retenus : de quoi remplir une ligne de la
// palette sur ordinateur, deux sur mobile.
const RECENT_COUNT = 6;

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
function visibleLineRanges(view: EditorView): { from: number; to: number }[] {
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

function collectWrongSpaces(view: EditorView, push: PushRange) {
	for (const { from, to } of visibleLineRanges(view)) {
		for (const [start, end] of findWrongSpaces(view.state.doc.sliceString(from, to))) {
			push(from + start, from + end, "special-char-wrong-space");
		}
	}
}

// Décore la fenêtre d'édition (Live Preview et Source) sans toucher au texte
// lui-même : purement visuel, via des mark decorations CodeMirror 6.
function decorationPlugin(collect: (view: EditorView, push: PushRange) => void) {
	const build = (view: EditorView): DecorationSet => {
		const builder = new RangeSetBuilder<Decoration>();
		collect(view, (from, to, cls) => builder.add(from, to, Decoration.mark({ class: cls })));
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

const invisibleSpacesViewPlugin = decorationPlugin(collectInvisibleSpaces);
const wrongSpacesViewPlugin = decorationPlugin(collectWrongSpaces);

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

		const selection = editor.getSelection();
		const corrected = applyTypography(selection);
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
			this.editorExtensions.push(wrongSpacesViewPlugin);
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
					this.plugin.applyEditorDecorations();
				})
			);

		new Setting(containerEl)
			.setName("Signaler les espaces fautives")
			.setDesc(
				"Souligne en rouge une espace ordinaire là où le français impose une insécable (avant ; ! ? % :, et à l'intérieur des guillemets français). La commande « Corriger la typographie de la sélection » les remplace."
			)
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.flagWrongSpaces).onChange(async (value) => {
					this.plugin.settings.flagWrongSpaces = value;
					await this.plugin.saveSettings();
					this.plugin.applyEditorDecorations();
				})
			);

		this.displayCustomChars(containerEl);
	}

	private displayCustomChars(containerEl: HTMLElement) {
		new Setting(containerEl)
			.setName("Caractères personnalisés")
			.setDesc(
				"Vos propres caractères, affichés en tête de la fenêtre de sélection et trouvés par la recherche. Le nom est facultatif : sans lui, le point de code est utilisé."
			)
			.addButton((button) =>
				button
					.setButtonText("Ajouter")
					.setCta()
					.onClick(async () => {
						this.plugin.settings.customChars.push({
							id: `custom-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
							char: "",
							label: "",
						});
						await this.plugin.saveSettings();
						this.display();
					})
			);

		this.plugin.settings.customChars.forEach((item, index) => {
			new Setting(containerEl)
				.setClass("special-char-custom-row")
				.addText((text) =>
					text
						.setPlaceholder("≠")
						.setValue(item.char)
						.onChange(async (value) => {
							item.char = value;
							await this.plugin.saveSettings();
						})
				)
				.addText((text) =>
					text
						.setPlaceholder("Nom (facultatif)")
						.setValue(item.label)
						.onChange(async (value) => {
							item.label = value;
							await this.plugin.saveSettings();
						})
				)
				.addExtraButton((button) =>
					button
						.setIcon("trash")
						.setTooltip("Supprimer")
						.onClick(async () => {
							this.plugin.settings.customChars.splice(index, 1);
							await this.plugin.saveSettings();
							this.display();
						})
				);
		});
	}
}

class SpecialCharacterModal extends Modal {
	private plugin: SpecialCharactersPlugin;
	private editor: Editor;
	private searchEl: HTMLInputElement;
	private resultsEl: HTMLElement;
	private visibleChars: SpecialChar[] = [];

	constructor(plugin: SpecialCharactersPlugin, editor: Editor) {
		super(plugin.app);
		this.plugin = plugin;
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

	// Les caractères personnalisés passent devant la liste intégrée : c'est une
	// courte liste choisie par l'utilisateur, la reléguer sous 43 entrées la
	// rendrait inutile. Les récents, eux, ne s'affichent qu'en l'absence de
	// recherche : pendant un filtrage, ils feraient apparaître deux fois les
	// mêmes caractères.
	private groupsToRender(hasQuery: boolean): CharGroup[] {
		const custom = this.plugin.getCustomChars();
		const groups =
			custom.length > 0 ? [{ category: "Personnalisés", chars: custom }, ...CHAR_GROUPS] : CHAR_GROUPS;

		if (hasQuery) {
			return groups;
		}

		const recents = this.plugin.getRecentChars();
		return recents.length > 0 ? [{ category: "Récents", chars: recents }, ...groups] : groups;
	}

	private renderResults(query: string) {
		const normalizedQuery = normalizeForSearch(query.trim());

		this.resultsEl.empty();
		this.visibleChars = [];

		for (const group of this.groupsToRender(normalizedQuery.length > 0)) {
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

		button.addEventListener("click", () => this.chooseChar(item));
	}

	private handleSearchKeydown(evt: KeyboardEvent) {
		if (evt.key === "Enter") {
			evt.preventDefault();
			const first = this.visibleChars[0];
			if (first) {
				this.chooseChar(first);
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

	private chooseChar(item: SpecialChar) {
		this.plugin.insertChar(this.editor, item);
		this.close();
		this.editor.focus();
	}
}
