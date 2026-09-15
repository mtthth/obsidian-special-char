# Insert Special Characters

Plugin Obsidian (desktop et mobile) qui affiche, à l'appui d'une touche, une
fenêtre permettant d'insérer rapidement des caractères typographiques
français difficiles à taper au clavier :

- Espace fine insécable (U+202F)
- Espace insécable (U+00A0)
- Guillemet français ouvrant « (U+00AB)
- Guillemet français fermant » (U+00BB)

## Utilisation

Deux façons d'insérer un caractère :

1. **Raccourci dédié par caractère.** Chacun des quatre caractères a sa
   propre commande Obsidian, avec un raccourci par défaut, entièrement
   reconfigurable (ou désactivable) dans Réglages → Raccourcis clavier
   (rechercher « Insérer : ») :
   - Espace fine insécable — `Ctrl/Cmd + Alt + 1`
   - Espace insécable — `Ctrl/Cmd + Alt + 2`
   - Guillemet ouvrant « — `Ctrl/Cmd + Alt + 3`
   - Guillemet fermant » — `Ctrl/Cmd + Alt + 4`
2. **Fenêtre de sélection.** Raccourci `Ctrl/Cmd + Alt + S` (lui aussi
   reconfigurable), icône dans le ruban latéral (utile sur mobile, sans
   clavier physique), ou commande « Insérer un caractère spécial
   (fenêtre) » depuis la palette de commandes. Dans la fenêtre, cliquez sur
   un caractère ou appuyez sur sa touche numérique (1 à 4) pour l'insérer
   au niveau du curseur.

## Installation manuelle

1. Compiler le plugin : `npm install && npm run build`.
2. Copier `manifest.json`, `main.js` et `styles.css` dans
   `<votre-coffre>/.obsidian/plugins/insert-special-characters/`.
3. Activer le plugin dans Réglages → Plugins communautaires.

## Développement

- `npm run dev` : compilation en mode watch.
- `npm run build` : vérification TypeScript puis build de production.
