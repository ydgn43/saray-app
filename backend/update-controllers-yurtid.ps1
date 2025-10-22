# PowerShell script to update controllers to use req.selectedYurtId instead of req.user!.yurtid
# Run this from the backend directory

$files = @(
    "controller\studentController.ts",
    "controller\attendanceController.ts",
    "controller\classController.ts",
    "controller\seasonController.ts",
    "controller\programController.ts",
    "controller\userController.ts"
)

Write-Host "🔄 Updating controllers to use req.selectedYurtId..." -ForegroundColor Cyan

foreach ($file in $files) {
    $filePath = Join-Path $PSScriptRoot $file
    
    if (Test-Path $filePath) {
        Write-Host "Processing: $file" -ForegroundColor Yellow
        
        # Read the file content
        $content = Get-Content $filePath -Raw
        
        # Replace req.user!.yurtid with req.selectedYurtId!
        $newContent = $content -replace 'const yurtid = req\.user!\.yurtid;', 'const yurtid = req.selectedYurtId!;'
        
        # Count replacements
        $oldCount = ([regex]::Matches($content, 'req\.user!\.yurtid')).Count
        $newCount = ([regex]::Matches($newContent, 'req\.selectedYurtId!')).Count
        
        # Write back to file
        Set-Content $filePath -Value $newContent -NoNewline
        
        Write-Host "  ✅ Replaced $oldCount occurrences" -ForegroundColor Green
    }
    else {
        Write-Host "  ⚠️  File not found: $filePath" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "✨ All controllers updated successfully!" -ForegroundColor Green
Write-Host "⚡ Next step: Run 'npx tsc' to verify TypeScript compilation" -ForegroundColor Cyan
