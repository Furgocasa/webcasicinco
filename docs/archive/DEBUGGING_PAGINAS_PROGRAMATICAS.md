# 🐛 DEBUGGING: Páginas Programáticas

**Problema:** `/restaurante/madrid` da 404

---

## ✅ VERIFICACIONES

### 1. Archivo existe
- ✅ `app/(public)/[category]/[province]/page.tsx` creado
- ✅ Commit: `3d549f6`
- ✅ Push exitoso

### 2. Configuración Next.js
- ✅ `dynamic = 'force-dynamic'` (no pre-genera en build)
- ✅ `dynamicParams = true` (acepta cualquier param)

### 3. Conversión URL → Supabase
```typescript
URL: "/restaurante/madrid"
↓
province = "madrid"
↓
provinceName = "Madrid" (capitalizado)
↓
Busca en Supabase: WHERE province = 'Madrid'
```

---

## 🔍 POSIBLES CAUSAS

### A. Next.js no reconoce la ruta dinámica
**Solución:** Verificar `next.config.js`

### B. AWS Amplify no maneja rutas dinámicas
**Solución:** Necesita configuración especial en AWS

### C. Build falla silenciosamente
**Solución:** Ver logs completos de AWS Amplify

---

## 🚨 LOGS A REVISAR EN AWS

1. **Build logs:**
   - Buscar errores en `Collecting page data`
   - Ver si dice "Error: Failed to collect page data"

2. **Runtime logs:**
   - CloudWatch logs
   - Ver requests a `/restaurante/madrid`

---

## 🔧 SOLUCIÓN TEMPORAL

Si nada funciona, cambiar a SSG con paths predefinidos:

```typescript
export async function generateStaticParams() {
  return [
    { category: 'restaurante', province: 'madrid' },
    { category: 'restaurante', province: 'barcelona' },
    { category: 'bar', province: 'madrid' },
    // ... top 50 combinaciones
  ];
}

export const dynamic = 'auto'; // En vez de force-dynamic
```

---

## 📞 NECESITO DEL USUARIO

Para debuggear necesito ver:

1. **Screenshot de AWS Amplify → Build logs** del último deploy
2. **Error exacto** que aparece en `/restaurante/madrid`
3. **CloudWatch logs** si es posible

---

## 🎯 PLAN B: Si todo falla

Crear páginas estáticas para top provincias:
- `/restaurante-madrid`
- `/restaurante-barcelona`
- `/bar-madrid`

No son tan bonitas pero FUNCIONAN garantizado.

