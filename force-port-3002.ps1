# Script simple pour ouvrir le port 3001
Write-Host 'Correction du port 3001' -ForegroundColor Green

# Arreter les processus sur port 3001
Write-Host 'Arret processus port 3001...' -ForegroundColor Yellow
$proc3002 = netstat -ano | Select-String ':3001 '
if ($proc3002) {
    foreach ($line in $proc3002) {
        $parts = $line.ToString().Split(' ', [System.StringSplitOptions]::RemoveEmptyEntries)
        if ($parts.Length -ge 5) {
            $processId = $parts[-1]
             if ($processId -match '^[0-9]+$') {
                 Write-Host "Arret PID $processId" -ForegroundColor Red
                 Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
            }
        }
    }
}

# Arreter les processus sur port 3003
Write-Host 'Arret processus port 3003...' -ForegroundColor Yellow
$proc3003 = netstat -ano | Select-String ':3003 '
if ($proc3003) {
    foreach ($line in $proc3003) {
        $parts = $line.ToString().Split(' ', [System.StringSplitOptions]::RemoveEmptyEntries)
        if ($parts.Length -ge 5) {
            $processId2 = $parts[-1]
             if ($processId2 -match '^[0-9]+$') {
                 Write-Host "Arret PID $processId2" -ForegroundColor Red
                 Stop-Process -Id $processId2 -Force -ErrorAction SilentlyContinue
            }
        }
    }
}

# Vider cache DNS
Write-Host 'Vidage cache DNS...' -ForegroundColor Yellow
ipconfig /flushdns | Out-Null

# Ouvrir URL
$url = 'http://localhost:3001/dashboard?payment=success&pack=209a0b6e-7888-41a3-9cd1-45907705261a'
Write-Host 'Ouverture URL...' -ForegroundColor Green
Start-Process $url

Write-Host 'Termine!' -ForegroundColor Green
Write-Host 'Appuyez sur une touche...' -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')