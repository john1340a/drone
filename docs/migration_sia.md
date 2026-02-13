# Migration Données SIA (ED-269)

**Date** : Février 2026
**Source** : SIA (Service de l'Information Aéronautique)

## 🎯 Objectif

Remplacer les flux IGN (WFS/WMTS) souvent incomplets ou instables par les données officielles du SIA au format JSON (proche du standard ED-269).

## 🔄 Flux de Données

1.  **Source** : Fichier JSON téléchargé depuis le SIA (`public/data/UASZones_YYYY-MM-DD.json`).
2.  **Conversion** : Script `convert_sia_to_geojson.js`.
    - Nettoyage du BOM UTF-8.
    - Extraction des géométries (`horizontalProjection`).
    - **Conversion des Cercles** : Les zones définies par un cercle (Centre + Rayon) sont approximées en Polygones (64 points) pour être lisibles par Leaflet.
3.  **Sortie** : `public/data/restrictions_sia.geojson` (chargé par l'application).

## 🎨 Logique de Visualisation

Pour assurer une lisibilité maximale pour les télépilotes de loisir (Catégorie Ouverte), nous appliquons les règles suivantes dans `LayerService.ts` :

### 1. Code Couleur

| Couleur       | Catégorie                | Condition Technique                                                |
| :------------ | :----------------------- | :----------------------------------------------------------------- |
| 🔵 **Bleu**   | **Hors zone SIA**        | Couche de fond (pas de restriction SIA)                            |
| 🟢 **Vert**   | **Info / Fly Under**     | `min_height >= 120m` (Peu importe le type de restriction)          |
| ⛔ **Rouge**  | **Interdit**             | `restriction = "PROHIBITED"` ET `min_height < 120m`                |
| 🟣 **Violet** | **Autorisation requise** | `restriction = "REQ_AUTHORISATION"` ET `min_height < 120m`         |
| 🟠 **Orange** | **Restreint**            | `restriction` = `RESTRICTED`, `CONDITIONAL` ET `min_height < 120m` |

### 2. Justification du "Vert" (> 120m)

Certaines zones sont marquées "PROHIBITED" ou "RESTRICTED" par le SIA mais commencent à une altitude élevée (ex: FL 115, soit ~3500m).
Pour un drone de loisir limité légalement à **120m de hauteur**, ces zones ne sont **pas contraignantes**.
Elles sont donc affichées en **Vert** pour informer le pilote qu'il peut voler _en dessous_ de la zone active.

## ⚠️ Points d'Attention

- **Zones urbaines** : Les zones urbaines (agglomérations) nécessitant une autorisation préfectorale ne sont PAS cartographiées dans les données SIA. Un avertissement est affiché dans le popup des zones bleues et dans la légende.
- **Mise à jour** : Lors de la publication d'un nouveau fichier SIA, il faut relancer `node convert_sia_to_geojson.js`.
- **Hauteurs** : L'application privilégie les hauteurs AGL (Above Ground Level). Les hauteurs AMSL (Above Mean Sea Level) sont affichées à titre indicatif dans les popups.
