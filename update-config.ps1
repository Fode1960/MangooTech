# Script PowerShell pour configurer automatiquement les valeurs réelles
# Remplace les placeholders dans les scripts de test et monitoring

param(
    [Parameter(Mandatory=$true)]
    [string]$Username,
    
    [Parameter(Mandatory=$true)]
    [string]$ProjectId,
    
    [Parameter(Mandatory=$false)]
    [string]$CustomDomain = ""
)

# Couleurs pour l'affichage
$Green = "Green"
$Yellow = "Yellow"
$Red = "Red"
$Cyan = "Cyan"

Write-Host "🔧 Configuration automatique des valeurs réelles" -ForegroundColor $Cyan
Write-Host "================================================" -ForegroundColor $Cyan

# Validation des paramètres
if ([string]::IsNullOrWhiteSpace($Username)) {
    Write-Host "❌ Erreur: Username requis" -ForegroundColor $Red
    Write-Host "Usage: .\update-config.ps1 -Username 'votre-username' -ProjectId 'votre-projet-id'" -ForegroundColor $Yellow
    exit 1
}

if ([string]::IsNullOrWhiteSpace($ProjectId)) {
    Write-Host "❌ Erreur: ProjectId requis" -ForegroundColor $Red
    Write-Host "Usage: .\update-config.ps1 -Username 'votre-username' -ProjectId 'votre-projet-id'" -ForegroundColor $Yellow
    exit 1
}

# Configuration des URLs
$ProductionUrl = if ($CustomDomain) { $CustomDomain } else { "https://$Username.github.io/MangooTech" }
$SupabaseUrl = "https://$ProjectId.supabase.co"

Write-Host "📋 Configuration détectée:" -ForegroundColor $Yellow
Write-Host "   Username GitHub: $Username" -ForegroundColor $Yellow
Write-Host "   Project ID Supabase: $ProjectId" -ForegroundColor $Yellow
Write-Host "   URL de production: $ProductionUrl" -ForegroundColor $Yellow
Write-Host "   URL Supabase: $SupabaseUrl" -ForegroundColor $Yellow
Write-Host ""

# Fonction pour sauvegarder un fichier
function Backup-File {
    param([string]$FilePath)
    
    if (Test-Path $FilePath) {
        $BackupPath = "$FilePath.backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
        Copy-Item $FilePath $BackupPath
        Write-Host "💾 Sauvegarde créée: $BackupPath" -ForegroundColor $Green
    }
}

# Fonction pour remplacer les placeholders dans un fichier
function Update-ConfigFile {
    param(
        [string]$FilePath,
        [hashtable]$Replacements
    )
    
    if (-not (Test-Path $FilePath)) {
        Write-Host "⚠️  Fichier non trouvé: $FilePath" -ForegroundColor $Yellow
        return $false
    }
    
    Write-Host "🔄 Mise à jour de $FilePath..." -ForegroundColor $Cyan
    
    # Sauvegarder le fichier original
    Backup-File $FilePath
    
    # Lire le contenu
    $Content = Get-Content $FilePath -Raw
    $OriginalContent = $Content
    
    # Appliquer les remplacements
    foreach ($Key in $Replacements.Keys) {
        $OldValue = $Key
        $NewValue = $Replacements[$Key]
        $Content = $Content -replace [regex]::Escape($OldValue), $NewValue
        Write-Host "   ✅ $OldValue → $NewValue" -ForegroundColor $Green
    }
    
    # Sauvegarder si des changements ont été effectués
    if ($Content -ne $OriginalContent) {
        Set-Content $FilePath $Content -NoNewline
        Write-Host "   💾 Fichier mis à jour avec succès" -ForegroundColor $Green
        return $true
    } else {
        Write-Host "   ℹ️  Aucun changement nécessaire" -ForegroundColor $Yellow
        return $false
    }
}

# Configuration des remplacements pour test-production-deployment.js
$TestDeploymentReplacements = @{
    "https://your-username.github.io/MangooTech" = $ProductionUrl
    "https://your-project.supabase.co" = $SupabaseUrl
    "your-project" = $ProjectId
    "your-username" = $Username
}

# Configuration des remplacements pour monitor-performance-metrics.js
$MonitoringReplacements = @{
    "https://your-app.vercel.app" = $ProductionUrl
    "your-project" = $ProjectId
    "your-username" = $Username
}

# Mise à jour des fichiers
Write-Host "🚀 Début de la mise à jour des fichiers..." -ForegroundColor $Cyan
Write-Host ""

$UpdatedFiles = 0

# Mise à jour du script de test de déploiement
if (Update-ConfigFile "test-production-deployment.js" $TestDeploymentReplacements) {
    $UpdatedFiles++
}

Write-Host ""

# Mise à jour du script de monitoring
if (Update-ConfigFile "monitor-performance-metrics.js" $MonitoringReplacements) {
    $UpdatedFiles++
}

Write-Host ""
Write-Host "📊 Résumé de la configuration" -ForegroundColor $Cyan
Write-Host "============================" -ForegroundColor $Cyan
Write-Host "Fichiers mis à jour: $UpdatedFiles" -ForegroundColor $Green
Write-Host ""

# Instructions pour les secrets GitHub
Write-Host "🔐 Configuration des secrets GitHub" -ForegroundColor $Yellow
Write-Host "===================================" -ForegroundColor $Yellow
Write-Host "Ajoutez ces secrets dans votre repository GitHub:" -ForegroundColor $Yellow
Write-Host ""
Write-Host "1. VITE_SUPABASE_URL" -ForegroundColor $Green
Write-Host "   Value: $SupabaseUrl" -ForegroundColor $Green
Write-Host ""
Write-Host "2. VITE_SUPABASE_ANON_KEY" -ForegroundColor $Green
Write-Host "   Value: [Votre clé anonyme depuis Supabase Dashboard > Settings > API]" -ForegroundColor $Green
Write-Host ""
Write-Host "3. VITE_APP_URL" -ForegroundColor $Green
Write-Host "   Value: $ProductionUrl" -ForegroundColor $Green
Write-Host ""

# Instructions de test
Write-Host "🧪 Prochaines étapes" -ForegroundColor $Cyan
Write-Host "==================" -ForegroundColor $Cyan
Write-Host "1. Configurez les secrets GitHub (voir ci-dessus)" -ForegroundColor $Yellow
Write-Host "2. Testez le déploiement:" -ForegroundColor $Yellow
Write-Host "   node test-production-deployment.js" -ForegroundColor $Green
Write-Host "3. Lancez le monitoring:" -ForegroundColor $Yellow
Write-Host "   node monitor-performance-metrics.js" -ForegroundColor $Green
Write-Host "4. Vérifiez le workflow GitHub Actions" -ForegroundColor $Yellow
Write-Host ""

# Vérification des fichiers de sauvegarde
$BackupFiles = Get-ChildItem -Filter "*.backup-*" | Measure-Object
if ($BackupFiles.Count -gt 0) {
    Write-Host "💾 Sauvegardes créées: $($BackupFiles.Count) fichier(s)" -ForegroundColor $Green
    Write-Host "   Vous pouvez les supprimer après vérification" -ForegroundColor $Yellow
}

Write-Host ""
Write-Host "✅ Configuration terminée avec succès!" -ForegroundColor $Green
Write-Host "🚀 Votre application est prête pour la production!" -ForegroundColor $Green