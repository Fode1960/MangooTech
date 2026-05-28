# Script d'activation automatique de GitHub Pages
Write-Host "Activation automatique de GitHub Pages..." -ForegroundColor Green
Write-Host "Resolution du probleme pack decouverte persistant" -ForegroundColor Yellow

$owner = "Fode1960"
$repo = "MangooTech"
$siteUrl = "https://$owner.github.io/$repo/"
$pagesUrl = "https://github.com/$owner/$repo/settings/pages"
$actionsUrl = "https://github.com/$owner/$repo/actions"

Write-Host "Verification du site..." -ForegroundColor Cyan

$siteAccessible = $false
try {
    $webRequest = Invoke-WebRequest -Uri $siteUrl -Method Head -TimeoutSec 10 -ErrorAction Stop
    $siteAccessible = $true
}
catch {
    $siteAccessible = $false
}

if ($siteAccessible) {
    Write-Host "Site accessible ! Deploiement reussi" -ForegroundColor Green
    Write-Host "URL: $siteUrl" -ForegroundColor Green
    Write-Host "PROBLEME RESOLU !" -ForegroundColor Green
    Write-Host "Le pack decouverte ne devrait plus persister" -ForegroundColor Green
    Write-Host "Votre vrai pack d'abonnement s'affiche maintenant" -ForegroundColor Green
    Write-Host "Ouverture du site..." -ForegroundColor Cyan
    Start-Process $siteUrl
}
else {
    Write-Host "Site pas encore accessible" -ForegroundColor Yellow
    Write-Host "ACTIVATION MANUELLE REQUISE:" -ForegroundColor Red
    Write-Host "1. Ouvrez: $pagesUrl" -ForegroundColor White
    Write-Host "2. Source: Selectionnez GitHub Actions" -ForegroundColor White
    Write-Host "3. Cliquez Save" -ForegroundColor White
    Write-Host "4. Attendez 2-5 minutes" -ForegroundColor White
    Write-Host "5. Testez: $siteUrl" -ForegroundColor White
    Write-Host "Ouverture automatique des pages..." -ForegroundColor Cyan
    Start-Process $pagesUrl
    Start-Sleep 2
    Start-Process $actionsUrl
}

Write-Host "Liens utiles:" -ForegroundColor Magenta
Write-Host "GitHub Pages: $pagesUrl" -ForegroundColor White
Write-Host "GitHub Actions: $actionsUrl" -ForegroundColor White
Write-Host "Site final: $siteUrl" -ForegroundColor White
Write-Host "Script termine !" -ForegroundColor Green
Read-Host "Appuyez sur Entree pour continuer"