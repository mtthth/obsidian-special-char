import esbuild from "esbuild";
import { mkdirSync, readFileSync } from "fs";
import path from "path";
import { pathToFileURL } from "url";

export const root = path.resolve(import.meta.dirname, "..");

// main.ts n'exporte que la classe du plugin. On en recompile une copie qui
// expose aussi ses fonctions internes : elles sont pures et constituent
// l'essentiel de ce qu'il y a à vérifier, sans avoir à lancer Obsidian.
const INTERNALS = [
	"NNBSP",
	"NBSP",
	"CHAR_GROUPS",
	"ALL_CHARS",
	"DEFAULT_SETTINGS",
	"SpecialCharacterModal",
	"normalizeForSearch",
	"matchesQuery",
	"insertSpecialChar",
	"applyTypography",
	"findWrongSpaces",
];

export async function loadPlugin() {
	const source = readFileSync(path.join(root, "main.ts"), "utf8") + `\nexport { ${INTERNALS.join(", ")} };\n`;
	const outfile = path.join(root, "tests", ".tmp", "bundle.mjs");
	mkdirSync(path.dirname(outfile), { recursive: true });

	await esbuild.build({
		stdin: { contents: source, resolveDir: root, sourcefile: "main.ts", loader: "ts" },
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
	return String(value).replace(/ /g, "⟦fine⟧").replace(/ /g, "⟦insec⟧").replace(/\n/g, "⏎");
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
export class FakeEditor {
	constructor(text, a = 0, b = a) {
		this.text = text;
		this.a = a;
		this.b = b;
	}

	get start() {
		return Math.min(this.a, this.b);
	}

	get end() {
		return Math.max(this.a, this.b);
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

	somethingSelected() {
		return this.a !== this.b;
	}

	getSelection() {
		return this.text.slice(this.start, this.end);
	}

	getCursor(which) {
		if (which === "from") return this.posAt(this.start);
		if (which === "to") return this.posAt(this.end);
		return this.posAt(this.b);
	}

	replaceSelection(str) {
		const { start, end } = this;
		this.text = this.text.slice(0, start) + str + this.text.slice(end);
		this.a = this.b = start + str.length;
	}

	replaceRange(str, from, to) {
		const start = this.offsetAt(from);
		const end = to ? this.offsetAt(to) : start;
		this.text = this.text.slice(0, start) + str + this.text.slice(end);
	}

	setCursor(pos) {
		this.a = this.b = this.offsetAt(pos);
	}

	setSelection(from, to) {
		this.a = this.offsetAt(from);
		this.b = this.offsetAt(to);
	}

	focus() {}
}
