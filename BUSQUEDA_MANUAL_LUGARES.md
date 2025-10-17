# 🎯 BÚSQUEDA MANUAL DE LUGARES

## 📌 Descripción

Nueva herramienta en el panel de administración que permite buscar y añadir lugares específicos de Google Places manualmente, ideal para casos donde un lugar de calidad no fue capturado en la indexación automática.

---

## ✨ Características

### 🔍 **Búsqueda Inteligente**
- Busca lugares en Google Places Text Search
- Filtrado automático: **solo muestra lugares con ≥4.7★**
- Resultados en tiempo real
- Máximo 10 resultados por búsqueda

### 🗺️ **Visualización en Mapa**
- Mapa interactivo de Google Maps
- Marcadores para todos los resultados
- Click en marcador para ver detalles
- Zoom automático al lugar seleccionado

### ✅ **Validación Automática**
- Verifica rating mínimo de 4.7★
- Comprueba que no exista duplicado en BD
- Valida que esté en España
- Determina categoría automáticamente

### 📍 **Inserción Inteligente**
- Añade lugar como **borrador** (no publicado)
- Marca como **pendiente de enriquecimiento IA**
- Extrae datos completos de Google Places
- Genera slug automático

---

## 📖 Cómo Usar

### 1. Acceder a la Herramienta
```
/admin/buscar-lugar
```

En el menú del admin:
- **Icono:** 🎯
- **Nombre:** Búsqueda Manual

### 2. Buscar un Lugar
```
Ejemplos de búsquedas:
✅ "Restaurante El Patio, Madrid"
✅ "Casa Paco, San Sebastián"
✅ "Hotel Ritz Barcelona"
```

### 3. Revisar Resultados
- Lista de lugares que cumplen ≥4.7★
- Ver ubicación en mapa
- Click en un lugar para ver detalles completos

### 4. Añadir Lugar
1. Selecciona el lugar deseado
2. Revisa rating, reseñas, dirección
3. Click en **"✅ Añadir Lugar"**
4. El lugar se guarda como borrador

### 5. Enriquecer con IA
Después de añadir:
1. Ve a `/admin/enriquecer`
2. Selecciona el lugar añadido manualmente
3. Genera contenido IA (título, descripción, tags)
4. Publica el lugar

---

## 💰 Costes Google API

| Acción | Coste |
|--------|-------|
| Búsqueda (Text Search) | **$0.032** |
| Añadir lugar (Place Details) | **$0.017** |
| **Total por lugar añadido** | **$0.049** |

### Ejemplo de Sesión
```
🔍 1 búsqueda = $0.032
➕ 2 lugares añadidos = $0.034 ($0.017 × 2)
─────────────────────────
💰 Total = $0.066
```

---

## 🔧 Implementación Técnica

### Archivos Creados

#### 1. **API de Búsqueda**
```
app/api/admin/search-manual/route.ts
```
- Text Search en Google Places
- Filtrado por rating ≥4.7
- Retorna place_id, datos básicos

#### 2. **API de Inserción**
```
app/api/admin/add-manual-place/route.ts
```
- Place Details completo
- Validaciones de rating, duplicados, país
- Inserción en BD como borrador

#### 3. **Interfaz de Admin**
```
app/admin/buscar-lugar/page.tsx
```
- Barra de búsqueda
- Lista de resultados
- Mapa interactivo de Google
- Panel de detalles y acciones

#### 4. **Navegación Actualizada**
```
app/admin/layout.tsx
components/layout/Sidebar.tsx
```
- Nuevo item: "🎯 Búsqueda Manual"

---

## 📊 Flujo de Datos

```
┌─────────────────────────────────────────────────┐
│  1. BÚSQUEDA                                    │
│  Admin escribe: "Restaurante La Viña"          │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│  2. GOOGLE PLACES TEXT SEARCH                   │
│  - Busca en Google Places                       │
│  - Filtra ≥4.7★                                 │
│  - Retorna place_ids + datos básicos            │
│  💰 Coste: $0.032                               │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│  3. VISUALIZACIÓN                               │
│  - Muestra lista de resultados                  │
│  - Renderiza marcadores en mapa                 │
│  - Admin selecciona un lugar                    │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│  4. PLACE DETAILS                               │
│  - Obtiene datos completos de Google            │
│  - Valida rating, país, duplicados              │
│  - Determina categoría automáticamente          │
│  💰 Coste: $0.017                               │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│  5. INSERCIÓN EN BD                             │
│  - published: false (borrador)                  │
│  - needs_enrichment: true                       │
│  - photos: referencias de Google                │
│  - Sin AI content (null)                        │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│  6. ENRIQUECIMIENTO IA (Manual)                 │
│  Admin va a /admin/enriquecer                   │
│  - Genera título, descripción, tags             │
│  - Descarga y sube fotos a Supabase             │
│  - Marca como published: true                   │
└─────────────────────────────────────────────────┘
```

---

## ✅ Validaciones Implementadas

### 1. **Rating Mínimo**
```typescript
if (placeDetails.rating < 4.7) {
  return error: "No cumple el requisito mínimo de 4.7★"
}
```

### 2. **Duplicados**
```typescript
const existing = await supabase
  .from('places')
  .eq('google_place_id', place_id)
  .maybeSingle();

if (existing) {
  return error: "Este lugar ya existe"
}
```

### 3. **País**
```typescript
if (country !== 'España' && country !== 'Spain') {
  return error: "Este lugar no está en España"
}
```

### 4. **Autenticación**
```typescript
if (!user || user.role !== 'admin') {
  return error: "No autorizado"
}
```

---

## 🎨 UI/UX

### Layout
```
┌─────────────────────────────────────────────────┐
│  🔍 Búsqueda Manual de Lugares                  │
├─────────────────────────────────────────────────┤
│  [Buscar: _____________________] [🔍 Buscar]    │
│  💰 Coste de esta sesión: $0.066                │
├─────────────────────┬───────────────────────────┤
│  📋 Resultados (5)  │   🗺️ Mapa                │
│  ┌─────────────┐    │   [Mapa de Google]        │
│  │ El Patio    │ ←──┼── Marcador seleccionado   │
│  │ ⭐ 4.8 (567)│    │                           │
│  └─────────────┘    │                           │
│  ┌─────────────┐    │   ┌────────────────────┐ │
│  │ Casa Paco   │    │   │ 🏪 El Patio        │ │
│  │ ⭐ 4.9 (1.2k)│   │   │ ⭐ 4.8★ (567)      │ │
│  └─────────────┘    │   │ 📍 Calle Mayor 12  │ │
│                     │   │ ✅ Cumple ≥4.7★    │ │
│                     │   │ [✅ Añadir] [❌]   │ │
│                     │   └────────────────────┘ │
└─────────────────────┴───────────────────────────┘
```

### Estados Visuales
- **Lugar no seleccionado:** Borde gris
- **Lugar seleccionado:** Borde azul + marcador rojo
- **Cumple requisitos:** Badge verde ✅
- **No cumple:** Badge rojo ❌

---

## 🚀 Casos de Uso

### 1. **Lugar Conocido Faltante**
```
Problema: Un restaurante famoso no salió en la indexación
Solución: Búsqueda manual → Añadir → Enriquecer
```

### 2. **Nuevo Lugar de Calidad**
```
Problema: Un lugar acaba de abrir y tiene 4.9★
Solución: Búsqueda manual → Verificar → Añadir
```

### 3. **Corrección de Zona**
```
Problema: Faltan lugares en una provincia específica
Solución: Buscar "restaurante + ciudad" → Añadir múltiples
```

---

## 📈 Ventajas vs Indexación Automática

| Aspecto | Indexación Automática | Búsqueda Manual |
|---------|----------------------|-----------------|
| Volumen | 100-500 lugares/sesión | 1-10 lugares/sesión |
| Precisión | Media (depende de queries) | **Alta (lugar específico)** |
| Control | Bajo (batch processing) | **Alto (selección individual)** |
| Coste | $20-50 por sesión | **$0.05-0.50 por sesión** |
| Uso | Poblar BD inicial | Añadir lugares específicos |

---

## 🔒 Seguridad

- ✅ Requiere autenticación de admin
- ✅ Validación de role en backend
- ✅ Rate limiting implícito (manual)
- ✅ No permite lugares fuera de España

---

## 📝 Mejoras Futuras

### Prioridad Alta
- [ ] Añadir historial de búsquedas manuales
- [ ] Permitir añadir múltiples lugares a la vez
- [ ] Exportar lista de lugares añadidos

### Prioridad Media
- [ ] Sugerencias de búsqueda basadas en categoría
- [ ] Preview de fotos antes de añadir
- [ ] Edición de datos antes de insertar

### Prioridad Baja
- [ ] Búsqueda por coordenadas GPS
- [ ] Importación masiva desde CSV
- [ ] Integración con otras fuentes (TripAdvisor, etc.)

---

## 📞 Soporte

Para reportar problemas:
1. Revisar logs en Network tab del navegador
2. Verificar que Google API Key esté activa
3. Comprobar saldo de Google Cloud

---

## 📅 Historial

- **17/10/2024:** Implementación inicial
- **Versión:** 1.0
- **Estado:** ✅ Funcional

