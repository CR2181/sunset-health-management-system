$backendRoot = Split-Path -Parent $PSScriptRoot
$pidFile = Join-Path $backendRoot ".runtime\mariadb.pid"

if (Test-Path $pidFile) {
  $processId = [int](Get-Content $pidFile -Raw)
  Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
  Remove-Item -LiteralPath $pidFile -Force
}

Write-Host "MariaDB stopped."
