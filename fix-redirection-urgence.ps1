# Script de correction d'urgence pour la redirection
Write-Host "Script de correction d'urgence - Redirection vers port 3001" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

# 1. Vérifier et corriger FRONTEND_URL
Write-Host "Etape 1: Verification de FRONTEND_URL" -ForegroundColor Yellow
$envFile = ".env.local"
if (Test-Path $envFile) {
    $envContent = Get-Content $envFile -Raw
    if ($envContent -match "FRONTEND_URL=http://localhost:3001") {
        Write-Host "FRONTEND_URL est correctement configuree" -ForegroundColor Green
    } else {
        Write-Host "Correction de FRONTEND_URL..." -ForegroundColor Yellow
        if ($envContent -match "FRONTEND_URL=") {
            $envContent = $envContent -replace "FRONTEND_URL=.*", "FRONTEND_URL=http://localhost:3001"
        } else {
            $envContent += "`nFRONTEND_URL=http://localhost:3001"
        }
        $envContent | Set-Content $envFile -Encoding UTF8
        Write-Host "FRONTEND_URL corrigee" -ForegroundColor Green
    }
} else {
    Write-Host "Fichier .env.local non trouve" -ForegroundColor Red
    "FRONTEND_URL=http://localhost:3001" | Set-Content $envFile -Encoding UTF8
    Write-Host "Fichier .env.local cree" -ForegroundColor Green
}

# 2. Corriger l'Edge Function
Write-Host "Etape 2: Correction de l'Edge Function" -ForegroundColor Yellow
$edgeFunctionFile = "supabase\functions\create-checkout-session\index.ts"
if (Test-Path $edgeFunctionFile) {
    $functionContent = Get-Content $edgeFunctionFile -Raw
    $originText = "req.headers.get"
    if ($functionContent.Contains($originText)) {
        Write-Host "Edge Function utilise encore req.headers.get" -ForegroundColor Red
        Write-Host "Correction automatique..." -ForegroundColor Yellow
        
        # Correction automatique
        $oldPattern = "const origin = req.headers.get('origin')"
        $newPattern = "const frontendUrl = Deno.env.get('FRONTEND_URL')"
        $correctedContent = $functionContent.Replace($oldPattern, $newPattern)
        $correctedContent = $correctedContent.Replace("`${origin}", "`${frontendUrl}")
        
        $correctedContent | Set-Content $edgeFunctionFile -Encoding UTF8
        Write-Host "Edge Function corrigee" -ForegroundColor Green
    } else {
        Write-Host "Edge Function semble correcte" -ForegroundColor Green
    }
} else {
    Write-Host "Edge Function non trouvee" -ForegroundColor Red
}

# 3. Nettoyer les processus sur les ports
Write-Host "Etape 3: Nettoyage des processus" -ForegroundColor Yellow
$ports = @(3001, 3003)
foreach ($port in $ports) {
    try {
        $processes = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess
        if ($processes) {
            foreach ($pid in $processes) {
                Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
                Write-Host "Processus $pid sur port $port arrete" -ForegroundColor Yellow
            }
        } else {
            Write-Host "Aucun processus sur port $port" -ForegroundColor Green
        }
    } catch {
        Write-Host "Port $port libre" -ForegroundColor Green
    }
}

# 4. Redémarrer Supabase
Write-Host "Etape 4: Redemarrage de Supabase" -ForegroundColor Yellow
try {
    Write-Host "Arret de Supabase..." -ForegroundColor Yellow
    npx supabase stop 2>$null
    Start-Sleep -Seconds 2
    
    Write-Host "Demarrage de Supabase..." -ForegroundColor Yellow
    npx supabase start
    Write-Host "Supabase redemarre" -ForegroundColor Green
} catch {
    Write-Host "Erreur lors du redemarrage de Supabase" -ForegroundColor Red
}

# 5. Redéployer les Edge Functions
Write-Host "Etape 5: Redeploiement des Edge Functions" -ForegroundColor Yellow
try {
    npx supabase functions deploy create-checkout-session
    Write-Host "Edge Functions redeployees" -ForegroundColor Green
} catch {
    Write-Host "Erreur lors du redeploiement" -ForegroundColor Red
}

# 6. Vérifier la configuration Vite
Write-Host "Etape 6: Verification de la configuration Vite" -ForegroundColor Yellow
$viteConfig = "vite.config.js"
if (Test-Path $viteConfig) {
    $viteContent = Get-Content $viteConfig -Raw
    if ($viteContent.Contains("port: 3001")) {
        Write-Host "Configuration Vite correcte (port 3001)" -ForegroundColor Green
    } else {
        Write-Host "Verifiez la configuration du port dans vite.config.js" -ForegroundColor Yellow
    }
} else {
    Write-Host "vite.config.js non trouve" -ForegroundColor Red
}

Write-Host "Script termine!" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Instructions finales:" -ForegroundColor White
Write-Host "1. Redemarrez votre serveur de developpement: npm run dev" -ForegroundColor White
Write-Host "2. Testez sur http://localhost:3001" -ForegroundColor White
Write-Host "3. Videz le cache du navigateur (Ctrl+Shift+R)" -ForegroundColor White
Write-Host "4. Testez le paiement en navigation privee" -ForegroundColor White