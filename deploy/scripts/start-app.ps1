<#
 Starts the backend (which also serves the web app) and restarts it if it ever stops.
 Normally started by the scheduled task "SarayApp" at boot (see 4-register-startup.ps1).
 You can also run it by hand to see what happens:  .\deploy\scripts\start-app.ps1
 Output goes to C:\saray-data\logs\app-YYYY-MM-DD.log
#>
$ErrorActionPreference = 'Continue'

$repo    = Resolve-Path (Join-Path $PSScriptRoot '..\..')
$backend = Join-Path $repo 'backend'
$logDir  = 'C:\saray-data\logs'
New-Item -ItemType Directory -Force -Path $logDir | Out-Null

# Delete logs older than 30 days
Get-ChildItem $logDir -Filter 'app-*.log' | Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-30) } | Remove-Item -Force -ErrorAction SilentlyContinue

Set-Location $backend
while ($true) {
    $log = Join-Path $logDir ("app-{0:yyyy-MM-dd}.log" -f (Get-Date))
    "[{0:u}] starting" -f (Get-Date) | Out-File -FilePath $log -Append -Encoding utf8
    # cmd handles the redirect so the log stays readable and keeps growing
    cmd /c "node node_modules\ts-node\dist\bin.js app.ts >> `"$log`" 2>&1"
    "[{0:u}] stopped (exit code {1}), restarting in 10 seconds" -f (Get-Date), $LASTEXITCODE | Out-File -FilePath $log -Append -Encoding utf8
    Start-Sleep -Seconds 10
}
