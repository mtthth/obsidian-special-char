import { Editor, Modal, Platform } from "obsidian";
import { CHAR_GROUPS, CharGroup, SpecialChar, codePointLabel, matchesQuery, normalizeForSearch } from "./chars";
import type SpecialCharactersPlugin from "../main";

export class SpecialCharacterModal extends Modal {
	private plugin: SpecialCharactersPlugin;
	private editor: Editor;
	private searchEl: HTMLInputElement;
	private resultsEl: HTMLElement;
	private visibleChars: SpecialChar[] = [];

	constructor(plugin: SpecialCharactersPlugin, editor: Editor) {
		super(plugin.app);
		this.plugin = plugin;
		this.editor = editor;
	}

	onOpen() {
		const { contentEl } = this;
		this.modalEl.addClass("special-char-modal");

		contentEl.createEl("h2", { text: "Caractères spéciaux" });

		this.searchEl = contentEl.createEl("input", {
			cls: "special-char-search",
			attr: {
				type: "text",
				placeholder: "Rechercher (cadratin, majuscule, flèche…)",
			},
		});

		this.resultsEl = contentEl.createDiv({ cls: "special-char-results" });
		this.renderResults("");

		this.searchEl.addEventListener("input", () => this.renderResults(this.searchEl.value));
		this.searchEl.addEventListener("keydown", (evt) => this.handleSearchKeydown(evt));
		this.resultsEl.addEventListener("keydown", (evt) => this.handleResultsKeydown(evt));

		// Sur mobile, donner le focus au champ ouvrirait le clavier virtuel
		// par-dessus la palette, alors que l'usage y est tactile.
		if (!Platform.isMobile) {
			this.searchEl.focus();
		}
	}

	onClose() {
		this.contentEl.empty();
	}

	// Les caractères personnalisés passent devant la liste intégrée : c'est une
	// courte liste choisie par l'utilisateur, la reléguer sous 43 entrées la
	// rendrait inutile. Les récents, eux, ne s'affichent qu'en l'absence de
	// recherche : pendant un filtrage, ils feraient apparaître deux fois les
	// mêmes caractères.
	private groupsToRender(hasQuery: boolean): CharGroup[] {
		const custom = this.plugin.getCustomChars();
		const groups =
			custom.length > 0 ? [{ category: "Personnalisés", chars: custom }, ...CHAR_GROUPS] : CHAR_GROUPS;

		if (hasQuery) {
			return groups;
		}

		const recents = this.plugin.getRecentChars();
		return recents.length > 0 ? [{ category: "Récents", chars: recents }, ...groups] : groups;
	}

	private renderResults(query: string) {
		const normalizedQuery = normalizeForSearch(query.trim());

		this.resultsEl.empty();
		this.visibleChars = [];

		for (const group of this.groupsToRender(normalizedQuery.length > 0)) {
			const matches = group.chars.filter((item) => matchesQuery(item, group.category, normalizedQuery));
			if (matches.length === 0) {
				continue;
			}

			const section = this.resultsEl.createDiv({ cls: "special-char-section" });
			section.createDiv({ cls: "special-char-section-title", text: group.category });
			const list = section.createDiv({ cls: "special-char-list" });

			for (const item of matches) {
				this.visibleChars.push(item);
				this.createCharButton(list, item);
			}
		}

		if (this.visibleChars.length === 0) {
			this.resultsEl.createDiv({
				cls: "special-char-empty",
				text: "Aucun caractère ne correspond à cette recherche.",
			});
		}
	}

	private createCharButton(parent: HTMLElement, item: SpecialChar) {
		const code = codePointLabel(item.char);
		const button = parent.createEl("button", {
			cls: "special-char-button",
			attr: {
				"aria-label": `${item.label} (${code})`,
				title: `${item.label} — ${code}`,
			},
		});

		button.createDiv({ cls: "special-char-preview", text: item.preview ?? item.char });
		button.createDiv({ cls: "special-char-label", text: item.label });

		button.addEventListener("click", () => this.chooseChar(item));
	}

	private handleSearchKeydown(evt: KeyboardEvent) {
		if (evt.key === "Enter") {
			evt.preventDefault();
			const first = this.visibleChars[0];
			if (first) {
				this.chooseChar(first);
			}
		} else if (evt.key === "ArrowDown") {
			evt.preventDefault();
			this.focusButton(0);
		}
	}

	private handleResultsKeydown(evt: KeyboardEvent) {
		const forward = evt.key === "ArrowRight" || evt.key === "ArrowDown";
		const backward = evt.key === "ArrowLeft" || evt.key === "ArrowUp";
		if (!forward && !backward) {
			return;
		}

		const buttons = this.getButtons();
		const current = buttons.indexOf(this.resultsEl.ownerDocument.activeElement as HTMLButtonElement);
		if (current === -1) {
			return;
		}

		evt.preventDefault();
		if (backward && current === 0) {
			this.searchEl.focus();
		} else {
			this.focusButton(current + (forward ? 1 : -1));
		}
	}

	private getButtons(): HTMLButtonElement[] {
		return Array.from(this.resultsEl.querySelectorAll<HTMLButtonElement>("button"));
	}

	private focusButton(index: number) {
		const buttons = this.getButtons();
		if (buttons.length === 0) {
			return;
		}
		buttons[Math.max(0, Math.min(index, buttons.length - 1))].focus();
	}

	private chooseChar(item: SpecialChar) {
		this.plugin.insertChar(this.editor, item);
		this.close();
		this.editor.focus();
	}
}
