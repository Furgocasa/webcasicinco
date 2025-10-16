-- =====================================================
-- Crear tabla de ciudades para selector de indexación
-- =====================================================

-- Crear tabla cities si no existe
CREATE TABLE IF NOT EXISTS cities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  province TEXT NOT NULL,
  population INTEGER NOT NULL,
  coords JSONB NOT NULL, -- { lat: number, lng: number }
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_cities_province ON cities(province);
CREATE INDEX IF NOT EXISTS idx_cities_population ON cities(population DESC);
CREATE INDEX IF NOT EXISTS idx_cities_name ON cities(name);

-- Comentarios
COMMENT ON TABLE cities IS 'Ciudades de España con población y coordenadas para indexación';
COMMENT ON COLUMN cities.coords IS 'Coordenadas en formato JSON: {"lat": 40.4168, "lng": -3.7038}';

-- =====================================================
-- Insertar ciudades principales de España
-- =====================================================

-- Murcia (8 ciudades)
INSERT INTO cities (name, province, population, coords) VALUES
('Murcia', 'Murcia', 459403, '{"lat": 37.9922, "lng": -1.1307}'),
('Cartagena', 'Murcia', 218210, '{"lat": 37.6256, "lng": -0.9962}'),
('Lorca', 'Murcia', 95515, '{"lat": 37.6775, "lng": -1.6947}'),
('Molina de Segura', 'Murcia', 71477, '{"lat": 38.0531, "lng": -1.2131}'),
('Alcantarilla', 'Murcia', 42184, '{"lat": 37.9719, "lng": -1.2161}'),
('Mazarrón', 'Murcia', 31562, '{"lat": 37.5994, "lng": -1.3142}'),
('Yecla', 'Murcia', 34547, '{"lat": 38.6117, "lng": -1.1147}'),
('Águilas', 'Murcia', 35205, '{"lat": 37.4069, "lng": -1.5836}')
ON CONFLICT DO NOTHING;

-- A Coruña (5 ciudades principales)
INSERT INTO cities (name, province, population, coords) VALUES
('A Coruña', 'A Coruña', 246056, '{"lat": 43.3623, "lng": -8.4115}'),
('Santiago de Compostela', 'A Coruña', 97848, '{"lat": 42.8782, "lng": -8.5448}'),
('Ferrol', 'A Coruña', 66065, '{"lat": 43.4833, "lng": -8.2333}'),
('Oleiros', 'A Coruña', 37285, '{"lat": 43.3333, "lng": -8.3167}'),
('Narón', 'A Coruña', 39635, '{"lat": 43.5333, "lng": -8.1500}')
ON CONFLICT DO NOTHING;

-- Madrid (10 ciudades)
INSERT INTO cities (name, province, population, coords) VALUES
('Madrid', 'Madrid', 3305408, '{"lat": 40.4168, "lng": -3.7038}'),
('Móstoles', 'Madrid', 209184, '{"lat": 40.3232, "lng": -3.8650}'),
('Alcalá de Henares', 'Madrid', 195649, '{"lat": 40.4818, "lng": -3.3642}'),
('Fuenlabrada', 'Madrid', 193586, '{"lat": 40.2842, "lng": -3.7947}'),
('Leganés', 'Madrid', 188425, '{"lat": 40.3272, "lng": -3.7636}'),
('Getafe', 'Madrid', 180747, '{"lat": 40.3056, "lng": -3.7325}'),
('Alcorcón', 'Madrid', 170514, '{"lat": 40.3458, "lng": -3.8242}'),
('Torrejón de Ardoz', 'Madrid', 131376, '{"lat": 40.4553, "lng": -3.4797}'),
('Parla', 'Madrid', 130124, '{"lat": 40.2378, "lng": -3.7731}'),
('Alcobendas', 'Madrid', 116637, '{"lat": 40.5478, "lng": -3.6414}')
ON CONFLICT DO NOTHING;

-- Barcelona (10 ciudades)
INSERT INTO cities (name, province, population, coords) VALUES
('Barcelona', 'Barcelona', 1636762, '{"lat": 41.3851, "lng": 2.1734}'),
('L''Hospitalet de Llobregat', 'Barcelona', 264923, '{"lat": 41.3597, "lng": 2.1006}'),
('Badalona', 'Barcelona', 223506, '{"lat": 41.4507, "lng": 2.2470}'),
('Terrassa', 'Barcelona', 221216, '{"lat": 41.5639, "lng": 2.0089}'),
('Sabadell', 'Barcelona', 214313, '{"lat": 41.5431, "lng": 2.1089}'),
('Mataró', 'Barcelona', 129661, '{"lat": 41.5397, "lng": 2.4447}'),
('Santa Coloma de Gramenet', 'Barcelona', 117153, '{"lat": 41.4517, "lng": 2.2086}'),
('Cornellà de Llobregat', 'Barcelona', 88592, '{"lat": 41.3578, "lng": 2.0761}'),
('Sant Cugat del Vallès', 'Barcelona', 93467, '{"lat": 41.4722, "lng": 2.0861}'),
('Rubí', 'Barcelona', 77947, '{"lat": 41.4928, "lng": 2.0303}')
ON CONFLICT DO NOTHING;

-- Valencia (8 ciudades)
INSERT INTO cities (name, province, population, coords) VALUES
('Valencia', 'Valencia', 794288, '{"lat": 39.4699, "lng": -0.3763}'),
('Torrent', 'Valencia', 83233, '{"lat": 39.4372, "lng": -0.4664}'),
('Gandía', 'Valencia', 74833, '{"lat": 38.9667, "lng": -0.1833}'),
('Paterna', 'Valencia', 70437, '{"lat": 39.5028, "lng": -0.4403}'),
('Sagunto', 'Valencia', 66259, '{"lat": 39.6667, "lng": -0.2667}'),
('Alzira', 'Valencia', 44788, '{"lat": 39.1525, "lng": -0.4375}'),
('Mislata', 'Valencia', 43735, '{"lat": 39.4753, "lng": -0.4181}'),
('Burjassot', 'Valencia', 37768, '{"lat": 39.5097, "lng": -0.4103}')
ON CONFLICT DO NOTHING;

-- Sevilla (8 ciudades)
INSERT INTO cities (name, province, population, coords) VALUES
('Sevilla', 'Sevilla', 688711, '{"lat": 37.3891, "lng": -5.9845}'),
('Dos Hermanas', 'Sevilla', 134378, '{"lat": 37.2817, "lng": -5.9206}'),
('Alcalá de Guadaíra', 'Sevilla', 75588, '{"lat": 37.3414, "lng": -5.8461}'),
('Utrera', 'Sevilla', 50665, '{"lat": 37.1833, "lng": -5.7833}'),
('Mairena del Aljarafe', 'Sevilla', 46351, '{"lat": 37.3436, "lng": -6.0650}'),
('Écija', 'Sevilla', 40631, '{"lat": 37.5417, "lng": -5.0833}'),
('Los Palacios y Villafranca', 'Sevilla', 38531, '{"lat": 37.1592, "lng": -5.9239}'),
('La Rinconada', 'Sevilla', 38414, '{"lat": 37.4833, "lng": -5.9667}')
ON CONFLICT DO NOTHING;

-- Nota: Se pueden agregar más ciudades ejecutando INSERT adicionales
-- La aplicación también puede cargar ciudades desde el archivo cities-database.ts como fallback

COMMENT ON TABLE cities IS 'Actualizado: 2025-10-16 - Ciudades principales de España para indexación granular';

