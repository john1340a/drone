# Migration Donnees SIA (ED-269)

**Date** : Fevrier 2026
**Source** : SIA (Service de l'Information Aeronautique)

## Objectif

Remplacer les flux IGN (WFS/WMTS) souvent incomplets ou instables par les donnees officielles du SIA au format JSON (proche du standard ED-269).

## Flux de Donnees

1. **Source** : Fichier JSON telecharge depuis le SIA (`public/data/UASZones_YYYY-MM-DD.json`).
2. **Conversion** : Script `convert_sia_to_geojson.js`.
   - Nettoyage du BOM UTF-8.
   - Extraction des geometries (`horizontalProjection`).
   - **Conversion des Cercles** : Les zones definies par un cercle (Centre + Rayon) sont approximees en Polygones (64 points).
3. **Tuiles vectorielles** : Conversion GeoJSON -> PMTiles via `tippecanoe` (WSL Ubuntu).
   - `restrictions_sia.pmtiles` (z4-z12, ~18 MB, source-layer: `restrictions`)
   - `allowed_zones.pmtiles` (z4-z10, ~0.9 MB, source-layer: `allowed`)
4. **Chargement** : `LayerService.ts` utilise `map.addSource()` avec le protocole `pmtiles://` de MapLibre GL JS. Les styles conditionnels sont implementes via les expressions MapLibre.

## Logique de Visualisation

Regles appliquees dans `LayerService.addRestrictionLayers()` via les expressions de style MapLibre :

### Code Couleur

| Couleur | Categorie | Condition |
|---------|-----------|-----------|
| Bleu (`#006FEE`) | Hors zone SIA | Couche de fond (pas de restriction SIA) |
| Bleu acier (`#5b7fa5`) | Info / Non applicable | `min_height >= 120m` |
| Rouge (`#c0392b`) | Interdit | `restriction = "PROHIBITED"` et `min_height < 120m` |
| Orange (`#e67e22`) | Autorisation requise | `restriction = "REQ_AUTHORISATION"` et `min_height < 120m` |
| Ambre (`#f39c12`) | Restreint | `restriction = RESTRICTED/CONDITIONAL` et `min_height < 120m` |

### Gradients de hauteur (RESTRICTED/CONDITIONAL + AGL)

| max_height | Couleur | Opacite |
|-----------|---------|---------|
| <= 30m | `#d35400` (orange fonce) | 0.4 |
| <= 50m | `#e67e22` (orange) | 0.3 |
| <= 60m | `#f39c12` (ambre) | 0.25 |
| > 60m | `#f1c40f` (jaune) | 0.15 |

### Justification du "Bleu acier" (> 120m)

Certaines zones sont marquees "PROHIBITED" ou "RESTRICTED" par le SIA mais commencent a une altitude elevee (ex: FL 115, soit ~3500m). Pour un drone de loisir limite legalement a **120m de hauteur**, ces zones ne sont **pas contraignantes**. Elles sont affichees en bleu acier (couleur neutre) pour informer le pilote qu'il peut voler en dessous de la zone active.

## Points d'Attention

- **Zones urbaines** : Les agglomerations necessitant une autorisation prefectorale ne sont PAS cartographiees dans les donnees SIA. Un avertissement est affiche dans les popups et la legende.
- **Mise a jour** : Lors de la publication d'un nouveau fichier SIA, relancer `node convert_sia_to_geojson.js` puis `tippecanoe`.
- **Hauteurs** : L'application privilegiee les hauteurs AGL (Above Ground Level). Les hauteurs AMSL sont affichees a titre indicatif dans les popups.
- **Expressions MapLibre** : la logique de couleur utilise `case`, `coalesce`, `get`, `all`, `any` dans les proprietes `paint` des layers `fill` et `line`.
