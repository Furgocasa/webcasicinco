# Script de inicio rápido para Casi Cinco
# Ejecutar con: .\start.ps1

Write-Host "🚀 Iniciando Casi Cinco..." -ForegroundColor Cyan
Write-Host ""

# Verificar que node_modules exista
if (-Not (Test-Path "node_modules")) {
    Write-Host "⚠ node_modules no encontrado. Ejecutando instalación..." -ForegroundColor Yellow
    npm install
    Write-Host ""
}

# Iniciar servidor
Write-Host "▲ Iniciando Next.js..." -ForegroundColor Green
Write-Host ""
npm run dev

