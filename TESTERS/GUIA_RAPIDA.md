# 🚀 Guía Rápida - Tests de Casi Cinco

## ⚡ Comenzar en 3 Pasos

### 1️⃣ Instalar Dependencias (si no lo has hecho)
```bash
npm install
```

### 2️⃣ Instalar Navegadores de Playwright
```bash
npx playwright install chromium
```

### 3️⃣ Ejecutar Tests
```bash
npm run test:auth
```

¡Eso es todo! Chrome se abrirá automáticamente y verás los tests ejecutándose. 🎉

---

## 🎯 Comandos Más Usados

### Ver tests ejecutándose (Chrome visible)
```bash
npm run test:auth
```
✅ **Ya configurado para mostrar Chrome** - No necesitas agregar `--headed`

### Ejecutar TODOS los tests
```bash
npm test
```

### Modo UI (Interfaz visual de Playwright)
```bash
npm run test:ui
```
🎨 La mejor manera de explorar y ejecutar tests

### Modo Debug (paso a paso)
```bash
npm run test:debug
```
🐛 Para debugging interactivo

### Ver reportes después de ejecutar
```bash
npm run test:report
```
📊 Abre el reporte HTML en tu navegador

---

## 📝 Ejecutar Tests Específicos

### Solo un test
```bash
npm test -- --grep "Página de login se carga"
```

### Solo tests de login
```bash
npm test -- --grep "LOGIN"
```

### Solo tests de registro
```bash
npm test -- --grep "REGISTRO"
```

### Excluir tests
```bash
npm test -- --grep-invert "OAuth"
```

---

## 🎬 Características Especiales

### ✅ Chrome Visible
Los tests se ejecutan con Chrome **visible** por defecto. Puedes ver cada acción en tiempo real.

### ⏱️ Slow Motion
Los tests van en "slow motion" (50ms entre acciones) para que puedas seguirlos mejor.

### 📸 Screenshots Automáticos
Si un test falla, se guarda automáticamente una captura de pantalla en `TESTERS/test-results/`.

### 🎥 Videos de Fallos
También se graba video de los tests que fallan.

---

## 🔧 Configuración Personalizada

### Cambiar velocidad de ejecución
Edita `playwright.config.ts`:
```typescript
slowMo: 100  // Más lento
slowMo: 0    // Velocidad normal
```

### Ejecutar en modo headless (sin mostrar navegador)
```bash
npm test -- --headed=false
```

### Cambiar timeout
```bash
npm test -- --timeout=60000
```

---

## 📊 Entender los Resultados

### ✅ Test Pasado
```
✓ 1.1 - Página de login se carga correctamente (1.5s)
```

### ❌ Test Fallado
```
✗ 1.2 - Muestra error con credenciales inválidas (3.2s)
  Error: Timeout 5000ms exceeded
  Screenshot: test-results/auth-test-1-2/screenshot.png
```

### 📁 Archivos Generados
```
TESTERS/
├── test-results/           # Screenshots y videos de fallos
│   └── auth-test-1-2/
│       ├── screenshot.png
│       └── video.webm
└── reports/                # Reporte HTML completo
    └── index.html
```

---

## 🐛 Solución de Problemas Comunes

### Error: "Cannot find module '@playwright/test'"
```bash
npm install
```

### Error: "Executable doesn't exist"
```bash
npx playwright install chromium
```

### Error: "Port 3000 is already in use"
```bash
# Detén el servidor en otro terminal
# O cambia el puerto en playwright.config.ts
```

### Tests fallan porque la app no está iniciada
El servidor se inicia automáticamente. Si falla:
```bash
# En una terminal
npm run dev

# En otra terminal
npm run test:auth
```

### Chrome no se muestra
Verifica `playwright.config.ts`:
```typescript
headless: false  // Debe estar en false
```

---

## 📚 Recursos Útiles

- 📖 [README completo](./README.md)
- 🎭 [Documentación de Playwright](https://playwright.dev/)
- 🧪 [Ver el código del test](./auth.test.ts)

---

## 💡 Tips Pro

### 1. Usa el modo UI para explorar
```bash
npm run test:ui
```
Es la forma más fácil de ver qué hace cada test.

### 2. Ejecuta solo lo que necesitas
No ejecutes todos los tests cada vez. Ejecuta solo el test que estás desarrollando.

### 3. Lee los reportes HTML
```bash
npm run test:report
```
Tienen mucha más información que la consola.

### 4. Usa watch mode para desarrollo
```bash
npm test -- --watch
```
Los tests se re-ejecutan cuando cambias el código.

---

## 🎉 ¿Listo para Probar?

```bash
npm run test:auth
```

¡Deberías ver Chrome abriéndose y ejecutando los 24 tests de autenticación!

---

**¿Preguntas?** Revisa el [README completo](./README.md) o la documentación de cada test.

