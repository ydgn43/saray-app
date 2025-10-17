# PowerShell script to properly fix template literals in API URLs

$files = @(
    "pages/UserManagement.tsx",
    "pages/Talebeler.tsx", 
    "pages/Statistics.tsx",
    "pages/IzinliTalebeler.tsx",
    "pages/Attendance.tsx"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "Fixing template literals in $file..."
        
        $content = Get-Content $file -Raw
        
        # Fix single quotes to backticks for template literals
        $content = $content -replace "'`\$\{config\.API_BASE_URL\}", "`${config.API_BASE_URL}"
        
        # Fix any remaining quote issues
        $content = $content -replace "'\$\{config\.API_BASE_URL\}", "`${config.API_BASE_URL}"
        
        Set-Content $file -Value $content
        
        Write-Host "Fixed $file"
    }
    else {
        Write-Host "File not found: $file"
    }
}

Write-Host ""
Write-Host "Template literals fixed! All API calls should now work correctly."