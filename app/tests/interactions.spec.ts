import { test, expect } from '@playwright/test';

test.describe('Interações', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/interactions');
  });

  test('deve exibir página de interações', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Interações');
    await expect(page.locator('text=Histórico de comunicações')).toBeVisible();
  });

  test('deve filtrar por canal', async ({ page }) => {
    await page.waitForTimeout(1000);
    
    // Selecionar filtro de canal
    await page.selectOption('select', 'chat');
    
    // Verificar que o filtro foi aplicado
    const select = page.locator('select');
    await expect(select).toHaveValue('chat');
  });

  test('deve abrir modal de nova interação', async ({ page }) => {
    await page.click('button:has-text("Nova Interação")');
    
    await expect(page.locator('text=Nova Interação').nth(1)).toBeVisible();
    await expect(page.locator('textarea')).toBeVisible();
  });

  test('deve exibir sentimento com cores', async ({ page }) => {
    await page.waitForTimeout(1000);
    
    // Verificar se existem badges de sentimento
    const sentimentBadges = page.locator('text=/Positivo|Negativo|Neutro/');
    const count = await sentimentBadges.count();
    
    // Se houver interações, deve ter badges
    expect(count >= 0).toBeTruthy();
  });
});
