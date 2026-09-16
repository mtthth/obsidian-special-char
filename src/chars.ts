import { Editor, Hotkey } from "obsidian";

export interface SpecialChar {
	id: string;
	char: string;
	label: string;
	/** Rendu affiché dans la fenêtre quand le caractère est invisible à l'écran. */
	preview?: string;
	hotkey?: Hotkey;
}

export interface CharGroup {
	category: string;
	chars: SpecialChar[];
}

// Raccourcis par défaut : toujours Mod+Maj, jamais Mod+Alt. Sous Windows,
// Ctrl+Alt est équivalent à AltGr, dont un clavier AZERTY a besoin pour saisir
// @ ~ # { } [ ] | ` \ et €.
export const hotkey = (key: string): Hotkey => ({ modifiers: ["Mod", "Shift"], key });

// Ces deux constantes contiennent de véritables caractères d'espace, invisibles
// dans un éditeur de code : les nommer évite d'avoir à les distinguer à l'œil,
// notamment dans les règles de typographie.
export const NNBSP = " "; // espace fine insécable
export const NBSP = " "; // espace insécable

export const CHAR_GROUPS: CharGroup[] = [
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

export const ALL_CHARS: SpecialChar[] = CHAR_GROUPS.flatMap((group) => group.chars);

// Accents combinés produits par la décomposition NFD : les retirer rend la
// recherche insensible aux accents (« fleche » trouve « Flèche »).
const COMBINING_ACCENTS = new RegExp("[\\u0300-\\u036F]", "g");

export function normalizeForSearch(text: string): string {
	return text.normalize("NFD").replace(COMBINING_ACCENTS, "").toLowerCase();
}

export function matchesQuery(item: SpecialChar, category: string, query: string): boolean {
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

export function codePointLabel(char: string): string {
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

export function insertSpecialChar(editor: Editor, char: string) {
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
