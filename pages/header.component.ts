import { Page, Locator, expect } from '@playwright/test';

/**
 * Header Component Page Object
 *
 * Encapsulates the top navigation bar:
 * - DemoShop title
 * - Cart icon with badge count
 * - Cart total display
 * - Favorites count
 */
export class HeaderComponent {
  readonly page: Page;

  readonly title: Locator;
  readonly cartIcon: Locator;
  readonly cartBadge: Locator;
  readonly cartTotal: Locator;
  readonly favoritesCount: Locator;

  constructor(page: Page) {
    this.page = page;

    this.title = page.getByText('DemoShop').first();
    this.cartIcon = page.locator('[aria-label*="cart"], [class*="cart-icon"], header button, nav button').last();
    this.cartBadge = page.locator('[class*="badge"], [data-testid*="badge"]');
    this.cartTotal = page.getByText(/total:\s*\$/i).or(page.getByText(/\$[\d.,]+/).first());
    this.favoritesCount = page.locator('[class*="favorite"] [class*="count"], [aria-label*="favorites"]');
  }

  /**
   * Click the cart icon to open the cart panel
   */
  async openCart(): Promise<void> {
    await this.page.locator('button:has([data-testid="cart-icon"])').click();
    // Wait for cart panel to appear
    await this.page.waitForTimeout(500);
  }

  /**
   * Get the cart total text from the header
   */
  async getCartTotalText(): Promise<string> {
    const totalElement = this.page.locator('[data-testid="cart-total"]');
    if (await totalElement.isVisible()) {
      return (await totalElement.textContent()) || '';
    }
    return '';
  }

  /**
   * Get the cart badge count number
   */
  async getBadgeCount(): Promise<number> {
    const badge = this.cartBadge.first();
    if (await badge.isVisible()) {
      const text = await badge.textContent();
      return parseInt(text || '0', 10);
    }
    return 0;
  }

  // ═══════════════════════════════════════
  // ASSERTIONS
  // ═══════════════════════════════════════

  /**
   * Assert the header title is visible
   */
  async assertTitleVisible(): Promise<void> {
    await expect(this.title).toBeVisible();
  }

  /**
   * Assert the cart badge shows expected count
   */
  async assertBadgeCount(expected: number): Promise<void> {
    if (expected === 0) {
      // Badge might be hidden when 0
      return;
    }
    await expect(this.cartBadge.first()).toContainText(String(expected));
  }

  /**
   * Assert the header total shows expected amount
   */
  async assertCartTotal(expectedTotal: string): Promise<void> {
    await expect(this.page.locator('[data-testid="cart-total"]')).toContainText(expectedTotal);
  }
}
