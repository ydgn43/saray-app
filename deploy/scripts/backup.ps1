<#
 Makes a backup of the database and copies it to a second place.
   .\deploy\scripts\backup.ps1 -SecondLocation E:\saray-backups
 - First copy:  C:\saray-data\backups   (same laptop)
 - Second copy: the folder you give with -SecondLocation (a USB drive or another disk).
   The backup contains private data of the talebeler. Use a place only you or the yurt's
   main user can open.
 Keeps the newest 30 backups in each place.
 To restore, see deploy\README.md ("Restoring a backup").
#>
param(
    [Parameter(Mandatory = $true)][string]$SecondLocation,
    [string]$MysqldumpBin = ''
)
$ErrorActionPreference = 'Stop'

$repo = Resolve-Path (Join-Path $PSScriptRoot '..\..')
$cfg  = Join-Path $repo 'backend\config.env'
function Get-Setting([string]$name) {
    $line = Get-Content $cfg | Where-Object { $_ -match "^$name=" } | Select-Object -First 1
    return $line.Substring($name.Length + 1).Trim()
}
$dbName = Get-Setting 'SCHEMA_RELATIONAL_DB'
$dbUser = Get-Setting 'USER_RELATIONAL_DB'
$dbPass = Get-Setting 'PASSWORD_RELATIONAL_DB'

if (-not $MysqldumpBin) {
    $found = Get-ChildItem 'C:\Program Files\MySQL' -Recurse -Filter mysqldump.exe -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($found) { $MysqldumpBin = $found.FullName } else { $MysqldumpBin = (Get-Command mysqldump.exe -ErrorAction SilentlyContinue).Source }
}
if (-not $MysqldumpBin -or -not (Test-Path $MysqldumpBin)) { throw "mysqldump.exe not found. Pass it with -MysqldumpBin." }

$localDir = 'C:\saray-data\backups'
New-Item -ItemType Directory -Force -Path $localDir | Out-Null

$stamp = Get-Date -Format 'yyyy-MM-dd_HH-mm'
$file  = Join-Path $localDir "saray_appdb_$stamp.sql"
$opt   = Join-Path $env:TEMP ('saray-dump-' + [guid]::NewGuid().ToString('N') + '.cnf')
try {
    $esc = $dbPass.Replace('\', '\\').Replace('"', '\"')
    [System.IO.File]::WriteAllText($opt, "[client]`nuser=$dbUser`npassword=`"$esc`"`nhost=127.0.0.1`n", (New-Object System.Text.UTF8Encoding($false)))
    & $MysqldumpBin "--defaults-extra-file=$opt" --single-transaction --routines --default-character-set=utf8mb4 "--result-file=$file" $dbName
    if ($LASTEXITCODE -ne 0) { throw "mysqldump failed (exit code $LASTEXITCODE)" }
}
finally { Remove-Item $opt -Force -ErrorAction SilentlyContinue }

if ((Get-Item $file).Length -lt 1000) { throw "Backup file looks too small, something went wrong: $file" }
Compress-Archive -Path $file -DestinationPath "$file.zip" -Force
Remove-Item $file -Force

if (-not (Test-Path $SecondLocation)) { throw "Second location not found: $SecondLocation (is the USB drive plugged in?). The local copy was made." }
Copy-Item "$file.zip" $SecondLocation -Force

foreach ($dir in @($localDir, $SecondLocation)) {
    Get-ChildItem $dir -Filter 'saray_appdb_*.zip' | Sort-Object LastWriteTime -Descending | Select-Object -Skip 30 | Remove-Item -Force
}
Write-Host "Backup done: $file.zip (also copied to $SecondLocation)"
