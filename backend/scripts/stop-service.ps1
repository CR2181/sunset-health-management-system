$backendRoot = Split-Path -Parent $PSScriptRoot
$pidFile = Join-Path $backendRoot ".runtime\nest.pid"

if (Test-Path $pidFile) {
  $processId = [int](Get-Content $pidFile -Raw)
  Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
  Remove-Item -LiteralPath $pidFile -Force
}

& (Join-Path $PSScriptRoot "stop-db.ps1")

Write-Host "Sunset Health service stopped."
