# ============================================
# MIGRAR 97 LUGARES RESTANTES - VISIBLE
# ============================================

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   MIGRACIÓN DE 97 LUGARES RESTANTES A SUPABASE            ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Configurar variables de entorno
Write-Host "🔧 Configurando variables de entorno..." -ForegroundColor Yellow
$env:NEXT_PUBLIC_SUPABASE_URL = "https://zzycxijexoxrjpijslsb.supabase.co"
$env:NEXT_PUBLIC_SUPABASE_ANON_KEY = "your_supabase_anon_key_here"
$env:SUPABASE_SERVICE_ROLE_KEY = "your_supabase_anon_key_here"
$env:GOOGLE_MAPS_API_KEY = "your_google_maps_api_key_here"
$env:NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = "your_google_maps_api_key_here"

Write-Host "✅ Variables configuradas" -ForegroundColor Green
Write-Host ""

# Ejecutar migración en lotes de 30 para ver progreso
Write-Host "🚀 Iniciando migración de los 97 lugares restantes..." -ForegroundColor Cyan
Write-Host "   Se ejecutará en 4 lotes (30+30+30+7) para ver progreso" -ForegroundColor Gray
Write-Host ""

$totalMigrados = 0
$totalErrores = 0

# Lote 1: 30 lugares
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host "📦 LOTE 1 de 4 (máx 30 lugares)" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host ""
npx tsx scripts/migrate-photos-to-supabase.ts --limit 30
Write-Host ""
Start-Sleep -Seconds 2

# Lote 2: 30 lugares
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host "📦 LOTE 2 de 4 (máx 30 lugares)" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host ""
npx tsx scripts/migrate-photos-to-supabase.ts --limit 30
Write-Host ""
Start-Sleep -Seconds 2

# Lote 3: 30 lugares
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host "📦 LOTE 3 de 4 (máx 30 lugares)" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host ""
npx tsx scripts/migrate-photos-to-supabase.ts --limit 30
Write-Host ""
Start-Sleep -Seconds 2

# Lote 4: Resto
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host "📦 LOTE 4 de 4 (lugares restantes)" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host ""
npx tsx scripts/migrate-photos-to-supabase.ts --limit 30
Write-Host ""

Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║   🎉 MIGRACIÓN COMPLETADA                                  ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "💰 AHORRO ESTIMADO (97 lugares x 5 fotos x 100 vistas/mes x $0.007):" -ForegroundColor Cyan
Write-Host "   - Mensual: ~$339/mes" -ForegroundColor White
Write-Host "   - Anual: ~$4,068/año" -ForegroundColor White
Write-Host ""
Write-Host "🔍 Para verificar que todo está migrado, ejecuta en Supabase SQL Editor:" -ForegroundColor Cyan
Write-Host "   SELECT COUNT(*) FROM places WHERE published = true AND photos IS NOT NULL AND photo_urls IS NULL;" -ForegroundColor White
Write-Host "   Resultado esperado: 0" -ForegroundColor White
Write-Host ""

