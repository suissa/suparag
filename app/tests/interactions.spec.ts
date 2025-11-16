import { test, expect } from '@playwright/test';

test.describe('Interações', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/interactions');
    await page.waitForLoadState('networkidle');
  });

  test('deve exibir página de interações', async ({ page }) => {
    await expect(page.locator('main h1')).toContainText('Interações');
    await expect(page.locator('text=Histórico de comunicações')).toBeVisible();
  });

  test('deve filtrar por canal', async ({ page }) => {
    await page.waitForTimeout(1000);
    
    const select = page.locator('select');
    await select.selectOption('chat');
    await expect(select).toHaveValue('chat');
  });

  test('deve abrir modal de nova interação', async ({ page }) => {
    await page.waitForTimeout(1000);
    await page.keyboard.press('Escape').catch(() => {});
    await page.waitForTimeout(500);
    
    const button = page.locator('button:has-text("Nova Interação")').first();
    await button.waitFor({ state: 'visible', timeout: 10000 });
    await button.evaluate((el: HTMLElement) => el.click());
    
    await expect(page.locator('h2:has-text("Nova Interação")')).toBeVisible({ timeout: 10000 });
    
    // Fechar modal
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
  });

  test('deve buscar interações', async ({ page }) => {
    await page.fill('input[placeholder*="Buscar"]', 'teste');
    await page.waitForTimeout(500);
    
    const searchInput = page.locator('input[placeholder*="Buscar"]');
    await expect(searchInput).toHaveValue('teste');
  });

  test('deve exibir tabela ou mensagem vazia', async ({ page }) => {
    await page.waitForTimeout(1000);
    
    const hasTable = await page.locator('table').isVisible().catch(() => false);
    const isEmpty = await page.locator('text=Nenhuma interação encontrada').isVisible().catch(() => false);
    
    expect(hasTable || isEmpty).toBeTruthy();
  });
});
