@echo off
REM Script para limpiar documentación obsoleta en Windows
REM Ejecutar: limpiar_docs.bat

echo.
echo ============================================
echo    LIMPIEZA DE DOCUMENTACION OBSOLETA
echo ============================================
echo.

set /a eliminados=0
set /a no_encontrados=0

REM Lista de archivos a eliminar
set archivos=ANALISIS_COMPLETO_PROYECTO.md CHECKLIST.md COMPONENTES_NUEVOS.md EMPIEZA_AQUI.md ESTADO-PROYECTO.md ESTADO_ACTUAL_COMPLETO.md ESTADO_PROYECTO.md FASE_ACTUAL.md FELICIDADES_PROYECTO_COMPLETO.md INDICE.md INDICE_FINAL.md INICIO_RAPIDO_30MIN.md INSTALACION.md INVENTARIO_COMPLETO.md LEEME_PRIMERO.md LO_QUE_SE_HA_CREADO.md PROXIMOS_PASOS_HOY.md PROYECTO-COMPLETO.md PROYECTO_COMPLETADO.md PROYECTO_FINAL.md QUE_NOS_FALTA.md QUICKSTART.md RESUMEN.md RESUMEN_EJECUTIVO.md RESUMEN_FINAL_COMPLETO.md RESUMEN_SESION_HOY.md RESUMEN_VISUAL.md ROADMAP.md SIGUIENTE_PASO.md supabase-schema.sql

for %%f in (%archivos%) do (
    if exist "%%f" (
        del "%%f"
        echo [OK] Eliminado: %%f
        set /a eliminados+=1
    ) else (
        echo [!!] No encontrado: %%f
        set /a no_encontrados+=1
    )
)

echo.
echo ============================================
echo                  RESUMEN
echo ============================================
echo Archivos eliminados: %eliminados%
echo Archivos no encontrados: %no_encontrados%
echo ============================================
echo.
echo Documentacion limpia!
echo.
echo Archivos mantenidos:
echo   1. README.md
echo   2. SESION_EPICA_RESUMEN.md
echo   3. ANALISIS_REAL_FUNCIONALIDAD.md
echo   4. PORQUE_TRIUNFARA.md
echo   5. MODELO_MONETIZACION.md
echo   6. SISTEMA_FILTRADO.md
echo   7. MAPA_DOCUMENTACION.md
echo   8. HOME_NUEVA.md
echo   9. RESUMEN_STRIPE.md
echo   10. INDICE_MAESTRO.md
echo.
echo Listo para trabajar!
echo.
pause
