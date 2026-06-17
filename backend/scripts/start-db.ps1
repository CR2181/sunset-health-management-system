$ErrorActionPreference = "Stop"

$backendRoot = Split-Path -Parent $PSScriptRoot
$runtimeRoot = Join-Path $backendRoot ".runtime"
$base = Join-Path $runtimeRoot "mariadb\mariadb-11.4.12-winx64"
$data = Join-Path $runtimeRoot "mariadb-data"
$outLog = Join-Path $runtimeRoot "mariadb.out.log"
$errLog = Join-Path $runtimeRoot "mariadb.err.log"

if (-not (Test-Path (Join-Path $base "bin\mariadbd.exe"))) {
  throw "MariaDB runtime was not found at $base"
}

$existing = Get-CimInstance Win32_Process |
  Where-Object { $_.Name -match "mariadbd|mysqld" -and $_.CommandLine -like "*$data*" }

if (-not $existing) {
  Start-Process `
    -FilePath (Join-Path $base "bin\mariadbd.exe") `
    -ArgumentList @("--defaults-file=$data\my.ini", "--basedir=$base", "--datadir=$data", "--port=3306", "--bind-address=127.0.0.1", "--console") `
    -RedirectStandardOutput $outLog `
    -RedirectStandardError $errLog `
    -WindowStyle Hidden
}

$client = Join-Path $base "bin\mariadb.exe"
for ($i = 1; $i -le 40; $i++) {
  Start-Sleep -Milliseconds 500
  & $client --user=root --password=root --host=localhost --protocol=tcp --port=3306 -e "SELECT 1" *> $null
  if ($LASTEXITCODE -eq 0) {
    Write-Host "MariaDB is running on localhost:3306"
    exit 0
  }
}

throw "MariaDB did not become ready. See $errLog"
