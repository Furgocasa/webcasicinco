# 🏙️ MIGRACIÓN: Tabla de Ciudades

## 📋 ¿Qué hace esta migración?

Crea la tabla `cities` en Supabase con las ciudades principales de España para el selector de indexación.

---

## 🚀 OPCIÓN 1: Ejecutar con Supabase CLI (Recomendado)

```bash
# Si tienes Supabase CLI instalado:
supabase db push

# O aplicar esta migración específica:
supabase migration up
```

---

## 🌐 OPCIÓN 2: Ejecutar en Supabase Dashboard (MÁS FÁCIL)

### Paso 1: Ir al SQL Editor
1. Abre [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto
3. Ve a **SQL Editor** (icono de base de datos en el menú izquierdo)

### Paso 2: Copiar y Ejecutar el SQL
1. Copia **TODO** el contenido de: `supabase/migrations/20251016_create_cities_table.sql`
2. Pégalo en el editor SQL
3. Haz clic en **Run** (botón verde abajo a la derecha)

### Paso 3: Verificar
Ejecuta esta query para verificar que se crearon las ciudades:

```sql
SELECT province, COUNT(*) as total_ciudades
FROM cities
GROUP BY province
ORDER BY total_ciudades DESC;
```

Deberías ver:
```
Madrid      | 10
Barcelona   | 10
Murcia      | 8
Valencia    | 8
Sevilla     | 8
A Coruña    | 5
```

---

## ✅ DESPUÉS DE EJECUTAR

1. **Refresca** la página `/admin/indexar`
2. **Selecciona** provincia "Murcia" (o cualquier otra)
3. **Verás** el selector de ciudades con la lista completa
4. **Funciona** el selector sin errores

---

## 🔧 SOLUCIÓN DE PROBLEMAS

### Error: "relation cities does not exist"
→ La migración no se ejecutó. Repite OPCIÓN 2.

### Error: "permission denied for table cities"
→ Verifica que tu usuario tenga permisos. Ejecuta:
```sql
GRANT ALL ON TABLE cities TO anon, authenticated, service_role;
```

### No aparecen ciudades
→ Verifica que se insertaron:
```sql
SELECT * FROM cities LIMIT 10;
```

---

## 📦 AGREGAR MÁS CIUDADES

Si necesitas agregar ciudades de otras provincias:

```sql
INSERT INTO cities (name, province, population, coords) VALUES
('Tu Ciudad', 'Tu Provincia', 12345, '{"lat": 40.4168, "lng": -3.7038}')
ON CONFLICT DO NOTHING;
```

---

## 🎯 PRÓXIMO PASO

Después de ejecutar la migración, el selector de ciudades funcionará perfectamente. 🚀

