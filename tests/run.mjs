import { Text } from "@codemirror/state";
import { readFileSync, readdirSync } from "fs";
import path from "path";
import { FakeEditor, check, loadPlugin, report, root, section } from "./harness.mjs";

const plugin = await loadPlugin();
const {
	NNBSP,
	NBSP,
	CHAR_GROUPS,
	ALL_CHARS,
	normalizeForSearch,
	matchesQuery,
	insertSpecialChar,
	applyTypography,
	findWrongSpaces,
	findMissingSpaces,
	findFaultySigns,
} = plugin;

// Points de code attendus, écrits indépendamment de main.ts : plusieurs de ces
// caractères sont indiscernables à l'œil (· • ◦, µ contre le mu grec, – contre
// —), une relecture visuelle ne prouverait rien.
const EXPECTED_CODE_POINTS = {
	"narrow-nbsp": "202F",
	nbsp: "00A0",
	"guillemet-ouvrant": "00AB",
	"guillemet-fermant": "00BB",
	"guillemet-anglais-ouvrant": "201C",
	"guillemet-anglais-fermant": "201D",
	"apostrophe-ouvrante": "2018",
	"apostrophe-typographique": "2019",
	"tiret-cadratin": "2014",
	"tiret-demi-cadratin": "2013",
	"point-median": "00B7",
	"points-suspension": "2026",
	"oe-minuscule": "0153",
	"oe-majuscule": "0152",
	"ae-minuscule": "00E6",
	"ae-majuscule": "00C6",
	"a-grave-maj": "00C0",
	"a-circonflexe-maj": "00C2",
	"c-cedille-maj": "00C7",
	"e-aigu-maj": "00C9",
	"e-grave-maj": "00C8",
	"e-circonflexe-maj": "00CA",
	"e-trema-maj": "00CB",
	"i-circonflexe-maj": "00CE",
	"i-trema-maj": "00CF",
	"o-circonflexe-maj": "00D4",
	"u-grave-maj": "00D9",
	"u-circonflexe-maj": "00DB",
	"u-trema-maj": "00DC",
	"y-trema-maj": "0178",
	multiplication: "00D7",
	division: "00F7",
	"environ-egal": "2248",
	"plus-ou-moins": "00B1",
	micro: "00B5",
	puce: "2022",
	"puce-creuse": "25E6",
	yen: "00A5",
	livre: "00A3",
	"fleche-gauche": "2190",
	"fleche-droite": "2192",
	"fleche-haut": "2191",
	"fleche-bas": "2193",
};

const codePointOf = (char) =>
	[...char].map((c) => c.codePointAt(0).toString(16).toUpperCase().padStart(4, "0")).join("+");

section("Table des caractères");
check("nombre de caractères", ALL_CHARS.length, Object.keys(EXPECTED_CODE_POINTS).length);
check(
	"chaque caractère est celui attendu, sur un seul point de code",
	Object.fromEntries(ALL_CHARS.map((item) => [item.id, codePointOf(item.char)])),
	EXPECTED_CODE_POINTS
);
check("aucun caractère en double", new Set(ALL_CHARS.map((c) => c.char)).size, ALL_CHARS.length);
check("aucun identifiant en double", new Set(ALL_CHARS.map((c) => c.id)).size, ALL_CHARS.length);
check("aucun libellé en double", new Set(ALL_CHARS.map((c) => c.label)).size, ALL_CHARS.length);
check("les deux espaces nommées", [codePointOf(NNBSP), codePointOf(NBSP)], ["202F", "00A0"]);

section("Recherche dans la palette");
const search = (raw) => {
	const query = normalizeForSearch(raw.trim());
	return CHAR_GROUPS.flatMap((group) => group.chars.filter((c) => matchesQuery(c, group.category, query))).map(
		(c) => c.id
	);
};

check("recherche vide : tout est affiché", search("").length, ALL_CHARS.length);
check("accents ignorés : « fleche » trouve les flèches", search("fleche"), [
	"fleche-gauche",
	"fleche-droite",
	"fleche-haut",
	"fleche-bas",
]);
check("« Flèche » accentué donne le même résultat", search("Flèche").length, 4);
check("« cadratin » trouve les deux tirets", search("cadratin"), ["tiret-cadratin", "tiret-demi-cadratin"]);
check("« anglais » ne trouve que les guillemets anglais", search("anglais"), [
	"guillemet-anglais-ouvrant",
	"guillemet-anglais-fermant",
]);
// Un nom de catégorie est aussi un critère : « guillemet » remonte donc les
// six caractères de « Guillemets et apostrophes ».
check("un nom de catégorie remonte toute la catégorie", search("guillemet").length, 6);
check("recherche par point de code", search("202f"), ["narrow-nbsp"]);
check("recherche par point de code préfixé", search("u+2014"), ["tiret-cadratin"]);
check("recherche par le caractère lui-même", search("→"), ["fleche-droite"]);
check("casse ignorée", search("MICRO"), ["micro"]);
check("aucun résultat", search("zzz"), []);
check("normalisation NFD", normalizeForSearch("Ç_É_Ê_Ü"), "c_e_e_u");

section("Correction typographique");
const typo = (input, expected, name) => check(name, applyTypography(input), expected);
const unchanged = (input, name) => check(name, applyTypography(input), input);

typo("Bonjour ; ça va ?", `Bonjour${NNBSP}; ça va${NNBSP}?`, "fine insécable avant ; et ?");
typo("Sans espace;ici", `Sans espace${NNBSP};ici`, "fine insérée même sans espace préalable");
typo("Quoi ?!", `Quoi${NNBSP}?!`, "une suite ?! ne reçoit qu'une fine");
typo("Attention : ici", `Attention${NBSP}: ici`, "insécable avant le deux-points");
typo("**Note :**", `**Note${NBSP}:**`, "deux-points suivi d'un marqueur d'emphase");
typo('Il a dit "bonjour"', `Il a dit «${NNBSP}bonjour${NNBSP}»`, "guillemets droits appariés → français");
typo("« citation »", `«${NNBSP}citation${NNBSP}»`, "espaces fines dans les guillemets français");
typo("l'été", "l’été", "apostrophe typographique");
typo("Ah...", "Ah…", "points de suspension");
typo("mot , suite", "mot, suite", "espace parasite avant la virgule");
typo("50 %", `50${NNBSP}%`, "fine avant le pourcentage");
// Tout ce que le signalement relève, la correction doit le réécrire : une
// suite d'espaces mêlant ordinaire et insécable est ramenée à la bonne espace.
typo(`texte ${NBSP}: suite`, `texte${NBSP}: suite`, "espace ordinaire doublant une insécable");
typo(`Quoi ${NNBSP}?`, `Quoi${NNBSP}?`, "espace ordinaire doublant une fine");
typo(`« ${NNBSP}texte${NNBSP} »`, `«${NNBSP}texte${NNBSP}»`, "espaces ordinaires doublant les fines des guillemets");

section("Correction : ce qui doit rester intact");
unchanged("Rendez-vous à 12:30", "heure");
unchanged("clé:: valeur", "champ Dataview");
unchanged("C:\\Users\\moi", "chemin Windows");
unchanged("Bonjour :)", "émoticône");
unchanged("Voir https://exemple.fr/?a=1&b=2;c=3", "URL avec ? ; et =");
unchanged("www.exemple.fr/?x=1", "URL sans schéma");
unchanged("Du `code ; ici` et voilà", "code en ligne");
unchanged("```\nlet x = 1; // ok ?\n```", "bloc de code");
unchanged("[lien](https://x.fr/a?b=1)", "lien markdown");
unchanged("![[image.png]]", "image intégrée");
unchanged("voir ![[img.png]]", "pas de fine avant une intégration");
unchanged("[[Note#Section]]", "lien interne");
unchanged("$f(x) : y$", "formule en ligne");
unchanged("---\ntitre: Ma note\ntags: a\n---\n", "métadonnées en tête de sélection");
unchanged('Il mesure 5" de haut', "guillemet droit non apparié");
unchanged("mot\n? question", "aucune fusion de lignes");
unchanged('<span title="a ; b">x</span>', "balise HTML");
unchanged("> [!NOTE] Attention", "marqueur de callout Obsidian");
unchanged("> [!WARNING]- Repliable", "callout repliable, avec son suffixe");
unchanged("Un&nbsp;espace, une&#39;apostrophe, un&#x27;autre", "entités HTML");
unchanged("[ref]: https://exemple.fr", "définition de référence");
unchanged("[^1]: Une note", "définition de note de bas de page");
unchanged("Voir [ref]\n\n[ref]: https://exemple.fr", "définition de référence en fin de note");
unchanged("   [ref]: https://exemple.fr", "définition de référence légèrement indentée");
// Seuls le libellé et son deux-points sont protégés : la protection ne doit pas
// déborder sur le texte de la note, ni sur ce qui n'est pas en début de ligne.
typo("[^1]: Une note ; suite", `[^1]: Une note${NNBSP}; suite`, "le texte d'une note reste corrigé");
typo("Voir [ceci]: cela", `Voir [ceci]${NBSP}: cela`, "hors début de ligne, ce n'est pas une définition");

section("Correction : idempotence et intégrité");
const sample = 'Il a dit "bonjour" ; puis : "quoi ?"... l\'ami, à 12:30 sur https://x.fr/?a=1\nEt `du code ;` fin !';
const once = applyTypography(sample);
check("relancer la correction ne change plus rien", applyTypography(once), once);
check("aucune ligne perdue", once.split("\n").length, sample.split("\n").length);

section("Entourer la sélection");
const insertInto = (text, a, b, char) => {
	const editor = new FakeEditor(text, a, b);
	insertSpecialChar(editor, char);
	return { text: editor.text, selected: editor.getSelection(), cursor: editor.b };
};

// « bonjour » occupe les positions 9 à 16 de « Il a dit bonjour. ».
const guillemets = insertInto("Il a dit bonjour.", 9, 16, "«");
check("« entoure la sélection", guillemets.text, `Il a dit «${NNBSP}bonjour${NNBSP}».`);
check("le texte entouré reste sélectionné", guillemets.selected, "bonjour");
check("» produit la même paire que «", insertInto("Il a dit bonjour.", 9, 16, "»").text, guillemets.text);

const anglais = insertInto("Il a dit bonjour.", 9, 16, "“");
check("guillemets anglais, sans espaces intérieures", anglais.text, "Il a dit “bonjour”.");
check("sélection conservée (guillemets anglais)", anglais.selected, "bonjour");
check("apostrophes simples", insertInto("Il a dit bonjour.", 9, 16, "’").text, "Il a dit ‘bonjour’.");

const multiligne = insertInto("ligne un\nligne deux", 0, 19, "«");
check("sélection multiligne entourée", multiligne.text, `«${NNBSP}ligne un\nligne deux${NNBSP}»`);
check("sélection multiligne conservée", multiligne.selected, "ligne un\nligne deux");

check("un caractère non apparié remplace la sélection", insertInto("abc", 1, 2, "→").text, "a→c");
const sansSelection = insertInto("ab", 1, 1, "«");
check("sans sélection : insertion simple", sansSelection.text, "a«b");
check("sans sélection : curseur après le caractère", sansSelection.cursor, 2);

section("Signalement des espaces fautives");
const wrong = (text, name, expected) => check(name, findWrongSpaces(text), expected);

wrong("Bonjour !", "espace ordinaire avant !", [[7, 8]]);
wrong(`Bonjour${NNBSP}!`, "fine insécable : rien à signaler", []);
wrong(`Bonjour${NBSP}!`, "insécable : rien à signaler non plus", []);
wrong("Bonjour\t!", "tabulation avant !", [[7, 8]]);
wrong("Bonjour  !", "une suite d'espaces est signalée d'un bloc", [[7, 9]]);
wrong("Note : texte", "espace avant le deux-points", [[4, 5]]);
wrong("« citation »", "les deux espaces des guillemets", [
	[1, 2],
	[10, 11],
]);
wrong("50 %", "espace avant le pourcentage", [[2, 3]]);
wrong("« ;", "une espace satisfaisant deux motifs n'est comptée qu'une fois", [[1, 2]]);
wrong("a !\nb ?", "positions absolues sur plusieurs lignes", [
	[1, 2],
	[5, 6],
]);
wrong("Rendez-vous à 12:30", "heure : aucune espace, rien à signaler", []);
wrong("titre: Ma note", "clé de métadonnées", []);
wrong("clé:: valeur", "champ Dataview", []);
wrong("Du `code ; ici` et voilà", "code en ligne protégé", []);
wrong("```\nx = 1 ;\n```", "bloc de code protégé", []);
wrong("voir ![[img.png]]", "espace avant une intégration", []);
wrong("$a : b$", "formule en ligne protégée", []);
wrong("[lien](https://x.fr/a?b=1)", "lien markdown protégé", []);
wrong("un % seul", "pourcentage sans chiffre devant", []);
wrong("**Note :**", "deux-points suivi d'un marqueur d'emphase", [[6, 7]]);
wrong("> [!NOTE] Attention", "marqueur de callout protégé", []);
wrong("Un&nbsp;espace", "entité HTML protégée", []);

// Une insécable ne rachète pas l'espace ordinaire qui la côtoie : la ligne peut
// toujours se couper sur cette dernière.
wrong(`texte ${NBSP}: suite`, "espace ordinaire suivie d'une insécable, avant le deux-points", [[5, 6]]);
wrong(`texte${NBSP} : suite`, "insécable suivie d'une espace ordinaire, avant le deux-points", [[6, 7]]);
wrong(`texte ${NBSP} : suite`, "deux espaces ordinaires de part et d'autre d'une insécable", [
	[5, 6],
	[7, 8],
]);
wrong(`Quoi ${NNBSP}?`, "espace ordinaire et fine avant ?", [[4, 5]]);
wrong(`Bonjour ${NNBSP}!`, "espace ordinaire et fine avant !", [[7, 8]]);
wrong(`50 ${NNBSP}%`, "espace ordinaire et fine avant le pourcentage", [[2, 3]]);
wrong(`« ${NNBSP}texte ${NNBSP}»`, "espaces ordinaires doublant les fines des guillemets", [
	[1, 2],
	[8, 9],
]);
wrong(`texte${NBSP}: suite`, "insécable seule avant le deux-points : rien à signaler", []);
wrong(`voir ${NBSP}![[img.png]]`, "espace avant une intégration, même doublée d'une insécable", []);
// Comme la correction, le signalement ignore une suite d'espaces en début ou en
// fin de ligne : il n'y a là aucune coupure à empêcher.
wrong("  ; suite", "espaces en tête de ligne devant ;", []);
wrong("fin «  \nsuite", "espaces après « en fin de ligne", []);

// CodeMirror exige des plages triées : un ordre incorrect lèverait une
// exception à l'affichage.
const melange = findWrongSpaces("« Bonjour » ; oui : non 50 % !");
check("plages triées par position", melange.map(([s]) => s), [...melange.map(([s]) => s)].sort((a, b) => a - b));
check("tous les cas du mélange sont trouvés", melange.length, 6);

section("Signalement des espaces manquantes");
const missing = (text, name, expected) => check(name, findMissingSpaces(text), expected);

missing("Bonjour!", "aucune espace du tout avant !", [7]);
missing("Sans espace;ici", "aucune espace avant ;", [11]);
missing("Quoi?!", "une suite ?! ne réclame qu'une position", [4]);
missing(`Bonjour${NNBSP}!`, "fine déjà présente : rien à signaler", []);
missing(`Bonjour${NBSP}!`, "insécable déjà présente : rien à signaler non plus", []);
missing("Bonjour !", "espace ordinaire déjà présente : ce n'est pas une absence", []);
missing("50%", "aucune espace avant le pourcentage", [2]);
missing("un% seul", "pourcentage sans chiffre devant", []);
missing("Attention: ici", "aucune espace avant le deux-points", [9]);
missing("«bonjour»", "aucune espace des deux côtés des guillemets", [1, 8]);
missing("Rendez-vous à 12:30", "heure : aucune espace attendue", []);
missing("clé:: valeur", "champ Dataview", []);
missing("C:\\Users\\moi", "chemin Windows", []);
missing("Bonjour :)", "émoticône", []);
missing("Du `code;ici` et voilà", "code en ligne protégé", []);
missing("```\nx=1;\n```", "bloc de code protégé", []);
missing("`code`!suite", "juste après une portion protégée : omis, comme la correction", []);
missing("> [!NOTE] Attention", "marqueur de callout : pas de fausse alerte sur son !", []);
missing("[ref]: https://exemple.fr", "définition de référence : aucune espace attendue", []);
missing("[^1]: Une note", "définition de note : aucune espace attendue", []);
missing("Voir [ref]\n\n[ref]: https://exemple.fr", "définition de référence en fin de note", []);
missing("Un&nbsp;espace", "entité HTML : pas de fausse alerte sur son ;", []);

section("Signes portant le repère");
const signs = (text, name, expected) => check(name, findFaultySigns(text), expected);

signs("Bonjour!", "espace absente : repère devant le signe", [[7, "before"]]);
signs("Bonjour !", "espace ordinaire : repère sur le même signe", [[8, "before"]]);
signs(`texte ${NBSP}: suite`, "espace ordinaire doublant une insécable : repère contre le signe", [[7, "before"]]);
signs("«bonjour»", "guillemets sans espaces : derrière « et devant »", [
	[0, "after"],
	[8, "before"],
]);
signs("« bonjour »", "guillemets aux espaces ordinaires : mêmes signes", [
	[0, "after"],
	[10, "before"],
]);
signs(`« ${NNBSP}bonjour`, "espace ordinaire après la fine de « : repère sur « quand même", [[0, "after"]]);
// Le signe n'est jamais de la syntaxe masquée par l'aperçu en direct, à la
// différence du caractère qui le précède ici.
signs("**Note**:", "après un marqueur d'emphase : repère sur le deux-points", [[8, "before"]]);
signs("« :x", "un deux-points qui ne termine pas un mot ne porte pas de repère", [[0, "after"]]);
signs("texte;»", "deux signes accolés : un repère chacun", [
	[5, "before"],
	[6, "before"],
]);
signs(`Bonjour${NNBSP}!`, "espacement correct : aucun repère", []);
signs("Du `code;ici` et voilà", "code protégé : aucun repère", []);

section("Plages visibles de l'éditeur");
// CodeMirror escamote des portions des lignes très longues : une même ligne
// peut alors être rendue en deux plages visibles. Élargies aux lignes entières
// sans être fusionnées, elles feraient repartir les positions en arrière, et
// RangeSetBuilder lèverait « Ranges must be added sorted ».
const fakeView = (text, ranges) => ({ visibleRanges: ranges, state: { doc: Text.of(text.split("\n")) } });

const uneLongueLigne = "Bonjour ! " + "x".repeat(60) + " : suite ?";
check(
	"deux plages sur une même ligne sont fusionnées",
	plugin.visibleLineRanges(fakeView(uneLongueLigne, [{ from: 0, to: 5 }, { from: 40, to: 60 }])),
	[{ from: 0, to: uneLongueLigne.length }]
);
check(
	"deux plages sur des lignes distinctes restent séparées",
	plugin.visibleLineRanges(fakeView("ligne un\nligne deux\nligne trois", [{ from: 2, to: 4 }, { from: 22, to: 24 }])),
	[
		{ from: 0, to: 8 },
		{ from: 20, to: 31 },
	]
);
check(
	"une plage qui reprend au bord de la précédente est fusionnée",
	plugin.visibleLineRanges(fakeView("aa\nbb", [{ from: 0, to: 2 }, { from: 2, to: 4 }])),
	[{ from: 0, to: 5 }]
);

const pousses = [];
plugin.collectWrongSpaces(fakeView(uneLongueLigne, [{ from: 0, to: 5 }, { from: 40, to: 60 }]), (from, to) =>
	pousses.push([from, to])
);
check(
	"les positions signalées restent croissantes malgré la coupure",
	pousses.map(([from]) => from),
	[...pousses.map(([from]) => from)].sort((a, b) => a - b)
);
check("et la ligne n'est pas analysée deux fois", pousses.length, new Set(pousses.map(([from]) => from)).size);

// Le bloc de métadonnées n'est reconnu qu'en tête du texte analysé : dès qu'il
// dépasse en haut de l'écran, la tranche visible commence sur « clé: valeur »,
// que rien ne distingue alors d'une phrase à corriger.
const noteAvecEnTete = "---\ntitre: Ma note\ntags: a\n---\nBonjour!";
const marques = (text, ranges) => {
	const found = [];
	plugin.collectWrongSpaces(fakeView(text, ranges), (from, to) => found.push([from, to]));
	return found;
};

check("métadonnées défilées hors écran : rien n'est signalé", marques(noteAvecEnTete, [{ from: 4, to: 24 }]), []);
check(
	"plage à cheval : seul le corps est analysé",
	marques(noteAvecEnTete, [{ from: 19, to: 35 }]),
	[[38, 39]]
);
check(
	"et ses positions restent croissantes",
	marques(noteAvecEnTete, [{ from: 19, to: 35 }]).map(([from]) => from),
	[...marques(noteAvecEnTete, [{ from: 19, to: 35 }]).map(([from]) => from)].sort((a, b) => a - b)
);
// Un « --- » sans fence fermante est une barre horizontale, pas des métadonnées :
// il ne doit pas faire taire le signalement sur tout le reste de la note.
check("une barre horizontale ne fait pas taire le reste", marques("---\nBonjour!", [{ from: 0, to: 12 }]), [[11, 12]]);

const fusionText = "Bonjour!Salut : oui";
const fusion = [];
plugin.collectWrongSpaces(fakeView(fusionText, [{ from: 0, to: fusionText.length }]), (from, to, cls) =>
	fusion.push([from, to, cls])
);
// Le repère est une marque posée sur le signe lui-même : aucun widget, dont
// l'image tampon de CodeMirror permettrait de couper la ligne devant le signe.
check("espace manquante et espace fautive fusionnées, triées par position", fusion, [
	[fusionText.indexOf("!"), fusionText.indexOf("!") + 1, "special-char-spacing-marker-before"],
	[fusionText.indexOf(":") - 1, fusionText.indexOf(":"), "special-char-wrong-space"],
	[fusionText.indexOf(":"), fusionText.indexOf(":") + 1, "special-char-spacing-marker-before"],
]);
const guillemetsNus = [];
plugin.collectWrongSpaces(fakeView("«mot»", [{ from: 0, to: 5 }]), (from, to, cls) => guillemetsNus.push([from, to, cls]));
check("derrière « et devant » : un côté par guillemet", guillemetsNus, [
	[0, 1, "special-char-spacing-marker-after"],
	[4, 5, "special-char-spacing-marker-before"],
]);

section("Caractères récents");
const byId = (id) => ALL_CHARS.find((c) => c.id === id);
// Les réglages du banc d'essai sont copiés des vrais défauts : un réglage
// ajouté plus tard ne peut pas manquer ici sans qu'on s'en aperçoive.
const newPlugin = () => {
	const instance = new plugin.default();
	instance.settings = structuredClone(plugin.DEFAULT_SETTINGS);
	return instance;
};
const insert = (instance, id) => instance.insertChar(new FakeEditor(""), byId(id));

const recents = newPlugin();
insert(recents, "fleche-droite");
check("le dernier inséré est mémorisé", recents.settings.recentChars, ["fleche-droite"]);
insert(recents, "multiplication");
check("le plus récent passe en tête", recents.settings.recentChars, ["multiplication", "fleche-droite"]);
insert(recents, "fleche-droite");
check("réutiliser un caractère le remonte sans doublon", recents.settings.recentChars, [
	"fleche-droite",
	"multiplication",
]);

const plafond = newPlugin();
const huit = ["yen", "livre", "micro", "puce", "division", "plus-ou-moins", "tiret-cadratin", "points-suspension"];
for (const id of huit) insert(plafond, id);
check("la liste est plafonnée à 6", plafond.settings.recentChars.length, 6);
check("ce sont les 6 derniers, du plus récent au plus ancien", plafond.settings.recentChars, [...huit].reverse().slice(0, 6));

const repete = newPlugin();
insert(repete, "yen");
const ecrituresApresPremier = repete.saveCount;
insert(repete, "yen");
check("réinsérer le même caractère n'écrit pas les réglages", repete.saveCount, ecrituresApresPremier);
check("et ne le duplique pas", repete.settings.recentChars, ["yen"]);

const obsolete = newPlugin();
obsolete.settings.recentChars = ["yen", "caractere-supprime", "livre"];
check("un identifiant inconnu est ignoré", obsolete.getRecentChars().map((c) => c.id), ["yen", "livre"]);
check("les récents sont rendus dans l'ordre enregistré", obsolete.getRecentChars()[0].char, "¥");

section("Caractères personnalisés");
const custom = newPlugin();
custom.settings.customChars = [
	{ id: "custom-1", char: "≠", label: "Différent de" },
	{ id: "custom-2", char: "⇒", label: "" },
	{ id: "custom-3", char: "", label: "Entrée jamais remplie" },
	{ id: "custom-4", label: "Champ caractère absent" },
	{ char: "†", label: "Identifiant absent" },
	null,
];

check("les entrées inutilisables sont écartées", custom.getCustomChars().map((c) => c.id), ["custom-1", "custom-2"]);
check("le libellé saisi est conservé", custom.getCustomChars()[0].label, "Différent de");
check("sans libellé, le point de code sert de nom", custom.getCustomChars()[1].label, "U+21D2");

// Un caractère personnalisé doit se retrouver dans les récents comme un autre.
custom.insertChar(new FakeEditor(""), custom.getCustomChars()[0]);
check("un caractère personnalisé est mémorisé dans les récents", custom.settings.recentChars, ["custom-1"]);
check("et retrouvé à l'affichage des récents", custom.getRecentChars().map((c) => c.char), ["≠"]);

custom.settings.customChars = [];
check("supprimé, il disparaît des récents sans casser la liste", custom.getRecentChars(), []);

const categories = (instance, hasQuery) =>
	new plugin.SpecialCharacterModal(instance, new FakeEditor("")).groupsToRender(hasQuery).map((g) => g.category);

const vierge = newPlugin();
check("sans personnalisés ni récents : la liste intégrée seule", categories(vierge, false)[0], "Espaces");

const garni = newPlugin();
garni.settings.customChars = [{ id: "custom-1", char: "≠", label: "Différent de" }];
check("les personnalisés passent devant la liste intégrée", categories(garni, false).slice(0, 2), [
	"Personnalisés",
	"Espaces",
]);

garni.settings.recentChars = ["custom-1"];
check("ordre complet : récents, personnalisés, puis le reste", categories(garni, false).slice(0, 3), [
	"Récents",
	"Personnalisés",
	"Espaces",
]);
check("pendant une recherche, les récents disparaissent mais pas les personnalisés", categories(garni, true).slice(0, 2), [
	"Personnalisés",
	"Espaces",
]);

section("Cohérence du README");
const readme = readFileSync(path.join(root, "README.md"), "utf8");
// Les invariants qui suivent se vérifient sur le texte des sources : tous les
// fichiers sont relus, faute de quoi déplacer du code d'un module à l'autre
// suffirait à leur faire perdre ce qu'ils surveillent, sans rien signaler. La
// descente est récursive pour la même raison : ranger un module dans un
// sous-dossier ne doit pas le soustraire aux vérifications.
const MODULES = readdirSync(path.join(root, "src"), { recursive: true })
	.map((name) => `src/${name}`.replaceAll("\\", "/"))
	.filter((file) => file.endsWith(".ts"));
const source = ["main.ts", ...MODULES].map((file) => readFileSync(path.join(root, file), "utf8")).join("\n");
const rows = [...readme.matchAll(/^\| (.+?) \| (.+?) \| U\+([0-9A-F]{4}) \|$/gm)];

check("tous les caractères sont documentés", rows.length, ALL_CHARS.length);
check(
	"chaque glyphe du README correspond au point de code annoncé",
	rows.filter(([, cell, , code]) => cell !== "*(invisible)*" && codePointOf(cell) !== code).map(([, , name]) => name),
	[]
);
const labels = new Set(ALL_CHARS.map((c) => c.label));
check(
	"chaque nom du README existe dans le code",
	rows.map(([, , name]) => name).filter((name) => !labels.has(name)),
	[]
);

// La section « Développement » décrit le rôle de chaque module : un fichier
// ajouté, renommé ou supprimé sans qu'elle suive y laisserait un chemin mort,
// ou passerait sous silence un pan entier du plugin.
const citedModules = [...readme.matchAll(/`(src\/[\w/-]+\.ts)`/g)].map((m) => m[1]);
check("chaque module de src/ est décrit dans le README", MODULES.filter((m) => !citedModules.includes(m)), []);
check("chaque module cité par le README existe", citedModules.filter((m) => !MODULES.includes(m)), []);
check(
	"les raccourcis par défaut du code sont ceux annoncés",
	[...source.matchAll(/hotkey\("([^"]+)"\)/g)].map((m) => m[1]).sort(),
	["1", "2", "3", "4", "S"]
);
check(
	"les raccourcis annoncés figurent dans le README",
	["Ctrl + Maj + S", "Ctrl + Maj + 1", "Ctrl + Maj + 2", "Ctrl + Maj + 3", "Ctrl + Maj + 4"].filter(
		(key) => !readme.includes(key)
	),
	[]
);
// Ctrl+Alt est AltGr sous Windows : un raccourci par défaut ne doit jamais
// l'utiliser, sous peine de bloquer la saisie de @ ~ # { } [ ] | et €.
check("aucun raccourci par défaut n'utilise Mod+Alt", source.includes('"Mod", "Alt"'), false);

section("Classes CSS");
const styles = readFileSync(path.join(root, "styles.css"), "utf8");
// Posée sur la fenêtre sans règle associée : elle sert de point d'accroche
// aux snippets CSS de l'utilisateur.
const CSS_HOOKS_WITHOUT_RULE = ["special-char-modal"];

const used = [...source.matchAll(/"(special-char-[a-z-]+)"/g)].map((m) => m[1]);
const defined = new Set([...styles.matchAll(/^\.([a-z-]+)/gm)].map((m) => m[1]));

check(
	"toute classe posée par le code a une règle CSS",
	[...new Set(used)].filter((cls) => !defined.has(cls) && !CSS_HOOKS_WITHOUT_RULE.includes(cls)),
	[]
);
check(
	"toute règle CSS du plugin correspond à une classe posée par le code",
	[...defined].filter((cls) => cls.startsWith("special-char-") && !used.includes(cls)),
	[]
);

report();
