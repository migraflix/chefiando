# Diagnóstico completo de problemas de Git
Write-Host "=== DIAGNOSTICO COMPLETO DE GIT ===" -ForegroundColor Green
Write-Host ""

# 1. Verificar configuración local
Write-Host "1. CONFIGURACION LOCAL:" -ForegroundColor Yellow
Write-Host "   Usuario: $(git config user.name)"
Write-Host "   Email: $(git config user.email)"
Write-Host "   Remote: $(git config --get remote.origin.url)"
Write-Host ""

# 2. Verificar estado del repositorio
Write-Host "2. ESTADO DEL REPOSITORIO:" -ForegroundColor Yellow
$status = git status --porcelain
if ($status) {
    Write-Host "   Cambios pendientes: Si" -ForegroundColor Yellow
    Write-Host "   $status" -ForegroundColor White
} else {
    Write-Host "   Cambios pendientes: No" -ForegroundColor Green
}
Write-Host ""

# 3. Verificar commits recientes
Write-Host "3. ULTIMOS COMMITS:" -ForegroundColor Yellow
git log --oneline -3 --format="   %h %an <%ae> %s"
Write-Host ""

# 4. Probar conexión con GitHub
Write-Host "4. PRUEBA DE CONEXION:" -ForegroundColor Yellow
Write-Host "   Intentando acceder al repositorio..." -ForegroundColor White

$result = git ls-remote origin 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "   Conexion exitosa" -ForegroundColor Green
} else {
    Write-Host "   Error de conexion: $result" -ForegroundColor Red
}

Write-Host ""
Write-Host "5. RECOMENDACIONES:" -ForegroundColor Cyan
Write-Host "   a) Verifica que el repo existe en: https://github.com/migraflix" -ForegroundColor White
Write-Host "   b) Confirma que tienes permisos de escritura" -ForegroundColor White
Write-Host "   c) Si no existe, crealo primero" -ForegroundColor White
Write-Host "   d) Verifica tu autenticacion en GitHub" -ForegroundColor White
Write-Host ""

Write-Host "=== DIAGNOSTICO COMPLETADO ===" -ForegroundColor Green