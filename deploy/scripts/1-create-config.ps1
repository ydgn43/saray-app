<#
 Creates backend\config.env for this laptop.
 Usage (PowerShell, from the repository folder):
   .\deploy\scripts\1-create-config.ps1 -PublicUrl https://my-laptop.tail1234.ts.net
 It fills in: a random database password, a fresh random JWT secret, the public address.
 It refuses to overwrite an existing backend\config.env.
#>
param(
    [Parameter(Mandatory = $true)][string]$PublicUrl
)
$ErrorActionPreference = 'Stop'

$repo   = Resolve-Path (Join-Path $PSScriptRoot '..\..')
$target = Join-Path $repo 'backend\config.env'
$source = Join-Path $repo 'deploy\config.env.example'

if (Test-Path $target) { throw "backend\config.env already exists. Delete it yourself first if you really want a new one (this also changes the secrets)." }
if ($PublicUrl -notmatch '^https://[^/\s]+$') { throw "PublicUrl must look like https://name.example.com (https, no slash at the end)." }

function New-RandomHex([int]$bytes) {
    $b = New-Object byte[] $bytes
    [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b)
    return (($b | ForEach-Object { $_.ToString('x2') }) -join '')
}

$text = Get-Content $source -Raw
$text = $text -replace '(?m)^PASSWORD_RELATIONAL_DB=AUTO', ('PASSWORD_RELATIONAL_DB=' + (New-RandomHex 16))
$text = $text -replace '(?m)^JWT_SECRET=AUTO',             ('JWT_SECRET=' + (New-RandomHex 32))
$text = $text -replace '(?m)^ALLOWED_ORIGINS=AUTO',        ('ALLOWED_ORIGINS=' + $PublicUrl)
$text = $text -replace '(?m)^FRONTEND_URL=AUTO',           ('FRONTEND_URL=' + $PublicUrl)

# UTF-8 without BOM, so dotenv reads the first line correctly
[System.IO.File]::WriteAllText($target, $text, (New-Object System.Text.UTF8Encoding($false)))
Write-Host "Created $target"
Write-Host "Keep this file private. It holds the database password and the login secret."
