# 🧪 TESTERS - Suite de Tests de Casi Cinco

Carpeta dedicada a tests automatizados de la aplicación.

## 📋 Tests Disponibles

### ✅ `auth.test.ts` - Sistema de Autenticación
Prueba completa de todo el sistema de autenticación:
- ✅ Login con email/password
- ✅ Registro de nuevos usuarios
- ✅ Google OAuth
- ✅ Cierre de sesión
- ✅ Persistencia de sesión
- ✅ Redirecciones
- ✅ Validaciones de seguridad
- ✅ Experiencia de usuario
- ✅ Accesibilidad

**Total:** 27 tests (actualizado con verificaciones de localhost:3000)

---

## 🚀 Cómo Ejecutar los Tests

### Prerequisitos
```bash
npm install
```

### Ejecutar TODOS los tests (localhost)
```bash
npm run test
```

### Ejecutar solo tests de autenticación (localhost)
```bash
npm run test:auth
```

### ⭐ Ejecutar tests en PRODUCCIÓN (detecta problema localhost:3000)
```powershell
# PowerShell
$env:TEST_URL="https://main.d2nzzzmoajf631.amplifyapp.com"; npm run test:auth
```

```bash
# Bash/Mac/Linux
TEST_URL=https://main.d2nzzzmoajf631.amplifyapp.com npm run test:auth
```

### Ejecutar tests en modo UI (interfaz visual)
```bash
npm run test:ui
```

### Ver reportes HTML
```bash
npm run test:report
```

---

## 🎯 Configuración

### Variables de Entorno
Crea un archivo `.env.test` para variables de test:

```env
TEST_URL=http://localhost:3000
TEST_EMAIL=test@casicinco.com
TEST_PASSWORD=test123456
```

### Configuración de Playwright
Edita `playwright.config.ts` para personalizar:
- `headless: false` → Chrome visible (ya configurado) ✅
- `slowMo: 50` → Velocidad de ejecución
- `timeout: 30000` → Timeout por test
- `screenshot: 'only-on-failure'` → Capturas de pantalla

---

## 📊 Estructura de Tests

```
TESTERS/
├── auth.test.ts          # Tests de autenticación
├── reports/              # Reportes HTML (generado)
└── README.md            # Esta documentación
```

---

## 🔍 Características de los Tests

### ✅ Chrome Visible
Los tests se ejecutan con Chrome **visible** para poder ver qué está pasando en tiempo real.

### ✅ Screenshots en Fallos
Si un test falla, se guarda automáticamente una captura de pantalla.

### ✅ Videos en Fallos
Se graba video de los tests que fallan para debugging.

### ✅ Reportes HTML
Reportes detallados con screenshots y videos en `TESTERS/reports/`.

---

## 📝 Escribir Nuevos Tests

### Plantilla Básica

```typescript
import { test, expect } from '@playwright/test';

test.describe('Mi Feature', () => {
  
  test('debería hacer algo', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    // Tu test aquí
    await expect(page.locator('h1')).toBeVisible();
  });
  
});
```

### Mejores Prácticas

1. **Nombres descriptivos**: `test('debería mostrar error con email inválido')`
2. **Limpiar estado**: Usar `beforeEach` para limpiar cookies/localStorage
3. **Esperas apropiadas**: Usar `waitForSelector`, no `setTimeout`
4. **Selectores robustos**: Preferir `data-testid` sobre clases CSS
5. **Comentarios**: Explicar qué está probando cada test

---

## 🐛 Debugging

### Ver tests en slow motion
```bash
npm run test -- --headed --slowMo=1000
```

### Ejecutar un solo test
```bash
npm run test -- --grep "nombre del test"
```

### Modo debug interactivo
```bash
npm run test:debug
```

### Ver logs de consola
Los errores de consola se muestran automáticamente en los reportes.

---

## 📈 Métricas de Cobertura

Después de ejecutar los tests, puedes ver:

- ✅ **Tests pasados/fallados**
- ✅ **Tiempo de ejecución**
- ✅ **Screenshots de fallos**
- ✅ **Videos de fallos**
- ✅ **Trazas de ejecución**

---

## 🔄 CI/CD Integration

Para ejecutar en GitHub Actions o AWS Amplify:

```yaml
- name: Run Tests
  run: |
    npm install
    npm run test
```

Los tests se ejecutarán en modo headless automáticamente en CI.

---

## 📚 Documentación de Playwright

- [Documentación oficial](https://playwright.dev/)
- [API Reference](https://playwright.dev/docs/api/class-playwright)
- [Best Practices](https://playwright.dev/docs/best-practices)

---

## 🎉 Próximos Tests a Implementar

- [ ] `mapa.test.ts` - Funcionalidad del mapa
- [ ] `ruta.test.ts` - Planificación de rutas
- [ ] `filtros.test.ts` - Sistema de filtros
- [ ] `favoritos.test.ts` - Gestión de favoritos
- [ ] `perfil.test.ts` - Página de perfil de usuario
- [ ] `admin.test.ts` - Panel de administración
- [ ] `indexacion.test.ts` - Sistema de indexación
- [ ] `chatbot.test.ts` - Tío Viajero (chatbot)
- [ ] `responsive.test.ts` - Diseño responsive
- [ ] `performance.test.ts` - Tests de rendimiento

---

**Última actualización:** 12 de octubre de 2025  
**Versión:** Beta 3.0

