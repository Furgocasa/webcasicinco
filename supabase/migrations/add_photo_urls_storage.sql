-- Migración: Agregar photo_urls para guardar imágenes en Supabase Storage
-- Fecha: 2025-10-13
-- Descripción: Ahorra costos evitando llamadas repetidas a Google Photos API

-- ============================================================================
-- 1. AGREGAR COLUMNA photo_urls a tabla places
-- ============================================================================

ALTER TABLE public.places 
ADD COLUMN IF NOT EXISTS photo_urls TEXT[];

COMMENT ON COLUMN public.places.photo_urls IS 'URLs de fotos almacenadas en Supabase Storage (ahorra costos de Google API)';

-- ============================================================================
-- 2. CREAR BUCKET place-photos en Supabase Storage
-- ============================================================================
-- NOTA: Esto debe ejecutarse desde el Dashboard de Supabase
--       Ve a: Storage → Create bucket
--       Nombre: place-photos
--       Public: true (para que las URLs sean accesibles)
-- ============================================================================

-- Insertar en storage.buckets (requiere privilegios)
INSERT INTO storage.buckets (id, name, public)
VALUES ('place-photos', 'place-photos', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 3. CREAR POLÍTICA RLS para el bucket (público)
-- ============================================================================

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Fotos de lugares públicas 1" ON storage.objects;
DROP POLICY IF EXISTS "Subir fotos requiere autenticación" ON storage.objects;
DROP POLICY IF EXISTS "Actualizar fotos solo admin" ON storage.objects;
DROP POLICY IF EXISTS "Borrar fotos solo admin" ON storage.objects;

-- Permitir SELECT público (leer fotos)
CREATE POLICY "Fotos de lugares públicas 1" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'place-photos');

-- Permitir INSERT solo para usuarios autenticados (subir fotos al indexar)
CREATE POLICY "Subir fotos requiere autenticación"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'place-photos' AND
  auth.role() = 'authenticated'
);

-- Permitir UPDATE solo para admin (actualizar fotos)
CREATE POLICY "Actualizar fotos solo admin"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'place-photos' AND
  auth.uid() IN (
    SELECT id FROM auth.users 
    WHERE (raw_user_meta_data->>'role') = 'admin'
  )
);

-- Permitir DELETE solo para admin
CREATE POLICY "Borrar fotos solo admin"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'place-photos' AND
  auth.uid() IN (
    SELECT id FROM auth.users 
    WHERE (raw_user_meta_data->>'role') = 'admin'
  )
);

-- ============================================================================
-- ✅ MIGRACIÓN COMPLETADA
-- ============================================================================

SELECT 
  '✅ Columna photo_urls agregada y bucket place-photos creado' as mensaje,
  'Ahora los nuevos lugares guardarán fotos en Supabase Storage' as info,
  'Lugares existentes seguirán usando photo_reference de Google' as backward_compatibility;

