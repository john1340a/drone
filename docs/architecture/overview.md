# Architecture du Projet

Ce document décrit l'architecture technique de l'application **Zones de vol Drone**.

## Structure des Dossiers

```
/
├── .github/workflows/   # CI/CD (deploy.yml — GitHub Pages)
├── docs/                # Documentation technique
│   ├── architecture/
│   │   └── overview.md
│   ├── libs/            # core.md, mapping.md, ui.md
│   └── migration_sia.md
├── public/
│   └── data/            # PMTiles + GeoJSON + UASZones JSON
│       ├── UASZones_2026-04-16_*.json   # Source SIA brute
│       ├── restrictions_sia.geojson     # GeoJSON intermediaire
│       ├── restrictions_sia.pmtiles     # Tuiles vectorielles (~18 MB, z4-z12)
│       ├── allowed_zones.geojson
│       └── allowed_zones.pmtiles        # ~0.9 MB, z4-z10
├── src/
│   ├── assets/
│   │   └── images/      # Thumbnails basemap (osm.png, satellite.png)
│   ├── js/
│   │   ├── config/
│   │   │   └── config.ts           # Map config, basemaps, DOM-TOM, analytics
│   │   ├── controllers/
│   │   │   └── MapController.ts    # Orchestration UI + carte
│   │   ├── controls/
│   │   │   └── BasemapSwitcher.ts  # Toggle Jawg/Satellite (IControl)
│   │   ├── services/
│   │   │   ├── MapService.ts       # Carte MapLibre + PMTiles protocol
│   │   │   ├── LayerService.ts     # Sources/layers vectoriels + popups
│   │   │   ├── WeatherService.ts   # API Open-Meteo (vent)
│   │   │   └── AnalyticsService.ts # Google Analytics 4
│   │   ├── utils/
│   │   │   └── GeometryUtils.ts    # Point-in-polygon helpers
│   │   ├── app.ts                  # Point d'entree + init
│   │   └── icons.ts                # Icones SVG inline (si besoin)
│   └── styles/
│       ├── _variables.scss   # Design tokens HeroUI-inspired
│       ├── _layout.scss      # Reset CSS, map container
│       ├── _components.scss  # Tous les composants UI
│       ├── _sig.scss         # Styles SIG residuels (minimal)
│       ├── _responsive.scss  # Breakpoints 480/768/992px
│       └── main.scss         # Import des partials
├── tests/e2e/
│   ├── map.spec.ts
│   └── pmtiles.spec.ts
├── convert_sia_to_geojson.js   # Pipeline data : SIA JSON -> GeoJSON
├── create_allowed_zones.js     # Pipeline data : difference -> allowed zones
├── index.html                  # Point d'entree HTML
├── vite.config.ts              # Configuration Vite (base path /drone/)
├── tsconfig.json               # TypeScript strict mode
└── playwright.config.ts        # Configuration Playwright
```

## Design Patterns

L'application utilise une architecture orientée objet structurée autour de **Services** et **Contrôleurs**, sans framework JS lourd.

### MVC (Adapté)

- **Model (Données)** : PMTiles vector tiles chargés nativement par MapLibre. Configuration dans `config.ts`. Données météo via Open-Meteo API.
- **View (Vue)** : carte MapLibre GL JS + composants UI implémentant `maplibregl.IControl`. Styles SCSS avec design tokens HeroUI.
- **Controller** : `MapController` orchestre l'initialisation de la carte, le chargement des couches, les handlers de clic, et tous les contrôles UI.

### Injection de Dépendances

Les classes reçoivent leurs dépendances via le constructeur.
Exemple : `BasemapSwitcher` reçoit `MapService` et un callback `onSwitch` pour synchroniser la minimap.

### Services

- `MapService` : lifecycle de la carte MapLibre, gestion des basemaps (Jawg/Satellite), enregistrement du protocole PMTiles
- `LayerService` : ajout des sources/layers vectoriels, expressions de style MapLibre, construction du HTML des popups (restriction + "Vol Autorisé")
- `WeatherService` : appel API Open-Meteo, retourne `{ windSpeed, windDirection, windGusts, isSafe }`
- `AnalyticsService` : wrapper Google Analytics 4

## Flux de Données

1. **Initialisation (`app.ts`)** : instancie `App` qui crée `AnalyticsService` et `MapController`. Détection browser/platform, setup des error handlers globaux.
2. **Chargement carte (`MapService.initializeMap()`)** : enregistre le protocole PMTiles via `maplibregl.addProtocol('pmtiles', Protocol.tile)`, crée la carte avec un style initial contenant 2 sources raster (Jawg / Satellite) et 2 layers raster (visibilité toggle).
3. **Événement `map.on('load')`** : le controller ajoute les couches vectorielles via `LayerService.addRestrictionLayers()` + `addAllowedZonesLayers()`, configure les handlers de clic, ajoute tous les contrôles UI.
4. **Interaction utilisateur** :
   - Clic sur une restriction → `map.on('click', 'restrictions-fill')` ouvre un popup détaillé.
   - Clic ailleurs → handler global + `map.queryRenderedFeatures()` → popup "Vol Autorisé" si pas de feature sous le curseur (zoom >= 5).

## Déploiement

- **Base path** : `/drone/` (configuré dans `vite.config.ts` pour GitHub Pages)
- **CI/CD** : `.github/workflows/deploy.yml`

## Contrôles UI (IControl)

Tous les contrôles de la carte implémentent l'interface `maplibregl.IControl` (`onAdd(map): HTMLElement`, `onRemove(map): void`).

| Contrôle | Position | Comportement |
|----------|----------|--------------|
| Titre | top-left | Statique (icone `flight_takeoff` + texte) |
| Navigation (zoom) | top-left | Natif MapLibre (`NavigationControl`, sans compass) |
| Géolocalisation | top-left | Natif MapLibre (`GeolocateControl`, haute précision) |
| Recherche adresse | top-left | Compact (icone `search` 40px), expand à 270px au hover/focus, API Nominatim (France + DOM-TOM), font-size 16px sur mobile pour éviter le zoom iOS |
| Basemap switcher | top-right | Toggle Jawg/Satellite avec thumbnail 64px (48px mobile, 40px petit écran), contour interne blanc, pas de glass-card |
| Layer control | top-right | Compact (icone `layers` 36px), panel expand vers la gauche au clic (mutuellement exclusif avec DOM-TOM) |
| Territoires DOM-TOM | top-right | Compact (icone `public` + `expand_more`), dropdown au clic avec 5 territoires (Métropole, Antilles, Guyane, Réunion, Mayotte) |
| Widget météo | top-right | Affiche vent (vitesse, direction, statut safe/warning/danger), mise à jour debouncée au `moveend` |
| Échelle | bottom-left | Natif MapLibre (`ScaleControl`, metric, maxWidth 100px) |
| Légende | bottom-left | Toujours visible desktop, collapsible mobile (bouton `info` + bouton close dans le header) |
| Minimap | bottom-right | 150x150px (100px mobile, 80px petit écran), seconde `maplibregl.Map`, synchronisée position + basemap |

### Interactions clés

- **Layer control / DOM-TOM** : mutuellement exclusifs — ouvrir l'un ferme l'autre (via `.classList.toggle`).
- **Clic extérieur** : ferme les deux panneaux via un listener `document.addEventListener('click')`.
- **Layer panel → bridge hover** : pseudo-element `::after` de 12px entre le panel et l'icone pour maintenir le hover continu.
- **Géocoder** : `placeholder` adapté dynamiquement ("Rechercher..." mobile / "Rechercher une adresse..." desktop).

## Pipeline de Données

Scripts Node.js à la racine du projet :

1. `convert_sia_to_geojson.js` : lit le dernier fichier `UASZones_*.json`, extrait la `horizontalProjection` du premier volume de chaque feature, convertit les géométries `Circle` (ED-269) en polygones 64 points, exporte `restrictions_sia.geojson`.
2. `create_allowed_zones.js` : soustrait les restrictions (`@turf/turf` v7 `difference`) d'un polygone englobant la France métropolitaine, exporte `allowed_zones.geojson`.
3. `tippecanoe` (WSL Ubuntu) : convertit les GeoJSON en PMTiles.
