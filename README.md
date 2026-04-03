# Zones de vol Drone

Application web SIG responsive pour visualiser les zones de vol de drone en France (restrictions, autorisations, informations).

## Documentation

La documentation technique est disponible dans le dossier [`docs/`](./docs) :

- **[Architecture](./docs/architecture/overview.md)** : Structure du code, Design Patterns (MVC).
- **[Stack Technique](./docs/libs/core.md)** : Vite, TypeScript, MapLibre GL JS.
- **[Cartographie](./docs/libs/mapping.md)** : MapLibre, PMTiles, Jawg Maps.
- **[Interface UI](./docs/libs/ui.md)** : Design system HeroUI, SASS, Material Symbols.
- **[Migration SIA](./docs/migration_sia.md)** : Donnees ED-269, conversion, logique de couleurs.

## Donnees & Cartographie

- **Restrictions Drone** : Donnees officielles **SIA (ED-269)** optimisees en **tuiles vectorielles PMTiles** (`public/data/restrictions_sia.pmtiles`).
  - **Mise a jour** : Script `convert_sia_to_geojson.js` + conversion PMTiles via `tippecanoe` (WSL).
  - **Visualisation** :
    - Bleu (`#006FEE`) : Hors zone reglementee SIA
    - Rouge (`#c0392b`) : Interdit
    - Orange (`#e67e22`) : Autorisation requise
    - Ambre/Jaune (`#f39c12`) : Restreint / Conditionnel
    - Bleu acier (`#5b7fa5`) : Information (> 120m, non applicable)
- **Zones hors restriction SIA** : Couche bleue en tuiles vectorielles (`public/data/allowed_zones.pmtiles`).
- **Fonds de carte** : Jawg Streets (principal), Esri Satellite.

> **Attention** : Les zones urbaines necessitant une autorisation prefectorale ne sont pas cartographiees. Verifiez toujours les regles locales.

## Demarrage Rapide

### Prerequis

- Node.js (v18+)
- NPM

### Installation & Lancement

```bash
# Installation
npm install

# Mode developpement
npm run dev

# Construction pour production
npm run build
```

L'application sera accessible sur `http://localhost:3000/drone/`.

### Variables d'environnement

Creer un fichier `.env` a la racine :

```
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
VITE_JAWG_MAPS_API=votre_token_jawg
```

## Licence

MIT License
