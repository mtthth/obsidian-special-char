// Remplace le module « obsidian » pendant les tests : il n'est fourni qu'à
// l'exécution par l'application. Seuls les membres dont main.ts a besoin au
// chargement sont définis ; loadData/saveData permettent d'instancier le
// plugin pour tester la persistance sans écrire sur le disque.
export class Plugin {
	commands = new Map();

	addCommand(command) {
		this.commands.set(command.id, command);
	}

	removeCommand(id) {
		this.commands.delete(id);
	}

	async loadData() {
		return null;
	}

	async saveData(data) {
		this.saveCount = (this.saveCount || 0) + 1;
		this.saved = data;
	}
}

// Consigne les fenêtres ouvertes : les tests vérifient si la palette s'ouvre.
export class Modal {
	static opened = [];

	open() {
		Modal.opened.push(this);
	}
}

export class MarkdownView {}
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

// Langue d'Obsidian renvoyée par getLanguage() : les tests la fixent.
export const stubApp = { language: "en" };

export function getLanguage() {
	return stubApp.language;
}

// Même contrat que celui d'Obsidian : appel différé de `timeout` ms, délai
// relancé à chaque appel si `resetTimer`, run() pour exécuter tout de suite un
// appel en attente, cancel() pour l'annuler.
export function debounce(cb, timeout = 0, resetTimer = false) {
	let timer = null;
	let pendingArgs = [];
	const fire = () => {
		timer = null;
		return cb(...pendingArgs);
	};
	const debounced = (...args) => {
		pendingArgs = args;
		if (timer && resetTimer) {
			clearTimeout(timer);
			timer = null;
		}
		if (!timer) {
			timer = setTimeout(fire, timeout);
		}
		return debounced;
	};
	debounced.cancel = () => {
		clearTimeout(timer);
		timer = null;
		return debounced;
	};
	debounced.run = () => {
		if (timer) {
			clearTimeout(timer);
			return fire();
		}
	};
	return debounced;
}
