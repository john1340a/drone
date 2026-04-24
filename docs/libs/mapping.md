# Cartographie & GIS

Librairies et services utilisés pour la carte interactive et les données géographiques.

## MapLibre GL JS

**Rôle** : moteur de carte interactive WebGL.
**Pourquoi** : rendu GPU accéléré (WebGL), support natif des tuiles vectorielles et du protocole PMTiles, 60fps fluide avec 3642+ polygones. Remplace Leaflet (migration avril 2026) pour résoudre les problèmes de propagation d'événements Canvas et simplifier la pile technique.

- **Documentation** : [https://maplibre.org/](https://maplibre.org/)
- **Version** : ^5.21.1
- **Utilisation** : `src/js/services/MapService.ts`

### Concepts clés

- **Style Spec** : la carte est définie par un objet JSON de style contenant des `sources` (raster, vector) et des `layers` (raster, fill, line, symbol...). Les basemaps sont des sources `raster`, les restrictions sont des sources `vector` avec des layers `fill` et `line`.
- **Expressions de style** : la logique de couleur conditionnelle (severity + height thresholds) est implémentée via les expressions MapLibre (`case`, `coalesce`, `get`, `all`, `any`) dans `LayerService.addRestrictionLayers()`. Aucune fonction JavaScript n'est appelée par tuile.
- **`queryRenderedFeatures()`** : détection des features sous un point de clic — utilisé par le handler de fallback "Vol Autorisé" pour vérifier qu'aucune restriction n'est touchée.
- **`IControl`** : interface pour les contrôles personnalisés (`onAdd(map): HTMLElement`, `onRemove(map): void`). Tous les contrôles custom du projet l'implémentent.
- **Événements couche-spécifiques** : `map.on('click', 'layer-id', handler)` ne déclenche le handler que si le clic touche une feature de ce layer. Utilisé pour les popups de restriction.
- **`map.setLayoutProperty(id, 'visibility', 'visible' | 'none')`** : toggle des couches via le layer control et le basemap switcher.

## PMTiles

**Rôle** : format de tuiles vectorielles optimisé pour le stockage statique.
**Pourquoi** : un seul fichier statique remplace un serveur de tuiles. Supporte les Range Requests HTTP pour charger uniquement les tuiles nécessaires.

- **Documentation** : [https://github.com/protomaps/PMTiles](https://github.com/protomaps/PMTiles)
- **Version** : ^4.4.0
- **Intégration** : le protocole est enregistré une seule fois via `maplibregl.addProtocol('pmtiles', protocol.tile)` dans `MapService.ts`. Les sources utilisent le schéma d'URL `pmtiles://<origin><baseUrl>data/<file>.pmtiles`.
- **Fichiers** :
  - `public/data/restrictions_sia.pmtiles` : 3642 restrictions (z4-z12, ~18 MB, source-layer `restrictions`)
  - `public/data/allowed_zones.pmtiles` : zones hors restriction SIA (z4-z10, ~0.9 MB, source-layer `allowed`)

### Conversion PMTiles

Outil : `tippecanoe` 2.49+ (via WSL Ubuntu recommandé sur Windows).

```bash
# Restrictions (z4-z12)
tippecanoe -o public/data/restrictions_sia.pmtiles \
  --minimum-zoom=4 --maximum-zoom=12 \
  --simplification=10 --no-tile-size-limit \
  -l restrictions -f public/data/restrictions_sia.geojson

# Zones autorisées (z4-z10)
tippecanoe -o public/data/allowed_zones.pmtiles \
  --minimum-zoom=4 --maximum-zoom=10 \
  --simplification=10 --no-tile-size-limit \
  -l allowed -f public/data/allowed_zones.geojson
```

## Fonds de Carte

### Jawg Maps (Principal)

**Rôle** : fournisseur de tuiles raster pour le fond de carte principal (Jawg Streets).
**Pourquoi** : rendu cartographique propre, bonne couverture France/DOM-TOM, API token simple, zoom jusqu'à z22.

- **Documentation** : [https://www.jawg.io/](https://www.jawg.io/)
- **URL** : `https://tile.jawg.io/jawg-streets/{z}/{x}/{y}.png?access-token={token}`
- **Configuration** : token requis

### Esri Satellite

**Rôle** : fond de carte satellite (imagerie aérienne).
**URL** : `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}`
**Max zoom** : 17.

Toggle via `BasemapSwitcher` qui appelle `MapService.setBaseLayer(key)` → `setLayoutProperty('jawg-layer' | 'satellite-layer', 'visibility', ...)`.

## Services Externes

### Open-Meteo (Météo & Vent)

**Rôle** : données météorologiques en temps réel (vent).
**Utilisation** :
- Fetch des données : vitesse du vent à 10m, rafales, direction
- Widget UI avec statut de sécurité calculé côté client :
  - `isSafe` : `windSpeed < 30 && windGusts < 40`
  - `danger` : `windGusts > 50`
  - `warning` : sinon
- Mise à jour debouncée (1000ms) au `map.on('moveend')`

- **URL API** : `https://api.open-meteo.com/v1/forecast`
- **Service** : `src/js/services/WeatherService.ts`

### Nominatim (Geocoding)

**Rôle** : recherche d'adresses (geocoding).
**Utilisation** : le geocoder du contrôle de recherche utilise l'API Nominatim pour convertir une adresse en coordonnées. Requête limitée à la France et DOM-TOM (`countrycodes=fr,gp,mq,gf,re,yt`), debouncée à 400ms, min 3 caractères.

- **URL API** : `https://nominatim.openstreetmap.org/search?format=json&limit=5`

## Minimap

Seconde instance `maplibregl.Map` non-interactive dans un conteneur 150×150px (bottom-right). Contient les mêmes 2 sources raster (Jawg + Satellite) avec visibilité togglée par `MapController.syncMiniMapBasemap()`. Position synchronisée via `map.on('moveend')` → `miniMap.jumpTo({ center, zoom: mainZoom - 5 })`.

## Sources de Données

### Données SIA (ED-269)

**Rôle** : source officielle des zones réglementées UAS (drones) en France.
**Format** : JSON propriétaire SIA → GeoJSON → PMTiles (tuiles vectorielles) via `tippecanoe`.

- **Documentation détaillée** : [`../migration_sia.md`](../migration_sia.md)
