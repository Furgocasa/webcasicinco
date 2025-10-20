@echo off
echo ================================================================
echo    MIGRACION COMPLETA DE FOTOS A SUPABASE
echo ================================================================
echo.

REM Cargar variables desde .env.local
for /f "usebackq tokens=1,2 delims==" %%a in (".env.local") do (
    set "%%a=%%b"
)

echo Variables de entorno cargadas
echo.
echo Iniciando migracion de 3,050 lugares...
echo Esto tomara aproximadamente 8-10 horas
echo.
echo Presiona Ctrl+C para detener en cualquier momento
echo El script puede reiniciarse sin problemas
echo.

npx tsx scripts/migrate-photos-to-supabase.ts

echo.
echo ================================================================
echo    MIGRACION COMPLETADA
echo ================================================================
echo.
echo Revisa INSTRUCCIONES_MIGRACION.md para los siguientes pasos
pause

