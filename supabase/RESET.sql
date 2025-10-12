-- ============================================================================
-- RESET COMPLETO - BORRAR TODOS LOS LUGARES Y TRABAJOS
-- ============================================================================
-- PRECAUCIÓN: Esto eliminará TODO. Solo ejecuta si quieres empezar de cero.
-- ============================================================================

-- 1. Eliminar todos los trabajos de indexación
DELETE FROM public.indexation_jobs;

-- 2. Eliminar todos los lugares
DELETE FROM public.places;

-- 3. Verificar que todo está limpio
SELECT 
  'Lugares eliminados' as accion,
  (SELECT COUNT(*) FROM public.places) as lugares_restantes,
  (SELECT COUNT(*) FROM public.indexation_jobs) as trabajos_restantes;

-- ============================================================================
-- ✅ RESULTADO ESPERADO:
-- lugares_restantes: 0
-- trabajos_restantes: 0
-- ============================================================================

-- Ahora estás listo para empezar de cero con el nuevo sistema mejorado:
-- 1. Ve a "Indexar Lugares" en el admin
-- 2. Selecciona provincia + categoría
-- 3. Los lugares se guardarán como borradores con categorización IA
-- 4. Luego enriqueces con IA para generar descripciones
-- 5. Se publican automáticamente después del enriquecimiento

