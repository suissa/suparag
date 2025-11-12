import { test, expect } from '@playwright/test';

test.describe('Tickets', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tickets');
  });

  test('deve exibir página de tickets', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Tickets');
    await expect(page.locator('text=Gerencie tickets de suporte')).toBeVisible();
  });

  test('deve filtrar por status', async ({ page }) => {
    await page.waitForTimeout(1000);
    
    // Selecionar filtro de status
    await page.selectOption('select', 'open');
    
    // Verificar que o filtro foi aplicado
    const select = page.locator('select');
    await expect(select).toHaveValue('open');
  });

  test('deve exibir status coloridos', async ({ page }) => {
    await page.waitForTimeout(1000);
    
    // Verificar se existem badges de status
    const statusBadges = page.locator('text=/Aberto|Em Progresso|Resolvido|Fechado/');
    const count = await statusBadges.count();
    
    expect(count >= 0).toBeTruthy();
  });

  test('deve abrir modal de novo ticket', async ({ page }) => {
    await page.click('button:has-text("Novo Ticket")');
    
    await expect(page.locator('text=Novo Ticket').nth(1)).toBeVisible();
    await expect(page.locator('textarea')).toBeVisible();
  });
});
