# SIG Restrictions Drone

Application web SIG responsive pour visualiser les zones de restriction de vol de drone en France.

## 📚 Documentation

La documentation détaillée technique est disponible dans le dossier [`docs/`](./docs):

- **[Architecture](./docs/architecture/overview.md)** : Structure du code, Design Patterns (MVC).
- **[Stack Technique](./docs/libs/core.md)** : Vite, TypeScript, Build.
- **[Cartographie](./docs/libs/mapping.md)** : Leaflet, IGN Geoportail, Plugins.
- **[Interface UI](./docs/libs/ui.md)** : Fomantic UI, SASS, Icons.

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
