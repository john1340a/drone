# Architecture du Projet

Ce document decrit l'architecture technique de l'application **Zones de vol Drone**.

## Structure des Dossiers

```
/
├── .github/workflows/   # CI/CD (GitHub Actions)
├── docs/                # Documentation technique
├── public/
│   └── data/            # PMTiles (restrictions_sia, allowed_zones)
├── src/
│   ├── assets/          # Images (thumbnails basemap)
│   ├── js/
│   │   ├── config/      # Configuration globale (config.ts)
│   │   ├── controllers/ # Orchestration (MapController.ts)
│   │   ├── controls/    # Composants UI MapLibre (BasemapSwitcher.ts)
│   │   ├── services/    # Logique metier (MapService, LayerService, WeatherService, AnalyticsService)
│   │   ├── utils/       # Utilitaires (GeometryUtils.ts)
│   │   └── app.ts       # Point d'entree
│   └── styles/          # SCSS (design system HeroUI-inspired)
│       ├── _variables.scss   # Design tokens
│       ├── _layout.scss      # Reset, map container
│       ├── _components.scss  # Tous les composants UI
│       ├── _sig.scss         # Styles SIG specifiques
│       ├── _responsive.scss  # Breakpoints mobile/tablet
│       └── main.scss         # Import des partials
├── tests/e2e/           # Tests Playwright
├── index.html           # Point d'entree HTML
├── vite.config.ts       # Configuration Vite
└── tsconfig.json        # Configuration TypeScript
```

## Design Patterns

L'application utilise une architecture orientee objet structuree autour de **Services** et **Controleurs**, sans framework JS lourd.

### MVC (Adapte)

- **Model (Donnees)** : PMTiles vector tiles charges nativement par MapLibre. Configuration dans `config.ts`. Donnees meteo via Open-Meteo API.
- **View (Vue)** : Carte MapLibre GL JS + composants UI implementant `maplibregl.IControl`. Styles SCSS avec design tokens HeroUI.
- **Controller** : `MapController` orchestre l'initialisation de la carte, le chargement des couches, les handlers de clic, et tous les controles UI.

### Injection de Dependances

Les classes recoivent leurs dependances via le constructeur.
Exemple : `BasemapSwitcher` recoit `MapService` et un callback `onSwitch` pour synchroniser la minimap.

### Services

- `MapService` : lifecycle de la carte MapLibre, gestion des basemaps (Jawg/Satellite), protocole PMTiles
- `LayerService` : ajout des sources/layers vectoriels, expressions de style MapLibre, construction du HTML des popups
- `WeatherService` : appels API Open-Meteo, calcul du statut de securite vent
- `AnalyticsService` : wrapper Google Analytics 4

## Flux de Donnees

1. **Initialisation (`app.ts`)** : instancie `MapController` qui cree `MapService`, `LayerService`, `WeatherService`
2. **Chargement carte (`MapService.initializeMap()`)** : cree la carte MapLibre avec le style initial (sources raster Jawg + Satellite), enregistre le protocole PMTiles
3. **Evenement `map.on('load')`** : le controller ajoute les couches vectorielles via `LayerService`, configure les handlers de clic, et ajoute tous les controles UI
4. **Interaction utilisateur** : `map.queryRenderedFeatures()` detecte les features sous le curseur pour afficher le popup appropriate

## Gestion des Environnements

- **Variables d'environnement** : via `import.meta.env` (Vite)
  - `VITE_JAWG_MAPS_API` : token Jawg Maps (obligatoire)
  - `VITE_GA_MEASUREMENT_ID` : Google Analytics (optionnel)
- **Production** : injection des secrets via GitHub Actions lors du build

## Controles UI (IControl)

Tous les controles de la carte implementent l'interface `maplibregl.IControl` (`onAdd(map)` retourne un `HTMLElement`, `onRemove(map)`).

| Controle | Position | Comportement |
|----------|----------|-------------|
| Titre | top-left | Statique |
| Navigation (zoom) | top-left | Natif MapLibre |
| Geolocalisation | top-left | Natif MapLibre (`GeolocateControl`) |
| Recherche adresse | top-left | Compact (icone), expand au hover/focus, API Nominatim |
| Basemap switcher | top-right | Toggle Jawg/Satellite avec thumbnail |
| Layer control | top-right | Compact (icone), panel au hover vers la gauche |
| Territoires DOM-TOM | top-right | Compact (icone globe), dropdown au hover |
| Widget meteo | top-right | Affiche vent (vitesse, direction, statut securite) |
| Echelle | bottom-left | Natif MapLibre |
| Legende | bottom-left | Collapsible sur mobile, toujours visible desktop |
| Minimap | bottom-right | Carte secondaire synchronisee (position + basemap) |
