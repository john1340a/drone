# Zones de vol Drone

Application web SIG responsive pour visualiser les zones de vol de drone en France (restrictions, autorisations, informations) sur une carte interactive WebGL.

## Documentation

La documentation technique est disponible dans le dossier [`docs/`](./docs) :

- **[Architecture](./docs/architecture/overview.md)** : structure du code, patterns MVC, flux de données
- **[Stack Technique](./docs/libs/core.md)** : Vite, TypeScript, Playwright, NPM
- **[Cartographie](./docs/libs/mapping.md)** : MapLibre GL JS, PMTiles, Jawg Maps, Open-Meteo, Nominatim
- **[Interface UI](./docs/libs/ui.md)** : design system HeroUI-inspired, SCSS, Material Symbols
- **[Migration SIA](./docs/migration_sia.md)** : données ED-269, conversion, logique de couleurs

## Données & Cartographie

- **Restrictions Drone** : données officielles **SIA (ED-269)** — 3642 zones (avril 2026), converties en **tuiles vectorielles PMTiles** (`public/data/restrictions_sia.pmtiles`, ~18 MB).
  - **Code couleur** :
    - Bleu (`#006FEE`) — Hors zone SIA
    - Rouge (`#c0392b`) — Interdit
    - Orange (`#e67e22`) — Autorisation requise
    - Ambre/Jaune (`#f39c12`) — Restreint / Conditionnel
    - Bleu acier (`#5b7fa5`) — Information (> 120m, non applicable au drone de loisir)
- **Zones hors restriction SIA** : couche bleue en tuiles vectorielles (`public/data/allowed_zones.pmtiles`, ~0.9 MB).
- **Fonds de carte** : Jawg Streets (principal, via token), Esri Satellite.
- **Météo** : vent en temps réel via Open-Meteo (vitesse, direction, rafales, statut sécurité).

> **Attention** : les zones urbaines nécessitant une autorisation préfectorale ne sont pas cartographiées. Vérifiez toujours les règles locales.

## Démarrage Rapide

### Prérequis

- Node.js (v18+)
- NPM

### Installation & Lancement

```bash
# Installation
npm install

# Mode développement (Vite, port 3000)
npm run dev

# Construction pour production
npm run build

# Prévisualisation du build
npm run preview

# Tests E2E Playwright
npm test
```

L'application sera accessible sur `http://localhost:3000/drone/`.

## Déploiement

Déployé sur **GitHub Pages** au path `/drone/` via GitHub Actions (voir `.github/workflows/deploy.yml`).

## Licence

MIT License
