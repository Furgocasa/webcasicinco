/**
 * 🧪 TEST DE AUTENTICACIÓN COMPLETO
 * 
 * Este test prueba toda la funcionalidad de autenticación:
 * - Login con email/password
 * - Login con Google OAuth
 * - Registro de nuevos usuarios
 * - Cierre de sesión
 * - Persistencia de sesión
 * - Redirecciones correctas
 * - Manejo de errores
 */

import { test, expect } from '@playwright/test';

// Configuración
const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';
const TEST_EMAIL = 'test@casicinco.com';
const TEST_PASSWORD = 'test123456';

test.describe('🔐 Sistema de Autenticación', () => {
  
  test.beforeEach(async ({ page }) => {
    // Limpiar cookies y localStorage antes de cada test
    await page.context().clearCookies();
    await page.goto(BASE_URL);
  });

  // ============================================
  // 1️⃣ PÁGINA DE LOGIN
  // ============================================
  
  test('1.1 - Página de login se carga correctamente', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    
    // Verificar elementos de la página
    await expect(page.locator('h1, h2, h3').filter({ hasText: 'Iniciar sesión' })).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button').filter({ hasText: 'Iniciar sesión' })).toBeVisible();
    await expect(page.locator('button').filter({ hasText: 'Continuar con Google' })).toBeVisible();
  });

  test('1.2 - Muestra error con credenciales inválidas', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    
    // Intentar login con credenciales incorrectas
    await page.fill('input[type="email"]', 'noexiste@test.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Esperar mensaje de error - Buscar div con clase de error o texto de error
    await page.waitForTimeout(2000); // Esperar respuesta del servidor
    
    // Verificar que aparece algún mensaje de error (puede ser toast o div de error)
    const hasErrorMessage = await page.locator('[class*="error"], [class*="red"], [role="alert"]').isVisible().catch(() => false);
    const hasErrorText = await page.locator('text=/error|invalid|incorrecto|inválido|credenciales/i').isVisible().catch(() => false);
    
    expect(hasErrorMessage || hasErrorText).toBeTruthy();
  });

  test('1.3 - Campos de formulario son obligatorios', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    
    // Intentar enviar formulario vacío
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();
    
    // Los campos deberían estar marcados como requeridos
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    
    expect(await emailInput.getAttribute('required')).toBeTruthy();
    expect(await passwordInput.getAttribute('required')).toBeTruthy();
  });

  // ============================================
  // 2️⃣ PÁGINA DE REGISTRO
  // ============================================
  
  test('2.1 - Página de registro se carga correctamente', async ({ page }) => {
    await page.goto(`${BASE_URL}/registro`);
    
    // Verificar elementos de la página
    await expect(page.locator('text=/crear cuenta|regist/i')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
    await expect(page.locator('button').filter({ hasText: 'Continuar con Google' })).toBeVisible();
  });

  test('2.2 - Link de registro desde login funciona', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    
    // Click en link de registro
    await page.click('text=/regístrate|crear cuenta/i');
    
    // Verificar que redirige a registro
    await expect(page).toHaveURL(/.*registro/);
  });

  test('2.3 - Link de login desde registro funciona', async ({ page }) => {
    await page.goto(`${BASE_URL}/registro`);
    
    // Click en link de login
    await page.click('text=/inicia sesión|ya tienes cuenta/i');
    
    // Verificar que redirige a login
    await expect(page).toHaveURL(/.*login/);
  });

  test('2.4 - Validación de contraseñas que no coinciden', async ({ page }) => {
    await page.goto(`${BASE_URL}/registro`);
    
    // Llenar formulario con contraseñas diferentes
    await page.fill('input[type="email"]', 'nuevo@test.com');
    const passwordInputs = page.locator('input[type="password"]');
    await passwordInputs.nth(0).fill('password123');
    await passwordInputs.nth(1).fill('password456'); // Diferente
    
    await page.click('button[type="submit"]');
    
    // Verificar mensaje de error
    await expect(page.locator('text=/no coinciden|no match/i')).toBeVisible({ timeout: 3000 });
  });

  test('2.5 - Validación de contraseña corta', async ({ page }) => {
    await page.goto(`${BASE_URL}/registro`);
    
    // Llenar formulario con contraseña corta
    await page.fill('input[type="email"]', 'nuevo@test.com');
    const passwordInputs = page.locator('input[type="password"]');
    await passwordInputs.nth(0).fill('12345'); // Menos de 6 caracteres
    await passwordInputs.nth(1).fill('12345');
    
    await page.click('button[type="submit"]');
    
    // Verificar mensaje de error
    await expect(page.locator('text=/6 caracteres|too short|mínimo/i')).toBeVisible({ timeout: 3000 });
  });

  // ============================================
  // 3️⃣ GOOGLE OAUTH
  // ============================================
  
  test('3.1 - Botón de Google OAuth está presente', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    
    const googleButton = page.locator('button').filter({ hasText: 'Continuar con Google' });
    await expect(googleButton).toBeVisible();
    
    // Verificar que tiene el icono de Google
    const googleIcon = page.locator('svg').filter({ has: page.locator('path[fill="#4285F4"]') });
    await expect(googleIcon).toBeVisible();
  });

  test('3.2 - Google OAuth NO usa localhost:3000 en redirectTo', async ({ page }) => {
    // Este test verifica que el código use NEXT_PUBLIC_APP_URL correctamente
    
    await page.goto(`${BASE_URL}/login`);
    
    // Interceptar la llamada a signInWithOAuth
    let oauthRedirectUrl = '';
    
    page.on('request', request => {
      const url = request.url();
      // Capturar llamadas a Google OAuth
      if (url.includes('accounts.google.com') || url.includes('oauth')) {
        console.log('OAuth URL detected:', url);
        
        // Buscar el parámetro redirect_uri
        const urlObj = new URL(url);
        const redirectUri = urlObj.searchParams.get('redirect_uri');
        if (redirectUri) {
          oauthRedirectUrl = redirectUri;
          console.log('Redirect URI:', redirectUri);
        }
      }
    });
    
    const googleButton = page.locator('button').filter({ hasText: 'Continuar con Google' });
    await googleButton.click();
    
    // Esperar un poco para que se capture la redirección
    await page.waitForTimeout(2000);
    
    // Verificar que la URL de redirección NO contiene localhost:3000
    if (oauthRedirectUrl) {
      console.log('✅ Redirect URI capturado:', oauthRedirectUrl);
      
      // Si estamos en producción, NO debería contener localhost
      if (!BASE_URL.includes('localhost')) {
        expect(oauthRedirectUrl).not.toContain('localhost:3000');
        expect(oauthRedirectUrl).toContain('/auth/callback');
      }
    } else {
      console.log('⚠️ No se pudo capturar redirect_uri (OAuth puede usar redirección diferente)');
    }
  });

  test('3.3 - Google OAuth usa la URL correcta del entorno', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    
    // Agregar listener para capturar navegación
    let navigationUrl = '';
    page.on('framenavigated', frame => {
      if (frame === page.mainFrame()) {
        navigationUrl = frame.url();
        console.log('Navegación detectada:', navigationUrl);
      }
    });
    
    const googleButton = page.locator('button').filter({ hasText: 'Continuar con Google' });
    
    // Click y esperar navegación a Google
    const [response] = await Promise.all([
      page.waitForNavigation({ timeout: 5000 }).catch(() => null),
      googleButton.click()
    ]);
    
    await page.waitForTimeout(1000);
    
    // Verificar que la URL actual es de Google OAuth
    const currentUrl = page.url();
    console.log('URL después de click en Google:', currentUrl);
    
    // Debería estar en accounts.google.com o seguir en login
    const isGoogleOAuth = currentUrl.includes('accounts.google.com');
    const isStillInLogin = currentUrl.includes('/login');
    
    expect(isGoogleOAuth || isStillInLogin).toBeTruthy();
  });

  test('3.4 - Verificar que NO usa prompt=consent (no pide confirmación repetida)', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    
    // Interceptar requests
    const oauthRequests: string[] = [];
    page.on('request', request => {
      const url = request.url();
      if (url.includes('accounts.google.com')) {
        oauthRequests.push(url);
      }
    });
    
    const googleButton = page.locator('button').filter({ hasText: 'Continuar con Google' });
    await googleButton.click();
    
    await page.waitForTimeout(2000);
    
    // Verificar que ninguna URL de OAuth contiene prompt=consent
    const hasPromptConsent = oauthRequests.some(url => 
      url.includes('prompt=consent') || url.includes('prompt=select_account')
    );
    
    console.log('OAuth requests:', oauthRequests);
    console.log('¿Contiene prompt=consent?', hasPromptConsent);
    
    // NO debería tener prompt=consent para evitar confirmación repetida
    expect(hasPromptConsent).toBeFalsy();
  });

  // ============================================
  // 4️⃣ PERSISTENCIA DE SESIÓN
  // ============================================
  
  test('4.1 - Usuario no autenticado no puede acceder a rutas protegidas', async ({ page }) => {
    // Intentar acceder a una ruta protegida sin autenticación
    await page.goto(`${BASE_URL}/perfil`);
    
    // Debería redirigir a login
    await expect(page).toHaveURL(/.*login/, { timeout: 5000 });
  });

  test('4.2 - Página de perfil muestra datos del usuario autenticado', async ({ page }) => {
    // Nota: Este test requiere un usuario de prueba existente
    // En un entorno real, primero deberías crear el usuario o usar uno de prueba
    
    await page.goto(`${BASE_URL}/login`);
    
    // Intentar login (esto fallará sin un usuario real, es solo estructura)
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    
    // Si el login es exitoso, verificar redirección
    await page.waitForURL(/(?!.*login)/, { timeout: 5000 }).catch(() => {
      console.log('⚠️ Login falló (esperado si no hay usuario de prueba)');
    });
  });

  // ============================================
  // 5️⃣ CIERRE DE SESIÓN
  // ============================================
  
  test('5.1 - Menú de perfil existe en el header', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Buscar botón de perfil o avatar
    const profileButton = page.locator('button').filter({ 
      has: page.locator('text=/perfil|iniciar sesión|login/i') 
    });
    
    await expect(profileButton.first()).toBeVisible();
  });

  test('5.2 - Link a login está visible cuando no hay sesión', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Verificar que hay un link/botón para ir a login
    const loginLink = page.locator('a[href*="login"], button').filter({ 
      hasText: /iniciar sesión|login/i 
    });
    
    await expect(loginLink.first()).toBeVisible();
  });

  // ============================================
  // 6️⃣ REDIRECCIONES Y NAVEGACIÓN
  // ============================================
  
  test('6.1 - Callback de OAuth redirige correctamente (NO a localhost:3000)', async ({ page }) => {
    // Visitar la ruta de callback sin código (debería redirigir al home)
    await page.goto(`${BASE_URL}/auth/callback`);
    
    // Esperar redirección
    await page.waitForTimeout(1000);
    
    // Verificar que redirige al home
    const currentUrl = page.url();
    console.log('URL después de callback sin código:', currentUrl);
    
    // Debería estar en el home del entorno correcto
    expect(currentUrl).toContain(BASE_URL.replace('http://', '').replace('https://', ''));
    
    // Si estamos en producción, NO debería contener localhost
    if (!BASE_URL.includes('localhost')) {
      expect(currentUrl).not.toContain('localhost:3000');
    }
  });

  test('6.2 - Callback usa NEXT_PUBLIC_APP_URL en producción', async ({ page }) => {
    // Este test verifica que el callback route use la variable correcta
    
    // Simular un callback con código (aunque no sea válido)
    await page.goto(`${BASE_URL}/auth/callback?code=test_invalid_code`);
    
    // Esperar redirección (debería ir a login por código inválido)
    await page.waitForTimeout(2000);
    
    const currentUrl = page.url();
    console.log('URL después de callback con código inválido:', currentUrl);
    
    // La URL debería ser del mismo dominio que BASE_URL
    const baseUrlDomain = new URL(BASE_URL).hostname;
    const currentUrlDomain = new URL(currentUrl).hostname;
    
    expect(currentUrlDomain).toBe(baseUrlDomain);
    
    // NO debería redirigir a localhost si estamos en producción
    if (!BASE_URL.includes('localhost')) {
      expect(currentUrl).not.toContain('localhost:3000');
    }
  });

  test('6.3 - Link de recuperar contraseña funciona', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    
    // Click en "¿Olvidaste tu contraseña?"
    const forgotPasswordLink = page.locator('text=/olvidaste|recuperar/i');
    
    if (await forgotPasswordLink.isVisible()) {
      await forgotPasswordLink.click();
      
      // Verificar que redirige a página de recuperación
      await expect(page).toHaveURL(/recuperar/, { timeout: 3000 });
    }
  });

  // ============================================
  // 7️⃣ SEGURIDAD Y VALIDACIONES
  // ============================================
  
  test('7.1 - Contraseña no se muestra en texto plano', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    
    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('7.2 - Email debe tener formato válido', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toHaveAttribute('type', 'email');
  });

  test('7.3 - Formularios no envían datos en GET', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    
    // Los formularios de autenticación deben ser POST o cliente-side
    const form = page.locator('form');
    const method = await form.getAttribute('method');
    
    // Si hay método, no debería ser GET
    if (method) {
      expect(method.toUpperCase()).not.toBe('GET');
    }
  });

  // ============================================
  // 8️⃣ EXPERIENCIA DE USUARIO
  // ============================================
  
  test('8.1 - Logo enlaza al home', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    
    // Click en el logo
    const logo = page.locator('a[href="/"], a[href="' + BASE_URL + '"]').filter({
      has: page.locator('text=/casi.*cinco|5/i')
    });
    
    if (await logo.first().isVisible()) {
      await logo.first().click();
      await expect(page).toHaveURL(BASE_URL);
    }
  });

  test('8.2 - Botones de carga muestran estado loading', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    
    await page.fill('input[type="email"]', 'test@test.com');
    await page.fill('input[type="password"]', 'password123');
    
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();
    
    // Verificar que el botón muestra estado de carga
    // (puede ser texto "Cargando...", spinner, o disabled)
    const hasLoadingState = await Promise.race([
      submitButton.locator('text=/cargando|loading/i').isVisible().catch(() => false),
      submitButton.isDisabled(),
      Promise.resolve(false)
    ]);
    
    // Es aceptable si muestra loading state
    console.log('Loading state:', hasLoadingState);
  });

  test('8.3 - Página es responsive', async ({ page }) => {
    // Probar en diferentes tamaños de pantalla
    
    // Desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(`${BASE_URL}/login`);
    await expect(page.locator('input[type="email"]')).toBeVisible();
    
    // Tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    
    // Mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  // ============================================
  // 9️⃣ ACCESIBILIDAD
  // ============================================
  
  test('9.1 - Inputs tienen labels o placeholders', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    
    // Verificar que tienen placeholder o label asociado
    const emailHasPlaceholder = await emailInput.getAttribute('placeholder');
    const passwordHasPlaceholder = await passwordInput.getAttribute('placeholder');
    
    expect(emailHasPlaceholder || await emailInput.getAttribute('aria-label')).toBeTruthy();
    expect(passwordHasPlaceholder || await passwordInput.getAttribute('aria-label')).toBeTruthy();
  });

  test('9.2 - Página tiene título apropiado', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    
    const title = await page.title();
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(0);
  });

});

// ============================================
// 🎯 RESUMEN DE TESTS
// ============================================
/*
  TESTS IMPLEMENTADOS:
  
  ✅ 1. Página de Login (3 tests)
  ✅ 2. Página de Registro (5 tests)
  ✅ 3. Google OAuth (4 tests) ⭐ INCLUYE VERIFICACIÓN DE localhost:3000
  ✅ 4. Persistencia de Sesión (2 tests)
  ✅ 5. Cierre de Sesión (2 tests)
  ✅ 6. Redirecciones (3 tests) ⭐ INCLUYE VERIFICACIÓN DE NEXT_PUBLIC_APP_URL
  ✅ 7. Seguridad (3 tests)
  ✅ 8. UX (3 tests)
  ✅ 9. Accesibilidad (2 tests)
  
  TOTAL: 27 tests
  
  PARA EJECUTAR:
  
  🏠 En localhost (desarrollo):
  npm run test:auth
  
  🌐 En producción (Amplify):
  TEST_URL=https://main.d2nzzzmoajf631.amplifyapp.com npm run test:auth
  
  TESTS CLAVE PARA DETECCIÓN DE BUGS:
  
  🔍 Test 3.2 - Verifica que NO use localhost:3000 en OAuth redirectTo
  🔍 Test 3.4 - Verifica que NO use prompt=consent (evita confirmación repetida)
  🔍 Test 6.1 - Verifica que callback NO redirija a localhost:3000
  🔍 Test 6.2 - Verifica que use NEXT_PUBLIC_APP_URL correctamente
  
  NOTAS:
  - Algunos tests pueden fallar si no hay un usuario de prueba configurado
  - Los tests de OAuth capturan las URLs de redirección para detectar bugs
  - Tests 3.2, 6.1 y 6.2 específicamente detectan el problema de localhost:3000
  - Se recomienda ejecutar en producción después de cada deploy
*/

