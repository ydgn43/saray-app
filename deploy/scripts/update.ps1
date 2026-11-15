<#
 Brings the laptop to the newest code of the branch and restarts the app.
 Run in PowerShell "as Administrator" from the repository folder:
   .\deploy\scripts\update.ps1 -SecondLocation E:\saray-backups
 It makes a backup first, so the second location is required.
 Database changes (new files in db\migrations) are NOT applied automatically.
 When a release needs one, it is announced in the release notes and you run it by hand
 after a backup.
#>
param(
    [Parameter(Mandatory = $true)][string]$SecondLocation
)
$ErrorActionPreference = 'Stop'
$repo = Resolve-Path (Join-Path $PSScriptRoot '..\..')
Set-Location $repo

& (Join-Path $PSScriptRoot 'backup.ps1') -SecondLocation $SecondLocation

git pull --ff-only
if ($LASTEXITCODE -ne 0) { throw 'git pull failed. Nothing was restarted.' }

Stop-ScheduledTask -TaskName 'SarayApp' -ErrorAction SilentlyContinue
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

& (Join-Path $PSScriptRoot '3-build.ps1')

Start-ScheduledTask -TaskName 'SarayApp'
Write-Host 'Updated and restarted. Check: http://localhost:3001/health'
