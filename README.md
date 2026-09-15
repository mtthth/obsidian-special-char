# Insert Special Characters

Plugin Obsidian (desktop et mobile) qui affiche, à l'appui d'une touche, une
fenêtre permettant d'insérer rapidement des caractères typographiques
français difficiles à taper au clavier :

- Espace fine insécable (U+202F)
- Espace insécable (U+00A0)
- Guillemet français ouvrant « (U+00AB)
- Guillemet français fermant » (U+00BB)

## Utilisation

- Raccourci par défaut : `Ctrl/Cmd + Alt + S` (modifiable dans Réglages →
  Raccourcis clavier).
- Icône dans le ruban latéral (utile sur mobile, sans clavier physique).
- Commande « Insérer un caractère spécial » accessible depuis la palette de
  commandes.

Dans la fenêtre qui s'ouvre, cliquez sur un caractère ou appuyez sur sa
touche numérique (1 à 4) pour l'insérer au niveau du curseur.

## Installation manuelle

1. Compiler le plugin : `npm install && npm run build`.
2. Copier `manifest.json`, `main.js` et `styles.css` dans
   `<votre-coffre>/.obsidian/plugins/insert-special-characters/`.
3. Activer le plugin dans Réglages → Plugins communautaires.

## Développement

- `npm run dev` : compilation en mode watch.
- `npm run build` : vérification TypeScript puis build de production.
