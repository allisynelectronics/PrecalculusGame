import { defineConfig, devices } from '@playwright/test';

/**
 * E2E config. Runs against the actual PRODUCTION build (vite build + vite preview),
 * not the dev server, so these tests exercise what ships.
 *
 * Browser coverage is real Chromium, Firefox, and WebKit engines via Playwright's
 * bundled binaries — this is genuine multi-engine automated testing, but it is NOT a
 * substitute for testing actual Safari or a physical iOS/Android device: Playwright's
 * WebKit build tracks upstream WebKit, not Apple's shipped Safari build, and no mobile
 * OS behavior (real touch input, OS-level autofill, Safari-specific quirks) is covered.
 *
 * Desktop viewports only, deliberately: the app is not targeting mobile/narrow-viewport
 * layouts (confirmed with the project owner — the HUD overflows and is not usable below
 * ~480px wide), so no mobile device projects are configured here. See QA_REPORT for the
 * confirmed finding; it is tracked as an acknowledged, explicitly out-of-scope
 * limitation, not silently ignored.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 45_000, // the diagnostic walkthrough has ~10 fixed 950ms waits; give it headroom
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run build && npm run preview -- --port 4173',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});
