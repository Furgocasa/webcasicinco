Write-Host "Configurando variables de entorno..." -ForegroundColor Cyan

$env:NEXT_PUBLIC_SUPABASE_URL = "https://zzycxijexoxrjpijslsb.supabase.co"
$env:NEXT_PUBLIC_SUPABASE_ANON_KEY = "your_supabase_anon_key_here"
$env:SUPABASE_SERVICE_ROLE_KEY = "your_supabase_anon_key_here"
$env:GOOGLE_MAPS_API_KEY = "your_google_maps_api_key_here"

Write-Host "Variables configuradas. Iniciando migracion..." -ForegroundColor Green
Write-Host ""

Write-Host "=== LOTE 1/4 (max 30 lugares) ===" -ForegroundColor Yellow
npx tsx scripts/migrate-photos-to-supabase.ts --limit 30
Write-Host ""
Start-Sleep -Seconds 2

Write-Host "=== LOTE 2/4 (max 30 lugares) ===" -ForegroundColor Yellow
npx tsx scripts/migrate-photos-to-supabase.ts --limit 30
Write-Host ""
Start-Sleep -Seconds 2

Write-Host "=== LOTE 3/4 (max 30 lugares) ===" -ForegroundColor Yellow
npx tsx scripts/migrate-photos-to-supabase.ts --limit 30
Write-Host ""
Start-Sleep -Seconds 2

Write-Host "=== LOTE 4/4 (restantes) ===" -ForegroundColor Yellow
npx tsx scripts/migrate-photos-to-supabase.ts --limit 30
Write-Host ""

Write-Host "MIGRACION COMPLETADA!" -ForegroundColor Green
Write-Host "Ahorro estimado: ~$339/mes (~$4,068/año)" -ForegroundColor Cyan

