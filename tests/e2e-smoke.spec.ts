import { test, expect } from '../fixtures/test-fixtures';
import { TEST_CREDENTIALS, PRODUCTS } from '../utils/test-data';

/**
 * End-to-End Smoke Test
 *
 * Full critical user journey in a single test:
 * Login → Browse → Search → Filter → Add to Cart → View Cart → Remove Item
 *
 * This is the most important test in the suite. If this passes, the core
 * business flow is working. Run this first, run it on every commit.
 */

test.describe('E2E Critical Journey', () => {
  test('E2E-001: Complete user journey — login through cart @smoke', async ({
    loginPage,
    catalogPage,
    header,
    page,
  }) => {
    // ── Step 1: Login ──
    await loginPage.goto();
    await loginPage.assertPageVisible();
    await loginPage.login(
      TEST_CREDENTIALS.valid.email,
      TEST_CREDENTIALS.valid.password
    );

    // ── Step 2: Verify catalog loaded ──
    await catalogPage.waitForProductsLoaded();
    await catalogPage.assertProductCount(6);
    await header.assertTitleVisible();

    // ── Step 3: Search for a product ──
    await catalogPage.search('Wireless Headphones');
    await catalogPage.assertProductCount(1);
    await expect(page.getByText('Wireless Headphones').first()).toBeVisible();

    // ── Step 4: Clear search, verify all products return ──
    await catalogPage.clearSearch();
    await catalogPage.assertProductCount(6);

    // ── Step 5: Filter by category ──
    await catalogPage.selectCategory('Sports');
    await catalogPage.assertProductCount(2);
    await expect(page.getByText('Running Shoes').first()).toBeVisible();
    await expect(page.getByText('Yoga Mat').first()).toBeVisible();

    // ── Step 6: Reset to All ──
    await catalogPage.selectCategory('All');
    await catalogPage.assertProductCount(6);

    // ── Step 7: Add item to cart ──
    await catalogPage.addToCart('Wireless Headphones');
    await page.waitForTimeout(500);
    await catalogPage.assertToastVisible('Wireless Headphones added to cart');

    // ── Step 8: Verify header updates ──
    await header.assertBadgeCount(1);

    // ── Step 9: Add another item ──
    await catalogPage.addToCart('Yoga Mat');
    await page.waitForTimeout(500);
    await header.assertBadgeCount(2);

    // ── Step 10: Open cart and verify contents ──
    await header.openCart();
    await page.waitForTimeout(500);

    await expect(page.getByText('Shopping Cart')).toBeVisible();
    await expect(page.getByText('Wireless Headphones').last()).toBeVisible();
    await expect(page.getByText('Yoga Mat').last()).toBeVisible();
    await expect(
      page.getByRole('button', { name: /proceed to checkout/i })
    ).toBeVisible();

    // ── Step 11: Verify out-of-stock item is not purchasable ──
    // (Close cart first, check Smart Watch)
    // Cart panel should have a close mechanism — press Escape as fallback
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    const outOfStockBtn = page
      .getByText('Smart Watch')
      .locator('..')
      .getByRole('button')
      .last();

    const buttonText = await outOfStockBtn.textContent();
    expect(buttonText?.toLowerCase()).toContain('out of stock');
  });

  test('E2E-002: Login failure does not grant access @smoke', async ({
    loginPage,
    page,
  }) => {
    await loginPage.goto();
    await loginPage.login(
      TEST_CREDENTIALS.invalid.email,
      TEST_CREDENTIALS.invalid.password
    );

    // Should NOT see the product catalog
    await page.waitForTimeout(1000);
    await expect(loginPage.loginButton).toBeVisible();
  });
});
