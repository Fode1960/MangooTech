# Script simple de demarrage - VERSION ULTRA STABLE
Write-Host "=== DEMARRAGE MANGOOTECH PLATFORM ===" -ForegroundColor Green

# Aller dans le bon repertoire
cd "C:\Users\mdans\Documents\MangooTech\mangootech-platform-complete"

Write-Host "Etape 1: Nettoyage des ports..." -ForegroundColor Yellow

# Tuer tous les processus Node.js existants
taskkill /F /IM node.exe 2>$null
taskkill /F /IM npm.exe 2>$null

Start-Sleep 3

Write-Host "Etape 2: Demarrage des serveurs..." -ForegroundColor Yellow

# Demarrer le serveur VoIP
Start-Process -FilePath "node" -ArgumentList "api/servers/voip-server.js" -NoNewWindow
Write-Host "✅ Serveur VoIP demarre (port 3035)" -ForegroundColor Green

Start-Sleep 3

# Demarrer le serveur backend
Start-Process -FilePath "node" -ArgumentList "api/server.ts" -NoNewWindow  
Write-Host "✅ Serveur Backend demarre (port 3020)" -ForegroundColor Green

Start-Sleep 3

# Demarrer le serveur React
Start-Process -FilePath "npm" -ArgumentList "run","dev" -NoNewWindow
Write-Host "✅ Serveur React demarre (port 3016)" -ForegroundColor Green

Write-Host "`n🎉 TOUS LES SERVEURS SONT DEMARRES !" -ForegroundColor Green
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host "📞 Vendeur VoIP : http://localhost:3016/voip-vendor-test" -ForegroundColor White
Write-Host "📞 Client VoIP  : http://localhost:3016/voip-client-test" -ForegroundColor White
Write-Host "`n💡 Laissez cette fenetre ouverte !" -ForegroundColor Gray
Write-Host "🛑 Ctrl+C pour arreter tous les serveurs" -ForegroundColor Red

# Garder la fenetre ouverte
while ($true) {
    Start-Sleep 10
}