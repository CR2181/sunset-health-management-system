$ErrorActionPreference = "Stop"

$identity = [Security.Principal.WindowsIdentity]::GetCurrent()
$principal = New-Object Security.Principal.WindowsPrincipal($identity)
if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
  throw "Please run this script in an Administrator PowerShell terminal."
}

$backendRoot = Split-Path -Parent $PSScriptRoot
$runtimeRoot = Join-Path $backendRoot ".runtime"
$mariaBase = Join-Path $runtimeRoot "mariadb\mariadb-11.4.12-winx64"
$mariaData = Join-Path $runtimeRoot "mariadb-data"
$mariaExe = Join-Path $mariaBase "bin\mariadbd.exe"
$serviceName = "SunsetHealthMariaDB"
$taskName = "SunsetHealthBackend"

if (-not (Test-Path $mariaExe)) {
  throw "MariaDB runtime was not found at $mariaExe"
}

Get-CimInstance Win32_Process |
  Where-Object { $_.Name -match "mariadbd|mysqld" -and $_.CommandLine -like "*$mariaData*" } |
  ForEach-Object { Stop-Process -Id $_.ProcessId -Force }

$existingService = Get-Service -Name $serviceName -ErrorAction SilentlyContinue
if (-not $existingService) {
  & $mariaExe --install $serviceName "--defaults-file=$mariaData\my.ini"
  if ($LASTEXITCODE -ne 0) {
    throw "Failed to install $serviceName."
  }
}

Set-Service -Name $serviceName -StartupType Automatic
Start-Service -Name $serviceName

$startNestScript = Join-Path $PSScriptRoot "start-nest-only.ps1"
$taskAction = New-ScheduledTaskAction `
  -Execute "powershell.exe" `
  -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$startNestScript`""
$taskTrigger = New-ScheduledTaskTrigger -AtLogOn
$taskSettings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -ExecutionTimeLimit (New-TimeSpan -Hours 0)
$taskPrincipal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Highest

Register-ScheduledTask `
  -TaskName $taskName `
  -Action $taskAction `
  -Trigger $taskTrigger `
  -Settings $taskSettings `
  -Principal $taskPrincipal `
  -Force | Out-Null

Start-ScheduledTask -TaskName $taskName
Start-Sleep -Seconds 4

Write-Host "Installed Windows service: $serviceName"
Write-Host "Installed startup task: $taskName"
Write-Host "Open http://127.0.0.1:3000"
