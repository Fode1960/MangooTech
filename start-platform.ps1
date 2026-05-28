# Script de démarrage de la Plateforme MangooTech
# Utilise http-server pour servir les fichiers statiques

Write-Host "Démarrage de la Plateforme MangooTech..." -ForegroundColor Green
Write-Host "Le serveur va démarrer sur le port 3025." -ForegroundColor Yellow

# Vérifier si http-server est installé
if (Get-Command "http-server" -ErrorAction SilentlyContinue) {
    Write-Host "Lancement du serveur..."
    # Démarrer http-server en arrière-plan et ouvrir le navigateur
    Start-Process "http-server" -ArgumentList ". -p 3025 -c-1 -o" -NoNewWindow
} else {
    # Essayer avec npx si http-server n'est pas dans le PATH
    Write-Host "http-server non trouvé dans le PATH, essai avec npx..."
    Start-Process "npx" -ArgumentList "http-server . -p 3025 -c-1 -o" -NoNewWindow
}

Write-Host "Plateforme accessible à l'adresse : http://localhost:3025" -ForegroundColor Cyan
Write-Host "Appuyez sur une touche pour fermer cette fenêtre (le serveur continuera de tourner)..."
Read-Host