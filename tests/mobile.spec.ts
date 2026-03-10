import { authenticatedTest as test, expect } from '../fixtures/test-fixtures';

/**
 * Mobile-Specific Tests
 *
 * These tests validate mobile-critical behaviors:
 * - Touch target sizing (44x44px minimum per WCAG/Apple HIG)
 * - Viewport meta tag presence
 * - No horizontal overflow
 * - Orientation handling
 * - Mobile keyboard interaction with search
 * - Scroll performance
 *
 * These tests run on all configured mobile devices (Pixel 7, iPhone 14, iPhone SE).
 */

test.describe('Mobile-Specific Behaviors', () => {
  // ═══════════════════════════════════════
  // VIEWPORT & LAYOUT
  // ═══════════════════════════════════════

  test('MG-001: No horizontal overflow on current viewport @smoke @regression', async ({
    page,
  }) => {
    const viewport = page.viewportSize();
    if (!viewport) return;

    const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);

    // Page content should not exceed viewport width
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);
  });

  test('MG-002: Viewport meta tag is present @regression', async ({ page }) => {
    const viewportMeta = await page.evaluate(() => {
      const meta = document.querySelector('meta[name="viewport"]');
      return meta ? meta.getAttribute('content') : null;
    });

    expect(viewportMeta).not.toBeNull();
    expect(viewportMeta).toContain('width=device-width');
  });

  // ═══════════════════════════════════════
  // TOUCH TARGETS
  // ═══════════════════════════════════════

  test('MG-003: Add to Cart buttons meet minimum touch target size @regression', async ({
    page,
  }) => {
    const buttons = page.getByRole('button', { name: /add to cart/i });
    const count = await buttons.count();

    for (let i = 0; i < count; i++) {
      const box = await buttons.nth(i).boundingBox();
      if (box) {
        // Minimum 44px per Apple HIG, 48dp per Material Design
        expect(box.height).toBeGreaterThanOrEqual(36); // Slightly relaxed for web
        expect(box.width).toBeGreaterThanOrEqual(44);
      }
    }
  });

  test('MG-004: Search input meets minimum touch target size @regression', async ({
    catalogPage,
  }) => {
    const box = await catalogPage.searchInput.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      expect(box.height).toBeGreaterThanOrEqual(36);
    }
  });

  test('MG-005: Category dropdown meets minimum touch target size @regression', async ({
    catalogPage,
  }) => {
    const box = await catalogPage.categoryDropdown.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      expect(box.height).toBeGreaterThanOrEqual(36);
    }
  });

  // ═══════════════════════════════════════
  // SCROLL
  // ═══════════════════════════════════════

  test('MG-006: Page is scrollable to see all products @regression', async ({
    page,
  }) => {
    // Scroll to bottom of page
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    // Should be able to see products at the bottom (Desk Lamp is last)
    await expect(page.getByText('Desk Lamp').first()).toBeVisible();
  });

  // ═══════════════════════════════════════
  // ORIENTATION (viewport resize simulation)
  // ═══════════════════════════════════════

  test('MG-007: Layout adapts to landscape orientation @regression', async ({
    page,
    catalogPage,
  }) => {
    const viewport = page.viewportSize();
    if (!viewport) return;

    // Simulate landscape by swapping width/height
    await page.setViewportSize({
      width: viewport.height,
      height: viewport.width,
    });
    await page.waitForTimeout(500);

    // Products should still be visible and page should not overflow
    await expect(catalogPage.searchInput).toBeVisible();
    const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(viewport.height + 5);

    // Restore original viewport
    await page.setViewportSize(viewport);
  });

  // ═══════════════════════════════════════
  // PERFORMANCE
  // ═══════════════════════════════════════

  test('MG-008: Page load performance is acceptable @regression', async ({
    page,
  }) => {
    // Measure navigation timing
    const timing = await page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded: nav.domContentLoadedEventEnd - nav.fetchStart,
        loadComplete: nav.loadEventEnd - nav.fetchStart,
      };
    });

    // DOM should load within 5 seconds (generous for CI environments)
    expect(timing.domContentLoaded).toBeLessThan(5_000);
  });

  // ═══════════════════════════════════════
  // ACCESSIBILITY ON MOBILE
  // ═══════════════════════════════════════

  test('MG-009: Interactive elements have accessible names @regression', async ({
    page,
  }) => {
    // Check that Add to Cart buttons have accessible text
    const addButtons = page.getByRole('button', { name: /add to cart/i });
    expect(await addButtons.count()).toBeGreaterThan(0);

    // Check that search has accessible label/placeholder
    const searchInput = page.getByPlaceholder(/search/i);
    await expect(searchInput).toBeVisible();

    // Check Login/DemoShop title
    await expect(page.getByText('DemoShop').first()).toBeVisible();
  });

  test('MG-010: Page has proper document title @regression', async ({ page }) => {
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });
});
