#!/bin/bash

echo "🚀 Déploiement sur GitHub Pages..."

# Couleurs pour les messages
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Vérifier si on est dans un dépôt git
if [ ! -d .git ]; then
    echo "${YELLOW}⚠️  Ce n'est pas un dépôt Git. Initialisation...${NC}"
    git init
    git remote add origin https://github.com/VOTRE-USERNAME/drone.git
fi

# Créer .nojekyll si nécessaire
if [ ! -f .nojekyll ]; then
    echo "${BLUE}📝 Création du fichier .nojekyll${NC}"
    touch .nojekyll
fi

# Copier index-gh-pages.html vers index.html (version CDN)
if [ -f index-gh-pages.html ]; then
    echo "${BLUE}📦 Utilisation de la version GitHub Pages (CDN)${NC}"
    cp index-gh-pages.html index.html
fi

# Build (si nécessaire)
echo "${BLUE}📦 Préparation des fichiers...${NC}"

# Vérifier si l'ID Google Analytics a été configuré
if grep -q "GA_MEASUREMENT_ID" index.html; then
    echo "${YELLOW}⚠️  ATTENTION : Vous devez remplacer GA_MEASUREMENT_ID par votre vrai ID Google Analytics !${NC}"
    echo "   Éditez index.html et src/js/config/config.js"
    read -p "   Continuer quand même ? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Git add & commit
echo "${BLUE}📤 Commit des modifications...${NC}"
git add .
git commit -m "deploy: Mise à jour du site $(date +'%Y-%m-%d %H:%M:%S')"

# Push
echo "${BLUE}🚀 Push vers GitHub...${NC}"
git push origin main

echo ""
echo "${GREEN}✅ Déploiement terminé !${NC}"
echo ""
echo "🌐 Votre site sera disponible dans 2-3 minutes sur :"
echo "   ${BLUE}https://VOTRE-USERNAME.github.io/drone/${NC}"
echo ""
echo "📊 Pour activer GitHub Pages :"
echo "   1. Allez sur https://github.com/VOTRE-USERNAME/drone/settings/pages"
echo "   2. Source: main branch, / (root)"
echo "   3. Cliquez sur 'Save'"
echo ""
