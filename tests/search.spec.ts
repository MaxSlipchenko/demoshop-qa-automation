import { authenticatedTest as test, expect } from '../fixtures/test-fixtures';
import { PRODUCTS, XSS_PAYLOADS } from '../utils/test-data';

/**
 * Search Functionality Test Suite
 *
 * Covers:
 * - Exact name search
 * - Partial/substring search
 * - Case insensitivity
 * - No results handling
 * - Search clear
 * - Search combined with category filter
 * - Security (XSS in search)
 * - Special characters and edge cases
 */

test.describe('Search Functionality', () => {
  // ═══════════════════════════════════════
  // CORE SEARCH
  // ═══════════════════════════════════════

  test('SR-001: Search by exact product name @smoke @regression', async ({
    catalogPage,
  }) => {
    await catalogPage.search('Wireless Headphones');
    await catalogPage.assertProductCount(1);
    await expect(
      catalogPage.page.getByText('Wireless Headphones', { exact: true }).first()
    ).toBeVisible();
  });

  test('SR-002: Search by partial name (substring) @regression', async ({
    catalogPage,
  }) => {
    await catalogPage.search('Wire');

    // Should find Wireless Headphones
    await expect(
      catalogPage.page.getByText('Wireless Headphones').first()
    ).toBeVisible();
  });

  test('SR-003: Search is case insensitive @regression', async ({
    catalogPage,
  }) => {
    await catalogPage.search('wireless headphones');

    await expect(
      catalogPage.page.getByText('Wireless Headphones').first()
    ).toBeVisible();
  });

  test('SR-004: Search with no matching results @regression', async ({
    catalogPage,
  }) => {
    await catalogPage.search('NonExistentProduct12345');
    await catalogPage.assertProductCount(0);
  });

  // ═══════════════════════════════════════
  // SEARCH CLEAR
  // ═══════════════════════════════════════

  test('SR-005: Clearing search restores all products @regression', async ({
    catalogPage,
  }) => {
    // Search to filter
    await catalogPage.search('Yoga');
    await catalogPage.assertProductCount(1);

    // Clear search
    await catalogPage.clearSearch();
    await catalogPage.assertProductCount(6);
  });

  test('SR-006: Empty search field shows all products @regression', async ({
    catalogPage,
  }) => {
    // Type something then clear to empty
    await catalogPage.search('test');
    await catalogPage.search('');
    await catalogPage.assertProductCount(6);
  });

  // ═══════════════════════════════════════
  // SEARCH + CATEGORY
  // ═══════════════════════════════════════

  test('SR-007: Search combined with category filter @regression', async ({
    catalogPage,
  }) => {
    // Filter to Electronics first
    await catalogPage.selectCategory('Electronics');
    await catalogPage.assertProductCount(2);

    // Then search for "Watch"
    await catalogPage.search('Watch');

    // Should show only Smart Watch (Electronics + name match)
    await expect(
      catalogPage.page.getByText('Smart Watch').first()
    ).toBeVisible();
  });

  test('SR-008: Search across filtered category returns zero @regression', async ({
    catalogPage,
  }) => {
    // Filter to Sports
    await catalogPage.selectCategory('Sports');

    // Search for a product not in Sports
    await catalogPage.search('Headphones');

    // Should show 0 products
    await catalogPage.assertProductCount(0);
  });

  // ═══════════════════════════════════════
  // EDGE CASES
  // ═══════════════════════════════════════

  test('SR-009: Search with special characters handles gracefully @regression', async ({
    catalogPage,
    page,
  }) => {
    await catalogPage.search('!@#$%^&*()');
    await catalogPage.assertProductCount(0);

    // No error or crash
    await expect(catalogPage.searchInput).toBeVisible();
  });

  test('SR-010: Search placeholder text is displayed @regression', async ({
    catalogPage,
  }) => {
    await expect(catalogPage.searchInput).toHaveAttribute(
      'placeholder',
      /search products/i
    );
  });

  // ═══════════════════════════════════════
  // SECURITY
  // ═══════════════════════════════════════

  test('SR-011: XSS payload in search is sanitized @regression', async ({
    catalogPage,
    page,
  }) => {
    let alertFired = false;
    page.on('dialog', async (dialog) => {
      alertFired = true;
      await dialog.dismiss();
    });

    for (const payload of XSS_PAYLOADS.slice(0, 2)) {
      await catalogPage.search(payload);
      await page.waitForTimeout(300);
    }

    expect(alertFired).toBe(false);
  });

  // ═══════════════════════════════════════
  // PERFORMANCE
  // ═══════════════════════════════════════

  test('SR-012: Search results update without significant delay @regression', async ({
    catalogPage,
    page,
  }) => {
    const startTime = Date.now();
    await catalogPage.search('Yoga');
    await catalogPage.assertProductCount(1);
    const elapsed = Date.now() - startTime;

    // Search + render should complete within 2 seconds (generous for slow CI)
    expect(elapsed).toBeLessThan(2000);
  });
});
