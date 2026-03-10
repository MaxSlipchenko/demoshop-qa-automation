import { authenticatedTest as test, expect } from '../fixtures/test-fixtures';
import { PRODUCTS } from '../utils/test-data';

/**
 * Shopping Cart Test Suite
 *
 * THE MOST CRITICAL TEST AREA — covers the core purchase flow.
 *
 * Covers:
 * - Add items to cart
 * - Cart badge and total updates
 * - Cart panel open/close
 * - Remove items
 * - Empty cart state
 * - Out of stock prevention
 * - Price calculation (KNOWN BUG: string concatenation)
 * - Multiple items
 * - Checkout CTA
 *
 * KNOWN BUGS:
 * - BG-001: Cart total uses string concatenation instead of numeric addition
 *           ($99.99 + $29.99 shows as "$99.9929.99" not "$129.98")
 * - BG-002: Favorites toast shows "(0 total)" but header shows 1
 */

test.describe('Shopping Cart', () => {
  // ═══════════════════════════════════════
  // ADD TO CART
  // ═══════════════════════════════════════

  test('CT-001: Add single item to cart @smoke @regression', async ({
    catalogPage,
    page,
  }) => {
    await catalogPage.addToCart('Wireless Headphones');

    // Toast notification should appear
    await catalogPage.assertToastVisible('Wireless Headphones added to cart');

    // Header should show total and badge
    await expect(page.getByText(/\$99\.99/).first()).toBeVisible();
  });

  test('CT-002: Cart badge updates when adding items @regression', async ({
    catalogPage,
    header,
    page,
  }) => {
    await catalogPage.addToCart('Wireless Headphones');
    await page.waitForTimeout(500);

    // Badge should show 1
    await header.assertBadgeCount(1);

    await catalogPage.addToCart('Yoga Mat');
    await page.waitForTimeout(500);

    // Badge should show 2
    await header.assertBadgeCount(2);
  });

  test('CT-003: Adding toast notification displays and auto-dismisses @regression', async ({
    catalogPage,
    page,
  }) => {
    await catalogPage.addToCart('Running Shoes');

    // Toast appears
    const toast = page.getByText(/Running Shoes added to cart/i);
    await expect(toast.first()).toBeVisible();

    // Toast should auto-dismiss (wait up to 6 seconds)
    await expect(toast.first()).toBeHidden({ timeout: 6_000 });
  });

  // ═══════════════════════════════════════
  // CART PANEL
  // ═══════════════════════════════════════

  test('CT-004: Empty cart shows "Your cart is empty" @regression', async ({
    header,
    cartPanel,
    page,
  }) => {
    await header.openCart();
    await page.waitForTimeout(500);

    await expect(page.getByText(/your cart is empty/i)).toBeVisible();
  });

  test('CT-005: Cart panel shows added items @smoke @regression', async ({
    catalogPage,
    header,
    page,
  }) => {
    // Add items
    await catalogPage.addToCart('Wireless Headphones');
    await page.waitForTimeout(500);
    await catalogPage.addToCart('Yoga Mat');
    await page.waitForTimeout(500);

    // Open cart
    await header.openCart();
    await page.waitForTimeout(500);

    // Both items should be listed
    await expect(page.getByText('Wireless Headphones').last()).toBeVisible();
    await expect(page.getByText('Yoga Mat').last()).toBeVisible();
  });

  test('CT-006: Cart panel shows Proceed to Checkout button @regression', async ({
    catalogPage,
    header,
    page,
  }) => {
    await catalogPage.addToCart('Wireless Headphones');
    await page.waitForTimeout(500);

    await header.openCart();
    await page.waitForTimeout(500);

    await expect(
      page.getByRole('button', { name: /proceed to checkout/i })
    ).toBeVisible();
  });

  test('CT-007: Cart panel can be closed @regression', async ({
    catalogPage,
    header,
    cartPanel,
    page,
  }) => {
    await catalogPage.addToCart('Wireless Headphones');
    await page.waitForTimeout(500);

    await header.openCart();
    await page.waitForTimeout(500);
    await expect(page.getByText('Shopping Cart')).toBeVisible();

    await cartPanel.close();
    await page.waitForTimeout(500);

    // Product listing should be fully visible again
    await expect(catalogPage.searchInput).toBeVisible();
  });

  // ═══════════════════════════════════════
  // REMOVE FROM CART
  // ═══════════════════════════════════════

  test('CT-008: Remove item from cart @regression', async ({
    catalogPage,
    header,
    cartPanel,
    page,
  }) => {
    // Add two items
    await catalogPage.addToCart('Wireless Headphones');
    await page.waitForTimeout(500);
    await catalogPage.addToCart('Yoga Mat');
    await page.waitForTimeout(500);

    // Open cart and remove one
    await header.openCart();
    await page.waitForTimeout(500);

    await cartPanel.removeItem('Wireless Headphones');
    await page.waitForTimeout(500);

    // Only Yoga Mat should remain
    await expect(page.getByText('Yoga Mat').last()).toBeVisible();
  });

  test('CT-009: Remove all items shows empty cart @regression', async ({
    catalogPage,
    header,
    cartPanel,
    page,
  }) => {
    await catalogPage.addToCart('Yoga Mat');
    await page.waitForTimeout(500);

    await header.openCart();
    await page.waitForTimeout(500);

    await cartPanel.removeItem('Yoga Mat');
    await page.waitForTimeout(500);

    await expect(page.getByText(/your cart is empty/i)).toBeVisible();
  });

  // ═══════════════════════════════════════
  // OUT OF STOCK PREVENTION
  // ═══════════════════════════════════════

  test('CT-010: Cannot add out-of-stock item to cart @smoke @regression', async ({
    catalogPage,
    page,
  }) => {
    // Smart Watch is out of stock — its button should say "Out of Stock"
    const outOfStockButton = page
      .getByText('Smart Watch')
      .locator('..')
      .locator('..')
      .getByRole('button', { name: /out of stock/i });

    await expect(outOfStockButton.first()).toBeVisible();

    // Try clicking it
    await outOfStockButton.first().click({ force: true });
    await page.waitForTimeout(500);

    // No toast about adding to cart should appear
    await expect(
      page.getByText(/Smart Watch added to cart/i)
    ).not.toBeVisible();
  });

  // ═══════════════════════════════════════
  // PRICE CALCULATION
  // ═══════════════════════════════════════

  test('CT-011: Cart total displays correct sum for single item @regression', async ({
    catalogPage,
    header,
    page,
  }) => {
    await catalogPage.addToCart('Wireless Headphones');
    await page.waitForTimeout(500);

    // Single item — total should be $99.99
    await header.assertCartTotal('$99.99');
  });

  /**
   * KNOWN BUG: BG-001
   *
   * This test documents the string concatenation bug in cart total calculation.
   * When multiple items are added, the total shows concatenated strings
   * instead of a numeric sum.
   *
   * Actual:   "Total: $99.9929.99" (string concat)
   * Expected: "Total: $129.98"     (numeric sum)
   *
   * Root cause: Price values stored/treated as strings, using + operator
   * for concatenation instead of parseFloat() + addition.
   *
   * This test is marked with a descriptive name and will FAIL until the
   * bug is fixed — which is the correct behavior for a known bug test.
   */
  test('CT-012: [BUG BG-001] Cart total should be numeric sum, not string concatenation @regression @known-bug', async ({
    catalogPage,
    header,
    page,
  }) => {
    await catalogPage.addToCart('Wireless Headphones'); // $99.99
    await page.waitForTimeout(500);
    await catalogPage.addToCart('Yoga Mat'); // $29.99
    await page.waitForTimeout(500);

    // Expected correct total: $99.99 + $29.99 = $129.98
    const headerText = await header.getCartTotalText();

    // This assertion documents the bug:
    // If the bug exists, headerText will contain "99.9929.99" (concatenated)
    // If fixed, it should contain "129.98" (summed)
    const hasConcatenationBug = headerText.includes('99.9929.99');

    if (hasConcatenationBug) {
      console.warn(
        '⚠️  BUG BG-001 CONFIRMED: Cart total is string-concatenated.',
        `\n   Actual: "${headerText}"`,
        '\n   Expected: Total containing "$129.98"'
      );
      // Fail the test to flag the bug
      expect(hasConcatenationBug, 'BUG BG-001: Cart total uses string concatenation instead of numeric addition').toBe(false);
    } else {
      // Bug is fixed — validate correct total
      expect(headerText).toContain('129.98');
    }
  });

  test('CT-013: Cart total for three items @regression @known-bug', async ({
    catalogPage,
    header,
    page,
  }) => {
    test.fail(true, 'Known bug BG-001: cart total uses string concatenation instead of numeric addition');
    await catalogPage.addToCart('Wireless Headphones'); // $99.99
    await page.waitForTimeout(500);
    await catalogPage.addToCart('Yoga Mat'); // $29.99
    await page.waitForTimeout(500);
    await catalogPage.addToCart('Desk Lamp'); // $39.99
    await page.waitForTimeout(500);

    // Expected: $99.99 + $29.99 + $39.99 = $169.97
    const headerText = await header.getCartTotalText();

    const hasBug = headerText.includes('99.9929.9939.99');
    if (hasBug) {
      console.warn(
        '⚠️  BUG BG-001 CONFIRMED (3 items): Cart total is string-concatenated.',
        `\n   Actual: "${headerText}"`,
        '\n   Expected: "$169.97"'
      );
    }
    // This will fail if the bug is present — documenting expected behavior
    expect(headerText).toContain('169.97');
  });

  // ═══════════════════════════════════════
  // CART PERSISTENCE
  // ═══════════════════════════════════════

  test('CT-014: Cart persists when filtering by category @regression', async ({
    catalogPage,
    header,
    page,
  }) => {
    await catalogPage.addToCart('Wireless Headphones');
    await page.waitForTimeout(500);

    // Change category filter
    await catalogPage.selectCategory('Sports');
    await page.waitForTimeout(500);

    // Cart badge should still show 1
    await header.assertBadgeCount(1);
  });

  test('CT-015: Cart persists when searching @regression', async ({
    catalogPage,
    header,
    page,
  }) => {
    await catalogPage.addToCart('Wireless Headphones');
    await page.waitForTimeout(500);

    // Perform a search
    await catalogPage.search('Yoga');
    await page.waitForTimeout(500);

    // Cart badge should still show 1
    await header.assertBadgeCount(1);
  });

  // ═══════════════════════════════════════
  // ADD SAME ITEM MULTIPLE TIMES
  // ═══════════════════════════════════════

  test('CT-016: Add same item multiple times @regression', async ({
    catalogPage,
    header,
    page,
  }) => {
    await catalogPage.addToCart('Yoga Mat');
    await page.waitForTimeout(500);
    await catalogPage.addToCart('Yoga Mat');
    await page.waitForTimeout(500);

    // Badge should reflect 2 additions (either quantity or 2 entries)
    await header.assertBadgeCount(2);
  });
});
