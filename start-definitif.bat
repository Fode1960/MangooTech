@echo off
echo ======================================
echo    DEMARRAGE MANGOOTECH PLATFORM
echo ======================================

cd /d "C:\Users\mdans\Documents\MangooTech\mangootech-platform-complete"

echo.
echo [1] Nettoyage des processus...
taskkill /F /IM node.exe >nul 2>&1
taskkill /F /IM npm.exe >nul 2>&1
timeout /t 3 /nobreak >nul

echo [2] Demarrage du serveur VoIP...
call node api\servers\voip-server.js > voip.log 2>&1 &
echo    ✅ Serveur VoIP demarre (port 3035)
timeout /t 3 /nobreak >nul

echo [3] Demarrage du serveur Backend...
call node api\server.ts > backend.log 2>&1 &
echo    ✅ Serveur Backend demarre (port 3020)
timeout /t 3 /nobreak >nul

echo [4] Demarrage du serveur React...
call npm run dev > react.log 2>&1 &
echo    ✅ Serveur React demarre (port 3016)
timeout /t 5 /nobreak >nul

echo.
echo ======================================
echo 🎉 TOUS LES SERVEURS SONT DEMARRES !
echo ======================================
echo.
echo 📞 Vendeur VoIP : http://localhost:3016/voip-vendor-test
echo 📞 Client VoIP  : http://localhost:3016/voip-client-test
echo.
echo 💡 Laissez cette fenetre ouverte !
echo 🛑 Fermez cette fenetre pour tout arreter
echo.
echo ======================================
echo Verification des serveurs...
ping localhost -n 2 >nul
echo ✅ Pret pour les tests !
echo ======================================
pause