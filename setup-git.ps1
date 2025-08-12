# Script d'initialisation Git pour MangooTech
# Ce script configure le repository Git et le connecte a GitHub

$ErrorActionPreference = "Stop"

Write-Host "Configuration Git pour MangooTech..." -ForegroundColor Green

try {
    # Verifier si Git est installe
    $gitVersion = git --version 2>$null
    if (-not $gitVersion) {
        throw "Git n'est pas installe. Veuillez installer Git d'abord."
    }
    Write-Host "Git detecte: $gitVersion" -ForegroundColor Green

    # Verifier si nous sommes deja dans un repository Git
    if (Test-Path ".git") {
        Write-Host "Repository Git deja initialise" -ForegroundColor Yellow
        
        # Verifier la remote origin
        $remoteUrl = git remote get-url origin 2>$null
        if ($remoteUrl) {
            Write-Host "Remote origin configuree: $remoteUrl" -ForegroundColor Blue
        } else {
            Write-Host "Aucune remote origin configuree" -ForegroundColor Yellow
            $addRemote = Read-Host "Voulez-vous ajouter la remote GitHub? (y/N)"
            if ($addRemote -match "^[Yy]$") {
                git remote add origin https://github.com/Fode1960/MangooTech.git
                Write-Host "Remote origin ajoutee" -ForegroundColor Green
            }
        }
    } else {
        Write-Host "Initialisation du repository Git..." -ForegroundColor Cyan
        
        # Initialiser le repository
        git init
        Write-Host "Repository Git initialise" -ForegroundColor Green
        
        # Configurer la branche principale
        git branch -M main
        Write-Host "Branche principale configuree (main)" -ForegroundColor Green
        
        # Ajouter la remote origin
        git remote add origin https://github.com/Fode1960/MangooTech.git
        Write-Host "Remote origin ajoutee" -ForegroundColor Green
    }

    # Verifier la configuration utilisateur Git
    $userName = git config user.name 2>$null
    $userEmail = git config user.email 2>$null
    
    if (-not $userName -or -not $userEmail) {
        Write-Host "Configuration utilisateur Git manquante" -ForegroundColor Yellow
        
        if (-not $userName) {
            $name = Read-Host "Entrez votre nom pour Git"
            git config user.name "$name"
            Write-Host "Nom configure: $name" -ForegroundColor Green
        }
        
        if (-not $userEmail) {
            $email = Read-Host "Entrez votre email pour Git"
            git config user.email "$email"
            Write-Host "Email configure: $email" -ForegroundColor Green
        }
    } else {
        Write-Host "Configuration utilisateur: $userName ($userEmail)" -ForegroundColor Green
    }

    # Ajouter tous les fichiers
    Write-Host "Ajout des fichiers au repository..." -ForegroundColor Cyan
    git add .
    
    # Verifier s'il y a des changements a committer
    $status = git status --porcelain
    if ($status) {
        Write-Host "Commit initial..." -ForegroundColor Cyan
        git commit -m "Initial commit: MangooTech application with deployment setup"
        Write-Host "Commit initial cree" -ForegroundColor Green
        
        # Proposer de pousser vers GitHub
        $pushToGitHub = Read-Host "Voulez-vous pousser vers GitHub maintenant? (y/N)"
        if ($pushToGitHub -match "^[Yy]$") {
            Write-Host "Push vers GitHub..." -ForegroundColor Cyan
            git push -u origin main
            if ($LASTEXITCODE -eq 0) {
                Write-Host "Push reussi!" -ForegroundColor Green
                Write-Host "Repository disponible a: https://github.com/Fode1960/MangooTech" -ForegroundColor Blue
                Write-Host "Le deploiement automatique va commencer sur GitHub Pages" -ForegroundColor Blue
            } else {
                Write-Host "Erreur lors du push. Verifiez vos permissions GitHub." -ForegroundColor Red
            }
        }
    } else {
        Write-Host "Aucun changement a committer" -ForegroundColor Yellow
    }

    Write-Host "" 
    Write-Host "Configuration Git terminee!" -ForegroundColor Green
    Write-Host "" 
    Write-Host "Prochaines etapes:" -ForegroundColor Yellow
    Write-Host "1. Assurez-vous que le repository GitHub existe: https://github.com/Fode1960/MangooTech" -ForegroundColor White
    Write-Host "2. Configurez GitHub Pages dans les parametres du repository" -ForegroundColor White
    Write-Host "3. Utilisez './deploy.ps1' pour les deploiements futurs" -ForegroundColor White
    Write-Host "" 

} catch {
    Write-Host "Erreur: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}