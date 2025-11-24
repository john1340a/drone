# Guide de Déploiement - SIG Restrictions Drone

## 📊 Configuration Google Analytics 4

### Étape 1 : Créer une propriété Google Analytics 4

1. Allez sur [Google Analytics](https://analytics.google.com/)
2. Connectez-vous avec votre compte Google
3. Cliquez sur **"Admin"** (roue dentée en bas à gauche)
4. Cliquez sur **"Créer une propriété"**
5. Remplissez les informations :
   - Nom de la propriété : `SIG Restrictions Drone`
   - Fuseau horaire : `France`
   - Devise : `Euro`
6. Cliquez sur **"Suivant"**
7. Configurez les détails de l'entreprise
8. Cliquez sur **"Créer"**

### Étape 2 : Obtenir votre ID de mesure

1. Dans la nouvelle propriété, allez dans **"Flux de données"**
2. Cliquez sur **"Ajouter un flux"** > **"Web"**
3. Renseignez :
   - URL du site web : `https://VOTRE-USERNAME.github.io/drone/`
   - Nom du flux : `SIG Restrictions Drone - GitHub Pages`
4. Cliquez sur **"Créer un flux"**
5. **Copiez l'ID de mesure** (format : `G-XXXXXXXXXX`)

### Étape 3 : Configurer l'application

1. Ouvrez le fichier `index.html`
2. Remplacez **les 2 occurrences** de `GA_MEASUREMENT_ID` par votre vrai ID :

```html
<!-- Ligne 9 -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-VOTRE-ID"></script>

<!-- Ligne 14 -->
gtag('config', 'G-VOTRE-ID', {
```

3. Ouvrez le fichier `src/js/config/config.js`
4. Remplacez `GA_MEASUREMENT_ID` par votre vrai ID (ligne 115) :

```javascript
measurementId: 'G-VOTRE-ID',
```

### Étape 4 : Événements trackés automatiquement

L'application track automatiquement :

- ✅ **Page Load** : Chargement de la page avec résolution d'écran
- ✅ **Map Interaction** : Zoom, déplacement de la carte
- ✅ **Layer Toggle** : Activation/désactivation des couches
- ✅ **Basemap Change** : Changement de fond de carte
- ✅ **Region Change** : Navigation DOM-TOM
- ✅ **Geolocation** : Utilisation de la géolocalisation (succès/échec)
- ✅ **Errors** : Erreurs JavaScript
- ✅ **Performance** : Métriques de chargement
- ✅ **Session Duration** : Durée de la session utilisateur

---

## 🚀 Déploiement sur GitHub Pages

### Option 1 : Déploiement depuis la branche principale (recommandé)

#### Étape 1 : Préparer le dépôt

```bash
# Assurez-vous d'avoir commité toutes vos modifications
git add .
git commit -m "feat: Ajout Google Analytics et préparation GitHub Pages"
git push origin main
```

#### Étape 2 : Activer GitHub Pages

1. Allez sur votre repository GitHub : `https://github.com/VOTRE-USERNAME/drone`
2. Cliquez sur **"Settings"** (Paramètres)
3. Dans le menu de gauche, cliquez sur **"Pages"**
4. Dans **"Source"**, sélectionnez :
   - **Branch** : `main`
   - **Folder** : `/ (root)`
5. Cliquez sur **"Save"**

#### Étape 3 : Créer un fichier `.nojekyll`

GitHub Pages utilise Jekyll par défaut, ce qui peut causer des problèmes avec les dossiers commençant par `_`.

```bash
# Créer le fichier .nojekyll à la racine
touch .nojekyll

# Commiter et pousser
git add .nojekyll
git commit -m "chore: Désactiver Jekyll pour GitHub Pages"
git push origin main
```

#### Étape 4 : Modifier les chemins des ressources

Les fichiers `node_modules` ne sont pas inclus dans GitHub Pages. Il faut utiliser des CDN.

Remplacez dans `index.html` :

```html
<!-- AVANT (local) -->
<link rel="stylesheet" href="node_modules/leaflet/dist/leaflet.css" />
<script src="node_modules/jquery/dist/jquery.min.js"></script>

<!-- APRÈS (CDN) -->
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
```

### Option 2 : Déploiement avec script automatique

Créez un fichier `deploy.sh` :

```bash
#!/bin/bash

echo "🚀 Déploiement sur GitHub Pages..."

# Build (si nécessaire)
echo "📦 Préparation des fichiers..."

# Créer .nojekyll si nécessaire
touch .nojekyll

# Git add & commit
git add .
git commit -m "deploy: Mise à jour du site"

# Push
git push origin main

echo "✅ Déploiement terminé !"
echo "🌐 Site disponible sur : https://VOTRE-USERNAME.github.io/drone/"
```

Rendez-le exécutable et lancez-le :

```bash
chmod +x deploy.sh
./deploy.sh
```

---

## 📦 Utilisation des CDN pour les dépendances

Pour que l'application fonctionne sur GitHub Pages, remplacez les imports `node_modules` par des CDN :

### Leaflet

```html
<!-- CSS -->
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
      crossorigin=""/>

<!-- JS -->
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
        integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
        crossorigin=""></script>
```

### jQuery

```html
<script src="https://code.jquery.com/jquery-3.7.1.min.js"
        integrity="sha256-/JqT3SQfawRcv/BIHPThkBvs0OEvtFFmqPF/lYI/Cxo="
        crossorigin="anonymous"></script>
```

### Fomantic UI

```html
<!-- CSS -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/fomantic-ui@2.9.3/dist/semantic.min.css">

<!-- JS -->
<script src="https://cdn.jsdelivr.net/npm/fomantic-ui@2.9.3/dist/semantic.min.js"></script>
```

### Leaflet MiniMap

```html
<!-- CSS -->
<link rel="stylesheet" href="https://unpkg.com/leaflet-minimap@3.6.1/dist/Control.MiniMap.min.css">

<!-- JS -->
<script src="https://unpkg.com/leaflet-minimap@3.6.1/dist/Control.MiniMap.min.js"></script>
```

### Leaflet Locate Control

```html
<!-- CSS -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/leaflet.locatecontrol@0.79.0/dist/L.Control.Locate.min.css">

<!-- JS -->
<script src="https://cdn.jsdelivr.net/npm/leaflet.locatecontrol@0.79.0/dist/L.Control.Locate.min.js"></script>
```

---

## 🔍 Vérification du déploiement

### Après 2-3 minutes, votre site sera accessible à :

```
https://VOTRE-USERNAME.github.io/drone/
```

### Checklist de vérification :

- [ ] La page se charge sans erreur 404
- [ ] La carte Leaflet s'affiche correctement
- [ ] Les couches IGN se chargent
- [ ] La géolocalisation fonctionne (si autorisée)
- [ ] Le gestionnaire de couches fonctionne
- [ ] Les événements Google Analytics sont envoyés (vérifier dans GA4 en temps réel)

---

## 📊 Consulter les statistiques

1. Allez sur [Google Analytics](https://analytics.google.com/)
2. Sélectionnez votre propriété **"SIG Restrictions Drone"**
3. Cliquez sur **"Temps réel"** pour voir les utilisateurs actifs
4. Consultez les rapports :
   - **Engagement** > **Événements** : Voir tous les événements trackés
   - **Rétention** : Voir les utilisateurs qui reviennent
   - **Données démographiques** : Localisation des utilisateurs
   - **Technologie** : Navigateurs, appareils utilisés

---

## 🛠 Dépannage

### Problème : 404 sur les fichiers CSS/JS

**Solution** : Vérifiez que tous les chemins utilisent des CDN et non `node_modules`.

### Problème : Google Analytics ne track pas

**Solution** :
1. Vérifiez que l'ID `G-XXXXXXXXXX` est correct
2. Ouvrez la console du navigateur (F12)
3. Cherchez les logs `📊 Analytics Service initialisé`
4. Vérifiez dans GA4 > Temps réel si les événements arrivent

### Problème : La carte ne s'affiche pas

**Solution** :
1. Ouvrez la console (F12)
2. Vérifiez les erreurs de chargement des tuiles
3. Testez sur un autre navigateur
4. Vérifiez la connexion Internet

---

## 📝 Notes importantes

- **RGPD** : L'IP anonymization est activée par défaut (`anonymize_ip: true`)
- **Performance** : Les événements de zoom sont throttled pour éviter le spam
- **Session** : La durée de session est calculée et envoyée à la fermeture
- **Erreurs** : Toutes les erreurs JS sont automatiquement trackées

---

## 🔗 Liens utiles

- [Documentation Google Analytics 4](https://support.google.com/analytics/answer/10089681)
- [Documentation GitHub Pages](https://docs.github.com/en/pages)
- [Documentation Leaflet](https://leafletjs.com/)
- [Documentation Fomantic UI](https://fomantic-ui.com/)
