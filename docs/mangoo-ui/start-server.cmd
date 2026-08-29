@echo off
rem =========================================================
rem  Mangoo Connect+ — lancement du serveur temps réel
rem  (nouvelle version HTML : pages statiques + signalisation)
rem  Double-cliquez ce fichier, puis ouvrez les liens affichés.
rem =========================================================
cd /d "%~dp0"
echo Demarrage de Mangoo Connect+ ...
echo.
node server.cjs
echo.
echo Serveur arrete.
pause
