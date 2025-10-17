# PowerShell script to replace API URLs in frontend files
# Run this from the frontend/src directory

$files = @(
    "pages/UserManagement.tsx",
    "pages/Talebeler.tsx", 
    "pages/Statistics.tsx",
    "pages/IzinliTalebeler.tsx",
    "pages/Attendance.tsx"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "Processing $file..."
        
        # Add config import if not present
        $content = Get-Content $file -Raw
        if ($content -notmatch "import config from") {
            # Find the last import statement and add config import after it
            $lines = Get-Content $file
            $lastImportIndex = -1
            for ($i = 0; $i -lt $lines.Count; $i++) {
                if ($lines[$i] -match "^import\s+.*from\s+") {
                    $lastImportIndex = $i
                }
            }
            
            if ($lastImportIndex -ge 0) {
                $lines = $lines[0..$lastImportIndex] + "import config from '../config';" + $lines[($lastImportIndex + 1)..($lines.Count - 1)]
                Set-Content $file -Value $lines
            }
        }
        
        # Replace all API URLs
        (Get-Content $file -Raw) -replace "https://api\.efendim\.nl", "`${config.API_BASE_URL}" | Set-Content $file
        
        Write-Host "✓ Updated $file"
    }
    else {
        Write-Host "✗ File not found: $file"
    }
}

Write-Host ""
Write-Host "All files updated! Now all API calls will use the centralized configuration."
Write-Host "To change the API URL, just update:"
Write-Host "  - frontend/.env (REACT_APP_API_BASE_URL)"
Write-Host "  - backend/config.env (REACT_APP_API_BASE_URL)"