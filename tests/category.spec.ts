import { authenticatedTest as test, expect } from '../fixtures/test-fixtures';
import { CATEGORIES, EXPECTED_COUNTS, PRODUCTS_BY_CATEGORY, Category } from '../utils/test-data';

/**
 * Category Filtering Test Suite
 *
 * Covers:
 * - Default category state (All)
 * - Each category filter: Electronics, Sports, Home
 * - Product count accuracy per category
 * - Switching between categories
 * - Category persistence after actions
 */

test.describe('Category Filtering', () => {
  // ═══════════════════════════════════════
  // DEFAULT STATE
  // ═══════════════════════════════════════

  test('CF-001: Default category is "All" with 6 products @smoke @regression', async ({
    catalogPage,
  }) => {
    await catalogPage.assertProductCount(6);
    // Category dropdown should indicate "All"
    const categoryText = await catalogPage.getSelectedCategory();
    expect(categoryText.toLowerCase()).toContain('all');
  });

  // ═══════════════════════════════════════
  // INDIVIDUAL CATEGORIES
  // ═══════════════════════════════════════

  test('CF-002: Electronics filter shows 2 products @regression', async ({
    catalogPage,
    page,
  }) => {
    await catalogPage.selectCategory('Electronics');
    await catalogPage.assertProductCount(2);

    // Verify correct products
    for (const product of PRODUCTS_BY_CATEGORY.Electronics) {
      await expect(page.getByText(product.name).first()).toBeVisible();
    }
  });

  test('CF-003: Sports filter shows 2 products @regression', async ({
    catalogPage,
    page,
  }) => {
    await catalogPage.selectCategory('Sports');
    await catalogPage.assertProductCount(2);

    for (const product of PRODUCTS_BY_CATEGORY.Sports) {
      await expect(page.getByText(product.name).first()).toBeVisible();
    }
  });

  test('CF-004: Home filter shows 2 products @regression', async ({
    catalogPage,
    page,
  }) => {
    await catalogPage.selectCategory('Home');
    await catalogPage.assertProductCount(2);

    for (const product of PRODUCTS_BY_CATEGORY.Home) {
      await expect(page.getByText(product.name).first()).toBeVisible();
    }
  });

  // ═══════════════════════════════════════
  // SWITCHING CATEGORIES
  // ═══════════════════════════════════════

  test('CF-005: Switching from Electronics to All restores all products @regression', async ({
    catalogPage,
  }) => {
    await catalogPage.selectCategory('Electronics');
    await catalogPage.assertProductCount(2);

    await catalogPage.selectCategory('All');
    await catalogPage.assertProductCount(6);
  });

  test('CF-006: Switching between all categories maintains correct counts @regression', async ({
    catalogPage,
  }) => {
    // Cycle through every category and verify counts
    const categoryChecks: [Category, number][] = [
      ['Electronics', 2],
      ['Sports', 2],
      ['Home', 2],
      ['All', 6],
    ];

    for (const [category, expectedCount] of categoryChecks) {
      await catalogPage.selectCategory(category);
      await catalogPage.assertProductCount(expectedCount);
    }
  });

  // ═══════════════════════════════════════
  // CATEGORY + OTHER FEATURES
  // ═══════════════════════════════════════

  test('CF-007: Category filter persists after adding to cart @regression', async ({
    catalogPage,
    page,
  }) => {
    // Select Sports category
    await catalogPage.selectCategory('Sports');
    await catalogPage.assertProductCount(2);

    // Add an item to cart
    await catalogPage.addToCart('Running Shoes');
    await page.waitForTimeout(1000);

    // Category should still be Sports with 2 products
    await catalogPage.assertProductCount(2);
  });

  test('CF-008: Products in filtered view show correct data @regression', async ({
    catalogPage,
    page,
  }) => {
    await catalogPage.selectCategory('Electronics');

    // Verify Wireless Headphones data
    await expect(page.getByText('$99.99').first()).toBeVisible();
    await expect(page.getByText('4.5').first()).toBeVisible();

    // Verify Smart Watch data
    await expect(page.getByText('$249.99').first()).toBeVisible();
    await expect(page.getByText('Out of stock').first()).toBeVisible();
  });
});
