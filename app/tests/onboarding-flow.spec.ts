import { test, expect } from '@playwright/test';

test.describe('Complete Onboarding Flow', () => {
  test.beforeEach(async ({ context }) => {
    // Clear localStorage before each test
    await context.addInitScript(() => {
      localStorage.clear();
    });
  });

  test('should complete full onboarding flow', async ({ page }) => {
    // 1. First visit - should redirect to /customers
    await page.goto('/');
    await page.waitForURL(/.*customers/);
    
    // 2. Should show onboarding view
    const onboardingHeading = page.locator('h1:has-text("Bem-vindo ao NeuroPgRag")');
    await expect(onboardingHeading).toBeVisible();
    
    // 3. Click import button
    const importButton = page.locator('button:has-text("Importar Contatos e Visualizar Métricas")');
    await importButton.click();
    
    // 4. Should open WhatsApp connection modal
    // Note: This would require mocking the WhatsApp connection process
    // For now, we'll just check that the button click works
    await expect(importButton).toBeVisible(); // Button should still be visible until modal opens
    
    // 5. After connection, should show customer table
    // This would require mocking the connection and import process
    test.skip();
  });

  test('should not show onboarding for returning visitors', async ({ page }) => {
    // Set the visit token to simulate returning visitor
    await page.addInitScript(() => {
      localStorage.setItem('neuroPgRag_hasVisited', 'true');
    });
    
    // Go to root
    await page.goto('/');
    
    // Should not show onboarding
    const onboardingHeading = page.locator('h1:has-text("Bem-vindo ao NeuroPgRag")');
    await expect(onboardingHeading).not.toBeVisible();
  });
});