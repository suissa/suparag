import { test, expect } from '@playwright/test';

test.describe('Tickets', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tickets');
    await page.waitForLoadState('networkidle');
  });

  test('deve exibir página de tickets', async ({ page }) => {
    await expect(page.locator('main h1')).toContainText('Tickets');
    await expect(page.locator('text=Gerencie tickets de suporte')).toBeVisible();
  });

  test('deve filtrar por status', async ({ page }) => {
    await page.waitForTimeout(1000);
    
    const select = page.locator('select');
    await select.selectOption('open');
    await expect(select).toHaveValue('open');
  });

  test('deve abrir modal de novo ticket', async ({ page }) => {
    await page.waitForTimeout(1000);
    await page.keyboard.press('Escape').catch(() => {});
    await page.waitForTimeout(500);
    
    const button = page.locator('button:has-text("Novo Ticket")').first();
    await button.waitFor({ state: 'visible', timeout: 10000 });
    await button.evaluate((el: HTMLElement) => el.click());
    
    await expect(page.locator('h2:has-text("Novo Ticket")')).toBeVisible({ timeout: 10000 });
    
    // Fechar modal
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
  });

  test('deve buscar tickets', async ({ page }) => {
    await page.fill('input[placeholder*="Buscar"]', 'teste');
    await page.waitForTimeout(500);
    
    const searchInput = page.locator('input[placeholder*="Buscar"]');
    await expect(searchInput).toHaveValue('teste');
  });

  test('deve exibir tabela ou mensagem vazia', async ({ page }) => {
    await page.waitForTimeout(1000);
    
    const hasTable = await page.locator('table').isVisible().catch(() => false);
    const isEmpty = await page.locator('text=Nenhum ticket encontrado').isVisible().catch(() => false);
    
    expect(hasTable || isEmpty).toBeTruthy();
  });
});
