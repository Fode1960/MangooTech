@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"

echo ============================================================
echo   Mangoo Connect+  -  Demarrage Demo (serveur + tunnel)
echo ============================================================
echo.

echo [1/2] Demarrage du serveur local (port 8080)...
start "Mangoo-Serveur" cmd /k "node server.cjs"
timeout /t 3 /nobreak >nul

echo [2/2] Demarrage du tunnel Cloudflare...
start "Mangoo-Tunnel" cmd /k "cloudflared tunnel --config ""%~dp0cloudflared-config.yml"" run mangoo-local-dev"
timeout /t 5 /nobreak >nul

echo.
echo ------------------------------------------------------------
echo   Acces local     : http://localhost:8080
echo   Demo boutique   : https://demo.mangoo.tech/pages/fiche-boutique.html
echo   Suivi livraison : https://demo.mangoo.tech/pages/delivery-track.html
echo   Dashboard pro   : https://preview.mangoo.tech/pages/dashboard-overview.html
echo   Console admin   : https://admin.mangoo.tech/pages/admin.html
echo ------------------------------------------------------------
echo.
echo Les deux fenetres (Serveur et Tunnel) restent ouvertes.
echo Fermez-les pour arreter la demo.
echo.
pause
