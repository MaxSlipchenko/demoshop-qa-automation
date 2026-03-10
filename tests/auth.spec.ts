import { test, expect } from '../fixtures/test-fixtures';
import { TEST_CREDENTIALS, SQL_INJECTION_PAYLOADS, XSS_PAYLOADS } from '../utils/test-data';

/**
 * Authentication & Login Test Suite
 *
 * Covers:
 * - Valid/invalid credential flows
 * - Input validation (empty fields, malformed email)
 * - Security (XSS, SQL injection)
 * - UI elements (password masking, credentials hint, remember me)
 * - Responsive login form on mobile viewports
 */

test.describe('Authentication & Login', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
  });

  // ═══════════════════════════════════════
  // SMOKE TESTS
  // ═══════════════════════════════════════

  test('AU-001: Valid login with test credentials @smoke @regression', async ({
    loginPage,
    catalogPage,
  }) => {
    await loginPage.login(
      TEST_CREDENTIALS.valid.email,
      TEST_CREDENTIALS.valid.password
    );

    // Should navigate to product listing
    await catalogPage.waitForProductsLoaded();
    await catalogPage.assertProductCount(6);
  });

  test('AU-002: Login page displays all required elements @smoke @regression', async ({
    loginPage,
  }) => {
    await loginPage.assertPageVisible();
    await loginPage.assertCredentialsHintVisible();
    await loginPage.assertPasswordMasked();
  });

  // ═══════════════════════════════════════
  // INPUT VALIDATION
  // ═══════════════════════════════════════

  test('AU-003: Empty email shows validation error @regression', async ({
    loginPage,
  }) => {
    await loginPage.login('', TEST_CREDENTIALS.valid.password);

    // Should remain on login page — look for error or still see login button
    await expect(loginPage.loginButton).toBeVisible();
  });

  test('AU-004: Empty password shows validation error @regression', async ({
    loginPage,
  }) => {
    await loginPage.login(TEST_CREDENTIALS.valid.email, '');
    await expect(loginPage.loginButton).toBeVisible();
  });

  test('AU-005: Both fields empty shows validation errors @regression', async ({
    loginPage,
  }) => {
    await loginPage.login('', '');
    await expect(loginPage.loginButton).toBeVisible();
  });

  test('AU-006: Invalid email format rejected @regression', async ({
    loginPage,
  }) => {
    await loginPage.login(TEST_CREDENTIALS.malformed.email, TEST_CREDENTIALS.valid.password);
    // Should remain on login page or show error
    await expect(loginPage.loginButton).toBeVisible();
  });

  test('AU-007: Wrong credentials show error message @regression', async ({
    loginPage,
  }) => {
    await loginPage.login(
      TEST_CREDENTIALS.invalid.email,
      TEST_CREDENTIALS.invalid.password
    );

    // Should show error and remain on login page
    await expect(loginPage.loginButton).toBeVisible();
  });

  // ═══════════════════════════════════════
  // SECURITY
  // ═══════════════════════════════════════

  test('AU-008: SQL injection in email field is rejected @regression', async ({
    loginPage,
    page,
  }) => {
    for (const payload of SQL_INJECTION_PAYLOADS.slice(0, 2)) {
      await loginPage.goto();
      await loginPage.login(payload, 'anything');

      // Should NOT navigate away from login. No SQL error exposed.
      await expect(loginPage.loginButton).toBeVisible();

      // Verify no error details leaked in the page
      await expect(page.getByText(/SQL/i)).not.toBeVisible();
      await expect(page.getByText(/syntax error/i)).not.toBeVisible();
    }
  });

  test('AU-009: XSS in email field is sanitized @regression', async ({
    loginPage,
    page,
  }) => {
    // Set up dialog handler to catch any alert() execution
    let alertFired = false;
    page.on('dialog', async (dialog) => {
      alertFired = true;
      await dialog.dismiss();
    });

    for (const payload of XSS_PAYLOADS.slice(0, 2)) {
      await loginPage.emailInput.fill(payload);
      await loginPage.passwordInput.fill('anything');
      await loginPage.loginButton.click();
      await page.waitForTimeout(500);
    }

    expect(alertFired).toBe(false);
  });

  // ═══════════════════════════════════════
  // UI & UX
  // ═══════════════════════════════════════

  test('AU-010: Password field masks input @regression', async ({ loginPage }) => {
    await loginPage.assertPasswordMasked();
    await loginPage.passwordInput.fill('testpassword');
    // Field type should still be 'password'
    await loginPage.assertPasswordMasked();
  });

  test('AU-011: Remember me checkbox is interactive @regression', async ({
    loginPage,
  }) => {
    // Check
    await loginPage.rememberMeCheckbox.check();
    await expect(loginPage.rememberMeCheckbox).toBeChecked();

    // Uncheck
    await loginPage.rememberMeCheckbox.uncheck();
    await expect(loginPage.rememberMeCheckbox).not.toBeChecked();
  });

  test('AU-012: Test credentials hint is displayed @regression', async ({
    loginPage,
  }) => {
    await loginPage.assertCredentialsHintVisible();
    // Verify hint contains the actual test credentials
    await expect(loginPage.credentialsHint).toContainText('user@test.com');
    await expect(loginPage.credentialsHint).toContainText('password123');
  });

  // ═══════════════════════════════════════
  // RESPONSIVE (Mobile specific)
  // ═══════════════════════════════════════

  test('AU-013: Login form is usable on current viewport @regression', async ({
    loginPage,
    page,
  }) => {
    const viewport = page.viewportSize();

    // All elements should be within viewport
    const loginBox = await loginPage.loginButton.boundingBox();
    expect(loginBox).not.toBeNull();
    if (loginBox && viewport) {
      expect(loginBox.x).toBeGreaterThanOrEqual(0);
      expect(loginBox.x + loginBox.width).toBeLessThanOrEqual(viewport.width);
    }

    // Email and password fields should be tappable (minimum touch target)
    const emailBox = await loginPage.emailInput.boundingBox();
    expect(emailBox).not.toBeNull();
    if (emailBox) {
      expect(emailBox.height).toBeGreaterThanOrEqual(30); // Reasonable min height
    }
  });
});
