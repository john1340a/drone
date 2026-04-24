# Interface Utilisateur (UI)

Outils et approche utilisés pour le rendu visuel et l'expérience utilisateur.

## Design System (HeroUI-inspired)

L'application utilise un design system inspiré de **HeroUI** (anciennement NextUI), implémenté en SCSS avec des design tokens et des mixins.

### Principes

- **Glassmorphism** : `backdrop-filter: blur(16px)` + fond semi-transparent (`rgba(255,255,255,0.85)`) pour les contrôles de la carte. Appliqué via le mixin `@mixin glass-card` / `@mixin glass-card-elevated`.
- **Shadows subtiles** : multi-couches à faible opacité (0.02 à 0.12), échelle `$shadow-sm` / `$shadow-md` / `$shadow-lg`.
- **Border radius** : échelle progressive (8/12/14/18px).
- **Transitions fluides** : 0.15s (`$transition-fast`) et 0.25s (`$transition-normal`) avec easing.
- **Pas d'emojis** : uniquement des Material Symbols Outlined.

### Design Tokens (`_variables.scss`)

| Token | Valeur | Usage |
|-------|--------|-------|
| `$primary` | `#006FEE` | Actions principales, zones autorisées |
| `$primary-light` | `#338ef7` | Hover, focus ring |
| `$primary-50` | `#e6f1fe` | Backgrounds légers (légende highlight) |
| `$danger` | `#f31260` | Erreurs |
| `$success` | `#17c964` | Vent safe |
| `$warning` | `#f5a524` | Vent warning, alertes |
| `$warning-50` | `#fefce8` | Background warning |
| `$foreground` | `#11181c` | Texte principal |
| `$foreground-secondary` | `#687076` | Texte secondaire |
| `$foreground-tertiary` | `#889096` | Texte tertiaire (labels) |
| `$surface` | `#f4f4f5` | Fond des éléments surélevés, hover |
| `$border` | `#e4e4e7` | Bordures standard |
| `$divider` | `rgba(17,17,17,0.06)` | Séparateurs internes |
| `$glass-bg` | `rgba(255,255,255,0.85)` | Fond glassmorphism |
| `$glass-blur` | `16px` | Intensité du blur |

#### Couleurs de restriction

| Token | Valeur | Catégorie |
|-------|--------|-----------|
| `$zone-forbidden` | `#c0392b` | Interdit |
| `$zone-auth-required` | `#e67e22` | Autorisation requise |
| `$zone-restricted` | `#f39c12` | Restreint |
| `$zone-info` | `#5b7fa5` | Info (>120m) |
| `$zone-allowed` | `#006FEE` | Zone autorisée |

### Fichiers SCSS

| Fichier | Contenu |
|---------|---------|
| `_variables.scss` | Design tokens, couleurs, shadows, radius, breakpoints, CSS custom properties exposées via `:root` |
| `_layout.scss` | Reset CSS global, `html/body` overflow hidden, `#map` en `position: fixed` + `height: 100dvh` (dynamic viewport) |
| `_components.scss` | Tous les composants : mixins `glass-card`, popups, légende, météo, geocoder, layer control, basemap switcher, minimap, DOM-TOM selector |
| `_sig.scss` | Styles SIG résiduels minimaux (option-text ellipsis) |
| `_responsive.scss` | Breakpoints mobile (768px), petit écran (480px), desktop (>=769px), print |
| `main.scss` | Import des partials |

### Mixins

- `@mixin glass-card` : `backdrop-filter: blur(16px)` + background translucide + border + `$shadow-sm`
- `@mixin glass-card-elevated` : idem + `$shadow-md` (pour légende)

## SASS / SCSS

**Rôle** : préprocesseur CSS.
**Pourquoi** : variables, nesting, mixins (`glass-card`, `glass-card-elevated`), partials pour l'organisation. Build via `sass` (module-first avec `@use`).

- **Documentation** : [https://sass-lang.com/](https://sass-lang.com/)
- **Version** : ^1.95.0

## Material Symbols

**Rôle** : icônes vectorielles.
**Pourquoi** : bibliothèque Google complète et cohérente. Chargée via Google Fonts CDN (`Material Symbols Outlined`, `opsz,wght,FILL,GRAD@24,400,1,0`). Utilisée partout (contrôles, popups, légende) — **aucun emoji dans l'UI**.

- **Documentation** : [https://fonts.google.com/icons](https://fonts.google.com/icons)
- **Chargement** : `<link>` dans `index.html`

### Icônes utilisées

| Icône | Contexte |
|-------|----------|
| `flight_takeoff` | Titre de l'application |
| `layers` | Toggle layer control |
| `public` | DOM-TOM selector (globe) |
| `expand_more` | Flèche dropdown |
| `search` | Geocoder |
| `air` / `navigation` | Weather widget |
| `info` / `close` | Légende (toggle mobile) |
| `check_circle` | Popup "Vol Autorisé" |
| `block` / `lock` / `warning` / `cloud` | Popup restriction (selon type) |
| `menu_book` | Lien guides DGAC |
| `gavel` | Réglementation européenne |
| `description` | Source des données (SIA) |
| `vertical_align_top` | Hauteur max |

## Fomantic UI

**Rôle** : framework CSS (usage résiduel).
**Pourquoi** : utilisé uniquement pour les toasts d'erreur critique (`$.toast` dans `app.ts`). Le design system principal est custom (HeroUI-inspired).

- **Documentation** : [https://fomantic-ui.com/](https://fomantic-ui.com/)
- **Version** : ^2.9.3
- **Chargement** : CSS + JS via CDN dans `index.html`, jQuery 3.7.1 requis

## Responsive Design

L'application est mobile-first avec 4 paliers :

| Breakpoint | Adaptations |
|-----------|-------------|
| >= 769px (desktop) | Légende toujours visible, contrôles taille standard, géocoder 270px |
| < 768px (mobile) | Contrôles compacts (basemap 48px, minimap 100px, geocoder 200px), légende collapsible avec bouton close, layer panel limité à `calc(100vw - 80px)`, placeholder geocoder raccourci |
| < 480px (petit écran) | Ultra-compact (basemap 40px, minimap 80px, geocoder 170px) |
| `print` | Map en `position: static`, `height: 100vh` |

### Anti-zoom iOS

Sur mobile, l'input du geocoder a `font-size: 16px !important` pour empêcher Safari iOS de zoomer automatiquement au focus.

### Viewport dynamique

`#map` utilise `height: 100dvh` (dynamic viewport height) pour respecter la barre d'adresse mobile et éviter le scroll. `html/body { overflow: hidden }` + `#map { position: fixed }` complètent l'approche.

## Interactions UI Remarquables

- **Layer control** : icone compacte qui révèle un panel à gauche (`right: calc(100% + 8px)`) au clic. Pseudo-element `::after` de 12px entre le panel et l'icone pour maintenir le hover continu.
- **Layer control / DOM-TOM** : mutuellement exclusifs (ouvrir l'un ferme l'autre).
- **Geocoder** : icone → expand horizontal au hover/focus. Résultats Nominatim dans une liste dropdown.
- **DOM-TOM** : trigger avec icone globe → dropdown liste 5 territoires avec drapeaux (`flagcdn.com`).
- **Légende mobile** : bouton `info` pour ouvrir, bouton `close` dans le header pour fermer.
- **Basemap switcher** : thumbnail cliquable (contour blanc interne), change l'image et synchronise la minimap.
