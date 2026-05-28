@echo off
echo === DEMARRAGE MANGOOTECH ===

cd /d "C:\Users\mdans\Documents\MangooTech\mangootech-platform-complete"

echo.
echo 1. Arret des processus...
taskkill /F /IM node.exe 2>nul
taskkill /F /IM npm.exe 2>nul
timeout /t 2 /nobreak >nul

echo.
echo 2. Serveur VoIP (port 3035)...
start "VoIP Server" node api\servers\voip-server.js
timeout /t 3 /nobreak >nul

echo.
echo 3. Serveur Backend (port 3020)...
start "Backend Server" node api\server.ts
timeout /t 3 /nobreak >nul

echo.
echo 4. Serveur React (port 3016)...
start "React Server" npm run dev
timeout /t 5 /nobreak >nul

echo.
echo ======================================
echo ✅ TOUS LES SERVEURS DEMARRES !
echo ======================================
echo.
echo 📞 LIENS DE TEST:
echo    Vendeur: http://localhost:3016/voip-vendor-test
echo    Client:  http://localhost:3016/voip-client-test
echo.
echo 💡 Laissez cette fenetre ouverte
echo 🛑 Fermez pour arreter tout
echo.
pause