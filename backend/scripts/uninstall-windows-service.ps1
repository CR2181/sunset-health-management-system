$ErrorActionPreference = "Stop"

$identity = [Security.Principal.WindowsIdentity]::GetCurrent()
$principal = New-Object Security.Principal.WindowsPrincipal($identity)
if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
  throw "Please run this script in an Administrator PowerShell terminal."
}

$serviceName = "SunsetHealthMariaDB"
$taskName = "SunsetHealthBackend"

Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue

Get-CimInstance Win32_Process |
  Where-Object { $_.Name -eq "node.exe" -and $_.CommandLine -like "*dist\main.js*" } |
  ForEach-Object { Stop-Process -Id $_.ProcessId -Force }

$service = Get-Service -Name $serviceName -ErrorAction SilentlyContinue
if ($service) {
  if ($service.Status -ne "Stopped") {
    Stop-Service -Name $serviceName -Force
  }
  sc.exe delete $serviceName | Out-Null
}

Write-Host "Removed $serviceName and $taskName."
