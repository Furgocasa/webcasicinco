# Script de verificación del proyecto Casi Cinco
# Ejecutar con: .\verificar.ps1

Write-Host "🔍 Verificando Casi Cinco..." -ForegroundColor Cyan
Write-Host ""

$errores = 0

# Verificar Node.js
Write-Host "✓ Verificando Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "  Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Node.js no instalado" -ForegroundColor Red
    $errores++
}

# Verificar node_modules
Write-Host ""
Write-Host "✓ Verificando dependencias..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    $paquetes = (Get-ChildItem "node_modules" -Directory).Count
    Write-Host "  node_modules: $paquetes paquetes instalados" -ForegroundColor Green
} else {
    Write-Host "  ❌ node_modules no encontrado. Ejecuta: npm install" -ForegroundColor Red
    $errores++
}

# Verificar .env.local
Write-Host ""
Write-Host "✓ Verificando variables de entorno..." -ForegroundColor Yellow
if (Test-Path ".env.local") {
    Write-Host "  .env.local: ✓ Existe" -ForegroundColor Green
    
    # Verificar claves importantes
    $env = Get-Content ".env.local" -Raw
    $claves = @(
        "NEXT_PUBLIC_SUPABASE_URL",
        "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY",
        "OPENAI_API_KEY",
        "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
    )
    
    foreach ($clave in $claves) {
        if ($env -match $clave) {
            Write-Host "    ✓ $clave" -ForegroundColor Green
        } else {
            Write-Host "    ❌ $clave FALTA" -ForegroundColor Red
            $errores++
        }
    }
} else {
    Write-Host "  ❌ .env.local no encontrado" -ForegroundColor Red
    $errores++
}

# Verificar Git
Write-Host ""
Write-Host "✓ Verificando Git..." -ForegroundColor Yellow
try {
    $branch = git branch --show-current
    $remote = git remote get-url origin
    Write-Host "  Rama actual: $branch" -ForegroundColor Green
    Write-Host "  Remoto: $remote" -ForegroundColor Green
} catch {
    Write-Host "  ⚠ Git no configurado" -ForegroundColor Yellow
}

# Verificar archivos clave
Write-Host ""
Write-Host "✓ Verificando archivos clave..." -ForegroundColor Yellow
$archivos = @(
    "package.json",
    "next.config.js",
    "amplify.yml",
    ".npmrc",
    "app\layout.tsx"
)

foreach ($archivo in $archivos) {
    if (Test-Path $archivo) {
        Write-Host "  ✓ $archivo" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $archivo FALTA" -ForegroundColor Red
        $errores++
    }
}

# Resumen
Write-Host ""
Write-Host "===========================================" -ForegroundColor Cyan
if ($errores -eq 0) {
    Write-Host "✅ TODO CORRECTO - Listo para deploy" -ForegroundColor Green
    Write-Host ""
    Write-Host "Próximos pasos:" -ForegroundColor Cyan
    Write-Host "  1. Verifica AWS Amplify Console" -ForegroundColor White
    Write-Host "  2. Espera deploy automático (2-3 min)" -ForegroundColor White
    Write-Host "  3. Prueba: https://main.d2nzzzmoajf631.amplifyapp.com" -ForegroundColor White
} else {
    Write-Host "⚠ Encontrados $errores errores" -ForegroundColor Yellow
    Write-Host "Revisa los errores arriba y corrígelos" -ForegroundColor Yellow
}
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

