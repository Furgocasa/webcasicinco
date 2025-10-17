# 📝 Script: Poblar Subcategorías de Restaurantes

## 🎯 Propósito

Este script rellena el campo `subcategory` de los restaurantes en la base de datos usando:
1. **Keywords locales** (GRATIS) - Para casos obvios
2. **OpenAI GPT-4o-mini** (~$0.0001 por lugar) - Para casos ambiguos

## 🚀 Uso

### **Opción 1: Desde Terminal**

```bash
# Instalar dependencia si no la tienes
npm install tsx -D

# Ejecutar script
npx tsx scripts/populate-subcategories.ts
```

### **Opción 2: Desde Panel Admin (API)**

**Ver estadísticas:**
```bash
GET /api/admin/populate-subcategories
```

**Ejecutar procesamiento:**
```bash
POST /api/admin/populate-subcategories
Content-Type: application/json

{
  "limit": 50  // Opcional, por defecto 50
}
```

**Ejemplo con curl:**
```bash
curl -X POST https://tu-dominio.com/api/admin/populate-subcategories \
  -H "Content-Type: application/json" \
  -H "Cookie: tu-cookie-de-sesion" \
  -d '{"limit": 30}'
```

## 📊 Proceso

### **Fase 1: Keywords (Gratis)**
El script busca palabras clave en el nombre y descripción:

```
"Taquería El Azteca" → Detecta "taco" → subcategory = 'mexicana'
"Pizzería Napoli" → Detecta "pizza" → subcategory = 'italiana'
"Sushi Master" → Detecta "sushi" → subcategory = 'japonesa'
```

**Cobertura:** ~90% de casos

### **Fase 2: OpenAI (Solo ambiguos)**
Para restaurantes como:
- "La Maison Bistrot" → OpenAI → "francesa"
- "El Jardín Secreto" → OpenAI → "mediterránea" o "fusión"
- "Casa Paco" → OpenAI → "tapas"

**Cobertura:** ~10% restante

## 💰 Costes

| Método | Lugares | Coste unitario | Coste total |
|--------|---------|----------------|-------------|
| **Keywords** | 270 | $0 | $0 |
| **OpenAI** | 30 | $0.0001 | $0.003 |
| **TOTAL** | 300 | - | **< $0.01** |

## 📋 Subcategorías Soportadas

```typescript
✅ mexicana      ✅ italiana       ✅ japonesa
✅ china         ✅ india          ✅ mariscos
✅ tapas         ✅ asador         ✅ mediterránea
✅ francesa      ✅ peruana        ✅ argentina
✅ árabe         ✅ fusión         ✅ vegetariana
```

## 🔧 Configuración

El script usa estas variables de entorno:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu_service_key
OPENAI_API_KEY=sk-...
```

## 📤 Salida

### **Ejemplo de ejecución:**

```
🚀 Iniciando proceso de población de subcategorías...

📊 Encontrados 45 lugares sin subcategoría

🔍 [Keywords] Taquería Los Arcos → mexicana
🔍 [Keywords] Pizzería Da Vinci → italiana
🔍 [Keywords] Sushi Bar Tokio → japonesa
🤖 [OpenAI] Analizando La Maison Bistrot...
   ✅ La Maison Bistrot → francesa
🔍 [Keywords] Marisquería El Faro → mariscos
   ⚠️ Casa del Pueblo → No se pudo determinar

==================================================
📊 RESUMEN FINAL
==================================================
✅ Actualizados con keywords: 38 (GRATIS)
🤖 Actualizados con OpenAI: 6 ($0.0006)
⚠️  Omitidos: 1
📈 Total procesados: 45
==================================================

💰 Coste estimado: $0.0006 (menos de 1 centavo)

✅ Script completado
```

## 🎯 Cuándo Ejecutarlo

### **Ejecuta el script cuando:**
- ✅ Acabas de indexar nuevos restaurantes
- ✅ Quieres mejorar la precisión del chatbot
- ✅ Ves que hay muchos lugares sin subcategory

### **NO necesitas ejecutarlo si:**
- ❌ Ya todos tienen subcategory
- ❌ Solo tienes 1-2 lugares nuevos (hazlo manual)

## 📈 Verificación

**Ver lugares sin subcategory:**
```sql
SELECT COUNT(*) 
FROM places 
WHERE category = 'restaurante' 
  AND subcategory IS NULL;
```

**Ver distribución de subcategorías:**
```sql
SELECT subcategory, COUNT(*) as total
FROM places
WHERE category = 'restaurante'
  AND subcategory IS NOT NULL
GROUP BY subcategory
ORDER BY total DESC;
```

## 🛡️ Seguridad

- ✅ Solo accesible por admins
- ✅ Validación de autenticación
- ✅ Rate limiting incluido (delay entre llamadas OpenAI)
- ✅ Logs detallados
- ✅ Rollback fácil (es solo UPDATE)

## 🔄 Rollback

Si necesitas revertir cambios:

```sql
-- Borrar todas las subcategorías
UPDATE places 
SET subcategory = NULL 
WHERE category = 'restaurante';

-- O solo las añadidas hoy
UPDATE places 
SET subcategory = NULL 
WHERE category = 'restaurante' 
  AND updated_at > NOW() - INTERVAL '1 day';
```

## 📞 Troubleshooting

### **Error: "OpenAI API key not found"**
```bash
# Verifica que la variable existe
echo $OPENAI_API_KEY

# Si no existe, añádela a .env.local
OPENAI_API_KEY=sk-tu-key-aqui
```

### **Error: "Supabase service key not found"**
```bash
# Añade a .env.local
SUPABASE_SERVICE_ROLE_KEY=tu-service-key
```

### **El script se queda parado**
- Verifica tu conexión a internet
- Revisa límites de rate de OpenAI
- El script tiene delay de 100ms entre llamadas

### **Costes muy altos**
El script debería costar < $0.01 para 300 lugares. Si ves costes mayores:
- Verifica que está usando `gpt-4o-mini` (no `gpt-4`)
- Revisa que el delay está funcionando
- Limita el número de lugares con el parámetro `limit`

---

**¿Preguntas? Revisa el archivo principal: `MEJORAS_CHATBOT_SUBCATEGORIAS.md`**

