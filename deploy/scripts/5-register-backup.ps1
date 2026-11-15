<#
 Runs backup.ps1 every night at 03:00 (as you, even when not logged in).
   .\deploy\scripts\5-register-backup.ps1 -SecondLocation E:\saray-backups
 Run in PowerShell "as Administrator". If the laptop is off at 03:00 it runs when it is next on.
 Remove with:  Unregister-ScheduledTask -TaskName SarayBackup -Confirm:$false
#>
param(
    [Parameter(Mandatory = $true)][string]$SecondLocation
)
$ErrorActionPreference = 'Stop'

$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) { throw 'Open PowerShell with "Run as administrator" and try again.' }

$script = (Resolve-Path (Join-Path $PSScriptRoot 'backup.ps1')).Path
$action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$script`" -SecondLocation `"$SecondLocation`""
$trigger = New-ScheduledTaskTrigger -Daily -At 3:00AM
$principal = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$env:USERNAME" -LogonType S4U -RunLevel Limited
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries

Register-ScheduledTask -TaskName 'SarayBackup' -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Force | Out-Null
Write-Host 'Task "SarayBackup" registered (every night 03:00). Test it now with:  Start-ScheduledTask -TaskName SarayBackup'
