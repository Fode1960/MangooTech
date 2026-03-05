@echo off
echo ======================================
echo    DEMARRAGE IMMEDIAT MANGOOTECH
echo ======================================

cd /d "C:\Users\mdans\Documents\MangooTech\mangootech-platform-complete"

echo.
echo 1. NETTOYAGE COMPLET...
taskkill /F /IM node.exe 2>nul
taskkill /F /IM npm.exe 2>nul
timeout /t 3 /nobreak >nul

echo.
echo 2. INSTALLATION DEPENDANCES...
call npm install
echo ✅ Dependances installees

echo.
echo 3. DEMARRAGE DES SERVEURS...

echo    📞 Serveur VoIP (port 3035)...
start "VoIP Server" cmd /k "node api\servers\voip-server.js"
timeout /t 5 /nobreak >nul

echo    🔧 Serveur Backend (port 3020)...
start "Backend Server" cmd /k "node api\server.ts"
timeout /t 5 /nobreak >nul

echo    🌐 Serveur React (port 3016)...
start "React Server" cmd /k "npm run dev"
timeout /t 8 /nobreak >nul

echo.
echo ======================================
echo ✅ TOUS LES SERVEURS DEMARRES !
echo ======================================
echo.
echo 📞 LIENS DE TEST VOIP:
echo    Vendeur: http://localhost:3016/voip-vendor-test
echo    Client:  http://localhost:3016/voip-client-test
echo.
echo 💡 ATTENDEZ 10 SECONDES POUR CHARGEMENT COMPLET
echo 🛑 Fermez cette fenetre pour tout arreter
echo.
echo ======================================
echo VERIFICATION DES PORTS...
echo.
netstat -an | findstr :3016
echo.
netstat -an | findstr :3020
echo.
netstat -an | findstr :3035
echo.
echo ✅ PRET POUR LES TESTS !
echo ======================================
pause