import { test, expect } from '@playwright/test';

test.describe('Métricas', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/metrics');
    await page.waitForLoadState('networkidle');
  });

  test('deve exibir página de métricas', async ({ page }) => {
    await expect(page.locator('main h1')).toContainText('Métricas');
    await expect(page.locator('text=Visão geral do desempenho')).toBeVisible();
  });

  test('deve exibir 4 cards de KPIs', async ({ page }) => {
    await page.waitForTimeout(1000);
    await expect(page.locator('text=Total de Clientes')).toBeVisible();
    await expect(page.locator('text=Tickets Abertos')).toBeVisible();
    await expect(page.locator('text=Risco Churn Médio')).toBeVisible();
    await expect(page.locator('text=Sentimento Médio')).toBeVisible();
  });

  test('deve exibir gráficos', async ({ page }) => {
    await page.waitForTimeout(1000);
    await expect(page.locator('h3:has-text("Tickets por Status")').first()).toBeVisible();
    await expect(page.locator('h3:has-text("Interações por Canal")').first()).toBeVisible();
  });

  test('deve exibir resumo detalhado', async ({ page }) => {
    await page.waitForTimeout(1000);
    await expect(page.locator('h3:has-text("Resumo Detalhado")')).toBeVisible();
  });

  test('deve ter ícones nos cards', async ({ page }) => {
    await page.waitForTimeout(1000);
    const icons = page.locator('.material-symbols-outlined');
    const count = await icons.count();
    expect(count).toBeGreaterThan(0);
  });
});
