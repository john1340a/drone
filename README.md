# SIG Restrictions Drone

Application web SIG responsive pour visualiser les zones de restriction de vol de drone en France.

## Stack Technique

- **Frontend**: HTML5, CSS3, TypeScript
- **Bundler**: Vite
- **Cartographie**: Leaflet
- **UI Framework**: Fomantic UI
- **Gestionnaire de packages**: NPM
- **Données**: GeoJSON, Services WMS/WMTS IGN

## Fonctionnalités

### Fonctionnalités Implémentées

- Carte interactive avec support du zoom et pan
- Fonds de carte multiples:
  - Orthophotos IGN (par défaut)
  - OpenStreetMap
  - Satellite (Esri/Maxar)
- Couches de données:
  - Zones de restrictions drones (IGN TRANSPORTS.DRONES.RESTRICTIONS)
- Gestionnaire de couches pour activer/désactiver les couches
- Design responsive (desktop, tablet, mobile)
- Interface utilisateur moderne avec Fomantic UI
- Optimisations de performance (Vite, Lazy Loading)
- Intégration Google Analytics 4

### Fonctionnalités Futures

- Support PostgreSQL/PostGIS
- Import de fichiers GeoJSON personnalisés
- Recherche géographique
- Géolocalisation utilisateur
- Sauvegarde des préférences utilisateur

## Installation

### Prérequis

- Node.js (version 18 ou supérieure recommandée)
- NPM

### Installation des dépendances

```bash
npm install
```

### Lancement de l'application

```bash
# Mode développement avec rechargement automatique
npm run dev

# Construction pour la production
npm run build

# Prévisualisation du build de production
npm run preview
```

L'application sera accessible (par défaut) à l'adresse: `http://localhost:3000`

## Déploiement

Le déploiement est automatisé via GitHub Actions vers GitHub Pages.

**Configuration requise sur GitHub:**

1. **Secrets**: Ajouter `VITE_GA_MEASUREMENT_ID` dans Settings > Secrets and variables > Actions.
2. **Pages**: Configurer la source sur "GitHub Actions" dans Settings > Pages.

## Architecture

### Structure du projet

```
drone/
├── src/
│   ├── js/
│   │   ├── config/
│   │   │   └── config.ts              # Configuration de l'application
│   │   ├── services/
│   │   │   ├── MapService.ts          # Service de gestion de la carte
│   │   │   ├── LayerService.ts        # Service de gestion des couches
│   │   │   └── AnalyticsService.ts    # Service Google Analytics 4
│   │   ├── controllers/
│   │   │   └── MapController.ts       # Contrôleur principal
│   │   ├── controls/
│   │   │   └── BasemapSwitcher.ts     # Contrôle de changement de fond de carte
│   │   ├── leaflet-setup.ts           # Configuration globale Leaflet
│   │   ├── icons.ts                   # Gestion des icônes
│   │   └── app.ts                     # Point d'entrée de l'application
│   ├── styles/
│   │   └── main.css                   # Styles CSS personnalisés
│   └── assets/                        # Images et ressources statiques
├── dist/                              # Dossier de build (généré)
├── public/                            # Fichiers publics statiques
├── index.html                         # Page principale
├── vite.config.ts                     # Configuration Vite
├── tsconfig.json                      # Configuration TypeScript
├── package.json                       # Configuration NPM
└── README.md                          # Documentation
```

### Principes de conception

L'application respecte les principes **SOLID** et **Clean Code**:

- **Single Responsibility**: Chaque classe a une responsabilité unique
- **Open/Closed**: Extensions possibles sans modification du code existant
- **Liskov Substitution**: Les services peuvent être substitués
- **Interface Segregation**: Interfaces spécifiques et ciblées
- **Dependency Inversion**: Dépendances vers les abstractions

### Architecture en couches

1. **Couche de présentation**: HTML + CSS + Fomantic UI
2. **Couche de contrôle**: MapController
3. **Couche de service**: MapService, LayerService, AnalyticsService
4. **Couche de configuration**: Config

## Configuration

### Sources de données

Les données proviennent des services IGN:

- **WMS**: `https://wxs.ign.fr/essentiels/geoportail/r/wms`
- **WMTS**: `https://wxs.ign.fr/essentiels/geoportail/wmts`
- **Couche**: `TRANSPORTS.DRONES.RESTRICTIONS`

### Personnalisation

Modifiez le fichier `src/js/config/config.ts` pour:

- Changer la position et le zoom initial de la carte
- Ajouter de nouveaux fonds de carte
- Configurer de nouvelles couches de données
- Personnaliser l'interface utilisateur
- Configurer Google Analytics

## Responsive Design

L'application est optimisée pour tous les appareils:

- **Desktop** (> 992px): Sidebar fixe
- **Tablet** (768px - 992px): Sidebar réduite
- **Mobile** (< 768px): Sidebar masquée avec menu hamburger

## Licence

MIT License
