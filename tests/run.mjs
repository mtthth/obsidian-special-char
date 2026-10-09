import { spawnSync } from "child_process";
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "fs";
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
	charLabel,
	groupName,
	setLanguage,
	t,
	LANGUAGES,
} = plugin;

// Points de code attendus, écrits indépendamment de src/chars.ts (fichier
// JSON voisin) : plusieurs de ces caractères sont indiscernables à l'œil
// (· • ◦, µ contre le mu grec, – contre —, les espaces), une relecture visuelle
// ne prouverait rien.
const EXPECTED_CODE_POINTS = JSON.parse(readFileSync(path.join(root, "tests", "expected-code-points.json"), "utf8"));

const codePointOf = (char) =>
	[...char].map((c) => c.codePointAt(0).toString(16).toUpperCase().padStart(4, "0")).join("+");

const byId = (id) => ALL_CHARS.find((c) => c.id === id);

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
check("aucun libellé français en double", new Set(ALL_CHARS.map((c) => c.labelFr)).size, ALL_CHARS.length);
check("chaque caractère a un nom français", ALL_CHARS.filter((c) => !c.labelFr).map((c) => c.id), []);
check("chaque catégorie a un nom français", CHAR_GROUPS.filter((g) => !g.categoryFr).map((g) => g.category), []);
check("aucun nom anglais n'est resté en français", ALL_CHARS.filter((c) => c.label === c.labelFr && !["euro", "pi", "copyright", "cent", "franc", "hryvnia", "ligature-fi", "ligature-fl", "ligature-ff", "yen"].includes(c.id)).map((c) => c.id), []);
check("les deux espaces nommées", [codePointOf(NNBSP), codePointOf(NBSP)], ["202F", "00A0"]);

// La recherche porte sur les noms de la langue active : les tests qui suivent
// sont écrits avec les noms français, la langue est donc fixée en conséquence.
setLanguage("fr");
section("Recherche dans la palette");
const search = (raw) => {
	const query = normalizeForSearch(raw.trim());
	return CHAR_GROUPS.flatMap((group) => group.chars.filter((c) => matchesQuery(c, groupName(group), query))).map(
		(c) => c.id
	);
};

check("recherche vide : tout est affiché", search("").length, ALL_CHARS.length);
check("accents ignorés : « fleche » trouve les flèches", search("fleche").slice(0, 4), [
	"fleche-gauche",
	"fleche-droite",
	"fleche-haut",
	"fleche-bas",
]);
check("toutes les flèches, et elles seules", search("fleche").every((id) => id.startsWith("fleche-")), true);
check("« Flèche » accentué donne le même résultat", search("Flèche"), search("fleche"));
check("« cadratin » trouve les tirets et les espaces cadratins", search("cadratin"), [
	"espace-demi-cadratin",
	"espace-cadratin",
	"tiret-cadratin",
	"tiret-demi-cadratin",
]);
check("« anglais » ne trouve que les guillemets anglais", search("anglais"), [
	"guillemet-anglais-ouvrant",
	"guillemet-anglais-fermant",
]);
// Un nom de catégorie est aussi un critère : « guillemet » remonte donc les
// six caractères de « Guillemets et apostrophes ».
check("un nom de catégorie remonte toute la catégorie", search("guillemet").length, 10);
check("recherche par point de code", search("202f"), ["narrow-nbsp"]);
check("recherche par point de code préfixé", search("u+2014"), ["tiret-cadratin"]);
check("recherche par le caractère lui-même", search("→"), ["fleche-droite"]);
check("casse ignorée", search("MICRO"), ["micro"]);
check("aucun résultat", search("zzz"), []);
check("normalisation NFD", normalizeForSearch("Ç_É_Ê_Ü"), "c_e_e_u");

// Sur un clavier qwerty, on cherche une lettre de base pour trouver ses
// variantes accentuées. Les libellés contiennent presque tous un « e » : sans
// règle propre aux requêtes d'une lettre, « e » renverrait toute la table.
section("Recherche à une lettre");
const bases = (raw) => new Set(search(raw).map((id) => normalizeForSearch(byId(id).char)));
check("« e » ne trouve que des e", [...bases("e")], ["e"]);
check("« e » trouve é è ê ë et leurs capitales", ["é", "è", "ê", "ë", "É", "È", "Ê", "Ë"].every((c) => search("e").includes(ALL_CHARS.find((x) => x.char === c).id)), true);
check("« E » majuscule donne le même résultat", search("E"), search("e"));
check("« ø » trouve les deux casses du o barré", search("ø"), ["o-barre-min", "o-barre-maj"]);
check("« ß » trouve l'eszett minuscule et majuscule", search("ß"), ["ss-min", "ss-maj"]);
check("« ss » trouve l'eszett par son libellé", search("ss").filter((id) => id.startsWith("ss-")), ["ss-min", "ss-maj"]);
check("« thorn » et « th » trouvent le thorn", search("thorn"), ["thorn-min", "thorn-maj"]);

setLanguage("en");
section("Search in English");
// "narrow" contains "arrow": the narrow no-break space is the only other hit.
check("« arrow » finds the arrows, and nothing else but \"narrow\"", search("arrow").filter((id) => !id.startsWith("fleche-")), ["narrow-nbsp"]);
check("« arrow » finds all 15 arrows", search("arrow").filter((id) => id.startsWith("fleche-")).length, 15);
check("« em space » finds only the em space", search("em space"), ["espace-cadratin"]);
check("« em dash » finds only the em dash", search("em dash"), ["tiret-cadratin"]);
check("« en dash » finds only the en dash", search("en dash"), ["tiret-demi-cadratin"]);
check("« quote » finds the whole quotes category", search("quote").length, 10);
check("« diaeresis » finds the 12 diaeresis letters", search("diaeresis").length, 12);
check("« cedilla » is accent-insensitive on the typed query", search("CEDILLA"), search("cedilla"));
check("a French name finds nothing in English", search("flèche"), []);
check("« eszett » finds both cases", search("eszett"), ["ss-min", "ss-maj"]);
check("« thorn » finds both cases", search("thorn"), ["thorn-min", "thorn-maj"]);
check("a single letter still lists its variants", search("e").includes("e-aigu-min"), true);
check(
	"a single letter finds its stroked forms",
	["o", "l", "d", "h", "t"].map((letter) => search(letter).filter((id) => id.endsWith("-barre-min") || id.endsWith("-barre-maj"))),
	[
		["o-barre-min", "o-barre-maj"],
		["l-barre-min", "l-barre-maj"],
		["d-barre-min", "d-barre-maj"],
		["h-barre-min", "h-barre-maj"],
		["t-barre-min", "t-barre-maj"],
	]
);
check("« i » finds the dotless i", search("i").includes("i-sans-point-min"), true);
check("but « d » does not find the eth, a letter of its own", search("d").includes("eth-min"), false);
check("« ø » still finds only the stroked o", search("ø"), ["o-barre-min", "o-barre-maj"]);
check("« oe » finds the œ ligature", search("oe"), ["oe-minuscule", "oe-majuscule"]);
check("« ae » puts the æ ligature first", search("ae").slice(0, 2), ["ae-minuscule", "ae-majuscule"]);
check("« ij » finds the ĳ ligature", search("ij"), ["ij-minuscule", "ij-majuscule"]);
check("« nbsp » finds the no-break space alone", search("nbsp"), ["nbsp"]);
check("« nnbsp » finds the narrow no-break space", search("nnbsp"), ["narrow-nbsp"]);
setLanguage("fr");
check("les mots-clés valent aussi en français", [search("oe"), search("nbsp")], [["oe-minuscule", "oe-majuscule"], ["nbsp"]]);
setLanguage("en");

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

// Une ligne prise avec son saut de ligne (Maj+↓ depuis le début de ligne,
// triple clic) : le guillemet fermant doit rester sur la ligne.
const ligneEntiere = insertInto("ligne\nsuite", 0, 6, "«");
check("ligne sélectionnée avec son saut de ligne : il reste hors des guillemets", ligneEntiere.text, `«${NNBSP}ligne${NNBSP}»\nsuite`);
check("et seul le texte reste sélectionné", ligneEntiere.selected, "ligne");
check("les espaces aux bords restent dehors", insertInto("x bonjour y", 1, 10, "“").text, "x “bonjour” y");
check("une sélection de blancs seuls est entourée telle quelle", insertInto("a   b", 1, 4, "“").text, "a“   ”b");
const deuxLignes = FakeEditor.withSelections("un\ndeux\ntrois", [[0, 3], [3, 8]]);
insertSpecialChar(deuxLignes, "“");
check("plusieurs lignes sélectionnées une à une", deuxLignes.text, "“un”\n“deux”\ntrois");

section("Plusieurs sélections");
// « un » occupe 0-2, « deux » 3-7 et « trois » 8-13 de « un deux trois ».
const multi = FakeEditor.withSelections("un deux trois", [[0, 2], [8, 13]], 1);
insertSpecialChar(multi, "“");
check("chaque sélection est entourée avec son propre texte", multi.text, "“un” deux “trois”");
check("chacune reste sélectionnée", multi.selectedTexts(), ["un", "trois"]);
check("la sélection principale reste la même", multi.getSelection(), "trois");
check("en un seul pas d'annulation", multi.transactions, 1);

const multiFr = FakeEditor.withSelections("un deux", [[0, 2], [3, 7]]);
insertSpecialChar(multiFr, "«");
check("guillemets français sur deux sélections", multiFr.text, `«${NNBSP}un${NNBSP}» «${NNBSP}deux${NNBSP}»`);
check("les deux textes restent sélectionnés", multiFr.selectedTexts(), ["un", "deux"]);

// Une sélection inversée (tête avant l'ancre) est traitée comme les autres.
const inversee = FakeEditor.withSelections("un deux", [[2, 0], [7, 3]]);
insertSpecialChar(inversee, "“");
check("sélections inversées entourées", inversee.text, "“un” “deux”");

const curseurs = FakeEditor.withSelections("ab\ncd", [[1, 1], [4, 4]], 1);
insertSpecialChar(curseurs, "→");
check("plusieurs curseurs : le caractère est inséré à chacun", curseurs.text, "a→b\nc→d");
check("et chaque curseur passe après lui", curseurs.ranges.map((r) => [r.anchor, r.head]), [[2, 2], [6, 6]]);

const remplace = FakeEditor.withSelections("abcabc", [[1, 2], [4, 5]]);
insertSpecialChar(remplace, "—");
check("un caractère non apparié remplace chaque sélection", remplace.text, "a—ca—c");

const mixte = FakeEditor.withSelections("ab cd", [[0, 0], [3, 5]]);
insertSpecialChar(mixte, "«");
check("curseur et sélection mêlés", mixte.text, `«ab «${NNBSP}cd${NNBSP}»`);
check("le curseur avance, la sélection reste sur son texte", mixte.selectedTexts(), ["", "cd"]);

section("Caractères récents");
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

const elagage = newPlugin();
elagage.settings.recentChars = ["caractere-supprime", "yen", "livre", "micro", "puce", "division"];
insert(elagage, "plus-ou-moins");
check("un identifiant inconnu ne garde pas sa place dans les récents", elagage.settings.recentChars, [
	"plus-ou-moins",
	"yen",
	"livre",
	"micro",
	"puce",
	"division",
]);
check("les six places s'affichent", elagage.getRecentChars().length, 6);

const vide = newPlugin();
vide.settings.customChars = [{ id: "custom-1", char: "", label: "Vidé depuis" }];
vide.settings.recentChars = ["custom-1"];
insert(vide, "yen");
check("un caractère personnalisé vidé quitte les récents à l'insertion suivante", vide.settings.recentChars, ["yen"]);

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

// Deux clics sur la corbeille avant que la liste ne soit redessinée : le
// second ne doit pas emporter le voisin.
const corbeille = newPlugin();
const premier = { id: "custom-1", char: "≠", label: "" };
const voisin = { id: "custom-2", char: "⇒", label: "" };
corbeille.settings.customChars = [premier, voisin];
corbeille.settings.recentChars = ["custom-1", "yen"];
await Promise.all([corbeille.removeCustomChar(premier), corbeille.removeCustomChar(premier)]);
check("un double-clic sur la corbeille ne supprime qu'un caractère", corbeille.settings.customChars, [voisin]);
check("le caractère supprimé quitte aussitôt les récents", corbeille.settings.recentChars, ["yen"]);

const categories = (instance, hasQuery) =>
	new plugin.SpecialCharacterModal(instance, new FakeEditor("")).groupsToRender(hasQuery).map((g) => groupName(g));

const vierge = newPlugin();
check("sans personnalisés ni récents : la liste intégrée seule", categories(vierge, false)[0], "Spaces");

const garni = newPlugin();
garni.settings.customChars = [{ id: "custom-1", char: "≠", label: "Différent de" }];
check("les personnalisés passent devant la liste intégrée", categories(garni, false).slice(0, 2), [
	"Custom",
	"Spaces",
]);

garni.settings.recentChars = ["custom-1"];
check("ordre complet : récents, personnalisés, puis le reste", categories(garni, false).slice(0, 3), [
	"Recent",
	"Custom",
	"Spaces",
]);
check("pendant une recherche, les récents disparaissent mais pas les personnalisés", categories(garni, true).slice(0, 2), [
	"Custom",
	"Spaces",
]);
setLanguage("fr");
check("sections en français", categories(garni, false).slice(0, 3), ["Récents", "Personnalisés", "Espaces"]);
setLanguage("en");

section("Clavier dans la palette");
const { verticalNeighbor } = plugin;
// Deux sections : une grille de 4 colonnes sur deux lignes, dont la seconde
// n'a que 2 boutons, puis une section d'une seule ligne de 3 boutons. Le titre
// de section entre les deux décale la troisième ligne vers le bas.
const box = (left, top) => ({ left, top, width: 100 });
const grid = [
	box(0, 0), box(110, 0), box(220, 0), box(330, 0), // 0-3
	box(0, 70), box(110, 70.5), // 4-5, haut arrondi différemment
	box(0, 180), box(110, 180), box(220, 180), // 6-8
];
check("↓ descend d'une ligne, dans la même colonne", verticalNeighbor(grid, 1, 1), 5);
check("↓ sur une ligne plus courte : le bouton le plus proche", verticalNeighbor(grid, 3, 1), 5);
check("↓ passe à la section suivante", verticalNeighbor(grid, 5, 1), 7);
check("↑ remonte d'une ligne, dans la même colonne", verticalNeighbor(grid, 8, -1), 5);
check("↑ ignore les boutons de sa propre ligne", verticalNeighbor(grid, 4, -1), 0);
check("↓ sur la dernière ligne : aucun bouton", verticalNeighbor(grid, 7, 1), -1);
check("↑ sur la première ligne : aucun bouton", verticalNeighbor(grid, 2, -1), -1);

const palette = new plugin.SpecialCharacterModal(newPlugin(), new FakeEditor(""));
const inseres = [];
palette.chooseChar = (item) => inseres.push(item.id);
palette.visibleChars = [byId("yen")];
const touche = (props) => palette.handleSearchKeydown({ key: "Enter", preventDefault() {}, ...props });
touche({ isComposing: true });
touche({ keyCode: 229 });
check("Entrée pendant une saisie IME n'insère rien", inseres, []);
touche({});
check("Entrée hors IME insère le premier résultat", inseres, ["yen"]);

section("Enregistrement différé des réglages");
const frappe = newPlugin();
const champ = { id: "custom-1", char: "", label: "" };
frappe.settings.customChars = [champ];
for (const value of ["≠", "≠≠", "≠"]) frappe.updateCustomChar(champ, { char: value });
frappe.updateCustomChar(champ, { label: "Différent" });
check("chaque frappe met le réglage à jour aussitôt", champ, { id: "custom-1", char: "≠", label: "Différent" });
check("sans écrire data.json à chaque frappe", frappe.saveCount ?? 0, 0);
frappe.flushSave();
check("fermer les réglages écrit une seule fois", frappe.saveCount, 1);
check("avec la dernière valeur", frappe.saved.customChars, [{ id: "custom-1", char: "≠", label: "Différent" }]);
frappe.flushSave();
check("rien n'est réécrit s'il n'y a rien en attente", frappe.saveCount, 1);

const delai = newPlugin();
delai.settings.customChars = [{ id: "custom-1", char: "", label: "" }];
for (const value of ["a", "ab", "abc"]) delai.updateCustomChar(delai.settings.customChars[0], { char: value });
await new Promise((resolve) => setTimeout(resolve, 600));
check("une demi-seconde sans frappe suffit pour une seule écriture", delai.saveCount, 1);

const dechargement = newPlugin();
dechargement.updateCustomChar({ id: "custom-1", char: "", label: "" }, { char: "≠" });
dechargement.onunload();
check("désactiver le plugin écrit ce qui est en attente", dechargement.saveCount, 1);

section("Ouverture de la palette");
// Simule l'espace de travail : éditeur actif, et mode de la vue Markdown
// active (null quand ce n'en est pas une, une carte de canvas par exemple).
const ouvrir = ({ editor = true, mode = "source" } = {}) => {
	const instance = newPlugin();
	instance.app = {
		workspace: {
			activeEditor: editor ? { editor: new FakeEditor("") } : null,
			getActiveViewOfType: () => (mode ? { getMode: () => mode } : null),
		},
	};
	const fenetres = plugin.Modal.opened.length;
	const messages = plugin.Notice.messages.length;
	instance.openPicker();
	return { ouverte: plugin.Modal.opened.length > fenetres, messages: plugin.Notice.messages.slice(messages) };
};
check("en mode édition, la palette s'ouvre", ouvrir(), { ouverte: true, messages: [] });
check("en mode Lecture, elle ne s'ouvre pas et dit pourquoi", ouvrir({ mode: "preview" }), {
	ouverte: false,
	messages: ["Switch to editing mode to insert a special character."],
});
check("hors vue Markdown (carte de canvas), elle s'ouvre", ouvrir({ mode: null }).ouverte, true);
check("sans éditeur, le message habituel", ouvrir({ editor: false }), {
	ouverte: false,
	messages: ["Open a note first to insert a special character."],
});

section("Réglages lus dans data.json");
const loaded = async (data) => {
	const instance = newPlugin();
	instance.loadData = async () => data;
	await instance.loadSettings();
	return instance.settings;
};

const sansFichier = await loaded(null);
check("sans data.json : les réglages par défaut", sansFichier, plugin.DEFAULT_SETTINGS);
check("dont les tableaux ne sont pas ceux des défauts", [
	sansFichier.customChars !== plugin.DEFAULT_SETTINGS.customChars,
	sansFichier.recentChars !== plugin.DEFAULT_SETTINGS.recentChars,
], [true, true]);
sansFichier.customChars.push({ id: "custom-x", char: "≠", label: "" });
check("ajouter un caractère personnalisé ne touche pas les défauts", plugin.DEFAULT_SETTINGS.customChars, []);

const abime = await loaded({
	showInvisibleSpaces: "false",
	recentChars: ["yen", 42, null],
	customChars: [
		null,
		"≠",
		{ id: "custom-1", char: "≠", label: "Différent de" },
		{ id: "custom-2", char: 7, label: null },
		{ char: "†" },
	],
});
check("un booléen d'un autre type reprend sa valeur par défaut", abime.showInvisibleSpaces, true);
check("un vrai booléen est gardé", (await loaded({ showInvisibleSpaces: false })).showInvisibleSpaces, false);
check("les récents qui ne sont pas des identifiants sont écartés", abime.recentChars, ["yen"]);
check("les caractères personnalisés qui ne sont pas des objets sont écartés", abime.customChars.length, 3);
check("une entrée bien formée est gardée telle quelle", abime.customChars[0], {
	id: "custom-1",
	char: "≠",
	label: "Différent de",
});
check("un champ texte d'un autre type devient vide", [abime.customChars[1].char, abime.customChars[1].label], ["", ""]);
check("une entrée sans identifiant en reçoit un", /^custom-/.test(abime.customChars[2].id), true);
check(
	"chaque entrée gardée a des champs texte, que l'onglet des réglages peut afficher",
	abime.customChars.every((c) => ["id", "char", "label"].every((key) => typeof c[key] === "string")),
	true
);
check("une donnée qui n'est pas un objet donne les défauts", await loaded("abîmé"), plugin.DEFAULT_SETTINGS);

section("Language");
const names = (instance) => [...instance.commands.values()].map((c) => c.name);

check("the default language is English", plugin.DEFAULT_SETTINGS.language, "en");
check("two languages are offered", LANGUAGES, ["en", "fr"]);
check("English name", charLabel(byId("fleche-droite")), "Right arrow");
setLanguage("fr");
check("French name", charLabel(byId("fleche-droite")), "Flèche vers la droite");
check("French category", groupName(CHAR_GROUPS[0]), "Espaces");
check("a custom character keeps its own name in both languages", charLabel({ id: "c", char: "≠", label: "Mon signe" }), "Mon signe");
check("French message", t("notice.noEditor"), "Ouvrez d'abord une note pour insérer un caractère spécial.");
setLanguage("en");
check("English message", t("notice.noEditor"), "Open a note first to insert a special character.");
check("message variables", t("command.insert", { label: "Euro" }), "Insert: Euro");

const invalid = newPlugin();
invalid.loadData = async () => ({ language: "de" });
await invalid.loadSettings();
check("an unknown language in data.json falls back to English", invalid.settings.language, "en");

const french = newPlugin();
french.loadData = async () => ({ language: "fr" });
await french.loadSettings();
check("a saved language is restored", french.settings.language, "fr");
check("and applied at load", t("modal.title"), "Caractères spéciaux");
setLanguage("en");

check(
	"Obsidian's language mapped to the plugin's",
	["fr", "fr-CA", "FR", "en", "de", "zh-TW", null, undefined].map(plugin.languageFromLocale),
	["fr", "fr", "fr", "en", "en", "en", "en", "en"]
);
const withAppLanguage = async (appLanguage, data) => {
	plugin.stubApp.language = appLanguage;
	const instance = newPlugin();
	instance.loadData = async () => data;
	await instance.loadSettings();
	plugin.stubApp.language = "en";
	setLanguage("en");
	return instance.settings.language;
};
check("a 1.0 data.json (no language) follows Obsidian in French", await withAppLanguage("fr", { recentChars: ["yen"] }), "fr");
check("so does a first install", await withAppLanguage("fr", null), "fr");
check("a language chosen in the settings wins over Obsidian's", await withAppLanguage("fr", { language: "en" }), "en");
check("an unknown language in data.json falls back to Obsidian's", await withAppLanguage("fr", { language: "de" }), "fr");
check("an Obsidian language the plugin lacks gives English", await withAppLanguage("de", {}), "en");

const commands = newPlugin();
commands.registerCommands();
check("one command per character plus the picker", commands.commands.size, ALL_CHARS.length + 1);
check("command names are in English by default", [names(commands)[0], names(commands)[1]], [
	"Insert a special character (picker)",
	"Insert: Narrow no-break space",
]);
commands.settings.language = "fr";
commands.applyLanguage();
check("switching language renames the commands", [names(commands)[0], names(commands)[1]], [
	"Insérer un caractère spécial (fenêtre)",
	"Insérer : Espace fine insécable",
]);
check("without duplicating them", commands.commands.size, ALL_CHARS.length + 1);
check("ids are preserved", commands.commands.has("insert-narrow-nbsp"), true);
check("no command has a default hotkey", [...commands.commands.values()].filter((c) => c.hotkeys?.length).map((c) => c.id), []);
commands.settings.language = "en";
commands.applyLanguage();
check("and back to English", names(commands)[1], "Insert: Narrow no-break space");

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
check(
	"aucune dépendance en « latest » : le build ne doit pas changer d'un install à l'autre",
	Object.entries(JSON.parse(readFileSync(path.join(root, "package.json"), "utf8")).devDependencies)
		.filter(([, version]) => version === "latest")
		.map(([name]) => name),
	[]
);
check("package.json déclare la même licence", JSON.parse(readFileSync(path.join(root, "package.json"), "utf8")).license, "MIT");
// Les règles d'Obsidian pour les plugins de la communauté déconseillent les
// raccourcis par défaut : aucune commande ne doit en déclarer.
check("aucune commande n'a de raccourci par défaut", source.includes("hotkeys:"), false);
check(
	"le README suggère cinq raccourcis",
	[...readme.matchAll(/^\| `Ctrl \+ Shift \+ \w` \|/gm)].length,
	5
);
check(
	"les commandes suggérées par le README existent",
	[...readme.matchAll(/^\| `Ctrl \+ Shift \+ \w` \| (.+?) \|$/gm)].map((m) => m[1]).filter(
		(name) => !names(commands).includes(name)
	),
	[]
);

section("deploy.ps1");
// Le script ne tourne que sous Windows : ces vérifications portent sur son
// texte.
const deployBytes = readFileSync(path.join(root, "deploy.ps1"));
const deploy = deployBytes.toString("utf8");
const manifestId = JSON.parse(readFileSync(path.join(root, "manifest.json"), "utf8")).id;
// Sans BOM, Windows PowerShell 5.1 lit le fichier en Windows-1252 : les
// accents des messages sortent abîmés, et certains octets UTF-8 y deviennent
// des guillemets typographiques, que PowerShell prend pour des délimiteurs.
check("deploy.ps1 commence par un BOM UTF-8", [...deployBytes.subarray(0, 3)], [0xef, 0xbb, 0xbf]);
check(
	"pas de GetFullPath à deux arguments, absent de Windows PowerShell 5.1",
	/GetFullPath\([^()]*,/.test(deploy),
	false
);
check(
	"le dossier par défaut porte l'id du manifeste",
	deploy.match(/\$VaultPluginPath = "([^"]+)"/)[1].split("\\").pop(),
	manifestId
);

check(
	"Test-Path, Get-ChildItem et Get-Content prennent les chemins tels quels (-LiteralPath)",
	[...deploy.matchAll(/\b(Test-Path|Get-ChildItem|Get-Content)\b(?! -LiteralPath)/g)].map((m) => m[0]),
	[]
);

// Lancé pour de vrai quand PowerShell est là (pwsh, ou powershell.exe sous
// Windows ; PWSH peut désigner un autre exécutable), en mode -CheckOnly : ni
// build ni copie.
const powershell = [process.env.PWSH, "pwsh", "powershell"]
	.filter(Boolean)
	.find((exe) => spawnSync(exe, ["-NoProfile", "-Command", "exit 0"]).status === 0);
if (!powershell) {
	console.log("skip  PowerShell absent : deploy.ps1 n'est vérifié que sur son texte");
} else {
	const vaults = path.join(root, "tests", ".tmp", "vaults");
	rmSync(vaults, { recursive: true, force: true });
	const pluginsOf = (vault) => path.join(vaults, vault, ".obsidian", "plugins");
	const installed = (vault, folder, manifest) => {
		mkdirSync(path.join(pluginsOf(vault), folder), { recursive: true });
		writeFileSync(path.join(pluginsOf(vault), folder, "manifest.json"), manifest);
	};
	const checkDestination = (vault, folder = manifestId) => {
		const result = spawnSync(
			powershell,
			["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", path.join(root, "deploy.ps1"), "-VaultPluginPath", path.join(pluginsOf(vault), folder), "-CheckOnly"],
			{ encoding: "utf8" }
		);
		return { status: result.status, output: result.stdout + result.stderr };
	};

	installed("propre", "autre", '{"id":"autre"}');
	check("deploy.ps1 : destination libre acceptée", checkDestination("propre").status, 0);
	check("deploy.ps1 : dossier mal nommé refusé", checkDestination("propre", "obsidian-special-char").status, 1);

	installed("double [perso]", "obsidian-special-char", JSON.stringify({ id: manifestId }));
	const doublon = checkDestination("double [perso]");
	check(
		"deploy.ps1 : copie déjà installée sous un autre nom refusée, même avec des crochets dans le chemin",
		[doublon.status, doublon.output.includes("obsidian-special-char")],
		[1, true]
	);

	installed("abime", "autre", "{ pas du JSON");
	check("deploy.ps1 : le manifeste illisible d'un autre plugin est ignoré", checkDestination("abime").status, 0);
	rmSync(vaults, { recursive: true, force: true });
}

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
