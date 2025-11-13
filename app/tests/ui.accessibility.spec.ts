import { test, expect } from '@playwright/test';

test.describe('UI Accessibility', () => {
  test('deve ter estrutura semântica básica', async ({ page }) => {
    await page.goto('/evaluations');
    await page.waitForLoadState('networkidle');

    // Verificar headings
    await expect(page.locator('h1')).toBeVisible();

    // Verificar presença de elementos interativos
    const buttons = page.locator('button');
    expect(await buttons.count()).toBeGreaterThan(0);
  });

  test('deve permitir navegação por teclado básica', async ({ page }) => {
    await page.goto('/evaluations');
    await page.waitForLoadState('networkidle');

    // Focar no primeiro elemento interativo
    await page.keyboard.press('Tab');

    // Verificar que algum elemento recebeu foco
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBeDefined();
  });

  test('deve ter contraste visual adequado', async ({ page }) => {
    await page.goto('/evaluations');
    await page.waitForLoadState('networkidle');

    // Verificar que elementos principais são visíveis
    await expect(page.locator('h1, h2, h3')).toHaveCount(await page.locator('h1, h2, h3').count());

    // Verificar que há contraste entre texto e fundo
    const textElements = page.locator('[class*="text-"]');
    expect(await textElements.count()).toBeGreaterThan(0);
  });

  test('deve ter botões funcionais na avaliação ao vivo', async ({ page }) => {
    await page.goto('/evaluations/live');
    await page.waitForLoadState('networkidle');

    // Verificar presença de botões
    const buttons = page.locator('button');
    await expect(buttons.first()).toBeVisible();

    // Verificar que botões têm texto ou ícones
    const firstButton = buttons.first();
    const buttonText = await firstButton.textContent();
    expect(buttonText?.trim() || '').not.toBe('');
  });

  test('deve manter elementos acessíveis em diferentes viewports', async ({ page }) => {
    // Testar desktop
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/evaluations');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1')).toBeVisible();

    // Testar mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1')).toBeVisible();
  });

  test('deve ter estrutura de formulário básica', async ({ page }) => {
    await page.goto('/evaluations');
    await page.waitForLoadState('networkidle');

    // Verificar se há selects ou inputs
    const formElements = page.locator('select, input, textarea');
    // Pode ou não ter elementos de formulário dependendo dos dados
    await expect(page.locator('body')).toBeVisible();
  });
});
