import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env.E2E_PORT ?? 3100);
const BASE_URL = process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`;

/**
 * Playwright config — roda contra a app cloud em modo dev com auth
 * bypass via env var (E2E_BYPASS_AUTH=true). Veja src/lib/tenant.ts e
 * src/middleware.ts no apps/cloud.
 *
 * Pré-requisito: DB Neon (ou Postgres local) acessível via DATABASE_URL,
 * com `pnpm db:migrate && pnpm db:seed` aplicados ao menos uma vez.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false, // server actions tocam DB compartilhado — serial é mais estável
  workers: 1,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: process.env.E2E_NO_WEBSERVER
    ? undefined
    : {
        command: `pnpm --filter @app/cloud exec next dev -p ${PORT}`,
        url: `${BASE_URL}/api/health`,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        env: {
          NODE_ENV: 'development',
          E2E_BYPASS_AUTH: 'true',
        },
      },
});
