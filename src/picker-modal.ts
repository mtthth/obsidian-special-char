import { Editor, Modal, Platform } from "obsidian";
import { CHAR_GROUPS, CharGroup, SpecialChar, charLabel, codePointLabel, groupName, matchesQuery, normalizeForSearch } from "./chars";
import { t } from "./i18n";
import type SpecialCharactersPlugin from "../main";

export interface Box {
	left: number;
	top: number;
	width: number;
}

// Bouton de la ligne voisine, au-dessus (-1) ou en dessous (1), le plus proche
// horizontalement ; -1 s'il n'y en a pas. Calculé sur les positions à l'écran :
// le nombre de colonnes dépend de la largeur de la fenêtre, et chaque section
// de la palette est une grille à part, souvent plus courte que les autres.
export function verticalNeighbor(boxes: Box[], current: number, direction: 1 | -1): number {
	const here = boxes[current];
	// Les boutons d'une même ligne ont le même haut, à l'arrondi près.
	const TOLERANCE = 2;
	let rowTop: number | null = null;
	for (const box of boxes) {
		const distance = direction * (box.top - here.top);
		if (distance > TOLERANCE && (rowTop === null || distance < direction * (rowTop - here.top))) {
			rowTop = box.top;
		}
	}
	if (rowTop === null) {
		return -1;
	}

	const centerOf = (box: Box) => box.left + box.width / 2;
	let best = -1;
	boxes.forEach((box, index) => {
		if (
			Math.abs(box.top - (rowTop as number)) <= TOLERANCE &&
			(best === -1 || Math.abs(centerOf(box) - centerOf(here)) < Math.abs(centerOf(boxes[best]) - centerOf(here)))
		) {
			best = index;
		}
	});
	return best;
}

export class SpecialCharacterModal extends Modal {
	private plugin: SpecialCharactersPlugin;
	private editor: Editor;
	// Créés dans onOpen(), avant tout usage.
	private searchEl!: HTMLInputElement;
	private resultsEl!: HTMLElement;
	private visibleChars: SpecialChar[] = [];

	constructor(plugin: SpecialCharactersPlugin, editor: Editor) {
		super(plugin.app);
		this.plugin = plugin;
		this.editor = editor;
	}

	onOpen() {
		const { contentEl } = this;
		this.modalEl.addClass("special-char-modal");

		contentEl.createEl("h2", { text: t("modal.title") });

		this.searchEl = contentEl.createEl("input", {
			cls: "special-char-search",
			attr: {
				type: "text",
				placeholder: t("modal.placeholder"),
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
	// courte liste choisie par l'utilisateur, la reléguer sous plus de 300 entrées
	// la rendrait inutile. Les récents, eux, ne s'affichent qu'en l'absence de
	// recherche : pendant un filtrage, ils feraient apparaître deux fois les
	// mêmes caractères.
	private groupsToRender(hasQuery: boolean): CharGroup[] {
		const custom = this.plugin.getCustomChars();
		const groups =
			custom.length > 0 ? [{ category: t("modal.custom"), chars: custom }, ...CHAR_GROUPS] : CHAR_GROUPS;

		if (hasQuery) {
			return groups;
		}

		const recents = this.plugin.getRecentChars();
		return recents.length > 0 ? [{ category: t("modal.recent"), chars: recents }, ...groups] : groups;
	}

	private renderResults(query: string) {
		const normalizedQuery = normalizeForSearch(query.trim());

		this.resultsEl.empty();
		this.visibleChars = [];

		for (const group of this.groupsToRender(normalizedQuery.length > 0)) {
			const matches = group.chars.filter((item) => matchesQuery(item, groupName(group), normalizedQuery));
			if (matches.length === 0) {
				continue;
			}

			const section = this.resultsEl.createDiv({ cls: "special-char-section" });
			section.createDiv({ cls: "special-char-section-title", text: groupName(group) });
			const list = section.createDiv({ cls: "special-char-list" });

			for (const item of matches) {
				this.visibleChars.push(item);
				this.createCharButton(list, item);
			}
		}

		if (this.visibleChars.length === 0) {
			this.resultsEl.createDiv({
				cls: "special-char-empty",
				text: t("modal.empty"),
			});
		}
	}

	private createCharButton(parent: HTMLElement, item: SpecialChar) {
		const code = codePointLabel(item.char);
		const label = charLabel(item);
		const button = parent.createEl("button", {
			cls: "special-char-button",
			attr: {
				"aria-label": `${label} (${code})`,
				title: `${label} — ${code}`,
			},
		});

		button.createDiv({ cls: "special-char-preview", text: item.preview ?? item.char });
		button.createDiv({ cls: "special-char-label", text: label });

		button.addEventListener("click", () => this.chooseChar(item));
	}

	private handleSearchKeydown(evt: KeyboardEvent) {
		// Pendant une saisie par IME (japonais, chinois…), Entrée valide le mot
		// en cours de composition : elle ne doit rien insérer. Safari signale
		// ces touches par le keyCode 229 plutôt que par isComposing.
		if (evt.isComposing || evt.keyCode === 229) {
			return;
		}
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

	// Gauche et droite suivent l'ordre des boutons ; haut et bas changent de
	// ligne. Remonter depuis la première ligne, ou reculer depuis le premier
	// bouton, rend le focus au champ de recherche.
	private handleResultsKeydown(evt: KeyboardEvent) {
		const horizontal = evt.key === "ArrowLeft" || evt.key === "ArrowRight";
		const vertical = evt.key === "ArrowUp" || evt.key === "ArrowDown";
		if (!horizontal && !vertical) {
			return;
		}

		const buttons = this.getButtons();
		const current = buttons.indexOf(this.resultsEl.ownerDocument.activeElement as HTMLButtonElement);
		if (current === -1) {
			return;
		}

		evt.preventDefault();
		if (horizontal) {
			if (evt.key === "ArrowLeft" && current === 0) {
				this.searchEl.focus();
			} else {
				this.focusButton(current + (evt.key === "ArrowRight" ? 1 : -1));
			}
			return;
		}

		const boxes = buttons.map((button) => button.getBoundingClientRect());
		const target = verticalNeighbor(boxes, current, evt.key === "ArrowDown" ? 1 : -1);
		if (target !== -1) {
			buttons[target].focus();
		} else if (evt.key === "ArrowUp") {
			this.searchEl.focus();
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
