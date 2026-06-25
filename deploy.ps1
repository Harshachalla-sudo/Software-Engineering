param (
    [string]$CommitMessage = "Update code and rebuild docker"
)

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "1. Pushing changes to GitHub" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# Check if there are any changes to commit
$status = git status --porcelain
if ($status) {
    Write-Host "Adding files to Git..."
    git add .
    
    Write-Host "Committing changes..."
    git commit -m $CommitMessage
    
    Write-Host "Pushing to GitHub..."
    git push origin main
} else {
    Write-Host "No new changes to commit to Git. Skipping push..." -ForegroundColor Yellow
}


Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "2. Updating Docker Container" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# Find any running container based on the image
$containerId = docker ps -a -q --filter "ancestor=react-example-app"

if ($containerId) {
    Write-Host "Stopping and removing old container..."
    docker rm -f $containerId
} else {
    Write-Host "No existing container found to remove."
}

Write-Host "Rebuilding Docker image (this may take a moment)..."
docker build -t react-example-app .

Write-Host "Starting new Docker container on port 3000..."
docker run -d -p 3000:3000 react-example-app

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "SUCCESS! Everything is updated." -ForegroundColor Green
Write-Host "App is running at: http://localhost:3000" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
