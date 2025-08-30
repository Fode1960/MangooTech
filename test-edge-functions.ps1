# Script PowerShell pour tester les Edge Functions et reproduire l'erreur
# "Edge Function returned a non-2xx status code"

Write-Host "🔍 Test des Edge Functions - Diagnostic de l'erreur" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

# Configuration
$supabaseUrl = "https://ptrqhtwstldphjaraufi.supabase.co"
$anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0cnFodHdzdGxkcGhqYXJhdWZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MzI0OTIsImV4cCI6MjA3MDUwODQ5Mn0.Wc-dKWVMpAyFoAPFGejzhD0o1rodyEGrBlZK5X3muyA"

# Headers de base
$headers = @{
    "Content-Type" = "application/json"
    "apikey" = $anonKey
}

Write-Host "📋 Étape 1: Test de connexion à Supabase" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$supabaseUrl/rest/v1/" -Headers $headers -Method GET
    Write-Host "✅ Connexion à Supabase réussie" -ForegroundColor Green
} catch {
    Write-Host "❌ Erreur de connexion à Supabase: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "`n📋 Étape 2: Récupération des packs disponibles" -ForegroundColor Yellow
try {
    $packsResponse = Invoke-RestMethod -Uri "$supabaseUrl/rest/v1/packs?select=id,name,price" -Headers $headers -Method GET
    Write-Host "✅ $($packsResponse.Count) packs récupérés" -ForegroundColor Green
    
    # Afficher les packs
    foreach ($pack in $packsResponse) {
        Write-Host "  📦 $($pack.name) - $($pack.price) FCFA (ID: $($pack.id))" -ForegroundColor White
    }
    
    # Sélectionner le pack cible
    $targetPack = $packsResponse | Where-Object { $_.name -eq "Pack Visibilité" }
    if (-not $targetPack) {
        $targetPack = $packsResponse[0]
        Write-Host "⚠️ Pack Visibilité non trouvé, utilisation du premier pack: $($targetPack.name)" -ForegroundColor Yellow
    } else {
        Write-Host "🎯 Pack cible sélectionné: $($targetPack.name)" -ForegroundColor Green
    }
    
} catch {
    Write-Host "❌ Erreur lors de la récupération des packs: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "`n📋 Étape 3: Test de calculate-pack-difference (sans authentification)" -ForegroundColor Yellow
try {
    $calcBody = @{
        newPackId = $targetPack.id
    } | ConvertTo-Json
    
    Write-Host "📞 Appel à calculate-pack-difference avec newPackId: $($targetPack.id)" -ForegroundColor White
    
    $calcResponse = Invoke-WebRequest -Uri "$supabaseUrl/functions/v1/calculate-pack-difference" -Headers $headers -Method POST -Body $calcBody -UseBasicParsing
    
    Write-Host "📊 Status: $($calcResponse.StatusCode)" -ForegroundColor White
    Write-Host "📄 Réponse: $($calcResponse.Content)" -ForegroundColor White
    
    if ($calcResponse.StatusCode -ge 200 -and $calcResponse.StatusCode -lt 300) {
        Write-Host "✅ calculate-pack-difference réussi" -ForegroundColor Green
    } else {
        Write-Host "❌ calculate-pack-difference échoué (Status: $($calcResponse.StatusCode))" -ForegroundColor Red
    }
    
} catch {
    Write-Host "❌ Erreur calculate-pack-difference: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "📊 Status Code: $statusCode" -ForegroundColor Red
        
        try {
            $errorStream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($errorStream)
            $errorContent = $reader.ReadToEnd()
            Write-Host "📄 Contenu de l'erreur: $errorContent" -ForegroundColor Red
        } catch {
            Write-Host "⚠️ Impossible de lire le contenu de l'erreur" -ForegroundColor Yellow
        }
    }
}

Write-Host "`n📋 Étape 4: Test de smart-pack-change (sans authentification)" -ForegroundColor Yellow
try {
    $smartBody = @{
        packId = $targetPack.id
    } | ConvertTo-Json
    
    Write-Host "📞 Appel à smart-pack-change avec packId: $($targetPack.id)" -ForegroundColor White
    
    $smartResponse = Invoke-WebRequest -Uri "$supabaseUrl/functions/v1/smart-pack-change" -Headers $headers -Method POST -Body $smartBody -UseBasicParsing
    
    Write-Host "📊 Status: $($smartResponse.StatusCode)" -ForegroundColor White
    Write-Host "📄 Réponse: $($smartResponse.Content)" -ForegroundColor White
    
    if ($smartResponse.StatusCode -ge 200 -and $smartResponse.StatusCode -lt 300) {
        Write-Host "✅ smart-pack-change réussi" -ForegroundColor Green
    } else {
        Write-Host "❌ ERREUR: Edge Function returned a non-2xx status code ($($smartResponse.StatusCode))" -ForegroundColor Red
    }
    
} catch {
    Write-Host "❌ ERREUR: Edge Function returned a non-2xx status code" -ForegroundColor Red
    Write-Host "Détails: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "📊 Status Code: $statusCode" -ForegroundColor Red
        
        try {
            $errorStream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($errorStream)
            $errorContent = $reader.ReadToEnd()
            Write-Host "📄 Contenu de l'erreur: $errorContent" -ForegroundColor Red
            
            # Essayer de parser comme JSON
            try {
                $errorJson = $errorContent | ConvertFrom-Json
                Write-Host "📋 Erreur parsée:" -ForegroundColor Red
                Write-Host ($errorJson | ConvertTo-Json -Depth 3) -ForegroundColor Red
            } catch {
                Write-Host "⚠️ Impossible de parser l'erreur comme JSON" -ForegroundColor Yellow
            }
            
        } catch {
            Write-Host "⚠️ Impossible de lire le contenu de l'erreur" -ForegroundColor Yellow
        }
    }
}

Write-Host "`n📋 Étape 5: Test avec token d'authentification factice" -ForegroundColor Yellow
$authHeaders = $headers.Clone()
$dummyToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzU2NTc1NDAwLCJpYXQiOjE3NTY1NzE4MDAsImlzcyI6Imh0dHBzOi8vcHRycWh0d3N0bGRwaGphcmF1Zmkuc3VwYWJhc2UuY28vYXV0aC92MSIsInN1YiI6InRlc3QtdXNlci1pZCIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsInBob25lIjoiIiwiYXBwX21ldGFkYXRhIjp7InByb3ZpZGVyIjoiZW1haWwiLCJwcm92aWRlcnMiOlsiZW1haWwiXX0sInVzZXJfbWV0YWRhdGEiOnt9LCJyb2xlIjoiYXV0aGVudGljYXRlZCIsImFhbCI6ImFhbDEiLCJhbXIiOlt7Im1ldGhvZCI6InBhc3N3b3JkIiwidGltZXN0YW1wIjoxNzU2NTcxODAwfV0sInNlc3Npb25faWQiOiJ0ZXN0LXNlc3Npb24taWQifQ.fake-signature"
$authHeaders["Authorization"] = "Bearer $dummyToken"

try {
    Write-Host "📞 Test smart-pack-change avec token factice" -ForegroundColor White
    
    $smartAuthResponse = Invoke-WebRequest -Uri "$supabaseUrl/functions/v1/smart-pack-change" -Headers $authHeaders -Method POST -Body $smartBody -UseBasicParsing
    
    Write-Host "📊 Status avec auth: $($smartAuthResponse.StatusCode)" -ForegroundColor White
    Write-Host "📄 Réponse avec auth: $($smartAuthResponse.Content)" -ForegroundColor White
    
} catch {
    Write-Host "❌ Erreur avec token factice: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "📊 Status Code avec auth: $statusCode" -ForegroundColor Red
        
        try {
            $errorStream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($errorStream)
            $errorContent = $reader.ReadToEnd()
            Write-Host "📄 Contenu de l'erreur avec auth: $errorContent" -ForegroundColor Red
        } catch {
            Write-Host "⚠️ Impossible de lire le contenu de l'erreur avec auth" -ForegroundColor Yellow
        }
    }
}

Write-Host "`n🏁 Test terminé" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan