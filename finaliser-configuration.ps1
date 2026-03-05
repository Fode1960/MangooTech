# Script Final - Automatisation Complète de la Configuration
# Exécute toutes les étapes recommandées pour finaliser le déploiement

param(
    [Parameter(Mandatory=$false)]
    [string]$Username = "",
    
    [Parameter(Mandatory=$false)]
    [string]$ProjectId = "",
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipConfig,
    
    [Parameter(Mandatory=$false)]
    [switch]$TestOnly,
    
    [Parameter(Mandatory=$false)]
    [switch]$MonitorOnly
)

# Couleurs pour l'affichage
$Green = "Green"
$Yellow = "Yellow"
$Red = "Red"
$Cyan = "Cyan"
$Magenta = "Magenta"

function Write-Header {
    param([string]$Title)
    Write-Host ""
    Write-Host "🚀 $Title" -ForegroundColor $Cyan
    Write-Host ("=" * ($Title.Length + 4)) -ForegroundColor $Cyan
}

function Write-Step {
    param([string]$Step, [int]$Number)
    Write-Host ""
    Write-Host "📋 Étape $Number : $Step" -ForegroundColor $Magenta
    Write-Host ("─" * ($Step.Length + 15)) -ForegroundColor $Magenta
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor $Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor $Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor $Red
}

function Test-NodeInstalled {
    try {
        $nodeVersion = node --version 2>$null
        if ($nodeVersion) {
            Write-Success "Node.js installé : $nodeVersion"
            return $true
        }
    } catch {
        Write-Error "Node.js n'est pas installé ou accessible"
        return $false
    }
    return $false
}

function Test-FileExists {
    param([string]$FilePath, [string]$Description)
    
    if (Test-Path $FilePath) {
        Write-Success "$Description trouvé"
        return $true
    } else {
        Write-Warning "$Description non trouvé : $FilePath"
        return $false
    }
}

function Show-GitHubSecretsInstructions {
    param([string]$Username, [string]$ProjectId)
    
    Write-Header "Configuration des Secrets GitHub"
    
    if ($Username -and $ProjectId) {
        Write-Host "🔗 URL de configuration : https://github.com/$Username/MangooTech/settings/secrets/actions" -ForegroundColor $Yellow
        Write-Host ""
        Write-Host "📝 Secrets à ajouter :" -ForegroundColor $Yellow
        Write-Host ""
        Write-Host "1. VITE_SUPABASE_URL" -ForegroundColor $Green
        Write-Host "   Value: https://$ProjectId.supabase.co" -ForegroundColor $Green
        Write-Host ""
        Write-Host "2. VITE_SUPABASE_ANON_KEY" -ForegroundColor $Green
        Write-Host "   Value: [Votre clé depuis Supabase Dashboard > Settings > API]" -ForegroundColor $Green
        Write-Host ""
        Write-Host "3. VITE_APP_URL" -ForegroundColor $Green
        Write-Host "   Value: https://$Username.github.io/MangooTech" -ForegroundColor $Green
    } else {
        Write-Host "📋 Consultez le fichier GUIDE-CONFIGURATION-SECRETS-GITHUB.md" -ForegroundColor $Yellow
        Write-Host "🔗 Ou utilisez : .\finaliser-configuration.ps1 -Username 'votre-username' -ProjectId 'votre-projet'" -ForegroundColor $Yellow
    }
}

function Update-ConfigurationFiles {
    param([string]$Username, [string]$ProjectId)
    
    Write-Step "Mise à jour des fichiers de configuration" 2
    
    if (-not $Username -or -not $ProjectId) {
        Write-Warning "Username ou ProjectId manquant, configuration manuelle requise"
        Write-Host "📋 Consultez GUIDE-CONFIGURATION-VALEURS-REELLES.md" -ForegroundColor $Yellow
        return $false
    }
    
    # Vérifier si le script update-config.ps1 existe
    if (Test-Path "update-config.ps1") {
        Write-Host "🔄 Exécution du script de configuration..." -ForegroundColor $Cyan
        try {
            & .\update-config.ps1 -Username $Username -ProjectId $ProjectId
            Write-Success "Configuration des fichiers terminée"
            return $true
        } catch {
            Write-Error "Erreur lors de la configuration : $($_.Exception.Message)"
            return $false
        }
    } else {
        Write-Warning "Script update-config.ps1 non trouvé"
        return $false
    }
}

function Test-ProductionDeployment {
    Write-Step "Test du déploiement de production" 3
    
    if (-not (Test-FileExists "test-production-deployment.js" "Script de test de déploiement")) {
        return $false
    }
    
    Write-Host "🧪 Exécution des tests de déploiement..." -ForegroundColor $Cyan
    try {
        $result = node test-production-deployment.js 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Tests de déploiement réussis"
            Write-Host $result -ForegroundColor $Green
            return $true
        } else {
            Write-Warning "Tests de déploiement avec erreurs (code: $LASTEXITCODE)"
            Write-Host $result -ForegroundColor $Yellow
            return $false
        }
    } catch {
        Write-Error "Erreur lors des tests : $($_.Exception.Message)"
        return $false
    }
}

function Start-PerformanceMonitoring {
    Write-Step "Lancement du monitoring des performances" 4
    
    if (-not (Test-FileExists "monitor-performance-metrics.js" "Script de monitoring")) {
        return $false
    }
    
    Write-Host "📊 Démarrage du monitoring (Ctrl+C pour arrêter)..." -ForegroundColor $Cyan
    Write-Host "⏱️  Le monitoring s'exécutera en continu" -ForegroundColor $Yellow
    Write-Host "📋 Consultez les métriques affichées pour surveiller les performances" -ForegroundColor $Yellow
    Write-Host ""
    
    try {
        node monitor-performance-metrics.js
    } catch {
        Write-Error "Erreur lors du monitoring : $($_.Exception.Message)"
        return $false
    }
}

function Show-FinalInstructions {
    Write-Header "Instructions Finales"
    
    Write-Host "🎯 Prochaines actions recommandées :" -ForegroundColor $Yellow
    Write-Host ""
    Write-Host "1. 🔐 Configurez les secrets GitHub (si pas encore fait)" -ForegroundColor $Yellow
    Write-Host "2. 🚀 Faites un commit et push pour déclencher le déploiement" -ForegroundColor $Yellow
    Write-Host "3. 🔍 Surveillez le workflow dans GitHub Actions" -ForegroundColor $Yellow
    Write-Host "4. 🌐 Visitez votre application en production" -ForegroundColor $Yellow
    Write-Host "5. 📊 Lancez le monitoring périodiquement" -ForegroundColor $Yellow
    Write-Host ""
    Write-Host "📚 Documentation disponible :" -ForegroundColor $Cyan
    Write-Host "   - GUIDE-CONFIGURATION-SECRETS-GITHUB.md" -ForegroundColor $Green
    Write-Host "   - GUIDE-CONFIGURATION-VALEURS-REELLES.md" -ForegroundColor $Green
    Write-Host "   - EXEMPLE-CONFIGURATION-COMPLETE.md" -ForegroundColor $Green
    Write-Host ""
    Write-Success "Configuration terminée ! Votre application est prête pour la production 🎉"
}

# Script principal
Write-Header "Finalisation de la Configuration MangooTech"

# Vérifications préliminaires
Write-Step "Vérifications préliminaires" 0

if (-not (Test-NodeInstalled)) {
    Write-Error "Node.js est requis pour continuer"
    exit 1
}

Test-FileExists "package.json" "Configuration du projet" | Out-Null
Test-FileExists ".github/workflows/deploy.yml" "Workflow GitHub Actions" | Out-Null

# Gestion des paramètres
if ($MonitorOnly) {
    Start-PerformanceMonitoring
    exit 0
}

if ($TestOnly) {
    Test-ProductionDeployment
    exit 0
}

# Étape 1 : Configuration des secrets GitHub
if (-not $SkipConfig) {
    Write-Step "Configuration des secrets GitHub" 1
    Show-GitHubSecretsInstructions $Username $ProjectId
    
    Write-Host ""
    $continue = Read-Host "Avez-vous configuré les secrets GitHub ? (o/N)"
    if ($continue -notmatch '^[oO]') {
        Write-Warning "Configurez d'abord les secrets GitHub, puis relancez ce script"
        exit 0
    }
}

# Étape 2 : Mise à jour des fichiers de configuration
if (-not $SkipConfig -and $Username -and $ProjectId) {
    Update-ConfigurationFiles $Username $ProjectId
}

# Étape 3 : Test du déploiement
Write-Host ""
$runTests = Read-Host "Voulez-vous exécuter les tests de déploiement ? (O/n)"
if ($runTests -notmatch '^[nN]') {
    $testResult = Test-ProductionDeployment
    
    if (-not $testResult) {
        Write-Warning "Les tests ont échoué. Vérifiez la configuration avant de continuer."
        $continue = Read-Host "Continuer malgré les erreurs ? (o/N)"
        if ($continue -notmatch '^[oO]') {
            exit 1
        }
    }
}

# Étape 4 : Monitoring (optionnel)
Write-Host ""
$runMonitoring = Read-Host "Voulez-vous lancer le monitoring des performances ? (O/n)"
if ($runMonitoring -notmatch '^[nN]') {
    Write-Host ""
    Write-Host "⚠️  Le monitoring s'exécutera en continu. Utilisez Ctrl+C pour l'arrêter." -ForegroundColor $Yellow
    $continue = Read-Host "Continuer ? (O/n)"
    if ($continue -notmatch '^[nN]') {
        Start-PerformanceMonitoring
    }
}

# Instructions finales
Show-FinalInstructions