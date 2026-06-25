$ErrorActionPreference = "Stop"

$backendRoot = Split-Path -Parent $PSScriptRoot
& (Join-Path $PSScriptRoot "start-db.ps1")

function Get-ListenerProcessId([int]$Port) {
  foreach ($line in (netstat -ano)) {
    if ($line -match "^\s*TCP\s+\S+:$Port\s+\S+\s+LISTENING\s+(\d+)\s*$") {
      return [int]$Matches[1]
    }
  }
  return $null
}

Push-Location $backendRoot
try {
  npm run build

  $pidFile = Join-Path $backendRoot ".runtime\nest.pid"
  if (Test-Path $pidFile) {
    $existingId = [int](Get-Content $pidFile -Raw)
    if ((Get-Process -Id $existingId -ErrorAction SilentlyContinue) -and (Get-ListenerProcessId 3000) -eq $existingId) {
      Write-Host "Sunset Health service is already running with PID $existingId"
      exit 0
    }
    Remove-Item -LiteralPath $pidFile -Force
  }

  $unmanagedListenerId = Get-ListenerProcessId 3000
  if ($unmanagedListenerId) {
    throw "Port 3000 is already used by unmanaged PID $unmanagedListenerId. Stop or identify it before starting this project."
  }

  $outLog = Join-Path $backendRoot ".runtime\nest.out.log"
  $errLog = Join-Path $backendRoot ".runtime\nest.err.log"
  $process = Start-Process `
    -FilePath "node" `
    -ArgumentList @("dist\main.js") `
    -WorkingDirectory $backendRoot `
    -RedirectStandardOutput $outLog `
    -RedirectStandardError $errLog `
    -WindowStyle Hidden `
    -PassThru
  $process.Id | Set-Content -Encoding ascii $pidFile

  for ($i = 1; $i -le 40; $i++) {
    Start-Sleep -Milliseconds 500
    if ($process.HasExited) { throw "NestJS exited before becoming ready. See $errLog" }
    try {
      $health = Invoke-RestMethod -Uri "http://127.0.0.1:3000/api/health" -TimeoutSec 2
      if ($health.data.status -eq "ok" -and $health.data.database -eq "up") {
        $listenerId = Get-ListenerProcessId 3000
        if ($listenerId -ne $process.Id) {
          throw "Health response came from PID $listenerId instead of the new project PID $($process.Id)."
        }
        Write-Host "Sunset Health service is ready at http://127.0.0.1:3000"
        exit 0
      }
    } catch {
      if ($process.HasExited) { throw "NestJS exited before becoming ready. See $errLog" }
    }
  }
  throw "NestJS did not become ready. See $errLog"
} finally {
  Pop-Location
}
