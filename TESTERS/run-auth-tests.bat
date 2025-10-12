@echo off
echo.
echo 🧪 Ejecutando Tests de Autenticación...
echo.

REM Ejecutar tests con Playwright
call npx playwright test TESTERS\auth.test.ts --headed --reporter=list

echo.
echo ✅ Tests completados
echo.
echo 📊 Para ver el reporte HTML, ejecuta:
echo    npx playwright show-report TESTERS\reports
echo.

pause

