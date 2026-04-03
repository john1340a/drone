# Interface Utilisateur (UI)

Outils et approche utilises pour le rendu visuel et l'experience utilisateur.

## Design System (HeroUI-inspired)

L'application utilise un design system inspire de **HeroUI** (anciennement NextUI), implemente en SCSS avec des design tokens.

### Principes

- **Glassmorphism** : `backdrop-filter: blur(16px)` + fond semi-transparent (`rgba(255,255,255,0.85)`) pour les controles de la carte
- **Shadows subtiles** : multi-couches a faible opacite (0.02 a 0.12)
- **Border radius** : echelle progressive (8px, 12px, 14px, 18px)
- **Transitions fluides** : 0.15s (fast) et 0.25s (normal) avec easing

### Design Tokens (`_variables.scss`)

| Token | Valeur | Usage |
|-------|--------|-------|
| `$primary` | `#006FEE` | Actions principales, zones autorisees |
| `$danger` | `#f31260` | Etats dangereux |
| `$success` | `#17c964` | Vent safe |
| `$warning` | `#f5a524` | Vent warning, alertes |
| `$foreground` | `#11181c` | Texte principal |
| `$foreground-secondary` | `#687076` | Texte secondaire |
| `$surface` | `#f4f4f5` | Fond des elements sureleves |
| `$glass-bg` | `rgba(255,255,255,0.85)` | Fond glassmorphism |
| `$glass-blur` | `16px` | Intensite du blur |

### Fichiers SCSS

| Fichier | Contenu |
|---------|---------|
| `_variables.scss` | Design tokens, couleurs, shadows, radius, breakpoints |
| `_layout.scss` | Reset CSS, conteneur de la carte, animations |
| `_components.scss` | Tous les composants : popups, legende, meteo, geocoder, layer control, basemap switcher, minimap |
| `_sig.scss` | Styles SIG specifiques minimaux |
| `_responsive.scss` | Breakpoints mobile (768px), tablet (992px), petit ecran (480px) |
| `main.scss` | Import des partials |

## SASS / SCSS

**Role** : Preprocesseur CSS.
**Pourquoi** : Variables, nesting, mixins (`glass-card`, `glass-card-elevated`), partials pour l'organisation.

- **Documentation** : [https://sass-lang.com/](https://sass-lang.com/)

## Material Symbols

**Role** : Icones vectorielles.
**Pourquoi** : Bibliotheque Google complete et coherente. Chargee via Google Fonts CDN (`Material Symbols Outlined`, style `FILL: 1`). Utilisee partout (controles, popups, legende).

- **Documentation** : [https://fonts.google.com/icons](https://fonts.google.com/icons)
- **Chargement** : `<link>` dans `index.html`

## Fomantic UI

**Role** : Framework CSS (usage residuel).
**Pourquoi** : Utilise uniquement pour les toasts d'erreur (`$.toast`). Le design system principal est custom (HeroUI-inspired).

- **Documentation** : [https://fomantic-ui.com/](https://fomantic-ui.com/)
- **Version** : 2.9.3

## Responsive Design

L'application est mobile-first avec 3 breakpoints :

| Breakpoint | Adaptations |
|-----------|-------------|
| < 768px (mobile) | Controles compacts (basemap 48px, minimap 100px), legende collapsible, geocoder reduit |
| < 480px (petit ecran) | Ultra-compact (basemap 40px, minimap 80px, geocoder 130px) |
| >= 769px (desktop) | Legende toujours visible, controles taille standard |
