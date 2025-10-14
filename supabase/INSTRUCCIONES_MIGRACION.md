# 🚀 Migración: Sistema de Indexación Profesional

## 📋 ¿Qué hace esta migración?

Esta actualización transforma el sistema de indexación en uno **100% profesional** con:

✅ **Control de procesos en tiempo real**
- Pausar/Reanudar trabajos
- Cancelación efectiva que detiene el proceso real
- Prevención de trabajos zombies

✅ **Logs en tiempo real**
- Ver el progreso detallado de cada búsqueda
- Identificar errores inmediatamente
- Logs guardados en el historial

✅ **Sistema robusto**
- Solo un trabajo activo por admin
- Auto-detección de trabajos zombies
- Persistencia entre sesiones

---

## 🎯 Paso a Paso para Ejecutar la Migración

### **Opción 1: Desde Supabase Dashboard (Recomendado)**

1. **Abre tu proyecto en Supabase**
   - Ve a: https://supabase.com/dashboard
   - Selecciona tu proyecto "Casi Cinco"

2. **Abre el SQL Editor**
   - En el menú lateral: `SQL Editor`
   - Click en `New query`

3. **Copia y pega el contenido**
   - Abre el archivo: `supabase/actualizar_sistema_profesional.sql`
   - Copia TODO el contenido
   - Pégalo en el editor SQL de Supabase

4. **Ejecuta el script**
   - Click en `Run` (o presiona `Ctrl+Enter`)
   - Espera unos segundos...

5. **Verifica el resultado**
   - Deberías ver mensajes de éxito
   - Al final aparecerá un resumen con:
     ```
     ✅ ACTUALIZACIÓN COMPLETADA EXITOSAMENTE
     ✓ Total de trabajos: X
     ✓ Trabajos activos: 0
     ✓ Zombies limpiados: Y
     ```

---

### **Opción 2: Desde psql (Avanzado)**

Si tienes acceso directo a PostgreSQL:

```bash
# Conectar a tu BD
psql postgresql://[TU_CONNECTION_STRING]

# Ejecutar el script
\i supabase/actualizar_sistema_profesional.sql
```

---

## 🔍 Verificar que todo funcionó

Después de ejecutar la migración, puedes verificar con estas queries:

```sql
-- Ver la estructura actualizada
\d indexation_jobs

-- Verificar nuevos campos
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'indexation_jobs'
  AND column_name IN ('should_continue', 'paused_at', 'logs');

-- Verificar funciones creadas
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name LIKE '%job%' 
  AND routine_type = 'FUNCTION';

-- Ver trabajos actuales y su estado
SELECT 
  id,
  status,
  should_continue,
  jsonb_array_length(logs) as log_count,
  created_at
FROM indexation_jobs
ORDER BY created_at DESC
LIMIT 5;
```

---

## 📊 Nuevos Campos Añadidos

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `should_continue` | BOOLEAN | Control de ejecución. Si es `false`, el proceso se detiene |
| `paused_at` | TIMESTAMP | Cuándo se pausó el trabajo (para poder reanudarlo) |
| `logs` | JSONB | Array de logs en tiempo real `[{timestamp, level, message, details}]` |

---

## 🆕 Nuevos Estados

Además de los estados existentes (`pending`, `running`, `completed`, `failed`), ahora tienes:

- **`paused`**: Trabajo pausado, puede reanudarse
- **`cancelled`**: Trabajo cancelado manualmente

---

## 🔧 Nuevas Funciones SQL

### 1. `cancel_zombie_jobs()`
Detecta y cancela trabajos que llevan >2 horas en "running".

```sql
-- Ejecutar manualmente
SELECT * FROM cancel_zombie_jobs();
```

### 2. `cancel_previous_admin_jobs(admin_id UUID)`
Cancela todos los trabajos activos de un admin específico.

```sql
-- Ejemplo: cancelar trabajos del admin antes de iniciar uno nuevo
SELECT * FROM cancel_previous_admin_jobs('uuid-del-admin');
```

### 3. `add_job_log(job_id, level, message, details)`
Añade un log a un trabajo (mantiene solo los últimos 500).

```sql
-- Ejemplo: añadir log info
SELECT add_job_log(
  'uuid-del-trabajo',
  'info',
  'Buscando en Madrid...',
  NULL
);

-- Ejemplo: añadir log de error con detalles
SELECT add_job_log(
  'uuid-del-trabajo',
  'error',
  'Error en búsqueda',
  '{"city": "Madrid", "error": "Timeout"}'::jsonb
);
```

---

## 🔐 Seguridad (RLS)

La migración también configura **Row Level Security** para que:
- Cada admin solo ve sus propios trabajos
- No puede modificar trabajos de otros admins
- Políticas automáticas en SELECT, INSERT, UPDATE, DELETE

---

## ⚠️ Qué hace la migración con trabajos existentes

1. **Trabajos en "running"**: Se marcan como `failed` con la razón "zombie - actualización del sistema"
2. **Trabajos zombies (>2h)**: Se detectan y cancelan automáticamente
3. **Otros estados**: Se mantienen sin cambios

**Esto es normal y esperado** - asegura que no haya trabajos en estado inconsistente.

---

## ❓ Solución de Problemas

### Error: "constraint already exists"
**Solución**: Es normal, el script usa `IF NOT EXISTS` y `DROP IF EXISTS` para ser idempotente.

### Error: "permission denied"
**Solución**: Asegúrate de ejecutar como superusuario o con permisos de admin en Supabase.

### Error: "column already exists"
**Solución**: Puedes ejecutar el script múltiples veces sin problema, es seguro.

### No veo los cambios
**Solución**: 
1. Refresca la conexión de Supabase en tu app
2. Verifica que el script se ejecutó sin errores
3. Revisa los logs de Supabase

---

## 📞 Soporte

Si tienes problemas:
1. Revisa los mensajes de error en el SQL Editor
2. Verifica que estás usando PostgreSQL 14+ (requerido para algunas funciones JSONB)
3. Contacta con el equipo de desarrollo

---

## ✅ Siguiente Paso

Una vez ejecutada la migración exitosamente, continúa con:
- Actualizar el código backend (APIs)
- Implementar el componente modal flotante
- Añadir el sistema de logs al indexer

**¡Ya tienes la base de datos lista para el sistema profesional! 🎉**

