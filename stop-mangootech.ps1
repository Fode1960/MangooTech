# Script PowerShell d'arrêt pour Mangootech Platform
# Ce script arrête proprement tous les serveurs

Write-Host "🛑 Arrêt de Mangootech Platform..." -ForegroundColor Red

# Fonction pour tuer les processus sur un port spécifique
function Kill-ProcessOnPort($port) {
    Write-Host "🔍 Recherche de processus sur le port $port..." -ForegroundColor Yellow
    $process = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($process) {
        $processId = $process.OwningProcess
        Write-Host "⚠️  Processus trouvé sur le port $port (PID: $processId)" -ForegroundColor Red
        try {
            Stop-Process -Id $processId -Force -ErrorAction Stop
            Write-Host "✅ Processus $processId arrêté" -ForegroundColor Green
        } catch {
            Write-Host "❌ Impossible d'arrêter le processus $processId" -ForegroundColor Red
        }
    } else {
        Write-Host "✅ Port $port déjà libre" -ForegroundColor Green
    }
}

# Tuer tous les processus Node.js et npm
Write-Host "🧹 Nettoyage des processus Node.js..." -ForegroundColor Magenta
Get-Process -Name "node" -ErrorAction SilentlyContinue | ForEach-Object {
    try {
        Stop-Process -Id $_.Id -Force -ErrorAction Stop
        Write-Host "✅ Processus Node.js $($_.Id) arrêté" -ForegroundColor Green
    } catch {
        Write-Host "❌ Impossible d'arrêter le processus Node.js $($_.Id)" -ForegroundColor Red
    }
}

Get-Process -Name "npm" -ErrorAction SilentlyContinue | ForEach-Object {
    try {
        Stop-Process -Id $_.Id -Force -ErrorAction Stop
        Write-Host "✅ Processus npm $($_.Id) arrêté" -ForegroundColor Green
    } catch {
        Write-Host "❌ Impossible d'arrêter le processus npm $($_.Id)" -ForegroundColor Red
    }
}

# Nettoyer les ports spécifiques
Write-Host "🧹 Nettoyage des ports..." -ForegroundColor Magenta
Kill-ProcessOnPort 3035  # VoIP Server
Kill-ProcessOnPort 3020  # Backend API  
Kill-ProcessOnPort 3016  # React Frontend
Kill-ProcessOnPort 5014  # UDP VoIP
Kill-ProcessOnPort 5015  # RTP VoIP

Write-Host "`n✅ TOUS LES SERVEURS SONT ARRÊTÉS !" -ForegroundColor Green
Write-Host "🎯 Mangootech Platform est maintenant arrêté" -ForegroundColor White