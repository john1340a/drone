# Core & Build Tools

Technologies fondamentales utilisées pour la construction, l'exécution et le test de l'application.

## Vite

**Rôle** : bundler et serveur de développement.
**Pourquoi** : démarrage instantané (modules ES natifs), HMR ultra-rapide, build production optimisé (Rollup).

- **Documentation** : [https://vitejs.dev/](https://vitejs.dev/)
- **Configuration** : [`vite.config.ts`](../../vite.config.ts)
- **Base path** : `/drone/` (pour GitHub Pages)
- **Version** : ^6.4.1

## TypeScript

**Rôle** : langage de programmation avec typage statique.
**Pourquoi** : réduction des bugs runtime, autocomplétion IDE, maintenabilité du code.

- **Documentation** : [https://www.typescriptlang.org/](https://www.typescriptlang.org/)
- **Configuration** : [`tsconfig.json`](../../tsconfig.json)
- **Version** : ^5.9.3
- **Mode** : `strict`, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`
- **Types inclus** : `vite/client`, `jquery` (fomantic toasts residuels)

## NPM

**Rôle** : gestionnaire de dépendances.

- **Documentation** : [https://docs.npmjs.com/](https://docs.npmjs.com/)
- **Fichier** : [`package.json`](../../package.json)

### Dépendances principales

| Package | Version | Usage |
|---------|---------|-------|
| `maplibre-gl` | ^5.21.1 | Moteur de carte WebGL |
| `pmtiles` | ^4.4.0 | Protocole tuiles vectorielles |
| `fomantic-ui` | ^2.9.3 | Toasts d'erreur (usage résiduel) |
| `jquery` | ^3.7.1 | Requis par Fomantic UI |

### Dépendances dev

| Package | Version | Usage |
|---------|---------|-------|
| `@playwright/test` | ^1.57.0 | Tests E2E |
| `@turf/turf` | ^7.3.3 | Calculs géospatiaux (script `create_allowed_zones.js`) |
| `sass` | ^1.95.0 | Préprocesseur CSS |
| `typescript` | ^5.9.3 | Compilateur TS |
| `vite` | ^6.4.1 | Bundler |

## Playwright

**Rôle** : tests End-to-End (E2E).
**Pourquoi** : tests multi-navigateurs (Chromium, Firefox, WebKit) et mobile. Auto-démarrage du serveur dev.

- **Documentation** : [https://playwright.dev/](https://playwright.dev/)
- **Configuration** : [`playwright.config.ts`](../../playwright.config.ts)
- **Exécution** : `npm test`
- **Single test** : `npx playwright test tests/e2e/map.spec.ts --project=chromium`
- **Navigateurs** : Chromium, Firefox, WebKit, Mobile Chrome (Pixel 5), Mobile Safari (iPhone 12)
- **Tests existants** : `tests/e2e/map.spec.ts`, `tests/e2e/pmtiles.spec.ts`

## Scripts NPM

```bash
npm run dev          # Serveur Vite (port 3000, ouvre le navigateur)
npm run build        # tsc --noEmit + vite build -> dist/
npm run preview      # Preview du build production
npm test             # Playwright (démarre Vite automatiquement)
npm run lint         # No-op (linting désactivé pendant la migration)
```

## CI/CD

- **GitHub Actions** : `.github/workflows/deploy.yml`
- **Trigger** : push sur `main`
- **Étapes** : checkout → setup Node 20 → `npm ci` → `npm run build` → deploy to GitHub Pages
