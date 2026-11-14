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

/** Seeds a minimal valid save directly in localStorage and navigates straight to the
 *  given screen — for screens (like the interactive labs) that don't need the full
 *  character-creation/diagnostic walkthrough to reach, and whose own UI is what's
 *  actually under test. */
export async function gotoScreen(page: Page, screen: string, currentWorldId = 'foundation-forge') {
  await page.goto('/');
  await page.evaluate(
    ({ screen, currentWorldId }) => {
      localStorage.setItem(
        'mathverse-save',
        JSON.stringify({
          state: {
            screen, character: { name: 'Astra', avatar: '🧙‍♀️', colorClass: 'x' },
            xp: 0, coins: 0, stars: 0, level: 1, currentWorldId,
            boardPositions: {}, diagnosticDone: true, seenTopics: [], mastery: {}, attempts: [],
            unlockedWorldIds: ['foundation-forge', 'polynomial-peaks', 'rational-rift', 'exponential-empire', 'trig-kingdom', 'wave-galaxy', 'identity-citadel', 'triangle-expedition', 'polar-vector-valley'],
            defeatedBosses: [], activeProblemId: null, activeSpaceIndex: null,
            pendingTopicId: null, pendingSpaceType: null, returnScreen: 'board', lastReward: null,
          },
          version: 1,
        }),
      );
    },
    { screen, currentWorldId },
  );
  await page.reload();
}
