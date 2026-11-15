<#
 Installs the packages and builds the web app for this laptop's public address.
   .\deploy\scripts\3-build.ps1
 Run it again after every update of the code (update.ps1 does that for you).
 The public address is read from backend\config.env (FRONTEND_URL), because the web app
 has the address of its server built in when it is built.
#>
$ErrorActionPreference = 'Stop'

$repo = Resolve-Path (Join-Path $PSScriptRoot '..\..')
$cfg  = Join-Path $repo 'backend\config.env'
if (-not (Test-Path $cfg)) { throw "backend\config.env not found. Run 1-create-config.ps1 first." }

$line = Get-Content $cfg | Where-Object { $_ -match '^FRONTEND_URL=' } | Select-Object -First 1
$url  = $line.Substring('FRONTEND_URL='.Length).Trim()
if ($url -notmatch '^https://[^/\s]+$') { throw "FRONTEND_URL in config.env is not a valid https address: $url" }

function Invoke-Checked([string]$what, [scriptblock]$block) {
    Write-Host "== $what"
    & $block
    if ($LASTEXITCODE -ne 0) { throw "$what failed (exit code $LASTEXITCODE)" }
}

Push-Location (Join-Path $repo 'backend')
Invoke-Checked 'Backend packages' { npm ci }
Pop-Location

Push-Location (Join-Path $repo 'frontend')
Invoke-Checked 'Frontend packages' { npm ci }
$env:REACT_APP_API_BASE_URL = $url   # used by the normal requests (src\config.js)
$env:REACT_APP_BACKEND_URL  = $url   # used by the live connection / websocket (src\websocket\SocketProvider.tsx)
$env:CI = 'false'          # do not turn warnings into errors
Invoke-Checked "Frontend build for $url" { npm run build }
Pop-Location

Write-Host "Done. The web app is in frontend\build and is built for $url"
