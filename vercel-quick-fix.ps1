# Solución rápida para problemas de Vercel
Write-Host "=== VERCEL QUICK FIX ===" -ForegroundColor Green
Write-Host ""

# Verificar que estamos en el repo correcto
$remoteUrl = git config --get remote.origin.url
if ($remoteUrl -notlike "*gneuman/migraflix*") {
    Write-Host "ERROR: No estas en el repo correcto!" -ForegroundColor Red
    Write-Host "Debes estar en: gneuman/migraflix"
    exit 1
}

Write-Host "✓ Repo correcto: $remoteUrl" -ForegroundColor Green
Write-Host ""

# Verificar configuración de Git
$userName = git config --global user.name
$userEmail = git config --global user.email

if ($userName -ne "gneuman" -or $userEmail -ne "soy@gabrielneuman.com") {
    Write-Host "ERROR: Configuracion de Git incorrecta!" -ForegroundColor Red
    Write-Host "Username debe ser: gneuman"
    Write-Host "Email debe ser: soy@gabrielneuman.com"
    exit 1
}

Write-Host "✓ Configuracion de Git correcta" -ForegroundColor Green
Write-Host "  Username: $userName"
Write-Host "  Email: $userEmail"
Write-Host ""

# Mostrar instrucciones finales
Write-Host "=== ACCIONES A REALIZAR EN VERCEL ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Ve a: https://vercel.com/dashboard" -ForegroundColor Yellow
Write-Host "2. Si NO existe el proyecto 'migraflix':" -ForegroundColor Yellow
Write-Host "   - Click 'Add New...' > 'Project'" -ForegroundColor White
Write-Host "   - Import from GitHub: gneuman/migraflix" -ForegroundColor White
Write-Host "   - Deploy" -ForegroundColor White
Write-Host ""
Write-Host "3. Si YA existe el proyecto 'migraflix':" -ForegroundColor Yellow
Write-Host "   - Ve al proyecto" -ForegroundColor White
Write-Host "   - Settings > Git" -ForegroundColor White
Write-Host "   - Cambia branch a 'main'" -ForegroundColor White
Write-Host "   - Trigger redeploy" -ForegroundColor White
Write-Host ""
Write-Host "4. IMPORTANTE:" -ForegroundColor Red
Write-Host "   - Asegurate de estar logueado como 'gneuman'" -ForegroundColor White
Write-Host "   - El email 'soy@gabrielneuman.com' debe estar verificado" -ForegroundColor White
Write-Host ""
Write-Host "Una vez hecho esto, los deployments deberian funcionar!" -ForegroundColor Green