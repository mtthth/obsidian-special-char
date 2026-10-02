# Insert Special Characters

Plugin Obsidian (desktop et mobile) pour insérer rapidement les caractères
typographiques et les lettres des langues européennes qui ne se tapent pas sur
un clavier qwerty (a-z, A-Z, 0-9) : espaces insécables, guillemets, lettres
accentuées (français, allemand, espagnol, polonais, tchèque, scandinaves…),
ligatures, tirets, monnaies, opérateurs mathématiques, exposants, flèches…

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
   « Flèche » ; une seule lettre, « e », liste toutes ses variantes é è ê ë ě ę…), puis `Entrée` pour insérer le premier résultat. Les flèches du
   clavier parcourent la grille, `Entrée` ou `Espace` insère, `Échap` ferme.
   Au clic ou au doigt, la fenêtre marche aussi bien sur mobile.
2. **Un raccourci dédié par caractère** — chacun des 303 caractères a sa propre
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

Les 299 autres caractères n'ont volontairement pas de raccourci imposé : des
centaines de raccourcis par défaut entrerait forcément en conflit avec vos
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
sélection. Les autres caractères remplacent la sélection, comme n'importe
quelle frappe.

## Caractères disponibles

**Espaces**

| Caractère | Nom | Point de code |
| --- | --- | --- |
| *(invisible)* | Espace fine insécable | U+202F |
| *(invisible)* | Espace insécable | U+00A0 |
| *(invisible)* | Espace fine | U+2009 |
| *(invisible)* | Espace ultrafine | U+200A |
| *(invisible)* | Espace de ponctuation | U+2008 |
| *(invisible)* | Espace demi-cadratin | U+2002 |
| *(invisible)* | Espace cadratin | U+2003 |
| ‑ | Trait d'union insécable | U+2011 |

**Guillemets et apostrophes**

| Caractère | Nom | Point de code |
| --- | --- | --- |
| « | Guillemet français ouvrant | U+00AB |
| » | Guillemet français fermant | U+00BB |
| ‹ | Guillemet français simple ouvrant | U+2039 |
| › | Guillemet français simple fermant | U+203A |
| “ | Guillemet anglais ouvrant | U+201C |
| ” | Guillemet anglais fermant | U+201D |
| ‘ | Apostrophe simple ouvrante | U+2018 |
| ’ | Apostrophe typographique | U+2019 |
| „ | Guillemet bas double (allemand, polonais, tchèque) | U+201E |
| ‚ | Guillemet bas simple (allemand, tchèque) | U+201A |

**Tirets et ponctuation**

| Caractère | Nom | Point de code |
| --- | --- | --- |
| — | Tiret cadratin | U+2014 |
| – | Tiret demi-cadratin | U+2013 |
| · | Point médian | U+00B7 |
| … | Points de suspension | U+2026 |
| ¿ | Point d'interrogation inversé (espagnol) | U+00BF |
| ¡ | Point d'exclamation inversé (espagnol) | U+00A1 |

**Ligatures**

| Caractère | Nom | Point de code |
| --- | --- | --- |
| œ | Ligature œ minuscule | U+0153 |
| Œ | Ligature Œ majuscule | U+0152 |
| æ | Ligature æ minuscule | U+00E6 |
| Æ | Ligature Æ majuscule | U+00C6 |
| ĳ | Ligature ĳ minuscule (néerlandais) | U+0133 |
| Ĳ | Ligature Ĳ majuscule (néerlandais) | U+0132 |
| ﬁ | Ligature fi | U+FB01 |
| ﬂ | Ligature fl | U+FB02 |
| ﬀ | Ligature ff | U+FB00 |

**Accent aigu**

| Caractère | Nom | Point de code |
| --- | --- | --- |
| á | A minuscule accent aigu | U+00E1 |
| Á | A majuscule accent aigu | U+00C1 |
| é | E minuscule accent aigu | U+00E9 |
| É | E majuscule accent aigu | U+00C9 |
| í | I minuscule accent aigu | U+00ED |
| Í | I majuscule accent aigu | U+00CD |
| ó | O minuscule accent aigu | U+00F3 |
| Ó | O majuscule accent aigu | U+00D3 |
| ú | U minuscule accent aigu | U+00FA |
| Ú | U majuscule accent aigu | U+00DA |
| ý | Y minuscule accent aigu | U+00FD |
| Ý | Y majuscule accent aigu | U+00DD |
| ć | C minuscule accent aigu | U+0107 |
| Ć | C majuscule accent aigu | U+0106 |
| ĺ | L minuscule accent aigu | U+013A |
| Ĺ | L majuscule accent aigu | U+0139 |
| ń | N minuscule accent aigu | U+0144 |
| Ń | N majuscule accent aigu | U+0143 |
| ŕ | R minuscule accent aigu | U+0155 |
| Ŕ | R majuscule accent aigu | U+0154 |
| ś | S minuscule accent aigu | U+015B |
| Ś | S majuscule accent aigu | U+015A |
| ź | Z minuscule accent aigu | U+017A |
| Ź | Z majuscule accent aigu | U+0179 |

**Accent grave**

| Caractère | Nom | Point de code |
| --- | --- | --- |
| à | A minuscule accent grave | U+00E0 |
| À | A majuscule accent grave | U+00C0 |
| è | E minuscule accent grave | U+00E8 |
| È | E majuscule accent grave | U+00C8 |
| ì | I minuscule accent grave | U+00EC |
| Ì | I majuscule accent grave | U+00CC |
| ò | O minuscule accent grave | U+00F2 |
| Ò | O majuscule accent grave | U+00D2 |
| ù | U minuscule accent grave | U+00F9 |
| Ù | U majuscule accent grave | U+00D9 |

**Accent circonflexe**

| Caractère | Nom | Point de code |
| --- | --- | --- |
| â | A minuscule accent circonflexe | U+00E2 |
| Â | A majuscule accent circonflexe | U+00C2 |
| ê | E minuscule accent circonflexe | U+00EA |
| Ê | E majuscule accent circonflexe | U+00CA |
| î | I minuscule accent circonflexe | U+00EE |
| Î | I majuscule accent circonflexe | U+00CE |
| ô | O minuscule accent circonflexe | U+00F4 |
| Ô | O majuscule accent circonflexe | U+00D4 |
| û | U minuscule accent circonflexe | U+00FB |
| Û | U majuscule accent circonflexe | U+00DB |
| ŵ | W minuscule accent circonflexe | U+0175 |
| Ŵ | W majuscule accent circonflexe | U+0174 |
| ŷ | Y minuscule accent circonflexe | U+0177 |
| Ŷ | Y majuscule accent circonflexe | U+0176 |
| ĉ | C minuscule accent circonflexe | U+0109 |
| Ĉ | C majuscule accent circonflexe | U+0108 |
| ĝ | G minuscule accent circonflexe | U+011D |
| Ĝ | G majuscule accent circonflexe | U+011C |
| ĥ | H minuscule accent circonflexe | U+0125 |
| Ĥ | H majuscule accent circonflexe | U+0124 |
| ĵ | J minuscule accent circonflexe | U+0135 |
| Ĵ | J majuscule accent circonflexe | U+0134 |
| ŝ | S minuscule accent circonflexe | U+015D |
| Ŝ | S majuscule accent circonflexe | U+015C |

**Tréma**

| Caractère | Nom | Point de code |
| --- | --- | --- |
| ä | A minuscule tréma | U+00E4 |
| Ä | A majuscule tréma | U+00C4 |
| ë | E minuscule tréma | U+00EB |
| Ë | E majuscule tréma | U+00CB |
| ï | I minuscule tréma | U+00EF |
| Ï | I majuscule tréma | U+00CF |
| ö | O minuscule tréma | U+00F6 |
| Ö | O majuscule tréma | U+00D6 |
| ü | U minuscule tréma | U+00FC |
| Ü | U majuscule tréma | U+00DC |
| ÿ | Y minuscule tréma | U+00FF |
| Ÿ | Y majuscule tréma | U+0178 |

**Tilde**

| Caractère | Nom | Point de code |
| --- | --- | --- |
| ã | A minuscule tilde | U+00E3 |
| Ã | A majuscule tilde | U+00C3 |
| ñ | N minuscule tilde | U+00F1 |
| Ñ | N majuscule tilde | U+00D1 |
| õ | O minuscule tilde | U+00F5 |
| Õ | O majuscule tilde | U+00D5 |

**Cédille et virgule souscrite**

| Caractère | Nom | Point de code |
| --- | --- | --- |
| ç | C minuscule cédille | U+00E7 |
| Ç | C majuscule cédille | U+00C7 |
| ş | S minuscule cédille | U+015F |
| Ş | S majuscule cédille | U+015E |
| ţ | T minuscule cédille | U+0163 |
| Ţ | T majuscule cédille | U+0162 |
| ģ | G minuscule cédille | U+0123 |
| Ģ | G majuscule cédille | U+0122 |
| ķ | K minuscule cédille | U+0137 |
| Ķ | K majuscule cédille | U+0136 |
| ļ | L minuscule cédille | U+013C |
| Ļ | L majuscule cédille | U+013B |
| ņ | N minuscule cédille | U+0146 |
| Ņ | N majuscule cédille | U+0145 |
| ŗ | R minuscule cédille | U+0157 |
| Ŗ | R majuscule cédille | U+0156 |
| ș | S minuscule virgule souscrite | U+0219 |
| Ș | S majuscule virgule souscrite | U+0218 |
| ț | T minuscule virgule souscrite | U+021B |
| Ț | T majuscule virgule souscrite | U+021A |

**Caron (háček)**

| Caractère | Nom | Point de code |
| --- | --- | --- |
| č | C minuscule caron | U+010D |
| Č | C majuscule caron | U+010C |
| ď | D minuscule caron | U+010F |
| Ď | D majuscule caron | U+010E |
| ě | E minuscule caron | U+011B |
| Ě | E majuscule caron | U+011A |
| ľ | L minuscule caron | U+013E |
| Ľ | L majuscule caron | U+013D |
| ň | N minuscule caron | U+0148 |
| Ň | N majuscule caron | U+0147 |
| ř | R minuscule caron | U+0159 |
| Ř | R majuscule caron | U+0158 |
| š | S minuscule caron | U+0161 |
| Š | S majuscule caron | U+0160 |
| ť | T minuscule caron | U+0165 |
| Ť | T majuscule caron | U+0164 |
| ž | Z minuscule caron | U+017E |
| Ž | Z majuscule caron | U+017D |

**Ogonek**

| Caractère | Nom | Point de code |
| --- | --- | --- |
| ą | A minuscule ogonek | U+0105 |
| Ą | A majuscule ogonek | U+0104 |
| ę | E minuscule ogonek | U+0119 |
| Ę | E majuscule ogonek | U+0118 |
| į | I minuscule ogonek | U+012F |
| Į | I majuscule ogonek | U+012E |
| ų | U minuscule ogonek | U+0173 |
| Ų | U majuscule ogonek | U+0172 |

**Macron**

| Caractère | Nom | Point de code |
| --- | --- | --- |
| ā | A minuscule macron | U+0101 |
| Ā | A majuscule macron | U+0100 |
| ē | E minuscule macron | U+0113 |
| Ē | E majuscule macron | U+0112 |
| ī | I minuscule macron | U+012B |
| Ī | I majuscule macron | U+012A |
| ō | O minuscule macron | U+014D |
| Ō | O majuscule macron | U+014C |
| ū | U minuscule macron | U+016B |
| Ū | U majuscule macron | U+016A |
| ȳ | Y minuscule macron | U+0233 |
| Ȳ | Y majuscule macron | U+0232 |

**Brève**

| Caractère | Nom | Point de code |
| --- | --- | --- |
| ă | A minuscule brève | U+0103 |
| Ă | A majuscule brève | U+0102 |
| ĕ | E minuscule brève | U+0115 |
| Ĕ | E majuscule brève | U+0114 |
| ğ | G minuscule brève | U+011F |
| Ğ | G majuscule brève | U+011E |
| ĭ | I minuscule brève | U+012D |
| Ĭ | I majuscule brève | U+012C |
| ŏ | O minuscule brève | U+014F |
| Ŏ | O majuscule brève | U+014E |
| ŭ | U minuscule brève | U+016D |
| Ŭ | U majuscule brève | U+016C |

**Point suscrit**

| Caractère | Nom | Point de code |
| --- | --- | --- |
| ċ | C minuscule point suscrit | U+010B |
| Ċ | C majuscule point suscrit | U+010A |
| ė | E minuscule point suscrit | U+0117 |
| Ė | E majuscule point suscrit | U+0116 |
| ġ | G minuscule point suscrit | U+0121 |
| Ġ | G majuscule point suscrit | U+0120 |
| ż | Z minuscule point suscrit | U+017C |
| Ż | Z majuscule point suscrit | U+017B |

**Double accent aigu**

| Caractère | Nom | Point de code |
| --- | --- | --- |
| ő | O minuscule double accent aigu | U+0151 |
| Ő | O majuscule double accent aigu | U+0150 |
| ű | U minuscule double accent aigu | U+0171 |
| Ű | U majuscule double accent aigu | U+0170 |

**Rond en chef**

| Caractère | Nom | Point de code |
| --- | --- | --- |
| å | A minuscule rond en chef | U+00E5 |
| Å | A majuscule rond en chef | U+00C5 |
| ů | U minuscule rond en chef | U+016F |
| Ů | U majuscule rond en chef | U+016E |

**Lettres barrées et spéciales**

| Caractère | Nom | Point de code |
| --- | --- | --- |
| ß | Eszett (ss) minuscule | U+00DF |
| ẞ | Eszett (SS) majuscule | U+1E9E |
| ø | O barré minuscule | U+00F8 |
| Ø | O barré majuscule | U+00D8 |
| ł | L barré minuscule | U+0142 |
| Ł | L barré majuscule | U+0141 |
| đ | D barré minuscule | U+0111 |
| Đ | D barré majuscule | U+0110 |
| ħ | H barré minuscule | U+0127 |
| Ħ | H barré majuscule | U+0126 |
| ŧ | T barré minuscule | U+0167 |
| Ŧ | T barré majuscule | U+0166 |
| ð | Eth (dh) minuscule | U+00F0 |
| Ð | Eth (DH) majuscule | U+00D0 |
| þ | Thorn (th) minuscule | U+00FE |
| Þ | Thorn (TH) majuscule | U+00DE |
| ı | I sans point minuscule | U+0131 |
| İ | I majuscule point suscrit | U+0130 |
| ə | Schwa minuscule | U+0259 |
| Ə | Schwa majuscule | U+018F |
| ŋ | Eng minuscule | U+014B |
| Ŋ | Eng majuscule | U+014A |

**Monnaies**

| Caractère | Nom | Point de code |
| --- | --- | --- |
| € | Euro | U+20AC |
| £ | Livre sterling | U+00A3 |
| ¥ | Yen / Yuan | U+00A5 |
| ¢ | Cent | U+00A2 |
| ¤ | Signe monétaire générique | U+00A4 |
| ₣ | Franc | U+20A3 |
| ₽ | Rouble | U+20BD |
| ₴ | Hryvnia | U+20B4 |
| ₺ | Livre turque | U+20BA |

**Mathématiques**

| Caractère | Nom | Point de code |
| --- | --- | --- |
| × | Signe de multiplication | U+00D7 |
| ÷ | Signe de division | U+00F7 |
| ≈ | Signe approximativement égal | U+2248 |
| ± | Signe plus ou moins | U+00B1 |
| ≠ | Signe différent de | U+2260 |
| ≤ | Signe inférieur ou égal | U+2264 |
| ≥ | Signe supérieur ou égal | U+2265 |
| − | Signe moins | U+2212 |
| ∞ | Infini | U+221E |
| √ | Racine carrée | U+221A |
| ∑ | Somme | U+2211 |
| π | Pi | U+03C0 |
| Δ | Delta majuscule | U+0394 |
| Ω | Oméga majuscule (ohm) | U+03A9 |

**Exposants, indices et fractions**

| Caractère | Nom | Point de code |
| --- | --- | --- |
| ⁰ | Exposant 0 | U+2070 |
| ¹ | Exposant 1 | U+00B9 |
| ² | Exposant 2 | U+00B2 |
| ³ | Exposant 3 | U+00B3 |
| ⁴ | Exposant 4 | U+2074 |
| ⁵ | Exposant 5 | U+2075 |
| ⁶ | Exposant 6 | U+2076 |
| ⁷ | Exposant 7 | U+2077 |
| ⁸ | Exposant 8 | U+2078 |
| ⁹ | Exposant 9 | U+2079 |
| ₀ | Indice 0 | U+2080 |
| ₁ | Indice 1 | U+2081 |
| ₂ | Indice 2 | U+2082 |
| ₃ | Indice 3 | U+2083 |
| ₄ | Indice 4 | U+2084 |
| ₅ | Indice 5 | U+2085 |
| ₆ | Indice 6 | U+2086 |
| ₇ | Indice 7 | U+2087 |
| ₈ | Indice 8 | U+2088 |
| ₉ | Indice 9 | U+2089 |
| ½ | Un demi | U+00BD |
| ⅓ | Un tiers | U+2153 |
| ⅔ | Deux tiers | U+2154 |
| ¼ | Un quart | U+00BC |
| ¾ | Trois quarts | U+00BE |
| ⅛ | Un huitième | U+215B |
| ᵉ | Exposant e (1ᵉ, 2ᵉ) | U+1D49 |
| ʳ | Exposant r (1ʳᵉ) | U+02B3 |
| ˢ | Exposant s (2ˢ) | U+02E2 |
| ᵈ | Exposant d (2ᵈ) | U+1D48 |
| ⁿ | Exposant n (nⁿ) | U+207F |

**Symboles**

| Caractère | Nom | Point de code |
| --- | --- | --- |
| µ | Symbole micro | U+00B5 |
| • | Puce | U+2022 |
| ◦ | Puce creuse | U+25E6 |
| ° | Degré | U+00B0 |
| § | Paragraphe | U+00A7 |
| ¶ | Pied-de-mouche | U+00B6 |
| † | Obèle | U+2020 |
| ‡ | Double obèle | U+2021 |
| © | Copyright | U+00A9 |
| ® | Marque déposée | U+00AE |
| ™ | Marque commerciale | U+2122 |
| № | Numéro | U+2116 |
| ‰ | Pour mille | U+2030 |
| ′ | Prime (minute, pied) | U+2032 |
| ″ | Double prime (seconde, pouce) | U+2033 |
| ª | Ordinal féminin (espagnol, portugais) | U+00AA |
| º | Ordinal masculin (espagnol, portugais) | U+00BA |

**Flèches**

| Caractère | Nom | Point de code |
| --- | --- | --- |
| ← | Flèche vers la gauche | U+2190 |
| → | Flèche vers la droite | U+2192 |
| ↑ | Flèche vers le haut | U+2191 |
| ↓ | Flèche vers le bas | U+2193 |
| ↔ | Flèche gauche-droite | U+2194 |
| ↕ | Flèche haut-bas | U+2195 |
| ↖ | Flèche vers le haut à gauche | U+2196 |
| ↗ | Flèche vers le haut à droite | U+2197 |
| ↘ | Flèche vers le bas à droite | U+2198 |
| ↙ | Flèche vers le bas à gauche | U+2199 |
| ⇐ | Double flèche vers la gauche | U+21D0 |
| ⇒ | Double flèche vers la droite | U+21D2 |
| ⇔ | Double flèche gauche-droite | U+21D4 |
| ↩ | Flèche de retour | U+21A9 |
| ↦ | Flèche « associe à » | U+21A6 |

## Caractères personnalisés

Il manquera toujours un caractère : ajoutez le vôtre dans **Réglages →
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
