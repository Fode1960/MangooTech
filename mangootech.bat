@echo off
echo === DEMARRAGE MANGOOTECH PLATFORM ===

cd /d "C:\Users\mdans\Documents\MangooTech\mangootech-platform-complete"

echo Etape 1: Nettoyage des processus...
taskkill /F /IM node.exe 2>nul
taskkill /F /IM npm.exe 2>nul
timeout /t 3 /nobreak >nul

echo Etape 2: Demarrage du serveur VoIP...
start /min node api/servers/voip-server.js
echo ✅ Serveur VoIP demarre (port 3035)
timeout /t 3 /nobreak >nul

echo Etape 3: Demarrage du serveur Backend...
start /min node api/server.ts
echo ✅ Serveur Backend demarre (port 3020)
timeout /t 3 /nobreak >nul

echo Etape 4: Demarrage du serveur React...
start /min npm run dev
echo ✅ Serveur React demarre (port 3016)
timeout /t 5 /nobreak >nul

echo.
echo 🎉 TOUS LES SERVEURS SONT DEMARRES !
echo ======================================
echo 📞 Vendeur VoIP : http://localhost:3016/voip-vendor-test
echo 📞 Client VoIP  : http://localhost:3016/voip-client-test
echo ======================================
echo 💡 Laissez cette fenetre ouverte !
echo 🛑 Fermez cette fenetre pour arreter tous les serveurs
echo.
echo Serveurs en cours d'execution...
pause