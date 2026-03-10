import { Page, Locator, expect } from '@playwright/test';

/**
 * Login Page Object
 *
 * Encapsulates the DemoShop login screen:
 * - Email & password inputs
 * - Remember me checkbox
 * - Login button
 * - Test credentials hint
 * - Validation error messages
 */
export class LoginPage {
  readonly page: Page;

  // Locators
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly rememberMeCheckbox: Locator;
  readonly loginButton: Locator;
  readonly appTitle: Locator;
  readonly appSubtitle: Locator;
  readonly errorMessage: Locator;
  readonly credentialsHint: Locator;

  constructor(page: Page) {
    this.page = page;

    // Using accessible selectors — role-based where possible, then text/placeholder
    this.emailInput = page.getByPlaceholder('user@test.com');
    this.passwordInput = page.getByPlaceholder('Enter password');
    this.rememberMeCheckbox = page.locator('[data-testid="remember-me-checkbox"]');
    this.loginButton = page.getByRole('button', { name: /login/i });
    this.appTitle = page.getByText('DemoShop');
    this.appSubtitle = page.getByText('QA Assessment App');
    this.errorMessage = page.locator('[role="alert"], .error-message, .error');
    this.credentialsHint = page.getByText(/test credentials/i);
  }

  /**
   * Navigate to the login page
   */
  async goto(): Promise<void> {
    await this.page.goto('/');
    await this.loginButton.waitFor({ state: 'visible' });
  }

  /**
   * Perform login with given credentials
   */
  async login(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  /**
   * Login with Remember Me checked
   */
  async loginWithRememberMe(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.rememberMeCheckbox.check();
    await this.loginButton.click();
  }

  /**
   * Assert the login page is displayed correctly
   */
  async assertPageVisible(): Promise<void> {
    await expect(this.appTitle.first()).toBeVisible();
    await expect(this.emailInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    await expect(this.loginButton).toBeVisible();
  }

  /**
   * Assert an error message is displayed
   */
  async assertErrorVisible(expectedText?: string): Promise<void> {
    await expect(this.errorMessage.first()).toBeVisible();
    if (expectedText) {
      await expect(this.errorMessage.first()).toContainText(expectedText);
    }
  }

  /**
   * Assert the password field masks input
   */
  async assertPasswordMasked(): Promise<void> {
    await expect(this.passwordInput).toHaveAttribute('type', 'password');
  }

  /**
   * Assert test credentials hint is visible
   */
  async assertCredentialsHintVisible(): Promise<void> {
    await expect(this.credentialsHint).toBeVisible();
  }

  /**
   * Get current field values (for debugging)
   */
  async getFieldValues(): Promise<{ email: string; password: string }> {
    return {
      email: (await this.emailInput.inputValue()) || '',
      password: (await this.passwordInput.inputValue()) || '',
    };
  }
}
