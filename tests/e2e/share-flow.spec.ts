// ===== E2E TESTS (Playwright) — Public Share Route =====
// Tests the /share/[budgetId] public budget view
// Run with: npx playwright test tests/e2e/share-flow.spec.ts

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';

// ==============================================
// 1. NO AUTH REQUIRED
// ==============================================
test.describe('Share Route — No Authentication Required', () => {
  test('should not redirect to login when accessing /share without auth', async ({ page }) => {
    await page.goto(`${BASE_URL}/share/00000000-0000-0000-0000-000000000000`);
    await expect(page).not.toHaveURL(/\/login/, { timeout: 10000 });
  });

  test('should not redirect to login when accessing /share with expired param', async ({ page }) => {
    await page.goto(`${BASE_URL}/share/00000000-0000-0000-0000-000000000000?expires=2020-01-01`);
    await expect(page).not.toHaveURL(/\/login/, { timeout: 10000 });
  });
});

// ==============================================
// 2. 404 HANDLING
// ==============================================
test.describe('Share Route — 404 for Invalid Budget', () => {
  test('should show 404 page for non-existent budget ID', async ({ page }) => {
    const response = await page.goto(`${BASE_URL}/share/00000000-0000-0000-0000-000000000000`);
    expect(response?.status()).toBe(404);
  });

  test('should show 404 for completely invalid ID format', async ({ page }) => {
    const response = await page.goto(`${BASE_URL}/share/not-a-real-id`);
    expect(response?.status()).toBe(404);
  });

  test('should show 404 for empty-ish ID', async ({ page }) => {
    const response = await page.goto(`${BASE_URL}/share/%20`);
    expect(response?.status()).toBe(404);
  });
});

// ==============================================
// 3. EXPIRED LINKS
// ==============================================
test.describe('Share Route — Expired Link Handling', () => {
  test('should show "Enlace expirado" for past expiration date', async ({ page }) => {
    await page.goto(`${BASE_URL}/share/00000000-0000-0000-0000-000000000000?expires=2020-01-01`);
    await expect(page.locator('h1:has-text("Enlace expirado")')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Este enlace de presupuesto ya no está disponible')).toBeVisible();
  });

  test('should show expiration date in the expired page', async ({ page }) => {
    await page.goto(`${BASE_URL}/share/00000000-0000-0000-0000-000000000000?expires=2025-12-31`);
    await expect(page.locator('h1:has-text("Enlace expirado")')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=/Venció el/')).toBeVisible();
  });

  test('should show "Enlace expirado" for invalid date format', async ({ page }) => {
    await page.goto(`${BASE_URL}/share/00000000-0000-0000-0000-000000000000?expires=not-a-date`);
    await expect(page.locator('h1:has-text("Enlace expirado")')).toBeVisible({ timeout: 10000 });
  });

  test('should show expired page for yesterday date', async ({ page }) => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split('T')[0];
    await page.goto(`${BASE_URL}/share/00000000-0000-0000-0000-000000000000?expires=${dateStr}`);
    await expect(page.locator('h1:has-text("Enlace expirado")')).toBeVisible({ timeout: 10000 });
  });

  test('should NOT show expired page for future expiration date', async ({ page }) => {
    const future = new Date();
    future.setDate(future.getDate() + 30);
    const dateStr = future.toISOString().split('T')[0];
    const response = await page.goto(`${BASE_URL}/share/00000000-0000-0000-0000-000000000000?expires=${dateStr}`);
    expect(response?.status()).toBe(404);
    await expect(page.locator('h1:has-text("Enlace expirado")')).not.toBeVisible({ timeout: 5000 });
  });
});

// ==============================================
// 4. PAGE STRUCTURE (when budget exists)
// ==============================================
test.describe('Share Route — Page Structure', () => {
  const testBudgetId = process.env.SHARE_TEST_BUDGET_ID;
  const describeOrSkip = testBudgetId ? test.describe : test.describe.skip;

  describeOrSkip('with existing budget', () => {
    test('should render the BudgetAI branding header', async ({ page }) => {
      await page.goto(`${BASE_URL}/share/${testBudgetId}`);
      await expect(page.locator('span.text-foreground:has-text("BudgetAI")')).toBeVisible({ timeout: 15000 });
    });

    test('should render budget title in h1', async ({ page }) => {
      await page.goto(`${BASE_URL}/share/${testBudgetId}`);
      const h1 = page.locator('h1');
      await expect(h1).toBeVisible({ timeout: 15000 });
    });

    test('should render client section', async ({ page }) => {
      await page.goto(`${BASE_URL}/share/${testBudgetId}`);
      await expect(page.locator('text=Cliente')).toBeVisible({ timeout: 15000 });
    });

    test('should render conditions section', async ({ page }) => {
      await page.goto(`${BASE_URL}/share/${testBudgetId}`);
      await expect(page.locator('text=Condiciones')).toBeVisible({ timeout: 15000 });
    });

    test('should render items detail section', async ({ page }) => {
      await page.goto(`${BASE_URL}/share/${testBudgetId}`);
      await expect(page.locator('text=Detalle de trabajos')).toBeVisible({ timeout: 15000 });
    });

    test('should render totals section', async ({ page }) => {
      await page.goto(`${BASE_URL}/share/${testBudgetId}`);
      await expect(page.locator('span:text-is("TOTAL")')).toBeVisible({ timeout: 15000 });
    });

    test('should render the watermark element', async ({ page }) => {
      await page.goto(`${BASE_URL}/share/${testBudgetId}`);
      const watermark = page.locator('[aria-hidden="true"]:has-text("BudgetAI")');
      await expect(watermark).toBeVisible({ timeout: 15000 });
    });

    test('should render export buttons', async ({ page }) => {
      await page.goto(`${BASE_URL}/share/${testBudgetId}`);
      await expect(page.locator('text=Descargar PDF')).toBeVisible({ timeout: 15000 });
      await expect(page.locator('text=Descargar HTML')).toBeVisible({ timeout: 15000 });
    });

    test('should download PDF when clicking Descargar PDF', async ({ page }) => {
      await page.goto(`${BASE_URL}/share/${testBudgetId}`);
      await expect(page.locator('text=Descargar PDF')).toBeVisible({ timeout: 15000 });
      
      const downloadPromise = page.waitForEvent('download');
      await page.click('text=Descargar PDF');
      const download = await downloadPromise;
      
      expect(download.suggestedFilename()).toContain('.pdf');
    });

    test('should download HTML when clicking Descargar HTML', async ({ page }) => {
      await page.goto(`${BASE_URL}/share/${testBudgetId}`);
      await expect(page.locator('text=Descargar HTML')).toBeVisible({ timeout: 15000 });
      
      const downloadPromise = page.waitForEvent('download');
      await page.click('text=Descargar HTML');
      const download = await downloadPromise;
      
      expect(download.suggestedFilename()).toContain('.html');
    });

    test('should render footer branding', async ({ page }) => {
      await page.goto(`${BASE_URL}/share/${testBudgetId}`);
      await expect(page.locator('p:has-text("Generado con BudgetAI")')).toBeVisible({ timeout: 15000 });
    });

    test('should not have any edit buttons', async ({ page }) => {
      await page.goto(`${BASE_URL}/share/${testBudgetId}`);
      await page.waitForLoadState('networkidle');
      await expect(page.locator('[title="Editar cabecera"]')).not.toBeVisible();
      await expect(page.locator('[title="Editar cliente"]')).not.toBeVisible();
      await expect(page.locator('[title="Editar condiciones"]')).not.toBeVisible();
    });

    test('should have proper heading hierarchy (single h1)', async ({ page }) => {
      await page.goto(`${BASE_URL}/share/${testBudgetId}`);
      await page.waitForLoadState('networkidle');
      const h1Count = await page.locator('h1').count();
      expect(h1Count).toBe(1);
    });
  });
});

// ==============================================
// 5. RESPONSIVE DESIGN
// ==============================================
test.describe('Share Route — Responsive Design', () => {
  test('should render expired page correctly on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`${BASE_URL}/share/00000000-0000-0000-0000-000000000000?expires=2020-01-01`);
    await expect(page.locator('h1:has-text("Enlace expirado")')).toBeVisible({ timeout: 10000 });
  });

  test('should render expired page correctly on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto(`${BASE_URL}/share/00000000-0000-0000-0000-000000000000?expires=2020-01-01`);
    await expect(page.locator('h1:has-text("Enlace expirado")')).toBeVisible({ timeout: 10000 });
  });

  const testBudgetId = process.env.SHARE_TEST_BUDGET_ID;
  const describeOrSkip = testBudgetId ? test.describe : test.describe.skip;

  describeOrSkip('with existing budget on mobile', () => {
    test('should display budget content on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto(`${BASE_URL}/share/${testBudgetId}`);
      await expect(page.locator('h1')).toBeVisible({ timeout: 15000 });
      await expect(page.locator('span:text-is("TOTAL")')).toBeVisible({ timeout: 15000 });
    });
  });
});

// ==============================================
// 6. ACCESSIBILITY
// ==============================================
test.describe('Share Route — Accessibility', () => {
  test('expired page should have proper heading hierarchy', async ({ page }) => {
    await page.goto(`${BASE_URL}/share/00000000-0000-0000-0000-000000000000?expires=2020-01-01`);
    await expect(page.locator('h1:has-text("Enlace expirado")')).toBeVisible({ timeout: 10000 });
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBe(1);
  });

  test('share page body should be visible', async ({ page }) => {
    await page.goto(`${BASE_URL}/share/00000000-0000-0000-0000-000000000000?expires=2020-01-01`);
    await expect(page.locator('body')).toBeVisible();
  });
});
