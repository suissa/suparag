import { test, expect } from '@playwright/test';

test.describe('Navegação do CRM', () => {
  test('deve navegar para todas as páginas principais', async ({ page }) => {
    await page.goto('/');
    
    // Verificar Dashboard
    await expect(page).toHaveURL('/');
    await expect(page.locator('h1')).toContainText('Dashboard');
    
    // Navegar para Clientes
    await page.click('text=Clientes');
    await expect(page).toHaveURL('/customers');
    await expect(page.locator('h1')).toContainText('Clientes');
    
    // Navegar para Interações
    await page.click('text=Interações');
    await expect(page).toHaveURL('/interactions');
    await expect(page.locator('h1')).toContainText('Interações');
    
    // Navegar para Tickets
    await page.click('text=Tickets');
    await expect(page).toHaveURL('/tickets');
    await expect(page.locator('h1')).toContainText('Tickets');
    
    // Navegar para RAG Docs
    await page.click('text=RAG Docs');
    await expect(page).toHaveURL('/rag');
    await expect(page.locator('h1')).toContainText('Documentos RAG');
    
    // Navegar para Métricas
    await page.click('text=Métricas');
    await expect(page).toHaveURL('/metrics');
    await expect(page.locator('h1')).toContainText('Métricas');
  });

  test('deve destacar o item ativo na sidebar', async ({ page }) => {
    await page.goto('/customers');
    
    const activeLink = page.locator('a.bg-primary\\/20');
    await expect(activeLink).toContainText('Clientes');
  });

  test('deve mostrar status da API na sidebar', async ({ page }) => {
    await page.goto('/');
    
    await expect(page.locator('text=API Conectada')).toBeVisible();
    await expect(page.locator('text=v1.0.0')).toBeVisible();
  });
});
