import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

/** Walks a fresh page through character creation + the diagnostic to the world map. */
export async function createCharacterAndReachWorldMap(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Begin Your Quest' }).click();
  await page.getByRole('button', { name: 'Confirm & Take the Diagnostic' }).click();

  // Diagnostic: answer every question (correctness doesn't matter for navigation —
  // it only routes initial mastery/difficulty), submitting whatever placeholder-shaped
  // value the input accepts so we can reach the world map deterministically.
  for (let i = 0; i < 20; i++) {
    const doneHeading = page.getByRole('heading', { name: 'Diagnostic Complete' });
    if (await doneHeading.isVisible().catch(() => false)) break;

    const mcChoice = page.locator('button', { hasText: /^./ }).first();
    const textInput = page.locator('input[placeholder]').first();
    if (await textInput.isVisible().catch(() => false)) {
      await textInput.fill('1');
      await page.getByRole('button', { name: 'Submit' }).click();
    } else if (await mcChoice.isVisible().catch(() => false)) {
      await mcChoice.click();
    } else {
      break;
    }
    await page.waitForTimeout(950); // Diagnostic advances on a fixed 900ms feedback timer.
  }

  await page.getByRole('button', { name: 'Enter the Foundation Forge' }).click();
  await expect(page.getByText('🗺️ Map')).toBeVisible();
}

/** Makes dice rolls deterministic for a page by pinning Math.random(). Call BEFORE goto(). */
export async function pinRandom(page: Page, value = 0) {
  await page.addInitScript((v) => {
    Math.random = () => v;
  }, value);
}
