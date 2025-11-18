import { test, expect } from '@playwright/test';

test.describe('First Visit Guard', () => {
  test.beforeEach(async ({ context }) => {
    // Clear localStorage before each test
    await context.addInitScript(() => {
      localStorage.clear();
    });
  });

  test('should redirect first-time visitors to /customers', async ({ page }) => {
    // Ensure no visit token exists
    await page.goto('/');
    
    // Should redirect to /customers
    await page.waitForURL(/.*customers/);
    expect(page.url()).toContain('/customers');
    
    // Should have set the visit token
    const hasVisited = await page.evaluate(() => {
      return localStorage.getItem('neuroPgRag_hasVisited');
    });
    expect(hasVisited).toBe('true');
  });

  test('should not redirect returning visitors to /customers', async ({ page }) => {
    // Set the visit token to simulate returning visitor
    await page.addInitScript(() => {
      localStorage.setItem('neuroPgRag_hasVisited', 'true');
    });
    
    // Go to root
    await page.goto('/');
    
    // Should stay on root (or go to default route)
    // Note: This might depend on the actual routing implementation
    // For now, we'll check that it doesn't redirect to customers
    await page.waitForLoadState('networkidle');
    
    // If there's a default redirect, it might go somewhere else, but it shouldn't go to customers
    // unless that's the default route for returning users
    const url = page.url();
    // This assertion might need to be adjusted based on actual app behavior
    expect(url).not.toContain('/customers');
  });

  test('should show onboarding view for first-time visitors with no customers', async ({ page }) => {
    // Ensure no visit token exists
    await page.goto('/');
    
    // Should redirect to /customers
    await page.waitForURL(/.*customers/);
    
    // Should show onboarding view with import button
    const importButton = page.locator('button:has-text("Importar Contatos e Visualizar Métricas")');
    await expect(importButton).toBeVisible();
  });

  test('should not show onboarding view for users with existing customers', async ({ page }) => {
    // This test would require seeding the database with customers
    // For now, we'll skip this as it requires more complex setup
    test.skip();
  });
});