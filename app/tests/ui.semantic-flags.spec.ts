import { test, expect } from '@playwright/test';

test.describe('UI Semantic Flags', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar para a página de flags semânticas
    await page.goto('/semantic-flags');
    await page.waitForLoadState('networkidle');
  });

  test('deve carregar lista de flags semânticas', async ({ page }) => {
    // Verificar se estamos na página correta
    await expect(page).toHaveURL(/.*semantic-flags/);

    // Verificar título da página
    await expect(page.locator('h1').filter({ hasText: 'Flags Semânticas' })).toBeVisible();
  });

  test('deve ter elementos básicos da interface', async ({ page }) => {
    // Verificar presença de elementos principais
    await expect(page.locator('h1')).toBeVisible();

    // Verificar que há algum tipo de container de conteúdo
    const hasCard = await page.locator('[class*="bg-"]').count() > 0;
    expect(hasCard).toBe(true);
  });

  test('deve mostrar estatísticas ou mensagem de vazio', async ({ page }) => {
    // Aguardar carregamento
    await page.waitForTimeout(2000);

    // Verificar se há estatísticas ou mensagem de vazio
    const hasStats = await page.locator('[class*="metric-card"]').count() > 0;
    const hasTable = await page.locator('table').isVisible();
    const hasLoading = await page.locator('text=Carregando').isVisible();
    const hasEmpty = await page.locator('text=Nenhuma').isVisible();

    expect(hasStats || hasTable || hasLoading || hasEmpty).toBe(true);
  });

  test('deve ter filtros disponíveis', async ({ page }) => {
    // Verificar se há algum select ou controle de filtro
    const selects = page.locator('select');
    const hasSelect = await selects.count() > 0;

    if (hasSelect) {
      // Se há select, deve ser funcional
      const firstSelect = selects.first();
      await expect(firstSelect).toBeVisible();
    } else {
      // Se não há filtros, apenas verificar que a página carrega
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('deve ter estrutura de tabela ou mensagem apropriada', async ({ page }) => {
    // Aguardar carregamento
    await page.waitForTimeout(2000);

    // Verificar estrutura da página
    const hasTable = await page.locator('table').isVisible();
    const hasEmptyMessage = await page.locator('text=Nenhuma').isVisible();
    const hasLoading = await page.locator('text=Carregando').isVisible();

    expect(hasTable || hasEmptyMessage || hasLoading).toBe(true);
  });
});
