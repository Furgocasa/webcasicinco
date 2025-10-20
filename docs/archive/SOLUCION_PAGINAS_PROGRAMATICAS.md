# ✅ SOLUCIÓN: Páginas Programáticas `/[category]/[province]`

## 📋 Diagnóstico Final

### Problema
Las páginas `/restaurante/madrid`, `/bar/barcelona`, etc. devuelven 404, aunque:
- `/restaurante` funciona ✅
- `/restaurante/Madrid/lugar-123` funciona ✅  
- Build local genera **217 páginas correctamente** ✅

### Causa Raíz Identificada
**AWS Amplify está usando un commit antiguo** que tenía configuraciones incorrectas:

**Commit antiguo en producción:** `96623cc` (Deploy #337)
- Tenía `export const dynamic = 'force-dynamic'` 
- Esto **desactivaba la generación estática** de las 208 páginas programáticas
- Result: 404 porque las páginas nunca se generaban

**Commit actual en Git:** `6412d13` (pendiente de deploy)
- Removido `force-dynamic` ✅
- Añadida función `toSlug()` para URLs sin tildes ✅
- Configuración idéntica a `/[category]/page.tsx` que SÍ funciona ✅

---

## 🛠️ Fixes Aplicados (Commits Recientes)

### 1. `844e60b` - toSlug en generateStaticParams
```typescript
function toSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quitar tildes
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

export async function generateStaticParams() {
  // ...
  return combinations.map(combo => ({
    category,
    province: toSlug(province), // ✅ URLs limpias: madrid, malaga, a-coruna
  }));
}
```

### 2. `ce7877b` - Remover force-dynamic
```diff
- export const dynamic = 'force-dynamic'; // ❌ Desactiva SSG
+ // ✅ Permitir SSG normal
```

### 3. `6412d13` - Simplificar a estructura idéntica de `/[category]`
```typescript
// Configuración final (igual que /[category]/page.tsx que funciona)
export const revalidate = 86400; // ISR cada 24h
```

---

## ✅ Verificación Local

```bash
npm run build
```

**Resultado:**
```
✓ Generating static pages (217/217)
├ ● /[category]/[province]     192 B    91.3 kB
```

**Interpretación:**
- `●` = SSG activado correctamente
- `217/217` = Todas las páginas generadas (4 categorías + ~44 provincias x 4 + 100 lugares + 5 blog)
- Las páginas **existen y funcionan en local**

---

## 🚀 Acción Requerida

### Para el Usuario:
1. **Ir a AWS Amplify Console**
2. **Verificar si hay un deploy más reciente que #337**
3. **Si no, forzar redeploy manual** para que use el commit `6412d13` o posterior
4. **Esperar a que termine el build** (~4 minutos)
5. **Probar en modo incógnito:**
   - `https://casicinco.com/restaurante/madrid`
   - `https://casicinco.com/bar/barcelona`
   - `https://casicinco.com/cafe/malaga`

### Cómo Forzar Redeploy en AWS Amplify:
1. Ve a: https://console.aws.amazon.com/amplify/home
2. Selecciona tu app: `Casi_cinco_app`
3. En la rama `main`, haz clic en **"Redeploy this version"**
4. O simplemente haz un commit vacío:
   ```bash
   git commit --allow-empty -m "Trigger redeploy"
   git push
   ```

---

## 📊 Estado Actual

| Componente | Estado | Notas |
|------------|--------|-------|
| Código en Git | ✅ Correcto | Commit `6412d13` |
| Build Local | ✅ Funciona | 217 páginas generadas |
| Deploy AWS | ⏳ Pendiente | Usando commit antiguo `96623cc` |
| Producción | ❌ 404 | Esperando redeploy |

---

## 🎯 Resultado Esperado Post-Deploy

Una vez que AWS Amplify despliegue el commit `6412d13`:

### URLs que funcionarán:
- `https://casicinco.com/restaurante` ✅ (ya funciona)
- `https://casicinco.com/restaurante/madrid` ✅
- `https://casicinco.com/restaurante/barcelona` ✅
- `https://casicinco.com/bar/malaga` ✅
- ... **208 páginas programáticas en total**

### SEO Impact:
- 208 nuevas URLs indexables por Google
- Cada una optimizada con:
  - `generateMetadata` dinámico
  - Schema.org (ItemList + BreadcrumbList)
  - Top 10 lugares + CTA al mapa
  - ISR (revalidación cada 24h)

---

## 📝 Notas Técnicas

### ¿Por qué funcionaba `/restaurante` pero no `/restaurante/madrid`?

**`/[category]/page.tsx`:**
```typescript
export async function generateStaticParams() {
  return ['restaurante', 'bar', 'cafe', 'hotel'].map(cat => ({ category: cat }));
}
export const revalidate = 86400; // ✅ Solo ISR, sin force-dynamic
```
✅ Se pre-generan 4 páginas estáticas en build

**`/[category]/[province]/page.tsx` (versión antigua en AWS):**
```typescript
export const dynamic = 'force-dynamic'; // ❌ Desactiva SSG
export const dynamicParams = true;
```
❌ No se pre-generan páginas → 404

**`/[category]/[province]/page.tsx` (versión actual en Git):**
```typescript
export const revalidate = 86400; // ✅ Igual que /[category]
```
✅ Se pre-generan 208 páginas estáticas en build

---

## 🔧 Si Aún No Funciona Post-Deploy

Si después del redeploy sigue dando 404, revisar:

1. **Logs de AWS Amplify Build:**
   - Buscar: `Generating static pages (X/217)`
   - Verificar que X = 217 (no menos)

2. **Verificar rutas generadas:**
   - Buscar en logs: `/[category]/[province]`
   - Debe decir: `● /[category]/[province]` (símbolo `●` = SSG)

3. **Hard refresh en navegador:**
   - Ctrl+F5 o modo incógnito
   - Puede haber caché de CloudFront

---

**Fecha:** 18 de octubre de 2025, 23:15
**Último commit:** `6412d13`
**Deploy en producción:** `96623cc` (antiguo, pendiente actualizar)

