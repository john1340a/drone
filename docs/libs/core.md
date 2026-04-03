# Core & Build Tools

Technologies fondamentales utilisees pour la construction et l'execution de l'application.

## Vite

**Role** : Bundler et serveur de developpement.
**Pourquoi** : Demarrage instantane (modules ES natifs), HMR ultra-rapide, build production optimise (Rollup).

- **Documentation** : [https://vitejs.dev/](https://vitejs.dev/)
- **Configuration** : [`vite.config.ts`](../../vite.config.ts)
- **Base path** : `/drone/` (pour GitHub Pages)

## TypeScript

**Role** : Langage de programmation avec typage statique.
**Pourquoi** : Reduction des bugs runtime, autocompletion IDE, maintenabilite du code.

- **Documentation** : [https://www.typescriptlang.org/](https://www.typescriptlang.org/)
- **Configuration** : [`tsconfig.json`](../../tsconfig.json)
- **Mode** : `strict`, `noUnusedLocals`, `noUnusedParameters`

## NPM

**Role** : Gestionnaire de dependances.

- **Documentation** : [https://docs.npmjs.com/](https://docs.npmjs.com/)
- **Fichier** : [`package.json`](../../package.json)

## Playwright

**Role** : Tests End-to-End (E2E).
**Pourquoi** : Tests multi-navigateurs (Chromium, Firefox, WebKit) et mobile. Plus fiable et rapide que Selenium.

- **Documentation** : [https://playwright.dev/](https://playwright.dev/)
- **Configuration** : [`playwright.config.ts`](../../playwright.config.ts)
- **Execution** : `npm test`
- **Navigateurs** : Chromium, Firefox, WebKit, Mobile Chrome (Pixel 5), Mobile Safari (iPhone 12)
