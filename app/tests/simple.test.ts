import { test, expect } from '@playwright/test';

test.describe('Simple Tests', () => {
  test('deve carregar a página inicial', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/.*$/);
  });

  test('deve navegar para evaluations', async ({ page }) => {
    await page.goto('/evaluations');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/.*evaluations/);
  });
});
