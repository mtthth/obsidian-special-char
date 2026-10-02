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
// Le README passe à la ligne où il veut : on compare sur le texte aplati.
const flatReadme = readme.replace(/\s+/g, " ");
// package.json et le README annoncent MIT : le fichier doit être celui-là.
const licenseText = readFileSync(path.join(root, "LICENSE"), "utf8");
check(
	"la licence est la MIT, au nom annoncé par le README",
	[licenseText.startsWith("MIT License"), licenseText.includes("Copyright (c) 2026 Matthieu Thomas"), flatReadme.includes("[MIT](LICENSE)")],
	[true, true, true]
);
check("package.json déclare la même licence", JSON.parse(readFileSync(path.join(root, "package.json"), "utf8")).license, "MIT");
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
