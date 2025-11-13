import { test, expect } from '@playwright/test';

test.describe('UI Navigation', () => {
  test('deve navegar entre páginas de avaliação', async ({ page }) => {
    // Ir para página de avaliações
    await page.goto('/evaluations');
    await expect(page).toHaveURL(/.*evaluations/);
    await expect(page.locator('h1').filter({ hasText: 'Avaliações de Respostas' })).toBeVisible();

    // Ir para avaliação ao vivo
    await page.goto('/evaluations/live');
    await expect(page).toHaveURL(/.*evaluations\/live/);
    await expect(page.locator('h1').filter({ hasText: 'Avaliação ao Vivo' })).toBeVisible();

    // Ir para flags semânticas
    await page.goto('/semantic-flags');
    await expect(page).toHaveURL(/.*semantic-flags/);
    await expect(page.locator('h1').filter({ hasText: 'Flags Semânticas' })).toBeVisible();
  });

  test('deve manter navegação consistente após reload', async ({ page }) => {
    // Ir para página de avaliações
    await page.goto('/evaluations');
    await page.waitForLoadState('networkidle');

    // Verificar página carregou
    await expect(page.locator('h1').filter({ hasText: 'Avaliações de Respostas' })).toBeVisible();

    // Recarregar página
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verificar se ainda está na mesma página
    await expect(page).toHaveURL(/.*evaluations/);
    await expect(page.locator('h1').filter({ hasText: 'Avaliações de Respostas' })).toBeVisible();
  });

  test('deve carregar páginas sem erros', async ({ page }) => {
    const pages = ['/evaluations', '/evaluations/live', '/semantic-flags'];

    for (const pageUrl of pages) {
      await page.goto(pageUrl);
      await page.waitForLoadState('networkidle');

      // Verificar que a página carregou sem erros óbvios
      await expect(page.locator('body')).toBeVisible();
      const hasError = await page.locator('text=Error').isVisible();
      expect(hasError).toBe(false);
    }
  });

  test('deve preservar funcionalidade básica durante navegação', async ({ page }) => {
    // Visitar múltiplas páginas
    await page.goto('/evaluations');
    await expect(page.locator('h1')).toBeVisible();

    await page.goto('/evaluations/live');
    await expect(page.locator('h1')).toBeVisible();

    await page.goto('/semantic-flags');
    await expect(page.locator('h1')).toBeVisible();

    // Verificar que todas as páginas têm elementos básicos funcionais
    await expect(page.locator('body')).toBeVisible();
  });
});
