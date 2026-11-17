import { expect, test } from '@playwright/test';
import { ALL_PROBLEMS } from '../src/data/problems';
import { createCharacterAndReachWorldMap, pinRandom } from './helpers';

test.describe('full player journey', () => {
  test('title screen renders', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('MATHVERSE')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Begin Your Quest' })).toBeVisible();
  });

  test('character creation -> diagnostic -> world map', async ({ page }) => {
    await createCharacterAndReachWorldMap(page);
    await expect(page.getByText('🗺️ Map')).toBeVisible();
    await expect(page.getByText('📊 Dashboard')).toBeVisible();
    await expect(page.getByText('📖 Book')).toBeVisible();
  });

  test('board: roll, resolve a shrine, then solve a real problem', async ({ page }) => {
    await pinRandom(page, 0); // every roll = 1 + floor(0*6) = 1 space
    await createCharacterAndReachWorldMap(page);

    // Enter the only world unlocked by default. The die button's accessible name is
    // "🎲 Roll" before the first roll and "🎲 <N>" afterward (it keeps showing the last
    // roll), so every lookup below matches on the die emoji, not the word "Roll".
    await page.getByRole('button', { name: /Foundation Forge/i }).first().click();
    const rollButton = page.getByRole('button', { name: /🎲/ });
    await expect(rollButton).toBeVisible();

    // Board pattern for every world: index0 start, index1 shrine, index2 challenge.
    await rollButton.click();
    await expect(page.getByText('A Mystery Stirs...').or(page.getByText('Worked Example'))).toBeVisible({ timeout: 3000 });
    const shrineContinue = page.getByRole('button', { name: /I understand/ });
    if (await shrineContinue.isVisible().catch(() => false)) {
      await shrineContinue.click();
    }

    await rollButton.click();
    await page.waitForTimeout(1200); // roll(650ms) + resolve(300ms) animation, plus margin

    // First encounter with a topic shows the "Discover" stage before the solve stage.
    const readyButton = page.getByRole('button', { name: "I'm ready to try one myself" });
    if (await readyButton.isVisible().catch(() => false)) {
      await readyButton.click();
    }

    await expect(page.getByPlaceholder(/e\.g\./)).toBeVisible({ timeout: 5000 });

    // Identify the actual rendered problem from the real problem bank so we can submit
    // its real stored answer, rather than guessing — this proves the full submit ->
    // grade -> reward pipeline against real production data, not a stub. KaTeX's own
    // visual layout text is unreliable to match (stacked fractions etc. render with odd
    // whitespace), so read the raw TeX source back out of its <annotation> element
    // instead, which is exactly what MathText fed to katex.renderToString().
    // <annotation> is a MathML element, not an HTMLElement — innerText() doesn't work on
    // it, so read textContent() instead.
    const tex = ((await page.locator('.text-lg.text-purple-100 annotation').first().textContent()) ?? '').trim();
    const problem = ALL_PROBLEMS.find((p) => p.prompt.includes(tex));
    expect(problem, `could not identify rendered problem from TeX source: "${tex}"`).toBeTruthy();

    await page.getByPlaceholder(/e\.g\./).fill(problem!.answer);
    await page.getByRole('button', { name: 'Submit' }).click();

    await expect(page.getByText('Correct!')).toBeVisible({ timeout: 3000 });
  });

  test('dashboard renders after character creation', async ({ page }) => {
    await createCharacterAndReachWorldMap(page);
    await page.getByText('📊 Dashboard').click();
    await expect(page).toHaveURL(/.*/); // SPA, no URL change expected — just confirm no crash
    await expect(page.locator('body')).not.toContainText('Something went wrong');
  });

  test('free practice: pick a world, pick a topic, solve, and return to the picker', async ({ page }) => {
    await createCharacterAndReachWorldMap(page);
    await page.getByText('🎯 Practice').click();
    await expect(page.getByRole('heading', { name: 'Free Practice' })).toBeVisible();

    // Diagnostic-seeded mastery can put some Foundation Forge topics in the "Needs
    // Practice" shortcut list too, whose rows are also named "<topic><world>" — so this
    // must be an exact match on the world-picker pill, not a substring match.
    await page.getByRole('button', { name: 'The Foundation Forge', exact: true }).click();
    // Diagnostic-seeded mastery can also list this topic in the "Needs Practice"
    // shortcut above, so the topic name may appear twice on the page.
    await expect(page.getByText('Integer Operations & Order of Operations').first()).toBeVisible();

    const practiceButtons = page.getByRole('button', { name: 'Practice', exact: true });
    await practiceButtons.first().click();

    // First encounter with a topic shows the "Discover" stage before the solve stage.
    const readyButton = page.getByRole('button', { name: "I'm ready to try one myself" });
    if (await readyButton.isVisible().catch(() => false)) {
      await readyButton.click();
    }

    await expect(page.getByPlaceholder(/e\.g\./)).toBeVisible({ timeout: 5000 });
    const tex = ((await page.locator('.text-lg.text-purple-100 annotation').first().textContent()) ?? '').trim();
    const problem = ALL_PROBLEMS.find((p) => p.prompt.includes(tex));
    expect(problem, `could not identify rendered problem from TeX source: "${tex}"`).toBeTruthy();

    await page.getByPlaceholder(/e\.g\./).fill(problem!.answer);
    await page.getByRole('button', { name: 'Submit' }).click();
    await expect(page.getByText('Correct!')).toBeVisible({ timeout: 3000 });

    await page.getByRole('button', { name: 'Continue' }).click();

    // Back at the picker (not the board), with a "practice again" shortcut for the topic
    // just solved.
    await expect(page.getByRole('heading', { name: 'Free Practice' })).toBeVisible();
    await expect(page.getByText('Practice again')).toBeVisible();
  });

  test('compendium opens and the A-Z rail scrolls to a letter', async ({ page }) => {
    await createCharacterAndReachWorldMap(page);
    await page.getByText('📖 Book').click();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const railButtonS = page.locator('button', { hasText: /^S$/ }).first();
    if (await railButtonS.isVisible().catch(() => false)) {
      await railButtonS.click();
      await expect(page.locator('#compendium-letter-S')).toBeInViewport({ ratio: 0.1 });
    }
  });
});
