# Script de Déploiement Sécurisé avec Version Lock
# Ce script vérifie la conformité avant le déploiement

param(
    [string]$Environment = "production",
    [string]$Branch = "main",
    [switch]$SkipTests = $false,
    [switch]$Force = $false,
    [switch]$DryRun = $false
)

# Configuration
$ErrorActionPreference = "Stop"
$LogFile = "deploy-log-$(Get-Date -Format 'yyyyMMdd-HHmmss').txt"

# Fonctions utilitaires
function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] [$Level] $Message"
    Write-Host $logMessage
    Add-Content -Path $LogFile -Value $logMessage
}

function Test-VersionCompliance {
    Write-Log "🔍 Vérification de la conformité des versions..."
    
    try {
        # Vérifier la version Node.js
        $nodeVersion = node --version
        Write-Log "Version Node.js actuelle: $nodeVersion"
        
        # Vérifier la version npm
        $npmVersion = npm --version
        Write-Log "Version npm actuelle: $npmVersion"
        
        # Vérifier la configuration de version lock
        if (Test-Path "version-lock.json") {
            $versionLock = Get-Content "version-lock.json" | ConvertFrom-Json
            Write-Log "Configuration de version lock trouvée"
            
            # Vérifier la version Node.js verrouillée
            $lockedNodeVersion = $versionLock.lockedVersions.node
            if ($nodeVersion -ne $lockedNodeVersion) {
                throw "Version Node.js non conforme. Attendu: $lockedNodeVersion, Actuel: $nodeVersion"
            }
            
            # Vérifier la version npm verrouillée
            $lockedNpmVersion = $versionLock.lockedVersions.npm
            if ($npmVersion -ne $lockedNpmVersion) {
                throw "Version npm non conforme. Attendu: $lockedNpmVersion, Actuel: $npmVersion"
            }
            
            Write-Log "✅ Conformité des versions vérifiée"
            return $true
        } else {
            Write-Log "⚠️  Aucune configuration de version lock trouvée" "WARNING"
            return $Force
        }
    }
    catch {
        Write-Log "❌ Erreur de conformité des versions: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

function Test-FeatureFlags {
    Write-Log "🔍 Vérification des feature flags..."
    
    try {
        if (Test-Path "version-lock.json") {
            $versionLock = Get-Content "version-lock.json" | ConvertFrom-Json
            $features = $versionLock.features
            
            if ($features) {
                Write-Log "Feature flags configurées:"
                $features.PSObject.Properties | ForEach-Object {
                    Write-Log "  - $($_.Name): $($_.Value)"
                }
                
                # Vérifier que les fonctionnalités critiques sont activées
                $criticalFeatures = @("dashboard", "payment", "marketplace")
                foreach ($feature in $criticalFeatures) {
                    if ($features.PSObject.Properties.Name -contains $feature) {
                        if (-not $features.$feature) {
                            throw "Fonctionnalité critique désactivée: $feature"
                        }
                    }
                }
                
                Write-Log "✅ Feature flags vérifiés"
                return $true
            }
        }
        
        Write-Log "⚠️  Aucun feature flag configuré" "WARNING"
        return $true
    }
    catch {
        Write-Log "❌ Erreur de vérification des feature flags: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

function Test-Dependencies {
    Write-Log "🔍 Vérification des dépendances..."
    
    try {
        # Vérifier que package-lock.json existe
        if (-not (Test-Path "package-lock.json")) {
            throw "package-lock.json manquant"
        }
        
        # Vérifier l'installation des dépendances
        Write-Log "Installation des dépendances..."
        npm ci
        
        Write-Log "✅ Dépendances vérifiées"
        return $true
    }
    catch {
        Write-Log "❌ Erreur de vérification des dépendances: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

function Test-Build {
    Write-Log "🔍 Test de compilation..."
    
    try {
        # Nettoyer les builds précédents
        if (Test-Path "dist") {
            Remove-Item "dist" -Recurse -Force
        }
        
        # Compiler le projet
        Write-Log "Compilation du projet..."
        npm run build
        
        # Vérifier que le build a réussi
        if (-not (Test-Path "dist")) {
            throw "La compilation a échoué - dossier dist manquant"
        }
        
        Write-Log "✅ Compilation réussie"
        return $true
    }
    catch {
        Write-Log "❌ Erreur de compilation: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

function Test-Regression {
    if ($SkipTests) {
        Write-Log "⏭️  Tests de régression ignorés"
        return $true
    }
    
    Write-Log "🔍 Exécution des tests de régression..."
    
    try {
        # Exécuter les tests de version lock
        Write-Log "Tests de version lock..."
        npm run test:version-lock
        
        # Exécuter les tests unitaires
        Write-Log "Tests unitaires..."
        npm test
        
        Write-Log "✅ Tests de régression réussis"
        return $true
    }
    catch {
        Write-Log "❌ Erreur lors des tests de régression: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

function Backup-CurrentVersion {
    Write-Log "💾 Création d'une sauvegarde..."
    
    try {
        if (Test-Path "scripts\\version-lock-backup.js") {
            node scripts/version-lock-backup.js create "Pre-deployment backup"
            Write-Log "✅ Sauvegarde créée"
        } else {
            Write-Log "⚠️  Script de backup non trouvé" "WARNING"
        }
        
        return $true
    }
    catch {
        Write-Log "❌ Erreur lors de la création de la sauvegarde: $($_.Exception.Message)" "ERROR"
        return $Force
    }
}

function Deploy-Application {
    Write-Log "🚀 Déploiement de l'application..."
    
    try {
        if ($DryRun) {
            Write-Log "🧪 Mode dry-run - aucun déploiement réel"
            return $true
        }
        
        # Arrêter l'application actuelle
        Write-Log "Arrêt de l'application actuelle..."
        # Ici, vous ajouteriez la logique pour arrêter votre application
        
        # Copier les nouveaux fichiers
        Write-Log "Copie des fichiers de déploiement..."
        # Ici, vous ajouteriez la logique pour copier vos fichiers
        
        # Démarrer l'application
        Write-Log "Démarrage de l'application..."
        # Ici, vous ajouteriez la logique pour démarrer votre application
        
        Write-Log "✅ Déploiement réussi"
        return $true
    }
    catch {
        Write-Log "❌ Erreur lors du déploiement: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

function Test-Deployment {
    Write-Log "🔍 Vérification du déploiement..."
    
    try {
        # Attendre que l'application démarre
        Start-Sleep -Seconds 10
        
        # Tester la santé de l'application
        $healthCheck = $false
        $maxRetries = 5
        $retryCount = 0
        
        while ($retryCount -lt $maxRetries -and -not $healthCheck) {
            try {
                # Ici, vous ajouteriez votre test de santé
                # Par exemple: Invoke-RestMethod -Uri "http://localhost:3000/health"
                $healthCheck = $true
                Write-Log "✅ Application saine"
            }
            catch {
                $retryCount++
                if ($retryCount -lt $maxRetries) {
                    Write-Log "Tentative de vérification $retryCount/$maxRetries..."
                    Start-Sleep -Seconds 5
                }
            }
        }
        
        if (-not $healthCheck) {
            throw "L'application ne répond pas correctement"
        }
        
        return $true
    }
    catch {
        Write-Log "❌ Erreur de vérification du déploiement: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

# Script principal
function Main {
    Write-Log "🚀 Démarrage du déploiement sécurisé"
    Write-Log "Environment: $Environment"
    Write-Log "Branch: $Branch"
    Write-Log "Dry Run: $DryRun"
    Write-Log "Force: $Force"
    
    # Vérifications pré-déploiement
    $checks = @(
        @{ Name = "Version Compliance"; Test = { Test-VersionCompliance } },
        @{ Name = "Feature Flags"; Test = { Test-FeatureFlags } },
        @{ Name = "Dependencies"; Test = { Test-Dependencies } },
        @{ Name = "Build"; Test = { Test-Build } },
        @{ Name = "Regression Tests"; Test = { Test-Regression } },
        @{ Name = "Backup"; Test = { Backup-CurrentVersion } }
    )
    
    foreach ($check in $checks) {
        Write-Log "\n--- Vérification: $($check.Name) ---"
        $result = & $check.Test
        
        if (-not $result -and -not $Force) {
            Write-Log "❌ Vérification échouée: $($check.Name)" "ERROR"
            Write-Log "Déploiement annulé" "ERROR"
            exit 1
        }
        elseif (-not $result -and $Force) {
            Write-Log "⚠️  Vérification échouée mais poursuite forcée: $($check.Name)" "WARNING"
        }
    }
    
    # Déploiement
    Write-Log "\n--- Déploiement ---"
    $deployResult = Deploy-Application
    
    if (-not $deployResult) {
        Write-Log "❌ Déploiement échoué" "ERROR"
        exit 1
    }
    
    # Vérification post-déploiement
    Write-Log "\n--- Vérification Post-Déploiement ---"
    $postDeployResult = Test-Deployment
    
    if (-not $postDeployResult) {
        Write-Log "❌ Vérification post-déploiement échouée" "ERROR"
        
        if (-not $DryRun) {
            Write-Log "🔄 Rollback automatique en cours..."
            # Ici, vous ajouteriez la logique de rollback
            # node scripts/version-lock-backup.js rollback
        }
        
        exit 1
    }
    
    Write-Log "\n🎉 Déploiement réussi!"
    Write-Log "Voir le log complet: $LogFile"
}

# Exécution
Main