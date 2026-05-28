@echo off
echo ======================================
echo    VERIFICATION MANGOOTECH SERVEURS
echo ======================================

cd /d "C:\Users\mdans\Documents\MangooTech\mangootech-platform-complete"

echo.
echo 1. NETTOYAGE...
taskkill /F /IM node.exe 2>nul
taskkill /F /IM npm.exe 2>nul
timeout /t 2 /nobreak >nul

echo.
echo 2. VERIFICATION DES FICHIERS...
echo    📁 VoIP Server: api\servers\voip-server.js
if exist "api\servers\voip-server.js" (
    echo    ✅ Fichier VoIP trouve
) else (
    echo    ❌ Fichier VoIP manquant
)

echo    📁 Backend Server: api\server.ts
if exist "api\server.ts" (
    echo    ✅ Fichier Backend trouve
) else (
    echo    ❌ Fichier Backend manquant
)

echo    📁 Package.json: package.json
if exist "package.json" (
    echo    ✅ Package.json trouve
) else (
    echo    ❌ Package.json manquant
)

echo.
echo 3. INSTALLATION RAPIDE...
call npm install --silent >nul 2>&1
if %errorlevel% equ 0 (
    echo    ✅ Dependances installees
) else (
    echo    ⚠️  Erreur installation (mais on continue)
)

echo.
echo 4. DEMARRAGE DES SERVEURS...

echo    📞 VoIP Server (port 3035)...
start "VoIP Server" cmd /k "node api\servers\voip-server.js || echo ❌ Erreur VoIP && pause"
timeout /t 4 /nobreak >nul

echo    🔧 Backend Server (port 3020)...
start "Backend Server" cmd /k "node api\server.ts || echo ❌ Erreur Backend && pause"
timeout /t 4 /nobreak >nul

echo    🌐 React Server (port 3016)...
start "React Server" cmd /k "npm run dev || echo ❌ Erreur React && pause"
timeout /t 6 /nobreak >nul

echo.
echo 5. VERIFICATION DES PORTS...
echo.
echo 📊 ETAT DES PORTS:
netstat -an | findstr :3016 && echo ✅ Port 3016 ACTIF || echo ❌ Port 3016 INACTIF
echo.
netstat -an | findstr :3020 && echo ✅ Port 3020 ACTIF || echo ❌ Port 3020 INACTIF
echo.
netstat -an | findstr :3035 && echo ✅ Port 3035 ACTIF || echo ❌ Port 3035 INACTIF

echo.
echo ======================================
echo 🎯 LIENS DE TEST:
echo    Vendeur: http://localhost:3016/voip-vendor-test
echo    Client:  http://localhost:3016/voip-client-test
echo ======================================
echo.
echo 💡 ATTENDEZ 10 SECONDES AVANT DE TESTER
echo 🛑 Fermez cette fenetre pour tout arreter
echo.
pause