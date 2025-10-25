-- Limpiar valores incorrectos de "Todas" en el campo region
-- y actualizar con la comunidad autónoma correcta según provincia

UPDATE places
SET region = CASE province
  -- Andalucía
  WHEN 'Almería' THEN 'Andalucía'
  WHEN 'Cádiz' THEN 'Andalucía'
  WHEN 'Córdoba' THEN 'Andalucía'
  WHEN 'Granada' THEN 'Andalucía'
  WHEN 'Huelva' THEN 'Andalucía'
  WHEN 'Jaén' THEN 'Andalucía'
  WHEN 'Málaga' THEN 'Andalucía'
  WHEN 'Sevilla' THEN 'Andalucía'
  
  -- Aragón
  WHEN 'Huesca' THEN 'Aragón'
  WHEN 'Teruel' THEN 'Aragón'
  WHEN 'Zaragoza' THEN 'Aragón'
  
  -- Asturias
  WHEN 'Asturias' THEN 'Asturias'
  
  -- Islas Baleares
  WHEN 'Islas Baleares' THEN 'Islas Baleares'
  WHEN 'Baleares' THEN 'Islas Baleares'
  
  -- Canarias
  WHEN 'Las Palmas' THEN 'Canarias'
  WHEN 'Santa Cruz de Tenerife' THEN 'Canarias'
  
  -- Cantabria
  WHEN 'Cantabria' THEN 'Cantabria'
  
  -- Castilla-La Mancha
  WHEN 'Albacete' THEN 'Castilla-La Mancha'
  WHEN 'Ciudad Real' THEN 'Castilla-La Mancha'
  WHEN 'Cuenca' THEN 'Castilla-La Mancha'
  WHEN 'Guadalajara' THEN 'Castilla-La Mancha'
  WHEN 'Toledo' THEN 'Castilla-La Mancha'
  
  -- Castilla y León
  WHEN 'Ávila' THEN 'Castilla y León'
  WHEN 'Burgos' THEN 'Castilla y León'
  WHEN 'León' THEN 'Castilla y León'
  WHEN 'Palencia' THEN 'Castilla y León'
  WHEN 'Salamanca' THEN 'Castilla y León'
  WHEN 'Segovia' THEN 'Castilla y León'
  WHEN 'Soria' THEN 'Castilla y León'
  WHEN 'Valladolid' THEN 'Castilla y León'
  WHEN 'Zamora' THEN 'Castilla y León'
  
  -- Cataluña
  WHEN 'Barcelona' THEN 'Cataluña'
  WHEN 'Girona' THEN 'Cataluña'
  WHEN 'Lleida' THEN 'Cataluña'
  WHEN 'Tarragona' THEN 'Cataluña'
  
  -- Comunidad Valenciana
  WHEN 'Alicante' THEN 'Comunidad Valenciana'
  WHEN 'Castellón' THEN 'Comunidad Valenciana'
  WHEN 'Valencia' THEN 'Comunidad Valenciana'
  
  -- Extremadura
  WHEN 'Badajoz' THEN 'Extremadura'
  WHEN 'Cáceres' THEN 'Extremadura'
  
  -- Galicia
  WHEN 'A Coruña' THEN 'Galicia'
  WHEN 'Lugo' THEN 'Galicia'
  WHEN 'Ourense' THEN 'Galicia'
  WHEN 'Pontevedra' THEN 'Galicia'
  
  -- Madrid
  WHEN 'Madrid' THEN 'Comunidad de Madrid'
  
  -- Murcia
  WHEN 'Murcia' THEN 'Región de Murcia'
  
  -- Navarra
  WHEN 'Navarra' THEN 'Navarra'
  
  -- País Vasco
  WHEN 'Álava' THEN 'País Vasco'
  WHEN 'Guipúzcoa' THEN 'País Vasco'
  WHEN 'Vizcaya' THEN 'País Vasco'
  
  -- La Rioja
  WHEN 'La Rioja' THEN 'La Rioja'
  
  -- Ceuta y Melilla
  WHEN 'Ceuta' THEN 'Ceuta'
  WHEN 'Melilla' THEN 'Melilla'
  
  ELSE region  -- Si no coincide, mantener el valor actual
END
WHERE region = 'Todas' OR region = 'España' OR region IS NULL OR region = '';

-- Ver el resultado
SELECT 
  region,
  COUNT(*) as total,
  array_agg(DISTINCT province) as provincias
FROM places
WHERE published = true
GROUP BY region
ORDER BY total DESC;


