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

$health = Invoke-Api -Path "/api/health"
if ($health.data.status -ne "ok" -or $health.data.database -ne "up") {
  throw "Health check failed."
}

$login = Invoke-Api -Path "/api/auth/login" -Method "POST" -Body @{
  email = "admin@yian.local"
  password = "admin123"
}
$token = $login.data.accessToken
if (-not $token) {
  throw "Login did not return an access token."
}

$dashboard = Invoke-Api -Path "/api/dashboard/data" -Token $token
if (-not $dashboard.data.residents -or -not $dashboard.data.alerts -or -not $dashboard.data.devices) {
  throw "Dashboard data is incomplete."
}

$deviceId = $dashboard.data.devices[0].id
$device = Invoke-Api -Path "/api/devices/$deviceId/heartbeat" -Method "PATCH" -Token $token -Body @{
  status = "online"
  batteryLevel = 91
}

$alertId = $dashboard.data.alerts[0].id
$alert = Invoke-Api -Path "/api/alerts/$alertId/ack" -Method "PATCH" -Token $token -Body @{
  responderName = "smoke-test"
}

$taskId = $dashboard.data.tasks[0].id
$task = Invoke-Api -Path "/api/care-tasks/$taskId/status" -Method "PATCH" -Token $token -Body @{
  status = "in_progress"
  operatorName = "smoke-test"
  note = "smoke test status update"
}

$aiEvent = Invoke-Api -Path "/api/ai-events" -Method "POST" -Token $token -Body @{
  eventType = "fall_detected"
  cameraCode = "CAM-SMOKE-001"
  residentCode = "RES-SMOKE"
  location = "pilot-area"
  level = "high"
  confidence = 0.9
  evidence = @{ source = "smoke-test" }
}
$aiReview = Invoke-Api -Path "/api/ai-events/$($aiEvent.data.id)/review" -Method "PATCH" -Token $token -Body @{
  status = "confirmed"
  reviewedBy = "smoke-test"
  reviewNote = "smoke test review"
}

[pscustomobject]@{
  health = $health.data.status
  database = $health.data.database
  deviceStatus = $device.data.status
  alertStatus = $alert.data.status
  taskStatus = $task.data.status
  aiReviewStatus = $aiReview.data.status
} | ConvertTo-Json -Depth 4
