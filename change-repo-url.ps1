# Script para cambiar la URL del repositorio
param(
    [Parameter(Mandatory=$true)]
    [string]$NewUrl
)

Write-Host "=== CAMBIANDO URL DEL REPOSITORIO ===" -ForegroundColor Green
Write-Host "URL anterior: $(git config --get remote.origin.url)" -ForegroundColor Yellow
Write-Host "URL nueva: $NewUrl" -ForegroundColor Green

# Cambiar la URL
git remote set-url origin $NewUrl

Write-Host ""
Write-Host "Verificando cambio..." -ForegroundColor Yellow
Write-Host "Nueva URL: $(git config --get remote.origin.url)" -ForegroundColor Green

Write-Host ""
Write-Host "Intentando push..." -ForegroundColor Yellow
try {
    git push -u origin main
    Write-Host ""
    Write-Host "SUCCESS: Push completado!" -ForegroundColor Green
} catch {
    Write-Host ""
    Write-Host "ERROR: Push fallido" -ForegroundColor Red
    Write-Host "Verifica que la URL sea correcta y tengas permisos" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== SCRIPT COMPLETADO ===" -ForegroundColor Green