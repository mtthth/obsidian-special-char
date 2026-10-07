import { Editor, Hotkey } from "obsidian";
import { getLanguage } from "./i18n";

export interface SpecialChar {
	id: string;
	char: string;
	/** English name. Built-in characters also carry `labelFr`; custom ones have a single user-typed name. */
	label: string;
	labelFr?: string;
	/** Rendu affiché dans la fenêtre quand le caractère est invisible à l'écran. */
	preview?: string;
	hotkey?: Hotkey;
}

export interface CharGroup {
	category: string;
	categoryFr?: string;
	chars: SpecialChar[];
}

// Name shown for a character in the current language; falls back to `label`
// for custom characters and any entry without a translation.
export function charLabel(item: SpecialChar): string {
	return getLanguage() === "fr" && item.labelFr ? item.labelFr : item.label;
}

export function groupName(group: CharGroup): string {
	return getLanguage() === "fr" && group.categoryFr ? group.categoryFr : group.category;
}

// Raccourcis par défaut : toujours Mod+Maj, jamais Mod+Alt. Sous Windows,
// Ctrl+Alt est équivalent à AltGr, dont un clavier AZERTY a besoin pour saisir
// @ ~ # { } [ ] | ` \ et €.
export const hotkey = (key: string): Hotkey => ({ modifiers: ["Mod", "Shift"], key });

// Ces deux constantes contiennent de véritables caractères d'espace, invisibles
// dans un éditeur de code : les nommer évite d'avoir à les distinguer à l'œil,
// notamment dans les tests et les décorations de l'éditeur.
export const NNBSP = " "; // espace fine insécable
export const NBSP = " "; // espace insécable

export const CHAR_GROUPS: CharGroup[] = [
	{
		category: "Spaces",
		categoryFr: "Espaces",
		chars: [
			{ id: "narrow-nbsp", char: NNBSP, label: "Narrow no-break space", labelFr: "Espace fine insécable", preview: `A${NNBSP}B`, hotkey: hotkey("1") },
			{ id: "nbsp", char: NBSP, label: "No-break space", labelFr: "Espace insécable", preview: `A${NBSP}B`, hotkey: hotkey("2") },
			{ id: "espace-fine", char: "\u2009", label: "Thin space", labelFr: "Espace fine", preview: "A\u2009B" },
			{ id: "espace-ultrafine", char: "\u200A", label: "Hair space", labelFr: "Espace ultrafine", preview: "A\u200AB" },
			{ id: "espace-ponctuation", char: "\u2008", label: "Punctuation space", labelFr: "Espace de ponctuation", preview: "A\u2008B" },
			{ id: "espace-demi-cadratin", char: "\u2002", label: "En space", labelFr: "Espace demi-cadratin", preview: "A\u2002B" },
			{ id: "espace-cadratin", char: "\u2003", label: "Em space", labelFr: "Espace cadratin", preview: "A\u2003B" },
			{ id: "trait-union-insecable", char: "\u2011", label: "Non-breaking hyphen", labelFr: "Trait d'union insécable" },
		],
	},
	{
		category: "Quotes and apostrophes",
		categoryFr: "Guillemets et apostrophes",
		chars: [
			{ id: "guillemet-ouvrant", char: "«", label: "French opening quote", labelFr: "Guillemet français ouvrant", hotkey: hotkey("3") },
			{ id: "guillemet-fermant", char: "»", label: "French closing quote", labelFr: "Guillemet français fermant", hotkey: hotkey("4") },
			{ id: "guillemet-simple-ouvrant", char: "‹", label: "French single opening quote", labelFr: "Guillemet français simple ouvrant" },
			{ id: "guillemet-simple-fermant", char: "›", label: "French single closing quote", labelFr: "Guillemet français simple fermant" },
			{ id: "guillemet-anglais-ouvrant", char: "“", label: "English opening quote", labelFr: "Guillemet anglais ouvrant" },
			{ id: "guillemet-anglais-fermant", char: "”", label: "English closing quote", labelFr: "Guillemet anglais fermant" },
			{ id: "apostrophe-ouvrante", char: "‘", label: "Opening single quote", labelFr: "Apostrophe simple ouvrante" },
			{ id: "apostrophe-typographique", char: "’", label: "Typographic apostrophe", labelFr: "Apostrophe typographique" },
			{ id: "guillemet-bas-double", char: "„", label: "Low double quote (German, Polish)", labelFr: "Guillemet bas double (allemand, polonais, tchèque)" },
			{ id: "guillemet-bas-simple", char: "‚", label: "Low single quote (German, Czech)", labelFr: "Guillemet bas simple (allemand, tchèque)" },
		],
	},
	{
		category: "Dashes and punctuation",
		categoryFr: "Tirets et ponctuation",
		chars: [
			{ id: "tiret-cadratin", char: "—", label: "Em dash", labelFr: "Tiret cadratin" },
			{ id: "tiret-demi-cadratin", char: "–", label: "En dash", labelFr: "Tiret demi-cadratin" },
			{ id: "point-median", char: "·", label: "Middle dot", labelFr: "Point médian" },
			{ id: "points-suspension", char: "…", label: "Ellipsis", labelFr: "Points de suspension" },
			{ id: "point-interrogation-inverse", char: "¿", label: "Spanish inverted question mark", labelFr: "Point d'interrogation inversé (espagnol)" },
			{ id: "point-exclamation-inverse", char: "¡", label: "Spanish inverted exclamation", labelFr: "Point d'exclamation inversé (espagnol)" },
		],
	},
	{
		category: "Ligatures",
		categoryFr: "Ligatures",
		chars: [
			{ id: "oe-minuscule", char: "œ", label: "Lowercase œ ligature", labelFr: "Ligature œ minuscule" },
			{ id: "oe-majuscule", char: "Œ", label: "Uppercase Œ ligature", labelFr: "Ligature Œ majuscule" },
			{ id: "ae-minuscule", char: "æ", label: "Lowercase æ ligature", labelFr: "Ligature æ minuscule" },
			{ id: "ae-majuscule", char: "Æ", label: "Uppercase Æ ligature", labelFr: "Ligature Æ majuscule" },
			{ id: "ij-minuscule", char: "ĳ", label: "Lowercase ĳ ligature (Dutch)", labelFr: "Ligature ĳ minuscule (néerlandais)" },
			{ id: "ij-majuscule", char: "Ĳ", label: "Uppercase Ĳ ligature (Dutch)", labelFr: "Ligature Ĳ majuscule (néerlandais)" },
			{ id: "ligature-fi", char: "ﬁ", label: "Ligature fi", labelFr: "Ligature fi" },
			{ id: "ligature-fl", char: "ﬂ", label: "Ligature fl", labelFr: "Ligature fl" },
			{ id: "ligature-ff", char: "ﬀ", label: "Ligature ff", labelFr: "Ligature ff" },
		],
	},
	{
		category: "Acute accent",
		categoryFr: "Accent aigu",
		chars: [
			{ id: "a-aigu-min", char: "á", label: "Lowercase a with acute", labelFr: "A minuscule accent aigu" },
			{ id: "a-aigu-maj", char: "Á", label: "Uppercase A with acute", labelFr: "A majuscule accent aigu" },
			{ id: "e-aigu-min", char: "é", label: "Lowercase e with acute", labelFr: "E minuscule accent aigu" },
			{ id: "e-aigu-maj", char: "É", label: "Uppercase E with acute", labelFr: "E majuscule accent aigu" },
			{ id: "i-aigu-min", char: "í", label: "Lowercase i with acute", labelFr: "I minuscule accent aigu" },
			{ id: "i-aigu-maj", char: "Í", label: "Uppercase I with acute", labelFr: "I majuscule accent aigu" },
			{ id: "o-aigu-min", char: "ó", label: "Lowercase o with acute", labelFr: "O minuscule accent aigu" },
			{ id: "o-aigu-maj", char: "Ó", label: "Uppercase O with acute", labelFr: "O majuscule accent aigu" },
			{ id: "u-aigu-min", char: "ú", label: "Lowercase u with acute", labelFr: "U minuscule accent aigu" },
			{ id: "u-aigu-maj", char: "Ú", label: "Uppercase U with acute", labelFr: "U majuscule accent aigu" },
			{ id: "y-aigu-min", char: "ý", label: "Lowercase y with acute", labelFr: "Y minuscule accent aigu" },
			{ id: "y-aigu-maj", char: "Ý", label: "Uppercase Y with acute", labelFr: "Y majuscule accent aigu" },
			{ id: "c-aigu-min", char: "ć", label: "Lowercase c with acute", labelFr: "C minuscule accent aigu" },
			{ id: "c-aigu-maj", char: "Ć", label: "Uppercase C with acute", labelFr: "C majuscule accent aigu" },
			{ id: "l-aigu-min", char: "ĺ", label: "Lowercase l with acute", labelFr: "L minuscule accent aigu" },
			{ id: "l-aigu-maj", char: "Ĺ", label: "Uppercase L with acute", labelFr: "L majuscule accent aigu" },
			{ id: "n-aigu-min", char: "ń", label: "Lowercase n with acute", labelFr: "N minuscule accent aigu" },
			{ id: "n-aigu-maj", char: "Ń", label: "Uppercase N with acute", labelFr: "N majuscule accent aigu" },
			{ id: "r-aigu-min", char: "ŕ", label: "Lowercase r with acute", labelFr: "R minuscule accent aigu" },
			{ id: "r-aigu-maj", char: "Ŕ", label: "Uppercase R with acute", labelFr: "R majuscule accent aigu" },
			{ id: "s-aigu-min", char: "ś", label: "Lowercase s with acute", labelFr: "S minuscule accent aigu" },
			{ id: "s-aigu-maj", char: "Ś", label: "Uppercase S with acute", labelFr: "S majuscule accent aigu" },
			{ id: "z-aigu-min", char: "ź", label: "Lowercase z with acute", labelFr: "Z minuscule accent aigu" },
			{ id: "z-aigu-maj", char: "Ź", label: "Uppercase Z with acute", labelFr: "Z majuscule accent aigu" },
		],
	},
	{
		category: "Grave accent",
		categoryFr: "Accent grave",
		chars: [
			{ id: "a-grave-min", char: "à", label: "Lowercase a with grave", labelFr: "A minuscule accent grave" },
			{ id: "a-grave-maj", char: "À", label: "Uppercase A with grave", labelFr: "A majuscule accent grave" },
			{ id: "e-grave-min", char: "è", label: "Lowercase e with grave", labelFr: "E minuscule accent grave" },
			{ id: "e-grave-maj", char: "È", label: "Uppercase E with grave", labelFr: "E majuscule accent grave" },
			{ id: "i-grave-min", char: "ì", label: "Lowercase i with grave", labelFr: "I minuscule accent grave" },
			{ id: "i-grave-maj", char: "Ì", label: "Uppercase I with grave", labelFr: "I majuscule accent grave" },
			{ id: "o-grave-min", char: "ò", label: "Lowercase o with grave", labelFr: "O minuscule accent grave" },
			{ id: "o-grave-maj", char: "Ò", label: "Uppercase O with grave", labelFr: "O majuscule accent grave" },
			{ id: "u-grave-min", char: "ù", label: "Lowercase u with grave", labelFr: "U minuscule accent grave" },
			{ id: "u-grave-maj", char: "Ù", label: "Uppercase U with grave", labelFr: "U majuscule accent grave" },
		],
	},
	{
		category: "Circumflex accent",
		categoryFr: "Accent circonflexe",
		chars: [
			{ id: "a-circonflexe-min", char: "â", label: "Lowercase a with circumflex", labelFr: "A minuscule accent circonflexe" },
			{ id: "a-circonflexe-maj", char: "Â", label: "Uppercase A with circumflex", labelFr: "A majuscule accent circonflexe" },
			{ id: "e-circonflexe-min", char: "ê", label: "Lowercase e with circumflex", labelFr: "E minuscule accent circonflexe" },
			{ id: "e-circonflexe-maj", char: "Ê", label: "Uppercase E with circumflex", labelFr: "E majuscule accent circonflexe" },
			{ id: "i-circonflexe-min", char: "î", label: "Lowercase i with circumflex", labelFr: "I minuscule accent circonflexe" },
			{ id: "i-circonflexe-maj", char: "Î", label: "Uppercase I with circumflex", labelFr: "I majuscule accent circonflexe" },
			{ id: "o-circonflexe-min", char: "ô", label: "Lowercase o with circumflex", labelFr: "O minuscule accent circonflexe" },
			{ id: "o-circonflexe-maj", char: "Ô", label: "Uppercase O with circumflex", labelFr: "O majuscule accent circonflexe" },
			{ id: "u-circonflexe-min", char: "û", label: "Lowercase u with circumflex", labelFr: "U minuscule accent circonflexe" },
			{ id: "u-circonflexe-maj", char: "Û", label: "Uppercase U with circumflex", labelFr: "U majuscule accent circonflexe" },
			{ id: "w-circonflexe-min", char: "ŵ", label: "Lowercase w with circumflex", labelFr: "W minuscule accent circonflexe" },
			{ id: "w-circonflexe-maj", char: "Ŵ", label: "Uppercase W with circumflex", labelFr: "W majuscule accent circonflexe" },
			{ id: "y-circonflexe-min", char: "ŷ", label: "Lowercase y with circumflex", labelFr: "Y minuscule accent circonflexe" },
			{ id: "y-circonflexe-maj", char: "Ŷ", label: "Uppercase Y with circumflex", labelFr: "Y majuscule accent circonflexe" },
			{ id: "c-circonflexe-min", char: "ĉ", label: "Lowercase c with circumflex", labelFr: "C minuscule accent circonflexe" },
			{ id: "c-circonflexe-maj", char: "Ĉ", label: "Uppercase C with circumflex", labelFr: "C majuscule accent circonflexe" },
			{ id: "g-circonflexe-min", char: "ĝ", label: "Lowercase g with circumflex", labelFr: "G minuscule accent circonflexe" },
			{ id: "g-circonflexe-maj", char: "Ĝ", label: "Uppercase G with circumflex", labelFr: "G majuscule accent circonflexe" },
			{ id: "h-circonflexe-min", char: "ĥ", label: "Lowercase h with circumflex", labelFr: "H minuscule accent circonflexe" },
			{ id: "h-circonflexe-maj", char: "Ĥ", label: "Uppercase H with circumflex", labelFr: "H majuscule accent circonflexe" },
			{ id: "j-circonflexe-min", char: "ĵ", label: "Lowercase j with circumflex", labelFr: "J minuscule accent circonflexe" },
			{ id: "j-circonflexe-maj", char: "Ĵ", label: "Uppercase J with circumflex", labelFr: "J majuscule accent circonflexe" },
			{ id: "s-circonflexe-min", char: "ŝ", label: "Lowercase s with circumflex", labelFr: "S minuscule accent circonflexe" },
			{ id: "s-circonflexe-maj", char: "Ŝ", label: "Uppercase S with circumflex", labelFr: "S majuscule accent circonflexe" },
		],
	},
	{
		category: "Diaeresis",
		categoryFr: "Tréma",
		chars: [
			{ id: "a-trema-min", char: "ä", label: "Lowercase a with diaeresis", labelFr: "A minuscule tréma" },
			{ id: "a-trema-maj", char: "Ä", label: "Uppercase A with diaeresis", labelFr: "A majuscule tréma" },
			{ id: "e-trema-min", char: "ë", label: "Lowercase e with diaeresis", labelFr: "E minuscule tréma" },
			{ id: "e-trema-maj", char: "Ë", label: "Uppercase E with diaeresis", labelFr: "E majuscule tréma" },
			{ id: "i-trema-min", char: "ï", label: "Lowercase i with diaeresis", labelFr: "I minuscule tréma" },
			{ id: "i-trema-maj", char: "Ï", label: "Uppercase I with diaeresis", labelFr: "I majuscule tréma" },
			{ id: "o-trema-min", char: "ö", label: "Lowercase o with diaeresis", labelFr: "O minuscule tréma" },
			{ id: "o-trema-maj", char: "Ö", label: "Uppercase O with diaeresis", labelFr: "O majuscule tréma" },
			{ id: "u-trema-min", char: "ü", label: "Lowercase u with diaeresis", labelFr: "U minuscule tréma" },
			{ id: "u-trema-maj", char: "Ü", label: "Uppercase U with diaeresis", labelFr: "U majuscule tréma" },
			{ id: "y-trema-min", char: "ÿ", label: "Lowercase y with diaeresis", labelFr: "Y minuscule tréma" },
			{ id: "y-trema-maj", char: "Ÿ", label: "Uppercase Y with diaeresis", labelFr: "Y majuscule tréma" },
		],
	},
	{
		category: "Tilde",
		categoryFr: "Tilde",
		chars: [
			{ id: "a-tilde-min", char: "ã", label: "Lowercase a with tilde", labelFr: "A minuscule tilde" },
			{ id: "a-tilde-maj", char: "Ã", label: "Uppercase A with tilde", labelFr: "A majuscule tilde" },
			{ id: "n-tilde-min", char: "ñ", label: "Lowercase n with tilde", labelFr: "N minuscule tilde" },
			{ id: "n-tilde-maj", char: "Ñ", label: "Uppercase N with tilde", labelFr: "N majuscule tilde" },
			{ id: "o-tilde-min", char: "õ", label: "Lowercase o with tilde", labelFr: "O minuscule tilde" },
			{ id: "o-tilde-maj", char: "Õ", label: "Uppercase O with tilde", labelFr: "O majuscule tilde" },
		],
	},
	{
		category: "Cedilla and comma below",
		categoryFr: "Cédille et virgule souscrite",
		chars: [
			{ id: "c-cedille-min", char: "ç", label: "Lowercase c with cedilla", labelFr: "C minuscule cédille" },
			{ id: "c-cedille-maj", char: "Ç", label: "Uppercase C with cedilla", labelFr: "C majuscule cédille" },
			{ id: "s-cedille-min", char: "ş", label: "Lowercase s with cedilla", labelFr: "S minuscule cédille" },
			{ id: "s-cedille-maj", char: "Ş", label: "Uppercase S with cedilla", labelFr: "S majuscule cédille" },
			{ id: "t-cedille-min", char: "ţ", label: "Lowercase t with cedilla", labelFr: "T minuscule cédille" },
			{ id: "t-cedille-maj", char: "Ţ", label: "Uppercase T with cedilla", labelFr: "T majuscule cédille" },
			{ id: "g-cedille-min", char: "ģ", label: "Lowercase g with cedilla", labelFr: "G minuscule cédille" },
			{ id: "g-cedille-maj", char: "Ģ", label: "Uppercase G with cedilla", labelFr: "G majuscule cédille" },
			{ id: "k-cedille-min", char: "ķ", label: "Lowercase k with cedilla", labelFr: "K minuscule cédille" },
			{ id: "k-cedille-maj", char: "Ķ", label: "Uppercase K with cedilla", labelFr: "K majuscule cédille" },
			{ id: "l-cedille-min", char: "ļ", label: "Lowercase l with cedilla", labelFr: "L minuscule cédille" },
			{ id: "l-cedille-maj", char: "Ļ", label: "Uppercase L with cedilla", labelFr: "L majuscule cédille" },
			{ id: "n-cedille-min", char: "ņ", label: "Lowercase n with cedilla", labelFr: "N minuscule cédille" },
			{ id: "n-cedille-maj", char: "Ņ", label: "Uppercase N with cedilla", labelFr: "N majuscule cédille" },
			{ id: "r-cedille-min", char: "ŗ", label: "Lowercase r with cedilla", labelFr: "R minuscule cédille" },
			{ id: "r-cedille-maj", char: "Ŗ", label: "Uppercase R with cedilla", labelFr: "R majuscule cédille" },
			{ id: "s-virgule-min", char: "ș", label: "Lowercase s with comma below", labelFr: "S minuscule virgule souscrite" },
			{ id: "s-virgule-maj", char: "Ș", label: "Uppercase S with comma below", labelFr: "S majuscule virgule souscrite" },
			{ id: "t-virgule-min", char: "ț", label: "Lowercase t with comma below", labelFr: "T minuscule virgule souscrite" },
			{ id: "t-virgule-maj", char: "Ț", label: "Uppercase T with comma below", labelFr: "T majuscule virgule souscrite" },
		],
	},
	{
		category: "Caron (háček)",
		categoryFr: "Caron (háček)",
		chars: [
			{ id: "c-caron-min", char: "č", label: "Lowercase c with caron", labelFr: "C minuscule caron" },
			{ id: "c-caron-maj", char: "Č", label: "Uppercase C with caron", labelFr: "C majuscule caron" },
			{ id: "d-caron-min", char: "ď", label: "Lowercase d with caron", labelFr: "D minuscule caron" },
			{ id: "d-caron-maj", char: "Ď", label: "Uppercase D with caron", labelFr: "D majuscule caron" },
			{ id: "e-caron-min", char: "ě", label: "Lowercase e with caron", labelFr: "E minuscule caron" },
			{ id: "e-caron-maj", char: "Ě", label: "Uppercase E with caron", labelFr: "E majuscule caron" },
			{ id: "l-caron-min", char: "ľ", label: "Lowercase l with caron", labelFr: "L minuscule caron" },
			{ id: "l-caron-maj", char: "Ľ", label: "Uppercase L with caron", labelFr: "L majuscule caron" },
			{ id: "n-caron-min", char: "ň", label: "Lowercase n with caron", labelFr: "N minuscule caron" },
			{ id: "n-caron-maj", char: "Ň", label: "Uppercase N with caron", labelFr: "N majuscule caron" },
			{ id: "r-caron-min", char: "ř", label: "Lowercase r with caron", labelFr: "R minuscule caron" },
			{ id: "r-caron-maj", char: "Ř", label: "Uppercase R with caron", labelFr: "R majuscule caron" },
			{ id: "s-caron-min", char: "š", label: "Lowercase s with caron", labelFr: "S minuscule caron" },
			{ id: "s-caron-maj", char: "Š", label: "Uppercase S with caron", labelFr: "S majuscule caron" },
			{ id: "t-caron-min", char: "ť", label: "Lowercase t with caron", labelFr: "T minuscule caron" },
			{ id: "t-caron-maj", char: "Ť", label: "Uppercase T with caron", labelFr: "T majuscule caron" },
			{ id: "z-caron-min", char: "ž", label: "Lowercase z with caron", labelFr: "Z minuscule caron" },
			{ id: "z-caron-maj", char: "Ž", label: "Uppercase Z with caron", labelFr: "Z majuscule caron" },
		],
	},
	{
		category: "Ogonek",
		categoryFr: "Ogonek",
		chars: [
			{ id: "a-ogonek-min", char: "ą", label: "Lowercase a with ogonek", labelFr: "A minuscule ogonek" },
			{ id: "a-ogonek-maj", char: "Ą", label: "Uppercase A with ogonek", labelFr: "A majuscule ogonek" },
			{ id: "e-ogonek-min", char: "ę", label: "Lowercase e with ogonek", labelFr: "E minuscule ogonek" },
			{ id: "e-ogonek-maj", char: "Ę", label: "Uppercase E with ogonek", labelFr: "E majuscule ogonek" },
			{ id: "i-ogonek-min", char: "į", label: "Lowercase i with ogonek", labelFr: "I minuscule ogonek" },
			{ id: "i-ogonek-maj", char: "Į", label: "Uppercase I with ogonek", labelFr: "I majuscule ogonek" },
			{ id: "u-ogonek-min", char: "ų", label: "Lowercase u with ogonek", labelFr: "U minuscule ogonek" },
			{ id: "u-ogonek-maj", char: "Ų", label: "Uppercase U with ogonek", labelFr: "U majuscule ogonek" },
		],
	},
	{
		category: "Macron",
		categoryFr: "Macron",
		chars: [
			{ id: "a-macron-min", char: "ā", label: "Lowercase a with macron", labelFr: "A minuscule macron" },
			{ id: "a-macron-maj", char: "Ā", label: "Uppercase A with macron", labelFr: "A majuscule macron" },
			{ id: "e-macron-min", char: "ē", label: "Lowercase e with macron", labelFr: "E minuscule macron" },
			{ id: "e-macron-maj", char: "Ē", label: "Uppercase E with macron", labelFr: "E majuscule macron" },
			{ id: "i-macron-min", char: "ī", label: "Lowercase i with macron", labelFr: "I minuscule macron" },
			{ id: "i-macron-maj", char: "Ī", label: "Uppercase I with macron", labelFr: "I majuscule macron" },
			{ id: "o-macron-min", char: "ō", label: "Lowercase o with macron", labelFr: "O minuscule macron" },
			{ id: "o-macron-maj", char: "Ō", label: "Uppercase O with macron", labelFr: "O majuscule macron" },
			{ id: "u-macron-min", char: "ū", label: "Lowercase u with macron", labelFr: "U minuscule macron" },
			{ id: "u-macron-maj", char: "Ū", label: "Uppercase U with macron", labelFr: "U majuscule macron" },
			{ id: "y-macron-min", char: "ȳ", label: "Lowercase y with macron", labelFr: "Y minuscule macron" },
			{ id: "y-macron-maj", char: "Ȳ", label: "Uppercase Y with macron", labelFr: "Y majuscule macron" },
		],
	},
	{
		category: "Breve",
		categoryFr: "Brève",
		chars: [
			{ id: "a-breve-min", char: "ă", label: "Lowercase a with breve", labelFr: "A minuscule brève" },
			{ id: "a-breve-maj", char: "Ă", label: "Uppercase A with breve", labelFr: "A majuscule brève" },
			{ id: "e-breve-min", char: "ĕ", label: "Lowercase e with breve", labelFr: "E minuscule brève" },
			{ id: "e-breve-maj", char: "Ĕ", label: "Uppercase E with breve", labelFr: "E majuscule brève" },
			{ id: "g-breve-min", char: "ğ", label: "Lowercase g with breve", labelFr: "G minuscule brève" },
			{ id: "g-breve-maj", char: "Ğ", label: "Uppercase G with breve", labelFr: "G majuscule brève" },
			{ id: "i-breve-min", char: "ĭ", label: "Lowercase i with breve", labelFr: "I minuscule brève" },
			{ id: "i-breve-maj", char: "Ĭ", label: "Uppercase I with breve", labelFr: "I majuscule brève" },
			{ id: "o-breve-min", char: "ŏ", label: "Lowercase o with breve", labelFr: "O minuscule brève" },
			{ id: "o-breve-maj", char: "Ŏ", label: "Uppercase O with breve", labelFr: "O majuscule brève" },
			{ id: "u-breve-min", char: "ŭ", label: "Lowercase u with breve", labelFr: "U minuscule brève" },
			{ id: "u-breve-maj", char: "Ŭ", label: "Uppercase U with breve", labelFr: "U majuscule brève" },
		],
	},
	{
		category: "Dot above",
		categoryFr: "Point suscrit",
		chars: [
			{ id: "c-point-min", char: "ċ", label: "Lowercase c with dot above", labelFr: "C minuscule point suscrit" },
			{ id: "c-point-maj", char: "Ċ", label: "Uppercase C with dot above", labelFr: "C majuscule point suscrit" },
			{ id: "e-point-min", char: "ė", label: "Lowercase e with dot above", labelFr: "E minuscule point suscrit" },
			{ id: "e-point-maj", char: "Ė", label: "Uppercase E with dot above", labelFr: "E majuscule point suscrit" },
			{ id: "g-point-min", char: "ġ", label: "Lowercase g with dot above", labelFr: "G minuscule point suscrit" },
			{ id: "g-point-maj", char: "Ġ", label: "Uppercase G with dot above", labelFr: "G majuscule point suscrit" },
			{ id: "z-point-min", char: "ż", label: "Lowercase z with dot above", labelFr: "Z minuscule point suscrit" },
			{ id: "z-point-maj", char: "Ż", label: "Uppercase Z with dot above", labelFr: "Z majuscule point suscrit" },
		],
	},
	{
		category: "Double acute accent",
		categoryFr: "Double accent aigu",
		chars: [
			{ id: "o-double-aigu-min", char: "ő", label: "Lowercase o with double acute", labelFr: "O minuscule double accent aigu" },
			{ id: "o-double-aigu-maj", char: "Ő", label: "Uppercase O with double acute", labelFr: "O majuscule double accent aigu" },
			{ id: "u-double-aigu-min", char: "ű", label: "Lowercase u with double acute", labelFr: "U minuscule double accent aigu" },
			{ id: "u-double-aigu-maj", char: "Ű", label: "Uppercase U with double acute", labelFr: "U majuscule double accent aigu" },
		],
	},
	{
		category: "Ring above",
		categoryFr: "Rond en chef",
		chars: [
			{ id: "a-rond-min", char: "å", label: "Lowercase a with ring above", labelFr: "A minuscule rond en chef" },
			{ id: "a-rond-maj", char: "Å", label: "Uppercase A with ring above", labelFr: "A majuscule rond en chef" },
			{ id: "u-rond-min", char: "ů", label: "Lowercase u with ring above", labelFr: "U minuscule rond en chef" },
			{ id: "u-rond-maj", char: "Ů", label: "Uppercase U with ring above", labelFr: "U majuscule rond en chef" },
		],
	},
	{
		category: "Stroked and special letters",
		categoryFr: "Lettres barrées et spéciales",
		chars: [
			{ id: "ss-min", char: "ß", label: "Lowercase eszett (ss)", labelFr: "Eszett (ss) minuscule" },
			{ id: "ss-maj", char: "ẞ", label: "Uppercase eszett (SS)", labelFr: "Eszett (SS) majuscule" },
			{ id: "o-barre-min", char: "ø", label: "Lowercase o with stroke", labelFr: "O barré minuscule" },
			{ id: "o-barre-maj", char: "Ø", label: "Uppercase O with stroke", labelFr: "O barré majuscule" },
			{ id: "l-barre-min", char: "ł", label: "Lowercase l with stroke", labelFr: "L barré minuscule" },
			{ id: "l-barre-maj", char: "Ł", label: "Uppercase L with stroke", labelFr: "L barré majuscule" },
			{ id: "d-barre-min", char: "đ", label: "Lowercase d with stroke", labelFr: "D barré minuscule" },
			{ id: "d-barre-maj", char: "Đ", label: "Uppercase D with stroke", labelFr: "D barré majuscule" },
			{ id: "h-barre-min", char: "ħ", label: "Lowercase h with stroke", labelFr: "H barré minuscule" },
			{ id: "h-barre-maj", char: "Ħ", label: "Uppercase H with stroke", labelFr: "H barré majuscule" },
			{ id: "t-barre-min", char: "ŧ", label: "Lowercase t with stroke", labelFr: "T barré minuscule" },
			{ id: "t-barre-maj", char: "Ŧ", label: "Uppercase T with stroke", labelFr: "T barré majuscule" },
			{ id: "eth-min", char: "ð", label: "Lowercase eth (dh)", labelFr: "Eth (dh) minuscule" },
			{ id: "eth-maj", char: "Ð", label: "Uppercase eth (DH)", labelFr: "Eth (DH) majuscule" },
			{ id: "thorn-min", char: "þ", label: "Lowercase thorn (th)", labelFr: "Thorn (th) minuscule" },
			{ id: "thorn-maj", char: "Þ", label: "Uppercase thorn (TH)", labelFr: "Thorn (TH) majuscule" },
			{ id: "i-sans-point-min", char: "ı", label: "Lowercase dotless i", labelFr: "I sans point minuscule" },
			{ id: "i-point-maj", char: "İ", label: "Uppercase I with dot above", labelFr: "I majuscule point suscrit" },
			{ id: "schwa-min", char: "ə", label: "Lowercase schwa", labelFr: "Schwa minuscule" },
			{ id: "schwa-maj", char: "Ə", label: "Uppercase schwa", labelFr: "Schwa majuscule" },
			{ id: "eng-min", char: "ŋ", label: "Lowercase eng", labelFr: "Eng minuscule" },
			{ id: "eng-maj", char: "Ŋ", label: "Uppercase eng", labelFr: "Eng majuscule" },
		],
	},
	{
		category: "Currencies",
		categoryFr: "Monnaies",
		chars: [
			{ id: "euro", char: "€", label: "Euro", labelFr: "Euro" },
			{ id: "livre", char: "£", label: "Pound sterling", labelFr: "Livre sterling" },
			{ id: "yen", char: "¥", label: "Yen / Yuan", labelFr: "Yen / Yuan" },
			{ id: "cent", char: "¢", label: "Cent", labelFr: "Cent" },
			{ id: "monnaie", char: "¤", label: "Generic currency sign", labelFr: "Signe monétaire générique" },
			{ id: "franc", char: "₣", label: "Franc", labelFr: "Franc" },
			{ id: "rouble", char: "₽", label: "Ruble", labelFr: "Rouble" },
			{ id: "hryvnia", char: "₴", label: "Hryvnia", labelFr: "Hryvnia" },
			{ id: "lire-turque", char: "₺", label: "Turkish lira", labelFr: "Livre turque" },
		],
	},
	{
		category: "Mathematics",
		categoryFr: "Mathématiques",
		chars: [
			{ id: "multiplication", char: "×", label: "Multiplication sign", labelFr: "Signe de multiplication" },
			{ id: "division", char: "÷", label: "Division sign", labelFr: "Signe de division" },
			{ id: "environ-egal", char: "≈", label: "Approximately equal", labelFr: "Signe approximativement égal" },
			{ id: "plus-ou-moins", char: "±", label: "Plus-minus sign", labelFr: "Signe plus ou moins" },
			{ id: "different", char: "≠", label: "Not equal", labelFr: "Signe différent de" },
			{ id: "inferieur-egal", char: "≤", label: "Less than or equal", labelFr: "Signe inférieur ou égal" },
			{ id: "superieur-egal", char: "≥", label: "Greater than or equal", labelFr: "Signe supérieur ou égal" },
			{ id: "moins", char: "−", label: "Minus sign", labelFr: "Signe moins" },
			{ id: "infini", char: "∞", label: "Infinity", labelFr: "Infini" },
			{ id: "racine", char: "√", label: "Square root", labelFr: "Racine carrée" },
			{ id: "somme", char: "∑", label: "Summation", labelFr: "Somme" },
			{ id: "pi", char: "π", label: "Pi", labelFr: "Pi" },
			{ id: "delta", char: "Δ", label: "Uppercase delta", labelFr: "Delta majuscule" },
			{ id: "omega", char: "Ω", label: "Uppercase omega (ohm)", labelFr: "Oméga majuscule (ohm)" },
		],
	},
	{
		category: "Superscripts, subscripts and fractions",
		categoryFr: "Exposants, indices et fractions",
		chars: [
			{ id: "exposant-0", char: "⁰", label: "Superscript 0", labelFr: "Exposant 0" },
			{ id: "exposant-1", char: "¹", label: "Superscript 1", labelFr: "Exposant 1" },
			{ id: "exposant-2", char: "²", label: "Superscript 2", labelFr: "Exposant 2" },
			{ id: "exposant-3", char: "³", label: "Superscript 3", labelFr: "Exposant 3" },
			{ id: "exposant-4", char: "⁴", label: "Superscript 4", labelFr: "Exposant 4" },
			{ id: "exposant-5", char: "⁵", label: "Superscript 5", labelFr: "Exposant 5" },
			{ id: "exposant-6", char: "⁶", label: "Superscript 6", labelFr: "Exposant 6" },
			{ id: "exposant-7", char: "⁷", label: "Superscript 7", labelFr: "Exposant 7" },
			{ id: "exposant-8", char: "⁸", label: "Superscript 8", labelFr: "Exposant 8" },
			{ id: "exposant-9", char: "⁹", label: "Superscript 9", labelFr: "Exposant 9" },
			{ id: "indice-0", char: "₀", label: "Subscript 0", labelFr: "Indice 0" },
			{ id: "indice-1", char: "₁", label: "Subscript 1", labelFr: "Indice 1" },
			{ id: "indice-2", char: "₂", label: "Subscript 2", labelFr: "Indice 2" },
			{ id: "indice-3", char: "₃", label: "Subscript 3", labelFr: "Indice 3" },
			{ id: "indice-4", char: "₄", label: "Subscript 4", labelFr: "Indice 4" },
			{ id: "indice-5", char: "₅", label: "Subscript 5", labelFr: "Indice 5" },
			{ id: "indice-6", char: "₆", label: "Subscript 6", labelFr: "Indice 6" },
			{ id: "indice-7", char: "₇", label: "Subscript 7", labelFr: "Indice 7" },
			{ id: "indice-8", char: "₈", label: "Subscript 8", labelFr: "Indice 8" },
			{ id: "indice-9", char: "₉", label: "Subscript 9", labelFr: "Indice 9" },
			{ id: "demi", char: "½", label: "One half", labelFr: "Un demi" },
			{ id: "tiers", char: "⅓", label: "One third", labelFr: "Un tiers" },
			{ id: "deux-tiers", char: "⅔", label: "Two thirds", labelFr: "Deux tiers" },
			{ id: "quart", char: "¼", label: "One quarter", labelFr: "Un quart" },
			{ id: "trois-quarts", char: "¾", label: "Three quarters", labelFr: "Trois quarts" },
			{ id: "huitieme", char: "⅛", label: "One eighth", labelFr: "Un huitième" },
			{ id: "exposant-e", char: "ᵉ", label: "Superscript e (1ᵉ, 2ᵉ)", labelFr: "Exposant e (1ᵉ, 2ᵉ)" },
			{ id: "exposant-r", char: "ʳ", label: "Superscript r (1ʳᵉ)", labelFr: "Exposant r (1ʳᵉ)" },
			{ id: "exposant-s", char: "ˢ", label: "Superscript s (2ˢ)", labelFr: "Exposant s (2ˢ)" },
			{ id: "exposant-d", char: "ᵈ", label: "Superscript d (2ᵈ)", labelFr: "Exposant d (2ᵈ)" },
			{ id: "exposant-n", char: "ⁿ", label: "Superscript n (nⁿ)", labelFr: "Exposant n (nⁿ)" },
		],
	},
	{
		category: "Symbols",
		categoryFr: "Symboles",
		chars: [
			{ id: "micro", char: "µ", label: "Micro sign", labelFr: "Symbole micro" },
			{ id: "puce", char: "•", label: "Bullet", labelFr: "Puce" },
			{ id: "puce-creuse", char: "◦", label: "White bullet", labelFr: "Puce creuse" },
			{ id: "degre", char: "°", label: "Degree sign", labelFr: "Degré" },
			{ id: "paragraphe", char: "§", label: "Section sign", labelFr: "Paragraphe" },
			{ id: "pied-de-mouche", char: "¶", label: "Pilcrow", labelFr: "Pied-de-mouche" },
			{ id: "obele", char: "†", label: "Dagger", labelFr: "Obèle" },
			{ id: "double-obele", char: "‡", label: "Double dagger", labelFr: "Double obèle" },
			{ id: "copyright", char: "©", label: "Copyright", labelFr: "Copyright" },
			{ id: "marque-deposee", char: "®", label: "Registered trademark", labelFr: "Marque déposée" },
			{ id: "marque-commerciale", char: "™", label: "Trademark", labelFr: "Marque commerciale" },
			{ id: "numero", char: "№", label: "Numero sign", labelFr: "Numéro" },
			{ id: "pour-mille", char: "‰", label: "Per mille", labelFr: "Pour mille" },
			{ id: "prime", char: "′", label: "Prime (minute, foot)", labelFr: "Prime (minute, pied)" },
			{ id: "double-prime", char: "″", label: "Double prime (second, inch)", labelFr: "Double prime (seconde, pouce)" },
			{ id: "ordinal-feminin", char: "ª", label: "Feminine ordinal indicator", labelFr: "Ordinal féminin (espagnol, portugais)" },
			{ id: "ordinal-masculin", char: "º", label: "Masculine ordinal indicator", labelFr: "Ordinal masculin (espagnol, portugais)" },
		],
	},
	{
		category: "Arrows",
		categoryFr: "Flèches",
		chars: [
			{ id: "fleche-gauche", char: "←", label: "Left arrow", labelFr: "Flèche vers la gauche" },
			{ id: "fleche-droite", char: "→", label: "Right arrow", labelFr: "Flèche vers la droite" },
			{ id: "fleche-haut", char: "↑", label: "Up arrow", labelFr: "Flèche vers le haut" },
			{ id: "fleche-bas", char: "↓", label: "Down arrow", labelFr: "Flèche vers le bas" },
			{ id: "fleche-gauche-droite", char: "↔", label: "Left-right arrow", labelFr: "Flèche gauche-droite" },
			{ id: "fleche-haut-bas", char: "↕", label: "Up-down arrow", labelFr: "Flèche haut-bas" },
			{ id: "fleche-haut-gauche", char: "↖", label: "Up-left arrow", labelFr: "Flèche vers le haut à gauche" },
			{ id: "fleche-haut-droite", char: "↗", label: "Up-right arrow", labelFr: "Flèche vers le haut à droite" },
			{ id: "fleche-bas-droite", char: "↘", label: "Down-right arrow", labelFr: "Flèche vers le bas à droite" },
			{ id: "fleche-bas-gauche", char: "↙", label: "Down-left arrow", labelFr: "Flèche vers le bas à gauche" },
			{ id: "fleche-double-gauche", char: "⇐", label: "Double left arrow", labelFr: "Double flèche vers la gauche" },
			{ id: "fleche-double-droite", char: "⇒", label: "Double right arrow", labelFr: "Double flèche vers la droite" },
			{ id: "fleche-double-gauche-droite", char: "⇔", label: "Double left-right arrow", labelFr: "Double flèche gauche-droite" },
			{ id: "fleche-retour", char: "↩", label: "Return arrow", labelFr: "Flèche de retour" },
			{ id: "fleche-associe", char: "↦", label: "“Maps to” arrow", labelFr: "Flèche « associe à »" },
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
	// Une seule lettre (« e », « ø ») cherche les caractères dont elle est la
	// base : tous les libellés et toutes les catégories en contiennent une, la
	// recherche par sous-chaîne renverrait la table entière.
	if (query.length === 1) {
		return normalizeForSearch(item.char) === query;
	}
	return (
		normalizeForSearch(charLabel(item)).includes(query) ||
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
