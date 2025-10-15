@echo off
REM ============================================
REM TEST DE INDEXACIÓN - Casi Cinco App
REM ============================================
REM
REM Este script ejecuta los tests del sistema
REM de indexación de lugares.
REM
REM Requisitos:
REM - Node.js instalado
REM - Dependencias instaladas (npm install)
REM - Servidor corriendo en localhost:3000
REM
REM Uso:
REM   run-indexacion-tests.bat
REM ============================================

echo.
echo ============================================
echo  TEST DE INDEXACION - Casi Cinco App
echo ============================================
echo.

REM Verificar que Node está instalado
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js no esta instalado
    pause
    exit /b 1
)

REM Ejecutar tests
echo [INFO] Ejecutando tests de indexacion...
echo.
npm run test:indexacion

echo.
echo ============================================
echo Tests completados
echo ============================================
echo.
echo Para ver el reporte HTML:
echo   npm run test:report
echo.
pause

