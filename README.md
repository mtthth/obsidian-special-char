# Insert Special Characters

Plugin Obsidian (desktop et mobile) pour insérer rapidement les caractères
typographiques français et les symboles difficiles à taper au clavier :
espaces insécables, guillemets, capitales accentuées, ligatures, tirets,
opérateurs mathématiques, flèches…

Il met aussi en évidence les espaces insécables directement dans la fenêtre
d'édition, où elles sont normalement invisibles.

Écrit par [Matthieu Thomas (cidrolin)](https://github.com/mtthth), sous
[licence MIT](LICENSE).

## Utilisation

Trois façons d'insérer un caractère :

1. **La fenêtre de sélection** — `Ctrl + Maj + S` par défaut. Tapez pour
   filtrer (la recherche ignore les accents et la casse : « fleche » trouve
   « Flèche »), puis `Entrée` pour insérer le premier résultat. Les flèches du
   clavier parcourent la grille, `Entrée` ou `Espace` insère, `Échap` ferme.
   Au clic ou au doigt, la fenêtre marche aussi bien sur mobile.
2. **Un raccourci dédié par caractère** — chacun des 43 caractères a sa propre
   commande, à laquelle vous pouvez attribuer le raccourci de votre choix.
   Les six derniers caractères insérés, au raccourci comme à la palette,
   réapparaissent dans une section **Récents** en tête de la fenêtre (masquée
   pendant une recherche, pour ne pas afficher deux fois les mêmes).
3. **La palette de commandes** ou **l'icône du ruban** (pratique sur mobile).

## Raccourcis clavier

Quatre caractères ont un raccourci par défaut :

| Raccourci | Caractère |
| --- | --- |
| `Ctrl + Maj + S` | Ouvrir la fenêtre de sélection |
| `Ctrl + Maj + 1` | Espace fine insécable |
| `Ctrl + Maj + 2` | Espace insécable |
| `Ctrl + Maj + 3` | Guillemet ouvrant « |
| `Ctrl + Maj + 4` | Guillemet fermant » |

Les 39 autres caractères n'ont volontairement pas de raccourci imposé : une
quarantaine de raccourcis par défaut entrerait forcément en conflit avec vos
autres plugins. Pour en attribuer un, allez dans **Réglages → Raccourcis
clavier** et cherchez `Insérer :` — chaque caractère y a sa ligne.

### Note pour les claviers AZERTY sous Windows

Les raccourcis par défaut utilisent `Ctrl + Maj`, jamais `Ctrl + Alt`. Sous
Windows, `Ctrl + Alt` est en effet équivalent à `AltGr`, dont un clavier AZERTY
a besoin pour saisir `@`, `~`, `#`, `{`, `}`, `[`, `]`, `|`, `\`, l'accent grave
et `€`. Si vous définissez vos propres raccourcis, mieux vaut éviter
`Ctrl + Alt` pour la même raison.

## Entourer une sélection

Avec du texte sélectionné, insérer un guillemet ou une apostrophe simple
**entoure** la sélection au lieu de la remplacer. Peu importe que vous insériez
l'ouvrant ou le fermant : les deux produisent la paire complète. Le texte reste
sélectionné entre les délimiteurs, et les guillemets français emportent leurs
espaces fines insécables.

| Sélection | Caractère inséré | Résultat |
| --- | --- | --- |
| `bonjour` | « ou » | « bonjour » |
| `bonjour` | “ ou ” | “bonjour” |
| `bonjour` | ‘ ou ’ | ‘bonjour’ |

Cela vaut aussi bien pour les raccourcis clavier que pour la fenêtre de
sélection. Les 37 autres caractères remplacent la sélection, comme n'importe
quelle frappe.

## Langue des notes

Les règles typographiques dépendent de la langue : le français impose une espace
fine avant `?` et `!`, l'anglais n'en met pas. Le plugin détermine donc la
langue de chaque **note**, jamais celle d'une sélection, dans cet ordre :

1. **La propriété de la note** — `lang`, `language` ou `langue`, valant `fr` ou
   `en`. La casse, les accents et la région sont ignorés : `EN`, `fr-FR`,
   `english` ou `Français` conviennent.

   ```yaml
   ---
   lang: en
   ---
   ```

   Elle l'emporte toujours. Une autre langue (`lang: de`) désactive la
   correction et le repérage sur cette note : mieux vaut ne rien faire que
   d'appliquer les règles d'une autre langue.
2. **La langue par défaut**, dans **Réglages → Insert Special Characters →
   Langue par défaut des notes**, pour les notes qui ne déclarent pas la leur :

   | Réglage | Effet |
   | --- | --- |
   | **Français** *(par défaut)* | Toutes ces notes sont françaises, comme avant l'existence du réglage. |
   | **Anglais** | Toutes ces notes sont anglaises. |
   | **Automatique** | La langue est déduite du texte, voir ci-dessous. |
   | **Aucune** | Ces notes ne reçoivent ni correction ni repérage : seules celles qui déclarent leur langue sont concernées. |

Avec **Automatique**, le plugin compte les mots-outils propres à chaque langue
(*le, la, des, est…* contre *the, and, of, is…*) dans les 16 000 premiers
caractères de la note, code, liens et métadonnées exclus. Il ne conclut que
s'il en trouve au moins quatre et que la langue gagnante en compte au moins deux
fois plus que l'autre. Une note trop courte, ou réellement bilingue, reste donc
**indéterminée** : aucune règle ne s'y applique, plutôt qu'un pari.

Quelques mots anglais dans une phrase française (« le cloud », « un
fine-tuning ») ne changent rien : la ponctuation suit la langue de la phrase, pas
celle du mot.

### Langue de chaque paragraphe

Une note n'a pas toujours une seule langue : une citation anglaise dans une note
française, ou l'inverse. Le plugin juge donc aussi chaque **paragraphe**, c'est-à-dire
un bloc de lignes non vides. Le code, les formules, les liens et les métadonnées
sont écartés avant de juger, et un bloc de code sépare deux paragraphes.

Un paragraphe a sa propre langue quand il compte **8 mots** au moins, dont **3
mots-outils** au moins d'une langue, et deux fois plus que de l'autre. Sinon —
trop court, ou partagé entre les deux langues — il suit la note : un titre, une
ligne de tableau ou une phrase de quelques mots n'est jamais une exception.

Cela vaut pour la correction, où chaque paragraphe d'une sélection est corrigé
selon sa langue, jugée sur le paragraphe **entier** même si la sélection n'en
couvre qu'une ligne, et pour le repérage des espaces fautives, qui n'examine
plus que les paragraphes français.

Deux précisions :

- La propriété de la note fixe la langue de la *note*, pas celle de chaque
  paragraphe : un paragraphe entièrement anglais reste reconnu dans une note
  `lang: fr`.
- Une note qui n'a volontairement aucune langue — réglage **Aucune**, ou langue
  non prise en charge comme `lang: de` — est laissée telle quelle : aucun
  paragraphe n'y est jugé. À l'inverse, une note en **Automatique** que la
  détection n'a pas su trancher, typiquement une note bilingue, est décidée
  paragraphe par paragraphe.

### Forcer la langue d'un passage

Quand la détection se trompe ou n'a pas de quoi juger — une seule phrase
anglaise, trop courte pour être reconnue —, on fixe la langue à la main avec une
balise HTML `span` portant l'attribut `lang` :

```markdown
Il a répondu <span lang="en">that's not "the" point</span>, puis il est parti !
```

Le contenu de la balise est corrigé et vérifié selon la langue indiquée, `fr` ou
`en` avec les mêmes variantes que la propriété de la note (`EN`, `fr-FR`,
`english`…), quelle que soit celle du paragraphe et de la note. La balise ne
change rien à l'affichage en mode lecture.

- Le forçage **l'emporte sur tout**, y compris dans une note qui n'a
  volontairement aucune langue (réglage **Aucune**, `lang: de`) : c'est un choix
  explicite, plus précis encore que la propriété.
- Une autre langue (`<span lang="de">`) fait laisser le passage tel quel.
- Les balises imbriquées se lisent de l'intérieur : la plus profonde l'emporte.
- Le passage reste dans son paragraphe. Une ligne vide l'interrompt, et la
  balise est alors ignorée, comme une balise jamais refermée ou sans valeur.
- Une balise citée dans un bloc de code ou entre accents graves n'a aucun effet :
  on peut donc l'écrire en exemple, comme ci-dessus.
- Les mots du passage ne comptent pas dans la détection de leur paragraphe : une
  citation anglaise ne fait pas basculer la phrase française qui l'entoure.
- Seule la balise `span` est reconnue, son ouverture tenant sur une seule ligne.

### Savoir quelle langue est retenue

La commande **« Diagnostic : langue de la note »**, dans la palette de
commandes, affiche pendant quelques secondes deux blocs : la langue retenue pour
la note ouverte, puis celle du paragraphe sous le curseur, avec pour chacune
d'où elle vient et ce que cela change :

```
Langue de la note : français
Source : langue par défaut des réglages
Langue par défaut des réglages : Français
Effet : correction et repérage selon les règles françaises

Paragraphe sous le curseur : anglais
Source : détection du paragraphe (mots-outils : français 0, anglais 12 ; 20 mots)
Effet : correction selon les règles anglaises, sans repérage des espaces
```

La source de la note est l'une des trois : la propriété de la note, la langue par
défaut des réglages, ou la détection automatique (avec, alors, le décompte des
mots-outils de chaque langue — utile quand elle refuse de conclure).

Celle du paragraphe est soit une balise `<span lang>` qui entoure le curseur,
soit sa propre détection, soit « hérite de la note », avec la raison :
paragraphe trop court (le nombre de mots est donné), détection sans conclusion
(le décompte aussi), curseur hors de tout paragraphe (ligne vide, code,
métadonnées) ou note sans langue par choix.

## Corriger la typographie d'une sélection

La commande **« Corriger la typographie de la sélection »** applique d'un coup
les règles typographiques de la langue de la note au texte sélectionné. Elle
n'a pas de raccourci par défaut : attribuez-le dans Réglages → Raccourcis
clavier si vous l'utilisez souvent. Tout se défait d'un seul `Ctrl + Z`, et la
sélection reste active après coup — utile, la plupart des corrections étant
invisibles.

Une sélection qui couvre plusieurs paragraphes de langues différentes est
corrigée paragraphe par paragraphe, chacun selon la sienne (voir *Langue de
chaque paragraphe*). Si aucune langue ne s'applique à la sélection, la commande
n'écrit rien et le dit ; « Diagnostic : langue de la note » en donne la raison.

### Notes en français

Règles appliquées :

| Exemple | Correction appliquée |
| --- | --- |
| `Bonjour ; ça va ?` | espace fine insécable avant `;` `!` `?` |
| `Attention : ici` | espace insécable avant `:` |
| `50 %` | espace fine insécable avant `%` (jamais avant `%%`, qui délimite un commentaire) |
| `« citation »` | espaces fines insécables à l'intérieur des guillemets |
| `Il a dit "bonjour"` | guillemets droits appariés → « bonjour » |
| `l'été` | apostrophe typographique `l’été` |
| `Ah...` | points de suspension `Ah…` |
| `mot , suite` | espace parasite avant la virgule supprimée |

### Notes en anglais

L'anglais n'a pas d'espace avant la ponctuation : la correction n'en ajoute
donc aucune, et ne touche pas à celles qui existent.

| Exemple | Correction appliquée |
| --- | --- |
| `He said "hello"` | guillemets courbes `He said “hello”` |
| `don't`, `users'`, `1990's` | apostrophe typographique `don’t` |
| `'hello'`, `'don't go'` | guillemets simples appariés `‘hello’` |
| `Wait...` | points de suspension `Wait…` |
| `word , next` | espace parasite avant la virgule supprimée |

Sont laissés tels quels les cas ambigus : `'tis` (un ouvrant sans fermant),
`5'10"` (pieds et pouces) et les guillemets droits non appariés.

### Dans les deux langues

La commande est **idempotente** : la relancer sur un texte déjà corrigé ne
change rien, car les espaces insécables existantes sont reconnues.

Elle ne touche jamais : les blocs et portions de code, les formules `$…$`, les
liens markdown et internes, les images intégrées, les URL, les balises HTML,
les définitions de référence (`[ref]: url`) et de note de bas de page
(`[^1]: texte`), les commentaires (`%% … %%`), ni le bloc de métadonnées quand
la sélection commence par lui.
Les cas ambigus sont laissés tels quels : `12:30`, `clé:: valeur` (Dataview),
`C:\dossier`, `:)` et les guillemets droits non appariés (`5"`).

Deux limites connues. Un `!` ou `?` placé juste après une portion protégée
(par exemple `` `du code` ! ``) ne reçoit pas son espace fine, faute de
contexte — aucun texte n'est abîmé, la correction est seulement omise. Et
sélectionner l'intérieur d'un bloc de métadonnées *sans* son `---` ouvrant fait
perdre à la commande le seul indice qui le lui signale : les `clé: valeur`
reçoivent alors une espace insécable. Sélectionnez le bloc entier, ou évitez de
lancer la correction dessus.

## Caractères disponibles

**Espaces**

| Caractère | Nom | Point de code |
| --- | --- | --- |
| *(invisible)* | Espace fine insécable | U+202F |
| *(invisible)* | Espace insécable | U+00A0 |

**Guillemets et apostrophes**

| Caractère | Nom | Point de code |
| --- | --- | --- |
| « | Guillemet français ouvrant | U+00AB |
| » | Guillemet français fermant | U+00BB |
| “ | Guillemet anglais ouvrant | U+201C |
| ” | Guillemet anglais fermant | U+201D |
| ‘ | Apostrophe simple ouvrante | U+2018 |
| ’ | Apostrophe typographique | U+2019 |

**Tirets et ponctuation**

| Caractère | Nom | Point de code |
| --- | --- | --- |
| — | Tiret cadratin | U+2014 |
| – | Tiret demi-cadratin | U+2013 |
| · | Point médian | U+00B7 |
| … | Points de suspension | U+2026 |

**Ligatures**

| Caractère | Nom | Point de code |
| --- | --- | --- |
| œ | Ligature œ minuscule | U+0153 |
| Œ | Ligature Œ majuscule | U+0152 |
| æ | Ligature æ minuscule | U+00E6 |
| Æ | Ligature Æ majuscule | U+00C6 |

**Capitales accentuées**

| Caractère | Nom | Point de code |
| --- | --- | --- |
| À | A majuscule accent grave | U+00C0 |
| Â | A majuscule accent circonflexe | U+00C2 |
| Ç | C majuscule cédille | U+00C7 |
| É | E majuscule accent aigu | U+00C9 |
| È | E majuscule accent grave | U+00C8 |
| Ê | E majuscule accent circonflexe | U+00CA |
| Ë | E majuscule tréma | U+00CB |
| Î | I majuscule accent circonflexe | U+00CE |
| Ï | I majuscule tréma | U+00CF |
| Ô | O majuscule accent circonflexe | U+00D4 |
| Ù | U majuscule accent grave | U+00D9 |
| Û | U majuscule accent circonflexe | U+00DB |
| Ü | U majuscule tréma | U+00DC |
| Ÿ | Y majuscule tréma | U+0178 |

**Mathématiques**

| Caractère | Nom | Point de code |
| --- | --- | --- |
| × | Signe de multiplication | U+00D7 |
| ÷ | Signe de division | U+00F7 |
| ≈ | Signe approximativement égal | U+2248 |
| ± | Signe plus ou moins | U+00B1 |

**Symboles et monnaies**

| Caractère | Nom | Point de code |
| --- | --- | --- |
| µ | Symbole micro | U+00B5 |
| • | Puce | U+2022 |
| ◦ | Puce creuse | U+25E6 |
| ¥ | Yen / Yuan | U+00A5 |
| £ | Livre sterling | U+00A3 |

**Flèches**

| Caractère | Nom | Point de code |
| --- | --- | --- |
| ← | Flèche vers la gauche | U+2190 |
| → | Flèche vers la droite | U+2192 |
| ↑ | Flèche vers le haut | U+2191 |
| ↓ | Flèche vers le bas | U+2193 |

## Caractères personnalisés

Il manquera toujours le 44ᵉ caractère : ajoutez le vôtre dans **Réglages →
Insert Special Characters**, avec un nom facultatif (sans lui, le point de code
sert d'étiquette). Vos caractères apparaissent dans une section
**Personnalisés** en tête de la fenêtre de sélection, sont trouvés par la
recherche et comptent parmi les récents, comme les caractères intégrés.

Ils n'ont en revanche pas de commande dédiée, donc pas de raccourci propre :
une commande ne peut pas être retirée proprement quand vous supprimez une
entrée. Passez par la fenêtre de sélection, où la recherche les trouve
immédiatement.

## Affichage dans l'éditeur

Deux mises en évidence, purement visuelles — le texte du document n'est jamais
modifié — activables séparément dans **Réglages → Insert Special Characters** :

- **Les espaces insécables** sont encadrées d'un fond coloré, une couleur pour
  chacune, afin de les distinguer d'une espace normale.
- **Les espacements fautifs**, dans les paragraphes français seulement (voir
  *Langue des notes* : un paragraphe anglais, ou dont la langue est
  indéterminée, n'est jamais signalé), sont marqués d'un petit repère rouge en
  forme de caret, très visible, glissé sous la ligne contre le signe concerné,
  du côté où l'insécable est attendue (devant `;` `!` `?` `%` `:` `»`, derrière
  `«`). Là où le français impose une insécable, il signale deux défauts : une
  espace ordinaire, qui autorise un retour à la ligne devant la ponctuation —
  c'est le défaut réel —, ou une espace totalement absente, par exemple
  `Attention: ici`. Une insécable déjà présente, fine ou non, n'est jamais
  signalée ; une espace ordinaire qui la côtoie l'est, en revanche, puisque la
  ligne peut toujours se couper sur elle.

Le repère n'occupe aucune place : le texte n'est ni décalé, ni coupé en fin de
ligne autrement qu'en son absence.

La commande de correction typographique ci-dessus corrige les deux d'un coup.

Le signalement ignore les mêmes zones que la correction : code, formules,
liens, URL et intégrations. Le bloc de métadonnées est reconnu sur la note
entière, et reste donc ignoré même après avoir défilé hors de l'écran. Deux
limites connues, purement à l'affichage : dans un bloc de code dont
l'ouverture ``` se trouve au-dessus de la partie visible de la note, les
espaces peuvent être signalées à tort ; et, comme pour la correction, un `!` ou
un `?` placé juste après une portion protégée (`` `du code` ! ``) n'est pas
signalé, faute de contexte.

## Installation manuelle

1. Compiler le plugin : `npm install && npm run build`.
2. Copier `manifest.json`, `main.js` et `styles.css` dans
   `<votre-coffre>/.obsidian/plugins/insert-special-characters/`.
3. Activer le plugin dans Réglages → Plugins communautaires.

## Développement

- `npm run dev` : compilation en mode watch.
- `npm run build` : vérification TypeScript puis build de production.
- `npm test` : suite de tests, sans dépendance externe ni lancement d'Obsidian.
- `deploy.ps1` (Windows/PowerShell) : build puis copie `main.js`, `manifest.json`
  et `styles.css` dans le dossier plugins du vault (chemin réglable via le
  paramètre `-VaultPluginPath`).

  Si Windows refuse de l'exécuter (« l'exécution de scripts est désactivée sur
  ce système ») alors que `Get-ExecutionPolicy -List` montre déjà `RemoteSigned`
  ou plus permissif, le fichier est probablement marqué comme téléchargé
  depuis Internet (zone Internet apposée par Windows sur les fichiers reçus
  autrement que par `git clone`/`git pull`, par ex. un `.zip` extrait). Le
  débloquer suffit :

  ```powershell
  Get-Item .\deploy.ps1 -Stream Zone.Identifier -ErrorAction SilentlyContinue
  Unblock-File .\deploy.ps1
  ```

Le code est réparti par responsabilité : `main.ts` n'assure plus que
l'orchestration (commandes, réglages, cycle de vie du plugin) et s'appuie sur
`src/chars.ts` (table des caractères, recherche, insertion), `src/typography.ts`
(règles de correction française et anglaise, détection des espaces fautives et
manquantes), `src/language.ts` (langue d'une note, de ses paragraphes et de ses
passages forcés : propriété, réglage, détection ou balise `span`, et texte du
diagnostic),
`src/editor-decorations.ts` (surlignage dans l'éditeur, via CodeMirror),
`src/settings.ts`, `src/settings-tab.ts` et `src/picker-modal.ts`.

Les tests recompilent ces modules en un bundle exposant leurs fonctions
internes, le module `obsidian` étant remplacé par le stub de
`tests/obsidian-stub.js`. Ils couvrent
la table des caractères (chaque point de code est comparé à une valeur attendue
écrite indépendamment, plusieurs de ces caractères étant indiscernables à
l'œil), la recherche, la correction typographique dans chaque langue, l'entourage
de la sélection, le signalement des espaces fautives, la langue des notes, de
leurs paragraphes et de leurs passages forcés (propriété, détection, balises,
ordre de résolution, diagnostic), les caractères récents, ainsi que la
cohérence du README et des classes CSS avec le code.

## Licence

[MIT](LICENSE) © 2026 Matthieu Thomas (cidrolin).
