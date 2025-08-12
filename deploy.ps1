# Script de deploiement automatique pour MangooTech (PowerShell)
# Ce script automatise le processus de build et de deploiement

# Arreter le script en cas d'erreur
$ErrorActionPreference = "Stop"

Write-Host "Debut du deploiement de MangooTech..." -ForegroundColor Green

try {
    # Verifier que nous sommes sur la branche main
    Write-Host "Verification de la branche actuelle..." -ForegroundColor Yellow
    $currentBranch = git branch --show-current
    if ($currentBranch -ne "main") {
        Write-Host "Attention: Vous n'etes pas sur la branche main (branche actuelle: $currentBranch)" -ForegroundColor Yellow
        $continue = Read-Host "Voulez-vous continuer? (y/N)"
        if ($continue -notmatch "^[Yy]$") {
            Write-Host "Deploiement annule" -ForegroundColor Red
            exit 1
        }
    }

    # Verifier s'il y a des changements non commitees
    Write-Host "Verification des changements non commitees..." -ForegroundColor Yellow
    $gitStatus = git status --porcelain
    if ($gitStatus) {
        Write-Host "Il y a des changements non commitees:" -ForegroundColor Yellow
        git status --short
        $continue = Read-Host "Voulez-vous continuer sans committer ces changements? (y/N)"
        if ($continue -notmatch "^[Yy]$") {
            Write-Host "Deploiement annule. Veuillez committer vos changements d'abord." -ForegroundColor Red
            exit 1
        }
    }

    # Installer les dependances
    Write-Host "Installation des dependances..." -ForegroundColor Cyan
    npm ci
    if ($LASTEXITCODE -ne 0) {
        throw "Erreur lors de l'installation des dependances"
    }

    # Lancer les tests de linting
    Write-Host "Verification du code (linting)..." -ForegroundColor Cyan
    npm run lint
    if ($LASTEXITCODE -ne 0) {
        throw "Erreur lors du linting"
    }

    # Build du projet
    Write-Host "Build du projet..." -ForegroundColor Cyan
    npm run build
    if ($LASTEXITCODE -ne 0) {
        throw "Erreur lors du build"
    }

    # Verifier que le build a reussi
    if (-not (Test-Path "dist")) {
        throw "Le dossier 'dist' n'a pas ete cree. Le build a echoue."
    }

    Write-Host "Build termine avec succes!" -ForegroundColor Green

    # Pousser vers GitHub (si demande)
    $pushToGitHub = Read-Host "Voulez-vous pousser les changements vers GitHub? (y/N)"
    if ($pushToGitHub -match "^[Yy]$") {
        Write-Host "Push vers GitHub..." -ForegroundColor Cyan
        git push origin main
        if ($LASTEXITCODE -ne 0) {
            throw "Erreur lors du push vers GitHub"
        }
        Write-Host "Push termine! Le deploiement automatique va commencer sur GitHub Pages." -ForegroundColor Green
        Write-Host "Votre site sera disponible a: https://fode1960.github.io/MangooTech/" -ForegroundColor Blue
    } else {
        Write-Host "Push ignore. Vous pouvez pousser manuellement avec: git push origin main" -ForegroundColor Yellow
    }

    Write-Host "Deploiement local termine avec succes!" -ForegroundColor Green
    Write-Host "Les fichiers de build sont dans le dossier 'dist/'" -ForegroundColor Blue
    Write-Host "Pour deployer sur GitHub Pages, poussez vers la branche main" -ForegroundColor Blue

} catch {
    Write-Host "Erreur: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}