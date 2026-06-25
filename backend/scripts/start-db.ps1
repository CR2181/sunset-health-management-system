$ErrorActionPreference = "Stop"

$backendRoot = Split-Path -Parent $PSScriptRoot
$runtimeRoot = Join-Path $backendRoot ".runtime"
$base = Join-Path $runtimeRoot "mariadb\mariadb-11.4.12-winx64"
$data = Join-Path $runtimeRoot "mariadb-data"
$outLog = Join-Path $runtimeRoot "mariadb.out.log"
$errLog = Join-Path $runtimeRoot "mariadb.err.log"
$pidFile = Join-Path $runtimeRoot "mariadb.pid"

function Get-ListenerProcessId([int]$Port) {
  foreach ($line in (netstat -ano)) {
    if ($line -match "^\s*TCP\s+\S+:$Port\s+\S+\s+LISTENING\s+(\d+)\s*$") {
      return [int]$Matches[1]
    }
  }
  return $null
}

if (-not (Test-Path (Join-Path $base "bin\mariadbd.exe"))) {
  throw "MariaDB runtime was not found at $base"
}

$client = Join-Path $base "bin\mariadb.exe"
$dbUser = "root"
$dbPassword = "root"
$envFile = Join-Path $backendRoot ".env"
if (Test-Path $envFile) {
  foreach ($line in Get-Content $envFile) {
    if ($line -match '^DB_USERNAME=(.*)$') { $dbUser = $Matches[1].Trim() }
    if ($line -match '^DB_PASSWORD=(.*)$') { $dbPassword = $Matches[1].Trim() }
  }
}

& $client "--user=$dbUser" "--password=$dbPassword" --host=127.0.0.1 --protocol=tcp --port=3306 --ssl=OFF -e "SELECT 1" *> $null
if ($LASTEXITCODE -eq 0) {
  $listenerId = Get-ListenerProcessId 3306
  $databaseProcess = if ($listenerId) { Get-Process -Id $listenerId -ErrorAction SilentlyContinue } else { $null }
  $expectedPath = Join-Path $base "bin\mariadbd.exe"
  if (-not $databaseProcess -or $databaseProcess.Path -ne $expectedPath) {
    throw "Port 3306 is healthy but is not owned by this project's MariaDB runtime."
  }
  $listenerId | Set-Content -Encoding ascii $pidFile
  Write-Host "MariaDB is already running on 127.0.0.1:3306"
  exit 0
}

if (Test-Path $pidFile) { Remove-Item -LiteralPath $pidFile -Force }
$process = Start-Process `
    -FilePath (Join-Path $base "bin\mariadbd.exe") `
    -ArgumentList @("--defaults-file=$data\my.ini", "--basedir=$base", "--datadir=$data", "--port=3306", "--bind-address=127.0.0.1", "--console") `
    -RedirectStandardOutput $outLog `
    -RedirectStandardError $errLog `
    -WindowStyle Hidden `
    -PassThru
$process.Id | Set-Content -Encoding ascii $pidFile

for ($i = 1; $i -le 40; $i++) {
  Start-Sleep -Milliseconds 500
  & $client "--user=$dbUser" "--password=$dbPassword" --host=127.0.0.1 --protocol=tcp --port=3306 --ssl=OFF -e "SELECT 1" *> $null
  if ($LASTEXITCODE -eq 0) {
    Write-Host "MariaDB is running on localhost:3306"
    exit 0
  }
}

throw "MariaDB did not become ready. See $errLog"
