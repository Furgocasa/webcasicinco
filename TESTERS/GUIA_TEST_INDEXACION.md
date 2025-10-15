# 🧪 Guía Completa - Test de Indexación

Este documento explica cómo usar y entender el test de indexación de Casi Cinco App.

---

## 📋 Qué Prueba Este Test

El test `indexacion.test.ts` verifica **TODO el flujo de indexación** de lugares:

### 1️⃣ Acceso y Formulario
- ✅ Admin puede acceder a `/admin/indexar`
- ✅ Formulario tiene todos los controles necesarios
- ✅ Muestra información del sistema Nearby Search
- ✅ Validaciones de campos requeridos

### 2️⃣ Proceso de Indexación
- ✅ Puede iniciar indexación con parámetros válidos
- ✅ Modal de progreso se abre automáticamente
- ✅ Muestra estadísticas en tiempo real (procesados, guardados, descartados)
- ✅ Log muestra todos los eventos importantes

### 3️⃣ Control de Trabajos
- ✅ Puede pausar un trabajo en curso
- ✅ Puede cancelar un trabajo
- ✅ Puede reanudar un trabajo pausado

### 4️⃣ Historial
- ✅ Muestra todos los trabajos ejecutados
- ✅ Muestra estadísticas de cada trabajo
- ✅ Permite eliminar trabajos antiguos

### 5️⃣ Gestión de Lugares
- ✅ Lista lugares indexados con filtros
- ✅ Puede cambiar categoría de un lugar
- ✅ Puede publicar lugares pendientes
- ✅ Puede eliminar lugares

### 6️⃣ Seguridad
- ✅ No permite acceso sin autenticación admin
- ✅ Valida campos requeridos

### 7️⃣ Flujo Completo
- ✅ Test de integración: indexar → verificar → gestionar

---

## 🚀 Cómo Ejecutar

### Prerequisitos

1. **Servidor local corriendo:**
   ```bash
   npm run dev
   ```
   Debe estar en `http://localhost:3000`

2. **Usuario admin creado en Supabase:**
   - Email: `admin@casicinco.com`
   - Password: `admin123456`
   - Role: `admin` (en user_metadata)

3. **Variables de entorno configuradas:**
   - `.env.local` con credenciales de Supabase
   - Credenciales de Google Maps API

### Ejecutar Test

```bash
npm run test:indexacion
```

O con el script de Windows:
```bash
cd TESTERS
.\run-indexacion-tests.bat
```

### Ejecutar en Modo UI (Recomendado)

```bash
npx playwright test TESTERS/indexacion.test.ts --ui
```

Esto abre una interfaz visual donde puedes:
- Ver cada test ejecutándose
- Pausar la ejecución
- Inspeccionar el DOM
- Ver screenshots en cada paso

---

## 🎯 Configuración Personalizada

### Cambiar URL de Test

Por defecto usa `http://localhost:3000`. Para cambiar:

```bash
# PowerShell
$env:TEST_URL="https://main.d2nzzzmoajf631.amplifyapp.com"
npm run test:indexacion
```

```bash
# Bash/Linux/Mac
TEST_URL=https://main.d2nzzzmoajf631.amplifyapp.com npm run test:indexacion
```

### Cambiar Credenciales Admin

Por defecto usa:
- Email: `admin@casicinco.com`
- Password: `admin123456`

Para cambiar:

```bash
# PowerShell
$env:ADMIN_EMAIL="otro@email.com"
$env:ADMIN_PASSWORD="otrapassword"
npm run test:indexacion
```

---

## 📊 Entender los Resultados

### Test Pasado ✅
```
✓ 1.1 - Admin puede acceder a /admin/indexar (2.5s)
```
El test ejecutó correctamente y verificó todos los requisitos.

### Test Fallado ❌
```
✗ 1.1 - Admin puede acceder a /admin/indexar (2.5s)
  Error: element not found
```
El test falló. Revisa:
1. ¿El servidor está corriendo?
2. ¿El usuario admin existe?
3. ¿Las rutas están correctas?

### Test Saltado ⊘
```
⊘ 3.1 - Puede pausar una indexación en curso
```
El test se saltó (skipped). Puede ser intencional o por configuración.

---

## 🐛 Debugging

### Ver Chrome Visible

El test ya corre con Chrome visible (configurado en `playwright.config.ts`).

### Slow Motion

Para ver cada paso más despacio:
```bash
npx playwright test TESTERS/indexacion.test.ts --headed --slowMo=1000
```

### Ejecutar un Solo Test

```bash
npx playwright test TESTERS/indexacion.test.ts --grep "puede iniciar indexación"
```

### Ver Screenshots de Fallos

Si un test falla, se guarda screenshot en:
```
test-results/
```

### Ver Reporte HTML

```bash
npm run test:report
```

Abre un reporte interactivo con:
- Todos los tests ejecutados
- Screenshots de fallos
- Videos de tests fallados
- Timeline de ejecución

---

## 📝 Estructura del Test

```typescript
test.describe('📍 Sistema de Indexación', () => {
  
  // Helper para login
  async function loginAsAdmin(page) { ... }
  
  // Tests agrupados por funcionalidad
  test('1.1 - Admin puede acceder...', async ({ page }) => {
    // Arrange: preparar estado
    await loginAsAdmin(page);
    
    // Act: ejecutar acción
    await page.goto('/admin/indexar');
    
    // Assert: verificar resultado
    await expect(page.locator('...')).toBeVisible();
  });
});
```

---

## 🔍 Tests Individuales Explicados

### Test 1.1: Acceso a Panel
```typescript
test('1.1 - Admin puede acceder a /admin/indexar', ...)
```
**Qué hace:**
- Login como admin
- Navega a `/admin/indexar`
- Verifica que aparecen elementos clave

**Por qué es importante:**
Asegura que el panel de indexación es accesible para admins.

### Test 2.1: Iniciar Indexación
```typescript
test('2.1 - Puede iniciar indexación con parámetros válidos', ...)
```
**Qué hace:**
- Selecciona Murcia como provincia
- Selecciona categoría Restaurante
- Click en "Iniciar Indexación"
- Verifica que se abre el modal

**Por qué es importante:**
Verifica el flujo crítico de inicio de indexación.

### Test 2.2: Progreso en Tiempo Real
```typescript
test('2.2 - Modal muestra progreso en tiempo real', ...)
```
**Qué hace:**
- Inicia indexación
- Espera logs en tiempo real
- Verifica estadísticas actualizándose

**Por qué es importante:**
Asegura que el sistema de logging en tiempo real funciona.

### Test 7.1: Flujo Completo
```typescript
test('7.1 - Flujo completo: indexar → verificar → gestionar', ...)
```
**Qué hace:**
1. Inicia indexación en `/admin/indexar`
2. Verifica que aparece en `/admin/trabajos`
3. Verifica que lugares aparecen en `/admin/lugares`

**Por qué es importante:**
Test de integración end-to-end de todo el sistema.

---

## ⚠️ Problemas Comunes

### 1. "Test timeout"
**Causa:** El test espera 2 minutos pero la indexación es muy lenta.

**Solución:**
- Usar rating 4.5 en lugar de 4.7 (menos lugares)
- Reducir número de provincias
- Aumentar timeout en el test

### 2. "Element not found"
**Causa:** La página no cargó o el selector cambió.

**Solución:**
- Verificar que el servidor está corriendo
- Verificar que la ruta es correcta
- Actualizar selectores si cambió la UI

### 3. "No autorizado"
**Causa:** Usuario no tiene role admin.

**Solución:**
```sql
-- En Supabase SQL Editor
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
WHERE email = 'admin@casicinco.com';
```

### 4. "No hay trabajos/lugares"
**Causa:** Base de datos limpia.

**Solución:**
Esto es normal. El test manejará este caso con mensajes informativos.

---

## 🎓 Mejores Prácticas

### 1. Limpiar Estado Entre Tests
Cada test debe ser independiente:
```typescript
test.beforeEach(async ({ page }) => {
  await page.context().clearCookies();
});
```

### 2. Usar Esperas Apropiadas
❌ Malo:
```typescript
await page.waitForTimeout(5000);
```

✅ Bueno:
```typescript
await page.waitForSelector('text=/loading/i');
```

### 3. Selectores Robustos
❌ Frágil:
```typescript
await page.click('.btn-primary');
```

✅ Robusto:
```typescript
await page.click('button:has-text("Iniciar Indexación")');
```

### 4. Mensajes de Console
```typescript
console.log('✅ Indexación iniciada correctamente');
```
Ayuda a debuggear en tiempo real.

---

## 📈 Métricas de Éxito

Un test exitoso debe:
- ✅ Ejecutarse en menos de 2 minutos
- ✅ No tener flakiness (fallos intermitentes)
- ✅ Ser fácil de debuggear
- ✅ Probar casos reales de usuario

---

## 🔄 Mantenimiento

### Cuándo Actualizar el Test

1. **Cambios en UI:**
   - Actualizar selectores
   - Verificar que elementos están presentes

2. **Nuevas Features:**
   - Añadir tests para nueva funcionalidad
   - Mantener cobertura completa

3. **Bugs Encontrados:**
   - Añadir test de regresión
   - Verificar que el bug no vuelva

### Cómo Actualizar

```typescript
// Añadir nuevo test
test('1.4 - Nueva funcionalidad', async ({ page }) => {
  // ...
});
```

---

## 📚 Recursos

- [Documentación Playwright](https://playwright.dev/)
- [Best Practices Testing](https://playwright.dev/docs/best-practices)
- [Debugging Guide](https://playwright.dev/docs/debug)

---

**Última actualización:** 15 de octubre de 2025  
**Autor:** Casi Cinco Team  
**Versión Test:** 1.0

