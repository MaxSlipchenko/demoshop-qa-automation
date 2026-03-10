import { Page, Locator, expect } from '@playwright/test';

/**
 * Shopping Cart Panel Page Object
 *
 * Encapsulates the slide-up cart panel:
 * - Cart item list with names, prices, and remove buttons
 * - Cart total
 * - Proceed to Checkout button
 * - Empty cart state
 * - Close button
 */
export class CartPanel {
  readonly page: Page;

  // Panel container
  readonly panel: Locator;
  readonly closeButton: Locator;

  // Cart content
  readonly cartItems: Locator;
  readonly emptyCartMessage: Locator;
  readonly totalAmount: Locator;
  readonly checkoutButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // The cart panel slides up from bottom
    this.panel = page.getByText('Shopping Cart').locator('..');
    this.closeButton = page.locator('text="Shopping Cart"').locator('..').locator('button:has-text("×"), [aria-label="Close"]');

    // Items in cart
    this.cartItems = page.locator('.cart-item, [class*="cart-item"], [data-testid*="cart-item"]');
    this.emptyCartMessage = page.getByText(/your cart is empty/i);
    this.totalAmount = page.getByText(/total/i).locator('..').locator('text=/\\$[\\d.]+/');
    this.checkoutButton = page.getByRole('button', { name: /proceed to checkout/i });
  }

  /**
   * Check if the cart panel is open/visible
   */
  async isOpen(): Promise<boolean> {
    return this.page.getByText('Shopping Cart').isVisible();
  }

  /**
   * Wait for the cart panel to be visible
   */
  async waitForOpen(): Promise<void> {
    await this.page.getByText('Shopping Cart').waitFor({ state: 'visible' });
  }

  /**
   * Close the cart panel
   */
  async close(): Promise<void> {
    await this.page.locator('[data-testid="close-bottom-sheet"]').click();
  }

  /**
   * Get the number of items in the cart
   */
  async getItemCount(): Promise<number> {
    // Count cart items by looking for price entries in the cart panel
    const items = this.page.locator('text=/\\$\\d+\\.\\d{2}/').filter({
      has: this.page.locator('xpath=ancestor::*[contains(., "Shopping Cart")]'),
    });
    return items.count();
  }

  /**
   * Check if a specific product is in the cart
   */
  async hasProduct(productName: string): Promise<boolean> {
    const cartSection = this.page.getByText('Shopping Cart').locator('..').locator('..');
    return cartSection.getByText(productName).isVisible();
  }

  /**
   * Remove an item from the cart by product name
   */
  async removeItem(productName: string): Promise<void> {
    const cartItem = this.page.locator('[data-testid^="cart-item"]')
      .filter({ has: this.page.getByText(productName) });
    await cartItem.locator('[data-testid^="remove-cart-item"]').click();
  }

  /**
   * Get the displayed cart total text
   */
  async getTotalText(): Promise<string> {
    const totalSection = this.page.getByText('Total:').locator('..');
    return (await totalSection.textContent()) || '';
  }

  /**
   * Click Proceed to Checkout
   */
  async proceedToCheckout(): Promise<void> {
    await this.checkoutButton.click();
  }

  // ═══════════════════════════════════════
  // ASSERTIONS
  // ═══════════════════════════════════════

  /**
   * Assert the cart is empty
   */
  async assertEmpty(): Promise<void> {
    await expect(this.emptyCartMessage).toBeVisible();
  }

  /**
   * Assert the cart contains a specific product
   */
  async assertContainsProduct(productName: string): Promise<void> {
    const cartArea = this.page.getByText('Shopping Cart').locator('..').locator('..');
    await expect(cartArea.getByText(productName)).toBeVisible();
  }

  /**
   * Assert the cart total displays a specific amount
   */
  async assertTotal(expectedTotal: string): Promise<void> {
    await expect(this.page.getByText(expectedTotal)).toBeVisible();
  }

  /**
   * Assert checkout button is visible
   */
  async assertCheckoutButtonVisible(): Promise<void> {
    await expect(this.checkoutButton).toBeVisible();
  }
}
