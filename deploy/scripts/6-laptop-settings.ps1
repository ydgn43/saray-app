<#
 Makes the laptop behave like a small server: never sleeps while plugged in, keeps running
 with the lid closed (on power), screen may still switch off.
 Run in PowerShell "as Administrator":  .\deploy\scripts\6-laptop-settings.ps1
 IMPORTANT: the charger must stay plugged in.
#>
$ErrorActionPreference = 'Stop'

$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) { throw 'Open PowerShell with "Run as administrator" and try again.' }

powercfg /change standby-timeout-ac 0      # never sleep when plugged in
powercfg /change hibernate-timeout-ac 0    # never hibernate when plugged in
powercfg /change disk-timeout-ac 0         # never switch the disk off
powercfg /change monitor-timeout-ac 10     # screen off after 10 minutes is fine
# Closing the lid while plugged in: do nothing
powercfg /setacvalueindex SCHEME_CURRENT SUB_BUTTONS LIDACTION 0
powercfg /setactive SCHEME_CURRENT

Write-Host 'Power settings applied (plugged in: no sleep, no hibernate, lid close does nothing).'
Write-Host 'Still to do by hand: Settings > Windows Update > Advanced options > set Active hours so restarts do not happen during the day.'
