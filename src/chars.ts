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
// notamment dans les tests et les décorations de l'éditeur.
export const NNBSP = " "; // espace fine insécable
export const NBSP = " "; // espace insécable

export const CHAR_GROUPS: CharGroup[] = [
	{
		category: "Espaces",
		chars: [
			{ id: "narrow-nbsp", char: NNBSP, label: "Espace fine insécable", preview: `A${NNBSP}B`, hotkey: hotkey("1") },
			{ id: "nbsp", char: NBSP, label: "Espace insécable", preview: `A${NBSP}B`, hotkey: hotkey("2") },
			{ id: "espace-fine", char: "\u2009", label: "Espace fine", preview: "A\u2009B" },
			{ id: "espace-ultrafine", char: "\u200A", label: "Espace ultrafine", preview: "A\u200AB" },
			{ id: "espace-ponctuation", char: "\u2008", label: "Espace de ponctuation", preview: "A\u2008B" },
			{ id: "espace-demi-cadratin", char: "\u2002", label: "Espace demi-cadratin", preview: "A\u2002B" },
			{ id: "espace-cadratin", char: "\u2003", label: "Espace cadratin", preview: "A\u2003B" },
			{ id: "trait-union-insecable", char: "\u2011", label: "Trait d'union insécable" },
		],
	},
	{
		category: "Guillemets et apostrophes",
		chars: [
			{ id: "guillemet-ouvrant", char: "«", label: "Guillemet français ouvrant", hotkey: hotkey("3") },
			{ id: "guillemet-fermant", char: "»", label: "Guillemet français fermant", hotkey: hotkey("4") },
			{ id: "guillemet-simple-ouvrant", char: "‹", label: "Guillemet français simple ouvrant" },
			{ id: "guillemet-simple-fermant", char: "›", label: "Guillemet français simple fermant" },
			{ id: "guillemet-anglais-ouvrant", char: "“", label: "Guillemet anglais ouvrant" },
			{ id: "guillemet-anglais-fermant", char: "”", label: "Guillemet anglais fermant" },
			{ id: "apostrophe-ouvrante", char: "‘", label: "Apostrophe simple ouvrante" },
			{ id: "apostrophe-typographique", char: "’", label: "Apostrophe typographique" },
			{ id: "guillemet-bas-double", char: "„", label: "Guillemet bas double (allemand, polonais, tchèque)" },
			{ id: "guillemet-bas-simple", char: "‚", label: "Guillemet bas simple (allemand, tchèque)" },
		],
	},
	{
		category: "Tirets et ponctuation",
		chars: [
			{ id: "tiret-cadratin", char: "—", label: "Tiret cadratin" },
			{ id: "tiret-demi-cadratin", char: "–", label: "Tiret demi-cadratin" },
			{ id: "point-median", char: "·", label: "Point médian" },
			{ id: "points-suspension", char: "…", label: "Points de suspension" },
			{ id: "point-interrogation-inverse", char: "¿", label: "Point d'interrogation inversé (espagnol)" },
			{ id: "point-exclamation-inverse", char: "¡", label: "Point d'exclamation inversé (espagnol)" },
		],
	},
	{
		category: "Ligatures",
		chars: [
			{ id: "oe-minuscule", char: "œ", label: "Ligature œ minuscule" },
			{ id: "oe-majuscule", char: "Œ", label: "Ligature Œ majuscule" },
			{ id: "ae-minuscule", char: "æ", label: "Ligature æ minuscule" },
			{ id: "ae-majuscule", char: "Æ", label: "Ligature Æ majuscule" },
			{ id: "ij-minuscule", char: "ĳ", label: "Ligature ĳ minuscule (néerlandais)" },
			{ id: "ij-majuscule", char: "Ĳ", label: "Ligature Ĳ majuscule (néerlandais)" },
			{ id: "ligature-fi", char: "ﬁ", label: "Ligature fi" },
			{ id: "ligature-fl", char: "ﬂ", label: "Ligature fl" },
			{ id: "ligature-ff", char: "ﬀ", label: "Ligature ff" },
		],
	},
	{
		category: "Accent aigu",
		chars: [
			{ id: "a-aigu-min", char: "á", label: "A minuscule accent aigu" },
			{ id: "a-aigu-maj", char: "Á", label: "A majuscule accent aigu" },
			{ id: "e-aigu-min", char: "é", label: "E minuscule accent aigu" },
			{ id: "e-aigu-maj", char: "É", label: "E majuscule accent aigu" },
			{ id: "i-aigu-min", char: "í", label: "I minuscule accent aigu" },
			{ id: "i-aigu-maj", char: "Í", label: "I majuscule accent aigu" },
			{ id: "o-aigu-min", char: "ó", label: "O minuscule accent aigu" },
			{ id: "o-aigu-maj", char: "Ó", label: "O majuscule accent aigu" },
			{ id: "u-aigu-min", char: "ú", label: "U minuscule accent aigu" },
			{ id: "u-aigu-maj", char: "Ú", label: "U majuscule accent aigu" },
			{ id: "y-aigu-min", char: "ý", label: "Y minuscule accent aigu" },
			{ id: "y-aigu-maj", char: "Ý", label: "Y majuscule accent aigu" },
			{ id: "c-aigu-min", char: "ć", label: "C minuscule accent aigu" },
			{ id: "c-aigu-maj", char: "Ć", label: "C majuscule accent aigu" },
			{ id: "l-aigu-min", char: "ĺ", label: "L minuscule accent aigu" },
			{ id: "l-aigu-maj", char: "Ĺ", label: "L majuscule accent aigu" },
			{ id: "n-aigu-min", char: "ń", label: "N minuscule accent aigu" },
			{ id: "n-aigu-maj", char: "Ń", label: "N majuscule accent aigu" },
			{ id: "r-aigu-min", char: "ŕ", label: "R minuscule accent aigu" },
			{ id: "r-aigu-maj", char: "Ŕ", label: "R majuscule accent aigu" },
			{ id: "s-aigu-min", char: "ś", label: "S minuscule accent aigu" },
			{ id: "s-aigu-maj", char: "Ś", label: "S majuscule accent aigu" },
			{ id: "z-aigu-min", char: "ź", label: "Z minuscule accent aigu" },
			{ id: "z-aigu-maj", char: "Ź", label: "Z majuscule accent aigu" },
		],
	},
	{
		category: "Accent grave",
		chars: [
			{ id: "a-grave-min", char: "à", label: "A minuscule accent grave" },
			{ id: "a-grave-maj", char: "À", label: "A majuscule accent grave" },
			{ id: "e-grave-min", char: "è", label: "E minuscule accent grave" },
			{ id: "e-grave-maj", char: "È", label: "E majuscule accent grave" },
			{ id: "i-grave-min", char: "ì", label: "I minuscule accent grave" },
			{ id: "i-grave-maj", char: "Ì", label: "I majuscule accent grave" },
			{ id: "o-grave-min", char: "ò", label: "O minuscule accent grave" },
			{ id: "o-grave-maj", char: "Ò", label: "O majuscule accent grave" },
			{ id: "u-grave-min", char: "ù", label: "U minuscule accent grave" },
			{ id: "u-grave-maj", char: "Ù", label: "U majuscule accent grave" },
		],
	},
	{
		category: "Accent circonflexe",
		chars: [
			{ id: "a-circonflexe-min", char: "â", label: "A minuscule accent circonflexe" },
			{ id: "a-circonflexe-maj", char: "Â", label: "A majuscule accent circonflexe" },
			{ id: "e-circonflexe-min", char: "ê", label: "E minuscule accent circonflexe" },
			{ id: "e-circonflexe-maj", char: "Ê", label: "E majuscule accent circonflexe" },
			{ id: "i-circonflexe-min", char: "î", label: "I minuscule accent circonflexe" },
			{ id: "i-circonflexe-maj", char: "Î", label: "I majuscule accent circonflexe" },
			{ id: "o-circonflexe-min", char: "ô", label: "O minuscule accent circonflexe" },
			{ id: "o-circonflexe-maj", char: "Ô", label: "O majuscule accent circonflexe" },
			{ id: "u-circonflexe-min", char: "û", label: "U minuscule accent circonflexe" },
			{ id: "u-circonflexe-maj", char: "Û", label: "U majuscule accent circonflexe" },
			{ id: "w-circonflexe-min", char: "ŵ", label: "W minuscule accent circonflexe" },
			{ id: "w-circonflexe-maj", char: "Ŵ", label: "W majuscule accent circonflexe" },
			{ id: "y-circonflexe-min", char: "ŷ", label: "Y minuscule accent circonflexe" },
			{ id: "y-circonflexe-maj", char: "Ŷ", label: "Y majuscule accent circonflexe" },
			{ id: "c-circonflexe-min", char: "ĉ", label: "C minuscule accent circonflexe" },
			{ id: "c-circonflexe-maj", char: "Ĉ", label: "C majuscule accent circonflexe" },
			{ id: "g-circonflexe-min", char: "ĝ", label: "G minuscule accent circonflexe" },
			{ id: "g-circonflexe-maj", char: "Ĝ", label: "G majuscule accent circonflexe" },
			{ id: "h-circonflexe-min", char: "ĥ", label: "H minuscule accent circonflexe" },
			{ id: "h-circonflexe-maj", char: "Ĥ", label: "H majuscule accent circonflexe" },
			{ id: "j-circonflexe-min", char: "ĵ", label: "J minuscule accent circonflexe" },
			{ id: "j-circonflexe-maj", char: "Ĵ", label: "J majuscule accent circonflexe" },
			{ id: "s-circonflexe-min", char: "ŝ", label: "S minuscule accent circonflexe" },
			{ id: "s-circonflexe-maj", char: "Ŝ", label: "S majuscule accent circonflexe" },
		],
	},
	{
		category: "Tréma",
		chars: [
			{ id: "a-trema-min", char: "ä", label: "A minuscule tréma" },
			{ id: "a-trema-maj", char: "Ä", label: "A majuscule tréma" },
			{ id: "e-trema-min", char: "ë", label: "E minuscule tréma" },
			{ id: "e-trema-maj", char: "Ë", label: "E majuscule tréma" },
			{ id: "i-trema-min", char: "ï", label: "I minuscule tréma" },
			{ id: "i-trema-maj", char: "Ï", label: "I majuscule tréma" },
			{ id: "o-trema-min", char: "ö", label: "O minuscule tréma" },
			{ id: "o-trema-maj", char: "Ö", label: "O majuscule tréma" },
			{ id: "u-trema-min", char: "ü", label: "U minuscule tréma" },
			{ id: "u-trema-maj", char: "Ü", label: "U majuscule tréma" },
			{ id: "y-trema-min", char: "ÿ", label: "Y minuscule tréma" },
			{ id: "y-trema-maj", char: "Ÿ", label: "Y majuscule tréma" },
		],
	},
	{
		category: "Tilde",
		chars: [
			{ id: "a-tilde-min", char: "ã", label: "A minuscule tilde" },
			{ id: "a-tilde-maj", char: "Ã", label: "A majuscule tilde" },
			{ id: "n-tilde-min", char: "ñ", label: "N minuscule tilde" },
			{ id: "n-tilde-maj", char: "Ñ", label: "N majuscule tilde" },
			{ id: "o-tilde-min", char: "õ", label: "O minuscule tilde" },
			{ id: "o-tilde-maj", char: "Õ", label: "O majuscule tilde" },
		],
	},
	{
		category: "Cédille et virgule souscrite",
		chars: [
			{ id: "c-cedille-min", char: "ç", label: "C minuscule cédille" },
			{ id: "c-cedille-maj", char: "Ç", label: "C majuscule cédille" },
			{ id: "s-cedille-min", char: "ş", label: "S minuscule cédille" },
			{ id: "s-cedille-maj", char: "Ş", label: "S majuscule cédille" },
			{ id: "t-cedille-min", char: "ţ", label: "T minuscule cédille" },
			{ id: "t-cedille-maj", char: "Ţ", label: "T majuscule cédille" },
			{ id: "g-cedille-min", char: "ģ", label: "G minuscule cédille" },
			{ id: "g-cedille-maj", char: "Ģ", label: "G majuscule cédille" },
			{ id: "k-cedille-min", char: "ķ", label: "K minuscule cédille" },
			{ id: "k-cedille-maj", char: "Ķ", label: "K majuscule cédille" },
			{ id: "l-cedille-min", char: "ļ", label: "L minuscule cédille" },
			{ id: "l-cedille-maj", char: "Ļ", label: "L majuscule cédille" },
			{ id: "n-cedille-min", char: "ņ", label: "N minuscule cédille" },
			{ id: "n-cedille-maj", char: "Ņ", label: "N majuscule cédille" },
			{ id: "r-cedille-min", char: "ŗ", label: "R minuscule cédille" },
			{ id: "r-cedille-maj", char: "Ŗ", label: "R majuscule cédille" },
			{ id: "s-virgule-min", char: "ș", label: "S minuscule virgule souscrite" },
			{ id: "s-virgule-maj", char: "Ș", label: "S majuscule virgule souscrite" },
			{ id: "t-virgule-min", char: "ț", label: "T minuscule virgule souscrite" },
			{ id: "t-virgule-maj", char: "Ț", label: "T majuscule virgule souscrite" },
		],
	},
	{
		category: "Caron (háček)",
		chars: [
			{ id: "c-caron-min", char: "č", label: "C minuscule caron" },
			{ id: "c-caron-maj", char: "Č", label: "C majuscule caron" },
			{ id: "d-caron-min", char: "ď", label: "D minuscule caron" },
			{ id: "d-caron-maj", char: "Ď", label: "D majuscule caron" },
			{ id: "e-caron-min", char: "ě", label: "E minuscule caron" },
			{ id: "e-caron-maj", char: "Ě", label: "E majuscule caron" },
			{ id: "l-caron-min", char: "ľ", label: "L minuscule caron" },
			{ id: "l-caron-maj", char: "Ľ", label: "L majuscule caron" },
			{ id: "n-caron-min", char: "ň", label: "N minuscule caron" },
			{ id: "n-caron-maj", char: "Ň", label: "N majuscule caron" },
			{ id: "r-caron-min", char: "ř", label: "R minuscule caron" },
			{ id: "r-caron-maj", char: "Ř", label: "R majuscule caron" },
			{ id: "s-caron-min", char: "š", label: "S minuscule caron" },
			{ id: "s-caron-maj", char: "Š", label: "S majuscule caron" },
			{ id: "t-caron-min", char: "ť", label: "T minuscule caron" },
			{ id: "t-caron-maj", char: "Ť", label: "T majuscule caron" },
			{ id: "z-caron-min", char: "ž", label: "Z minuscule caron" },
			{ id: "z-caron-maj", char: "Ž", label: "Z majuscule caron" },
		],
	},
	{
		category: "Ogonek",
		chars: [
			{ id: "a-ogonek-min", char: "ą", label: "A minuscule ogonek" },
			{ id: "a-ogonek-maj", char: "Ą", label: "A majuscule ogonek" },
			{ id: "e-ogonek-min", char: "ę", label: "E minuscule ogonek" },
			{ id: "e-ogonek-maj", char: "Ę", label: "E majuscule ogonek" },
			{ id: "i-ogonek-min", char: "į", label: "I minuscule ogonek" },
			{ id: "i-ogonek-maj", char: "Į", label: "I majuscule ogonek" },
			{ id: "u-ogonek-min", char: "ų", label: "U minuscule ogonek" },
			{ id: "u-ogonek-maj", char: "Ų", label: "U majuscule ogonek" },
		],
	},
	{
		category: "Macron",
		chars: [
			{ id: "a-macron-min", char: "ā", label: "A minuscule macron" },
			{ id: "a-macron-maj", char: "Ā", label: "A majuscule macron" },
			{ id: "e-macron-min", char: "ē", label: "E minuscule macron" },
			{ id: "e-macron-maj", char: "Ē", label: "E majuscule macron" },
			{ id: "i-macron-min", char: "ī", label: "I minuscule macron" },
			{ id: "i-macron-maj", char: "Ī", label: "I majuscule macron" },
			{ id: "o-macron-min", char: "ō", label: "O minuscule macron" },
			{ id: "o-macron-maj", char: "Ō", label: "O majuscule macron" },
			{ id: "u-macron-min", char: "ū", label: "U minuscule macron" },
			{ id: "u-macron-maj", char: "Ū", label: "U majuscule macron" },
			{ id: "y-macron-min", char: "ȳ", label: "Y minuscule macron" },
			{ id: "y-macron-maj", char: "Ȳ", label: "Y majuscule macron" },
		],
	},
	{
		category: "Brève",
		chars: [
			{ id: "a-breve-min", char: "ă", label: "A minuscule brève" },
			{ id: "a-breve-maj", char: "Ă", label: "A majuscule brève" },
			{ id: "e-breve-min", char: "ĕ", label: "E minuscule brève" },
			{ id: "e-breve-maj", char: "Ĕ", label: "E majuscule brève" },
			{ id: "g-breve-min", char: "ğ", label: "G minuscule brève" },
			{ id: "g-breve-maj", char: "Ğ", label: "G majuscule brève" },
			{ id: "i-breve-min", char: "ĭ", label: "I minuscule brève" },
			{ id: "i-breve-maj", char: "Ĭ", label: "I majuscule brève" },
			{ id: "o-breve-min", char: "ŏ", label: "O minuscule brève" },
			{ id: "o-breve-maj", char: "Ŏ", label: "O majuscule brève" },
			{ id: "u-breve-min", char: "ŭ", label: "U minuscule brève" },
			{ id: "u-breve-maj", char: "Ŭ", label: "U majuscule brève" },
		],
	},
	{
		category: "Point suscrit",
		chars: [
			{ id: "c-point-min", char: "ċ", label: "C minuscule point suscrit" },
			{ id: "c-point-maj", char: "Ċ", label: "C majuscule point suscrit" },
			{ id: "e-point-min", char: "ė", label: "E minuscule point suscrit" },
			{ id: "e-point-maj", char: "Ė", label: "E majuscule point suscrit" },
			{ id: "g-point-min", char: "ġ", label: "G minuscule point suscrit" },
			{ id: "g-point-maj", char: "Ġ", label: "G majuscule point suscrit" },
			{ id: "z-point-min", char: "ż", label: "Z minuscule point suscrit" },
			{ id: "z-point-maj", char: "Ż", label: "Z majuscule point suscrit" },
		],
	},
	{
		category: "Double accent aigu",
		chars: [
			{ id: "o-double-aigu-min", char: "ő", label: "O minuscule double accent aigu" },
			{ id: "o-double-aigu-maj", char: "Ő", label: "O majuscule double accent aigu" },
			{ id: "u-double-aigu-min", char: "ű", label: "U minuscule double accent aigu" },
			{ id: "u-double-aigu-maj", char: "Ű", label: "U majuscule double accent aigu" },
		],
	},
	{
		category: "Rond en chef",
		chars: [
			{ id: "a-rond-min", char: "å", label: "A minuscule rond en chef" },
			{ id: "a-rond-maj", char: "Å", label: "A majuscule rond en chef" },
			{ id: "u-rond-min", char: "ů", label: "U minuscule rond en chef" },
			{ id: "u-rond-maj", char: "Ů", label: "U majuscule rond en chef" },
		],
	},
	{
		category: "Lettres barrées et spéciales",
		chars: [
			{ id: "ss-min", char: "ß", label: "Eszett (ss) minuscule" },
			{ id: "ss-maj", char: "ẞ", label: "Eszett (SS) majuscule" },
			{ id: "o-barre-min", char: "ø", label: "O barré minuscule" },
			{ id: "o-barre-maj", char: "Ø", label: "O barré majuscule" },
			{ id: "l-barre-min", char: "ł", label: "L barré minuscule" },
			{ id: "l-barre-maj", char: "Ł", label: "L barré majuscule" },
			{ id: "d-barre-min", char: "đ", label: "D barré minuscule" },
			{ id: "d-barre-maj", char: "Đ", label: "D barré majuscule" },
			{ id: "h-barre-min", char: "ħ", label: "H barré minuscule" },
			{ id: "h-barre-maj", char: "Ħ", label: "H barré majuscule" },
			{ id: "t-barre-min", char: "ŧ", label: "T barré minuscule" },
			{ id: "t-barre-maj", char: "Ŧ", label: "T barré majuscule" },
			{ id: "eth-min", char: "ð", label: "Eth (dh) minuscule" },
			{ id: "eth-maj", char: "Ð", label: "Eth (DH) majuscule" },
			{ id: "thorn-min", char: "þ", label: "Thorn (th) minuscule" },
			{ id: "thorn-maj", char: "Þ", label: "Thorn (TH) majuscule" },
			{ id: "i-sans-point-min", char: "ı", label: "I sans point minuscule" },
			{ id: "i-point-maj", char: "İ", label: "I majuscule point suscrit" },
			{ id: "schwa-min", char: "ə", label: "Schwa minuscule" },
			{ id: "schwa-maj", char: "Ə", label: "Schwa majuscule" },
			{ id: "eng-min", char: "ŋ", label: "Eng minuscule" },
			{ id: "eng-maj", char: "Ŋ", label: "Eng majuscule" },
		],
	},
	{
		category: "Monnaies",
		chars: [
			{ id: "euro", char: "€", label: "Euro" },
			{ id: "livre", char: "£", label: "Livre sterling" },
			{ id: "yen", char: "¥", label: "Yen / Yuan" },
			{ id: "cent", char: "¢", label: "Cent" },
			{ id: "monnaie", char: "¤", label: "Signe monétaire générique" },
			{ id: "franc", char: "₣", label: "Franc" },
			{ id: "rouble", char: "₽", label: "Rouble" },
			{ id: "hryvnia", char: "₴", label: "Hryvnia" },
			{ id: "lire-turque", char: "₺", label: "Livre turque" },
		],
	},
	{
		category: "Mathématiques",
		chars: [
			{ id: "multiplication", char: "×", label: "Signe de multiplication" },
			{ id: "division", char: "÷", label: "Signe de division" },
			{ id: "environ-egal", char: "≈", label: "Signe approximativement égal" },
			{ id: "plus-ou-moins", char: "±", label: "Signe plus ou moins" },
			{ id: "different", char: "≠", label: "Signe différent de" },
			{ id: "inferieur-egal", char: "≤", label: "Signe inférieur ou égal" },
			{ id: "superieur-egal", char: "≥", label: "Signe supérieur ou égal" },
			{ id: "moins", char: "−", label: "Signe moins" },
			{ id: "infini", char: "∞", label: "Infini" },
			{ id: "racine", char: "√", label: "Racine carrée" },
			{ id: "somme", char: "∑", label: "Somme" },
			{ id: "pi", char: "π", label: "Pi" },
			{ id: "delta", char: "Δ", label: "Delta majuscule" },
			{ id: "omega", char: "Ω", label: "Oméga majuscule (ohm)" },
		],
	},
	{
		category: "Exposants, indices et fractions",
		chars: [
			{ id: "exposant-0", char: "⁰", label: "Exposant 0" },
			{ id: "exposant-1", char: "¹", label: "Exposant 1" },
			{ id: "exposant-2", char: "²", label: "Exposant 2" },
			{ id: "exposant-3", char: "³", label: "Exposant 3" },
			{ id: "exposant-4", char: "⁴", label: "Exposant 4" },
			{ id: "exposant-5", char: "⁵", label: "Exposant 5" },
			{ id: "exposant-6", char: "⁶", label: "Exposant 6" },
			{ id: "exposant-7", char: "⁷", label: "Exposant 7" },
			{ id: "exposant-8", char: "⁸", label: "Exposant 8" },
			{ id: "exposant-9", char: "⁹", label: "Exposant 9" },
			{ id: "indice-0", char: "₀", label: "Indice 0" },
			{ id: "indice-1", char: "₁", label: "Indice 1" },
			{ id: "indice-2", char: "₂", label: "Indice 2" },
			{ id: "indice-3", char: "₃", label: "Indice 3" },
			{ id: "indice-4", char: "₄", label: "Indice 4" },
			{ id: "indice-5", char: "₅", label: "Indice 5" },
			{ id: "indice-6", char: "₆", label: "Indice 6" },
			{ id: "indice-7", char: "₇", label: "Indice 7" },
			{ id: "indice-8", char: "₈", label: "Indice 8" },
			{ id: "indice-9", char: "₉", label: "Indice 9" },
			{ id: "demi", char: "½", label: "Un demi" },
			{ id: "tiers", char: "⅓", label: "Un tiers" },
			{ id: "deux-tiers", char: "⅔", label: "Deux tiers" },
			{ id: "quart", char: "¼", label: "Un quart" },
			{ id: "trois-quarts", char: "¾", label: "Trois quarts" },
			{ id: "huitieme", char: "⅛", label: "Un huitième" },
			{ id: "exposant-e", char: "ᵉ", label: "Exposant e (1ᵉ, 2ᵉ)" },
			{ id: "exposant-r", char: "ʳ", label: "Exposant r (1ʳᵉ)" },
			{ id: "exposant-s", char: "ˢ", label: "Exposant s (2ˢ)" },
			{ id: "exposant-d", char: "ᵈ", label: "Exposant d (2ᵈ)" },
			{ id: "exposant-n", char: "ⁿ", label: "Exposant n (nⁿ)" },
		],
	},
	{
		category: "Symboles",
		chars: [
			{ id: "micro", char: "µ", label: "Symbole micro" },
			{ id: "puce", char: "•", label: "Puce" },
			{ id: "puce-creuse", char: "◦", label: "Puce creuse" },
			{ id: "degre", char: "°", label: "Degré" },
			{ id: "paragraphe", char: "§", label: "Paragraphe" },
			{ id: "pied-de-mouche", char: "¶", label: "Pied-de-mouche" },
			{ id: "obele", char: "†", label: "Obèle" },
			{ id: "double-obele", char: "‡", label: "Double obèle" },
			{ id: "copyright", char: "©", label: "Copyright" },
			{ id: "marque-deposee", char: "®", label: "Marque déposée" },
			{ id: "marque-commerciale", char: "™", label: "Marque commerciale" },
			{ id: "numero", char: "№", label: "Numéro" },
			{ id: "pour-mille", char: "‰", label: "Pour mille" },
			{ id: "prime", char: "′", label: "Prime (minute, pied)" },
			{ id: "double-prime", char: "″", label: "Double prime (seconde, pouce)" },
			{ id: "ordinal-feminin", char: "ª", label: "Ordinal féminin (espagnol, portugais)" },
			{ id: "ordinal-masculin", char: "º", label: "Ordinal masculin (espagnol, portugais)" },
		],
	},
	{
		category: "Flèches",
		chars: [
			{ id: "fleche-gauche", char: "←", label: "Flèche vers la gauche" },
			{ id: "fleche-droite", char: "→", label: "Flèche vers la droite" },
			{ id: "fleche-haut", char: "↑", label: "Flèche vers le haut" },
			{ id: "fleche-bas", char: "↓", label: "Flèche vers le bas" },
			{ id: "fleche-gauche-droite", char: "↔", label: "Flèche gauche-droite" },
			{ id: "fleche-haut-bas", char: "↕", label: "Flèche haut-bas" },
			{ id: "fleche-haut-gauche", char: "↖", label: "Flèche vers le haut à gauche" },
			{ id: "fleche-haut-droite", char: "↗", label: "Flèche vers le haut à droite" },
			{ id: "fleche-bas-droite", char: "↘", label: "Flèche vers le bas à droite" },
			{ id: "fleche-bas-gauche", char: "↙", label: "Flèche vers le bas à gauche" },
			{ id: "fleche-double-gauche", char: "⇐", label: "Double flèche vers la gauche" },
			{ id: "fleche-double-droite", char: "⇒", label: "Double flèche vers la droite" },
			{ id: "fleche-double-gauche-droite", char: "⇔", label: "Double flèche gauche-droite" },
			{ id: "fleche-retour", char: "↩", label: "Flèche de retour" },
			{ id: "fleche-associe", char: "↦", label: "Flèche « associe à »" },
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
