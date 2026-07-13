Write-Host "Creating project.zip..." -ForegroundColor Yellow

$files = @(
    "database.js",
    "generator.js",
    "scraper.js",
    "server.js",
    "package.json",
    "package-lock.json",
    "public",
    "data"
)

# Remove old zip if exists
if (Test-Path "project.zip") {
    Remove-Item "project.zip" -Force
}

# Create zip archive containing all required files and folders
Compress-Archive -Path $files -DestinationPath "project.zip" -Force

Write-Host "SUCCESS: project.zip created successfully!" -ForegroundColor Green
Write-Host "You can now upload project.zip to Hugging Face." -ForegroundColor Cyan
