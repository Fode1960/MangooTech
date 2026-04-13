# Arrêt propre et redémarrage du serveur de développement MangooTech
$ErrorActionPreference = 'SilentlyContinue'

# Ports à libérer
$ports = @(3009, 3005, 3015, 3045)
Write-Host "Liberation des ports: $($ports -join ', ')" -ForegroundColor Yellow

foreach ($p in $ports) {
  $conns = Get-NetTCPConnection -State Listen -LocalPort $p
  foreach ($c in $conns) {
    try {
      $pid = $c.OwningProcess
      Write-Host "Arret du processus PID $pid sur le port $p" -ForegroundColor Cyan
      Stop-Process -Id $pid -Force
    } catch {
      Write-Host "Impossible d'arreter PID $pid sur port $p" -ForegroundColor Red
    }
  }
}

# Aller dans le dossier du projet
Set-Location (Split-Path -Parent $MyInvocation.MyCommand.Path)
Write-Host "Dossier projet: $(Get-Location)" -ForegroundColor Green

# Démarrer le serveur de développement
Write-Host "Demarrage: npm run dev" -ForegroundColor Green
npm run dev
