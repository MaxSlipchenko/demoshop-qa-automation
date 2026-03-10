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
Known bugs are documented **inside the test code** with clear comments explaining actual vs expected behavior and root cause analysis. These tests are tagged `@known-bug` and use Playwright's `test.fail()` — they are counted as expected failures and will flag automatically when bugs are fixed. See [`docs/known-bugs.md`](docs/known-bugs.md) for full details on all 13 bugs.

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

## Test Coverage

**176 total regression tests** across Mobile Chrome (Pixel 7) and Desktop Chrome, organized across 7 spec files.

| Suite | Tests | Notes |
|---|---|---|
| `auth.spec.ts` | 17 | Login flows, validation, security, keyboard behavior, session persistence |
| `cart.spec.ts` | 20 | Add/remove, totals, checkout, refresh, persistence, known bugs |
| `catalog.spec.ts` | 18 | Product data, favorites, image zoom (open/close/zoom levels), document metadata |
| `category.spec.ts` | 8 | Filter by category, switching, combined with search |
| `search.spec.ts` | 15 | Exact/partial/case-insensitive search, edge cases, XSS, whitespace bug |
| `mobile.spec.ts` | 10 | Touch targets, viewport, scroll, orientation, accessibility |
| `e2e-smoke.spec.ts` | 2 | Full critical user journey end-to-end |

**Tag breakdown:**
- `@smoke` — 24 tests covering the critical path (~1 min)
- `@regression` — 176 tests covering full functionality (~4 min on 2 projects)
- `@known-bug` — 6 tests documenting confirmed defects (use `test.fail()` — counted as expected failures)

---

## Known Bugs Found

**13 bugs** identified across automated regression testing and a dedicated exploratory testing session. All bugs are fully documented in [`docs/known-bugs.md`](docs/known-bugs.md) with reproduction steps, root cause analysis, and suggested fixes.

| ID | Title | Severity | Test(s) |
|---|---|---|---|
| BG-001 | Cart total string concatenation at 3+ items | Critical | CT-012, CT-013 |
| BG-002 | Favorites toast off-by-one count | High | PL-017 |
| BG-003 | Checkout button doesn't clear cart or close panel | High | CT-017, CT-018 |
| BG-004 | Multi-space search input not trimmed (returns 0 results) | Medium | SR-013 |
| BG-005 | iPad 768px viewport: 3–4s loading delay showing "0 products" | Medium | PF-007 |
| BG-006 | 7+ interactive buttons have no accessible names (WCAG 4.1.2) | Medium | AC-009 |
| BG-007 | Tab order illogical; phantom zoom controls in tab sequence | Medium | AC-010 |
| BG-008 | Keyboard +/− doesn't control zoom level | Low | AC-011 |
| BG-009 | No visual feedback at max (3.0x) / min (0.5x) zoom limits | Low | PL-015, PL-016 |
| BG-010 | Login tab order starts at password field, not email | Low | AC-012 |
| BG-011 | Remember Me uses sessionStorage, not localStorage | Medium | AU-016, AU-017 |
| BG-012 | Escape key does not close the image zoom modal | Low | PL-013 |
| BG-013 | Page title is "React App" (Create React App default) | Low | PL-018 |

---

## Exploratory Testing

A dedicated exploratory testing session was run after the initial regression suite, systematically testing every feature with edge cases, keyboard interactions, network inspection, and accessibility checks. This resulted in:

- **13 bugs identified** (see full table above)
- **17 new test cases added** across 4 spec files
- **4 confirmed app improvements** discovered (checkout behavior, Remember Me scoping, zoom modal close mechanisms, product image zoom limits)

### New Tests from Exploratory Session

| Test ID | Description | File |
|---|---|---|
| AU-014 | Enter key in password field submits login | auth.spec.ts |
| AU-015 | Enter key in email field is silently ignored [BUG] | auth.spec.ts |
| AU-016 | Remember Me session persists across same-tab reload | auth.spec.ts |
| AU-017 | Without Remember Me, reload returns to login | auth.spec.ts |
| CT-017 | Checkout button shows "not implemented" toast | cart.spec.ts |
| CT-018 | Cart panel stays open and items unchanged after checkout | cart.spec.ts |
| CT-019 | Refresh button preserves cart contents | cart.spec.ts |
| CT-020 | Same product added twice creates two separate cart entries | cart.spec.ts |
| PL-013 | Escape key does not close zoom modal [BUG] | catalog.spec.ts |
| PL-014 | Zoom modal closes by clicking dark backdrop | catalog.spec.ts |
| PL-015 | Zoom level caps at 3.0x maximum | catalog.spec.ts |
| PL-016 | Zoom level floors at 0.5x minimum | catalog.spec.ts |
| PL-017 | Favorites toast shows off-by-one count [BUG] | catalog.spec.ts |
| PL-018 | Page title is "React App" not branded [BUG] | catalog.spec.ts |
| SR-013 | Multi-space search returns 0 products instead of all [BUG] | search.spec.ts |
| SR-014 | Zero-result search shows "No products found" in grid | search.spec.ts |
| SR-015 | Search preserves category filter context | search.spec.ts |

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
