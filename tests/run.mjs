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
const typo = (input, expected, name) => check(name, applyTypography(input, "fr"), expected);
const unchanged = (input, name) => check(name, applyTypography(input, "fr"), input);

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
const once = applyTypography(sample, "fr");
check("relancer la correction ne change plus rien", applyTypography(once, "fr"), once);
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
plugin.collectWrongSpaces(
	fakeView(uneLongueLigne, [{ from: 0, to: 5 }, { from: 40, to: 60 }]),
	(from, to) => pousses.push([from, to]),
	"fr"
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
	plugin.collectWrongSpaces(fakeView(text, ranges), (from, to) => found.push([from, to]), "fr");
	return found;
};

// Ici les métadonnées touchent le corps sans ligne vide : l'analyse s'étend au
// paragraphe entier, « Bonjour! » compris, mais seules les lignes visibles
// reçoivent un repère — le corps, hors écran, n'en reçoit aucun.
check("métadonnées défilées hors écran : rien n'est signalé", marques(noteAvecEnTete, [{ from: 4, to: 24 }]), []);
check(
	"plage à cheval : seul le corps est analysé",
	marques(noteAvecEnTete, [{ from: 19, to: 35 }]),
	[[38, 38]]
);
check(
	"et ses positions restent croissantes",
	marques(noteAvecEnTete, [{ from: 19, to: 35 }]).map(([from]) => from),
	[...marques(noteAvecEnTete, [{ from: 19, to: 35 }]).map(([from]) => from)].sort((a, b) => a - b)
);
// Un « --- » sans fence fermante est une barre horizontale, pas des métadonnées :
// il ne doit pas faire taire le signalement sur tout le reste de la note.
check("une barre horizontale ne fait pas taire le reste", marques("---\nBonjour!", [{ from: 0, to: 12 }]), [[11, 11]]);

const fusionText = "Bonjour!Salut : oui";
const fusion = [];
plugin.collectWrongSpaces(
	fakeView(fusionText, [{ from: 0, to: fusionText.length }]),
	(from, to, cls) => fusion.push([from, to, cls]),
	"fr"
);
check("espace manquante et espace fautive fusionnées, triées par position", fusion, [
	[fusionText.indexOf("!"), fusionText.indexOf("!"), "special-char-spacing-marker"],
	[fusionText.indexOf(":") - 1, fusionText.indexOf(":"), "special-char-wrong-space"],
	[fusionText.indexOf(":"), fusionText.indexOf(":"), "special-char-spacing-marker"],
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

section("Langue : propriété de la note");
const resolved = (text, setting = "off") => plugin.resolveLanguage(text, setting);
const declared = (text) => {
	const { lang, source } = resolved(text);
	return source === "property" ? lang : "non déclarée";
};
const withProperty = (line) => `---\ntitre: Ma note\n${line}\n---\nCorps de la note`;

check("lang: fr", declared(withProperty("lang: fr")), "fr");
check("lang: en", declared(withProperty("lang: en")), "en");
check("clé et valeur insensibles à la casse", declared(withProperty('Lang: "EN"')), "en");
check("région ignorée : fr-FR", declared(withProperty("lang: fr-FR")), "fr");
check("région ignorée : en_US", declared(withProperty("lang: en_US")), "en");
check("commentaire YAML ignoré", declared(withProperty("lang: en-US # relu par Paul")), "en");
check("nom de la langue, accents ignorés", declared(withProperty("lang: Français")), "fr");
check("nom anglais de la langue", declared(withProperty("lang: english")), "en");
check("nom français de l'anglais", declared(withProperty("lang: anglais")), "en");
check("clé alternative : language", declared(withProperty("language: en")), "en");
check("clé alternative : langue", declared(withProperty("langue: en")), "en");
check("valeur entre apostrophes", declared(withProperty("lang: 'en'")), "en");
check("fins de ligne Windows", declared("---\r\nlang: en\r\n---\r\nCorps"), "en");
check("première clé non vide retenue", declared("---\nlang:\nlanguage: en\n---\nx"), "en");

check("langue non prise en charge : aucune règle", resolved(withProperty("lang: de")).lang, null);
check("… mais la source reste la propriété", resolved(withProperty("lang: de")).source, "property");
check("… et la valeur lue est conservée", resolved(withProperty("lang: de")).value, "de");
check("un nom hérité d'Object n'est pas une langue", resolved(withProperty("lang: constructor")).lang, null);
check("propriété vide : on passe au réglage", declared(withProperty("lang:")), "non déclarée");
check("propriété entre guillemets vides : idem", declared(withProperty('lang: ""')), "non déclarée");
check("une autre clé n'est pas la propriété", declared(withProperty("languages: en")), "non déclarée");
check("une clé imbriquée n'est pas celle de la note", declared("---\nmeta:\n  lang: en\n---\nx"), "non déclarée");
check("hors du bloc de métadonnées, ce n'est qu'une ligne de texte", declared("---\ntitre: x\n---\nlang: en"), "non déclarée");
check("sans fence fermante : une barre horizontale, pas des métadonnées", declared("---\nlang: en\nBonjour"), "non déclarée");
check("une note sans métadonnées", declared("lang: en"), "non déclarée");
check("note vide", declared(""), "non déclarée");

section("Langue : détection");
const FR_TEXT = "Le chat est sur la table et il mange une souris dans la cuisine pour le déjeuner.";
const EN_TEXT = "The cat is on the table and it eats a mouse in the kitchen for the lunch that we have.";
const detect = (text) => plugin.detectLanguage(text);

check("un texte français", detect(FR_TEXT).lang, "fr");
check("un texte anglais", detect(EN_TEXT).lang, "en");
check("les mots-outils français comptés", detect(FR_TEXT).scores, { fr: 11, en: 0 });
check("trop peu d'indices : pas de conclusion", detect("Bonjour tout le monde").lang, null);
check("texte vide", detect("").lang, null);
check("note bilingue à parts égales : pas de conclusion", detect(`${FR_TEXT} ${EN_TEXT}`).lang, null);
check(
	"du français avec quelques termes anglais reste français",
	detect("Le déploiement est une tâche que les équipes font dans le cloud, avec le fine-tuning of the model, pour un résultat qui est très bon.").lang,
	"fr"
);
check(
	"de l'anglais avec une citation française reste anglais",
	detect(`${EN_TEXT} ${EN_TEXT} « Le chat est sur la table ».`).lang,
	"en"
);

const codeWords = "if the and for of in the\n".repeat(5);
check("le code n'entre pas dans le décompte", detect("```\n" + codeWords + "```\n" + FR_TEXT).scores, { fr: 11, en: 0 });
check(
	"ni les métadonnées",
	detect("---\ndescription: the and of to is are was were\n---\n" + FR_TEXT).scores,
	{ fr: 11, en: 0 }
);
check("ni les URL", detect(`https://exemple.fr/the/and/of/to/is/are ${FR_TEXT}`).scores, { fr: 11, en: 0 });
check(
	"seul le début de la note est lu",
	detect(FR_TEXT.repeat(220) + EN_TEXT.repeat(500)).lang,
	"fr"
);
check(
	"aucun mot-outil n'est commun aux deux langues",
	[...plugin.STOPWORDS.fr].filter((word) => plugin.STOPWORDS.en.has(word)),
	[]
);

section("Langue : ordre de résolution");
const sourceOf = (text, setting) => resolved(text, setting).source;

check("réglage « fr »", resolved("Bonjour", "fr"), { lang: "fr", source: "setting" });
check("réglage « en »", resolved("Bonjour", "en"), { lang: "en", source: "setting" });
check("réglage « aucune »", resolved("Bonjour", "off"), { lang: null, source: "setting" });
check("réglage « automatique », texte français", resolved(FR_TEXT, "auto").lang, "fr");
check("réglage « automatique », texte anglais", resolved(EN_TEXT, "auto").lang, "en");
check("réglage « automatique », sans indices", resolved("Bonjour", "auto").lang, null);
check("réglage « automatique » : la source est la détection", sourceOf("Bonjour", "auto"), "detection");
for (const setting of ["fr", "en", "auto", "off"]) {
	check(`la propriété l'emporte sur le réglage « ${setting} »`, resolved(withProperty("lang: en"), setting).lang, "en");
}
check(
	"une langue non prise en charge ne retombe pas sur le réglage",
	resolved(withProperty("lang: de"), "fr").lang,
	null
);
check(
	"réglage « aucune » : seules les notes qui déclarent leur langue sont concernées",
	[resolved(withProperty("lang: fr"), "off").lang, resolved("Bonjour", "off").lang],
	["fr", null]
);

section("Correction typographique en anglais");
const en = (input, expected, name) => check(name, applyTypography(input, "en"), expected);
const enUnchanged = (input, name) => en(input, input, name);

en('He said "hello"', "He said “hello”", "guillemets droits → guillemets anglais, sans espaces");
en("don't", "don’t", "apostrophe typographique");
en("the users' guide", "the users’ guide", "apostrophe d'un pluriel possessif");
en("1990's music", "1990’s music", "apostrophe après un chiffre suivi d'une lettre");
en("He said 'hello' to them", "He said ‘hello’ to them", "guillemets simples appariés");
en("Say 'hello', he said", "Say ‘hello’, he said", "guillemets simples avant une virgule");
en("'don't go' she said", "‘don’t go’ she said", "apostrophe à l'intérieur d'une citation simple");
en("'the users' guide'", "‘the users’ guide’", "citation simple contenant un pluriel possessif");
en("Wait...", "Wait…", "points de suspension");
en("word , next", "word, next", "espace parasite avant la virgule");
enUnchanged("'tis the season", "ouvrant sans fermant : ambigu, laissé tel quel");
enUnchanged("He is 5'10\" tall", "pieds et pouces intacts");
enUnchanged("Really?! Yes: ok; fine!", "aucune espace ajoutée avant la ponctuation");
enUnchanged(`Bonjour${NNBSP}! Attention${NBSP}: ici`, "les insécables existantes ne sont pas touchées");
enUnchanged("« citation »", "les guillemets français ne sont pas touchés");
enUnchanged("Du `don't \"x\"` en code", "code en ligne protégé");
enUnchanged("[lien](https://x.fr/it's)", "lien protégé");
const enOnce = applyTypography(`He said "don't" and 'stop', wait...`, "en");
check("la correction anglaise est idempotente", applyTypography(enOnce, "en"), enOnce);
check(
	"la même phrase donne des résultats différents selon la langue",
	[applyTypography('Dit "ok" !', "fr"), applyTypography('Dit "ok" !', "en")],
	[`Dit «${NNBSP}ok${NNBSP}»${NNBSP}!`, "Dit “ok” !"]
);

section("Langue : commande de correction");
const { Notice } = plugin;
// La sélection est désignée par son texte : la langue doit venir de la note
// entière, jamais de ces quelques mots.
const runFix = (note, setting, selected) => {
	Notice.messages.length = 0;
	const instance = newPlugin();
	instance.settings.defaultLanguage = setting;
	const start = note.lastIndexOf(selected);
	const editor = new FakeEditor(note, start, start + selected.length);
	instance.fixTypography(editor);
	return { text: editor.text, message: Notice.messages.at(-1) };
};
const NOT_CORRECTED = /rien n'a été corrigé/;

check("réglage français : correction française", runFix("Bonjour !", "fr", "Bonjour !").text, `Bonjour${NNBSP}!`);
check(
	"propriété « en » : correction anglaise, malgré un réglage français",
	runFix('---\nlang: en\n---\nHe said "hi" !', "fr", 'He said "hi" !').text,
	'---\nlang: en\n---\nHe said “hi” !'
);
check(
	"propriété « fr » : correction française, malgré un réglage anglais",
	runFix('---\nlang: fr\n---\nIl dit "oui" !', "en", 'Il dit "oui" !').text,
	`---\nlang: fr\n---\nIl dit «${NNBSP}oui${NNBSP}»${NNBSP}!`
);
check("réglage anglais", runFix('He said "hi"', "en", 'He said "hi"').text, "He said “hi”");
check(
	"langue de la note et non de la sélection : deux mots dans une note française",
	runFix(`${FR_TEXT}\nBonjour !`, "auto", "Bonjour !").text,
	`${FR_TEXT}\nBonjour${NNBSP}!`
);

const refused = runFix("---\nlang: de\n---\nHallo !", "fr", "Hallo !");
check("langue non prise en charge : texte intact", refused.text, "---\nlang: de\n---\nHallo !");
check("… et l'utilisateur est prévenu", NOT_CORRECTED.test(refused.message), true);
const undecided = runFix("Bonjour !", "auto", "Bonjour !");
check("langue indéterminée : texte intact", undecided.text, "Bonjour !");
check("… et l'utilisateur est prévenu", NOT_CORRECTED.test(undecided.message), true);
check("réglage « aucune » sans propriété : texte intact", runFix("Bonjour !", "off", "Bonjour !").text, "Bonjour !");
check(
	"réglage « aucune » avec propriété : corrigé",
	runFix("---\nlang: fr\n---\nBonjour !", "off", "Bonjour !").text,
	`---\nlang: fr\n---\nBonjour${NNBSP}!`
);
check("sans sélection : le message d'origine", runFix("Bonjour", "fr", "").message, "Sélectionnez d'abord le texte à corriger.");

section("Langue : diagnostic");
// L'avis a deux blocs, séparés par une ligne vide : la note, puis le paragraphe
// sous le curseur, que `cursor` place dans le texte.
const diagnose = (note, setting, cursor = 0) => {
	Notice.messages.length = 0;
	Notice.classes.length = 0;
	const instance = newPlugin();
	instance.settings.defaultLanguage = setting;
	instance.diagnoseLanguage(new FakeEditor(note, cursor));
	const all = Notice.messages.at(-1).split("\n");
	const blank = all.indexOf("");

	return { lines: all.slice(0, blank), paragraph: all.slice(blank + 1), classes: [...Notice.classes] };
};

check("propriété anglaise", diagnose("---\nlang: en-US\n---\nx", "fr").lines, [
	"Langue de la note : anglais",
	"Source : propriété « lang » de la note (valeur : « en-US »)",
	"Langue par défaut des réglages : Français",
	"Effet : correction selon les règles anglaises, sans repérage des espaces",
]);
check("réglage par défaut", diagnose("Bonjour", "fr").lines, [
	"Langue de la note : français",
	"Source : langue par défaut des réglages",
	"Langue par défaut des réglages : Français",
	"Effet : correction et repérage selon les règles françaises",
]);
check("détection concluante", diagnose(FR_TEXT, "auto").lines, [
	"Langue de la note : français",
	"Source : détection automatique (mots-outils : français 11, anglais 0)",
	"Langue par défaut des réglages : Automatique",
	"Effet : correction et repérage selon les règles françaises",
]);
check("détection sans conclusion", diagnose("Bonjour", "auto").lines, [
	"Langue de la note : indéterminée",
	"Source : détection automatique, sans conclusion (mots-outils : français 0, anglais 0) — trop peu d'indices, ou trop partagés",
	"Langue par défaut des réglages : Automatique",
	"Effet : ni correction ni repérage sur cette note",
]);
check("langue non prise en charge", diagnose("---\nlang: de\n---\nx", "fr").lines, [
	"Langue de la note : non prise en charge (« de »)",
	"Source : propriété « lang » de la note (valeur : « de »)",
	"Langue par défaut des réglages : Français",
	"Effet : ni correction ni repérage sur cette note",
]);
check("réglage « aucune »", diagnose("Bonjour", "off").lines, [
	"Langue de la note : aucune",
	"Source : langue par défaut des réglages",
	"Langue par défaut des réglages : Aucune",
	"Effet : ni correction ni repérage sur cette note",
]);
check("l'avis est affiché ligne par ligne", diagnose("Bonjour", "fr").classes, ["special-char-diagnostic"]);
check(
	"le diagnostic dit la clé telle qu'écrite dans la note",
	diagnose("---\nLangue: en\n---\nx", "fr").lines[1],
	"Source : propriété « Langue » de la note (valeur : « en »)"
);

section("Langue : signalement dans l'éditeur");
const flagged = (text, lang) => {
	const found = [];
	plugin.collectWrongSpaces(fakeView(text, [{ from: 0, to: text.length }]), (from, to) => found.push([from, to]), lang);
	return found;
};
const FAULTY = "Hello! Note: this ?";

check("note française : les espaces fautives sont signalées", flagged(FAULTY, "fr").length > 0, true);
check("note anglaise : rien n'est signalé", flagged(FAULTY, "en"), []);
check("langue indéterminée : rien non plus", flagged(FAULTY, null), []);

check("le document dit sa langue", plugin.viewLanguage(fakeView("---\nlang: en\n---\nx", []), "fr").lang, "en");
check("à défaut, le réglage", plugin.viewLanguage(fakeView("Bonjour", []), "en").lang, "en");
check("réglage « aucune » : pas de langue", plugin.viewLanguage(fakeView("Bonjour", []), "off").lang, null);
check("réglage « automatique » : détectée sur le document", plugin.viewLanguage(fakeView(FR_TEXT, []), "auto").lang, "fr");
// CodeMirror ne reconstruit les décorations que pour un plugin qu'il n'a pas
// encore vu : chaque changement de réglage doit donc en produire un neuf.
check(
	"chaque appel produit un plugin distinct",
	plugin.createWrongSpacesViewPlugin(() => "fr") !== plugin.createWrongSpacesViewPlugin(() => "fr"),
	true
);

section("Langue : découpage en paragraphes");
const { paragraphsOf, maskProtected } = plugin;

check("deux paragraphes séparés par une ligne vide", paragraphsOf("a\nb\n\nc"), [
	{ from: 0, to: 3 },
	{ from: 5, to: 6 },
]);
check("une ligne d'espaces sépare aussi", paragraphsOf("a\n  \nb"), [
	{ from: 0, to: 1 },
	{ from: 5, to: 6 },
]);
check("plusieurs lignes vides d'affilée", paragraphsOf("a\n\n\n\nb"), [
	{ from: 0, to: 1 },
	{ from: 5, to: 6 },
]);
check("fins de ligne Windows : le retour chariot n'est pas dans le paragraphe", paragraphsOf("a\r\nb\r\n\r\nc"), [
	{ from: 0, to: 4 },
	{ from: 8, to: 9 },
]);
check("texte vide", paragraphsOf(""), []);
check("rien que des lignes vides", paragraphsOf("\n\n  \n"), []);

const codeNote = "Avant\n```\nx = 1\n\ny = 2\n```\nAprès";
const masked = maskProtected(codeNote);
check("le masque garde la longueur du texte", masked.length, codeNote.length);
check("… ses sauts de ligne, et efface le code", masked, "Avant\n   \n     \n\n     \n   \nAprès");
check(
	"un bloc de code sépare les paragraphes, même sans ligne vide autour",
	paragraphsOf(masked).map((p) => codeNote.slice(p.from, p.to)),
	["Avant", "Après"]
);
check(
	"le code en ligne devient des espaces, sans couper le paragraphe",
	paragraphsOf(maskProtected("Un `code` ici")).map((p) => p.to - p.from),
	[13]
);

section("Langue : langue de chaque paragraphe");
const spans = (text, lang = "fr", paragraphs = true) =>
	plugin.languageSpans(text, lang, paragraphs).map((s) => [s.from, s.to, s.lang]);
const mixed = `${FR_TEXT}\n\n${EN_TEXT}`;
const n1 = FR_TEXT.length;
const n2 = EN_TEXT.length;

check("sans détection par paragraphe, tout suit la note", spans(mixed, "fr", false), [[0, mixed.length, "fr"]]);
check("un paragraphe anglais dans une note française", spans(mixed, "fr"), [
	[0, n1, "fr"],
	[n1, n1 + 2, "fr"],
	[n1 + 2, n1 + 2 + n2, "en"],
]);
check("un paragraphe français dans une note anglaise", spans(mixed, "en"), [
	[0, n1, "fr"],
	[n1, n1 + 2, "en"],
	[n1 + 2, n1 + 2 + n2, "en"],
]);
check("une note sans langue : chaque paragraphe décide seul", spans(mixed, null), [
	[0, n1, "fr"],
	[n1, n1 + 2, null],
	[n1 + 2, n1 + 2 + n2, "en"],
]);
const SHORT = "Bonjour tout le monde";
check("un paragraphe trop court suit la note", spans(`${FR_TEXT}\n\n${SHORT}`, "en"), [
	[0, n1, "fr"],
	[n1, n1 + 2, "en"],
	[n1 + 2, n1 + 2 + SHORT.length, "en"],
]);
check("un paragraphe partagé entre les deux langues suit la note", spans(`${FR_TEXT} ${EN_TEXT}`, "fr"), [
	[0, n1 + 1 + n2, "fr"],
]);
check("texte vide", spans("", "fr"), [[0, 0, "fr"]]);

const withCode = `${FR_TEXT}\n\`\`\`\n${codeWords}\`\`\`\n${EN_TEXT}`;
const codeSpans = plugin.languageSpans(withCode, "fr", true);
check(
	"un bloc de code sépare deux paragraphes de langues différentes",
	[codeSpans.length, codeSpans[0].lang, codeSpans.at(-1).lang, withCode.slice(codeSpans.at(-1).from, codeSpans.at(-1).to)],
	[3, "fr", "en", EN_TEXT]
);

const contiguous = (text, lang) => {
	const found = plugin.languageSpans(text, lang, true);
	return found[0].from === 0 && found.at(-1).to === text.length && found.every((s, i) => i === 0 || s.from === found[i - 1].to);
};
check("les segments se suivent sans trou ni chevauchement", [mixed, withCode, `\n\n${mixed}\n\n`, SHORT].map((t) => contiguous(t, "fr")), [
	true,
	true,
	true,
	true,
]);

section("Langue : paragraphe sous le curseur");
const at = (text, offset, setting = "fr") => plugin.resolveParagraph(text, offset, plugin.resolveLanguage(text, setting));

check("un paragraphe anglais est reconnu", at(mixed, n1 + 4), {
	lang: "en",
	origin: "detected",
	scores: { fr: 0, en: 12 },
	words: 20,
});
check("un paragraphe français est reconnu", at(mixed, 3), {
	lang: "fr",
	origin: "detected",
	scores: { fr: 11, en: 0 },
	words: 17,
});
check("dans une note anglaise aussi", at(mixed, 3, "en").lang, "fr");
check("fin du paragraphe comprise", at(mixed, n1).origin, "detected");
check("début du suivant compris", at(mixed, n1 + 2).lang, "en");
check("ligne vide : aucun paragraphe", at(mixed, n1 + 1), { lang: "fr", origin: "inherited", reason: "outside" });
check("texte vide : aucun paragraphe", at("", 0), { lang: "fr", origin: "inherited", reason: "outside" });
check("dans du code : aucun paragraphe", at(withCode, withCode.indexOf("if the"), "fr").reason, "outside");
check("un paragraphe trop court hérite de la note", at(`${FR_TEXT}\n\n${SHORT}`, n1 + 4, "en"), {
	lang: "en",
	origin: "inherited",
	reason: "short",
	scores: { fr: 1, en: 0 },
	words: 4,
});
check("un paragraphe indécis hérite de la note", at(`${FR_TEXT} ${EN_TEXT}`, 5), {
	lang: "fr",
	origin: "inherited",
	reason: "unclear",
	scores: { fr: 11, en: 12 },
	words: 37,
});
check("note bilingue en « automatique » : sans langue d'ensemble, le paragraphe décide", [
	resolved(mixed, "auto").lang,
	at(mixed, 3, "auto").lang,
	at(mixed, n1 + 4, "auto").lang,
], [null, "fr", "en"]);
check("réglage « aucune » : pas de détection", at(mixed, 3, "off"), { lang: null, origin: "inherited", reason: "excluded" });
check("langue non prise en charge : pas de détection", at(`---\nlang: de\n---\n${mixed}`, 40, "fr"), {
	lang: null,
	origin: "inherited",
	reason: "excluded",
});
check(
	"une propriété « fr » laisse reconnaître un paragraphe anglais",
	at(`---\nlang: fr\n---\n${mixed}`, `---\nlang: fr\n---\n${FR_TEXT}\n\n`.length + 4, "fr").lang,
	"en"
);

// Le verdict du curseur et les segments de la correction doivent dire la même
// chose : la commande de diagnostic ne vaut que si elle décrit ce que le plugin
// fait vraiment. Une seule différence de nature : un curseur juste après le
// dernier caractère d'un paragraphe y est encore, alors qu'un segment se compose
// de caractères et que le saut de ligne qui suit n'en fait pas partie. Cette
// position, déjà vérifiée plus haut, est donc exclue de la comparaison.
for (const [name, text, setting] of [
	["note française", mixed, "fr"],
	["note anglaise", mixed, "en"],
	["note bilingue", `${mixed}\n\n${SHORT}\n\n${FR_TEXT} ${EN_TEXT}`, "auto"],
	["avec du code", withCode, "fr"],
	["avec des passages forcés", `${mixed}\n\nUn <span lang="en">it is "x" !</span> et <span lang="de">y</span> ok`, "fr"],
	["passages forcés dans une note sans langue", `x <span lang="en">a <span lang="fr">b</span> c</span> y`, "off"],
]) {
	const note = plugin.resolveLanguage(text, setting);
	const found = plugin.languageSpans(text, note.lang, plugin.paragraphDetectionApplies(note));
	const paragraphEnds = [
		...paragraphsOf(maskProtected(text)).map((p) => p.to),
		...plugin.forcedRanges(text).map((r) => r.to),
	];
	const disagreements = [...text]
		.map((_, offset) => offset)
		.filter((offset) => !paragraphEnds.includes(offset))
		.filter((offset) => {
			const span = found.find((s) => offset >= s.from && offset < s.to);
			return plugin.resolveParagraph(text, offset, note).lang !== span.lang;
		});
	check(`le diagnostic et les segments concordent : ${name}`, disagreements, []);
}

section("Correction typographique : plusieurs langues");
const frLine14 = 'Il dit "oui" !';
const enLine15 = 'He said "yes" !';
const twoLanguages = `${frLine14}\n\n${enLine15}`;
const gap = frLine14.length + 2;

check(
	"chaque segment est corrigé selon sa langue",
	applyTypography(twoLanguages, [
		{ from: 0, to: frLine14.length, lang: "fr" },
		{ from: frLine14.length, to: gap, lang: "fr" },
		{ from: gap, to: twoLanguages.length, lang: "en" },
	]),
	`Il dit «${NNBSP}oui${NNBSP}»${NNBSP}!\n\nHe said “yes” !`
);
check(
	"un segment sans langue est laissé tel quel",
	applyTypography(twoLanguages, [{ from: 0, to: twoLanguages.length, lang: null }]),
	twoLanguages
);
check("ce que les segments ne couvrent pas est laissé tel quel", applyTypography("Oui ! non !", [{ from: 0, to: 5, lang: "fr" }]), `Oui${NNBSP}! non !`);

// Une frontière de segment au milieu d'un bloc de code ne doit rien changer : la
// portion protégée est écartée avant, jamais découpée.
const fenced = 'Un "a" !\n\n```\n"b" !\n\n"c" !\n```\n\nHe said "d" !';
const fenceStart = fenced.indexOf("```");
const fenceMiddle = fenced.indexOf('"c"');
const afterFence = fenced.indexOf("He said");
check(
	"les segments coupent un bloc de code sans l'abîmer",
	applyTypography(fenced, [
		{ from: 0, to: fenceStart, lang: "fr" },
		{ from: fenceStart, to: fenceMiddle, lang: "fr" },
		{ from: fenceMiddle, to: afterFence, lang: "en" },
		{ from: afterFence, to: fenced.length, lang: "en" },
	]),
	`Un «${NNBSP}a${NNBSP}»${NNBSP}!\n\n${fenced.slice(fenceStart, afterFence)}He said “d” !`
);
check("une langue seule s'applique toujours à tout le texte", applyTypography(twoLanguages, "fr"), applyTypography(twoLanguages, [{ from: 0, to: twoLanguages.length, lang: "fr" }]));

section("Langue : correction par paragraphe");
const frPara = `${FR_TEXT}\nBonjour !`;
const enPara = `${EN_TEXT}\nHe said "hi" !`;
const twoParas = `${frPara}\n\n${enPara}`;
const twoParasFixed = `${FR_TEXT}\nBonjour${NNBSP}!\n\n${EN_TEXT}\nHe said “hi” !`;

check("une sélection sur deux paragraphes : chacun selon sa langue", runFix(twoParas, "fr", twoParas).text, twoParasFixed);
// Ces quatre mots, seuls, sont trop courts pour être jugés : la langue est celle
// du paragraphe entier, dont la sélection ne couvre qu'une ligne.
check(
	"une sélection au milieu d'un paragraphe : la langue du paragraphe entier",
	runFix(twoParas, "fr", 'He said "hi" !').text,
	`${frPara}\n\n${EN_TEXT}\nHe said “hi” !`
);
check("la note bilingue n'a pas de langue d'ensemble", resolved(twoParas, "auto").lang, null);
check("… et chaque paragraphe est pourtant corrigé selon la sienne", runFix(twoParas, "auto", twoParas).text, twoParasFixed);
const paraRefused = runFix(`${twoParas}\n\nBonjour !`, "auto", "Bonjour !");
check("… sauf un paragraphe trop court, laissé sans langue", paraRefused.text, `${twoParas}\n\nBonjour !`);
check("… et l'utilisateur est prévenu", NOT_CORRECTED.test(paraRefused.message), true);
check(
	"une propriété « fr » n'empêche pas de reconnaître un paragraphe anglais",
	runFix(`---\nlang: fr\n---\n${twoParas}`, "fr", 'He said "hi" !').text,
	`---\nlang: fr\n---\n${frPara}\n\n${EN_TEXT}\nHe said “hi” !`
);
check("langue non prise en charge : rien n'est corrigé", runFix(`---\nlang: de\n---\n${twoParas}`, "fr", twoParas).text, `---\nlang: de\n---\n${twoParas}`);
check("réglage « aucune » : rien n'est corrigé", runFix(twoParas, "off", twoParas).text, twoParas);
check("une sélection ne cite pas le paragraphe voisin", runFix(twoParas, "fr", "Bonjour !").text, twoParas.replace("Bonjour !", `Bonjour${NNBSP}!`));

section("Langue : signalement par paragraphe");
const flaggedIn = (text, lang, paragraphs, ranges = [{ from: 0, to: text.length }]) => {
	const found = [];
	plugin.collectWrongSpaces(fakeView(text, ranges), (from, to) => found.push([from, to]), lang, paragraphs);
	return found;
};
const frLine = `${FR_TEXT} Salut !`;
const noteTwo = `${frLine}\n\n${EN_TEXT} Really !`;
const bang = frLine.indexOf(" !");
const frenchOnly = [
	[bang, bang + 1],
	[bang + 1, bang + 1],
];

check("seuls les paragraphes français sont signalés", flaggedIn(noteTwo, "fr", true), frenchOnly);
check("sans détection par paragraphe, tout l'est", flaggedIn(noteTwo, "fr", false).length, 4);
check("une note anglaise garde ses paragraphes français signalés", flaggedIn(noteTwo, "en", true), frenchOnly);
check("une note sans langue aussi", flaggedIn(noteTwo, null, true), frenchOnly);
check("sans langue ni paragraphes, rien", flaggedIn(noteTwo, null, false), []);
check("un paragraphe court suit la note : française", flaggedIn("Bonjour !\n\nSalut !", "fr", true).length, 4);
check("… anglaise", flaggedIn("Bonjour !\n\nSalut !", "en", true), []);

// Le signalement ne doit pas dépendre de la portion de la note à l'écran : un
// paragraphe anglais dont seule la dernière ligne est visible paraîtrait trop
// court pour être reconnu, et ses espaces se mettraient à être signalées au
// défilement.
const scrolled = `${frLine}\n\n${EN_TEXT}\nReally !\nWell !`;
const wellFrom = scrolled.indexOf("Well !");
check("tout à l'écran", flaggedIn(scrolled, "fr", true), frenchOnly);
check(
	"seule la dernière ligne d'un paragraphe anglais est visible : rien n'est signalé",
	flaggedIn(scrolled, "fr", true, [{ from: wellFrom, to: wellFrom + 6 }]),
	[]
);
check(
	"seule la première ligne est visible : le même résultat qu'en entier",
	flaggedIn(scrolled, "fr", true, [{ from: 0, to: frLine.length }]),
	frenchOnly
);
check(
	"deux plages visibles, deux paragraphes : le même résultat qu'en entier",
	flaggedIn(scrolled, "fr", true, [
		{ from: 0, to: 10 },
		{ from: wellFrom, to: wellFrom + 6 },
	]),
	frenchOnly
);

// L'analyse s'étend au paragraphe entier, mais un repère n'est posé que sur ce
// qui est à l'écran : ici « Deux ! » seule, positions 5 à 11.
const threeLines = "Un !\nDeux !\nTrois !";
check(
	"les repères ne sortent pas des lignes visibles",
	flaggedIn(threeLines, "fr", true, [{ from: 5, to: 11 }]),
	[
		[9, 10],
		[10, 10],
	]
);

section("Plages visibles : paragraphes entiers");
const paraView = (text, ranges) => plugin.visibleParagraphRanges(fakeView(text, ranges));
const paraText = "a\nb\n\nc\nd\n\ne";

check("une ligne visible s'étend à son paragraphe", paraView(paraText, [{ from: 2, to: 3 }]), [{ from: 0, to: 3 }]);
check("deux paragraphes distincts restent séparés", paraView(paraText, [{ from: 2, to: 3 }, { from: 10, to: 11 }]), [
	{ from: 0, to: 3 },
	{ from: 10, to: 11 },
]);
check("deux plages d'un même paragraphe fusionnent", paraView(paraText, [{ from: 0, to: 1 }, { from: 2, to: 3 }]), [{ from: 0, to: 3 }]);
check("une ligne vide visible n'étend rien", paraView(paraText, [{ from: 4, to: 4 }]), [{ from: 4, to: 4 }]);
check("les lignes visibles restent comprises", paraView(paraText, [{ from: 5, to: 8 }]), [{ from: 5, to: 8 }]);

const longLines = Array.from({ length: 300 }, (_, i) => `x${i}`);
const longDoc = Text.of(longLines);
check(
	"un paragraphe sans fin n'est pas étendu au-delà du plafond",
	paraView(longLines.join("\n"), [{ from: longDoc.line(300).from, to: longDoc.length }]),
	[{ from: longDoc.line(100).from, to: longDoc.length }]
);

section("Langue : diagnostic du paragraphe");
const twoDoc = mixed;
const FR_LINES = "Effet : correction et repérage selon les règles françaises";
const EN_LINES = "Effet : correction selon les règles anglaises, sans repérage des espaces";

check("un paragraphe anglais dans une note française", diagnose(twoDoc, "fr", n1 + 4).paragraph, [
	"Paragraphe sous le curseur : anglais",
	"Source : détection du paragraphe (mots-outils : français 0, anglais 12 ; 20 mots)",
	EN_LINES,
]);
check("… la note, elle, reste française", diagnose(twoDoc, "fr", n1 + 4).lines[0], "Langue de la note : français");
check("un paragraphe français", diagnose(twoDoc, "fr", 3).paragraph, [
	"Paragraphe sous le curseur : français",
	"Source : détection du paragraphe (mots-outils : français 11, anglais 0 ; 17 mots)",
	FR_LINES,
]);
check("note bilingue : indéterminée, mais pas ses paragraphes", [
	diagnose(twoDoc, "auto", 3).lines[0],
	diagnose(twoDoc, "auto", 3).paragraph[0],
	diagnose(twoDoc, "auto", n1 + 4).paragraph[0],
], ["Langue de la note : indéterminée", "Paragraphe sous le curseur : français", "Paragraphe sous le curseur : anglais"]);
check("un paragraphe trop court hérite de la note", diagnose(`${FR_TEXT}\n\n${SHORT}`, "en", n1 + 4).paragraph, [
	"Paragraphe sous le curseur : anglais",
	"Source : hérite de la note — paragraphe trop court (4 mots, 8 requis)",
	EN_LINES,
]);
check("un seul mot : le singulier", diagnose("Bonjour", "fr", 3).paragraph[1], "Source : hérite de la note — paragraphe trop court (1 mot, 8 requis)");
check("un paragraphe indécis hérite de la note", diagnose(`${FR_TEXT} ${EN_TEXT}`, "fr", 5).paragraph, [
	"Paragraphe sous le curseur : français",
	"Source : hérite de la note — détection sans conclusion (mots-outils : français 11, anglais 12 ; 37 mots)",
	FR_LINES,
]);
check("le curseur sur une ligne vide", diagnose(twoDoc, "fr", n1 + 1).paragraph, [
	"Paragraphe sous le curseur : français",
	"Source : hérite de la note — le curseur n'est dans aucun paragraphe de texte (ligne vide, code ou métadonnées)",
	FR_LINES,
]);
check("une note sans langue par choix", diagnose(twoDoc, "off", 3).paragraph, [
	"Paragraphe sous le curseur : aucune",
	"Source : hérite de la note — elle n'a volontairement aucune langue : pas de détection par paragraphe",
	"Effet : ni correction ni repérage sur cette note",
]);
check("une note vide", diagnose("", "fr").paragraph[1], "Source : hérite de la note — le curseur n'est dans aucun paragraphe de texte (ligne vide, code ou métadonnées)");
check("un seul avis, une classe : les deux blocs sont affichés ensemble", [diagnose(twoDoc, "fr", 3).classes, Notice.messages.length], [["special-char-diagnostic"], 1]);

section("Forçage explicite : balises <span lang>");
const forced = (text) => plugin.forcedRanges(text).map((r) => [text.slice(r.from, r.to), r.lang, r.value]);

check("guillemets doubles", forced('a <span lang="en">hello</span> b'), [["hello", "en", "en"]]);
check("guillemets simples", forced("a <span lang='fr'>salut</span>"), [["salut", "fr", "fr"]]);
check("valeur sans guillemets", forced("<span lang=en>hi</span>"), [["hi", "en", "en"]]);
check("casse, région et nom de la langue", forced('<SPAN LANG="EN-us">a</SPAN> <span lang="Français">b</span>'), [
	["a", "en", "EN-us"],
	["b", "fr", "Français"],
]);
check("d'autres attributs autour", forced('<span class="x" lang="en" title="t">a</span>'), [["a", "en", "en"]]);
check("langue non prise en charge : langue nulle", forced('<span lang="de">Hallo</span>'), [["Hallo", null, "de"]]);
check("data-lang n'est pas lang", forced('<span data-lang="en">a</span>'), []);
check("xml:lang non plus", forced('<span xml:lang="en">a</span>'), []);
check("un span sans lang", forced('<span class="en">a</span>'), []);
check("une valeur vide", forced('<span lang="">a</span>'), []);
check("sans fermeture : ignoré", forced('<span lang="en">a'), []);
check("texte sans balise", forced("Bonjour"), []);
check("un span sans lang imbriqué ne ferme pas l'autre", forced('<span lang="en">a <span class="k">b</span> c</span>'), [
	['a <span class="k">b</span> c', "en", "en"],
]);
check("passages imbriqués : l'extérieur d'abord", forced('<span lang="en">a <span lang="fr">b</span> c</span>'), [
	['a <span lang="fr">b</span> c', "en", "en"],
	["b", "fr", "fr"],
]);
check("deux passages à la suite", forced('<span lang="en">a</span> et <span lang="fr">b</span>'), [
	["a", "en", "en"],
	["b", "fr", "fr"],
]);
check("un passage sur plusieurs lignes d'un même paragraphe", forced('<span lang="en">a\nb</span>'), [["a\nb", "en", "en"]]);
check("une ligne vide le coupe", forced('<span lang="en">a\n\nb</span>'), []);
check("… fins de ligne Windows comprises", forced('<span lang="en">a\r\n\r\nb</span>'), []);
// Ce README, par exemple, cite la balise en exemple : elle ne doit pas agir.
check("citée dans du code en ligne", forced('Écrire `<span lang="en">a</span>` ici'), []);
check("citée dans un bloc de code", forced('```html\n<span lang="en">a</span>\n```'), []);
check("une vraie balise après du code", forced('`x` <span lang="en">a</span>'), [["a", "en", "en"]]);
check("une fermeture citée dans du code ne ferme rien", forced('<span lang="en">a `</span>` b</span>'), [
	["a `</span>` b", "en", "en"],
]);

const tag = '<span lang="en">';
const inlineNote = 'Il dit <span lang="en">it is "fine" !</span> puis "oui" !';
const contentFrom = "Il dit ".length + tag.length;
const contentTo = contentFrom + 'it is "fine" !'.length;

check("un passage forcé dans une note française", spans(inlineNote, "fr", false), [
	[0, contentFrom, "fr"],
	[contentFrom, contentTo, "en"],
	[contentTo, inlineNote.length, "fr"],
]);
check("… dans une note sans langue : c'est un choix explicite", spans(inlineNote, null, false), [
	[0, contentFrom, null],
	[contentFrom, contentTo, "en"],
	[contentTo, inlineNote.length, null],
]);
check("passages imbriqués : le plus intérieur l'emporte", spans('<span lang="en">a <span lang="fr">b</span> c</span>', null, false), [
	[0, 16, null],
	[16, 34, "en"],
	[34, 35, "fr"],
	[35, 44, "en"],
	[44, 51, null],
]);
check("une langue non prise en charge fait taire le passage", spans('x <span lang="de">y</span> z', "fr", false), [
	[0, 18, "fr"],
	[18, 19, null],
	[19, 28, "fr"],
]);
const paraWithSpan = `${FR_TEXT} <span lang="en">${EN_TEXT}</span>`;
// Sans cela, les mots anglais du passage feraient basculer tout le paragraphe :
// 11 mots-outils français contre 12 anglais, sans conclusion. La fermeture, en fin
// de ligne, est protégée donc blanche : elle n'appartient plus au paragraphe et
// suit la note, ce qui est sans effet puisqu'une balise n'est jamais corrigée.
check("le passage forcé n'entre pas dans le décompte de son paragraphe", spans(paraWithSpan, "en", true), [
	[0, n1 + 1 + tag.length, "fr"],
	[n1 + 1 + tag.length, n1 + 1 + tag.length + n2, "en"],
	[n1 + 1 + tag.length + n2, paraWithSpan.length, "en"],
]);
check(
	"… et le reste du paragraphe garde sa langue, alors que le décompte total n'aurait pas conclu",
	[detect(`${FR_TEXT} ${EN_TEXT}`).lang, spans(paraWithSpan, "en", true)[0][2]],
	[null, "fr"]
);
check("il ne coupe pas non plus le paragraphe", paragraphsOf(maskProtected(`a <span lang="en">x\ny</span> b`)).length, 1);

check("un passage forcé est corrigé selon sa langue", runFix(inlineNote, "fr", inlineNote).text,
	`Il dit <span lang="en">it is “fine” !</span> puis «${NNBSP}oui${NNBSP}»${NNBSP}!`);
check("une sélection à l'intérieur du passage aussi", runFix(inlineNote, "fr", 'it is "fine" !').text,
	`Il dit <span lang="en">it is “fine” !</span> puis "oui" !`);
check("dans une note sans langue, seul le passage est corrigé", runFix(inlineNote, "off", inlineNote).text,
	`Il dit <span lang="en">it is “fine” !</span> puis "oui" !`);
check("dans une note dont la langue n'est pas prise en charge aussi", runFix(`---\nlang: de\n---\n${inlineNote}`, "fr", inlineNote).text,
	`---\nlang: de\n---\nIl dit <span lang="en">it is “fine” !</span> puis "oui" !`);
check("passages imbriqués, chacun selon sa langue",
	runFix('<span lang="en">say "a" ! <span lang="fr">dis "b" !</span> ok "c" !</span>', "fr", '<span lang="en">say "a" ! <span lang="fr">dis "b" !</span> ok "c" !</span>').text,
	`<span lang="en">say “a” ! <span lang="fr">dis «${NNBSP}b${NNBSP}»${NNBSP}!</span> ok “c” !</span>`);
const dePassage = 'Un <span lang="de">Hallo "x" !</span> ici';
check("une langue non prise en charge : le passage est laissé tel quel", runFix(dePassage, "fr", dePassage).text, dePassage);

const withFrSpan = 'Say <span lang="fr">Salut !</span> ok !';
const spaceInSpan = withFrSpan.indexOf(" !");
const oneFault = [
	[spaceInSpan, spaceInSpan + 1],
	[spaceInSpan + 1, spaceInSpan + 1],
];
check("un passage français forcé est signalé dans une note anglaise", flaggedIn(withFrSpan, "en", false), oneFault);
check("… et dans une note sans langue", flaggedIn(withFrSpan, null, false), oneFault);
const frWithEnSpan = 'Salut ! <span lang="en">Really !</span> Oui !';
const lastSpace = frWithEnSpan.lastIndexOf(" !");
check("un passage anglais forcé n'est pas signalé dans une note française", flaggedIn(frWithEnSpan, "fr", false), [
	[5, 6],
	[6, 6],
	[lastSpace, lastSpace + 1],
	[lastSpace + 1, lastSpace + 1],
]);

const cursorInSpan = inlineNote.indexOf("it is") + 3;
check("diagnostic : un passage forcé", diagnose(inlineNote, "fr", cursorInSpan).paragraph, [
	"Paragraphe sous le curseur : anglais",
	'Source : balise <span lang="en"> autour du curseur',
	EN_LINES,
]);
check("… dans une note sans langue", diagnose(inlineNote, "off", cursorInSpan).paragraph[0], "Paragraphe sous le curseur : anglais");
check("… le curseur juste après l'ouverture est dedans", diagnose(inlineNote, "fr", contentFrom).paragraph[0], "Paragraphe sous le curseur : anglais");
check("… juste avant la fermeture aussi", diagnose(inlineNote, "fr", contentTo).paragraph[0], "Paragraphe sous le curseur : anglais");
check("… mais pas dans la balise elle-même", diagnose(inlineNote, "fr", contentFrom - 4).paragraph[1].startsWith("Source : balise"), false);
check("… langue non prise en charge", diagnose('<span lang="de">Hallo</span> x', "fr", 18).paragraph, [
	"Paragraphe sous le curseur : non prise en charge (« de »)",
	'Source : balise <span lang="de"> autour du curseur',
	"Effet : ni correction ni repérage dans cette balise",
]);
check("… passages imbriqués : le plus intérieur", diagnose('<span lang="en">a <span lang="fr">bb</span> c</span>', "fr", 36).paragraph.slice(0, 2), [
	"Paragraphe sous le curseur : français",
	'Source : balise <span lang="fr"> autour du curseur',
]);

section("Langue : réglages enregistrés");
const loadedSettings = async (data) => {
	const instance = new plugin.default();
	instance.loadData = async () => data;
	await instance.loadSettings();
	return instance.settings;
};

check("défaut : le français, comme avant le réglage", plugin.DEFAULT_SETTINGS.defaultLanguage, "fr");
check("data.json ancien, sans le réglage", (await loadedSettings({ flagWrongSpaces: false })).defaultLanguage, "fr");
check("data.json absent", (await loadedSettings(null)).defaultLanguage, "fr");
for (const value of plugin.LANGUAGE_SETTINGS) {
	check(`valeur « ${value} » conservée`, (await loadedSettings({ defaultLanguage: value })).defaultLanguage, value);
}
check("valeur inconnue écartée", (await loadedSettings({ defaultLanguage: "de" })).defaultLanguage, "fr");
check("valeur d'un autre type écartée", (await loadedSettings({ defaultLanguage: 42 })).defaultLanguage, "fr");

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
// Les noms que l'utilisateur lit ou tape doivent être ceux du README : une
// commande renommée, ou une clé de propriété ajoutée sans qu'il en soit dit
// mot, le laisserait chercher ce qui n'existe plus ou ignorer ce qui marche.
check(
	"chaque commande du plugin est nommée dans le README",
	[...source.matchAll(/name: "((?:Diagnostic|Corriger)[^"]*)"/g)].map((m) => m[1]).filter((name) => !readme.includes(name)),
	[]
);
check(
	"chaque clé de propriété de langue est citée dans le README",
	plugin.PROPERTY_KEYS.filter((key) => !readme.includes(`\`${key}\``)),
	[]
);
// Le README passe à la ligne où il veut : on compare sur le texte aplati.
const flatReadme = readme.replace(/\s+/g, " ");
check(
	"les seuils d'un paragraphe sont ceux annoncés dans le README",
	[`**${plugin.PARAGRAPH_MIN_WORDS} mots**`, `**${plugin.PARAGRAPH_MIN_HITS} mots-outils**`].filter((claim) => !flatReadme.includes(claim)),
	[]
);
check("le README montre la balise de forçage", flatReadme.includes('<span lang="en">'), true);
// package.json et le README annoncent MIT : le fichier doit être celui-là.
const licenseText = readFileSync(path.join(root, "LICENSE"), "utf8");
check(
	"la licence est la MIT, au nom annoncé par le README",
	[licenseText.startsWith("MIT License"), licenseText.includes("Copyright (c) 2026 Matthieu Thomas"), flatReadme.includes("[MIT](LICENSE)")],
	[true, true, true]
);
check("package.json déclare la même licence", JSON.parse(readFileSync(path.join(root, "package.json"), "utf8")).license, "MIT");
check(
	"chaque réglage de langue est décrit dans le README",
	Object.values(plugin.LANGUAGE_SETTING_LABELS).filter((label) => !readme.includes(`**${label}**`)),
	[]
);
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
