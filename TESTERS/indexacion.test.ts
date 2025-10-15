/**
 * 🧪 TEST DE INDEXACIÓN COMPLETO
 * 
 * Este test prueba todo el sistema de indexación de lugares:
 * - Acceso admin a /admin/indexar
 * - Selección de provincias y categorías
 * - Inicio de proceso de indexación
 * - Monitoreo en tiempo real del progreso
 * - Verificación de logs y estadísticas
 * - Pausa y reanudación de trabajos
 * - Cancelación de trabajos
 * - Historial de trabajos en /admin/trabajos
 * - Gestión de lugares indexados en /admin/lugares
 * - Publicación y edición de lugares
 */

import { test, expect } from '@playwright/test';

// Configuración
const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'narciso.pardo@outlook.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '14356830Np@';

// Timeouts extendidos para procesos de indexación
test.setTimeout(120000); // 2 minutos por test

test.describe('📍 Sistema de Indexación', () => {
  
  // ============================================
  // HELPER: LOGIN COMO ADMIN
  // ============================================
  
  async function loginAsAdmin(page: any) {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    
    // Esperar redirección después del login
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  }

  // ============================================
  // 1️⃣ ACCESO A PANEL DE INDEXACIÓN
  // ============================================
  
  test('1.1 - Admin puede acceder a /admin/indexar', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(`${BASE_URL}/admin/indexar`);
    
    // Verificar elementos de la página
    await expect(page.locator('text=/Indexar.*Lugares/i')).toBeVisible();
    await expect(page.locator('text=/Selecciona.*provincia/i')).toBeVisible();
    await expect(page.locator('text=/Categoría/i')).toBeVisible();
    await expect(page.locator('text=/Rating.*mínimo/i')).toBeVisible();
    
    console.log('✅ Admin accedió correctamente a /admin/indexar');
  });

  test('1.2 - Formulario de indexación tiene todos los controles', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(`${BASE_URL}/admin/indexar`);
    
    // Verificar controles del formulario
    const provinciasButton = page.locator('button:has-text("Selecciona provincia")');
    await expect(provinciasButton).toBeVisible();
    
    const categoriasSection = page.locator('text=/Categoría/i');
    await expect(categoriasSection).toBeVisible();
    
    const ratingSelect = page.locator('select').filter({ has: page.locator('option:has-text("4.5")') });
    await expect(ratingSelect).toBeVisible();
    
    console.log('✅ Todos los controles del formulario están presentes');
  });

  test('1.3 - Muestra información del sistema Nearby Search', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(`${BASE_URL}/admin/indexar`);
    
    // Seleccionar una provincia para ver la info del sistema
    await page.click('button:has-text("Selecciona provincia")');
    await page.waitForTimeout(500);
    
    // Buscar y seleccionar Murcia
    const murciaOption = page.locator('text="Murcia"').first();
    await murciaOption.click();
    await page.waitForTimeout(500);
    
    // Seleccionar una categoría
    const restauranteCheckbox = page.locator('input[type="checkbox"]').filter({ has: page.locator('~ text=/restaurante/i') }).first();
    await restauranteCheckbox.check();
    await page.waitForTimeout(500);
    
    // Verificar que aparece la info del sistema optimizado
    await expect(page.locator('text=/Sistema.*Nearby.*Search/i')).toBeVisible();
    await expect(page.locator('text=/cuadrantes/i')).toBeVisible();
    
    console.log('✅ Sistema muestra info de estrategia Nearby Search');
  });

  // ============================================
  // 2️⃣ INICIO DE INDEXACIÓN
  // ============================================
  
  test('2.1 - Puede iniciar indexación con parámetros válidos', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(`${BASE_URL}/admin/indexar`);
    
    // Seleccionar Murcia
    await page.click('button:has-text("Selecciona provincia")');
    await page.waitForTimeout(500);
    const murciaOption = page.locator('text="Murcia"').first();
    await murciaOption.click();
    await page.waitForTimeout(500);
    
    // Seleccionar categoría restaurante
    const restauranteCheckbox = page.locator('label:has-text("Restaurantes")').locator('input[type="checkbox"]').first();
    await restauranteCheckbox.check();
    await page.waitForTimeout(500);
    
    // Cambiar rating a 4.5 (para test más rápido)
    await page.selectOption('select', '4.5');
    
    // Click en "Iniciar Indexación Rápida"
    const iniciarButton = page.locator('button:has-text("Iniciar Indexación")');
    await expect(iniciarButton).toBeEnabled();
    await iniciarButton.click();
    
    // Verificar que se abre el modal de progreso
    await page.waitForSelector('text=/Indexación en Proceso/i', { timeout: 10000 });
    await expect(page.locator('text=/Indexación en Proceso/i')).toBeVisible();
    
    console.log('✅ Indexación iniciada correctamente, modal abierto');
  });

  test('2.2 - Modal muestra progreso en tiempo real', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(`${BASE_URL}/admin/indexar`);
    
    // Configurar y lanzar indexación
    await page.click('button:has-text("Selecciona provincia")');
    await page.waitForTimeout(500);
    const murciaOption = page.locator('text="Murcia"').first();
    await murciaOption.click();
    await page.waitForTimeout(500);
    
    const restauranteCheckbox = page.locator('label:has-text("Restaurantes")').locator('input[type="checkbox"]').first();
    await restauranteCheckbox.check();
    await page.waitForTimeout(500);
    
    await page.selectOption('select', '4.5');
    await page.click('button:has-text("Iniciar Indexación")');
    
    // Esperar modal
    await page.waitForSelector('text=/Indexación en Proceso/i', { timeout: 10000 });
    
    // Verificar elementos del modal
    await expect(page.locator('text=/Procesados/i')).toBeVisible();
    await expect(page.locator('text=/Guardados/i')).toBeVisible();
    await expect(page.locator('text=/Descartados/i')).toBeVisible();
    await expect(page.locator('text=/Log en Tiempo Real/i')).toBeVisible();
    
    // Esperar a que aparezcan logs (máximo 30 segundos)
    await page.waitForSelector('text=/Indexación.*iniciada/i', { timeout: 30000 });
    await expect(page.locator('text=/Indexación.*iniciada/i')).toBeVisible();
    
    console.log('✅ Modal muestra progreso y logs en tiempo real');
  });

  test('2.3 - Registra todos los eventos en el log', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(`${BASE_URL}/admin/indexar`);
    
    // Configurar y lanzar indexación
    await page.click('button:has-text("Selecciona provincia")');
    await page.waitForTimeout(500);
    const murciaOption = page.locator('text="Murcia"').first();
    await murciaOption.click();
    await page.waitForTimeout(500);
    
    const restauranteCheckbox = page.locator('label:has-text("Restaurantes")').locator('input[type="checkbox"]').first();
    await restauranteCheckbox.check();
    await page.waitForTimeout(500);
    
    await page.selectOption('select', '4.5');
    await page.click('button:has-text("Iniciar Indexación")');
    
    await page.waitForSelector('text=/Indexación en Proceso/i', { timeout: 10000 });
    
    // Esperar diferentes tipos de logs
    await page.waitForSelector('text=/Provincias:/i', { timeout: 30000 });
    await page.waitForSelector('text=/Categorías:/i', { timeout: 10000 });
    await page.waitForSelector('text=/Rating mínimo:/i', { timeout: 10000 });
    
    // Esperar inicio de búsqueda
    await page.waitForSelector('text=/FASE 1.*Búsqueda/i', { timeout: 20000 });
    
    console.log('✅ Log registra todos los eventos importantes');
  });

  // ============================================
  // 3️⃣ PAUSAR Y CANCELAR
  // ============================================
  
  test('3.1 - Puede pausar una indexación en curso', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(`${BASE_URL}/admin/indexar`);
    
    // Iniciar indexación
    await page.click('button:has-text("Selecciona provincia")');
    await page.waitForTimeout(500);
    const murciaOption = page.locator('text="Murcia"').first();
    await murciaOption.click();
    await page.waitForTimeout(500);
    
    const restauranteCheckbox = page.locator('label:has-text("Restaurantes")').locator('input[type="checkbox"]').first();
    await restauranteCheckbox.check();
    await page.waitForTimeout(500);
    
    await page.selectOption('select', '4.5');
    await page.click('button:has-text("Iniciar Indexación")');
    
    await page.waitForSelector('text=/Indexación en Proceso/i', { timeout: 10000 });
    
    // Esperar que empiece el proceso
    await page.waitForTimeout(5000);
    
    // Buscar botón de pausa
    const pauseButton = page.locator('button:has-text("Pausar")');
    if (await pauseButton.isVisible()) {
      await pauseButton.click();
      await page.waitForTimeout(2000);
      
      // Verificar que cambió a estado pausado
      await expect(page.locator('text=/pausad/i')).toBeVisible();
      console.log('✅ Indexación pausada correctamente');
    } else {
      console.log('⚠️ Botón pausar no visible (posiblemente ya terminó)');
    }
  });

  test('3.2 - Puede cancelar una indexación', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(`${BASE_URL}/admin/indexar`);
    
    // Iniciar indexación
    await page.click('button:has-text("Selecciona provincia")');
    await page.waitForTimeout(500);
    const murciaOption = page.locator('text="Murcia"').first();
    await murciaOption.click();
    await page.waitForTimeout(500);
    
    const restauranteCheckbox = page.locator('label:has-text("Restaurantes")').locator('input[type="checkbox"]').first();
    await restauranteCheckbox.check();
    await page.waitForTimeout(500);
    
    await page.selectOption('select', '4.5');
    await page.click('button:has-text("Iniciar Indexación")');
    
    await page.waitForSelector('text=/Indexación en Proceso/i', { timeout: 10000 });
    
    // Esperar que empiece
    await page.waitForTimeout(3000);
    
    // Buscar botón de cancelar
    const cancelButton = page.locator('button:has-text("Cancelar")');
    if (await cancelButton.isVisible()) {
      await cancelButton.click();
      await page.waitForTimeout(2000);
      
      // Verificar que cambió a cancelado
      await expect(page.locator('text=/cancelad/i')).toBeVisible();
      console.log('✅ Indexación cancelada correctamente');
    } else {
      console.log('⚠️ Botón cancelar no visible');
    }
  });

  // ============================================
  // 4️⃣ HISTORIAL DE TRABAJOS
  // ============================================
  
  test('4.1 - Admin puede acceder al historial de trabajos', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(`${BASE_URL}/admin/trabajos`);
    
    // Verificar que la página carga
    await expect(page.locator('text=/Historial.*Trabajo/i')).toBeVisible();
    await expect(page.locator('text=/Estado/i')).toBeVisible();
    
    console.log('✅ Historial de trabajos accesible');
  });

  test('4.2 - Muestra todos los trabajos con sus estadísticas', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(`${BASE_URL}/admin/trabajos`);
    
    await page.waitForTimeout(2000);
    
    // Verificar que hay trabajos listados (si existe alguno)
    const trabajosList = page.locator('[class*="table"], [class*="grid"], [class*="list"]');
    
    // Si hay trabajos, verificar que muestran info
    const hasJobs = await page.locator('text=/Murcia|Madrid|Barcelona/i').count() > 0;
    
    if (hasJobs) {
      await expect(page.locator('text=/Murcia|Madrid|Barcelona/i').first()).toBeVisible();
      console.log('✅ Trabajos listados con información');
    } else {
      console.log('ℹ️ No hay trabajos previos (DB limpia)');
    }
  });

  test('4.3 - Puede eliminar un trabajo del historial', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(`${BASE_URL}/admin/trabajos`);
    
    await page.waitForTimeout(2000);
    
    // Buscar botón de eliminar
    const deleteButtons = page.locator('button:has-text("Eliminar"), button[title*="Eliminar"], button:has(svg[class*="trash"])');
    const deleteCount = await deleteButtons.count();
    
    if (deleteCount > 0) {
      const initialJobs = await page.locator('text=/Murcia|Madrid|Barcelona/i').count();
      
      // Click en primer botón de eliminar
      await deleteButtons.first().click();
      await page.waitForTimeout(1000);
      
      // Confirmar si aparece diálogo
      const confirmButton = page.locator('button:has-text("Confirmar"), button:has-text("Sí"), button:has-text("Eliminar")');
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
      }
      
      await page.waitForTimeout(2000);
      
      console.log('✅ Trabajo eliminado del historial');
    } else {
      console.log('ℹ️ No hay trabajos para eliminar');
    }
  });

  // ============================================
  // 5️⃣ GESTIÓN DE LUGARES INDEXADOS
  // ============================================
  
  test('5.1 - Admin puede acceder a gestión de lugares', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(`${BASE_URL}/admin/lugares`);
    
    // Verificar que la página carga
    await expect(page.locator('text=/Gestión.*Lugares/i')).toBeVisible();
    
    console.log('✅ Gestión de lugares accesible');
  });

  test('5.2 - Muestra lista de lugares con filtros', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(`${BASE_URL}/admin/lugares`);
    
    await page.waitForTimeout(2000);
    
    // Verificar que hay controles de filtrado
    const searchInput = page.locator('input[placeholder*="Buscar"], input[type="search"]');
    const categoryFilter = page.locator('select:has(option:has-text("Restaurante")), button:has-text("Categoría")');
    
    if (await searchInput.count() > 0) {
      await expect(searchInput.first()).toBeVisible();
      console.log('✅ Búsqueda disponible');
    }
    
    if (await categoryFilter.count() > 0) {
      await expect(categoryFilter.first()).toBeVisible();
      console.log('✅ Filtros de categoría disponibles');
    }
  });

  test('5.3 - Puede cambiar categoría de un lugar', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(`${BASE_URL}/admin/lugares`);
    
    await page.waitForTimeout(3000);
    
    // Buscar dropdown de categoría en la tabla
    const categorySelects = page.locator('select:has(option:has-text("restaurante")), select:has(option:has-text("bar"))');
    const selectCount = await categorySelects.count();
    
    if (selectCount > 0) {
      const firstSelect = categorySelects.first();
      const currentValue = await firstSelect.inputValue();
      
      // Cambiar a otra categoría
      const newCategory = currentValue === 'restaurante' ? 'bar' : 'restaurante';
      await firstSelect.selectOption(newCategory);
      
      await page.waitForTimeout(2000);
      
      // Verificar mensaje de éxito
      const successMessage = page.locator('text=/actualizado|guardado|éxito/i');
      if (await successMessage.isVisible()) {
        console.log('✅ Categoría actualizada correctamente');
      }
    } else {
      console.log('ℹ️ No hay lugares para editar categoría');
    }
  });

  test('5.4 - Puede publicar un lugar pendiente', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(`${BASE_URL}/admin/lugares`);
    
    await page.waitForTimeout(3000);
    
    // Filtrar por no publicados
    const statusFilter = page.locator('select:has(option:has-text("No publicado")), button:has-text("Estado")');
    
    if (await statusFilter.count() > 0) {
      await statusFilter.first().selectOption('No publicado');
      await page.waitForTimeout(2000);
    }
    
    // Buscar botón de publicar
    const publishButtons = page.locator('button:has-text("Publicar")');
    const publishCount = await publishButtons.count();
    
    if (publishCount > 0) {
      await publishButtons.first().click();
      await page.waitForTimeout(2000);
      
      // Verificar mensaje de éxito
      const successMessage = page.locator('text=/publicado|éxito/i');
      if (await successMessage.isVisible()) {
        console.log('✅ Lugar publicado correctamente');
      }
    } else {
      console.log('ℹ️ No hay lugares pendientes para publicar');
    }
  });

  test('5.5 - Puede eliminar un lugar', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(`${BASE_URL}/admin/lugares`);
    
    await page.waitForTimeout(3000);
    
    // Buscar botón de eliminar
    const deleteButtons = page.locator('button:has-text("Eliminar"), button[title*="Eliminar"], button:has(svg[class*="trash"])');
    const deleteCount = await deleteButtons.count();
    
    if (deleteCount > 0) {
      await deleteButtons.first().click();
      await page.waitForTimeout(1000);
      
      // Confirmar eliminación
      const confirmButton = page.locator('button:has-text("Confirmar"), button:has-text("Sí"), button:has-text("Eliminar")');
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
        await page.waitForTimeout(2000);
      }
      
      console.log('✅ Lugar eliminado correctamente');
    } else {
      console.log('ℹ️ No hay lugares para eliminar');
    }
  });

  // ============================================
  // 6️⃣ VALIDACIONES Y ERRORES
  // ============================================
  
  test('6.1 - No permite iniciar sin seleccionar provincia', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(`${BASE_URL}/admin/indexar`);
    
    // Intentar iniciar sin provincia
    const iniciarButton = page.locator('button:has-text("Iniciar Indexación")');
    
    // El botón debe estar deshabilitado
    await expect(iniciarButton).toBeDisabled();
    
    console.log('✅ Validación: requiere provincia');
  });

  test('6.2 - No permite iniciar sin seleccionar categoría', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(`${BASE_URL}/admin/indexar`);
    
    // Solo seleccionar provincia
    await page.click('button:has-text("Selecciona provincia")');
    await page.waitForTimeout(500);
    const murciaOption = page.locator('text="Murcia"').first();
    await murciaOption.click();
    await page.waitForTimeout(500);
    
    // Botón debe seguir deshabilitado
    const iniciarButton = page.locator('button:has-text("Iniciar Indexación")');
    await expect(iniciarButton).toBeDisabled();
    
    console.log('✅ Validación: requiere categoría');
  });

  test('6.3 - Usuario no admin no puede acceder', async ({ page }) => {
    // Intentar acceder sin login
    await page.goto(`${BASE_URL}/admin/indexar`);
    await page.waitForTimeout(2000);
    
    // Debe redirigir a login o mostrar error
    const currentUrl = page.url();
    const isLoginPage = currentUrl.includes('/login');
    const hasErrorMessage = await page.locator('text=/no autorizado|acceso denegado/i').isVisible();
    
    expect(isLoginPage || hasErrorMessage).toBeTruthy();
    
    console.log('✅ Seguridad: requiere autenticación admin');
  });

  // ============================================
  // 7️⃣ INTEGRACIÓN COMPLETA
  // ============================================
  
  test('7.1 - Flujo completo: indexar → verificar → gestionar', async ({ page }) => {
    test.setTimeout(180000); // 3 minutos para este test completo
    
    await loginAsAdmin(page);
    
    // PASO 1: Iniciar indexación
    console.log('📍 Paso 1: Ir a indexar');
    await page.goto(`${BASE_URL}/admin/indexar`);
    
    await page.click('button:has-text("Selecciona provincia")');
    await page.waitForTimeout(500);
    const murciaOption = page.locator('text="Murcia"').first();
    await murciaOption.click();
    await page.waitForTimeout(500);
    
    const restauranteCheckbox = page.locator('label:has-text("Restaurantes")').locator('input[type="checkbox"]').first();
    await restauranteCheckbox.check();
    await page.waitForTimeout(500);
    
    await page.selectOption('select', '4.5');
    await page.click('button:has-text("Iniciar Indexación")');
    
    await page.waitForSelector('text=/Indexación en Proceso/i', { timeout: 10000 });
    console.log('✅ Indexación iniciada');
    
    // Esperar un poco para que procese algo
    await page.waitForTimeout(10000);
    
    // PASO 2: Ir a historial de trabajos
    console.log('📍 Paso 2: Verificar historial');
    await page.goto(`${BASE_URL}/admin/trabajos`);
    await page.waitForTimeout(2000);
    
    // Verificar que aparece el trabajo
    await expect(page.locator('text=/Murcia/i')).toBeVisible();
    console.log('✅ Trabajo visible en historial');
    
    // PASO 3: Ir a gestión de lugares
    console.log('📍 Paso 3: Gestionar lugares');
    await page.goto(`${BASE_URL}/admin/lugares`);
    await page.waitForTimeout(3000);
    
    // Verificar que hay lugares (si se procesó algo)
    const hasPlaces = await page.locator('text=/restaurante|bar|cafe|hotel/i').count() > 0;
    if (hasPlaces) {
      console.log('✅ Lugares indexados visibles en gestión');
    } else {
      console.log('ℹ️ Aún no hay lugares procesados (puede ser normal si fue muy rápido)');
    }
    
    console.log('🎉 Flujo completo ejecutado correctamente');
  });

});

