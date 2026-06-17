$backendRoot = Split-Path -Parent $PSScriptRoot

Get-CimInstance Win32_Process |
  Where-Object { $_.Name -eq "node.exe" -and $_.CommandLine -like "*dist\main.js*" } |
  ForEach-Object { Stop-Process -Id $_.ProcessId -Force }

& (Join-Path $PSScriptRoot "stop-db.ps1")

Write-Host "Sunset Health service stopped."
