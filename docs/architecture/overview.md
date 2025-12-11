# Architecture du Projet

Ce document décrit l'architecture technique de l'application **SIG Restrictions Drone**. L'objectif est de fournir une vue d'ensemble pour comprendre les choix de conception et faciliter la maintenance.

## Structure des Dossiers

L'application suit une structure standardisée pour un projet TypeScript/Vite (Pattern 7-1 SASS simplifié pour les styles) :

```
/
├── .github/workflows/   # Configurations CI/CD (GitHub Actions)
├── docs/                # Documentation technique (Libs, Architecture)
├── public/              # Fichiers statiques servis à la racine
├── src/
│   ├── assets/          # Images, fonts, et médias
│   ├── js/
│   │   ├── config/      # Configuration globale et constantes
│   │   ├── controllers/ # Logique d'orchestration (Contrôleurs)
│   │   ├── controls/    # Composants UI Leaflet personnalisés
│   │   ├── services/    # Logique métier et accès aux données
│   │   ├── app.ts       # Point d'entrée de l'application
│   │   └── leaflet-setup.ts # Configuration globale Leaflet
│   └── styles/          # Styles SCSS
│       ├── _variables.scss
│       ├── _layout.scss
│       ├── ...
│       └── main.scss
├── index.html           # Point d'entrée HTML
├── vite.config.ts       # Configuration du bundler Vite
└── tsconfig.json        # Configuration du compilateur TypeScript
```

## Patterns de Conception (Design Patterns)

L'application n'utilise pas de framework JS lourd (React/Vue) mais une architecture orientée objet structurée autour de **Services** et **Contrôleurs**.

### 1. Modèle MVC (Adapté)

- **Model (Données)** : Géré principalement par les services (`LayerService`, `Config`). Les données sont statiques (GeoJSON) ou distantes (WMS).
- **View (Vue)** : HTML statique + Composants Leaflet + Fomantic UI. La vue est manipulée par le Contrôleur.
- **Controller (Contrôleur)** : `MapController` est le chef d'orchestre. Il initialise les services, écoute les événements de la vue, et met à jour l'interface.

### 2. Injection de Dépendances (DI)

Les classes sont conçues pour recevoir leurs dépendances via le constructeur, facilitant les tests et le découplage.
_Exemple :_ `BasemapSwitcher` reçoit `MapService` en argument.

### 3. Singleton (Services)

Bien que non strictement appliqués via `class static instance`, les services comme `AnalyticsService` agissent comme des singletons dans le cycle de vie de l'application (instanciés une seule fois dans `app.ts`).

## Flux de Données

1.  **Initialisation (`app.ts`)** :
    - Chargement de la configuration.
    - Instanciation des services (`MapService`, `LayerService`, `AnalyticsService`).
    - Instanciation du contrôleur (`MapController`).
2.  **Démarrage (`MapController.initialize()`)** :
    - Le contrôleur demande au `MapService` de créer la carte.
    - Il demande au `LayerService` les couches à ajouter.
    - Il configure les écouteurs d'événements (UI, Carte).

## Gestion des Environnements

L'application utilise **Vite** pour la gestion des variables d'environnement.

- **Local** (`.env`) : Variables pour le développement.
- **Production** (GitHub Actions) : Injection des secrets (ex: `VITE_GA_MEASUREMENT_ID`) lors du build.
- **Accès dans le code** : Via `import.meta.env`.

## Qualité & Tests

L'application maintient un haut niveau de qualité grâce à :

1.  **Typage Strict** : TypeScript empêche la plupart des erreurs de runtime.
2.  **Linting** : ESLint assure la cohérence du code.
3.  **Tests E2E** : **Playwright** valide automatiquement les scénarios critiques (chargement de la carte, contrôle des couches, responsive design mobile) avant chaque déploiement.
