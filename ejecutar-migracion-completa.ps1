# ============================================
# SCRIPT DE MIGRACIÓN COMPLETA Y GRADUAL
# ============================================
# Este script ejecuta la migración completa en lotes controlados
# Puedes interrumpirlo con Ctrl+C y reiniciarlo sin problemas

Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   MIGRACIÓN COMPLETA DE FOTOS A SUPABASE                   ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Cargar variables de entorno desde .env.local
Write-Host "🔧 Cargando variables de entorno..." -ForegroundColor Cyan
if (Test-Path ".env.local") {
    Get-Content ".env.local" | ForEach-Object {
        if ($_ -match '^([^=]+)=(.*)$') {
            $name = $matches[1]
            $value = $matches[2]
            [Environment]::SetEnvironmentVariable($name, $value, "Process")
        }
    }
    Write-Host "✅ Variables cargadas correctamente`n" -ForegroundColor Green
} else {
    Write-Host "❌ Error: No se encontró .env.local" -ForegroundColor Red
    exit 1
}

$totalMigrados = 5  # Ya migramos 5 en la prueba
$totalErrores = 0
$ahorroTotal = 17.50

# Función para ejecutar un lote
function Ejecutar-Lote {
    param(
        [string]$Categoria,
        [int]$Limite,
        [int]$NumeroLote
    )
    
    Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
    Write-Host "🚀 LOTE $NumeroLote - $Categoria (máx $Limite lugares)" -ForegroundColor Yellow
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Yellow
    
    $inicio = Get-Date
    
    if ($Categoria) {
        npx tsx scripts/migrate-photos-to-supabase.ts --category $Categoria --limit $Limite
    } else {
        npx tsx scripts/migrate-photos-to-supabase.ts --limit $Limite
    }
    
    $fin = Get-Date
    $duracion = $fin - $inicio
    
    Write-Host "`n⏱️  Tiempo: $($duracion.Minutes)m $($duracion.Seconds)s" -ForegroundColor Cyan
    
    # Pausa de 5 segundos entre lotes para no saturar
    Write-Host "⏸️  Pausa de 5 segundos...`n" -ForegroundColor Gray
    Start-Sleep -Seconds 5
}

# ============================================
# FASE 1: RESTAURANTES
# ============================================
Write-Host "`n🍽️  FASE 1: RESTAURANTES" -ForegroundColor Green
Write-Host "════════════════════════════`n" -ForegroundColor Green

$lote = 1
for ($i = 1; $i -le 12; $i++) {
    Ejecutar-Lote -Categoria "restaurante" -Limite 100 -NumeroLote $lote
    $lote++
}

# ============================================
# FASE 2: BARES
# ============================================
Write-Host "`n🍺 FASE 2: BARES" -ForegroundColor Green
Write-Host "═══════════════════`n" -ForegroundColor Green

for ($i = 1; $i -le 10; $i++) {
    Ejecutar-Lote -Categoria "bar" -Limite 100 -NumeroLote $lote
    $lote++
}

# ============================================
# FASE 3: CAFETERÍAS
# ============================================
Write-Host "`n☕ FASE 3: CAFETERÍAS" -ForegroundColor Green
Write-Host "═════════════════════════`n" -ForegroundColor Green

for ($i = 1; $i -le 5; $i++) {
    Ejecutar-Lote -Categoria "cafe" -Limite 100 -NumeroLote $lote
    $lote++
}

# ============================================
# FASE 4: HOTELES
# ============================================
Write-Host "`n🏨 FASE 4: HOTELES" -ForegroundColor Green
Write-Host "══════════════════════`n" -ForegroundColor Green

for ($i = 1; $i -le 4; $i++) {
    Ejecutar-Lote -Categoria "hotel" -Limite 100 -NumeroLote $lote
    $lote++
}

# ============================================
# RESUMEN FINAL
# ============================================
Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║   🎉 MIGRACIÓN COMPLETA FINALIZADA                        ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Para ver estadísticas finales, ejecuta:" -ForegroundColor Cyan
Write-Host "   Get-Content PROGRESO_MIGRACION.md" -ForegroundColor White
Write-Host ""
Write-Host "🔍 Para verificar en Supabase:" -ForegroundColor Cyan
Write-Host "   - Dashboard → Storage → place-photos" -ForegroundColor White
Write-Host "   - Dashboard → SQL Editor → ejecuta verificar_fotos_simple.sql" -ForegroundColor White
Write-Host ""
Write-Host "💰 AHORRO ESTIMADO:" -ForegroundColor Green
Write-Host "   - Mensual: ~$2,135" -ForegroundColor White
Write-Host "   - Anual: ~$25,620" -ForegroundColor White
Write-Host ""
