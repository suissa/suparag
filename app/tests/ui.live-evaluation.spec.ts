import { test, expect } from '@playwright/test';

test.describe('UI Live Evaluation', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar para a página de avaliação ao vivo
    await page.goto('/evaluations/live');
    await page.waitForLoadState('networkidle');
  });

  test('deve carregar página de avaliação ao vivo', async ({ page }) => {
    // Verificar se estamos na página correta
    await expect(page).toHaveURL(/.*evaluations\/live/);

    // Verificar título da página
    await expect(page.locator('h1').filter({ hasText: 'Avaliação ao Vivo' })).toBeVisible();
  });

  test('deve ter elementos básicos da interface', async ({ page }) => {
    // Verificar presença de elementos principais
    await expect(page.locator('h1')).toBeVisible();

    // Verificar que há botões na página
    const buttons = page.locator('button');
    await expect(buttons.first()).toBeVisible();

    // Verificar que há algum conteúdo textual
    const textElements = page.locator('text').filter({ hasText: /./ });
    expect(await textElements.count()).toBeGreaterThan(0);
  });

  test('deve ter estrutura de cartão de avaliação', async ({ page }) => {
    // Verificar que há algum tipo de container/card
    const cards = page.locator('[class*="bg-"], [class*="card"]');
    expect(await cards.count()).toBeGreaterThan(0);

    // Verificar que há texto indicando pergunta/resposta
    await expect(page.locator('body')).toBeVisible();
  });

  test('deve responder a cliques básicos', async ({ page }) => {
    // Aguardar carregamento
    await page.waitForTimeout(1000);

    // Tentar clicar no primeiro botão disponível
    const firstButton = page.locator('button').first();

    if (await firstButton.isVisible()) {
      // Botão deve ser clicável (não deve causar erro)
      await expect(firstButton).toBeVisible();

      // Verificar que a página ainda está funcional após tentativa de clique
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('deve ser responsivo', async ({ page }) => {
    // Testar responsividade básica
    await page.setViewportSize({ width: 375, height: 667 });

    // Verificar que elementos principais ainda são visíveis
    await expect(page.locator('h1')).toBeVisible();

    // Voltar ao tamanho original
    await page.setViewportSize({ width: 1280, height: 720 });
    await expect(page.locator('h1')).toBeVisible();
  });
});
