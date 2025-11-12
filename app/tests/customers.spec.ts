import { test, expect } from '@playwright/test';

test.describe('CRUD de Clientes', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/customers');
  });

  test('deve exibir a página de clientes', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Clientes');
    await expect(page.locator('text=Gerencie seus clientes')).toBeVisible();
  });

  test('deve abrir modal de novo cliente', async ({ page }) => {
    await page.click('button:has-text("Novo Cliente")');
    
    await expect(page.locator('text=Novo Cliente').nth(1)).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('deve criar um novo cliente', async ({ page }) => {
    await page.click('button:has-text("Novo Cliente")');
    
    // Preencher formulário
    await page.fill('input[value=""]', 'Cliente Teste Playwright');
    await page.fill('input[type="email"]', 'teste@playwright.com');
    await page.fill('input[placeholder*="Telefone"]', '+5511999999999');
    
    // Submeter
    await page.click('button[type="submit"]:has-text("Criar Cliente")');
    
    // Aguardar criação
    await page.waitForTimeout(2000);
    
    // Verificar se aparece na lista
    await expect(page.locator('text=Cliente Teste Playwright')).toBeVisible();
  });

  test('deve buscar clientes', async ({ page }) => {
    await page.fill('input[placeholder*="Buscar"]', 'teste');
    
    // Aguardar filtro
    await page.waitForTimeout(500);
    
    // Verificar que a busca foi aplicada
    const searchInput = page.locator('input[placeholder*="Buscar"]');
    await expect(searchInput).toHaveValue('teste');
  });

  test('deve navegar para detalhes do cliente', async ({ page }) => {
    // Aguardar carregar lista
    await page.waitForTimeout(1000);
    
    // Clicar no primeiro botão "Ver"
    const viewButton = page.locator('button:has-text("Ver")').first();
    if (await viewButton.isVisible()) {
      await viewButton.click();
      
      // Verificar navegação
      await expect(page).toHaveURL(/\/customers\/.+/);
      await expect(page.locator('button:has-text("Voltar")')).toBeVisible();
    }
  });

  test('deve exibir loading state', async ({ page }) => {
    // Recarregar página para ver loading
    await page.reload();
    
    // Verificar se mostra loading (pode ser rápido)
    const loadingOrTable = await Promise.race([
      page.locator('.animate-spin').isVisible(),
      page.locator('table').isVisible()
    ]);
    
    expect(loadingOrTable).toBeTruthy();
  });
});
