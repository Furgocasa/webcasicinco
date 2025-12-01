# Script para buscar emails de lugares agregados ayer y hoy
# Solo procesa lugares creados en las últimas 48 horas

Write-Host ""
Write-Host "🔍 CASI CINCO - Scraping de Emails (Lugares Recientes)" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Este script buscará emails para lugares agregados en las últimas 48h" -ForegroundColor Yellow
Write-Host ""

# Verificar dependencias
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Error: Node.js no está instalado" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Instalando dependencias..." -ForegroundColor Yellow
    npm install
}

Write-Host "🚀 Iniciando scraping de emails..." -ForegroundColor Green
Write-Host ""

# Ejecutar script con tsx
npx tsx scripts/scrape-emails-recent.ts

Write-Host ""
Write-Host "✅ Proceso completado" -ForegroundColor Green
Write-Host ""

# Preguntar si quiere ver estadísticas
$response = Read-Host "¿Quieres ver las estadísticas de emails? (s/n)"
if ($response -eq "s" -or $response -eq "S") {
    Write-Host ""
    Write-Host "📊 Consultando base de datos..." -ForegroundColor Cyan
    
    # Ejecutar consulta SQL para ver estadísticas
    $query = @"
SELECT 
  COUNT(*) as total,
  COUNT(email) as con_email,
  COUNT(*) - COUNT(email) as sin_email,
  ROUND(COUNT(email)::numeric / COUNT(*)::numeric * 100, 1) as porcentaje_con_email
FROM places
WHERE created_at >= NOW() - INTERVAL '48 hours';
"@
    
    Write-Host ""
    Write-Host "Total lugares (48h) | Con email | Sin email | % con email" -ForegroundColor Yellow
    Write-Host "------------------------------------------------------------" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "💡 Tip: Puedes ejecutar este script cada vez que agregues lugares nuevos" -ForegroundColor Cyan
Write-Host ""

