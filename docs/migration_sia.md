# Migration & Pipeline Données SIA (ED-269)

**Dernière mise à jour** : Avril 2026 (UASZones 2026-04-16)
**Source** : SIA (Service de l'Information Aéronautique)

## Objectif

Remplacer les flux IGN (WFS/WMTS) souvent incomplets ou instables par les données officielles du SIA au format JSON (proche du standard ED-269).

## Flux de Données

```
UASZones_YYYY-MM-DD.json  (SIA, ~8 MB, 3642 zones)
         │
         ▼ node convert_sia_to_geojson.js
         │
restrictions_sia.geojson  (~4 MB)
         │
         ▼ node create_allowed_zones.js (turf.difference)
         │
allowed_zones.geojson     (~3.7 MB)
         │
         ▼ tippecanoe (WSL)
         │
*.pmtiles                 (18 MB + 0.9 MB)
         │
         ▼ maplibregl.addProtocol('pmtiles') + map.addSource()
         │
         ▼ Carte interactive
```

### 1. Conversion SIA JSON → GeoJSON

Script : [`convert_sia_to_geojson.js`](../../convert_sia_to_geojson.js).

- Lit le premier fichier `UASZones_*.json` trouvé dans `public/data/`.
- Nettoyage du BOM UTF-8.
- Extraction de la `horizontalProjection` du premier volume (`feature.geometry[0]`).
- **Conversion des Cercles** (ED-269) : les zones définies par `{ type: "Circle", center, radius }` sont approximées en polygones 64 points via une formule géodésique (destination point sur sphère de rayon 6371 km).
- Propriétés conservées : `id`, `nom`, `type`, `restriction`, `reason`, `min_height`, `min_ref`, `max_height`, `max_ref`, `message`, `applicability`.

### 2. Génération des zones autorisées

Script : [`create_allowed_zones.js`](../../create_allowed_zones.js).

- Part d'un rectangle englobant la France métropolitaine (`-5.5, 41.2 → 9.8, 51.2`).
- Soustrait itérativement chaque restriction via `turf.difference(featureCollection([allowed, restriction]))`.
- Exporte un MultiPolygon unique dans `allowed_zones.geojson`.

### 3. Conversion en PMTiles

Outil : `tippecanoe` 2.49+ (via WSL Ubuntu).

```bash
# Restrictions
tippecanoe -o public/data/restrictions_sia.pmtiles \
  --minimum-zoom=4 --maximum-zoom=12 \
  --simplification=10 --no-tile-size-limit \
  -l restrictions -f public/data/restrictions_sia.geojson

# Zones autorisées
tippecanoe -o public/data/allowed_zones.pmtiles \
  --minimum-zoom=4 --maximum-zoom=10 \
  --simplification=10 --no-tile-size-limit \
  -l allowed -f public/data/allowed_zones.geojson
```

### 4. Chargement dans MapLibre

`LayerService.ts` utilise `map.addSource({ type: 'vector', url: 'pmtiles://...' })` + `map.addLayer({ type: 'fill' | 'line', source, 'source-layer': 'restrictions' | 'allowed', paint: {...} })`. Les styles conditionnels sont implémentés via les expressions MapLibre.

## Logique de Visualisation

Règles appliquées dans `LayerService.addRestrictionLayers()` via les expressions de style MapLibre.

### Code Couleur

| Couleur | Catégorie | Condition |
|---------|-----------|-----------|
| Bleu (`#006FEE`) | Hors zone SIA | Couche `allowed` (pas de restriction SIA à l'emplacement) |
| Bleu acier (`#5b7fa5`) | Info / Non applicable | `min_height >= 120m` — quelque soit le type de restriction |
| Rouge (`#c0392b`) | Interdit | `restriction = "PROHIBITED"` ET `min_height < 120m` |
| Orange (`#e67e22`) | Autorisation requise | `restriction = "REQ_AUTHORISATION"` ET `min_height < 120m` |
| Ambre (`#f39c12`) | Restreint | `restriction ∈ { "RESTRICTED", "CONDITIONAL" }` ET `min_height < 120m` |

### Gradients de hauteur (RESTRICTED/CONDITIONAL + AGL)

Si `max_ref = "AGL"` (Above Ground Level — pertinent pour drones) :

| max_height | Couleur | Opacité |
|-----------|---------|---------|
| <= 30m | `#d35400` (orange foncé) | 0.4 |
| <= 50m | `#e67e22` (orange) | 0.3 |
| <= 60m | `#f39c12` (ambre) | 0.25 |
| > 60m | `#f1c40f` (jaune) | 0.15 |

### Justification du "Bleu acier" (> 120m)

Certaines zones sont marquées `PROHIBITED` ou `RESTRICTED` par le SIA mais commencent à une altitude élevée (ex: FL 115, soit ~3500m). Pour un drone de loisir limité légalement à **120m de hauteur**, ces zones ne sont **pas contraignantes**. Elles sont affichées en bleu acier (couleur neutre, non alarmante) pour informer le pilote qu'il peut voler en dessous de la zone active.

> **Note UX** : le vert a été retiré du design pour les zones de restriction — perçu comme "tout va bien" alors qu'il s'agit toujours de zones réglementées.

## Popups

### Popup de restriction (zone touchée)

Construit par `LayerService.buildRestrictionPopupHTML(props)` :
- Header coloré selon la sévérité (même palette que la couche) avec icône Material Symbol (`block`, `lock`, `warning`, `cloud`, `flight`, `info`).
- Rows : Zone (nom + id), Type, Hauteur (format `min - max AMSL` ou `Max XXm AGL`).
- Optionnel : message SIA ou `otherReasonInfo` (tronqué à 150 chars).
- Footer : source `SIA (ED-269) — <id>`.

### Popup "Vol Autorisé" (fallback global)

Affiché par le handler `map.on('click')` quand `queryRenderedFeatures()` ne retourne aucune feature sur la couche `restrictions-fill` (zoom >= 5).
- Header bleu (`#006FEE`) avec icône `check_circle`.
- Info : Hauteur max 120m AGL, Catégorie Ouverte (A1/A2/A3).
- Warning : respect des règles (pas de survol de personnes, etc.).
- Footer : Réglementation Européenne.
- Lien : Guides exploitants DGAC (ecologie.gouv.fr).

## Points d'Attention

- **Zones urbaines** : les agglomérations nécessitant une autorisation préfectorale ne sont **pas** cartographiées dans les données SIA. Un avertissement est affiché dans la légende et dans les popups.
- **Mise à jour** : lors de la publication d'un nouveau fichier SIA par le service :
  1. Placer le nouveau `UASZones_YYYY-MM-DD.json` dans `public/data/` et supprimer l'ancien (le script prend le premier alphabétiquement).
  2. `node convert_sia_to_geojson.js`
  3. `node create_allowed_zones.js`
  4. `tippecanoe` (2 commandes ci-dessus)
- **Hauteurs** : l'application privilégie les hauteurs **AGL** (Above Ground Level). Les hauteurs AMSL (Above Mean Sea Level) sont affichées à titre indicatif dans les popups.
- **Expressions MapLibre** : la logique de couleur utilise `case`, `coalesce`, `get`, `all`, `any` dans les propriétés `paint` des layers `fill` et `line`. Aucun code JS n'est appelé par tuile (performance GPU optimale).
