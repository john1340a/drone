# 🚀 Guide Rapide - Déploiement & Analytics

## ⚡ Installation rapide Google Analytics (5 minutes)

### 1. Créer un compte Google Analytics 4

1. Allez sur [analytics.google.com](https://analytics.google.com)
2. Cliquez sur **"Admin"** → **"Créer une propriété"**
3. Nom : `SIG Restrictions Drone`
4. Créez un **flux de données Web**
5. **Copiez votre ID** (format : `G-XXXXXXXXXX`)

### 2. Configurer l'application

Remplacez `GA_MEASUREMENT_ID` dans **3 endroits** :

#### Fichier 1 : `index.html` (ligne 9)
```html
<script async src="https://www.googletagmanager.com/gtag/js?id=G-VOTRE-ID"></script>
```

#### Fichier 2 : `index.html` (ligne 14)
```javascript
gtag('config', 'G-VOTRE-ID', {
```

#### Fichier 3 : `src/js/config/config.js` (ligne 115)
```javascript
measurementId: 'G-VOTRE-ID',
```

### 3. Tester en local

```bash
npm start
```

Ouvrez la console du navigateur (F12), vous devriez voir :
```
📊 Analytics Service initialisé
📊 Event tracked: page_load
```

Vérifiez dans Google Analytics → **Temps réel** que les événements arrivent.

---

## 🌐 Déploiement GitHub Pages (5 minutes)

### Option A : Script automatique (recommandé)

#### Windows (PowerShell)
```powershell
.\deploy.ps1
```

#### Linux/Mac
```bash
chmod +x deploy.sh
./deploy.sh
```

### Option B : Déploiement manuel

#### 1. Utiliser la version CDN

```bash
# Remplacer index.html par la version CDN
cp index-gh-pages.html index.html
```

#### 2. Commit et push

```bash
git add .
git commit -m "deploy: Configuration pour GitHub Pages"
git push origin main
```

#### 3. Activer GitHub Pages

1. Allez sur `https://github.com/VOTRE-USERNAME/drone/settings/pages`
2. **Source** : `main` branch, `/ (root)` folder
3. Cliquez sur **"Save"**

#### 4. Attendre 2-3 minutes

Votre site sera disponible à :
```
https://VOTRE-USERNAME.github.io/drone/
```

---

## ✅ Checklist de vérification

### Analytics
- [ ] ID Google Analytics configuré dans les 3 fichiers
- [ ] Console du navigateur affiche `📊 Analytics Service initialisé`
- [ ] Événements visibles dans GA4 → Temps réel

### GitHub Pages
- [ ] Fichier `.nojekyll` créé
- [ ] `index.html` utilise des CDN (pas `node_modules`)
- [ ] Site accessible à `https://VOTRE-USERNAME.github.io/drone/`
- [ ] Carte Leaflet s'affiche correctement
- [ ] Couches IGN se chargent
- [ ] Aucune erreur 404 dans la console

---

## 📊 Événements trackés automatiquement

| Événement | Description | Paramètres |
|-----------|-------------|------------|
| `page_load` | Chargement de la page | Résolution, viewport |
| `map_interaction` | Zoom/pan de la carte | Niveau de zoom, position |
| `layer_toggle` | Activation/désactivation couche | Nom de la couche, état |
| `basemap_change` | Changement de fond de carte | Nom du fond |
| `region_change` | Navigation DOM-TOM | Nom de la région |
| `geolocation` | Utilisation géolocalisation | Succès/échec |
| `error` | Erreur JavaScript | Message, stack trace |
| `performance` | Métriques de chargement | Temps de chargement |
| `session_duration` | Durée de session | Secondes |

---

## 🛠 Dépannage rapide

### ❌ Analytics ne fonctionne pas

**Symptôme** : Pas d'événements dans GA4 temps réel

**Solutions** :
1. Vérifiez l'ID : `G-XXXXXXXXXX` correct dans les 3 fichiers
2. Ouvrez la console (F12), cherchez les erreurs
3. Vérifiez que `gtag` est bien chargé : tapez `gtag` dans la console
4. Attendez 2-3 minutes pour que GA4 traite les événements

### ❌ Site GitHub Pages ne s'affiche pas

**Symptôme** : 404 ou page blanche

**Solutions** :
1. Vérifiez que GitHub Pages est activé dans Settings
2. Assurez-vous que `index.html` utilise des CDN
3. Vérifiez que `.nojekyll` existe
4. Attendez 2-3 minutes après le push
5. Videz le cache du navigateur (Ctrl + Shift + R)

### ❌ Erreurs 404 sur les fichiers CSS/JS

**Symptôme** : Site s'affiche mal, erreurs dans la console

**Solutions** :
1. Utilisez `index-gh-pages.html` comme `index.html`
2. Vérifiez que tous les chemins sont relatifs (pas de `/` au début)
3. Vérifiez que les CDN sont accessibles

---

## 📚 Documentation complète

- **Guide détaillé** : [DEPLOYMENT.md](DEPLOYMENT.md)
- **Architecture** : [README.md](README.md)
- **Support** : Créez une issue sur GitHub

---

## 🎉 C'est fait !

Votre application est maintenant :
- ✅ Hébergée gratuitement sur GitHub Pages
- ✅ Trackée avec Google Analytics 4
- ✅ Accessible au monde entier
- ✅ Avec statistiques en temps réel

**URL publique** : `https://VOTRE-USERNAME.github.io/drone/`

**Dashboard analytics** : [analytics.google.com](https://analytics.google.com)
