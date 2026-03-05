# Script de démarrage rapide MangooTech
# Ce script démarre automatiquement le serveur de développement

Write-Host "🚀 Démarrage MangooTech Platform" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green

# Se placer dans le bon dossier
$projectPath = "C:\Users\mdans\Documents\MangooTech\mangootech-platform-complete"

if (Test-Path $projectPath) {
    Write-Host "✅ Dossier projet trouvé" -ForegroundColor Green
    Set-Location $projectPath
} else {
    Write-Host "❌ Dossier projet non trouvé" -ForegroundColor Red
    Write-Host "Chemin attendu: $projectPath" -ForegroundColor Yellow
    Read-Host "Appuyez sur Entrée pour quitter"
    exit 1
}

# Libérer les ports s'ils sont occupés
Write-Host "🔧 Libération des ports..." -ForegroundColor Yellow
$ports = @(3009, 3015, 3005)
foreach ($port in $ports) {
    $process = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($process) {
        Write-Host "   Fermeture du processus sur le port $port" -ForegroundColor Yellow
        Stop-Process -Id $process.OwningProcess -Force -ErrorAction SilentlyContinue
    }
}

# Attendre un peu pour que les ports soient libérés
Start-Sleep -Seconds 2

# Démarrer le serveur
Write-Host "🌐 Démarrage du serveur de développement..." -ForegroundColor Green
Write-Host "   Cela peut prendre 30-60 secondes..." -ForegroundColor Gray

# Lancer npm run dev
npm run dev

Write-Host "" -ForegroundColor White
Write-Host "🎯 Accès à l'application:" -ForegroundColor Green
Write-Host "   Interface Web: http://localhost:3015/" -ForegroundColor Cyan
Write-Host "   API Backend: http://localhost:3009/api/health" -ForegroundColor Cyan
Write-Host "" -ForegroundColor White
Write-Host "💡 Pour arrêter le serveur: Ctrl+C" -ForegroundColor Yellow
Write-Host "💡 Pour redémarrer: Fermer cette fenêtre et relancer le raccourci" -ForegroundColor Yellow

Read-Host "Appuyez sur Entrée pour quitter"