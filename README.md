# Insert Special Characters

Plugin Obsidian (desktop et mobile) pour insérer rapidement les caractères
typographiques français et les symboles difficiles à taper au clavier :
espaces insécables, guillemets, capitales accentuées, ligatures, tirets,
opérateurs mathématiques, flèches…

Il met aussi en évidence les espaces insécables directement dans la fenêtre
d'édition, où elles sont normalement invisibles.

Ce plugin ne sert qu'à **insérer** des caractères spéciaux. La correction
automatique de la typographie (espaces avant la ponctuation, guillemets,
apostrophes, langue des notes…) relève de *Smart Typo FR*.

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

Les espaces insécables sont encadrées d'un fond coloré, une couleur pour chacune
(fine insécable, insécable), afin de les distinguer d'une espace normale. C'est
purement visuel — le texte du document n'est jamais modifié — et ça se désactive
dans **Réglages → Insert Special Characters**.

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
`src/chars.ts` (table des caractères, recherche, insertion),
`src/editor-decorations.ts` (surlignage dans l'éditeur, via CodeMirror),
`src/settings.ts`, `src/settings-tab.ts` et `src/picker-modal.ts`.

Les tests recompilent ces modules en un bundle exposant leurs fonctions
internes, le module `obsidian` étant remplacé par le stub de
`tests/obsidian-stub.js`. Ils couvrent la table des caractères (chaque point de
code est comparé à une valeur attendue écrite indépendamment, plusieurs de ces
caractères étant indiscernables à l'œil), la recherche, l'entourage de la
sélection, les caractères récents et personnalisés, ainsi que la cohérence du
README et des classes CSS avec le code.

## Licence

[MIT](LICENSE) © 2026 Matthieu Thomas (cidrolin).
