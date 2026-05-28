# Script de Diagnostic et Correction GitHub Pages 404
# Resout automatiquement les problemes de deploiement GitHub Pages

Write-Host "Diagnostic GitHub Pages - Resolution erreur 404" -ForegroundColor Green
Write-Host "=" * 60 -ForegroundColor Gray

# Variables
$owner = "Fode1960"
$repo = "MangooTech"
$siteUrl = "https://$owner.github.io/$repo/"
$pagesUrl = "https://github.com/$owner/$repo/settings/pages"
$actionsUrl = "https://github.com/$owner/$repo/actions"

# Fonction de test d'URL
function Test-UrlAccessible {
    param([string]$url)
    try {
        $response = Invoke-WebRequest -Uri $url -Method Head -TimeoutSec 10
        return $response.StatusCode -eq 200
    } catch {
        return $false
    }
}

# Etape 1: Test de l'URL actuelle
Write-Host "1. Test de l'URL GitHub Pages..." -ForegroundColor Yellow
Write-Host "   URL testee: $siteUrl" -ForegroundColor Cyan
if (Test-UrlAccessible $siteUrl) {
    Write-Host "Site accessible! Le probleme est resolu" -ForegroundColor Green
    Start-Process $siteUrl
    exit 0
} else {
    Write-Host "Site toujours inaccessible (404)" -ForegroundColor Red
}

# Etape 2: Verification de la configuration Vite
Write-Host "\n2. Verification de la configuration Vite..." -ForegroundColor Yellow
$viteConfig = Get-Content "vite.config.js" -Raw
if ($viteConfig -match "base:\s*process\.env\.NODE_ENV\s*===\s*'production'\s*\?\s*'/MangooTech/'\s*:\s*'/'") {
    Write-Host "Configuration Vite correcte pour GitHub Pages" -ForegroundColor Green
} else {
    Write-Host "Configuration Vite incorrecte" -ForegroundColor Red
    Write-Host "Correction automatique..." -ForegroundColor Cyan
    
    # Backup du fichier original
    Copy-Item "vite.config.js" "vite.config.js.backup"
    
    # Correction de la configuration
    $correctedConfig = $viteConfig -replace "base:\s*[^,]+,", "base: process.env.NODE_ENV === 'production' ? '/MangooTech/' : '/',"
    Set-Content "vite.config.js" $correctedConfig
    
    Write-Host "Configuration Vite corrigee" -ForegroundColor Green
}

# Etape 3: Test de build local
Write-Host "\n3. Test de build local..." -ForegroundColor Yellow
try {
    $env:NODE_ENV = "production"
    npm run build 2>$null
    if (Test-Path "dist") {
        Write-Host "Build local reussi" -ForegroundColor Green
        
        # Verifier le contenu du build
        if (Test-Path "dist/index.html") {
            Write-Host "Fichier index.html genere" -ForegroundColor Green
        } else {
            Write-Host "Fichier index.html manquant dans le build" -ForegroundColor Red
        }
    } else {
        Write-Host "Build local echoue - dossier dist non cree" -ForegroundColor Red
    }
} catch {
    Write-Host "Erreur lors du build local: $($_.Exception.Message)" -ForegroundColor Red
}

# Etape 4: Declenchement d'un nouveau deploiement
Write-Host "\n4. Declenchement d'un nouveau deploiement..." -ForegroundColor Yellow

# Verifier le statut Git
$gitStatus = git status --porcelain 2>$null
if ($gitStatus) {
    Write-Host "Changements detectes, creation d'un commit..." -ForegroundColor Cyan
    git add .
    git commit -m "Fix: GitHub Pages 404 - Configuration correction"
} else {
    Write-Host "Aucun changement, creation d'un commit vide..." -ForegroundColor Cyan
    git commit --allow-empty -m "Trigger: Force GitHub Pages deployment"
}

# Push vers GitHub
Write-Host "Push vers GitHub..." -ForegroundColor Cyan
git push origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "Push reussi - Workflow declenche" -ForegroundColor Green
} else {
    Write-Host "Erreur lors du push" -ForegroundColor Red
}

# Etape 5: Instructions finales
Write-Host "\n5. Instructions finales" -ForegroundColor Yellow
Write-Host "=" * 50 -ForegroundColor Gray

Write-Host "\nACTIONS MANUELLES REQUISES:" -ForegroundColor Red
Write-Host "\n1. Verifiez GitHub Pages Settings:" -ForegroundColor White
Write-Host "   URL: $pagesUrl" -ForegroundColor Cyan
Write-Host "   Source doit etre: GitHub Actions" -ForegroundColor Gray
Write-Host "   Cliquez Save si ce n'est pas le cas" -ForegroundColor Gray

Write-Host "\n2. Surveillez le workflow:" -ForegroundColor White
Write-Host "   URL: $actionsUrl" -ForegroundColor Cyan
Write-Host "   Attendez que le workflow se termine (coche verte)" -ForegroundColor Gray
Write-Host "   Verifiez les logs en cas d'erreur" -ForegroundColor Gray

Write-Host "\n3. Verifiez les secrets (si workflow echoue):" -ForegroundColor White
Write-Host "   URL: https://github.com/$owner/$repo/settings/secrets/actions" -ForegroundColor Cyan
Write-Host "   VITE_SUPABASE_URL" -ForegroundColor Gray
Write-Host "   VITE_SUPABASE_ANON_KEY" -ForegroundColor Gray
Write-Host "   VITE_APP_URL" -ForegroundColor Gray

Write-Host "\n4. Attendez 2-5 minutes puis testez:" -ForegroundColor White
Write-Host "   URL: $siteUrl" -ForegroundColor Cyan

Write-Host "\nOUVERTURE AUTOMATIQUE DES PAGES..." -ForegroundColor Green
Start-Sleep 2
Start-Process $pagesUrl
Start-Sleep 1
Start-Process $actionsUrl

Write-Host "\nScript termine!" -ForegroundColor Green
Write-Host "Si le probleme persiste, verifiez les logs du workflow GitHub Actions" -ForegroundColor Yellow

Read-Host "\nAppuyez sur Entree pour continuer"