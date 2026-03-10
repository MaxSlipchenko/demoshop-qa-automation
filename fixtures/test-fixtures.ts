import { test as base, expect, Page } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { CatalogPage } from '../pages/catalog.page';
import { CartPanel } from '../pages/cart.panel';
import { HeaderComponent } from '../pages/header.component';
import { TEST_CREDENTIALS } from '../utils/test-data';

/**
 * Custom Test Fixtures
 *
 * Extends Playwright's base test with page objects and common setup.
 * Using fixtures keeps tests clean and ensures consistent initialization.
 *
 * Two fixture levels:
 * - `test` (base): Provides page objects without auto-login
 * - `authenticatedTest`: Auto-logs in before each test
 */

// ── Page Object Fixtures ──
type PageObjects = {
  loginPage: LoginPage;
  catalogPage: CatalogPage;
  cartPanel: CartPanel;
  header: HeaderComponent;
};

export const test = base.extend<PageObjects>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  catalogPage: async ({ page }, use) => {
    await use(new CatalogPage(page));
  },
  cartPanel: async ({ page }, use) => {
    await use(new CartPanel(page));
  },
  header: async ({ page }, use) => {
    await use(new HeaderComponent(page));
  },
});

// ── Authenticated Test Fixture ──
// Automatically logs in before each test that needs it
export const authenticatedTest = test.extend<{}>({
  page: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(
      TEST_CREDENTIALS.valid.email,
      TEST_CREDENTIALS.valid.password
    );

    // Wait for catalog to load after login
    const catalogPage = new CatalogPage(page);
    await catalogPage.waitForProductsLoaded();

    await use(page);
  },
});

export { expect };
