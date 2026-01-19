# Script para corregir username de Vercel
param(
    [Parameter(Mandatory=$true)]
    [string]$CorrectUsername
)

Write-Host "=== CORRIENDO VERIFICATION DE VERCEL USERNAME ===" -ForegroundColor Green
Write-Host "Username actual en Git:" -NoNewline
git config --global user.name

Write-Host "Email actual en Git:" -NoNewline
git config --global user.email

Write-Host ""
Write-Host "Cambiando username a: $CorrectUsername" -ForegroundColor Yellow

# Cambiar el username
git config --global user.name $CorrectUsername

Write-Host "Nuevo username:" -NoNewline
git config --global user.name

# Hacer commit de prueba
Write-Host ""
Write-Host "Haciendo commit de prueba..." -ForegroundColor Yellow
git commit --allow-empty -m "Test commit with correct Vercel username: $CorrectUsername"

Write-Host "Subiendo commit de prueba..." -ForegroundColor Yellow
git push

Write-Host ""
Write-Host "=== VERIFICATION COMPLETA ===" -ForegroundColor Green
Write-Host "Si Vercel acepta este commit, el problema esta resuelto!"
Write-Host "Si no, intenta con otra cuenta o contacta Vercel support."