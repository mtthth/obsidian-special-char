import { DEFAULT_LANGUAGE, Language, isLanguage } from "./i18n";

export interface CustomChar {
	id: string;
	char: string;
	label: string;
}

export interface SpecialCharPluginSettings {
	language: Language;
	showInvisibleSpaces: boolean;
	recentChars: string[];
	customChars: CustomChar[];
}

export const DEFAULT_SETTINGS: SpecialCharPluginSettings = {
	language: DEFAULT_LANGUAGE,
	showInvisibleSpaces: true,
	recentChars: [],
	customChars: [],
};

// Nombre de caractères récents retenus : de quoi remplir une ligne de la
// palette sur ordinateur, deux sur mobile.
export const RECENT_COUNT = 6;

export function newCustomCharId(): string {
	return `custom-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

// Réglages lus dans data.json, qui peut avoir été édité à la main ou abîmé par
// une synchro : chaque champ d'un type inattendu reprend sa valeur par défaut.
// Les tableaux sont toujours neufs, pour que modifier les réglages ne touche
// jamais DEFAULT_SETTINGS. Une ligne de caractère personnalisé encore vide est
// gardée — l'utilisateur la remplira dans les réglages — mais chacune reçoit
// des champs texte, sans quoi l'onglet des réglages ne pourrait l'afficher.
export function normalizeSettings(raw: unknown): SpecialCharPluginSettings {
	const data = (typeof raw === "object" && raw !== null ? raw : {}) as Record<string, unknown>;
	const text = (value: unknown) => (typeof value === "string" ? value : "");

	return {
		language: isLanguage(data.language) ? data.language : DEFAULT_LANGUAGE,
		showInvisibleSpaces:
			typeof data.showInvisibleSpaces === "boolean" ? data.showInvisibleSpaces : DEFAULT_SETTINGS.showInvisibleSpaces,
		recentChars: Array.isArray(data.recentChars)
			? data.recentChars.filter((id): id is string => typeof id === "string")
			: [],
		customChars: Array.isArray(data.customChars)
			? data.customChars
					.filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
					.map((item) => ({
						id: typeof item.id === "string" && item.id !== "" ? item.id : newCustomCharId(),
						char: text(item.char),
						label: text(item.label),
					}))
			: [],
	};
}
