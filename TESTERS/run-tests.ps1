# 🧪 Script para Ejecutar Tests de Autenticación
# Ejecuta este script con: .\TESTERS\run-tests.ps1

param(
    [string]$Env = "local",  # local o production
    [switch]$UI = $false,    # Abrir en modo UI
    [switch]$Debug = $false  # Modo debug
)

Write-Host "🧪 Ejecutando Tests de Autenticación..." -ForegroundColor Cyan
Write-Host ""

# Configurar URL según entorno
if ($Env -eq "production") {
    $env:TEST_URL = "https://main.d2nzzzmoajf631.amplifyapp.com"
    Write-Host "🌐 Modo: PRODUCCIÓN" -ForegroundColor Yellow
    Write-Host "   URL: $env:TEST_URL" -ForegroundColor Gray
} else {
    $env:TEST_URL = "http://localhost:3000"
    Write-Host "🏠 Modo: DESARROLLO (localhost)" -ForegroundColor Yellow
    Write-Host "   URL: $env:TEST_URL" -ForegroundColor Gray
}

Write-Host ""

# Verificar que el servidor esté corriendo (solo en local)
if ($Env -eq "local") {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 2 -UseBasicParsing -ErrorAction SilentlyContinue
        Write-Host "✅ Servidor de desarrollo detectado" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  Servidor no detectado. Asegúrate de ejecutar 'npm run dev' primero" -ForegroundColor Yellow
        Write-Host ""
        $continue = Read-Host "¿Continuar de todos modos? (s/n)"
        if ($continue -ne "s" -and $continue -ne "S") {
            exit 0
        }
    }
}

Write-Host ""
Write-Host "🚀 Iniciando Playwright..." -ForegroundColor Cyan
Write-Host ""

# Ejecutar tests
try {
    if ($UI) {
        # Modo UI
        npx playwright test TESTERS/auth.test.ts --ui
    } elseif ($Debug) {
        # Modo Debug
        npx playwright test TESTERS/auth.test.ts --debug
    } else {
        # Modo normal con Chrome visible
        npx playwright test TESTERS/auth.test.ts --headed --reporter=list
    }
    
    Write-Host ""
    Write-Host "✅ Tests completados" -ForegroundColor Green
    Write-Host ""
    Write-Host "📊 Para ver el reporte HTML:" -ForegroundColor White
    Write-Host "   npx playwright show-report TESTERS/reports" -ForegroundColor Cyan
    
} catch {
    Write-Host ""
    Write-Host "❌ Error ejecutando tests" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

