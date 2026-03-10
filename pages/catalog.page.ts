import { Page, Locator, expect } from '@playwright/test';
import { Category, Product } from '../utils/test-data';

/**
 * Catalog / Product Listing Page Object
 *
 * Encapsulates the main product browsing experience:
 * - Product grid with 6 product cards
 * - Search bar with clear functionality
 * - Category dropdown filter
 * - Product count text
 * - Refresh button
 * - Individual product card interactions
 */
export class CatalogPage {
  readonly page: Page;

  // Search
  readonly searchInput: Locator;
  readonly searchClearButton: Locator;

  // Category Filter
  readonly categoryDropdown: Locator;

  // Product Grid
  readonly productCards: Locator;
  readonly productCountText: Locator;
  readonly refreshButton: Locator;

  // Image Zoom Modal
  readonly imageModal: Locator;
  readonly imageModalClose: Locator;
  readonly zoomInButton: Locator;
  readonly zoomOutButton: Locator;
  readonly zoomLevelText: Locator;

  constructor(page: Page) {
    this.page = page;

    // Search
    this.searchInput = page.getByPlaceholder(/search products/i);
    this.searchClearButton = page.locator('input[type="search"] ~ button, .search-clear, [aria-label="Clear search"]');

    // Category
    this.categoryDropdown = page.locator('[data-testid="category-dropdown-trigger"]');

    // Product grid
    this.productCards = page.locator('[class*="product"], [data-testid*="product"]').filter({ has: page.locator('button') });
    this.productCountText = page.getByText(/\d+ products? found/i);
    this.refreshButton = page.getByText(/refresh/i);

    // Image zoom modal
    this.imageModal = page.locator('[data-testid="image-viewer-overlay"]');
    this.imageModalClose = page.locator('[data-testid="close-image-viewer"]');
    this.zoomInButton = page.getByRole('button', { name: /zoom in/i });
    this.zoomOutButton = page.getByRole('button', { name: /zoom out/i });
    this.zoomLevelText = page.getByText(/zoom: \d/i);
  }

  /**
   * Wait for the product listing to fully load
   */
  async waitForProductsLoaded(): Promise<void> {
    await this.searchInput.waitFor({ state: 'visible', timeout: 10_000 });
    // Wait until products are actually loaded (count > 0, not the loading skeleton)
    await expect(this.productCountText).not.toContainText('0 product', { timeout: 10_000 });
  }

  // ═══════════════════════════════════════
  // SEARCH
  // ═══════════════════════════════════════

  /**
   * Type a search query into the search bar
   */
  async search(query: string): Promise<void> {
    await this.searchInput.fill(query);
    // Allow debounce to settle
    await this.page.waitForTimeout(500);
  }

  /**
   * Clear the search field
   */
  async clearSearch(): Promise<void> {
    await this.searchInput.clear();
    await this.page.waitForTimeout(300);
  }

  // ═══════════════════════════════════════
  // CATEGORY FILTER
  // ═══════════════════════════════════════

  /**
   * Select a category from the dropdown
   */
  async selectCategory(category: Category): Promise<void> {
    await this.categoryDropdown.click();
    await this.page.getByText(category, { exact: true }).click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Get the currently selected category text
   */
  async getSelectedCategory(): Promise<string> {
    return (await this.categoryDropdown.textContent()) || '';
  }

  // ═══════════════════════════════════════
  // PRODUCTS
  // ═══════════════════════════════════════

  /**
   * Get the displayed product count from the "X products found" text
   */
  async getProductCount(): Promise<number> {
    const text = await this.productCountText.textContent();
    const match = text?.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }

  /**
   * Get all visible product names
   */
  async getVisibleProductNames(): Promise<string[]> {
    // Look for product name elements within cards
    const names = await this.page.locator('text=Wireless Headphones, text=Smart Watch, text=Running Shoes, text=Yoga Mat, text=Coffee Maker, text=Desk Lamp').allTextContents();
    return names;
  }

  /**
   * Check if a specific product is visible
   */
  async isProductVisible(productName: string): Promise<boolean> {
    return this.page.getByText(productName, { exact: true }).isVisible();
  }

  /**
   * Get the "Add to Cart" button for a specific product
   */
  getAddToCartButton(productName: string): Locator {
    // Find the card containing the product name, then find its Add to Cart button
    const card = this.page.locator(`text="${productName}"`).locator('..');
    return card.locator('..').locator('button:has-text("Add to Cart")');
  }

  /**
   * Get the "Out of Stock" button for a specific product
   */
  getOutOfStockButton(productName: string): Locator {
    const card = this.page.locator(`text="${productName}"`).locator('..');
    return card.locator('..').locator('button:has-text("Out of Stock")');
  }

  /**
   * Click Add to Cart for a specific product
   */
  async addToCart(productName: string): Promise<void> {
    await this.page.locator('[data-testid^="product-card"]')
      .filter({ has: this.page.getByText(productName, { exact: true }) })
      .getByRole('button', { name: /add to cart/i })
      .click();
  }

  /**
   * Click the heart/favorite icon on a product
   */
  async toggleFavorite(productName: string): Promise<void> {
    const card = this.page.locator(`text="${productName}"`).locator('..').locator('..');
    await card.locator('[aria-label*="favorite"], [aria-label*="heart"], button:has(svg), .heart-icon, [class*="heart"], [class*="favorite"]').first().click();
  }

  /**
   * Click on a product image to open the zoom modal
   */
  async openImageZoom(productName: string): Promise<void> {
    await this.page.locator('[data-testid^="product-card"]')
      .filter({ has: this.page.getByText(productName, { exact: true }) })
      .locator('[data-testid^="product-image"]')
      .click();
  }

  // ═══════════════════════════════════════
  // IMAGE ZOOM MODAL
  // ═══════════════════════════════════════

  /**
   * Assert the image zoom modal is visible
   */
  async assertImageModalVisible(): Promise<void> {
    await expect(this.page.getByText(/pinch to zoom/i).or(this.page.getByText(/zoom/i)).first()).toBeVisible();
  }

  /**
   * Close the image zoom modal
   */
  async closeImageModal(): Promise<void> {
    const closeBtn = this.page.locator('[data-testid="close-image-viewer"]');
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
    } else {
      await this.page.keyboard.press('Escape');
    }
  }

  // ═══════════════════════════════════════
  // ASSERTIONS
  // ═══════════════════════════════════════

  /**
   * Assert the correct number of products are displayed
   */
  async assertProductCount(expected: number): Promise<void> {
    await expect(this.productCountText).toContainText(`${expected} product`);
  }

  /**
   * Assert a product card shows the correct price
   */
  async assertProductPrice(productName: string, expectedPrice: string): Promise<void> {
    const card = this.page.locator(`text="${productName}"`).locator('..').locator('..');
    await expect(card.getByText(expectedPrice).first()).toBeVisible();
  }

  /**
   * Assert the toast notification appears with expected text
   */
  async assertToastVisible(expectedText: string): Promise<void> {
    await expect(
      this.page.locator('[data-testid="toast-notification"]')
    ).toContainText(expectedText, { timeout: 5_000 });
  }
}
