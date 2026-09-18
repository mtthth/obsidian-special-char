import { App, PluginSettingTab, Setting } from "obsidian";
import type SpecialCharactersPlugin from "../main";

export class SpecialCharSettingTab extends PluginSettingTab {
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
				"Marque d'un repère rouge très visible chaque endroit où le français impose une insécable et où elle manque, avant ; ! ? % : et à l'intérieur des guillemets français — que l'espace soit d'un type incorrect ou totalement absente. La commande « Corriger la typographie de la sélection » corrige les deux."
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
