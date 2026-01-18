# Script para hacer push al nuevo repositorio
Write-Host "=== PUSH TO NEW REPOSITORY: migraflix/chefiando ===" -ForegroundColor Green
Write-Host ""

# Verificar que el remote esté configurado correctamente
$remoteUrl = git config --get remote.origin.url
Write-Host "Remote URL: $remoteUrl" -ForegroundColor Yellow

if ($remoteUrl -ne "https://github.com/migraflix/chefiando.git") {
    Write-Host "ERROR: Remote URL incorrecta!" -ForegroundColor Red
    Write-Host "Configurando remote correcto..."
    git remote set-url origin https://github.com/migraflix/chefiando.git
}

Write-Host ""
Write-Host "Verificando acceso al repositorio..." -ForegroundColor Yellow

# Intentar hacer push
Write-Host "Haciendo push..." -ForegroundColor Yellow
try {
    git push -u origin main
    Write-Host ""
    Write-Host "SUCCESS: Push completado!" -ForegroundColor Green
    Write-Host "El repositorio ahora esta en: https://github.com/migraflix/chefiando" -ForegroundColor Green
} catch {
    Write-Host ""
    Write-Host "ERROR: No se pudo hacer push" -ForegroundColor Red
    Write-Host "Posibles causas:" -ForegroundColor Yellow
    Write-Host "- El repositorio no existe en GitHub" -ForegroundColor White
    Write-Host "- No tienes permisos de escritura" -ForegroundColor White
    Write-Host "- Error de autenticacion" -ForegroundColor White
    Write-Host ""
    Write-Host "Verifica que:" -ForegroundColor Cyan
    Write-Host "1. Creaste el repo en https://github.com/migraflix/chefiando" -ForegroundColor White
    Write-Host "2. Tienes acceso de escritura al repo" -ForegroundColor White
    Write-Host "3. Estas autenticado correctamente en Git" -ForegroundColor White
}

Write-Host ""
Write-Host "=== SCRIPT COMPLETADO ===" -ForegroundColor Green