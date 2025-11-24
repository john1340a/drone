# Script de deploiement GitHub Pages pour Windows
# Utilisation : .\deploy.ps1

Write-Host "Deploiement sur GitHub Pages..." -ForegroundColor Cyan

# Verifier si on est dans un depot git
if (-not (Test-Path .git)) {
    Write-Host "Ce n'est pas un depot Git. Initialisation..." -ForegroundColor Yellow
    git init
    Write-Host "Entrez l'URL de votre depot GitHub (ex: https://github.com/username/drone.git):" -ForegroundColor Yellow
    $repoUrl = Read-Host
    git remote add origin $repoUrl
}

# Creer .nojekyll si necessaire
if (-not (Test-Path .nojekyll)) {
    Write-Host "Creation du fichier .nojekyll" -ForegroundColor Blue
    New-Item -Path .nojekyll -ItemType File -Force | Out-Null
}

# Copier index-gh-pages.html vers index.html (version CDN)
if (Test-Path index-gh-pages.html) {
    Write-Host "Utilisation de la version GitHub Pages (CDN)" -ForegroundColor Blue
    Copy-Item index-gh-pages.html index.html -Force
}

# Verifier si l'ID Google Analytics a ete configure
$indexContent = Get-Content index.html -Raw
if ($indexContent -match "GA_MEASUREMENT_ID") {
    Write-Host "ATTENTION : Vous devez remplacer GA_MEASUREMENT_ID par votre vrai ID Google Analytics !" -ForegroundColor Yellow
    Write-Host "   Editez index.html et src/js/config/config.js" -ForegroundColor Yellow
    $continue = Read-Host "   Continuer quand meme ? (y/N)"
    if ($continue -ne "y" -and $continue -ne "Y") {
        exit 1
    }
}

# Git add & commit
Write-Host "Commit des modifications..." -ForegroundColor Blue
git add .
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
git commit -m "deploy: Mise a jour du site $timestamp"

# Push
Write-Host "Push vers GitHub..." -ForegroundColor Blue
git push origin main

Write-Host ""
Write-Host "Deploiement termine !" -ForegroundColor Green
Write-Host ""
Write-Host "Votre site sera disponible dans 2-3 minutes sur :" -ForegroundColor Cyan
Write-Host "   https://VOTRE-USERNAME.github.io/drone/" -ForegroundColor Blue
Write-Host ""
Write-Host "Pour activer GitHub Pages :" -ForegroundColor Cyan
Write-Host "   1. Allez sur https://github.com/VOTRE-USERNAME/drone/settings/pages"
Write-Host "   2. Source: main branch, / (root)"
Write-Host "   3. Cliquez sur 'Save'"
Write-Host ""
