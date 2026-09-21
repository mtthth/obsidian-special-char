import { protectedRanges } from "./typography";

export type Lang = "fr" | "en";
export type LanguageSetting = Lang | "auto" | "off";

export const LANGUAGE_SETTINGS: LanguageSetting[] = ["fr", "en", "auto", "off"];

export const LANGUAGE_SETTING_LABELS: Record<LanguageSetting, string> = {
	fr: "Français",
	en: "Anglais",
	auto: "Automatique",
	off: "Aucune",
};

const LANGUAGE_NAMES: Record<Lang, string> = { fr: "français", en: "anglais" };

// Longueur du début de note examiné, propriété comme détection. Assez pour un
// bloc de métadonnées copieux et un échantillon de prose représentatif, assez
// court pour être relu à chaque frappe sans que cela se sente.
export const LANGUAGE_SCAN_LIMIT = 16000;

// Une portion de texte et la langue qui s'y applique : null pour aucune.
export interface LangSpan {
	from: number;
	to: number;
	lang: Lang | null;
}

export interface LanguageResolution {
	// null : aucune règle ne s'applique à cette note.
	lang: Lang | null;
	source: "property" | "setting" | "detection";
	// Source « property » : la clé et la valeur lues dans les métadonnées.
	key?: string;
	value?: string;
	// Source « detection » : les mots-outils comptés pour chaque langue.
	scores?: { fr: number; en: number };
}

// Clés reconnues dans le bloc de métadonnées, sans distinction de casse.
export const PROPERTY_KEYS = ["lang", "language", "langue"];

const LANGUAGE_TAGS = new Map<string, Lang>([
	["fr", "fr"],
	["fra", "fr"],
	["fre", "fr"],
	["french", "fr"],
	["francais", "fr"],
	["en", "en"],
	["eng", "en"],
	["english", "en"],
	["anglais", "en"],
]);

// « fr-FR », « en_US », « Français » : on ne garde que la langue, sans région
// ni accent ni casse.
function parseLanguageTag(value: string): Lang | null {
	const tag = value.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "").split(/[-_]/)[0];
	return LANGUAGE_TAGS.get(tag) ?? null;
}

// Un « --- » sans fence fermante est une barre horizontale, pas des métadonnées :
// c'est aussi la règle du signalement dans l'éditeur.
function frontmatterLines(text: string): string[] | null {
	const lines = text.split(/\r?\n/);
	if (lines[0].trimEnd() !== "---") {
		return null;
	}
	const end = lines.findIndex((line, index) => index > 0 && line.trimEnd() === "---");

	return end === -1 ? null : lines.slice(1, end);
}

// Valeur YAML scalaire : entre guillemets, ou nue avec un éventuel commentaire.
function cleanValue(raw: string): string {
	const value = raw.trim();
	const quoted = /^(["'])(.*?)\1/.exec(value);

	return (quoted ? quoted[2] : value.replace(/\s+#.*$/, "")).trim();
}

function readProperty(text: string): { key: string; value: string } | null {
	for (const line of frontmatterLines(text) ?? []) {
		// Colonne 0 seulement : une clé imbriquée n'est pas celle de la note.
		const match = /^(\w+)[ \t]*:(.*)$/.exec(line);
		if (!match || !PROPERTY_KEYS.includes(match[1].toLowerCase())) {
			continue;
		}
		const value = cleanValue(match[2]);
		if (value !== "") {
			return { key: match[1], value };
		}
	}

	return null;
}

// Mots-outils qui n'appartiennent qu'à une seule langue. Les mots communs aux
// deux en sont exclus (a, on, as, me, or, plus, an) ou pris dans un autre sens
// (« but » est un but en français) : mieux vaut peu d'indices sûrs que beaucoup
// d'ambigus.
export const STOPWORDS: Record<Lang, Set<string>> = {
	fr: new Set(
		"le la les un une des du de et en est sont dans pour que qui pas ne nous vous ils elles avec sur mais cette ces au aux à où ce se son sa ses leur leurs il elle je tu été être fait très aussi sans ont comme".split(
			" "
		)
	),
	en: new Set(
		"the and of to is are was were that this with for not you they we have has had be been will would can from by at it its in which their there what when who if".split(
			" "
		)
	),
};

// Indices minimaux pour trancher : de quoi écarter une note de deux lignes, et
// un écart net pour ne pas trancher une note réellement bilingue.
const MIN_HITS = 4;
const MIN_RATIO = 2;

// Un paragraphe est plus court qu'une note : il faut de quoi l'évaluer (assez
// de mots) mais moins de mots-outils pour conclure.
export const PARAGRAPH_MIN_WORDS = 8;
export const PARAGRAPH_MIN_HITS = 3;

interface WordCounts {
	fr: number;
	en: number;
	words: number;
}

function countWords(prose: string): WordCounts {
	const counts = { fr: 0, en: 0, words: 0 };
	for (const [word] of prose.toLowerCase().matchAll(/\p{L}+/gu)) {
		counts.words++;
		if (STOPWORDS.fr.has(word)) counts.fr++;
		if (STOPWORDS.en.has(word)) counts.en++;
	}

	return counts;
}

function decide(counts: WordCounts, minHits: number): Lang | null {
	const [winner, loser]: [Lang, Lang] = counts.fr >= counts.en ? ["fr", "en"] : ["en", "fr"];

	return counts[winner] >= minHits && counts[winner] >= MIN_RATIO * counts[loser] ? winner : null;
}

export function detectLanguage(text: string): { lang: Lang | null; scores: { fr: number; en: number } } {
	const sample = text.slice(0, LANGUAGE_SCAN_LIMIT);

	// Le code, les URL et les métadonnées ne disent rien de la langue de la note :
	// un mot-clé comme « if » ou « in » ferait pencher pour l'anglais.
	let prose = "";
	let last = 0;
	for (const [start, end] of protectedRanges(sample)) {
		prose += sample.slice(last, start) + " ";
		last = end;
	}
	prose += sample.slice(last);

	const counts = countWords(prose);

	return { lang: decide(counts, MIN_HITS), scores: { fr: counts.fr, en: counts.en } };
}

// Langue d'une note, par ordre de priorité : la propriété de ses métadonnées,
// puis la langue par défaut des réglages (ou la détection, si elle est réglée
// sur « automatique »). Une propriété qui nomme une langue non prise en charge
// désactive les règles : mieux vaut ne rien faire que appliquer celles d'une
// autre langue.
export function resolveLanguage(text: string, defaultLanguage: LanguageSetting): LanguageResolution {
	const head = text.slice(0, LANGUAGE_SCAN_LIMIT);

	const property = readProperty(head);
	if (property) {
		return { lang: parseLanguageTag(property.value), source: "property", ...property };
	}
	if (defaultLanguage === "auto") {
		const { lang, scores } = detectLanguage(head);
		return { lang, source: "detection", scores };
	}

	return { lang: defaultLanguage === "off" ? null : defaultLanguage, source: "setting" };
}

// La langue d'un paragraphe précise celle de la note, elle ne la remplace pas là
// où la note a choisi de n'en avoir aucune : réglage « Aucune », ou langue non
// prise en charge. Une note « automatique » que la détection n'a pas tranchée
// (typiquement une note bilingue) reste en revanche ouverte : c'est chaque
// paragraphe qui décide.
export function paragraphDetectionApplies(note: LanguageResolution): boolean {
	return note.lang !== null || note.source === "detection";
}

// Le texte dont on a retiré ce que la langue ne concerne pas — code, formules,
// liens, URL, métadonnées — en conservant les positions : chaque caractère est
// remplacé par une espace, les sauts de ligne étant gardés. Un bloc de code
// devient ainsi des lignes vides, donc une frontière entre paragraphes.
export function maskProtected(text: string): string {
	let masked = "";
	let last = 0;
	for (const [start, end] of protectedRanges(text)) {
		masked += text.slice(last, start) + text.slice(start, end).replace(/[^\r\n]/g, " ");
		last = end;
	}

	return masked + text.slice(last);
}

// Un paragraphe est un bloc de lignes non vides, une ligne d'espaces comptant
// pour vide. La fin est celle de la dernière ligne, sans son retour chariot.
export function paragraphsOf(masked: string): { from: number; to: number }[] {
	const paragraphs: { from: number; to: number }[] = [];
	let current: { from: number; to: number } | null = null;
	let offset = 0;

	for (const line of masked.split("\n")) {
		if (line.trim() === "") {
			if (current) paragraphs.push(current);
			current = null;
		} else if (current) {
			current.to = offset + line.trimEnd().length;
		} else {
			current = { from: offset, to: offset + line.trimEnd().length };
		}
		offset += line.length + 1;
	}
	if (current) paragraphs.push(current);

	return paragraphs;
}

interface ParagraphVerdict {
	lang: Lang | null;
	scores: { fr: number; en: number };
	words: number;
	// Pourquoi il n'y a pas de verdict.
	reason?: "short" | "unclear";
}

function judgeParagraph(prose: string): ParagraphVerdict {
	const counts = countWords(prose);
	const scores = { fr: counts.fr, en: counts.en };

	if (counts.words < PARAGRAPH_MIN_WORDS) {
		return { lang: null, scores, words: counts.words, reason: "short" };
	}
	const lang = decide(counts, PARAGRAPH_MIN_HITS);

	return lang ? { lang, scores, words: counts.words } : { lang: null, scores, words: counts.words, reason: "unclear" };
}

// Un passage dont l'auteur a fixé la langue à la main, par une balise
// `<span lang="en">…</span>`. `from` et `to` bornent le contenu, balises exclues ;
// `lang` est null quand la langue nommée n'est pas prise en charge, auquel cas le
// passage est laissé tel quel ; `value` est ce qui a été écrit.
export interface ForcedRange {
	from: number;
	to: number;
	lang: Lang | null;
	value: string;
}

// Ouverture d'un span portant un attribut lang, entre guillemets doubles,
// simples ou nus. L'espace exigée avant « lang » écarte data-lang et xml:lang.
const LANG_SPAN_RE = /<span\s(?:[^>\n]*?\s)?lang\s*=\s*(?:"([^"\n]*)"|'([^'\n]*)'|([^\s"'>]+))[^>\n]*>/gi;
const SPAN_TAG_RE = /<(\/?)span\b[^>\n]*>/gi;
// Un passage forcé reste dans son paragraphe : une ligne vide le coupe, comme
// elle coupe tout élément en ligne du markdown.
const BLANK_LINE_RE = /\n[ \t]*\r?\n/;

// Les balises `span lang` du texte, avec leur contenu, dans l'ordre d'ouverture :
// un passage imbriqué vient donc après celui qui l'entoure. Ne comptent que les
// vraies balises — celles qu'un extrait de code ou de documentation contiendrait
// (`<span lang="en">` entre accents graves) sont ignorées, comme une balise sans
// fermeture, sans valeur, ou dont le contenu traverse une ligne vide.
export function forcedRanges(text: string): ForcedRange[] {
	if (!/lang\s*=/i.test(text)) {
		return [];
	}

	// Une balise réelle est exactement une portion protégée : dans du code, la
	// portion protégée est le code entier, plus grande que la balise.
	const realTags = new Set(protectedRanges(text).map(([start, end]) => `${start}:${end}`));
	const isRealTag = (match: RegExpExecArray | RegExpMatchArray) =>
		realTags.has(`${match.index}:${(match.index ?? 0) + match[0].length}`);

	const ranges: ForcedRange[] = [];
	for (const open of text.matchAll(LANG_SPAN_RE)) {
		const value = (open[1] ?? open[2] ?? open[3] ?? "").trim();
		if (value === "" || !isRealTag(open)) {
			continue;
		}

		// La fermeture qui équilibre cette ouverture : les span imbriqués, avec ou
		// sans lang, comptent aussi.
		const from = (open.index ?? 0) + open[0].length;
		const tags = new RegExp(SPAN_TAG_RE.source, "gi");
		tags.lastIndex = from;
		let depth = 1;
		let to = -1;
		for (let tag = tags.exec(text); tag !== null && to === -1; tag = tags.exec(text)) {
			if (isRealTag(tag)) {
				depth += tag[1] ? -1 : 1;
				if (depth === 0) to = tag.index;
			}
		}

		if (to !== -1 && !BLANK_LINE_RE.test(text.slice(from, to))) {
			ranges.push({ from, to, lang: parseLanguageTag(value), value });
		}
	}

	return ranges;
}

// Remplace ce que recouvrent les passages forcés par un caractère qui n'est ni
// une lettre ni une espace : leurs mots n'entrent plus dans le décompte du
// paragraphe qui les contient, et leurs lignes n'y deviennent pas vides, donc
// ne le coupent pas.
function maskForced(masked: string, ranges: ForcedRange[]): string {
	let result = masked;
	for (const { from, to } of ranges) {
		result = result.slice(0, from) + result.slice(from, to).replace(/[^\r\n]/g, "_") + result.slice(to);
	}

	return result;
}

// Étend un segment à la portion [from, to[ : les segments qu'elle recouvre sont
// coupés, et la portion prend la langue donnée.
function overlay(spans: LangSpan[], from: number, to: number, lang: Lang | null): LangSpan[] {
	const result: LangSpan[] = [];

	for (const span of spans) {
		if (span.to <= from || span.from >= to) {
			result.push(span);
			continue;
		}
		if (span.from < from) result.push({ from: span.from, to: from, lang: span.lang });
		result.push({ from: Math.max(span.from, from), to: Math.min(span.to, to), lang });
		if (span.to > to) result.push({ from: to, to: span.to, lang: span.lang });
	}

	return result;
}

function paragraphSpans(masked: string, lang: Lang | null): LangSpan[] {
	const spans: LangSpan[] = [];
	let cursor = 0;

	for (const paragraph of paragraphsOf(masked)) {
		if (paragraph.from > cursor) {
			spans.push({ from: cursor, to: paragraph.from, lang });
		}
		const verdict = judgeParagraph(masked.slice(paragraph.from, paragraph.to));
		spans.push({ from: paragraph.from, to: paragraph.to, lang: verdict.lang ?? lang });
		cursor = paragraph.to;
	}
	// Ce qui suit le dernier paragraphe, ou tout le texte s'il n'y en a aucun.
	if (cursor < masked.length || spans.length === 0) {
		spans.push({ from: cursor, to: masked.length, lang });
	}

	return spans;
}

// Langue de chaque portion du texte, bout à bout et sans trou, de la plus
// générale à la plus précise : la note ; puis, si la détection par paragraphe
// s'applique, un paragraphe qui a son propre verdict — les autres, trop courts ou
// indécis, suivent la note, tout comme ce qui n'est pas un paragraphe (lignes
// vides, code) ; enfin un passage forcé à la main par `<span lang>`, qui l'emporte
// sur tout, même dans une note qui n'a volontairement aucune langue : c'est un
// choix explicite, et plus précis encore.
//
// Le texte doit contenir les paragraphes en entier : un paragraphe coupé n'a plus
// assez de mots pour être jugé.
export function languageSpans(text: string, lang: Lang | null, paragraphs: boolean): LangSpan[] {
	const forced = forcedRanges(text);
	let spans = paragraphs
		? paragraphSpans(maskForced(maskProtected(text), forced), lang)
		: [{ from: 0, to: text.length, lang }];

	for (const range of forced) {
		spans = overlay(spans, range.from, range.to, range.lang);
	}

	return spans;
}

export interface ParagraphResolution {
	lang: Lang | null;
	// « forced » : un `<span lang>` entoure la position, `value` dit ce qu'il
	// porte ; « detected » : la langue propre au paragraphe ; « inherited » :
	// celle de la note, faute de mieux — voir `reason`.
	origin: "forced" | "detected" | "inherited";
	reason?: "excluded" | "outside" | "short" | "unclear";
	scores?: { fr: number; en: number };
	words?: number;
	value?: string;
}

// Langue du paragraphe qui contient la position donnée, avec la raison quand il
// n'a pas la sienne. Un passage forcé qui l'entoure passe avant : le plus
// intérieur, s'ils sont imbriqués — c'est le dernier ouvert. Le curseur juste
// après l'ouverture ou juste avant la fermeture est encore dans le passage.
export function resolveParagraph(text: string, offset: number, note: LanguageResolution): ParagraphResolution {
	const forced = forcedRanges(text);
	const inner = forced.filter((range) => offset >= range.from && offset <= range.to).pop();
	if (inner) {
		return { lang: inner.lang, origin: "forced", value: inner.value };
	}

	if (!paragraphDetectionApplies(note)) {
		return { lang: note.lang, origin: "inherited", reason: "excluded" };
	}

	const masked = maskForced(maskProtected(text), forced);
	const paragraph = paragraphsOf(masked).find((p) => offset >= p.from && offset <= p.to);
	if (!paragraph) {
		return { lang: note.lang, origin: "inherited", reason: "outside" };
	}

	const { lang, scores, words, reason } = judgeParagraph(masked.slice(paragraph.from, paragraph.to));

	return lang
		? { lang, origin: "detected", scores, words }
		: { lang: note.lang, origin: "inherited", reason, scores, words };
}

function languageLine(resolution: LanguageResolution): string {
	if (resolution.lang) {
		return LANGUAGE_NAMES[resolution.lang];
	}
	if (resolution.source === "property") {
		return `non prise en charge (« ${resolution.value} »)`;
	}

	return resolution.source === "detection" ? "indéterminée" : "aucune";
}

function sourceLine(resolution: LanguageResolution): string {
	if (resolution.source === "property") {
		return `propriété « ${resolution.key} » de la note (valeur : « ${resolution.value} »)`;
	}
	if (resolution.source === "detection") {
		const { fr, en } = resolution.scores ?? { fr: 0, en: 0 };
		const counts = `mots-outils : français ${fr}, anglais ${en}`;
		return resolution.lang
			? `détection automatique (${counts})`
			: `détection automatique, sans conclusion (${counts}) — trop peu d'indices, ou trop partagés`;
	}

	return "langue par défaut des réglages";
}

function effectLine(lang: Lang | null, where = "sur cette note"): string {
	if (lang === "fr") return "correction et repérage selon les règles françaises";
	if (lang === "en") return "correction selon les règles anglaises, sans repérage des espaces";

	return `ni correction ni repérage ${where}`;
}

const wordCount = (n: number) => `${n} mot${n > 1 ? "s" : ""}`;

function paragraphSourceLine(paragraph: ParagraphResolution): string {
	const { fr, en } = paragraph.scores ?? { fr: 0, en: 0 };
	const counts = `mots-outils : français ${fr}, anglais ${en} ; ${wordCount(paragraph.words ?? 0)}`;

	if (paragraph.origin === "forced") {
		return `balise <span lang="${paragraph.value}"> autour du curseur`;
	}
	if (paragraph.origin === "detected") {
		return `détection du paragraphe (${counts})`;
	}
	switch (paragraph.reason) {
		case "excluded":
			return "hérite de la note — elle n'a volontairement aucune langue : pas de détection par paragraphe";
		case "outside":
			return "hérite de la note — le curseur n'est dans aucun paragraphe de texte (ligne vide, code ou métadonnées)";
		case "short":
			return `hérite de la note — paragraphe trop court (${wordCount(paragraph.words ?? 0)}, ${PARAGRAPH_MIN_WORDS} requis)`;
		default:
			return `hérite de la note — détection sans conclusion (${counts})`;
	}
}

// Texte du diagnostic, une information par ligne : ce qui a été retenu, d'où
// cela vient, et ce que cela change. Le paragraphe, s'il est fourni, vient dans
// un second bloc, après une ligne vide.
export function describeLanguage(
	resolution: LanguageResolution,
	defaultLanguage: LanguageSetting,
	paragraph?: ParagraphResolution
): string[] {
	const lines = [
		`Langue de la note : ${languageLine(resolution)}`,
		`Source : ${sourceLine(resolution)}`,
		`Langue par défaut des réglages : ${LANGUAGE_SETTING_LABELS[defaultLanguage]}`,
		`Effet : ${effectLine(resolution.lang)}`,
	];
	if (!paragraph) {
		return lines;
	}

	// Un passage forcé dans une langue non prise en charge se dit lui-même ; un
	// paragraphe qui hérite emprunte le libellé de la note.
	const forcedUnsupported = paragraph.origin === "forced" && paragraph.lang === null;
	const label = paragraph.lang
		? LANGUAGE_NAMES[paragraph.lang]
		: forcedUnsupported
			? `non prise en charge (« ${paragraph.value} »)`
			: languageLine(resolution);

	return [
		...lines,
		"",
		`Paragraphe sous le curseur : ${label}`,
		`Source : ${paragraphSourceLine(paragraph)}`,
		`Effet : ${effectLine(paragraph.lang, forcedUnsupported ? "dans cette balise" : undefined)}`,
	];
}
