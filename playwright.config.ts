import { defineConfig, devices } from '@playwright/test';

/**
 * Configuración de Playwright para Casi Cinco App
 * Tests E2E con Chrome visible (no headless)
 */
export default defineConfig({
  testDir: './TESTERS',
  
  // Timeout por test
  timeout: 30 * 1000,
  
  // Expect timeout
  expect: {
    timeout: 5000
  },
  
  // Configuración de reportes
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  
  reporter: [
    ['html', { outputFolder: 'TESTERS/reports' }],
    ['list']
  ],
  
  use: {
    // URL base
    baseURL: process.env.TEST_URL || 'http://localhost:3000',
    
    // 🔍 CHROME VISIBLE - No headless
    headless: false,
    
    // Trace on first retry
    trace: 'on-first-retry',
    
    // Screenshot on failure
    screenshot: 'only-on-failure',
    
    // Video on failure
    video: 'retain-on-failure',
    
    // Viewport
    viewport: { width: 1280, height: 720 },
  },

  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // 🔍 Forzar Chrome visible
        launchOptions: {
          headless: false,
          slowMo: 50, // Ralentizar 50ms entre acciones para poder ver
        }
      },
    },

    // Opcional: Tests en móvil
    // {
    //   name: 'Mobile Chrome',
    //   use: { 
    //     ...devices['Pixel 5'],
    //     launchOptions: {
    //       headless: false,
    //     }
    //   },
    // },
  ],

  // Servidor de desarrollo
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});

