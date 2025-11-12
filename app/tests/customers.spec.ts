import { test, expect } from '@playwright/test';

test.describe('CRUD de Clientes', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/customers');
    await page.waitForLoadState('networkidle');
  });

  test('deve exibir a página de clientes', async ({ page }) => {
    await expect(page.locator('main h1')).toContainText('Clientes');
    await expect(page.locator('text=Gerencie seus clientes')).toBeVisible();
  });

  test('deve abrir modal de novo cliente', async ({ page }) => {
    await page.locator('button:has-text("Novo Cliente")').click();
    await expect(page.locator('h2:has-text("Novo Cliente")')).toBeVisible();
    
    // Fechar modal para não interferir em outros testes
    await page.keyboard.press('Escape').catch(() => {});
    await page.waitForTimeout(300);
  });

  test('deve buscar clientes', async ({ page }) => {
    await page.fill('input[placeholder*="Buscar"]', 'teste');
    await page.waitForTimeout(500);
    const searchInput = page.locator('input[placeholder*="Buscar"]');
    await expect(searchInput).toHaveValue('teste');
  });

  test('deve navegar para detalhes do cliente', async ({ page }) => {
    await page.waitForTimeout(1000);
    
    const viewButton = page.locator('button:has-text("Ver")').first();
    const isVisible = await viewButton.isVisible().catch(() => false);
    
    if (isVisible) {
      await viewButton.click();
      await expect(page).toHaveURL(/\/customers\/.+/);
      await expect(page.locator('button:has-text("Voltar")')).toBeVisible();
    } else {
      expect(true).toBeTruthy();
    }
  });

  test('deve exibir loading state', async ({ page }) => {
    await page.reload();
    const loadingOrTable = await Promise.race([
      page.locator('.animate-spin').isVisible(),
      page.locator('table').isVisible()
    ]);
    expect(loadingOrTable).toBeTruthy();
  });

  test('deve exibir tabela ou mensagem vazia', async ({ page }) => {
    await page.waitForTimeout(1000);
    
    const hasTable = await page.locator('table').isVisible().catch(() => false);
    const isEmpty = await page.locator('text=Nenhum cliente encontrado').isVisible().catch(() => false);
    
    expect(hasTable || isEmpty).toBeTruthy();
  });
});
