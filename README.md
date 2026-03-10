# DemoShop QA Automation Framework

Mobile-first test automation framework for the [DemoShop](https://qa-mobile-automation.vercel.app/) e-commerce application, built with **Playwright** and **TypeScript**.

> **Take-Home Assignment** — Senior Mobile QA Engineer, Group 1001 / Gainbridge

---

## Why Playwright?

I chose Playwright as the initial automation framework because the application is currently accessible via web, while still representing a mobile-focused product experience. This allowed me to establish fast, stable, and maintainable regression coverage quickly, including mobile viewport validation. As the product matures into more native-only flows, this foundation can be extended with Appium-based device coverage where needed.

See [`docs/mobile-native-strategy.md`](docs/mobile-native-strategy.md) for the full Appium migration plan.

---

## Project Structure

```
demoshop-qa-automation/
├── tests/                      # Test suites organized by feature
│   ├── e2e-smoke.spec.ts       # Critical path end-to-end journey
│   ├── auth.spec.ts            # Authentication & login
│   ├── catalog.spec.ts         # Product listing & catalog
│   ├── search.spec.ts          # Search functionality
│   ├── category.spec.ts        # Category filtering
│   ├── cart.spec.ts            # Shopping cart (includes bug documentation)
│   └── mobile.spec.ts          # Mobile-specific behaviors
│
├── pages/                      # Page Object Model
│   ├── login.page.ts           # Login screen
│   ├── catalog.page.ts         # Product listing page
│   ├── cart.panel.ts           # Shopping cart panel
│   └── header.component.ts     # Header/navigation component
│
├── fixtures/                   # Custom test fixtures
│   └── test-fixtures.ts        # Page object injection & auto-login
│
├── utils/                      # Shared utilities
│   └── test-data.ts            # Test data, product catalog, security payloads
│
├── docs/                       # Documentation
│   ├── mobile-native-strategy.md  # Appium/Detox migration plan
│   └── known-bugs.md           # Documented defects with root cause analysis
│
├── .github/workflows/          # CI/CD
│   └── qa-automation.yml       # GitHub Actions pipeline
│
├── playwright.config.ts        # Multi-device configuration
├── package.json
└── tsconfig.json
```

---

## Quick Start

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install --with-deps

# Run all tests on all devices
npm test

# Run smoke tests only (fastest — run on every commit)
npm run test:smoke

# Run regression suite
npm run test:regression

# Run on specific device
npm run test:mobile    # Pixel 7, iPhone 14, iPhone SE
npm run test:desktop   # Desktop Chrome 1280px

# Interactive debugging
npm run test:debug

# Visual UI mode
npm run test:ui

# View last test report
npm run report
```

---

## Device Coverage

Tests run across **5 device configurations** via Playwright's built-in device emulation:

| Project | Device | Viewport | Touch | Purpose |
|---------|--------|----------|-------|---------|
| Mobile Chrome | Pixel 7 | 412×915 | ✅ | Primary Android target |
| Mobile Safari | iPhone 14 | 390×844 | ✅ | Primary iOS target |
| Mobile Safari Mini | iPhone SE | 375×667 | ✅ | Small screen validation |
| Tablet | iPad (gen 7) | 810×1080 | ✅ | Tablet breakpoint |
| Desktop Chrome | Chrome | 1280×720 | ❌ | Desktop baseline |

---

## Test Architecture

### Test Tags

Tests are tagged for selective execution:

- `@smoke` — Critical path (login, browse, cart). Run on every commit. ~2 min.
- `@regression` — Full functional coverage. Run nightly and pre-release. ~10 min.
- `@known-bug` — Tests that document known defects (expected to fail until fixed).

### Custom Fixtures

```typescript
// Auto-login fixture — skips login for tests that start on the catalog
import { authenticatedTest as test } from '../fixtures/test-fixtures';

// Base fixture — starts at login page
import { test } from '../fixtures/test-fixtures';
```

### Page Object Model

Every page/component has a dedicated class with:
- **Locators**: Accessible selectors (role, placeholder, text)
- **Actions**: `login()`, `addToCart()`, `search()`, `selectCategory()`
- **Assertions**: `assertProductCount()`, `assertCartTotal()`, `assertToastVisible()`

---

## Key Decisions

### 1. Selector Strategy
I prioritized **accessible selectors** (`getByRole`, `getByPlaceholder`, `getByText`) over CSS/XPath selectors. This:
- Makes tests resilient to CSS class/structure changes
- Doubles as accessibility validation (if it's not accessible, the test can't find it)
- Aligns with Playwright best practices

### 2. Test Data Management
All product data, credentials, and test constants are centralized in `utils/test-data.ts`. This means:
- No magic strings in test files
- Single source of truth if product data changes
- Type-safe with TypeScript interfaces

### 3. Bug Documentation in Tests
Known bugs (BG-001: cart total string concatenation, BG-002: favorites count mismatch) are documented **inside the test code** with clear comments explaining actual vs expected behavior and root cause analysis. These tests are tagged `@known-bug` and will fail until bugs are fixed — which is the correct behavior.

### 4. CI/CD Strategy
```
Push to main/develop:
  → Smoke tests (2 min, fast gate)
  → Regression tests per device (parallel matrix, 10 min)
  → Report published

Nightly (2 AM UTC):
  → Full regression on all 5 devices

Manual trigger:
  → Choose smoke, regression, or all
```

---

## Known Bugs Found

### BG-001: Cart Total String Concatenation (Critical)
**$99.99 + $29.99 + $39.99 → displays "$99.9929.9989.99" instead of "$169.97"**

Prices are concatenated as strings instead of summed numerically. The `+` operator is applied to string values, resulting in concatenation. See `docs/known-bugs.md` for full analysis and suggested fix.

### BG-002: Favorites Count Toast Mismatch (High)
Toast shows "Added to favorites (0 total)" while header correctly shows count of 1. The toast reads stale state before the React update completes.

See [`docs/known-bugs.md`](docs/known-bugs.md) for detailed reproduction steps, root cause analysis, and suggested fixes.

---

## What I Prioritized and Why

1. **Cart operations first** — highest business risk and where I found the most critical bug
2. **Authentication** — gate for all other tests; includes security validation
3. **Product catalog accuracy** — core user experience with most data points
4. **Search & filtering** — high-frequency user interactions
5. **Mobile viewport validation** — ensures the mobile-first app actually works on mobile
6. **Security** — XSS/injection prevention in all user inputs
7. **E2E smoke test** — single test covering the entire critical journey

---

## Extending This Framework

### Adding new tests
```typescript
// 1. Import the right fixture
import { authenticatedTest as test, expect } from '../fixtures/test-fixtures';

// 2. Write your test
test('My new test @regression', async ({ catalogPage, page }) => {
  // Use page objects for all interactions
  await catalogPage.search('Coffee');
  await catalogPage.assertProductCount(1);
});
```

### Adding a new page object
```typescript
// pages/checkout.page.ts
export class CheckoutPage {
  constructor(readonly page: Page) {}
  // ... locators and methods
}

// Then add to fixtures/test-fixtures.ts
```

---

## Future Roadmap

See [`docs/mobile-native-strategy.md`](docs/mobile-native-strategy.md) for the complete plan:

1. **Now**: Playwright for web-accessible mobile testing ← *you are here*
2. **Near-term**: Add Appium when native APK/IPA builds are available
3. **Long-term**: Playwright + Detox + Appium + Device farm
