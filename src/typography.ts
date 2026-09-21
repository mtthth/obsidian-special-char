import { NBSP, NNBSP } from "./chars";
import type { Lang, LangSpan } from "./language";

// Portions que la correction typographique ne doit jamais toucher : code,
// maths, liens, URL. Le premier motif ne s'applique qu'en début de sélection
// (pas de drapeau `m`) : c'est le bloc de métadonnées, qu'une espace insécable
// avant « : » casserait.
const PROTECTED_RE = new RegExp(
	[
		"^---\\r?\\n[\\s\\S]*?\\r?\\n---",
		"```[\\s\\S]*?```",
		"`[^`\\n]*`",
		"\\$\\$[\\s\\S]*?\\$\\$",
		"\\$[^\\s$][^$\\n]*\\$",
		"!?\\[\\[[^\\]\\n]*\\]\\]",
		"!?\\[[^\\]\\n]*\\]\\([^)\\n]*\\)",
		// Définition de référence « [ref]: url » ou de note de bas de page
		// « [^1]: texte », reconnue en début de ligne seulement — ailleurs,
		// « [ceci]: cela » est de la prose ordinaire. Seul le libellé et son
		// deux-points sont couverts : le texte d'une note reste de la prose, à
		// corriger comme le reste.
		"(?<=^|\\n)[ \\t]{0,3}\\[\\^?[^\\]\\n]*\\]:",
		// Marqueur d'un bloc de citation spécial (callout) : [!NOTE], [!WARNING]-…
		"\\[!\\w+\\][+-]?",
		// Entité HTML : &nbsp; &amp; &#39; &#x27;…
		"&(?:[a-zA-Z]+|#\\d+|#x[0-9a-fA-F]+);",
		// Commentaire Obsidian, invisible en lecture : %% … %%, sur une ou
		// plusieurs lignes.
		"%%[\\s\\S]*?%%",
		"<[^>\\n]+>",
		"[a-z][a-z0-9+.-]*:\\/\\/\\S+",
		"www\\.\\S+",
	].join("|"),
	"g"
);

interface TypoRule {
	pattern: RegExp;
	replacement: string;
}

// Règles communes aux deux langues.
const ELLIPSIS_RULE: TypoRule = { pattern: /\.\.\./g, replacement: "…" };
const STRAY_COMMA_SPACE_RULE: TypoRule = { pattern: /[^\S\r\n]+,/g, replacement: "," };

// Règles de typographie française, appliquées dans cet ordre. Toutes n'avalent
// que des espaces horizontales ([^\S\r\n], qui couvre aussi les insécables
// existantes) : une règle ne peut donc jamais fusionner deux lignes, et
// réappliquer la commande sur un texte déjà correct ne change rien.
const FRENCH_RULES: TypoRule[] = [
	// Guillemets droits appariés sur une même ligne → guillemets français.
	{ pattern: /"([^"\n]*)"/g, replacement: `«${NNBSP}$1${NNBSP}»` },
	// Apostrophe droite → apostrophe typographique.
	{ pattern: /'/g, replacement: "’" },
	// Trois points → véritables points de suspension.
	ELLIPSIS_RULE,
	// Espace parasite avant une virgule.
	STRAY_COMMA_SPACE_RULE,
	// Espace fine insécable avant ; ! ? — les suites comme « ?! » n'en
	// reçoivent qu'une seule, et un signe en début de ligne est laissé tel quel.
	{ pattern: /(\S)[^\S\r\n]*([;!?]+)/g, replacement: `$1${NNBSP}$2` },
	// ... et avant le % d'un pourcentage. Un « %% », délimiteur de commentaire
	// Obsidian, n'en est pas un : `%(?!%)` l'écarte, où qu'il suive un chiffre.
	{ pattern: /(\d)[^\S\r\n]*%(?!%)/g, replacement: `$1${NNBSP}%` },
	// Espace insécable avant un deux-points, uniquement s'il termine un mot et
	// est suivi d'une espace, d'une fin de ligne ou d'un marqueur d'emphase :
	// 12:30, key::value, C:\dossier et les URL restent intacts.
	{ pattern: /([^\s:])[^\S\r\n]*:(?=[^\S\r\n]|[*_]|$)/gm, replacement: `$1${NBSP}:` },
	// Espaces fines à l'intérieur des guillemets français.
	{ pattern: /«[^\S\r\n]*(\S)/g, replacement: `«${NNBSP}$1` },
	{ pattern: /(\S)[^\S\r\n]*»/g, replacement: `$1${NNBSP}»` },
];

// Règles de typographie anglaise : pas d'espace avant la ponctuation, donc rien
// à ajouter de ce côté. Restent les guillemets courbes et l'apostrophe.
const ENGLISH_RULES: TypoRule[] = [
	// Guillemets droits appariés sur une même ligne → guillemets anglais.
	{ pattern: /"([^"\n]*)"/g, replacement: "“$1”" },
	// Guillemets simples appariés → ‘…’. L'ouvrant ne suit pas une lettre, le
	// fermant n'en précède pas une, et une apostrophe entre deux lettres peut
	// figurer dans la citation ('don't go'). Un ouvrant sans fermant ('tis,
	// '90s) est ambigu : il est laissé tel quel.
	{
		pattern: /(?<![\p{L}\d'’])'((?:[^'\n]|(?<=[\p{L}\d])'(?=[\p{L}\d]))+?)'(?![\p{L}\d])/gu,
		replacement: "‘$1’",
	},
	// Toute autre apostrophe droite qui suit une lettre (don't, users') ou un
	// chiffre suivi d'une lettre (1990's) devient typographique. 5' et 5'10" —
	// pieds et pouces — sont laissés intacts.
	{ pattern: /(?<=\p{L})'|(?<=\d)'(?=\p{L})/gu, replacement: "’" },
	ELLIPSIS_RULE,
	STRAY_COMMA_SPACE_RULE,
];

const TYPO_RULES: Record<Lang, TypoRule[]> = { fr: FRENCH_RULES, en: ENGLISH_RULES };

function fixPunctuation(chunk: string, lang: Lang): string {
	let fixed = chunk;
	for (const { pattern, replacement } of TYPO_RULES[lang]) {
		fixed = fixed.replace(pattern, replacement);
	}
	return fixed;
}

export function protectedRanges(text: string): [number, number][] {
	const ranges: [number, number][] = [];

	PROTECTED_RE.lastIndex = 0;
	let match: RegExpExecArray | null;
	while ((match = PROTECTED_RE.exec(text)) !== null) {
		ranges.push([match.index, match.index + match[0].length]);
	}

	return ranges;
}

// Corrige chaque portion qui n'est pas protégée. `fix` reçoit la portion et sa
// position dans le texte.
function mapUnprotected(text: string, fix: (chunk: string, offset: number) => string): string {
	let result = "";
	let lastIndex = 0;

	for (const [start, end] of protectedRanges(text)) {
		result += fix(text.slice(lastIndex, start), lastIndex) + text.slice(start, end);
		lastIndex = end;
	}

	return result + fix(text.slice(lastIndex), lastIndex);
}

// Une portion non protégée est encore découpée aux frontières des segments de
// langue : une correction ne commence donc jamais au milieu d'un bloc de code,
// ni ne mélange les règles de deux langues. Ce que les segments ne couvrent pas,
// comme ce dont la langue est nulle, est laissé tel quel.
function fixBySpans(chunk: string, offset: number, spans: LangSpan[]): string {
	let fixed = "";
	let pos = 0;

	for (const span of spans) {
		const from = Math.max(span.from - offset, pos);
		const to = Math.min(span.to - offset, chunk.length);
		if (to <= from) {
			continue;
		}
		fixed += chunk.slice(pos, from);
		fixed += span.lang ? fixPunctuation(chunk.slice(from, to), span.lang) : chunk.slice(from, to);
		pos = to;
	}

	return fixed + chunk.slice(pos);
}

// `language` est une langue pour tout le texte, ou des segments triés, dont les
// positions se comptent depuis le début de `text`.
export function applyTypography(text: string, language: Lang | LangSpan[]): string {
	const spans = typeof language === "string" ? [{ from: 0, to: text.length, lang: language }] : language;

	return mapUnprotected(text, (chunk, offset) => fixBySpans(chunk, offset, spans));
}

// Côté du signe où l'insécable est attendue : devant ; ! ? : % », derrière «.
export type SignSide = "before" | "after";

// Espaces sécables là où le français impose une insécable. On ne signale que
// l'espace ordinaire (ou la tabulation) : c'est elle qui autorise un retour à
// la ligne avant la ponctuation, ce qui est le défaut réel. Une insécable déjà
// présente, fine ou non, n'est jamais signalée — mais elle ne rachète pas une
// espace ordinaire qui la côtoie : une espace ordinaire suivie d'une
// insécable, devant « : », laisse la ligne se couper juste après le mot.
// Chaque motif cherche donc l'espace ordinaire dans toute la suite d'espaces
// horizontales ([^\S\r\n], comme dans FRENCH_RULES) qui touche le signe, bornée
// de l'autre côté par un caractère visible de la même ligne : c'est exactement
// ce que la correction réécrit. En début ou en fin de ligne, il n'y a ni
// coupure possible ni correction.
//
// Le groupe capturé est la part de cette suite qui sépare l'espace fautive du
// signe : de quoi situer ce dernier, qui porte le repère dans l'éditeur.
const WRONG_SPACE_PATTERNS: { pattern: RegExp; side: SignSide }[] = [
	// Avant ; ! ? — un « ! » suivi de « [ » ouvre une image ou une intégration.
	{ pattern: /(?<=\S[^\S\r\n]*)[ \t]+(?=([^\S\r\n]*)(?:[;?]|!(?!\[)))/g, side: "before" },
	// Avant le % d'un pourcentage, mais pas d'un « %% » (commentaire Obsidian).
	{ pattern: /(?<=\d[^\S\r\n]*)[ \t]+(?=([^\S\r\n]*)%(?!%))/g, side: "before" },
	// Avant un deux-points qui termine un mot : 12:30 ou key::value, sans
	// espace avant, ne sont pas concernés. Comme dans FRENCH_RULES, un marqueur
	// d'emphase peut suivre le deux-points (**Note :**).
	{ pattern: /(?<=[^\s:][^\S\r\n]*)[ \t]+(?=([^\S\r\n]*):(?:[ \t]|[*_]|$))/gm, side: "before" },
	// À l'intérieur des guillemets français.
	{ pattern: /(?<=«([^\S\r\n]*))[ \t]+(?=[^\S\r\n]*\S)/g, side: "after" },
	{ pattern: /(?<=\S[^\S\r\n]*)[ \t]+(?=([^\S\r\n]*)»)/g, side: "before" },
];

// Une espace ordinaire fautive, et le signe qu'elle sépare de son mot.
interface WrongSpace {
	start: number;
	end: number;
	sign: number;
	side: SignSide;
}

function matchWrongSpaces(text: string): WrongSpace[] {
	const protectedSpans = protectedRanges(text);
	const found: WrongSpace[] = [];

	for (const { pattern, side } of WRONG_SPACE_PATTERNS) {
		pattern.lastIndex = 0;
		let match: RegExpExecArray | null;
		while ((match = pattern.exec(text)) !== null) {
			const start = match.index;
			const end = start + match[0].length;
			if (!protectedSpans.some(([s, e]) => start < e && end > s)) {
				const gap = match[1].length;
				found.push({ start, end, side, sign: side === "before" ? end + gap : start - gap - 1 });
			}
		}
	}

	return found;
}

export function findWrongSpaces(text: string): [number, number][] {
	const found = matchWrongSpaces(text).map(({ start, end }): [number, number] => [start, end]);

	// Une même espace peut satisfaire deux motifs (« ; ) : on ne la garde
	// qu'une fois, et triée, comme l'exige la construction des décorations.
	found.sort((a, b) => a[0] - b[0]);
	return found.filter(([start], index) => index === 0 || start !== found[index - 1][0]);
}

// Pendant, sans aucune espace, de chaque motif de WRONG_SPACE_PATTERNS : le
// français impose une insécable à ces mêmes endroits, mais aucun caractère
// n'existe ici pour la souligner — d'où des motifs de largeur nulle, positionnés
// exactement là où l'espace manquante devrait être insérée. Le signe se trouve
// juste après cette position (side "before") ou, pour «, juste avant.
const MISSING_SPACE_PATTERNS: { pattern: RegExp; side: SignSide }[] = [
	// Avant ; ! ? — comme ci-dessus, un « ! » suivi de « [ » ouvre une image ou
	// une intégration, et un signe qui en suit un autre (« ?! ») n'exige pas sa
	// propre espace.
	{ pattern: /(?<=[^\s;!?])(?=[;?]|!(?!\[))/g, side: "before" },
	// Avant le % d'un pourcentage, mais pas d'un « %% » (commentaire Obsidian).
	{ pattern: /(?<=\d)(?=%(?!%))/g, side: "before" },
	// Avant un deux-points qui termine un mot : 12:30 ou key::value, sans
	// espace avant ni après, ne sont pas concernés.
	{ pattern: /(?<=[^\s:])(?=:(?:[ \t]|[*_]|$))/gm, side: "before" },
	// À l'intérieur des guillemets français.
	{ pattern: /(?<=«)(?=[^\s])/g, side: "after" },
	{ pattern: /(?<=[^\s])(?=»)/g, side: "before" },
];

function matchMissingSpaces(text: string): { pos: number; side: SignSide }[] {
	const protectedSpans = protectedRanges(text);
	const found: { pos: number; side: SignSide }[] = [];

	for (const { pattern, side } of MISSING_SPACE_PATTERNS) {
		pattern.lastIndex = 0;
		let match: RegExpExecArray | null;
		while ((match = pattern.exec(text)) !== null) {
			const pos = match.index;
			// `pos <= e`, et non `pos < e` : un signe placé juste après une
			// portion protégée (par exemple `` `code`! ``) n'est, comme la
			// correction typographique, jamais signalé faute de contexte.
			if (!protectedSpans.some(([s, e]) => pos > s && pos <= e)) {
				found.push({ pos, side });
			}
			// Motifs de largeur nulle : `lastIndex` n'avance pas tout seul, il
			// faut le faire à la main pour ne pas boucler indéfiniment.
			if (pattern.lastIndex === pos) {
				pattern.lastIndex++;
			}
		}
	}

	return found;
}

export function findMissingSpaces(text: string): number[] {
	const found = matchMissingSpaces(text).map(({ pos }) => pos);

	found.sort((a, b) => a - b);
	return found.filter((pos, index) => index === 0 || pos !== found[index - 1]);
}

// Signes de ponctuation dont l'espacement est fautif — insécable absente, ou
// doublée d'une espace ordinaire —, triés, chacun avec le côté où l'insécable
// est attendue. C'est sur eux que l'éditeur pose le repère : un tel signe
// n'est jamais de la syntaxe que l'aperçu en direct masque, contrairement au
// caractère qui le précède parfois (l'astérisque de **Note**:).
export function findFaultySigns(text: string): [number, SignSide][] {
	const signs = new Map<number, SignSide>();

	for (const { sign, side } of matchWrongSpaces(text)) {
		signs.set(sign, side);
	}
	for (const { pos, side } of matchMissingSpaces(text)) {
		signs.set(side === "before" ? pos : pos - 1, side);
	}

	return [...signs].sort((a, b) => a[0] - b[0]);
}
