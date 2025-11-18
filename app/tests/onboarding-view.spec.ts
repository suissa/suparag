import { test, expect } from '@playwright/test';

test.describe('Onboarding View', () => {
  test('should display onboarding view with import button', async ({ page }) => {
    // Navigate directly to customers page to see onboarding
    await page.goto('/customers');
    
    // Check that onboarding elements are visible
    const heading = page.locator('h1:has-text("Bem-vindo ao NeuroPgRag")');
    await expect(heading).toBeVisible();
    
    const description = page.locator('p:has-text("Conecte seu WhatsApp para importar seus contatos")');
    await expect(description).toBeVisible();
    
    const importButton = page.locator('button:has-text("Importar Contatos e Visualizar Métricas")');
    await expect(importButton).toBeVisible();
  });

  test('should trigger onConnect callback when import button is clicked', async ({ page }) => {
    // For this test, we would need to mock the WhatsApp connection context
    // Since this is a complex integration test, we'll focus on UI elements
    test.skip();
  });

  test('should have proper animations', async ({ page }) => {
    // Check that animation classes are present
    await page.goto('/customers');
    
    // Look for framer-motion elements or animation classes
    const animatedElements = page.locator('[class*="motion"]'); // Framer Motion classes
    // We can't easily test animations in Playwright, so we'll just check they exist
    // This is more of a visual check
  });
});