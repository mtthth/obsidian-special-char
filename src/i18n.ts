export type Language = "en" | "fr";

export const LANGUAGES: Language[] = ["en", "fr"];
export const DEFAULT_LANGUAGE: Language = "en";

const EN = {
	"command.picker": "Insert a special character (picker)",
	"command.insert": "Insert: {label}",
	"ribbon.picker": "Insert a special character",
	"notice.noEditor": "Open a note first to insert a special character.",

	"modal.title": "Special characters",
	"modal.placeholder": "Search (e, ß, em, arrow…)",
	"modal.empty": "No character matches this search.",
	"modal.recent": "Recent",
	"modal.custom": "Custom",

	"settings.showSpaces.name": "Show non-breaking spaces in the editor",
	"settings.showSpaces.desc":
		"Highlights the no-break space and narrow no-break space (U+00A0, U+202F) in the editing window, to tell them apart from regular spaces.",
	"settings.language.name": "Language",
	"settings.language.desc": "Language of the plugin's messages and of the character names.",
	"settings.language.en": "English",
	"settings.language.fr": "Français",
	"settings.custom.name": "Custom characters",
	"settings.custom.desc":
		"Your own characters, shown at the top of the picker and found by the search. The name is optional: without it, the code point is used.",
	"settings.custom.add": "Add",
	"settings.custom.namePlaceholder": "Name (optional)",
	"settings.custom.delete": "Delete",
} as const;

export type StringKey = keyof typeof EN;

const FR: Record<StringKey, string> = {
	"command.picker": "Insérer un caractère spécial (fenêtre)",
	"command.insert": "Insérer : {label}",
	"ribbon.picker": "Insérer un caractère spécial",
	"notice.noEditor": "Ouvrez d'abord une note pour insérer un caractère spécial.",

	"modal.title": "Caractères spéciaux",
	"modal.placeholder": "Rechercher (e, ß, cadratin, flèche…)",
	"modal.empty": "Aucun caractère ne correspond à cette recherche.",
	"modal.recent": "Récents",
	"modal.custom": "Personnalisés",

	"settings.showSpaces.name": "Afficher les espaces insécables dans l'éditeur",
	"settings.showSpaces.desc":
		"Encadre visuellement les espaces insécable et fine insécable (U+00A0, U+202F) dans la fenêtre d'édition, pour les distinguer des espaces normales.",
	"settings.language.name": "Langue",
	"settings.language.desc": "Langue des messages du plugin et des noms de caractères.",
	"settings.language.en": "English",
	"settings.language.fr": "Français",
	"settings.custom.name": "Caractères personnalisés",
	"settings.custom.desc":
		"Vos propres caractères, affichés en tête de la fenêtre de sélection et trouvés par la recherche. Le nom est facultatif : sans lui, le point de code est utilisé.",
	"settings.custom.add": "Ajouter",
	"settings.custom.namePlaceholder": "Nom (facultatif)",
	"settings.custom.delete": "Supprimer",
};

const STRINGS: Record<Language, Record<StringKey, string>> = { en: EN, fr: FR };

// The language is plugin-wide state rather than an argument: every message and
// every character name is read at display time, so a change in the settings
// applies to the next window opened without threading a parameter everywhere.
let currentLanguage: Language = DEFAULT_LANGUAGE;

export function setLanguage(language: Language) {
	currentLanguage = language;
}

export function getLanguage(): Language {
	return currentLanguage;
}

export function isLanguage(value: unknown): value is Language {
	return typeof value === "string" && (LANGUAGES as string[]).includes(value);
}

export function t(key: StringKey, vars: Record<string, string> = {}): string {
	return STRINGS[currentLanguage][key].replace(/\{(\w+)\}/g, (match, name) => vars[name] ?? match);
}
