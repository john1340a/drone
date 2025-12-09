# Interface Utilisateur (UI)

Ce document décrit les outils utilisés pour le rendu visuel et l'expérience utilisateur.

## Fomantic UI

**Rôle** : Framework CSS / Composants UI.
**Pourquoi** : Fomantic UI (fork communautaire actif de Semantic UI) offre une syntaxe de classe très lisible (ex: `ui primary button`) et des composants riches (Modales, Accordéons, Sidebar) prêts à l'emploi. Cela accélère le développement sans avoir à tout recoder.

- **Documentation** : [https://fomantic-ui.com/](https://fomantic-ui.com/)
- **Version** : 2.9.3

## SASS / SCSS

**Rôle** : Préprocesseur CSS.
**Pourquoi** : Permet d'écrire du CSS modulaire et maintenable.

- **Variables** : Définir les couleurs (`$primary-color`) à un seul endroit.
- **Nesting** : Imbrication des sélecteurs pour refléter la structure HTML.
- **Partials** : Découpage en fichiers multiples (`_layout.scss`, `_components.scss`) pour une meilleure organisation.

* **Documentation** : [https://sass-lang.com/](https://sass-lang.com/)
* **Fichiers** : `src/styles/*.scss`

## Lucide Icons

**Rôle** : Icônes vectorielles.
**Pourquoi** : Lucide est une bibliothèque d'icônes open-source, légère, cohérente et moderne (fork de Feather Icons). Elle s'intègre facilement via CDN ou NPM.

- **Documentation** : [https://lucide.dev/](https://lucide.dev/)

## flag-icons

**Rôle** : Icônes de drapeaux.
**Pourquoi** : Utilisé pour afficher les drapeaux des territoires (DOM-TOM) dans le sélecteur de région. Solution CSS pure simple et efficace.

- **Démo** : [https://flagicons.lipis.dev/](https://flagicons.lipis.dev/)
