# Script de correction exhaustive - Remplacer tous les 3002 par 3001
Write-Host "🚀 Script de correction exhaustive du port 3001 → 3001" -ForegroundColor Green
Write-Host "=" * 60 -ForegroundColor Green

# Fichiers à exclure
$excludedFiles = @(
    "package-lock.json",
    "node_modules\*",
    "*.log"
)

# Extensions de fichiers à traiter
$fileExtensions = @(".js", ".ts", ".jsx", ".tsx", ".ps1", ".md", ".html", ".sql")

# Compteur de modifications
$totalFilesModified = 0
$totalReplacements = 0

function Update-FileContent {
    param(
        [string]$filePath,
        [string]$description
    )
    
    try {
        $content = Get-Content $filePath -Raw -ErrorAction Stop
        $originalContent = $content
        
        # Remplacements spécifiques selon le type de fichier
        $replacements = 0
        
        # Remplacements généraux
        if ($content -match 'localhost:3001') {
            $content = $content -replace 'localhost:3001', 'localhost:3001'
            $replacements++
        }
        
        if ($content -match '127\.0\.0\.1:3001') {
            $content = $content -replace '127\.0\.0\.1:3001', '127.0.0.1:3001'
            $replacements++
        }
        
        if ($content -match ':3001') {
            $content = $content -replace ':3001', ':3001'
            $replacements++
        }
        
        # Remplacements spécifiques pour les URLs
        if ($content -match 'http://localhost:3001') {
            $content = $content -replace 'http://localhost:3001', 'http://localhost:3001'
            $replacements++
        }
        
        if ($content -match 'https://localhost:3001') {
            $content = $content -replace 'https://localhost:3001', 'https://localhost:3001'
            $replacements++
        }
        
        # Pour les fichiers .env et configuration
        if ($content -match 'FRONTEND_URL=http://localhost:3001') {
            $content = $content -replace 'FRONTEND_URL=http://localhost:3001', 'FRONTEND_URL=http://localhost:3001'
            $replacements++
        }
        
        if ($content -match 'site_url = "http://127\.0\.0\.1:3001"') {
            $content = $content -replace 'site_url = "http://127\.0\.0\.1:3001"', 'site_url = "http://127.0.0.1:3001"'
            $replacements++
        }
        
        if ($content -match 'additional_redirect_urls = \["https://127\.0\.0\.1:3001"\]') {
            $content = $content -replace 'additional_redirect_urls = \["https://127\.0\.0\.1:3001"\]', 'additional_redirect_urls = ["https://127.0.0.1:3001"]'
            $replacements++
        }
        
        # Messages de test et logs
        if ($content -match 'Port 3001') {
            $content = $content -replace 'Port 3001', 'Port 3001'
            $replacements++
        }
        
        if ($content -match 'port 3001') {
            $content = $content -replace 'port 3001', 'port 3001'
            $replacements++
        }
        
        if ($content -match '3001 détecté') {
            $content = $content -replace '3001 détecté', '3001 détecté'
            $replacements++
        }
        
        if ($content -match '3001 configuré') {
            $content = $content -replace '3001 configuré', '3001 configuré'
            $replacements++
        }
        
        # Commentaires et documentation
        if ($content -match 'Vérifiez que les URLs utilisent bien le port 3001') {
            $content = $content -replace 'Vérifiez que les URLs utilisent bien le port 3001', 'Vérifiez que les URLs utilisent bien le port 3001'
            $replacements++
        }
        
        if ($content -match 'localhost:3001\)') {
            $content = $content -replace 'localhost:3001\)', 'localhost:3001)'
            $replacements++
        }
        
        if ($content -match '3002\) au lieu de 3001') {
            $content = $content -replace '3002\) au lieu de 3001', '3001) au lieu de 3002'
            $replacements++
        }
        
        if ($replacements -gt 0 -and $content -ne $originalContent) {
            Set-Content $filePath $content -NoNewline -ErrorAction Stop
            Write-Host "✅ $description - $replacements remplacements effectués" -ForegroundColor Green
            return $replacements
        }
        
        return 0
    }
    catch {
        Write-Host "❌ Erreur lors du traitement de $description : $($_.Exception.Message)" -ForegroundColor Red
        return 0
    }
}

# Traiter les fichiers critiques
Write-Host "📁 Traitement des fichiers critiques..." -ForegroundColor Yellow

# 1. Scripts PowerShell
$ps1Files = @(
    "force-port-3002.ps1",
    "fix-redirection-urgence.ps1"
)

foreach ($file in $ps1Files) {
    $filePath = Join-Path $PSScriptRoot $file
    if (Test-Path $filePath) {
        $replacements = Update-FileContent $filePath "Script PowerShell: $file"
        if ($replacements -gt 0) {
            $totalFilesModified++
            $totalReplacements += $replacements
        }
    }
}

# 2. Scripts de test JavaScript
$jsTestFiles = @(
    "test-stripe-urls.js",
    "test-edge-function-urls.js",
    "test-url-redirection-fix.js",
    "test-paiement-redirection.js",
    "test-frontend-url-fix.js",
    "test-redirection-debug.js",
    "test-stripe-urls-simple.js",
    "test-edge-function-simple.js",
    "test-pack-change-complet.js",
    "test-checkout-function.js",
    "test-application-pack.js",
    "test-manuel-paiement.js",
    "diagnostic-url-malformee.js",
    "fix-port-redirection.js"
)

foreach ($file in $jsTestFiles) {
    $filePath = Join-Path $PSScriptRoot $file
    if (Test-Path $filePath) {
        $replacements = Update-FileContent $filePath "Script de test: $file"
        if ($replacements -gt 0) {
            $totalFilesModified++
            $totalReplacements += $replacements
        }
    }
}

# 3. Fichiers HTML
$htmlFiles = @(
    "force-correct-port.html",
    "pack-sync-resolver.html",
    "test-fix.html",
    "ultimate-port-fix.html",
    "test-production-pack-fix.html"
)

foreach ($file in $htmlFiles) {
    $filePath = Join-Path $PSScriptRoot $file
    if (Test-Path $filePath) {
        $replacements = Update-FileContent $filePath "Fichier HTML: $file"
        if ($replacements -gt 0) {
            $totalFilesModified++
            $totalReplacements += $replacements
        }
    }
}

# 4. Fichiers SQL
$sqlFiles = @(
    "correction-url-edge-functions.sql"
)

foreach ($file in $sqlFiles) {
    $filePath = Join-Path $PSScriptRoot $file
    if (Test-Path $filePath) {
        $replacements = Update-FileContent $filePath "Fichier SQL: $file"
        if ($replacements -gt 0) {
            $totalFilesModified++
            $totalReplacements += $replacements
        }
    }
}

# 5. Fichiers de configuration Supabase
$supabaseFiles = @(
    "supabase\functions\create-checkout-session\index.ts",
    "supabase\functions\handle-subscription-change\index.ts",
    "supabase\functions\test-checkout\index.ts",
    "supabase\config.toml"
)

foreach ($file in $supabaseFiles) {
    $filePath = Join-Path $PSScriptRoot $file
    if (Test-Path $filePath) {
        $replacements = Update-FileContent $filePath "Configuration Supabase: $file"
        if ($replacements -gt 0) {
            $totalFilesModified++
            $totalReplacements += $replacements
        }
    }
}

# 6. Guides Markdown
$mdFiles = @(
    "GUIDE-REDEMARRAGE-SUPABASE.md",
    "GUIDE-FINAL-TESTS-PACK.md",
    "GUIDE-DIAGNOSTIC-PACK.md",
    "GUIDE-TEST-REDIRECTION-MANUEL.md",
    "test-manuel-paiement.md",
    "SOLUTION-FINALE-PACK-DECOUVERTE.md",
    "SOLUTION-URL-MALFORMEE-PACK-DECOUVERTE.md"
)

foreach ($file in $mdFiles) {
    $filePath = Join-Path $PSScriptRoot $file
    if (Test-Path $filePath) {
        $replacements = Update-FileContent $filePath "Guide: $file"
        if ($replacements -gt 0) {
            $totalFilesModified++
            $totalReplacements += $replacements
        }
    }
}

# Résumé final
Write-Host ""
Write-Host "=" * 60 -ForegroundColor Green
Write-Host "🏁 RÉSUMÉ DES MODIFICATIONS" -ForegroundColor Green
Write-Host "=" * 60 -ForegroundColor Green
Write-Host ""
Write-Host "📄 Fichiers modifiés : $totalFilesModified" -ForegroundColor Cyan
Write-Host "🔢 Remplacements totaux : $totalReplacements" -ForegroundColor Cyan
Write-Host ""

if ($totalFilesModified -gt 0) {
    Write-Host "✅ Correction terminée avec succès !" -ForegroundColor Green
    Write-Host ""
    Write-Host "🔧 Prochaines étapes :" -ForegroundColor Yellow
    Write-Host "   1. Redémarrez votre serveur de développement : npm run dev" -ForegroundColor White
    Write-Host "   2. Vérifiez que l'application utilise bien le port 3001" -ForegroundColor White
    Write-Host "   3. Testez les fonctionnalités de paiement" -ForegroundColor White
    Write-Host "   4. Redéployez les Edge Functions si nécessaire" -ForegroundColor White
} else {
    Write-Host "ℹ️  Aucune modification nécessaire - tous les fichiers utilisent déjà le port 3001" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Appuyez sur une touche pour terminer..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')