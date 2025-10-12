# 🧪 Script de Configuración Rápida para Tests
# Ejecuta este script en PowerShell para configurar todo automáticamente

Write-Host "🚀 Configurando Tests de Casi Cinco..." -ForegroundColor Cyan
Write-Host ""

# 1. Verificar Node.js
Write-Host "1️⃣ Verificando Node.js..." -ForegroundColor Yellow
$nodeVersion = node --version 2>$null
if ($nodeVersion) {
    Write-Host "   ✅ Node.js instalado: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "   ❌ Node.js no encontrado. Por favor instala Node.js primero." -ForegroundColor Red
    exit 1
}

# 2. Instalar dependencias del proyecto
Write-Host ""
Write-Host "2️⃣ Instalando dependencias del proyecto..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Dependencias instaladas" -ForegroundColor Green
} else {
    Write-Host "   ❌ Error instalando dependencias" -ForegroundColor Red
    exit 1
}

# 3. Instalar navegadores de Playwright
Write-Host ""
Write-Host "3️⃣ Instalando navegadores de Playwright (Chrome)..." -ForegroundColor Yellow
npx playwright install chromium
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Chrome instalado para tests" -ForegroundColor Green
} else {
    Write-Host "   ❌ Error instalando Chrome" -ForegroundColor Red
    exit 1
}

# 4. Crear carpetas necesarias
Write-Host ""
Write-Host "4️⃣ Creando carpetas de reportes..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path "TESTERS/reports" | Out-Null
New-Item -ItemType Directory -Force -Path "TESTERS/test-results" | Out-Null
Write-Host "   ✅ Carpetas creadas" -ForegroundColor Green

# 5. Verificar servidor de desarrollo
Write-Host ""
Write-Host "5️⃣ Verificando servidor de desarrollo..." -ForegroundColor Yellow
$devProcess = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*next dev*" }
if ($devProcess) {
    Write-Host "   ✅ Servidor de desarrollo ya está corriendo" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Servidor de desarrollo no está corriendo" -ForegroundColor Yellow
    Write-Host "      Ejecuta 'npm run dev' en otra terminal antes de ejecutar tests" -ForegroundColor Yellow
}

# Resumen
Write-Host ""
Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✅ ¡Configuración Completada!" -ForegroundColor Green
Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 Próximos pasos:" -ForegroundColor White
Write-Host ""
Write-Host "   1. Inicia el servidor (si no está corriendo):" -ForegroundColor White
Write-Host "      npm run dev" -ForegroundColor Cyan
Write-Host ""
Write-Host "   2. Ejecuta los tests de autenticación:" -ForegroundColor White
Write-Host "      npm run test:auth" -ForegroundColor Cyan
Write-Host ""
Write-Host "   3. O usa el modo UI para explorar:" -ForegroundColor White
Write-Host "      npm run test:ui" -ForegroundColor Cyan
Write-Host ""
Write-Host "🎉 Chrome se abrirá automáticamente y verás los tests ejecutándose" -ForegroundColor Green
Write-Host ""
Write-Host "📚 Para más información, lee:" -ForegroundColor White
Write-Host "   - TESTERS/GUIA_RAPIDA.md" -ForegroundColor Cyan
Write-Host "   - TESTERS/README.md" -ForegroundColor Cyan
Write-Host ""

