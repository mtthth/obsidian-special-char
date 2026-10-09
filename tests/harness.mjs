import esbuild from "esbuild";
import { mkdirSync } from "fs";
import path from "path";
import { pathToFileURL } from "url";

export const root = path.resolve(import.meta.dirname, "..");

// Entrée synthétique réunissant les modules du plugin en un seul bundle, la
// classe du plugin en export par défaut. Les tests atteignent ainsi les
// fonctions internes : elles sont pures et constituent l'essentiel de ce qu'il
// y a à vérifier, sans avoir à lancer Obsidian.
const ENTRY = [
	`export * from "./src/chars";`,
	// Le stub de Notice consigne les messages : c'est ce que voit l'utilisateur.
	`export { Notice } from "obsidian";`,
	`export * from "./src/i18n";`,
	`export * from "./src/settings";`,
	`export * from "./src/editor-decorations";`,
	`export * from "./src/picker-modal";`,
	`export { default } from "./main";`,
].join("\n");

export async function loadPlugin() {
	const outfile = path.join(root, "tests", ".tmp", "bundle.mjs");
	mkdirSync(path.dirname(outfile), { recursive: true });

	await esbuild.build({
		stdin: { contents: ENTRY, resolveDir: root, sourcefile: "tests-entry.ts", loader: "ts" },
		bundle: true,
		format: "esm",
		outfile,
		alias: { obsidian: path.join(root, "tests", "obsidian-stub.js") },
		logLevel: "warning",
	});

	return import(pathToFileURL(outfile).href);
}

const failures = [];

// Rend visibles, dans les messages d'échec, les caractères qui ne le sont pas.
export function show(value) {
	const text = typeof value === "string" ? value : JSON.stringify(value);
	return String(text).replace(/ /g, "⟦fine⟧").replace(/ /g, "⟦insec⟧").replace(/\n/g, "⏎");
}

export function check(name, actual, expected) {
	if (JSON.stringify(actual) === JSON.stringify(expected)) {
		console.log(`ok    ${name}`);
		return;
	}
	failures.push(name);
	console.log(`FAIL  ${name}\n        attendu : ${show(expected)}\n        obtenu  : ${show(actual)}`);
}

export function section(title) {
	console.log(`\n--- ${title} ---`);
}

export function report() {
	if (failures.length === 0) {
		console.log("\nTous les tests passent.");
		process.exit(0);
	}
	console.log(`\n${failures.length} échec(s) :\n  ${failures.join("\n  ")}`);
	process.exit(1);
}

// Éditeur minimal : les positions ligne/colonne sont calculées sur le texte
// courant, comme le fait Obsidian, pour vérifier aussi la sélection obtenue.
// Il gère plusieurs sélections, `a` et `b` désignant l'ancre et la tête de la
// principale.
export class FakeEditor {
	constructor(text, a = 0, b = a) {
		this.text = text;
		this.ranges = [{ anchor: a, head: b }];
		this.main = 0;
		this.transactions = 0;
	}

	// Plusieurs sélections, données en positions [ancre, tête].
	static withSelections(text, ranges, main = 0) {
		const editor = new FakeEditor(text);
		editor.ranges = ranges.map(([anchor, head]) => ({ anchor, head }));
		editor.main = main;
		return editor;
	}

	get a() {
		return this.ranges[this.main].anchor;
	}

	get b() {
		return this.ranges[this.main].head;
	}

	get start() {
		return Math.min(this.a, this.b);
	}

	get end() {
		return Math.max(this.a, this.b);
	}

	// Texte de chaque sélection, dans l'ordre du document.
	selectedTexts() {
		return [...this.ranges]
			.sort((x, y) => Math.min(x.anchor, x.head) - Math.min(y.anchor, y.head))
			.map((r) => this.text.slice(Math.min(r.anchor, r.head), Math.max(r.anchor, r.head)));
	}

	posAt(offset) {
		const lines = this.text.slice(0, offset).split("\n");
		return { line: lines.length - 1, ch: lines[lines.length - 1].length };
	}

	offsetAt(pos) {
		const lines = this.text.split("\n");
		let offset = 0;
		for (let i = 0; i < pos.line; i++) {
			offset += lines[i].length + 1;
		}
		return offset + pos.ch;
	}

	getValue() {
		return this.text;
	}

	posToOffset(pos) {
		return this.offsetAt(pos);
	}

	offsetToPos(offset) {
		return this.posAt(offset);
	}

	somethingSelected() {
		return this.ranges.some((r) => r.anchor !== r.head);
	}

	// Comme Obsidian : seule la sélection principale est renvoyée.
	getSelection() {
		return this.text.slice(this.start, this.end);
	}

	getCursor(which) {
		if (which === "from") return this.posAt(this.start);
		if (which === "to") return this.posAt(this.end);
		if (which === "anchor") return this.posAt(this.a);
		return this.posAt(this.b);
	}

	listSelections() {
		return this.ranges.map((r) => ({ anchor: this.posAt(r.anchor), head: this.posAt(r.head) }));
	}

	// Comme CodeMirror : le même texte remplace chacune des sélections.
	replaceSelection(str) {
		const sorted = [...this.ranges].sort((x, y) => Math.min(y.anchor, y.head) - Math.min(x.anchor, x.head));
		for (const r of sorted) {
			const start = Math.min(r.anchor, r.head);
			this.text = this.text.slice(0, start) + str + this.text.slice(Math.max(r.anchor, r.head));
		}
		this.ranges = [{ anchor: this.text.length, head: this.text.length }];
		this.main = 0;
	}

	replaceRange(str, from, to) {
		const start = this.offsetAt(from);
		const end = to ? this.offsetAt(to) : start;
		this.text = this.text.slice(0, start) + str + this.text.slice(end);
	}

	// Les changements sont exprimés dans le document d'avant la transaction :
	// on les applique de la fin vers le début pour que les positions restent
	// valables. À position égale, l'ordre donné est conservé.
	transaction({ changes = [] }) {
		this.transactions++;
		const resolved = changes.map((c, order) => ({
			from: this.offsetAt(c.from),
			to: this.offsetAt(c.to ?? c.from),
			text: c.text,
			order,
		}));
		resolved.sort((x, y) => y.from - x.from || y.order - x.order);
		for (const c of resolved) {
			this.text = this.text.slice(0, c.from) + c.text + this.text.slice(c.to);
		}
	}

	setCursor(pos) {
		const offset = this.offsetAt(pos);
		this.ranges = [{ anchor: offset, head: offset }];
		this.main = 0;
	}

	setSelection(from, to = from) {
		this.ranges = [{ anchor: this.offsetAt(from), head: this.offsetAt(to) }];
		this.main = 0;
	}

	setSelections(ranges, main = 0) {
		this.ranges = ranges.map((r) => ({ anchor: this.offsetAt(r.anchor), head: this.offsetAt(r.head ?? r.anchor) }));
		this.main = main;
	}

	focus() {}
}
