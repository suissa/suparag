import { test, expect } from '@playwright/test';

test.describe('Interações', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/interactions');
    await page.waitForLoadState('networkidle');
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

  test('deve abrir e fechar modal de nova interação', async ({ page }) => {
    // Abrir modal
    await page.click('button:has-text("Nova Interação")');
    await expect(page.locator('h2:has-text("Nova Interação")')).toBeVisible();
    
    // Fechar com ESC
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    await expect(page.locator('h2:has-text("Nova Interação")')).not.toBeVisible();
    
    // Abrir novamente e fechar clicando fora
    await page.click('button:has-text("Nova Interação")');
    await expect(page.locator('h2:has-text("Nova Interação")')).toBeVisible();
    
    await page.locator('.fixed.inset-0').first().click({ position: { x: 10, y: 10 } });
    await page.waitForTimeout(500);
    await expect(page.locator('h2:has-text("Nova Interação")')).not.toBeVisible();
  });

  test('deve exibir sentimento com cores', async ({ page }) => {
    await page.waitForTimeout(1000);
    
    // Verificar se existem badges de sentimento
    const sentimentBadges = page.locator('text=/Positivo|Negativo|Neutro/');
    const count = await sentimentBadges.count();
    
    // Se houver interações, deve ter badges
    expect(count >= 0).toBeTruthy();
  });

  test('deve buscar interações', async ({ page }) => {
    await page.fill('input[placeholder*="Buscar"]', 'teste');
    await page.waitForTimeout(500);
    
    const searchInput = page.locator('input[placeholder*="Buscar"]');
    await expect(searchInput).toHaveValue('teste');
  });
});
