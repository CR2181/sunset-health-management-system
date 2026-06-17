$ErrorActionPreference = "Stop"

$backendRoot = Split-Path -Parent $PSScriptRoot
Push-Location $backendRoot
try {
  if (-not (Test-Path "dist\main.js")) {
    npm run build
  }

  $existing = Get-CimInstance Win32_Process |
    Where-Object { $_.Name -eq "node.exe" -and $_.CommandLine -like "*dist\main.js*" }

  if ($existing) {
    Write-Host "NestJS backend is already running."
    exit 0
  }

  $runtimeRoot = Join-Path $backendRoot ".runtime"
  New-Item -ItemType Directory -Force -Path $runtimeRoot | Out-Null

  Start-Process `
    -FilePath "node" `
    -ArgumentList @("dist\main.js") `
    -WorkingDirectory $backendRoot `
    -RedirectStandardOutput (Join-Path $runtimeRoot "nest.out.log") `
    -RedirectStandardError (Join-Path $runtimeRoot "nest.err.log") `
    -WindowStyle Hidden

  Write-Host "NestJS backend started at http://127.0.0.1:3000"
} finally {
  Pop-Location
}
