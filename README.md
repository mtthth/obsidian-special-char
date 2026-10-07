# Insert Special Characters

Obsidian plugin (desktop and mobile) to quickly insert the typographic
characters and European letters that are not on a QWERTY keyboard (a-z, A-Z,
0-9): non-breaking spaces, quotation marks, accented letters (French, German,
Spanish, Polish, Czech, Nordic…), ligatures, dashes, currencies, mathematical
operators, superscripts, arrows…

It also highlights non-breaking spaces right in the editor, where they are
normally invisible.

This plugin only **inserts** special characters. Automatic typography
correction (spaces before punctuation, quotes, apostrophes, note language…)
is the job of *Smart Typo FR*.

By [Matthieu Thomas (cidrolin)](https://github.com/mtthth), under the
[MIT license](LICENSE).

## Usage

Three ways to insert a character:

1. **The picker** — `Ctrl + Shift + S` by default. Type to filter (the search
   ignores accents and case: "fleche" finds "Flèche" in French, "arrow" finds
   the arrows in English; a single letter, "e", lists all its variants é è ê ë
   ě ę…), then `Enter` inserts the first result. The arrow keys move through
   the grid, `Enter` or `Space` inserts, `Esc` closes. Clicking or tapping
   works just as well on mobile.
2. **A dedicated command per character** — each of the 303 characters has its
   own command, to which you can assign any hotkey. The last six characters
   inserted, by hotkey or from the picker, reappear in a **Recent** section at
   the top of the picker (hidden while searching, so the same characters are
   not shown twice).
3. **The command palette** or the **ribbon icon** (handy on mobile).

## Language

The interface (messages, settings, command names) and the character names are
in **English** by default. Switch to **Français** in **Settings → Insert
Special Characters → Language**. The change applies immediately: the picker,
the command palette and the settings page all follow. Hotkeys you assigned
are kept.

The search matches the names of the active language.

## Hotkeys

Four characters have a default hotkey:

| Hotkey | Character |
| --- | --- |
| `Ctrl + Shift + S` | Open the picker |
| `Ctrl + Shift + 1` | Narrow no-break space |
| `Ctrl + Shift + 2` | No-break space |
| `Ctrl + Shift + 3` | French opening quote « |
| `Ctrl + Shift + 4` | French closing quote » |

The other 299 characters deliberately have no default hotkey: hundreds of
defaults would inevitably clash with your other plugins. To assign one, go to
**Settings → Hotkeys** and search for `Insert:` — every character has its own
row.

### Note for AZERTY keyboards on Windows

The default hotkeys use `Ctrl + Shift`, never `Ctrl + Alt`. On Windows,
`Ctrl + Alt` is equivalent to `AltGr`, which an AZERTY keyboard needs to type
`@`, `~`, `#`, `{`, `}`, `[`, `]`, `|`, `\`, the grave accent and `€`. If you
define your own hotkeys, avoid `Ctrl + Alt` for the same reason.

## Wrapping a selection

With text selected, inserting a quotation mark or a single apostrophe
**wraps** the selection instead of replacing it. It does not matter whether you
insert the opening or the closing one: both produce the full pair. The text
stays selected between the delimiters, and French quotes bring their narrow
no-break spaces.

| Selection | Inserted character | Result |
| --- | --- | --- |
| `bonjour` | « or » | « bonjour » |
| `bonjour` | “ or ” | “bonjour” |
| `bonjour` | ‘ or ’ | ‘bonjour’ |

This applies to hotkeys and to the picker alike. Other characters replace the
selection, like any keystroke.

## Available characters

**Spaces**

| Character | Name | Code point |
| --- | --- | --- |
| *(invisible)* | Narrow no-break space | U+202F |
| *(invisible)* | No-break space | U+00A0 |
| *(invisible)* | Thin space | U+2009 |
| *(invisible)* | Hair space | U+200A |
| *(invisible)* | Punctuation space | U+2008 |
| *(invisible)* | En space | U+2002 |
| *(invisible)* | Em space | U+2003 |
| ‑ | Non-breaking hyphen | U+2011 |

**Quotes and apostrophes**

| Character | Name | Code point |
| --- | --- | --- |
| « | French opening quote | U+00AB |
| » | French closing quote | U+00BB |
| ‹ | French single opening quote | U+2039 |
| › | French single closing quote | U+203A |
| “ | English opening quote | U+201C |
| ” | English closing quote | U+201D |
| ‘ | Opening single quote | U+2018 |
| ’ | Typographic apostrophe | U+2019 |
| „ | Low double quote (German, Polish) | U+201E |
| ‚ | Low single quote (German, Czech) | U+201A |

**Dashes and punctuation**

| Character | Name | Code point |
| --- | --- | --- |
| — | Em dash | U+2014 |
| – | En dash | U+2013 |
| · | Middle dot | U+00B7 |
| … | Ellipsis | U+2026 |
| ¿ | Spanish inverted question mark | U+00BF |
| ¡ | Spanish inverted exclamation | U+00A1 |

**Ligatures**

| Character | Name | Code point |
| --- | --- | --- |
| œ | Lowercase œ ligature | U+0153 |
| Œ | Uppercase Œ ligature | U+0152 |
| æ | Lowercase æ ligature | U+00E6 |
| Æ | Uppercase Æ ligature | U+00C6 |
| ĳ | Lowercase ĳ ligature (Dutch) | U+0133 |
| Ĳ | Uppercase Ĳ ligature (Dutch) | U+0132 |
| ﬁ | Ligature fi | U+FB01 |
| ﬂ | Ligature fl | U+FB02 |
| ﬀ | Ligature ff | U+FB00 |

**Acute accent**

| Character | Name | Code point |
| --- | --- | --- |
| á | Lowercase a with acute | U+00E1 |
| Á | Uppercase A with acute | U+00C1 |
| é | Lowercase e with acute | U+00E9 |
| É | Uppercase E with acute | U+00C9 |
| í | Lowercase i with acute | U+00ED |
| Í | Uppercase I with acute | U+00CD |
| ó | Lowercase o with acute | U+00F3 |
| Ó | Uppercase O with acute | U+00D3 |
| ú | Lowercase u with acute | U+00FA |
| Ú | Uppercase U with acute | U+00DA |
| ý | Lowercase y with acute | U+00FD |
| Ý | Uppercase Y with acute | U+00DD |
| ć | Lowercase c with acute | U+0107 |
| Ć | Uppercase C with acute | U+0106 |
| ĺ | Lowercase l with acute | U+013A |
| Ĺ | Uppercase L with acute | U+0139 |
| ń | Lowercase n with acute | U+0144 |
| Ń | Uppercase N with acute | U+0143 |
| ŕ | Lowercase r with acute | U+0155 |
| Ŕ | Uppercase R with acute | U+0154 |
| ś | Lowercase s with acute | U+015B |
| Ś | Uppercase S with acute | U+015A |
| ź | Lowercase z with acute | U+017A |
| Ź | Uppercase Z with acute | U+0179 |

**Grave accent**

| Character | Name | Code point |
| --- | --- | --- |
| à | Lowercase a with grave | U+00E0 |
| À | Uppercase A with grave | U+00C0 |
| è | Lowercase e with grave | U+00E8 |
| È | Uppercase E with grave | U+00C8 |
| ì | Lowercase i with grave | U+00EC |
| Ì | Uppercase I with grave | U+00CC |
| ò | Lowercase o with grave | U+00F2 |
| Ò | Uppercase O with grave | U+00D2 |
| ù | Lowercase u with grave | U+00F9 |
| Ù | Uppercase U with grave | U+00D9 |

**Circumflex accent**

| Character | Name | Code point |
| --- | --- | --- |
| â | Lowercase a with circumflex | U+00E2 |
| Â | Uppercase A with circumflex | U+00C2 |
| ê | Lowercase e with circumflex | U+00EA |
| Ê | Uppercase E with circumflex | U+00CA |
| î | Lowercase i with circumflex | U+00EE |
| Î | Uppercase I with circumflex | U+00CE |
| ô | Lowercase o with circumflex | U+00F4 |
| Ô | Uppercase O with circumflex | U+00D4 |
| û | Lowercase u with circumflex | U+00FB |
| Û | Uppercase U with circumflex | U+00DB |
| ŵ | Lowercase w with circumflex | U+0175 |
| Ŵ | Uppercase W with circumflex | U+0174 |
| ŷ | Lowercase y with circumflex | U+0177 |
| Ŷ | Uppercase Y with circumflex | U+0176 |
| ĉ | Lowercase c with circumflex | U+0109 |
| Ĉ | Uppercase C with circumflex | U+0108 |
| ĝ | Lowercase g with circumflex | U+011D |
| Ĝ | Uppercase G with circumflex | U+011C |
| ĥ | Lowercase h with circumflex | U+0125 |
| Ĥ | Uppercase H with circumflex | U+0124 |
| ĵ | Lowercase j with circumflex | U+0135 |
| Ĵ | Uppercase J with circumflex | U+0134 |
| ŝ | Lowercase s with circumflex | U+015D |
| Ŝ | Uppercase S with circumflex | U+015C |

**Diaeresis**

| Character | Name | Code point |
| --- | --- | --- |
| ä | Lowercase a with diaeresis | U+00E4 |
| Ä | Uppercase A with diaeresis | U+00C4 |
| ë | Lowercase e with diaeresis | U+00EB |
| Ë | Uppercase E with diaeresis | U+00CB |
| ï | Lowercase i with diaeresis | U+00EF |
| Ï | Uppercase I with diaeresis | U+00CF |
| ö | Lowercase o with diaeresis | U+00F6 |
| Ö | Uppercase O with diaeresis | U+00D6 |
| ü | Lowercase u with diaeresis | U+00FC |
| Ü | Uppercase U with diaeresis | U+00DC |
| ÿ | Lowercase y with diaeresis | U+00FF |
| Ÿ | Uppercase Y with diaeresis | U+0178 |

**Tilde**

| Character | Name | Code point |
| --- | --- | --- |
| ã | Lowercase a with tilde | U+00E3 |
| Ã | Uppercase A with tilde | U+00C3 |
| ñ | Lowercase n with tilde | U+00F1 |
| Ñ | Uppercase N with tilde | U+00D1 |
| õ | Lowercase o with tilde | U+00F5 |
| Õ | Uppercase O with tilde | U+00D5 |

**Cedilla and comma below**

| Character | Name | Code point |
| --- | --- | --- |
| ç | Lowercase c with cedilla | U+00E7 |
| Ç | Uppercase C with cedilla | U+00C7 |
| ş | Lowercase s with cedilla | U+015F |
| Ş | Uppercase S with cedilla | U+015E |
| ţ | Lowercase t with cedilla | U+0163 |
| Ţ | Uppercase T with cedilla | U+0162 |
| ģ | Lowercase g with cedilla | U+0123 |
| Ģ | Uppercase G with cedilla | U+0122 |
| ķ | Lowercase k with cedilla | U+0137 |
| Ķ | Uppercase K with cedilla | U+0136 |
| ļ | Lowercase l with cedilla | U+013C |
| Ļ | Uppercase L with cedilla | U+013B |
| ņ | Lowercase n with cedilla | U+0146 |
| Ņ | Uppercase N with cedilla | U+0145 |
| ŗ | Lowercase r with cedilla | U+0157 |
| Ŗ | Uppercase R with cedilla | U+0156 |
| ș | Lowercase s with comma below | U+0219 |
| Ș | Uppercase S with comma below | U+0218 |
| ț | Lowercase t with comma below | U+021B |
| Ț | Uppercase T with comma below | U+021A |

**Caron (háček)**

| Character | Name | Code point |
| --- | --- | --- |
| č | Lowercase c with caron | U+010D |
| Č | Uppercase C with caron | U+010C |
| ď | Lowercase d with caron | U+010F |
| Ď | Uppercase D with caron | U+010E |
| ě | Lowercase e with caron | U+011B |
| Ě | Uppercase E with caron | U+011A |
| ľ | Lowercase l with caron | U+013E |
| Ľ | Uppercase L with caron | U+013D |
| ň | Lowercase n with caron | U+0148 |
| Ň | Uppercase N with caron | U+0147 |
| ř | Lowercase r with caron | U+0159 |
| Ř | Uppercase R with caron | U+0158 |
| š | Lowercase s with caron | U+0161 |
| Š | Uppercase S with caron | U+0160 |
| ť | Lowercase t with caron | U+0165 |
| Ť | Uppercase T with caron | U+0164 |
| ž | Lowercase z with caron | U+017E |
| Ž | Uppercase Z with caron | U+017D |

**Ogonek**

| Character | Name | Code point |
| --- | --- | --- |
| ą | Lowercase a with ogonek | U+0105 |
| Ą | Uppercase A with ogonek | U+0104 |
| ę | Lowercase e with ogonek | U+0119 |
| Ę | Uppercase E with ogonek | U+0118 |
| į | Lowercase i with ogonek | U+012F |
| Į | Uppercase I with ogonek | U+012E |
| ų | Lowercase u with ogonek | U+0173 |
| Ų | Uppercase U with ogonek | U+0172 |

**Macron**

| Character | Name | Code point |
| --- | --- | --- |
| ā | Lowercase a with macron | U+0101 |
| Ā | Uppercase A with macron | U+0100 |
| ē | Lowercase e with macron | U+0113 |
| Ē | Uppercase E with macron | U+0112 |
| ī | Lowercase i with macron | U+012B |
| Ī | Uppercase I with macron | U+012A |
| ō | Lowercase o with macron | U+014D |
| Ō | Uppercase O with macron | U+014C |
| ū | Lowercase u with macron | U+016B |
| Ū | Uppercase U with macron | U+016A |
| ȳ | Lowercase y with macron | U+0233 |
| Ȳ | Uppercase Y with macron | U+0232 |

**Breve**

| Character | Name | Code point |
| --- | --- | --- |
| ă | Lowercase a with breve | U+0103 |
| Ă | Uppercase A with breve | U+0102 |
| ĕ | Lowercase e with breve | U+0115 |
| Ĕ | Uppercase E with breve | U+0114 |
| ğ | Lowercase g with breve | U+011F |
| Ğ | Uppercase G with breve | U+011E |
| ĭ | Lowercase i with breve | U+012D |
| Ĭ | Uppercase I with breve | U+012C |
| ŏ | Lowercase o with breve | U+014F |
| Ŏ | Uppercase O with breve | U+014E |
| ŭ | Lowercase u with breve | U+016D |
| Ŭ | Uppercase U with breve | U+016C |

**Dot above**

| Character | Name | Code point |
| --- | --- | --- |
| ċ | Lowercase c with dot above | U+010B |
| Ċ | Uppercase C with dot above | U+010A |
| ė | Lowercase e with dot above | U+0117 |
| Ė | Uppercase E with dot above | U+0116 |
| ġ | Lowercase g with dot above | U+0121 |
| Ġ | Uppercase G with dot above | U+0120 |
| ż | Lowercase z with dot above | U+017C |
| Ż | Uppercase Z with dot above | U+017B |

**Double acute accent**

| Character | Name | Code point |
| --- | --- | --- |
| ő | Lowercase o with double acute | U+0151 |
| Ő | Uppercase O with double acute | U+0150 |
| ű | Lowercase u with double acute | U+0171 |
| Ű | Uppercase U with double acute | U+0170 |

**Ring above**

| Character | Name | Code point |
| --- | --- | --- |
| å | Lowercase a with ring above | U+00E5 |
| Å | Uppercase A with ring above | U+00C5 |
| ů | Lowercase u with ring above | U+016F |
| Ů | Uppercase U with ring above | U+016E |

**Stroked and special letters**

| Character | Name | Code point |
| --- | --- | --- |
| ß | Lowercase eszett (ss) | U+00DF |
| ẞ | Uppercase eszett (SS) | U+1E9E |
| ø | Lowercase o with stroke | U+00F8 |
| Ø | Uppercase O with stroke | U+00D8 |
| ł | Lowercase l with stroke | U+0142 |
| Ł | Uppercase L with stroke | U+0141 |
| đ | Lowercase d with stroke | U+0111 |
| Đ | Uppercase D with stroke | U+0110 |
| ħ | Lowercase h with stroke | U+0127 |
| Ħ | Uppercase H with stroke | U+0126 |
| ŧ | Lowercase t with stroke | U+0167 |
| Ŧ | Uppercase T with stroke | U+0166 |
| ð | Lowercase eth (dh) | U+00F0 |
| Ð | Uppercase eth (DH) | U+00D0 |
| þ | Lowercase thorn (th) | U+00FE |
| Þ | Uppercase thorn (TH) | U+00DE |
| ı | Lowercase dotless i | U+0131 |
| İ | Uppercase I with dot above | U+0130 |
| ə | Lowercase schwa | U+0259 |
| Ə | Uppercase schwa | U+018F |
| ŋ | Lowercase eng | U+014B |
| Ŋ | Uppercase eng | U+014A |

**Currencies**

| Character | Name | Code point |
| --- | --- | --- |
| € | Euro | U+20AC |
| £ | Pound sterling | U+00A3 |
| ¥ | Yen / Yuan | U+00A5 |
| ¢ | Cent | U+00A2 |
| ¤ | Generic currency sign | U+00A4 |
| ₣ | Franc | U+20A3 |
| ₽ | Ruble | U+20BD |
| ₴ | Hryvnia | U+20B4 |
| ₺ | Turkish lira | U+20BA |

**Mathematics**

| Character | Name | Code point |
| --- | --- | --- |
| × | Multiplication sign | U+00D7 |
| ÷ | Division sign | U+00F7 |
| ≈ | Approximately equal | U+2248 |
| ± | Plus-minus sign | U+00B1 |
| ≠ | Not equal | U+2260 |
| ≤ | Less than or equal | U+2264 |
| ≥ | Greater than or equal | U+2265 |
| − | Minus sign | U+2212 |
| ∞ | Infinity | U+221E |
| √ | Square root | U+221A |
| ∑ | Summation | U+2211 |
| π | Pi | U+03C0 |
| Δ | Uppercase delta | U+0394 |
| Ω | Uppercase omega (ohm) | U+03A9 |

**Superscripts, subscripts and fractions**

| Character | Name | Code point |
| --- | --- | --- |
| ⁰ | Superscript 0 | U+2070 |
| ¹ | Superscript 1 | U+00B9 |
| ² | Superscript 2 | U+00B2 |
| ³ | Superscript 3 | U+00B3 |
| ⁴ | Superscript 4 | U+2074 |
| ⁵ | Superscript 5 | U+2075 |
| ⁶ | Superscript 6 | U+2076 |
| ⁷ | Superscript 7 | U+2077 |
| ⁸ | Superscript 8 | U+2078 |
| ⁹ | Superscript 9 | U+2079 |
| ₀ | Subscript 0 | U+2080 |
| ₁ | Subscript 1 | U+2081 |
| ₂ | Subscript 2 | U+2082 |
| ₃ | Subscript 3 | U+2083 |
| ₄ | Subscript 4 | U+2084 |
| ₅ | Subscript 5 | U+2085 |
| ₆ | Subscript 6 | U+2086 |
| ₇ | Subscript 7 | U+2087 |
| ₈ | Subscript 8 | U+2088 |
| ₉ | Subscript 9 | U+2089 |
| ½ | One half | U+00BD |
| ⅓ | One third | U+2153 |
| ⅔ | Two thirds | U+2154 |
| ¼ | One quarter | U+00BC |
| ¾ | Three quarters | U+00BE |
| ⅛ | One eighth | U+215B |
| ᵉ | Superscript e (1ᵉ, 2ᵉ) | U+1D49 |
| ʳ | Superscript r (1ʳᵉ) | U+02B3 |
| ˢ | Superscript s (2ˢ) | U+02E2 |
| ᵈ | Superscript d (2ᵈ) | U+1D48 |
| ⁿ | Superscript n (nⁿ) | U+207F |

**Symbols**

| Character | Name | Code point |
| --- | --- | --- |
| µ | Micro sign | U+00B5 |
| • | Bullet | U+2022 |
| ◦ | White bullet | U+25E6 |
| ° | Degree sign | U+00B0 |
| § | Section sign | U+00A7 |
| ¶ | Pilcrow | U+00B6 |
| † | Dagger | U+2020 |
| ‡ | Double dagger | U+2021 |
| © | Copyright | U+00A9 |
| ® | Registered trademark | U+00AE |
| ™ | Trademark | U+2122 |
| № | Numero sign | U+2116 |
| ‰ | Per mille | U+2030 |
| ′ | Prime (minute, foot) | U+2032 |
| ″ | Double prime (second, inch) | U+2033 |
| ª | Feminine ordinal indicator | U+00AA |
| º | Masculine ordinal indicator | U+00BA |

**Arrows**

| Character | Name | Code point |
| --- | --- | --- |
| ← | Left arrow | U+2190 |
| → | Right arrow | U+2192 |
| ↑ | Up arrow | U+2191 |
| ↓ | Down arrow | U+2193 |
| ↔ | Left-right arrow | U+2194 |
| ↕ | Up-down arrow | U+2195 |
| ↖ | Up-left arrow | U+2196 |
| ↗ | Up-right arrow | U+2197 |
| ↘ | Down-right arrow | U+2198 |
| ↙ | Down-left arrow | U+2199 |
| ⇐ | Double left arrow | U+21D0 |
| ⇒ | Double right arrow | U+21D2 |
| ⇔ | Double left-right arrow | U+21D4 |
| ↩ | Return arrow | U+21A9 |
| ↦ | “Maps to” arrow | U+21A6 |

## Custom characters

There will always be one missing: add your own in **Settings → Insert Special
Characters**, with an optional name (without it, the code point is the label).
Your characters appear in a **Custom** section at the top of the picker, are
found by the search and count among the recent ones, like the built-in ones.

They have no dedicated command, hence no hotkey of their own: a command cannot
be cleanly removed when you delete an entry. Use the picker, where the search
finds them immediately.

## Editor display

Non-breaking spaces are highlighted with a colored background, one color for
each (narrow no-break, no-break), to tell them apart from a regular space. It
is purely visual — the document text is never modified — and can be turned off
in **Settings → Insert Special Characters**.

## Manual installation

1. Build the plugin: `npm install && npm run build`.
2. Copy `manifest.json`, `main.js` and `styles.css` into
   `<your-vault>/.obsidian/plugins/insert-special-characters/`.
3. Enable the plugin in Settings → Community plugins.

## Development

- `npm run dev`: build in watch mode.
- `npm run build`: TypeScript check, then production build.
- `npm test`: test suite, with no external dependency and without launching
  Obsidian.
- `deploy.ps1` (Windows/PowerShell): build, then copy `main.js`,
  `manifest.json` and `styles.css` into the vault's plugins folder (path
  adjustable through the `-VaultPluginPath` parameter).

  If Windows refuses to run it ("running scripts is disabled on this system")
  although `Get-ExecutionPolicy -List` already shows `RemoteSigned` or more
  permissive, the file is probably marked as downloaded from the Internet
  (zone mark Windows adds to files received other than by `git clone`/`git
  pull`, e.g. an extracted `.zip`). Unblocking it is enough:

  ```powershell
  Get-Item .\deploy.ps1 -Stream Zone.Identifier -ErrorAction SilentlyContinue
  Unblock-File .\deploy.ps1
  ```

The code is split by responsibility: `main.ts` only handles orchestration
(commands, settings, plugin lifecycle) and relies on `src/chars.ts` (character
table, search, insertion), `src/i18n.ts` (interface messages and language),
`src/editor-decorations.ts` (editor highlighting, via CodeMirror),
`src/settings.ts`, `src/settings-tab.ts` and `src/picker-modal.ts`.

Each built-in character has an English `label` and a French `labelFr`; adding
a language means adding a field there and a table in `src/i18n.ts`.

The tests rebuild these modules into a bundle exposing their internal
functions, the `obsidian` module being replaced by the stub in
`tests/obsidian-stub.js`. They cover the character table (every code point is
compared to an expected value written independently, several of these
characters being indistinguishable by eye), the search in both languages,
selection wrapping, recent and custom characters, the language switch, and the
consistency of the README and the CSS classes with the code.

## License

[MIT](LICENSE) © 2026 Matthieu Thomas (cidrolin).
