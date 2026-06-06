Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "   LinkedIn Generator GitHub Push Helper  " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

$repoUrl = Read-Host "Please enter your GitHub Repository HTTPS URL (e.g., https://github.com/username/repo.git)"

if ([string]::IsNullOrWhiteSpace($repoUrl)) {
    Write-Host "Error: Repository URL cannot be empty." -ForegroundColor Red
    Exit
}

# Add remote
Write-Host "Adding remote origin..." -ForegroundColor Yellow
& "C:\Program Files\Git\cmd\git.exe" remote remove origin 2>$null
& "C:\Program Files\Git\cmd\git.exe" remote add origin $repoUrl

# Rename branch to main
Write-Host "Setting default branch to main..." -ForegroundColor Yellow
& "C:\Program Files\Git\cmd\git.exe" branch -M main

# Push to GitHub
Write-Host "Pushing to GitHub (a browser authentication popup may appear)..." -ForegroundColor Yellow
& "C:\Program Files\Git\cmd\git.exe" push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "==========================================" -ForegroundColor Green
    Write-Host "   SUCCESS: Code pushed to GitHub!        " -ForegroundColor Green
    Write-Host "==========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next Steps to deploy on Render (Free):" -ForegroundColor Cyan
    Write-Host "1. Open https://dashboard.render.com/ and create a 'New Web Service'."
    Write-Host "2. Link your newly created GitHub repository."
    Write-Host "3. Set Start Command to: node server.js"
    Write-Host "4. Add your GEMINI_API_KEY and WEBHOOK_URL in Render Environment Variables."
} else {
    Write-Host ""
    Write-Host "Error: Push failed. Check details above." -ForegroundColor Red
}
