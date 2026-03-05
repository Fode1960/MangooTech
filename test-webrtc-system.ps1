# Script de test complet pour MangooTech WebRTC

Write-Host "🧪 Script de test complet MangooTech WebRTC" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

# Fonction pour tester une connexion
function Test-Connection {
    param(
        [string]$Name,
        [string]$Url,
        [string]$Type = "http"
    )
    
    Write-Host "🔍 Test de $Name..." -ForegroundColor Yellow -NoNewline
    
    try {
        if ($Type -eq "ws") {
            # Test WebSocket
            $client = New-Object System.Net.WebSockets.ClientWebSocket
            $cts = New-Object System.Threading.CancellationTokenSource
            $cts.CancelAfter(5000) # 5 secondes timeout
            
            $task = $client.ConnectAsync($Url, $cts.Token)
            $task.Wait()
            
            if ($task.IsCompletedSuccessfully) {
                Write-Host " ✅ CONNECTÉ" -ForegroundColor Green
                $client.CloseAsync([System.Net.WebSockets.WebSocketCloseStatus]::NormalClosure, "Test", [System.Threading.CancellationToken]::None).Wait()
                return $true
            } else {
                Write-Host " ❌ ÉCHEC" -ForegroundColor Red
                return $false
            }
        } else {
            # Test HTTP
            $response = Invoke-WebRequest -Uri $Url -Method GET -TimeoutSec 5 -UseBasicParsing
            if ($response.StatusCode -eq 200) {
                Write-Host " ✅ CONNECTÉ" -ForegroundColor Green
                return $true
            } else {
                Write-Host " ❌ ÉCHEC (Code: $($response.StatusCode))" -ForegroundColor Red
                return $false
            }
        }
    }
    catch {
        Write-Host " ❌ ÉCHEC ($($_.Exception.Message))" -ForegroundColor Red
        return $false
    }
}

# Fonction pour tester les ports
function Test-Port {
    param(
        [int]$Port,
        [string]$Name
    )
    
    Write-Host "🔌 Test du port $Port ($Name)..." -ForegroundColor Yellow -NoNewline
    
    try {
        $tcpClient = New-Object System.Net.Sockets.TcpClient
        $tcpClient.Connect("localhost", $Port)
        $tcpClient.Close()
        Write-Host " ✅ OUVERT" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host " ❌ FERMÉ" -ForegroundColor Red
        return $false
    }
}

Write-Host "`n📊 PHASE 1: Test des ports" -ForegroundColor Cyan
Write-Host "----------------------------------------" -ForegroundColor Cyan

$portsOk = $true
$portsOk = (Test-Port -Port 3007 -Name "Chat Live Shopping") -and $portsOk
$portsOk = (Test-Port -Port 3008 -Name "WebSocket WebRTC") -and $portsOk
$portsOk = (Test-Port -Port 3015 -Name "Application React") -and $portsOk

Write-Host "`n📊 PHASE 2: Test des connexions HTTP" -ForegroundColor Cyan
Write-Host "----------------------------------------" -ForegroundColor Cyan

$httpOk = $true
$httpOk = (Test-Connection -Name "Health Check Chat (3007)" -Url "http://localhost:3007/health") -and $httpOk
$httpOk = (Test-Connection -Name "Health Check WebRTC (3008)" -Url "http://localhost:3008/health") -and $httpOk
$httpOk = (Test-Connection -Name "Application React (3015)" -Url "http://localhost:3015") -and $httpOk

Write-Host "`n📊 PHASE 3: Test des connexions WebSocket" -ForegroundColor Cyan
Write-Host "----------------------------------------" -ForegroundColor Cyan

$wsOk = $true
$wsOk = (Test-Connection -Name "WebSocket Chat (3007)" -Url "ws://localhost:3007" -Type "ws") -and $wsOk
$wsOk = (Test-Connection -Name "WebSocket WebRTC (3008)" -Url "ws://localhost:3008" -Type "ws") -and $wsOk

Write-Host "`n📊 PHASE 4: Test des pages de test" -ForegroundColor Cyan
Write-Host "----------------------------------------" -ForegroundColor Cyan

$pagesOk = $true
$pagesOk = (Test-Connection -Name "Page Vendeur Test" -Url "http://localhost:3015/live-shopping-vendor-test") -and $pagesOk
$pagesOk = (Test-Connection -Name "Page Client Test" -Url "http://localhost:3015/live-shopping-client-test") -and $pagesOk

Write-Host "`n📊 RÉSUMÉ DES TESTS" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

Write-Host "Ports: $(if($portsOk){'✅ TOUS OUVERTS'}else{'❌ CERTAINS FERMÉS'})" -ForegroundColor $(if($portsOk){"Green"}else{"Red"})
Write-Host "HTTP: $(if($httpOk){'✅ TOUS ACCESSIBLES'}else{'❌ CERTAINS INACCESSIBLES'})" -ForegroundColor $(if($httpOk){"Green"}else{"Red"})
Write-Host "WebSocket: $(if($wsOk){'✅ TOUS CONNECTÉS'}else{'❌ CERTAINS DÉCONNECTÉS'})" -ForegroundColor $(if($wsOk){"Green"}else{"Red"})
Write-Host "Pages: $(if($pagesOk){'✅ TOUTES CHARGÉES'}else{'❌ CERTAINES ERREURS'})" -ForegroundColor $(if($pagesOk){"Green"}else{"Red"})

$allOk = $portsOk -and $httpOk -and $wsOk -and $pagesOk

Write-Host "`n🎯 RÉSULTAT GLOBAL: $(if($allOk){'✅ TOUS LES TESTS RÉUSSIS'}else{'❌ CERTAINS TESTS ÉCHOUÉS'})" -ForegroundColor $(if($allOk){"Green"}else{"Red"})

if ($allOk) {
    Write-Host "`n🚀 Vous pouvez maintenant tester les fonctionnalités:" -ForegroundColor Green
    Write-Host "   • Ouvrez http://localhost:3015/live-shopping-vendor-test dans un onglet" -ForegroundColor Cyan
    Write-Host "   • Ouvrez http://localhost:3015/live-shopping-client-test dans un autre onglet" -ForegroundColor Cyan
    Write-Host "   • Testez le chat, les appels audio et la sélection de produits" -ForegroundColor Cyan
} else {
    Write-Host "`n⚠️  CERTAINS PROBLÈMES DÉTECTÉS:" -ForegroundColor Red
    Write-Host "   • Vérifiez que tous les serveurs sont démarrés" -ForegroundColor Yellow
    Write-Host "   • Exécutez: node api/servers/live-shopping-chat-server.js" -ForegroundColor Yellow
    Write-Host "   • Exécutez: node api/servers/webrtc-websocket-server-3008.js" -ForegroundColor Yellow
    Write-Host "   • Exécutez: npm run dev -- --port 3015" -ForegroundColor Yellow
}

Write-Host "`n"