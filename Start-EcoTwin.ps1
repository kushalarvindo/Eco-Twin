param([switch]$Demo)
$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
$pythonPath = Join-Path $PSScriptRoot '.venv\Scripts\python.exe'
if (-not (Test-Path -LiteralPath $pythonPath)) { throw 'Install dependencies using README.md first.' }
& $pythonPath backend/manage.py migrate
if ($LASTEXITCODE -ne 0) { throw 'Database migration failed.' }
if ($Demo) { & $pythonPath backend/manage.py seed --demo } else { & $pythonPath backend/manage.py seed }
if ($LASTEXITCODE -ne 0) { throw 'Campus seed failed.' }
$logPath = Join-Path $PSScriptRoot '.local'
New-Item -ItemType Directory -Force -Path $logPath | Out-Null
foreach ($port in @(8000, 5173)) {
  if (Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue) { throw "Port $port is already in use. Close the existing ECO-TWIN server or use its URL." }
}
$apiProcess = Start-Process -FilePath $pythonPath -ArgumentList 'backend/manage.py','runserver','127.0.0.1:8000','--noreload' -WorkingDirectory $PSScriptRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $logPath 'api.log') -RedirectStandardError (Join-Path $logPath 'api-error.log') -PassThru
$nodePath = (Get-Command node).Source
$webProcess = Start-Process -FilePath $nodePath -ArgumentList 'node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','5173','--strictPort' -WorkingDirectory $PSScriptRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $logPath 'web.log') -RedirectStandardError (Join-Path $logPath 'web-error.log') -PassThru
@{api=$apiProcess.Id;web=$webProcess.Id} | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $logPath 'server-pids.json')
$available=$false
for ($attempt=0; $attempt -lt 20; $attempt++) {
  try {
    $apiCheck=Invoke-WebRequest 'http://127.0.0.1:8000/api/session/' -TimeoutSec 2
    $webCheck=Invoke-WebRequest 'http://127.0.0.1:5173/' -TimeoutSec 2
    if ($apiCheck.StatusCode -eq 200 -and $webCheck.StatusCode -eq 200) {$available=$true;break}
  } catch { Start-Sleep -Milliseconds 500 }
}
if (-not $available) { throw 'Server startup did not pass HTTP checks. Inspect .local logs.' }
Write-Host 'ECO-TWIN is ready: http://127.0.0.1:5173/'
Write-Host "Started process IDs: API $($apiProcess.Id), web $($webProcess.Id). Close only these processes when finished."
