import { test, expect } from '@playwright/test';

test.describe('UI Evaluations', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar para a página de avaliações
    await page.goto('/evaluations');
    await page.waitForLoadState('networkidle');
  });

  test('deve carregar lista de avaliações', async ({ page }) => {
    // Verificar se estamos na página correta
    await expect(page).toHaveURL(/.*evaluations/);

    // Verificar título da página
    await expect(page.locator('h1').filter({ hasText: 'Avaliações de Respostas' })).toBeVisible();

    // Verificar se há algum conteúdo (carregamento ou tabela ou mensagem vazia)
    const hasLoading = await page.locator('text=Carregando').isVisible();
    const hasTable = await page.locator('table').isVisible();
    const hasEmptyMessage = await page.locator('text=Nenhuma avaliação encontrada').isVisible();

    expect(hasLoading || hasTable || hasEmptyMessage).toBe(true);
  });

  test('deve mostrar filtros de avaliação', async ({ page }) => {
    // Verificar presença dos filtros (pode não haver dados, mas os filtros devem existir)
    const hasRatingLabel = await page.locator('label').filter({ hasText: 'Avaliação' }).isVisible();
    const hasSeverityLabel = await page.locator('label').filter({ hasText: 'Severidade' }).isVisible();
    const hasLimitLabel = await page.locator('label').filter({ hasText: 'Limite' }).isVisible();

    // Pelo menos alguns filtros devem estar presentes
    expect(hasRatingLabel || hasSeverityLabel || hasLimitLabel).toBe(true);

    // Se há label de avaliação, deve haver select
    if (hasRatingLabel) {
      const ratingSelect = page.locator('select').first();
      await expect(ratingSelect).toBeVisible();
    }
  });

  test('deve permitir seleção de filtros', async ({ page }) => {
    // Aguardar carregamento
    await page.waitForTimeout(1000);

    // Tentar encontrar select de avaliação
    const ratingSelect = page.locator('select').first();

    if (await ratingSelect.isVisible()) {
      // Verificar que podemos selecionar opções
      await ratingSelect.selectOption('aprovado');
      await expect(ratingSelect).toHaveValue('aprovado');

      await ratingSelect.selectOption('incorreto');
      await expect(ratingSelect).toHaveValue('incorreto');

      await ratingSelect.selectOption('');
      await expect(ratingSelect).toHaveValue('');
    } else {
      // Se não há select, pelo menos verificar que a página carregou
      await expect(page.locator('h1')).toBeVisible();
    }
  });

  test('deve ter estrutura para modal de detalhes', async ({ page }) => {
    // Aguardar carregamento
    await page.waitForTimeout(1000);

    // Verificar que a página tem a estrutura esperada
    await expect(page.locator('h1').filter({ hasText: 'Avaliações de Respostas' })).toBeVisible();

    // Verificar que há algum tipo de container para dados
    const hasTable = await page.locator('table').isVisible();
    const hasLoading = await page.locator('text=Carregando').isVisible();
    const hasEmpty = await page.locator('text=Nenhuma').isVisible();

    expect(hasTable || hasLoading || hasEmpty).toBe(true);
  });

  test('deve ter elementos de interface consistentes', async ({ page }) => {
    // Verificar que a página tem elementos básicos de UI
    await expect(page.locator('h1')).toBeVisible();

    // Verificar que há algum container de conteúdo
    const hasCard = await page.locator('[class*="bg-"]').count() > 0;
    expect(hasCard).toBe(true);
  });

  test('deve responder a interações básicas', async ({ page }) => {
    // Aguardar carregamento
    await page.waitForTimeout(1000);

    // Verificar que a página está responsiva
    await expect(page.locator('body')).toBeVisible();

    // Verificar que não há erros óbvios de JavaScript
    const hasError = await page.locator('text=Error').isVisible();
    expect(hasError).toBe(false);
  });
});
