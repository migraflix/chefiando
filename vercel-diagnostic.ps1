# Script de diagnóstico para problemas de Vercel
Write-Host "=== VERCEL DEPLOYMENT DIAGNOSTIC ===" -ForegroundColor Green
Write-Host ""

# Verificar configuración de Git
Write-Host "1. GIT CONFIGURATION:" -ForegroundColor Yellow
Write-Host "   Username: $(git config --global user.name)"
Write-Host "   Email: $(git config --global user.email)"
Write-Host ""

# Verificar repositorio remoto
Write-Host "2. REPOSITORY INFO:" -ForegroundColor Yellow
$remoteUrl = git config --get remote.origin.url
Write-Host "   Remote URL: $remoteUrl"

if ($remoteUrl -match "github\.com/([^/]+)/([^/]+)") {
    $githubUser = $matches[1]
    $repoName = $matches[2]
    Write-Host "   GitHub User: $githubUser"
    Write-Host "   Repository: $repoName"
}
Write-Host ""

# Verificar commits recientes
Write-Host "3. RECENT COMMITS:" -ForegroundColor Yellow
git log --oneline -3 --format="%h %an <%ae> %s"
Write-Host ""

# Verificar rama actual
Write-Host "4. CURRENT BRANCH:" -ForegroundColor Yellow
$branch = git branch --show-current
Write-Host "   Branch: $branch"
Write-Host ""

# Sugerencias
Write-Host "5. POSSIBLE SOLUTIONS:" -ForegroundColor Cyan
Write-Host "   A) IMPORT PROJECT TO VERCEL:"
Write-Host "      - Go to https://vercel.com/dashboard"
Write-Host "      - Click 'Import Project'"
Write-Host "      - Import from GitHub: gneuman/migraflix"
Write-Host ""
Write-Host "   B) CHECK PROJECT MEMBERS:"
Write-Host "      - Go to project Settings > Members"
Write-Host "      - Ensure 'gneuman' has access"
Write-Host ""
Write-Host "   C) VERIFY EMAIL:"
Write-Host "      - Go to Account Settings"
Write-Host "      - Confirm 'soy@gabrielneuman.com' is verified"
Write-Host ""

Write-Host "=== RUN THIS SCRIPT AND FOLLOW THE STEPS ABOVE ===" -ForegroundColor Green