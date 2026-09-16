import { NBSP, NNBSP } from "./chars";

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
		"<[^>\\n]+>",
		"[a-z][a-z0-9+.-]*:\\/\\/\\S+",
		"www\\.\\S+",
	].join("|"),
	"g"
);

// Règles de typographie française, appliquées dans cet ordre. Toutes n'avalent
// que des espaces horizontales ([^\S\r\n], qui couvre aussi les insécables
// existantes) : une règle ne peut donc jamais fusionner deux lignes, et
// réappliquer la commande sur un texte déjà correct ne change rien.
const TYPO_RULES: { pattern: RegExp; replacement: string }[] = [
	// Guillemets droits appariés sur une même ligne → guillemets français.
	{ pattern: /"([^"\n]*)"/g, replacement: `«${NNBSP}$1${NNBSP}»` },
	// Apostrophe droite → apostrophe typographique.
	{ pattern: /'/g, replacement: "’" },
	// Trois points → véritables points de suspension.
	{ pattern: /\.\.\./g, replacement: "…" },
	// Espace parasite avant une virgule.
	{ pattern: /[^\S\r\n]+,/g, replacement: "," },
	// Espace fine insécable avant ; ! ? — les suites comme « ?! » n'en
	// reçoivent qu'une seule, et un signe en début de ligne est laissé tel quel.
	{ pattern: /(\S)[^\S\r\n]*([;!?]+)/g, replacement: `$1${NNBSP}$2` },
	// ... et avant le % d'un pourcentage.
	{ pattern: /(\d)[^\S\r\n]*%/g, replacement: `$1${NNBSP}%` },
	// Espace insécable avant un deux-points, uniquement s'il termine un mot et
	// est suivi d'une espace, d'une fin de ligne ou d'un marqueur d'emphase :
	// 12:30, key::value, C:\dossier et les URL restent intacts.
	{ pattern: /([^\s:])[^\S\r\n]*:(?=[^\S\r\n]|[*_]|$)/gm, replacement: `$1${NBSP}:` },
	// Espaces fines à l'intérieur des guillemets français.
	{ pattern: /«[^\S\r\n]*(\S)/g, replacement: `«${NNBSP}$1` },
	{ pattern: /(\S)[^\S\r\n]*»/g, replacement: `$1${NNBSP}»` },
];

function fixPunctuation(chunk: string): string {
	let fixed = chunk;
	for (const { pattern, replacement } of TYPO_RULES) {
		fixed = fixed.replace(pattern, replacement);
	}
	return fixed;
}

function protectedRanges(text: string): [number, number][] {
	const ranges: [number, number][] = [];

	PROTECTED_RE.lastIndex = 0;
	let match: RegExpExecArray | null;
	while ((match = PROTECTED_RE.exec(text)) !== null) {
		ranges.push([match.index, match.index + match[0].length]);
	}

	return ranges;
}

export function applyTypography(text: string): string {
	let result = "";
	let lastIndex = 0;

	for (const [start, end] of protectedRanges(text)) {
		result += fixPunctuation(text.slice(lastIndex, start)) + text.slice(start, end);
		lastIndex = end;
	}

	return result + fixPunctuation(text.slice(lastIndex));
}

// Espaces sécables là où le français impose une insécable. On ne signale que
// l'espace ordinaire (ou la tabulation) : c'est elle qui autorise un retour à
// la ligne avant la ponctuation, ce qui est le défaut réel. Une insécable déjà
// présente, fine ou non, n'est jamais signalée.
const WRONG_SPACE_PATTERNS: RegExp[] = [
	// Avant ; ! ? — un « ! » suivi de « [ » ouvre une image ou une intégration.
	/[ \t]+(?=[;?]|!(?!\[))/g,
	// Avant le % d'un pourcentage.
	/(?<=\d)[ \t]+(?=%)/g,
	// Avant un deux-points qui termine un mot : 12:30 ou key::value, sans
	// espace avant, ne sont pas concernés. Comme dans TYPO_RULES, un marqueur
	// d'emphase peut suivre le deux-points (**Note :**).
	/[ \t]+(?=:(?:[ \t]|[*_]|$))/gm,
	// À l'intérieur des guillemets français.
	/(?<=«)[ \t]+/g,
	/[ \t]+(?=»)/g,
];

export function findWrongSpaces(text: string): [number, number][] {
	const protectedSpans = protectedRanges(text);
	const found: [number, number][] = [];

	for (const pattern of WRONG_SPACE_PATTERNS) {
		pattern.lastIndex = 0;
		let match: RegExpExecArray | null;
		while ((match = pattern.exec(text)) !== null) {
			const start = match.index;
			const end = start + match[0].length;
			if (!protectedSpans.some(([s, e]) => start < e && end > s)) {
				found.push([start, end]);
			}
		}
	}

	// Une même espace peut satisfaire deux motifs (« ; ) : on ne la garde
	// qu'une fois, et triée, comme l'exige la construction des décorations.
	found.sort((a, b) => a[0] - b[0]);
	return found.filter(([start], index) => index === 0 || start !== found[index - 1][0]);
}

// Pendant, sans aucune espace, de chaque motif de WRONG_SPACE_PATTERNS : le
// français impose une insécable à ces mêmes endroits, mais aucun caractère
// n'existe ici pour la souligner — d'où des motifs de largeur nulle, positionnés
// exactement là où l'espace manquante devrait être insérée.
const MISSING_SPACE_PATTERNS: RegExp[] = [
	// Avant ; ! ? — comme ci-dessus, un « ! » suivi de « [ » ouvre une image ou
	// une intégration, et un signe qui en suit un autre (« ?! ») n'exige pas sa
	// propre espace.
	/(?<=[^\s;!?])(?=[;?]|!(?!\[))/g,
	// Avant le % d'un pourcentage.
	/(?<=\d)(?=%)/g,
	// Avant un deux-points qui termine un mot : 12:30 ou key::value, sans
	// espace avant ni après, ne sont pas concernés.
	/(?<=[^\s:])(?=:(?:[ \t]|[*_]|$))/gm,
	// À l'intérieur des guillemets français.
	/(?<=«)(?=[^\s])/g,
	/(?<=[^\s])(?=»)/g,
];

export function findMissingSpaces(text: string): number[] {
	const protectedSpans = protectedRanges(text);
	const found: number[] = [];

	for (const pattern of MISSING_SPACE_PATTERNS) {
		pattern.lastIndex = 0;
		let match: RegExpExecArray | null;
		while ((match = pattern.exec(text)) !== null) {
			const pos = match.index;
			// `pos <= e`, et non `pos < e` : un signe placé juste après une
			// portion protégée (par exemple `` `code`! ``) n'est, comme la
			// correction typographique, jamais signalé faute de contexte.
			if (!protectedSpans.some(([s, e]) => pos > s && pos <= e)) {
				found.push(pos);
			}
			// Motifs de largeur nulle : `lastIndex` n'avance pas tout seul, il
			// faut le faire à la main pour ne pas boucler indéfiniment.
			if (pattern.lastIndex === pos) {
				pattern.lastIndex++;
			}
		}
	}

	found.sort((a, b) => a - b);
	return found.filter((pos, index) => index === 0 || pos !== found[index - 1]);
}
