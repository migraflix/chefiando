# Verificación final antes del push
Write-Host "=== VERIFICACION FINAL PARA PUSH ===" -ForegroundColor Green
Write-Host ""

# Verificar configuración
Write-Host "1. CONFIGURACION:" -ForegroundColor Yellow
$userName = git config user.name
$userEmail = git config user.email
$remoteUrl = git config --get remote.origin.url

Write-Host "   Usuario: $userName" -ForegroundColor Green
Write-Host "   Email: $userEmail" -ForegroundColor Green
Write-Host "   Remote: $remoteUrl" -ForegroundColor Green
Write-Host ""

# Verificar estado
Write-Host "2. ESTADO DEL REPOSITORIO:" -ForegroundColor Yellow
$status = git status --porcelain
$commitCount = git rev-list --count HEAD

Write-Host "   Commits listos: $commitCount" -ForegroundColor Green
if ($status) {
    Write-Host "   Cambios sin commitear: Si" -ForegroundColor Yellow
} else {
    Write-Host "   Working directory limpio" -ForegroundColor Green
}
Write-Host ""

# Verificar conexión
Write-Host "3. PRUEBA DE CONEXION:" -ForegroundColor Yellow
$result = git ls-remote origin 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "   Repositorio encontrado en GitHub" -ForegroundColor Green
    Write-Host ""
    Write-Host "TODO LISTO - EJECUTA:" -ForegroundColor Green
    Write-Host "git push -u origin main" -ForegroundColor White
} else {
    Write-Host "   Repositorio NO encontrado" -ForegroundColor Red
    Write-Host ""
    Write-Host "CREA EL REPOSITORIO EN GITHUB PRIMERO:" -ForegroundColor Yellow
    Write-Host "   https://github.com/new" -ForegroundColor White
    Write-Host "   Owner: migraflix" -ForegroundColor White
    Write-Host "   Name: chefiando" -ForegroundColor White
}

Write-Host ""
Write-Host "=== VERIFICACION COMPLETADA ===" -ForegroundColor Green