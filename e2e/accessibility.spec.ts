import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { createCharacterAndReachWorldMap, gotoScreen, pinRandom } from './helpers';

/**
 * Automated WCAG 2.2 AA accessibility audit via axe-core. This catches a real, well-
 * defined subset of accessibility issues (color contrast, missing labels/roles, ARIA
 * misuse, etc.) — it is NOT a substitute for manual testing with an actual screen
 * reader (NVDA/JAWS/VoiceOver) or keyboard-only navigation, which this suite does not
 * perform. Findings here are concrete, reproducible axe-core violations; absence of a
 * finding is not a claim of full WCAG 2.2 AA conformance.
 */
async function runAxe(page: import('@playwright/test').Page) {
  return new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
}

test.describe('accessibility (axe-core, WCAG 2.2 AA tags)', () => {
  test('title screen', async ({ page }) => {
    await page.goto('/');
    const results = await runAxe(page);
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });

  test('character creation screen', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Begin Your Quest' }).click();
    const results = await runAxe(page);
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });

  test('diagnostic screen', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Begin Your Quest' }).click();
    await page.getByRole('button', { name: 'Confirm & Take the Diagnostic' }).click();
    const results = await runAxe(page);
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });

  test('world map', async ({ page }) => {
    await createCharacterAndReachWorldMap(page);
    const results = await runAxe(page);
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });

  test('dashboard', async ({ page }) => {
    await createCharacterAndReachWorldMap(page);
    await page.getByText('📊 Dashboard').click();
    const results = await runAxe(page);
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });

  test('compendium', async ({ page }) => {
    await createCharacterAndReachWorldMap(page);
    await page.getByText('📖 Book').click();
    const results = await runAxe(page);
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });

  test('adventure board', async ({ page }) => {
    await pinRandom(page, 0);
    await createCharacterAndReachWorldMap(page);
    await page.getByRole('button', { name: /Foundation Forge/i }).first().click();
    const results = await runAxe(page);
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });

  test('problem view (discover stage)', async ({ page }) => {
    await pinRandom(page, 0);
    await createCharacterAndReachWorldMap(page);
    await page.getByRole('button', { name: /Foundation Forge/i }).first().click();
    const rollButton = page.getByRole('button', { name: /🎲/ });
    await rollButton.click();
    // Board pattern: index1 is always a shrine — wait for its modal to actually appear
    // (not just a quick isVisible() snapshot) before deciding whether to close it, so a
    // late-arriving modal can't still be open and blocking the next roll.
    await expect(page.getByText('Worked Example')).toBeVisible({ timeout: 3000 });
    await page.getByRole('button', { name: /I understand/ }).click();
    await rollButton.click();
    await expect(page.getByRole('button', { name: "I'm ready to try one myself" })).toBeVisible({ timeout: 5000 });
    const results = await runAxe(page);
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });

  test('unit circle explorer', async ({ page }) => {
    await gotoScreen(page, 'unitcircle', 'trig-kingdom');
    const results = await runAxe(page);
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });

  test('trig wave visualizer', async ({ page }) => {
    await gotoScreen(page, 'trigwave', 'wave-galaxy');
    const results = await runAxe(page);
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });

  test('oblique triangle solver', async ({ page }) => {
    await gotoScreen(page, 'obliquetriangle', 'triangle-expedition');
    const results = await runAxe(page);
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });

  test('vector simulator', async ({ page }) => {
    await gotoScreen(page, 'vectorlab', 'polar-vector-valley');
    const results = await runAxe(page);
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });

  test('polar grapher', async ({ page }) => {
    await gotoScreen(page, 'polargrapher', 'polar-vector-valley');
    const results = await runAxe(page);
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });

  test('rational function graph explorer', async ({ page }) => {
    await gotoScreen(page, 'rationalgrapher', 'rational-rift');
    const results = await runAxe(page);
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });

  test('polynomial graph explorer', async ({ page }) => {
    await gotoScreen(page, 'polynomialgrapher', 'polynomial-peaks');
    const results = await runAxe(page);
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });

  test('exponential/log graph explorer', async ({ page }) => {
    await gotoScreen(page, 'explographer', 'exponential-empire');
    const results = await runAxe(page);
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });

  test('conic section explorer', async ({ page }) => {
    await gotoScreen(page, 'conicexplorer', 'conic-constellation');
    const results = await runAxe(page);
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });

  test('trig equation solution explorer', async ({ page }) => {
    await gotoScreen(page, 'trigequation', 'wave-galaxy');
    const results = await runAxe(page);
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });

  test("pascal's triangle explorer", async ({ page }) => {
    await gotoScreen(page, 'pascalstriangle', 'sequence-summit');
    const results = await runAxe(page);
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });

  test('sequence & series explorer', async ({ page }) => {
    await gotoScreen(page, 'sequenceexplorer', 'sequence-summit');
    const results = await runAxe(page);
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });

  test('matrix row-operation simulator', async ({ page }) => {
    await gotoScreen(page, 'matrixsimulator', 'matrix-fortress');
    const results = await runAxe(page);
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });
});
