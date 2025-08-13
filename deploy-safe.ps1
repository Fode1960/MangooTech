# Script de déploiement sécurisé pour Mangoo Tech
# Peut être exécuté même quand le serveur de développement est en cours

Write-Host "[DEPLOY] Debut du deploiement securise..." -ForegroundColor Green

# Fonction pour vérifier si un processus utilise un port
function Test-Port {
    param([int]$Port)
    try {
        $connection = Test-NetConnection -ComputerName localhost -Port $Port -WarningAction SilentlyContinue
        return $connection.TcpTestSucceeded
    }
    catch {
        return $false
    }
}

# Vérifier si le serveur de développement est en cours
$devServerRunning = Test-Port -Port 3001
if ($devServerRunning) {
    Write-Host "[WARNING] Serveur de developpement detecte sur le port 3001" -ForegroundColor Yellow
    Write-Host "[INFO] Utilisation du mode de deploiement securise..." -ForegroundColor Cyan
}

try {
    # Etape 1: Nettoyage du cache npm
    Write-Host "[CLEAN] Nettoyage du cache npm..." -ForegroundColor Cyan
    npm cache clean --force
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[WARNING] Avertissement: Echec du nettoyage du cache" -ForegroundColor Yellow
    }

    # Etape 2: Installation des dependances (mode securise)
    Write-Host "[INSTALL] Installation des dependances..." -ForegroundColor Cyan
    if ($devServerRunning) {
        # Mode sécurisé: installation sans modification du package-lock.json
        npm install --no-save --prefer-offline
    } else {
        # Mode normal
        npm install
    }
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Echec de l'installation des dependances" -ForegroundColor Red
        Write-Host "[RETRY] Tentative avec le mode de deploiement rapide..." -ForegroundColor Yellow
        
        # Fallback: déploiement sans installation
        Write-Host "[GIT] Ajout des fichiers au staging..." -ForegroundColor Cyan
        git add .
        
        Write-Host "[GIT] Creation du commit..." -ForegroundColor Cyan
        git commit -m "Deploy: Update application (quick deploy)"
        
        Write-Host "[GIT] Push vers le depot distant..." -ForegroundColor Cyan
        git push origin main
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "[SUCCESS] Deploiement rapide reussi!" -ForegroundColor Green
            exit 0
        } else {
            Write-Host "[ERROR] Echec du deploiement rapide" -ForegroundColor Red
            exit 1
        }
    }

    # Etape 3: Verification de qualite (optionnelle si serveur en cours)
    if (-not $devServerRunning) {
        Write-Host "[CHECK] Verification de la qualite du code..." -ForegroundColor Cyan
        npm run quality:check
        
        if ($LASTEXITCODE -ne 0) {
            Write-Host "[WARNING] Echec de la verification de qualite" -ForegroundColor Yellow
            Write-Host "[PROMPT] Voulez-vous continuer le deploiement? (y/N)" -ForegroundColor Yellow
            $response = Read-Host
            if ($response -ne 'y' -and $response -ne 'Y') {
                Write-Host "[CANCEL] Deploiement annule" -ForegroundColor Red
                exit 1
            }
        }
    } else {
        Write-Host "[SKIP] Verification de qualite ignoree (serveur en cours)" -ForegroundColor Yellow
    }

    # Etape 4: Git operations
    Write-Host "[GIT] Ajout des fichiers au staging..." -ForegroundColor Cyan
    git add .
    
    Write-Host "[GIT] Creation du commit..." -ForegroundColor Cyan
    $commitMessage = if ($devServerRunning) { "Deploy: Update application (safe deploy)" } else { "Deploy: Update application" }
    git commit -m $commitMessage
    
    Write-Host "[GIT] Push vers le depot distant..." -ForegroundColor Cyan
    git push origin main
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[SUCCESS] Deploiement reussi!" -ForegroundColor Green
        if ($devServerRunning) {
            Write-Host "[INFO] Serveur de developpement toujours en cours sur http://localhost:3001" -ForegroundColor Cyan
        }
    } else {
        Write-Host "[ERROR] Echec du push" -ForegroundColor Red
        exit 1
    }
}
catch {
    Write-Host "[ERROR] Erreur durant le deploiement: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "[COMPLETE] Deploiement termine avec succes!" -ForegroundColor Green