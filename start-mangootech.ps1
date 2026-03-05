# Script PowerShell de demarrage definitif pour Mangootech Platform
# Ce script demarre tous les serveurs necessaires

Write-Host "🚀 Demarrage de Mangootech Platform..." -ForegroundColor Green

# Definir le repertoire de travail
$workingDir = "C:\Users\mdans\Documents\MangooTech\mangootech-platform-complete"
Set-Location $workingDir

Write-Host "📍 Repertoire de travail: $workingDir" -ForegroundColor Yellow

# Fonction pour tuer un processus sur un port specifique
function Kill-ProcessOnPort($port) {
    Write-Host "🔍 Verification du port $port..." -ForegroundColor Cyan
    $process = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($process) {
        $processId = $process.OwningProcess
        Write-Host "⚠️  Processus trouve sur le port $port (PID: $processId)" -ForegroundColor Red
        try {
            Stop-Process -Id $processId -Force -ErrorAction Stop
            Write-Host "✅ Processus $processId arrete" -ForegroundColor Green
            Start-Sleep -Seconds 2
        } catch {
            Write-Host "❌ Impossible d'arreter le processus $processId" -ForegroundColor Red
        }
    } else {
        Write-Host "✅ Port $port libre" -ForegroundColor Green
    }
}

# Fonction pour demarrer un serveur Node.js
function Start-NodeServer($scriptPath, $port, $serverName) {
    Write-Host "🔄 Demarrage de $serverName sur le port $port..." -ForegroundColor Yellow
    
    # Tuer les processus existants sur ce port
    Kill-ProcessOnPort $port
    
    # Demarrer le serveur
    try {
        $process = Start-Process -FilePath "node" -ArgumentList $scriptPath -NoNewWindow -PassThru -WorkingDirectory $workingDir
        Write-Host "✅ $serverName demarre (PID: $($process.Id))" -ForegroundColor Green
        return $process
    } catch {
        Write-Host "❌ Erreur lors du demarrage de $serverName : $_" -ForegroundColor Red
        return $null
    }
}

# Fonction pour demarrer le serveur React
function Start-ReactServer {
    Write-Host "🔄 Demarrage du serveur React..." -ForegroundColor Yellow
    
    # Tuer les processus sur le port 3016 (React)
    Kill-ProcessOnPort 3016
    
    try {
        $process = Start-Process -FilePath "npm" -ArgumentList "run", "dev" -NoNewWindow -PassThru -WorkingDirectory $workingDir
        Write-Host "✅ Serveur React demarre (PID: $($process.Id))" -ForegroundColor Green
        return $process
    } catch {
        Write-Host "❌ Erreur lors du demarrage du serveur React : $_" -ForegroundColor Red
        return $null
    }
}

# Etape 1 : Nettoyer tous les ports
Write-Host "🧹 Nettoyage des ports..." -ForegroundColor Magenta
Kill-ProcessOnPort 3035  # VoIP Server
Kill-ProcessOnPort 3020  # Backend API
Kill-ProcessOnPort 3016  # React Frontend
Kill-ProcessOnPort 5014  # UDP VoIP
Kill-ProcessOnPort 5015  # RTP VoIP

Start-Sleep -Seconds 3

# Etape 2 : Demarrer le serveur VoIP
Write-Host "🎧 Demarrage du serveur VoIP..." -ForegroundColor Magenta
$voipProcess = Start-NodeServer "api\servers\voip-server.js" 3035 "Serveur VoIP"

Start-Sleep -Seconds 5

# Etape 3 : Demarrer le serveur backend principal
Write-Host "🔧 Demarrage du serveur backend principal..." -ForegroundColor Magenta
$backendProcess = Start-NodeServer "api\server.ts" 3020 "Serveur Backend"

Start-Sleep -Seconds 5

# Etape 4 : Demarrer le serveur React
Write-Host "⚛️ Demarrage du serveur React..." -ForegroundColor Magenta
$reactProcess = Start-ReactServer

# Etape 5 : Afficher les informations
Write-Host "`n🎉 TOUS LES SERVEURS SONT DEMARRES !" -ForegroundColor Green -BackgroundColor Black
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🌐 Frontend React : http://localhost:3016" -ForegroundColor Yellow
Write-Host "🔧 Backend API    : http://localhost:3020" -ForegroundColor Yellow  
Write-Host "🎧 Serveur VoIP   : ws://localhost:3035" -ForegroundColor Yellow
Write-Host "🎵 UDP/RTP VoIP   : udp://localhost:5014" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan

Write-Host "`n🔗 LIENS DE TEST VOIP DIRECTS :" -ForegroundColor Green
Write-Host "📞 Vendeur (8888) : http://localhost:3016/voip-vendor-test" -ForegroundColor White
Write-Host "📞 Client (8889)  : http://localhost:3016/voip-client-test" -ForegroundColor White

Write-Host "`n⚡ Pour arreter tous les serveurs, fermez cette fenetre PowerShell" -ForegroundColor Red
Write-Host "💡 Les serveurs tournent en arriere-plan" -ForegroundColor Gray

# Garder la fenetre ouverte
Write-Host "`n🔄 Serveurs en cours d'execution... Appuyez sur Ctrl+C pour arreter" -ForegroundColor Gray
try {
    while ($true) {
        Start-Sleep -Seconds 10
        
        # Verifier que les processus tournent toujours
        if ($voipProcess -and $voipProcess.HasExited) {
            Write-Host "⚠️  Serveur VoIP arrete ! Redemarrage..." -ForegroundColor Red
            $voipProcess = Start-NodeServer "api\servers\voip-server.js" 3035 "Serveur VoIP"
        }
        
        if ($backendProcess -and $backendProcess.HasExited) {
            Write-Host "⚠️  Serveur Backend arrete ! Redemarrage..." -ForegroundColor Red
            $backendProcess = Start-NodeServer "api\server.ts" 3020 "Serveur Backend"
        }
        
        if ($reactProcess -and $reactProcess.HasExited) {
            Write-Host "⚠️  Serveur React arrete ! Redemarrage..." -ForegroundColor Red
            $reactProcess = Start-ReactServer
        }
    }
} catch {
    Write-Host "`n🛑 Arret des serveurs..." -ForegroundColor Red
    if ($voipProcess) { Stop-Process -Id $voipProcess.Id -Force -ErrorAction SilentlyContinue }
    if ($backendProcess) { Stop-Process -Id $backendProcess.Id -Force -ErrorAction SilentlyContinue }
    if ($reactProcess) { Stop-Process -Id $reactProcess.Id -Force -ErrorAction SilentlyContinue }
}