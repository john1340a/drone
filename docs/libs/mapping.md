# Cartographie & GIS

Librairies et services utilises pour la carte interactive et les donnees geographiques.

## MapLibre GL JS

**Role** : Moteur de carte interactive WebGL.
**Pourquoi** : Rendu GPU accelere (WebGL), support natif des tuiles vectorielles et du protocole PMTiles, 60fps fluide meme avec 3600+ polygones. Remplace Leaflet (migration avril 2026) pour resoudre les problemes de propagation d'evenements Canvas.

- **Documentation** : [https://maplibre.org/](https://maplibre.org/)
- **Version** : 4.x+
- **Utilisation** : `src/js/services/MapService.ts`

### Concepts cles

- **Style Spec** : la carte est definie par un objet JSON de style (sources + layers). Les basemaps sont des sources `raster`, les restrictions sont des sources `vector` avec des layers `fill` et `line`.
- **Expressions de style** : la logique de couleur conditionnelle (restriction severity) est implementee via les expressions MapLibre (`case`, `coalesce`, `get`, `all`) dans `LayerService.ts`.
- **`queryRenderedFeatures()`** : detection des features sous un point de clic, remplace le systeme de propagation d'evenements Canvas de Leaflet.
- **`IControl`** : interface pour les controles personnalises (`onAdd(map): HTMLElement`, `onRemove(map): void`).

## PMTiles

**Role** : Format de tuiles vectorielles optimise pour le stockage statique.
**Pourquoi** : Un seul fichier statique remplace un serveur de tuiles. Supporte les Range Requests HTTP pour charger uniquement les tuiles necessaires.

- **Documentation** : [https://github.com/protomaps/PMTiles](https://github.com/protomaps/PMTiles)
- **Integration** : le protocole est enregistre une seule fois via `maplibregl.addProtocol('pmtiles', Protocol.tile)` dans `MapService.ts`. Les sources utilisent le schema d'URL `pmtiles://`.
- **Fichiers** :
  - `public/data/restrictions_sia.pmtiles` : Restrictions (3627 zones, z4-z12, ~18 MB)
  - `public/data/allowed_zones.pmtiles` : Zones hors restriction SIA (z4-z10, ~0.9 MB)

### Conversion PMTiles

Outil : `tippecanoe` 2.49+ (via WSL Ubuntu)

```bash
# Restrictions
tippecanoe -o restrictions_sia.pmtiles \
  --minimum-zoom=4 --maximum-zoom=12 \
  --simplification=10 --no-tile-size-limit \
  -l restrictions restrictions_sia.geojson

# Zones autorisees
tippecanoe -o allowed_zones.pmtiles \
  --minimum-zoom=4 --maximum-zoom=10 \
  --simplification=10 --no-tile-size-limit \
  -l allowed allowed_zones.geojson
```

## Fonds de Carte

### Jawg Maps (Principal)

**Role** : Fournisseur de tuiles raster pour le fond de carte principal (Jawg Streets).
**Pourquoi** : Rendu cartographique propre, bonne couverture France/DOM-TOM, API token simple.

- **Documentation** : [https://www.jawg.io/](https://www.jawg.io/)
- **Configuration** : token via `VITE_JAWG_MAPS_API` dans `.env`

### Esri Satellite

**Role** : Fond de carte satellite (imagerie aerienne).
**URL** : `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}`

## Services Externes

### Open-Meteo (Meteo & Vent)

**Role** : Donnees meteorologiques en temps reel (vent).
**Utilisation** :
- Vitesse du vent a 10m, rafales, direction
- Widget UI avec statut de securite (safe/warning/danger)
- Seuils : < 30 km/h = safe, 30-50 = warning, > 50 = danger

- **URL API** : `https://api.open-meteo.com/v1/forecast`
- **Service** : `src/js/services/WeatherService.ts`

### Nominatim (Geocoding)

**Role** : Recherche d'adresses (geocoding).
**Utilisation** : le geocoder du controle de recherche utilise l'API Nominatim pour convertir une adresse en coordonnees, limitee a la France et DOM-TOM.

- **URL API** : `https://nominatim.openstreetmap.org/search`

## Sources de Donnees

### Donnees SIA (ED-269)

**Role** : Source officielle des zones reglementees UAS (drones) en France.
**Format** : JSON propriétaire SIA -> GeoJSON -> PMTiles (tuiles vectorielles) via `tippecanoe`.

- **Documentation detaillee** : [`docs/migration_sia.md`](../migration_sia.md)
