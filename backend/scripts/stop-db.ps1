$backendRoot = Split-Path -Parent $PSScriptRoot
$data = Join-Path $backendRoot ".runtime\mariadb-data"

Get-CimInstance Win32_Process |
  Where-Object { $_.Name -match "mariadbd|mysqld" -and $_.CommandLine -like "*$data*" } |
  ForEach-Object { Stop-Process -Id $_.ProcessId -Force }

Write-Host "MariaDB stopped."
