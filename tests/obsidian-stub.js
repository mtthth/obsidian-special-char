// Remplace le module « obsidian » pendant les tests : il n'est fourni qu'à
// l'exécution par l'application. Seuls les membres dont main.ts a besoin au
// chargement sont définis ; loadData/saveData permettent d'instancier le
// plugin pour tester la persistance sans écrire sur le disque.
export class Plugin {
	async loadData() {
		return null;
	}

	async saveData(data) {
		this.saveCount = (this.saveCount || 0) + 1;
		this.saved = data;
	}
}

export class Modal {}
export class PluginSettingTab {}
export class Setting {}
// Consigne chaque message affiché : les tests vérifient ce que l'utilisateur lit.
export class Notice {
	static messages = [];
	static classes = [];

	constructor(message) {
		Notice.messages.push(message);
		this.noticeEl = { addClass: (cls) => Notice.classes.push(cls) };
	}
}

export const Platform = { isMobile: false };
