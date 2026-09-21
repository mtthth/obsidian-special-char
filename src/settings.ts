import type { LanguageSetting } from "./language";

export interface CustomChar {
	id: string;
	char: string;
	label: string;
}

export interface SpecialCharPluginSettings {
	showInvisibleSpaces: boolean;
	flagWrongSpaces: boolean;
	// Langue des notes qui ne déclarent pas la leur. « fr » par défaut : c'était
	// le comportement avant que la langue ne soit un réglage.
	defaultLanguage: LanguageSetting;
	recentChars: string[];
	customChars: CustomChar[];
}

export const DEFAULT_SETTINGS: SpecialCharPluginSettings = {
	showInvisibleSpaces: true,
	flagWrongSpaces: true,
	defaultLanguage: "fr",
	recentChars: [],
	customChars: [],
};

// Nombre de caractères récents retenus : de quoi remplir une ligne de la
// palette sur ordinateur, deux sur mobile.
export const RECENT_COUNT = 6;
