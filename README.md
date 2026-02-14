# Zones de vol Drone

Application web SIG responsive pour visualiser les zones de vol de drone en France (restrictions, autorisations, informations).

## 📚 Documentation

La documentation détaillée technique est disponible dans le dossier [`docs/`](./docs):

- **[Architecture](./docs/architecture/overview.md)** : Structure du code, Design Patterns (MVC).
- **[Stack Technique](./docs/libs/core.md)** : Vite, TypeScript, Build.
- **[Cartographie](./docs/libs/mapping.md)** : Leaflet, IGN Geoportail, Plugins.
- **[Interface UI](./docs/libs/ui.md)** : Fomantic UI, SASS, Icons.
- **[Migration SIA](./docs/migration_sia.md)** : Données ED-269, conversion, logique de couleurs.

## 🌍 Données & Cartographie

- **Restrictions Drone** : Données officielles **SIA (ED-269)** optimisées en **tuiles vectorielles PMTiles** (`public/data/restrictions_sia.pmtiles`).
  - **Mise à jour** : Script `convert_sia_to_geojson.js` + conversion PMTiles via `tippecanoe` (WSL).
  - **Visualisation** :
    - 🔵 Bleu : Hors zone réglementée SIA
    - 🔴 Rouge : Interdit
    - 🟠 Orange : Autorisation requise
    - 🟡 Ambre/Jaune : Restreint / Conditionnel
    - 🔵 Bleu acier : Information (> 120m, non applicable)
- **Zones hors restriction SIA** : Couche bleue en tuiles vectorielles (`public/data/allowed_zones.pmtiles`).
- **Fonds de carte** : OSM, IGN Plan, IGN Satellite via Leaflet.

> ⚠️ **Attention** : Les zones urbaines nécessitant une autorisation préfectorale ne sont pas cartographiées. Vérifiez toujours les règles locales.

## 🚀 Démarrage Rapide

### Prérequis

- Node.js (v18+)
- NPM

### Installation & Lancement

```bash
# Installation
npm install

# Mode développement
npm run dev

# Construction pour production
npm run build
```

L'application sera accessible sur `http://localhost:3000/drone/`.

## Licence

MIT License
