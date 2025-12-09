# Core & Build Tools

Ce document détaille les technologies fondamentales utilisées pour la construction et l'exécution de l'application.

## Vite

**Rôle** : Bundler et Serveur de développement.
**Pourquoi** : Vite offre des performances exceptionnelles comparé à Webpack, avec un démarrage instantané du serveur (grâce aux modules ES natifs) et une compilation de production ultra-optimisée (Rollup).

- **Documentation** : [https://vitejs.dev/](https://vitejs.dev/)
- **Configuration** : [`vite.config.ts`](../../vite.config.ts)

## TypeScript

**Rôle** : Langage de programmation.
**Pourquoi** : Apporte le typage statique à JavaScript, ce qui réduit considérablement les bugs à l'exécution, améliore l'autocomplétion dans l'IDE et rend le code beaucoup plus maintenable et lisible pour une équipe.

- **Documentation** : [https://www.typescriptlang.org/](https://www.typescriptlang.org/)
- **Configuration** : [`tsconfig.json`](../../tsconfig.json)

## NPM (Node Package Manager)

**Rôle** : Gestionnaire de dépendances.
**Pourquoi** : Standard de facto de l'écosystème JavaScript pour installer et gérer les librairies tierces.

- **Documentation** : [https://docs.npmjs.com/](https://docs.npmjs.com/)
- **Fichier** : [`package.json`](../../package.json)

## ESLint (via TypeScript)

**Rôle** : Linter (Analyse statique).
**Pourquoi** : Identifie les problèmes de qualité de code et assure le respect des conventions avant même la compilation.

- **Documentation** : [https://eslint.org/](https://eslint.org/)
