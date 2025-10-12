# Script de configuración inicial para Casi Cinco
# Ejecutar con: .\setup.ps1

Write-Host "🚀 Configurando Casi Cinco..." -ForegroundColor Cyan
Write-Host ""

# Verificar que Node.js esté instalado
Write-Host "✓ Verificando Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "  Node.js instalado: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "  ❌ ERROR: Node.js no está instalado" -ForegroundColor Red
    Write-Host "  Por favor instala Node.js desde https://nodejs.org" -ForegroundColor Red
    exit 1
}

# Instalar dependencias
Write-Host ""
Write-Host "📦 Instalando dependencias (esto puede tardar unos minutos)..." -ForegroundColor Yellow
npm install

if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✓ Dependencias instaladas correctamente" -ForegroundColor Green
} else {
    Write-Host "  ❌ ERROR instalando dependencias" -ForegroundColor Red
    exit 1
}

# Verificar archivo .env.local
Write-Host ""
Write-Host "🔑 Verificando variables de entorno..." -ForegroundColor Yellow
if (Test-Path ".env.local") {
    Write-Host "  ✓ Archivo .env.local encontrado" -ForegroundColor Green
} else {
    Write-Host "  ⚠ Archivo .env.local no encontrado" -ForegroundColor Yellow
    if (Test-Path ".env.example") {
        Write-Host "  Copiando .env.example a .env.local..." -ForegroundColor Yellow
        Copy-Item ".env.example" ".env.local"
        Write-Host "  ✓ Archivo .env.local creado" -ForegroundColor Green
        Write-Host "  ⚠ IMPORTANTE: Configura tus API keys en .env.local" -ForegroundColor Yellow
    } else {
        Write-Host "  ⚠ Debes crear un archivo .env.local con tus API keys" -ForegroundColor Yellow
    }
}

# Resumen
Write-Host ""
Write-Host "✅ ¡Configuración completada!" -ForegroundColor Green
Write-Host ""
Write-Host "Para iniciar la aplicación ejecuta:" -ForegroundColor Cyan
Write-Host "  npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "Luego abre en tu navegador:" -ForegroundColor Cyan
Write-Host "  http://localhost:3000" -ForegroundColor White
Write-Host ""

