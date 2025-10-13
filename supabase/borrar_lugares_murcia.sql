-- ========================================
-- SCRIPT PARA BORRAR LUGARES DE MURCIA
-- ========================================
-- Este script borra todos los lugares de la provincia de Murcia
-- para poder re-indexar y probar el sistema de indexación.

-- PASO 1: Ver cuántos lugares hay en Murcia
SELECT COUNT(*) as total_murcia
FROM public.places
WHERE province = 'Murcia';

-- PASO 2: Ver detalle de los lugares (opcional)
-- SELECT id, name, category, city, rating, review_count, created_at
-- FROM public.places
-- WHERE province = 'Murcia'
-- ORDER BY created_at DESC;

-- PASO 3: BORRAR LUGARES DE MURCIA
-- ⚠️ CUIDADO: Esto borrará permanentemente los lugares
-- Descomenta la siguiente línea para ejecutar:

DELETE FROM public.places WHERE province = 'Murcia';

-- PASO 4: Verificar que se borraron (debe retornar 0)
SELECT COUNT(*) as murcia_restantes FROM public.places WHERE province = 'Murcia';

-- PASO 5: Ver total de lugares restantes
SELECT COUNT(*) as total_general FROM public.places;

-- PASO 6: Distribución por provincia
-- SELECT province, COUNT(*) as total
-- FROM public.places
-- GROUP BY province
-- ORDER BY total DESC;
