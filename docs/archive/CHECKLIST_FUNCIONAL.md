# ✅ Checklist de Funcionalidad - Casi Cinco

**Fecha:** 12 de Octubre de 2025  
**Versión:** 2.0.0 - BETA 2.0  
**Ambiente:** Producción (AWS Amplify)

---

## 🎯 Verificación Paso a Paso

### **PASO 1: Diagnóstico de Variables** ⚠️ CRÍTICO

**URL:** https://main.d2nzzzmoajf631.amplifyapp.com/api/diagnostico

**Debe mostrar:**
```json
{
  "success": true,
  "variables": {
    "NEXT_PUBLIC_SUPABASE_URL": "✅ Configurada",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "✅ Configurada",
    "SUPABASE_SERVICE_ROLE_KEY": "✅ Configurada",
    "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY": "✅ Configurada",
    "GOOGLE_PLACES_API_KEY": "✅ Configurada",
    "OPENAI_API_KEY": "✅ Configurada",
    "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY": "✅ Configurada",
    "STRIPE_SECRET_KEY": "✅ Configurada",
    "STRIPE_WEBHOOK_SECRET": "✅ Configurada"
  }
}
```

**Si hay ❌ FALTA:** Las variables NO están llegando al runtime → Ver solución abajo

---

### **PASO 2: Funcionalidades Públicas**

#### **2.1 Home**
- [ ] Carga correctamente
- [ ] Muestra estadísticas (3,528 lugares)
- [ ] Botones funcionan

#### **2.2 Mapa**
- [ ] Carga 3,528 marcadores
- [ ] Filtros funcionan
- [ ] Click en marcador muestra card
- [ ] Geolocalización funciona
- [ ] Lista de lugares visible

---

### **PASO 3: Funcionalidades con IA**

#### **3.1 Chatbot "Tío Viajero"** 🤖
**Prueba:**
```
Pregunta: "restaurantes en Barcelona"
```

**Debe:**
- [ ] Responder en <5 segundos
- [ ] Mostrar 5 restaurantes
- [ ] Enlaces "Ver detalles" y "Ver en mapa" funcionan
- [ ] Formateo markdown correcto

**Si falla:** Falta `OPENAI_API_KEY`

---

#### **3.2 Planificador de Rutas** 🗺️
**Prueba:**
```
Origen: Madrid
Destino: Valencia
Radio: 10km
Categoría: Restaurantes
```

**Debe:**
- [ ] Autocompletado funciona (Google Places)
- [ ] Calcula ruta (muestra distancia y tiempo)
- [ ] Encuentra lugares en el camino
- [ ] Muestra marcadores en el mapa

**Si falla:** Falta `GOOGLE_PLACES_API_KEY` o `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

---

### **PASO 4: Panel de Administración**

#### **4.1 Dashboard** 📊
- [ ] Muestra Total Lugares (debería ser >3000)
- [ ] Muestra Publicados vs Borradores
- [ ] Muestra Rating Promedio
- [ ] Gráficos de distribución (Tiers, Categorías, Provincias)
- [ ] Top 10 ciudades y comunidades

**Si muestra solo 100 lugares:** La carga en lotes no funcionó

---

#### **4.2 Gestión de Lugares** 📍
- [ ] Carga TODOS los lugares (3,528)
- [ ] Tabla muestra correctamente
- [ ] Filtros por categoría/provincia funcionan
- [ ] Búsqueda por nombre funciona
- [ ] Botón "Enriquecer con IA" funciona
- [ ] Botón "Publicar Todos" funciona

---

#### **4.3 Indexar Lugares** 🔍
**Prueba:**
```
Buscar: "restaurantes sevilla"
```

**Debe:**
- [ ] Muestra resultados de Google Places
- [ ] Rating y reseñas visibles
- [ ] Puede indexar lugares seleccionados
- [ ] Queue se crea correctamente

**Si falla:** Falta `GOOGLE_PLACES_API_KEY`

---

#### **4.4 Configuración** ⚙️
**URL:** /admin/configuracion

**Debe mostrar:**
- [ ] Google Maps API: ✓ Configurada
- [ ] OpenAI API: ✓ Configurada
- [ ] Supabase URL: ✓ Configurada
- [ ] Supabase Anon Key: ✓ Configurada

**Si muestra "❌ No configurada":** Variables no disponibles en frontend

---

### **PASO 5: Funcionalidades Stripe** 💳

#### **5.1 Página de Pricing**
- [ ] Planes se muestran correctamente
- [ ] Botones "Suscribirse" funcionan
- [ ] Redirige a Stripe Checkout

#### **5.2 Portal de Cliente**
- [ ] Desde /perfil se puede acceder
- [ ] Stripe Customer Portal se abre

**Si falla:** Falta `STRIPE_SECRET_KEY`

---

## 🐛 Solución de Problemas

### **Problema: Variables con ❌ FALTA**

**Causa:** AWS Amplify no pasa variables server-side al runtime

**Solución:**

1. **Verificar `next.config.js` tiene:**
```javascript
env: {
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  GOOGLE_PLACES_API_KEY: process.env.GOOGLE_PLACES_API_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
}
```

2. **Redesplegar** en AWS Amplify

3. **Verificar** `/api/diagnostico` de nuevo

---

### **Problema: Dashboard Solo Muestra 100 Lugares**

**Causa:** Frontend no carga en lotes

**Solución:** Ya arreglado en último commit (`c66abdd`)

**Verificar:** Redesplegar y ver si dashboard muestra >3000

---

### **Problema: Chatbot No Responde**

**Causa:** `OPENAI_API_KEY` no disponible

**Verificar:**
1. `/api/diagnostico` → `OPENAI_API_KEY: "✅ Configurada"`
2. Si dice "❌ FALTA" → Redesplegar
3. Console del navegador (F12) → Ver errores específicos

---

## 📊 Resultado Esperado

**Todas las casillas ✅ marcadas** = Listo para BETA 3.0

---

## 🚀 Siguiente Paso: BETA 3.0

Una vez que TODO funcione:
- Rediseño móvil del mapa
- Bottom navigation
- Bottom sheets
- Gestos táctiles
- PWA features

---

**Usa este checklist después del próximo deploy.** ✅

