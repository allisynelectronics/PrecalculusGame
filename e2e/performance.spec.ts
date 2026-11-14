import { expect, test } from '@playwright/test';

/**
 * Lightweight performance check against the production build (not the dev server).
 * This captures real browser navigation-timing metrics and the actual transferred
 * byte counts — it is NOT a full Lighthouse audit (no Core Web Vitals field data, no
 * simulated throttling, no scoring) and does not claim to be one. Numbers are recorded
 * for QA_REPORT, not asserted against arbitrary thresholds the project never agreed to.
 */
test('production build: page load timing and payload size', async ({ page }) => {
  const responses: { url: string; size: number }[] = [];
  page.on('response', async (res) => {
    try {
      const body = await res.body();
      responses.push({ url: res.url(), size: body.length });
    } catch {
      // navigation/redirect responses etc. may not have a body — skip them
    }
  });

  const start = Date.now();
  await page.goto('/', { waitUntil: 'load' });
  const loadTime = Date.now() - start;

  const timing = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paint = performance.getEntriesByType('paint');
    const fcp = paint.find((p) => p.name === 'first-contentful-paint')?.startTime ?? null;
    return {
      domContentLoaded: nav.domContentLoadedEventEnd - nav.startTime,
      domInteractive: nav.domInteractive - nav.startTime,
      transferSize: nav.transferSize,
      firstContentfulPaintMs: fcp,
    };
  });

  const totalBytes = responses.reduce((sum, r) => sum + r.size, 0);
  const jsBytes = responses.filter((r) => r.url.endsWith('.js')).reduce((sum, r) => sum + r.size, 0);
  const fontBytes = responses.filter((r) => /\.(woff2?|ttf)$/.test(r.url)).reduce((sum, r) => sum + r.size, 0);

  console.log('--- Production build load metrics (Chromium, local network, no throttling) ---');
  console.log(`wall-clock page load (goto -> 'load' event): ${loadTime}ms`);
  console.log(`DOMContentLoaded: ${timing.domContentLoaded.toFixed(0)}ms`);
  console.log(`DOM interactive: ${timing.domInteractive.toFixed(0)}ms`);
  console.log(`First Contentful Paint: ${timing.firstContentfulPaintMs?.toFixed(0) ?? 'n/a'}ms`);
  console.log(`Total response bytes fetched on initial load: ${(totalBytes / 1024).toFixed(0)}KB`);
  console.log(`  of which JS: ${(jsBytes / 1024).toFixed(0)}KB`);
  console.log(`  of which fonts (KaTeX, eagerly loaded): ${(fontBytes / 1024).toFixed(0)}KB`);

  // Sanity bounds only — generous enough not to be a brittle perf-regression gate, just
  // a tripwire against something becoming catastrophically slow or bloated.
  expect(loadTime, 'initial page load should not exceed 10s on an unthrottled local network').toBeLessThan(10_000);
  expect(jsBytes, 'main JS payload should not balloon past 5MB unnoticed').toBeLessThan(5 * 1024 * 1024);
});
