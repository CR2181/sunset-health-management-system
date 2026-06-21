$ErrorActionPreference = "Stop"

$BaseUrl = $env:SMOKE_BASE_URL
if (-not $BaseUrl) {
  $BaseUrl = "http://127.0.0.1:3000"
}

function Invoke-Api {
  param(
    [Parameter(Mandatory = $true)][string]$Path,
    [string]$Method = "GET",
    [object]$Body = $null,
    [string]$Token = ""
  )

  $headers = @{}
  if ($Token) {
    $headers.Authorization = "Bearer $Token"
  }

  $params = @{
    Method = $Method
    Uri = "$BaseUrl$Path"
    Headers = $headers
  }

  if ($null -ne $Body) {
    $params.ContentType = "application/json; charset=utf-8"
    $params.Body = ($Body | ConvertTo-Json -Depth 8)
  }

  Invoke-RestMethod @params
}

function Assert-ApiStatus {
  param(
    [Parameter(Mandatory = $true)][string]$Path,
    [Parameter(Mandatory = $true)][int]$ExpectedStatus,
    [string]$Method = "GET",
    [object]$Body = $null,
    [string]$Token = ""
  )

  try {
    Invoke-Api -Path $Path -Method $Method -Body $Body -Token $Token | Out-Null
    throw "Expected HTTP $ExpectedStatus for $Path, but request succeeded."
  } catch {
    if (-not $_.Exception.Response -or [int]$_.Exception.Response.StatusCode -ne $ExpectedStatus) {
      throw
    }
  }
}

function Login-PilotRole {
  param([string]$Email, [string]$Password)
  $result = Invoke-Api -Path "/api/auth/login" -Method "POST" -Body @{ email = $Email; password = $Password }
  if (-not $result.data.accessToken) {
    throw "Login did not return an access token for $Email."
  }
  $result.data
}

$health = Invoke-Api -Path "/api/health"
if ($health.data.status -ne "ok" -or $health.data.database -ne "up") {
  throw "Health check failed."
}

Assert-ApiStatus -Path "/api/residents" -ExpectedStatus 401

$admin = Login-PilotRole -Email "superadmin@yian.local" -Password "admin123"
$director = Login-PilotRole -Email "director@yian.local" -Password "director123"
$nurse = Login-PilotRole -Email "nurse@yian.local" -Password "nurse123"
$family = Login-PilotRole -Email "family@yian.local" -Password "family123"
$visitor = Login-PilotRole -Email "visitor@yian.local" -Password "visitor123"

$dashboard = Invoke-Api -Path "/api/dashboard/data" -Token $admin.accessToken
$adminResidents = (Invoke-Api -Path "/api/residents" -Token $admin.accessToken).data
$nurseResidents = (Invoke-Api -Path "/api/residents" -Token $nurse.accessToken).data
$familyResidents = (Invoke-Api -Path "/api/residents" -Token $family.accessToken).data

if ($adminResidents.Count -lt 30) { throw "Pilot database must contain at least 30 residents." }
if ($nurseResidents.Count -ne 10) { throw "Nurse scope must contain exactly 10 pilot residents." }
if ($familyResidents.Count -ne 1 -or $familyResidents[0].businessCode -ne "RES-001") {
  throw "Family scope must contain only RES-001."
}
Assert-ApiStatus -Path "/api/residents" -ExpectedStatus 403 -Token $visitor.accessToken
Assert-ApiStatus -Path "/api/audit-logs" -ExpectedStatus 403 -Token $nurse.accessToken

$devices = (Invoke-Api -Path "/api/devices" -Token $admin.accessToken).data
$device = Invoke-Api -Path "/api/devices/$($devices[0].id)/heartbeat" -Method "PATCH" -Token $admin.accessToken -Body @{
  status = "online"
  batteryLevel = 91
}

$tasks = (Invoke-Api -Path "/api/care-tasks" -Token $nurse.accessToken).data
$task = Invoke-Api -Path "/api/care-tasks/$($tasks[0].id)/status" -Method "PATCH" -Token $nurse.accessToken -Body @{
  status = "in_progress"
  operatorName = "smoke-test"
  note = "试点冒烟测试"
}

$liveAlerts = (Invoke-Api -Path "/api/alerts?mode=live" -Token $nurse.accessToken).data
if ($liveAlerts.Count -gt 0) {
  $alert = Invoke-Api -Path "/api/alerts/$($liveAlerts[0].id)/ack" -Method "PATCH" -Token $nurse.accessToken -Body @{
    responderName = "smoke-test"
  }
}

$outsideResident = $adminResidents | Where-Object { $_.businessCode -eq "RES-011" } | Select-Object -First 1
Assert-ApiStatus -Path "/api/residents/$($outsideResident.id)" -ExpectedStatus 403 -Method "PATCH" -Token $nurse.accessToken -Body @{
  risk = "越权测试"
}

$audit = (Invoke-Api -Path "/api/audit-logs" -Token $director.accessToken).data
$requiredAuditActions = @("auth.login_success", "device.heartbeat", "care_task.update_status")
foreach ($action in $requiredAuditActions) {
  if (-not ($audit | Where-Object { $_.action -eq $action })) {
    throw "Missing audit action: $action"
  }
}

[pscustomobject]@{
  health = $health.data.status
  database = $health.data.database
  residents = $adminResidents.Count
  nurseResidents = $nurseResidents.Count
  familyResidents = $familyResidents.Count
  devices = $devices.Count
  deviceStatus = $device.data.status
  taskStatus = $task.data.status
  liveAlerts = $liveAlerts.Count
  auditLogs = $audit.Count
  anonymousStatus = 401
  visitorStatus = 403
  crossScopeWriteStatus = 403
} | ConvertTo-Json -Depth 4
