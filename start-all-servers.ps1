# Script de démarrage pour les serveurs MangooTech WebRTC

# Définir les couleurs pour les logs
$RED = "\033[31m"
$GREEN = "\033[32m"
$YELLOW = "\033[33m"
$BLUE = "\033[34m"
$MAGENTA = "\033[35m"
$CYAN = "\033[36m"
$RESET = "\033[0m"

Write-Host "${CYAN}🚀 Démarrage des serveurs MangooTech WebRTC...${RESET}" -ForegroundColor Cyan

# Fonction pour démarrer un serveur
function Start-Server {
    param(
        [string]$Name,
        [string]$Command,
        [string]$Port,
        [string]$Color
    )
    
    Write-Host "${Color}📡 Démarrage $Name sur le port $Port...${RESET}" -ForegroundColor $Color
    
    try {
        Start-Process -FilePath "node" -ArgumentList $Command -NoNewWindow -PassThru
        Start-Sleep -Seconds 2
        Write-Host "${GREEN}✅ $Name démarré avec succès sur le port $Port${RESET}" -ForegroundColor Green
    }
    catch {
        Write-Host "${RED}❌ Erreur lors du démarrage de $Name : $($_.Exception.Message)${RESET}" -ForegroundColor Red
    }
}

# Arrêter les processus existants sur les ports
Write-Host "${YELLOW}🧹 Nettoyage des ports...${RESET}" -ForegroundColor Yellow

$ports = @("3007", "3008", "3015")
foreach ($port in $ports) {
    $processes = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    foreach ($process in $processes) {
        try {
            Stop-Process -Id $process.OwningProcess -Force -ErrorAction SilentlyContinue
            Write-Host "${YELLOW}🛑 Processus arrêté sur le port $port${RESET}" -ForegroundColor Yellow
        }
        catch {
            Write-Host "${RED}❌ Impossible d'arrêter le processus sur le port $port${RESET}" -ForegroundColor Red
        }
    }
}

# Démarrer les serveurs
Write-Host "${CYAN}🌐 Démarrage des serveurs en parallèle...${RESET}" -ForegroundColor Cyan

# Serveur de chat Live Shopping (3007)
Start-Server -Name "Serveur Chat Live Shopping" -Command "api/servers/live-shopping-chat-server.js" -Port "3007" -Color "Blue"

# Serveur WebSocket WebRTC (3008)
Start-Server -Name "Serveur WebSocket WebRTC" -Command "api/servers/webrtc-websocket-server-3008.js" -Port "3008" -Color "Magenta"

# Application React (3015)
Start-Server -Name "Application React" -Command "node_modules/.bin/vite --port 3015" -Port "3015" -Color "Green"

Write-Host "${GREEN}🎉 Tous les serveurs ont été démarrés !${RESET}" -ForegroundColor Green
Write-Host "${CYAN}📋 Résumé des URLs:${RESET}" -ForegroundColor Cyan
Write-Host "${BLUE}  • Chat Live Shopping: ws://localhost:3007${RESET}" -ForegroundColor Blue
Write-Host "${MAGENTA}  • WebSocket WebRTC: ws://localhost:3008${RESET}" -ForegroundColor Magenta
Write-Host "${GREEN}  • Application React: http://localhost:3015${RESET}" -ForegroundColor Green
Write-Host "${YELLOW}🔗 URLs de test:${RESET}" -ForegroundColor Yellow
Write-Host "  • Vendeur: http://localhost:3015/live-shopping-vendor-test${RESET}"
Write-Host "  • Client: http://localhost:3015/live-shopping-client-test${RESET}"

Write-Host "${CYAN}⏹️  Pour arrêter tous les serveurs, appuyez sur Ctrl+C${RESET}" -ForegroundColor Cyan

# Garder le script actif
while ($true) {
    Start-Sleep -Seconds 1
}