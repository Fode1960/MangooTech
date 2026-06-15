param(
  [int]$Port = 3015,
  [string]$IpAddress = ""
)

$ErrorActionPreference = "Stop"

function Get-PrivateIPv4 {
  $candidate = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
    Where-Object {
      $_.IPAddress -like "192.168.*" -or
      $_.IPAddress -like "10.*" -or
      $_.IPAddress -like "172.*"
    } |
    Select-Object -First 1
  if ($candidate) {
    return [string]$candidate.IPAddress
  }
  return "127.0.0.1"
}

$repoRoot = Split-Path -Parent $PSScriptRoot
$certDir = Join-Path $repoRoot "tools\dev-https"
$null = New-Item -ItemType Directory -Path $certDir -Force

if ([string]::IsNullOrWhiteSpace($IpAddress)) {
  $IpAddress = Get-PrivateIPv4
}

$san = "2.5.29.17={text}DNS=localhost&IPAddress=127.0.0.1&IPAddress=$IpAddress"
$subject = "CN=Mangoo Local Dev"
$passwordPlain = "mangoo-local-dev"
$password = ConvertTo-SecureString -String $passwordPlain -Force -AsPlainText

$pfxPath = Join-Path $certDir "mangoo-local-dev.pfx"
$cerPath = Join-Path $certDir "mangoo-local-dev.cer"

$cert = New-SelfSignedCertificate `
  -Subject $subject `
  -FriendlyName "Mangoo Local Dev HTTPS" `
  -CertStoreLocation "Cert:\CurrentUser\My" `
  -KeyAlgorithm RSA `
  -KeyLength 2048 `
  -HashAlgorithm sha256 `
  -NotAfter (Get-Date).AddYears(2) `
  -TextExtension @($san)

Export-PfxCertificate -Cert $cert -FilePath $pfxPath -Password $password | Out-Null
Export-Certificate -Cert $cert -FilePath $cerPath | Out-Null

$env:DEV_HTTPS = "1"
$env:DEV_HTTPS_PFX = $pfxPath
$env:DEV_HTTPS_PFX_PASS = $passwordPlain

Write-Host ""
Write-Host "HTTPS local pret."
Write-Host "Certificat iPhone/iPad a installer si besoin :" $cerPath
Write-Host "URL PC :" ("https://localhost:{0}/" -f $Port)
Write-Host "URL Wi-Fi mobile :" ("https://{0}:{1}/" -f $IpAddress, $Port)
Write-Host ""

Push-Location $repoRoot
try {
  npx vite --port $Port --strictPort --host 0.0.0.0
} finally {
  Pop-Location
}
