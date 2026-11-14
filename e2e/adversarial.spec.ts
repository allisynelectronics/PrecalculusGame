import { expect, test } from '@playwright/test';
import { createCharacterAndReachWorldMap, pinRandom } from './helpers';

test.describe('adversarial / unusual player behavior', () => {
  test('rapid double-click on Roll does not move the player twice', async ({ page }) => {
    await pinRandom(page, 0);
    await createCharacterAndReachWorldMap(page);
    await page.getByRole('button', { name: /Foundation Forge/i }).first().click();

    // Accessible name is "🎲 Roll" before the first roll, "🎲 <N>" after — match the emoji.
    const rollButton = page.getByRole('button', { name: /🎲/ });
    // force:true bypasses Playwright's actionability wait (which would otherwise refuse
    // to click a disabled button) — this is deliberately simulating a user mashing the
    // button faster than the disabled state can visually register.
    await rollButton.click({ force: true });
    await rollButton.click({ force: true });
    await rollButton.click({ force: true });

    await page.waitForTimeout(1200); // full roll(650) + resolve(300) animation plus margin

    // Landing on space index1 (shrine) opens a modal; close it if present, then read the
    // "Space X of Y" counter, which reports the CLAMPED board position directly.
    const shrineContinue = page.getByRole('button', { name: /I understand/ });
    if (await shrineContinue.isVisible().catch(() => false)) await shrineContinue.click();

    await expect(page.getByText(/Space \d+ of \d+/)).toContainText('Space 2 of');
  });

  test('rapid double-click on a shrine reward does not grant it twice', async ({ page }) => {
    await pinRandom(page, 0);
    await createCharacterAndReachWorldMap(page);
    await page.getByRole('button', { name: /Foundation Forge/i }).first().click();

    // Board pattern: index1 is always a shrine space.
    await page.getByRole('button', { name: /🎲/ }).click();
    const continueButton = page.getByRole('button', { name: /I understand/ });
    await expect(continueButton).toBeVisible({ timeout: 3000 });

    // Dispatch two click events back-to-back inside a single page-context script, with
    // no round trip back to Playwright in between — this is much closer to a genuine
    // near-simultaneous double-click than two separate awaited .click() calls, which
    // each give React a full IPC round trip's worth of time to re-render in between.
    await continueButton.evaluate((el) => {
      el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    await page.getByText('📊 Dashboard').click();
    // Exactly one shrine reward (+5 XP, +1 star) must have landed, not two or three —
    // each StatCard's label sits in its own div, with the value in a sibling div, so
    // walk from the label up to the shared parent and assert on that.
    const xpCard = page.getByText('XP', { exact: true }).locator('xpath=..');
    await expect(xpCard).toContainText('5');
    const starCard = page.getByText('Stars', { exact: true }).locator('xpath=..');
    await expect(starCard).toContainText('⭐ 1');
  });

  test('refreshing mid-session preserves character and progress via localStorage', async ({ page }) => {
    await createCharacterAndReachWorldMap(page);
    const nameBefore = await page.locator('.font-semibold.text-purple-200').first().innerText();

    await page.reload();

    await expect(page.locator('.font-semibold.text-purple-200').first()).toHaveText(nameBefore);
    await expect(page.getByText('🗺️ Map')).toBeVisible();
  });

  test('a corrupted save file does not leave the player on a permanently blank page', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('mathverse-save', '{not valid json!!!');
    });
    await page.reload();

    // Whatever happens (clean fallback to title screen, or the ErrorBoundary's recovery
    // screen), the page must render SOMETHING actionable — not a blank white page with no
    // visible text and no button to recover from.
    await page.waitForTimeout(500);
    const bodyText = await page.locator('body').innerText();
    expect(bodyText.trim().length, 'page must not render as fully blank after a corrupted save').toBeGreaterThan(0);

    const hasRecoveryUI = await page.getByRole('button', { name: /Try to Continue|Reset Progress|Begin Your Quest/ }).first().isVisible().catch(() => false);
    expect(hasRecoveryUI, 'page must offer some actionable recovery control, not just arbitrary text').toBe(true);
  });

  test('multiple tabs share progress through localStorage', async ({ browser }) => {
    const context = await browser.newContext();
    const pageA = await context.newPage();
    const pageB = await context.newPage();

    await createCharacterAndReachWorldMap(pageA);
    await pageB.goto('/');
    await pageB.reload(); // pick up whatever localStorage pageA already wrote

    await expect(pageB.getByText('🗺️ Map')).toBeVisible();
    await context.close();
  });
});
