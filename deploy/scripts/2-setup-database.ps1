<#
 Creates the EMPTY database for this instance and loads the structure.
 Run once, as Administrator is not needed. You will be asked for the MySQL "root" password
 you chose while installing MySQL.
   .\deploy\scripts\2-setup-database.ps1
 It stops without changing anything if the database already contains tables.
 No student data and no data from any other yurt is loaded.
#>
param(
    [string]$MysqlBin = ''
)
$ErrorActionPreference = 'Stop'

$repo = Resolve-Path (Join-Path $PSScriptRoot '..\..')
$cfg  = Join-Path $repo 'backend\config.env'
if (-not (Test-Path $cfg)) { throw "backend\config.env not found. Run 1-create-config.ps1 first." }

function Get-Setting([string]$name) {
    $line = Get-Content $cfg | Where-Object { $_ -match "^$name=" } | Select-Object -First 1
    if (-not $line) { throw "$name is missing in backend\config.env" }
    return $line.Substring($name.Length + 1).Trim()
}
$dbName = Get-Setting 'SCHEMA_RELATIONAL_DB'
$dbUser = Get-Setting 'USER_RELATIONAL_DB'
$dbPass = Get-Setting 'PASSWORD_RELATIONAL_DB'
if ($dbName -ne 'saray_appdb') { throw "The migration files in db\migrations use the database name saray_appdb. Keep SCHEMA_RELATIONAL_DB=saray_appdb." }
if ($dbPass -eq 'AUTO' -or $dbPass.Length -lt 12) { throw "PASSWORD_RELATIONAL_DB in config.env is not set properly." }

# Find mysql.exe
if (-not $MysqlBin) {
    $found = Get-ChildItem 'C:\Program Files\MySQL' -Recurse -Filter mysql.exe -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($found) { $MysqlBin = $found.FullName } else { $MysqlBin = (Get-Command mysql.exe -ErrorAction SilentlyContinue).Source }
}
if (-not $MysqlBin -or -not (Test-Path $MysqlBin)) { throw "mysql.exe not found. Pass it with -MysqlBin 'C:\...\mysql.exe'" }

$rootPass = Read-Host 'MySQL root password' -AsSecureString
$rootPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($rootPass))
# In MySQL option files a backslash or a double quote inside a value must be escaped
$rootEsc = $rootPlain.Replace('\', '\\').Replace('"', '\"')

# The password goes into a temporary options file, not onto the command line.
$opt = Join-Path $env:TEMP ('saray-mysql-' + [guid]::NewGuid().ToString('N') + '.cnf')
[System.IO.File]::WriteAllText($opt, "[client]`nuser=root`npassword=`"$rootEsc`"`nhost=127.0.0.1`n", (New-Object System.Text.UTF8Encoding($false)))

function Invoke-Mysql([string]$sql, [string]$db = '') {
    $mysqlArgs = @("--defaults-extra-file=$opt", '--default-character-set=utf8mb4')
    if ($db) { $mysqlArgs += $db }
    $mysqlArgs += @('-N', '-B', '-e', $sql)
    $out = & $MysqlBin @mysqlArgs 2>&1
    if ($LASTEXITCODE -ne 0) { throw "MySQL error: $out" }
    return $out
}
function Invoke-MysqlFile([string]$file, [string]$db) {
    # "source" lets MySQL read the file itself, so Turkish characters stay intact.
    if ($file -match '\s') { throw "The repository path must not contain spaces (use for example C:\saray-app). Found: $file" }
    $src = $file.Replace('\', '/')
    $out = & $MysqlBin "--defaults-extra-file=$opt" '--default-character-set=utf8mb4' $db '-e' "source $src" 2>&1
    if ($LASTEXITCODE -ne 0) { throw "Error in $file : $out" }
}

try {
    $exists = Invoke-Mysql "SELECT COUNT(*) FROM information_schema.schemata WHERE schema_name='$dbName'"
    if ([int]$exists -gt 0) {
        $tables = Invoke-Mysql "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='$dbName'"
        if ([int]$tables -gt 0) { throw "Database $dbName already has $tables tables. Nothing was changed. (Migrations must run only once on a database.)" }
    }

    Write-Host 'Creating database and database user ...'
    Invoke-Mysql "CREATE DATABASE IF NOT EXISTS $dbName CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci" | Out-Null
    Invoke-Mysql "CREATE USER IF NOT EXISTS '$dbUser'@'localhost' IDENTIFIED BY '$dbPass'" | Out-Null
    Invoke-Mysql "ALTER USER '$dbUser'@'localhost' IDENTIFIED BY '$dbPass'" | Out-Null
    Invoke-Mysql "CREATE USER IF NOT EXISTS '$dbUser'@'127.0.0.1' IDENTIFIED BY '$dbPass'" | Out-Null
    Invoke-Mysql "ALTER USER '$dbUser'@'127.0.0.1' IDENTIFIED BY '$dbPass'" | Out-Null
    Invoke-Mysql "GRANT ALL PRIVILEGES ON $dbName.* TO '$dbUser'@'localhost'" | Out-Null
    Invoke-Mysql "GRANT ALL PRIVILEGES ON $dbName.* TO '$dbUser'@'127.0.0.1'" | Out-Null

    # Order matters. The migrations run exactly once, in date order.
    $files = @(
        'deploy\db\01-base-schema.sql',
        'deploy\db\02-reference-data.sql',
        'db\migrations\2026-11-03-exit-tracking-rebuild.sql',
        'db\migrations\2026-11-06-attendance-reasons.sql',
        'db\migrations\2026-11-10-season-improvements.sql'
    )
    foreach ($f in $files) {
        Write-Host "Loading $f"
        Invoke-MysqlFile (Join-Path $repo $f) $dbName
    }

    $n = Invoke-Mysql 'SELECT COUNT(*) FROM information_schema.tables WHERE table_schema=DATABASE()' $dbName
    Write-Host "Done. Database $dbName is ready with $n empty tables."
    Write-Host 'Next: create the first yurt and admin (see deploy\README.md, step 6).'
}
finally {
    Remove-Item $opt -Force -ErrorAction SilentlyContinue
}
