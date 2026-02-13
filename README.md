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

- **Restrictions Drone** : Données officielles **SIA (ED-269)** converties en GeoJSON (`public/data/restrictions_sia.geojson`).
  - **Mise à jour** : Script `convert_sia_to_geojson.js` pour traiter les fichiers JSON bruts du SIA.
  - **Visualisation** :
    - 🔵 Bleu : Hors zone réglementée SIA
    - 🟣 Violet : Autorisation requise
    - 🟠 Orange : Restreint / Conditionnel
    - 🔴 Rouge : Interdit
    - 🟢 Vert : Information (> 120m)
- **Zones hors restriction SIA** : Couche bleue (`public/data/allowed_zones.geojson`) couvrant la France Métropolitaine et les DROM-COM.
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
