$ErrorActionPreference = "Stop"

$BaseUrl = if ($env:SMOKE_BASE_URL) { $env:SMOKE_BASE_URL } else { "http://127.0.0.1:3000" }
$RunId = [DateTimeOffset]::Now.ToUnixTimeMilliseconds()
$PublicCorridorPurpose = -join ([char[]](0x516C, 0x5171, 0x8D70, 0x5ECA))

function Invoke-Api {
  param(
    [Parameter(Mandatory = $true)][string]$Path,
    [string]$Method = "GET",
    [object]$Body = $null,
    [string]$Token = ""
  )
  $params = @{ Method = $Method; Uri = "$BaseUrl$Path"; Headers = @{} }
  if ($Token) { $params.Headers.Authorization = "Bearer $Token" }
  if ($null -ne $Body) {
    $params.ContentType = "application/json; charset=utf-8"
    $params.Body = $Body | ConvertTo-Json -Depth 8
  }
  Invoke-RestMethod @params
}

function Login([string]$Email, [string]$Password) {
  $result = Invoke-Api -Path "/api/auth/login" -Method "POST" -Body @{ email = $Email; password = $Password }
  if (-not $result.data.accessToken) { throw "Login failed for $Email" }
  $result.data.accessToken
}

function Assert-True([bool]$Condition, [string]$Message) {
  if (-not $Condition) { throw $Message }
}

function Assert-Forbidden([scriptblock]$Action, [string]$Message) {
  $denied = $false
  try { & $Action | Out-Null } catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 403) { $denied = $true } else { throw }
  }
  if (-not $denied) { throw $Message }
}

$health = Invoke-Api -Path "/api/health"
Assert-True ($health.data.status -eq "ok" -and $health.data.database -eq "up") "Health check failed."

$admin = Login "admin@yian.local" "admin123"
$director = Login "director@yian.local" "director123"
$nurse = Login "nurse@yian.local" "nurse123"
$deviceManager = Login "device@yian.local" "device123"
$rehab = Login "rehab@yian.local" "rehab123"
$family = Login "family@yian.local" "family123"
$visitor = Login "visitor@yian.local" "visitor123"

$nurseDevices = (Invoke-Api -Path "/api/devices" -Token $nurse).data
$nurseCameras = (Invoke-Api -Path "/api/cameras" -Token $nurse).data
Assert-True ($nurseDevices.Count -gt 0 -and $nurseCameras.Count -gt 0) "Nurse could not read the device management ledgers."
Assert-True (($nurseCameras | ConvertTo-Json -Depth 8) -notmatch "camera\.local|@|/4f-corridor") "Sanitized camera ledger leaked RTSP details."
Assert-Forbidden { Invoke-Api -Path "/api/device-events" -Token $nurse } "Nurse accessed device event ingestion."
Assert-Forbidden { Invoke-Api -Path "/api/device-events" -Token $deviceManager } "Device manager accessed device event ingestion."
$deviceDashboard = (Invoke-Api -Path "/api/dashboard/data" -Token $deviceManager).data
Assert-True ($deviceDashboard.residents.Count -eq 0 -and $deviceDashboard.alerts.Count -eq 0 -and $deviceDashboard.devices.Count -gt 0) "Device manager dashboard scope leaked business data."

$adminResidents = (Invoke-Api -Path "/api/residents" -Token $admin).data
$nurseResidents = (Invoke-Api -Path "/api/residents" -Token $nurse).data
$familyResidents = (Invoke-Api -Path "/api/residents" -Token $family).data
Assert-True (($nurseResidents | Where-Object { $_.businessCode -notin @("RES-001", "RES-002") }).Count -eq 0) "Nurse resident scope leaked."
Assert-True ($familyResidents.Count -gt 0 -and ($familyResidents | Where-Object { $_.businessCode -ne "RES-001" }).Count -eq 0) "Family resident scope leaked."
Assert-Forbidden { Invoke-Api -Path "/api/residents" -Token $visitor } "Visitor accessed residents."

$resident1 = $adminResidents | Where-Object businessCode -eq "RES-001" | Select-Object -First 1
$resident2 = $adminResidents | Where-Object businessCode -eq "RES-002" | Select-Object -First 1
$createdResident = (Invoke-Api -Path "/api/residents" -Method "POST" -Token $admin -Body @{ name = "SMOKE Resident $RunId"; age = 70; room = "TEST-001"; risk = "smoke-test"; status = "active" }).data
Assert-True ($createdResident.id -and $createdResident.name -eq "SMOKE Resident $RunId") "Resident create did not persist."
Invoke-Api -Path "/api/residents/$($resident1.id)" -Method "PATCH" -Token $nurse -Body @{ careSummary = "SMOKE care summary $RunId" } | Out-Null
Invoke-Api -Path "/api/residents/$($resident2.id)" -Method "PATCH" -Token $rehab -Body @{ rehabSummary = "SMOKE rehab summary $RunId" } | Out-Null
Assert-Forbidden { Invoke-Api -Path "/api/residents/$($resident1.id)" -Method "PATCH" -Token $nurse -Body @{ name = "forbidden" } } "Nurse changed resident identity fields."

$care = (Invoke-Api -Path "/api/care-tasks" -Method "POST" -Token $admin -Body @{ title = "SMOKE care $RunId"; residentCode = "RES-001"; room = "SMOKE-ROOM"; assigneeName = "smoke"; status = "pending" }).data
$careEdit = (Invoke-Api -Path "/api/care-tasks/$($care.id)" -Method "PATCH" -Token $admin -Body @{ room = "SMOKE-EDITED" }).data
Invoke-Api -Path "/api/care-tasks/$($care.id)/status" -Method "PATCH" -Token $nurse -Body @{ status = "in_progress"; note = "smoke started" } | Out-Null
$careDone = (Invoke-Api -Path "/api/care-tasks/$($care.id)/status" -Method "PATCH" -Token $nurse -Body @{ status = "completed"; note = "smoke completed" }).data
Assert-True ($careEdit.room -eq "SMOKE-EDITED" -and $careDone.status -eq "completed") "Care task workflow failed."
Assert-Forbidden { Invoke-Api -Path "/api/care-tasks" -Token $rehab } "Rehab accessed care tasks."
Assert-Forbidden { Invoke-Api -Path "/api/care-tasks" -Method "POST" -Token $nurse -Body @{ title = "forbidden"; residentCode = "RES-003"; room = "X"; assigneeName = "X" } } "Nurse created a task outside scope."

$plan = (Invoke-Api -Path "/api/rehab-plans" -Method "POST" -Token $rehab -Body @{ residentCode = "RES-002"; title = "SMOKE plan $RunId"; goal = "MVP workflow"; startDate = "2026-06-24"; frequency = "daily" }).data
$planEdit = (Invoke-Api -Path "/api/rehab-plans/$($plan.id)" -Method "PATCH" -Token $rehab -Body @{ frequency = "weekdays" }).data
$planActive = (Invoke-Api -Path "/api/rehab-plans/$($plan.id)/status" -Method "PATCH" -Token $rehab -Body @{ status = "active" }).data
$rehabTask = (Invoke-Api -Path "/api/rehab-tasks" -Method "POST" -Token $rehab -Body @{ residentCode = "RES-002"; planCode = $plan.businessCode; title = "SMOKE rehab $RunId"; description = "private smoke detail"; scheduledDate = "2026-06-24" }).data
Invoke-Api -Path "/api/rehab-tasks/$($rehabTask.id)" -Method "PATCH" -Token $rehab -Body @{ operatorName = "smoke-rehab" } | Out-Null
Invoke-Api -Path "/api/rehab-tasks/$($rehabTask.id)/status" -Method "PATCH" -Token $rehab -Body @{ status = "in_progress" } | Out-Null
$rehabDone = (Invoke-Api -Path "/api/rehab-tasks/$($rehabTask.id)/status" -Method "PATCH" -Token $rehab -Body @{ status = "completed"; note = "smoke complete" }).data
Assert-True ($planEdit.frequency -eq "weekdays" -and $planActive.status -eq "active" -and $rehabDone.status -eq "completed") "Rehab workflow failed."
$nurseRehab = (Invoke-Api -Path "/api/rehab-tasks" -Token $nurse).data | Where-Object id -eq $rehabTask.id
Assert-True (-not ($nurseRehab.PSObject.Properties.Name -contains "description")) "Nurse received private rehab details."
Assert-Forbidden { Invoke-Api -Path "/api/rehab-tasks" -Method "POST" -Token $nurse -Body @{ residentCode = "RES-002"; title = "forbidden"; scheduledDate = "2026-06-24" } } "Nurse created a rehab task."

$normal = (Invoke-Api -Path "/api/vision/frame" -Method "POST" -Token $nurse -Body @{ sourceId = "SMOKE-NORMAL-$RunId"; location = "public test area"; residentCode = "RES-001"; imageDataUrl = "data:image/png;base64,iVBORw0KGgo=" }).data
Assert-True ($normal.events.Count -eq 0) "Mock detector fabricated an event from a normal frame."
$source = "SMOKE-VISION-$RunId"
$vision1 = (Invoke-Api -Path "/api/vision/frame" -Method "POST" -Token $nurse -Body @{ sourceId = $source; location = "public test area"; residentCode = "RES-001"; testEventType = "fall"; testConfidence = 0.91 }).data
$vision2 = (Invoke-Api -Path "/api/vision/frame" -Method "POST" -Token $nurse -Body @{ sourceId = $source; location = "public test area"; residentCode = "RES-001"; testEventType = "fall"; testConfidence = 0.93 }).data
Assert-True ($vision1.alerts[0].id -eq $vision2.alerts[0].id -and $vision2.alerts[0].action -eq "updated") "Vision alert dedupe failed."
$alertId = $vision1.alerts[0].id
Invoke-Api -Path "/api/alerts/$alertId/ack" -Method "PATCH" -Token $nurse -Body @{ responderName = "smoke-nurse" } | Out-Null
$events = (Invoke-Api -Path "/api/vision/events" -Token $nurse).data
$linkedEvent = $events | Where-Object id -eq $vision2.events[0].id
Assert-True ($linkedEvent.status -eq "confirmed") "Alert acknowledgement did not sync AI event."
Invoke-Api -Path "/api/alerts/$alertId/false-positive" -Method "PATCH" -Token $nurse -Body @{ resolutionNote = "smoke false positive" } | Out-Null
$events = (Invoke-Api -Path "/api/vision/events" -Token $nurse).data
$linkedEvent = $events | Where-Object id -eq $vision2.events[0].id
Assert-True ($linkedEvent.status -eq "false_positive") "False-positive status did not sync AI event."
Assert-Forbidden { Invoke-Api -Path "/api/vision/config" -Token $family } "Family accessed Vision configuration."

$directAi = (Invoke-Api -Path "/api/ai-events" -Method "POST" -Token $deviceManager -Body @{ eventType = "fall_detected"; externalEventId = "SMOKE-AI-$RunId"; cameraCode = "CAM-001"; residentCode = "RES-001"; location = "public smoke area"; level = "high"; confidence = 0.9; evidence = @{ source = "smoke" } }).data
$reviewedAi = (Invoke-Api -Path "/api/ai-events/$($directAi.id)/review" -Method "PATCH" -Token $nurse -Body @{ status = "confirmed"; reviewedBy = "smoke-nurse"; reviewNote = "smoke review" }).data
Assert-True ($reviewedAi.status -eq "confirmed") "Direct AI event review failed."

$seedAlert = (Invoke-Api -Path "/api/alerts" -Token $nurse).data | Select-Object -First 1
Invoke-Api -Path "/api/alerts/$($seedAlert.id)/ack" -Method "PATCH" -Token $nurse -Body @{ responderName = "smoke-nurse" } | Out-Null
$resolvedResponse = Invoke-Api -Path "/api/alerts/$($seedAlert.id)/resolve" -Method "PATCH" -Token $nurse -Body @{ resolutionNote = "smoke resolved" }
$resolvedAlert = $resolvedResponse.data
Assert-True ($resolvedAlert.status -eq "resolved") "Alert resolve did not persist."

$camera = (Invoke-Api -Path "/api/cameras" -Method "POST" -Token $deviceManager -Body @{ name = "SMOKE camera $RunId"; floor = "TEST"; area = "public area"; purpose = $PublicCorridorPurpose; accessType = "RTSP"; stream = "rtsp://smoke:secret@10.20.30.40:554/private"; status = "offline"; maskedDisplay = $true }).data
$cameraUpdated = (Invoke-Api -Path "/api/cameras/$($camera.id)" -Method "PATCH" -Token $deviceManager -Body @{ note = "SMOKE updated $RunId" }).data
$deviceCameraView = (Invoke-Api -Path "/api/cameras" -Token $deviceManager).data | Where-Object id -eq $camera.id
Assert-True ($cameraUpdated.note -eq "SMOKE updated $RunId" -and $deviceCameraView.stream -eq "rtsp://***") "Camera create, update, or sanitization failed."
Invoke-Api -Path "/api/cameras/$($camera.id)" -Method "DELETE" -Token $admin | Out-Null

$deviceEvent = (Invoke-Api -Path "/api/device-events" -Method "POST" -Token $admin -Body @{ eventType = "heartbeat_anomaly"; externalEventId = "SMOKE-DEVICE-$RunId"; sourceType = "smoke"; deviceCode = "DEV-CALL-001"; location = "public smoke area"; level = "low"; payload = @{ source = "smoke" } }).data
Assert-True ($null -ne $deviceEvent.id) "Admin device event ingestion failed."

$dashboard = (Invoke-Api -Path "/api/dashboard/data" -Token $director).data
$deviceId = $dashboard.devices[0].id
$device = (Invoke-Api -Path "/api/devices/$deviceId/heartbeat" -Method "PATCH" -Token $deviceManager -Body @{ status = "online"; batteryLevel = 91 }).data
$audit = (Invoke-Api -Path "/api/audit-logs" -Token $admin).data
Assert-True (($audit | Where-Object action -eq "vision.frame.processed").Count -gt 0) "Vision audit record missing."
Assert-True (($audit | Where-Object action -eq "auth.login").Count -ge 7) "Login audit records missing."
Assert-True (($audit | Where-Object action -eq "ai_event.review").Count -gt 0) "AI review audit record missing."
Assert-True (($audit | ConvertTo-Json -Depth 8) -notmatch "data:image") "Raw frame leaked into audit logs."

[pscustomobject]@{
  health = $health.data.status
  database = $health.data.database
  rolesLoggedIn = 7
  residentScope = "passed"
  careStatus = $careDone.status
  rehabPlanStatus = $planActive.status
  rehabTaskStatus = $rehabDone.status
  visionDedupe = "passed"
  aiStatusSync = $linkedEvent.status
  directAiReview = $reviewedAi.status
  alertResolve = $resolvedAlert.status
  deviceStatus = $device.status
  audit = "passed"
} | ConvertTo-Json -Depth 4
