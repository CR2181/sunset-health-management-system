$ErrorActionPreference = "Stop"

$backendRoot = Split-Path -Parent $PSScriptRoot
& (Join-Path $PSScriptRoot "start-db.ps1")

Push-Location $backendRoot
try {
  if (-not (Test-Path "dist\main.js")) {
    npm run build
  }

  $existing = Get-CimInstance Win32_Process |
    Where-Object { $_.Name -eq "node.exe" -and $_.CommandLine -like "*dist\main.js*" }

  if (-not $existing) {
    $outLog = Join-Path $backendRoot ".runtime\nest.out.log"
    $errLog = Join-Path $backendRoot ".runtime\nest.err.log"
    Start-Process `
      -FilePath "node" `
      -ArgumentList @("dist\main.js") `
      -WorkingDirectory $backendRoot `
      -RedirectStandardOutput $outLog `
      -RedirectStandardError $errLog `
      -WindowStyle Hidden
  }
} finally {
  Pop-Location
}

Write-Host "Sunset Health service is starting at http://127.0.0.1:3000"
