-- Script para borrar lugares de Murcia (TESTING DE INDEXACIÓN)
-- ⚠️ CUIDADO: Esto borrará permanentemente los lugares de Murcia

-- 1. Ver cuántos lugares de Murcia hay antes de borrar
SELECT COUNT(*) as total_murcia
FROM public.places
WHERE province = 'Murcia';

-- 2. Ver detalle de los lugares a borrar (opcional)
SELECT id, name, category, city, rating, review_count, created_at
FROM public.places
WHERE province = 'Murcia'
ORDER BY created_at DESC;

-- 3. BORRAR lugares de Murcia
-- Descomentar esta línea solo cuando estés seguro:
-- DELETE FROM public.places WHERE province = 'Murcia';

-- 4. Verificar que se borraron (debe retornar 0)
-- SELECT COUNT(*) FROM public.places WHERE province = 'Murcia';

-- 5. Ver cuántos lugares quedan en total
SELECT COUNT(*) as total_restante FROM public.places;

-- 6. Ver distribución por provincia
SELECT province, COUNT(*) as total
FROM public.places
GROUP BY province
ORDER BY total DESC;

