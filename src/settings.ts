export interface CustomChar {
	id: string;
	char: string;
	label: string;
}

export interface SpecialCharPluginSettings {
	showInvisibleSpaces: boolean;
	recentChars: string[];
	customChars: CustomChar[];
}

export const DEFAULT_SETTINGS: SpecialCharPluginSettings = {
	showInvisibleSpaces: true,
	recentChars: [],
	customChars: [],
};

// Nombre de caractères récents retenus : de quoi remplir une ligne de la
// palette sur ordinateur, deux sur mobile.
export const RECENT_COUNT = 6;
