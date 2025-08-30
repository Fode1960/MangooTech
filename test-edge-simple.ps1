# Script PowerShell simple pour tester les Edge Functions
Write-Host "🔍 Test des Edge Functions" -ForegroundColor Cyan

# Configuration
$supabaseUrl = "https://ptrqhtwstldphjaraufi.supabase.co"
$anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0cnFodHdzdGxkcGhqYXJhdWZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MzI0OTIsImV4cCI6MjA3MDUwODQ5Mn0.Wc-dKWVMpAyFoAPFGejzhD0o1rodyEGrBlZK5X3muyA"

# Headers
$headers = @{
    "Content-Type" = "application/json"
    "apikey" = $anonKey
}

Write-Host "📋 Récupération des packs..." -ForegroundColor Yellow
try {
    $packs = Invoke-RestMethod -Uri "$supabaseUrl/rest/v1/packs?select=id,name,price" -Headers $headers -Method GET
    Write-Host "✅ $($packs.Count) packs trouvés" -ForegroundColor Green
    
    $targetPack = $packs | Where-Object { $_.name -eq "Pack Visibilité" }
    if (-not $targetPack) {
        $targetPack = $packs[0]
    }
    Write-Host "🎯 Pack cible: $($targetPack.name) (ID: $($targetPack.id))" -ForegroundColor Green
} catch {
    Write-Host "❌ Erreur: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "`n📋 Test calculate-pack-difference..." -ForegroundColor Yellow
try {
    $body = @{ newPackId = $targetPack.id } | ConvertTo-Json
    $response = Invoke-WebRequest -Uri "$supabaseUrl/functions/v1/calculate-pack-difference" -Headers $headers -Method POST -Body $body -UseBasicParsing
    Write-Host "✅ Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "📄 Réponse: $($response.Content)" -ForegroundColor White
} catch {
    Write-Host "❌ Erreur: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "📊 Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    }
}

Write-Host "`n📋 Test smart-pack-change..." -ForegroundColor Yellow
try {
    $body = @{ packId = $targetPack.id } | ConvertTo-Json
    $response = Invoke-WebRequest -Uri "$supabaseUrl/functions/v1/smart-pack-change" -Headers $headers -Method POST -Body $body -UseBasicParsing
    Write-Host "✅ Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "📄 Réponse: $($response.Content)" -ForegroundColor White
} catch {
    Write-Host "❌ ERREUR: Edge Function returned a non-2xx status code" -ForegroundColor Red
    Write-Host "Détails: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "📊 Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    }
}

Write-Host "`n🏁 Test terminé" -ForegroundColor Cyan