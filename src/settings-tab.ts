import { App, PluginSettingTab, Setting } from "obsidian";
import { LANGUAGES, isLanguage, t } from "./i18n";
import { newCustomCharId } from "./settings";
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
			.setName(t("settings.language.name"))
			.setDesc(t("settings.language.desc"))
			.addDropdown((dropdown) => {
				for (const language of LANGUAGES) {
					dropdown.addOption(language, t(`settings.language.${language}`));
				}
				dropdown.setValue(this.plugin.settings.language).onChange(async (value) => {
					if (!isLanguage(value)) {
						return;
					}
					this.plugin.settings.language = value;
					await this.plugin.saveSettings();
					this.plugin.applyLanguage();
					// Redraw: the tab itself is in the language just chosen.
					this.display();
				});
			});

		new Setting(containerEl)
			.setName(t("settings.showSpaces.name"))
			.setDesc(t("settings.showSpaces.desc"))
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.showInvisibleSpaces).onChange(async (value) => {
					this.plugin.settings.showInvisibleSpaces = value;
					await this.plugin.saveSettings();
					this.plugin.applyEditorDecorations();
				})
			);

		this.displayCustomChars(containerEl);
	}

	private displayCustomChars(containerEl: HTMLElement) {
		new Setting(containerEl)
			.setName(t("settings.custom.name"))
			.setDesc(t("settings.custom.desc"))
			.addButton((button) =>
				button
					.setButtonText(t("settings.custom.add"))
					.setCta()
					.onClick(async () => {
						this.plugin.settings.customChars.push({
							id: newCustomCharId(),
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
						.setPlaceholder(t("settings.custom.namePlaceholder"))
						.setValue(item.label)
						.onChange(async (value) => {
							item.label = value;
							await this.plugin.saveSettings();
						})
				)
				.addExtraButton((button) =>
					button
						.setIcon("trash")
						.setTooltip(t("settings.custom.delete"))
						.onClick(async () => {
							this.plugin.settings.customChars.splice(index, 1);
							await this.plugin.saveSettings();
							this.display();
						})
				);
		});
	}
}
