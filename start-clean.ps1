Write-Host "Arrêt des processus Node en cours..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force

$projDir = "$env:USERPROFILE\Documents\MangooTech\mangootech-platform-complete"
Set-Location $projDir

Write-Host "Démarrage du serveur de développement..." -ForegroundColor Green
try {
  Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit -ExecutionPolicy Bypass -Command cd `"$projDir`"; npm run dev:clean" -WorkingDirectory $projDir
} catch {
  Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit -ExecutionPolicy Bypass -Command cd `"$projDir`"; npm run dev" -WorkingDirectory $projDir
}
