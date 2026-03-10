# Known Bugs — DemoShop QA Assessment

All bugs below were discovered during automated regression testing and a dedicated
exploratory testing session against `https://qa-mobile-automation.vercel.app/`.

| ID | Title | Severity | Status | Test(s) |
|---|---|---|---|---|
| BG-001 | Cart total string concatenation at 3+ items | Critical | Open | CT-012, CT-013 |
| BG-002 | Favorites toast shows off-by-one count | High | Open | PL-017 |
| BG-003 | Checkout button does not clear cart or close panel | High | Documented | CT-017, CT-018 |
| BG-004 | Multi-space search input not trimmed | Medium | Open | SR-013 |
| BG-005 | iPad (768px) viewport shows 3–4s loading delay | Medium | Timing issue | PF-007 |
| BG-006 | Multiple interactive buttons have no accessible names | Medium | WCAG 4.1.2 violation | AC-009 |
| BG-007 | Tab order illogical; phantom zoom controls always in tab sequence | Medium | Documented | AC-010 |
| BG-008 | Keyboard +/− keys do not control zoom level | Low | Documented | AC-011 |
| BG-009 | Zoom modal shows no visual feedback at max/min zoom levels | Low | Documented | PL-015, PL-016 |
| BG-010 | Login page tab order starts at password field, not email | Low | Documented | AC-012 |
| BG-011 | Remember Me uses sessionStorage instead of localStorage | Medium | Open | AU-016, AU-017 |
| BG-012 | Escape key does not close the image zoom modal | Low | Open | PL-013 |
| BG-013 | Page title is "React App" (default CRA), not branded | Low | Open | PL-018 |

---

## BG-001: Cart Total String Concatenation at 3+ Items (Critical)

**Severity:** Critical / Blocker
**Status:** Open — partially fixed (2-item case now works correctly)
**Reproducibility:** 100%

### Description

The shopping cart total calculation produces a string concatenation of prices instead of a numeric sum when three or more items are in the cart. The 1-item and 2-item cases compute correctly.

### Steps to Reproduce

1. Login with `user@test.com` / `password123`
2. Add **Wireless Headphones** ($99.99) → header shows `Total: $99.99` ✓
3. Add **Yoga Mat** ($29.99) → header shows `Total: $129.98` ✓
4. Add **Desk Lamp** ($39.99) → header shows `Total: $99.9929.9939.99` ✗

### Actual vs Expected

| Items | Actual | Expected |
|---|---|---|
| 1 | `Total: $99.99` | `Total: $99.99` ✓ |
| 2 | `Total: $129.98` | `Total: $129.98` ✓ |
| 3 | `Total: $99.9929.9939.99` | `Total: $169.97` ✗ |
| 5 (all in-stock) | `Total: $99.9979.9929.9989.9939.99` | `Total: $339.95` ✗ |

### Root Cause Analysis

The 2-item case works because two numeric values sum correctly. The failure at 3+ items suggests that at some point the accumulator is treated as a string. Likely hypothesis: price values accumulate correctly as a number for the first two items, but a state update or re-render causes the subsequent reduce to operate on a stringified representation of the running total.

```javascript
// ❌ Apparent behavior — accumulator becomes a string at the 3rd item
cart.reduce((sum, item) => sum + item.price, 0)
// 0 + 99.99 = 99.99 (number)
// 99.99 + 29.99 = 129.98 (number) — works!
// "129.98" + 39.99 = "129.9839.99" — breaks when state is serialized/read back as string

// ✅ Defensive fix
cart.reduce((sum, item) => sum + parseFloat(String(item.price)), 0).toFixed(2)
```

### Impact

- Users see an unreadable total after adding 3+ items
- Completely blocks any multi-item checkout flow
- Total in the cart panel bottom sheet is equally corrupted

### Test References

- `CT-012` — 2-item total (documents that this now works; uses `test.fail` to flag if regression occurs)
- `CT-013` — 3-item total (`test.fail` — expected failure until bug is fixed)

---

## BG-002: Favorites Toast Shows Off-by-One Count (High)

**Severity:** High
**Status:** Open
**Reproducibility:** 100%

### Description

When adding a product to favorites, the toast notification displays a count that reflects the state *before* the item was added, not after. The header favorites badge shows the correct post-add count immediately.

### Steps to Reproduce

1. Login and navigate to the catalog (no items favorited)
2. Click the heart icon on **Wireless Headphones**
3. Read the toast and the header simultaneously

### Actual vs Expected

| Signal | Actual | Expected |
|---|---|---|
| Toast | `Added to favorites (0 total)` | `Added to favorites (1 total)` |
| Header badge | `1` | `1` ✓ |

The pattern repeats: 2nd favorite shows `(1 total)` in toast while header shows `2`, etc.

### Root Cause Analysis

The toast message captures `favorites.length` *before* the `setFavorites` state update commits (stale closure).

```javascript
// ❌ Current — reads stale count
const count = favorites.length;          // e.g. 0
setFavorites([...favorites, item]);      // schedules update
showToast(`Added to favorites (${count} total)`); // shows 0

// ✅ Fix
const newFavorites = [...favorites, item];
setFavorites(newFavorites);
showToast(`Added to favorites (${newFavorites.length} total)`);
```

### Impact

- Confusing UX — user sees two contradictory counts simultaneously
- Toast is the user's primary feedback; showing the wrong count erodes trust

### Test References

- `PL-017` in `catalog.spec.ts` (`test.fail` — expected failure until fixed)

---

## BG-003: Checkout Button Does Not Clear Cart or Close Panel (High)

**Severity:** High
**Status:** Documented
**Reproducibility:** 100%

### Description

Clicking "Proceed to Checkout" shows a toast reading `"Checkout not implemented in demo"` but the cart panel remains open, all items remain in the cart, and the header badge and total are unchanged. There is no state reset of any kind.

### Steps to Reproduce

1. Login and add any item to the cart
2. Click the cart icon to open the cart panel
3. Click **Proceed to Checkout**

### Actual Result

- Toast: `"Checkout not implemented in demo"` (auto-dismisses after ~3s)
- Cart panel: still open
- Cart items: unchanged
- Header badge and total: unchanged
- URL: unchanged (no navigation)

### Expected Result

For a demo/stub: at minimum the cart panel should close and optionally the cart should be cleared, leaving the user in a clean state with a clear message.

### Impact

- Users must manually close the cart panel after clicking checkout
- The cart contents persist in a confusing state — the demo gives no sense of a completed purchase flow

### Test References

- `CT-017` — Verifies toast text appears
- `CT-018` — Verifies cart is unchanged (panel open, item present, badge = 1)

---

## BG-004: Multi-Space Search Input Not Trimmed (Medium)

**Severity:** Medium
**Status:** Open
**Reproducibility:** 100%

### Description

Entering multiple space characters in the search field returns `0 products found` instead of all 6 products. The search does not trim the input before matching, treating whitespace-only strings as non-empty search queries. A single space happens to work correctly due to how the matching algorithm handles it, but two or more spaces do not.

### Steps to Reproduce

1. Login and navigate to the catalog
2. Click the search input and type `   ` (three spaces)
3. Observe the product count

### Actual vs Expected

| Input | Actual | Expected |
|---|---|---|
| `""` (empty) | `6 products found` | `6 products found` ✓ |
| `" "` (1 space) | `6 products found` | `6 products found` ✓ |
| `"   "` (3 spaces) | `0 products found` | `6 products found` ✗ |
| `"\t"` (tab) | `0 products found` | `6 products found` ✗ |

### Suggested Fix

```javascript
// ❌ Current
products.filter(p => p.name.includes(searchTerm))

// ✅ Fixed — trim before matching
products.filter(p => p.name.toLowerCase().includes(searchTerm.trim().toLowerCase()))
```

### Test References

- `SR-013` in `search.spec.ts` (`test.fail` — expected failure until fixed)

---

## BG-005: iPad (768px) Viewport Shows 3–4 Second Loading Delay (Medium)

**Severity:** Medium
**Status:** Timing issue
**Reproducibility:** Consistent on 768px-wide viewports

### Description

After login on a 768px viewport (iPad portrait), the catalog displays `0 products found` with 6 skeleton cards for approximately 3–4 seconds before products render. Other viewport widths (375px, 390px, 412px, 1280px) load products noticeably faster (<1s visible delay).

### Steps to Reproduce

1. Set viewport to `768×1024`
2. Navigate to the app and log in
3. Observe the time between login completion and products appearing

### Observations

- Skeleton loading state visible for 3–4 seconds at 768px
- Same skeleton delay is not observed at 412px (Pixel 7) or 1280px (Desktop)
- Not a network issue — the app is fully client-side with no API calls

### Hypothesis

The 768px breakpoint triggers a layout change (Tailwind's `md:` prefix switching from 1-column to 2-column grid). This CSS media query transition may trigger an additional React render cycle that delays product rendering.

### Impact

- Tests run on 768px viewports (e.g., Tablet project in playwright.config.ts) must use longer `waitForProductsLoaded` timeouts or the test framework will misread the loading state as a real failure
- Currently mitigated in `waitForProductsLoaded()` by waiting for count > 0 rather than just element visibility

### Test References

- `PF-007` — documents the loading delay and timing threshold on the 768px viewport

---

## BG-006: Multiple Interactive Buttons Have No Accessible Names (Medium)

**Severity:** Medium (Accessibility — WCAG 2.1 Level A violation)
**Status:** WCAG 4.1.2 violation
**Reproducibility:** 100% — structural issue, not intermittent

### Description

Seven or more interactive buttons in the app have no accessible name — no `aria-label`, no `title` attribute, and no visible text. They contain only SVG icons, making them completely unusable for screen reader users.

### Affected Elements

| Element | Selector | Missing Label |
|---|---|---|
| Cart icon | `button:has([data-testid="cart-icon"])` | e.g. `aria-label="Open cart"` |
| Favorite buttons (×6) | `[data-testid="favorite-button-{1-6}"]` | e.g. `aria-label="Add {product} to favorites"` |
| Image zoom close | `[data-testid="close-image-viewer"]` | e.g. `aria-label="Close image viewer"` |
| Remove cart item (×N) | `[data-testid="remove-cart-item-{n}"]` | e.g. `aria-label="Remove {item} from cart"` |

### Suggested Fix

```html
<!-- ❌ Current -->
<button data-testid="favorite-button-1">
  <svg aria-hidden="true">...</svg>
</button>

<!-- ✅ Fixed -->
<button data-testid="favorite-button-1" aria-label="Add Wireless Headphones to favorites">
  <svg aria-hidden="true">...</svg>
</button>
```

### Impact

- Screen reader users cannot identify or activate these buttons
- Fails WCAG 2.1 Success Criterion 4.1.2 (Name, Role, Value)

### Test References

- `AC-009` — verifies all interactive buttons have an accessible name

---

## BG-007: Illogical Tab Order and Phantom Zoom Controls in Tab Sequence (Medium)

**Severity:** Medium (Accessibility / UX)
**Status:** Documented
**Reproducibility:** 100%

### Description

Two related keyboard navigation problems on the catalog page:

1. **Tab order is illogical**: Tab focus starts on the second product's favorite button rather than the cart icon in the header or the search input. The cart icon button cannot be reached via keyboard navigation without a full tab cycle.

2. **Phantom zoom controls**: The zoom modal's close button and zoom in/out buttons appear in the keyboard tab sequence even when the modal is closed, because the modal's DOM is always present (not conditionally rendered).

### Observed Tab Order (from body, first 10 tabs)

1. `favorite-button-2` (second product card — expected: cart icon)
2. `favorite-button-3`
3. `add-to-cart-3`
4–9. Continue through product cards 4–6
10. `close-image-viewer` ← zoom modal close button, but modal is NOT open

### Expected Tab Order

Cart icon → Search input → Category dropdown → Refresh button → Product 1 heart → Product 1 Add to Cart → ... etc.

### Impact

- Keyboard-only users cannot navigate the page logically
- Screen reader users will encounter zoom modal controls in an unexpected context

### Test References

- `AC-010` — verifies logical tab order and absence of phantom focusable elements

---

## BG-008: Keyboard +/− Keys Do Not Control Zoom Level (Low)

**Severity:** Low
**Status:** Documented
**Reproducibility:** 100%

### Description

When the image zoom modal is open, pressing `+` or `−` on the keyboard has no effect on the zoom level. Only the on-screen "Zoom In" / "Zoom Out" buttons work. The modal hint text reads "Pinch to zoom" — keyboard zoom via `+`/`−` keys would be the desktop equivalent of pinch-to-zoom.

### Steps to Reproduce

1. Login and click any product image to open the zoom modal
2. With the modal open, press `+` or `=` on the keyboard

### Actual Result

Zoom level unchanged (`Zoom: 1.0x`)

### Expected Result

`+` increases zoom level; `−` decreases zoom level

### Test References

- `AC-011` — verifies keyboard zoom controls are functional in the modal

---

## BG-009: Zoom Modal Provides No Visual Feedback at Max/Min Zoom Limits (Low)

**Severity:** Low
**Status:** Documented
**Reproducibility:** 100%

### Description

When the zoom level reaches its maximum (3.0x) or minimum (0.5x), the "Zoom In" / "Zoom Out" buttons remain fully enabled with no visual indication that the limit has been reached. Clicking the button beyond the limit silently does nothing.

### Zoom Level Range

- **Minimum:** 0.5x (steps down by 0.5x from 1.0x)
- **Maximum:** 3.0x (steps up by 0.5x: 1.0 → 1.5 → 2.0 → 2.5 → 3.0)

### Expected

Zoom In button should be visually disabled (greyed out, `disabled` attribute, or `aria-disabled`) when at 3.0x. Zoom Out button should be visually disabled at 0.5x.

### Test References

- `PL-015` in `catalog.spec.ts` — documents max zoom of 3.0x
- `PL-016` in `catalog.spec.ts` — documents min zoom of 0.5x

---

## BG-010: Login Page Tab Order Starts at Password Field, Not Email (Low)

**Severity:** Low (Accessibility / UX)
**Status:** Documented
**Reproducibility:** 100%

### Description

On the login page, pressing Tab once from the document body focuses the **password** field instead of the email field. The email field is only reachable on the 5th tab press (after a full cycle).

### Observed Tab Order

1. `input[type="password"]` ← first focus (wrong)
2. `input[type="checkbox"]` (Remember Me)
3. Login button
4. (body wrap)
5. `input[type="email"]` ← email field not reached until here

### Expected Tab Order

Email → Password → Remember Me checkbox → Login button

### Additional Finding

Pressing Enter while focus is in the **email field** does nothing — it neither submits the form nor moves focus to the password field. Only Enter from the password field submits the form.

### Test References

- `AC-012` — verifies correct tab order on the login page

---

## BG-011: Remember Me Uses sessionStorage Instead of localStorage (Medium)

**Severity:** Medium
**Status:** Open
**Reproducibility:** 100%

### Description

"Remember Me" stores the session in `sessionStorage` (`demoShop_remembered: "true"`), not `localStorage`. sessionStorage is scoped to the current browser tab and is cleared when the tab is closed. This means "Remember Me" only works for F5/page reloads within the same tab session — it provides no persistence across browser restarts, which is the entire point of a "Remember Me" feature.

### Observed Behavior

| Scenario | Actual | Expected |
|---|---|---|
| Check Remember Me → F5 reload (same tab) | Stays logged in ✓ | Stays logged in ✓ |
| Check Remember Me → close tab → reopen | Redirected to login ✗ | Should stay logged in |
| Without Remember Me → F5 reload | Redirected to login ✓ | Redirected to login ✓ |

### Suggested Fix

```javascript
// ❌ Current
sessionStorage.setItem('demoShop_remembered', 'true');

// ✅ Fixed
localStorage.setItem('demoShop_remembered', JSON.stringify({
  email: userEmail,
  expiry: Date.now() + (30 * 24 * 60 * 60 * 1000) // 30 days
}));
```

### Test References

- `AU-016` — Confirms session persists across same-tab reload (sessionStorage behavior)
- `AU-017` — Confirms reload without Remember Me redirects to login

---

## BG-012: Escape Key Does Not Close the Image Zoom Modal (Low)

**Severity:** Low
**Status:** Open
**Reproducibility:** 100%

### Description

When the image zoom modal is open, pressing `Escape` does not close it. The modal remains open and requires the user to click the `✕` close button or click the dark backdrop overlay to dismiss it. Closing modals with Escape is a standard UX convention and a WCAG requirement (Success Criterion 1.4.13).

### Steps to Reproduce

1. Login and click any product image
2. With the zoom modal open, press `Escape`

### Actual Result

Modal remains open. No change.

### Expected Result

Modal closes. Focus returns to the product image that was clicked.

### Additional Note

Closing via clicking the dark backdrop overlay (`[data-testid="image-viewer-overlay"]`) **does** work correctly. Only the Escape keyboard shortcut is missing.

### Test References

- `PL-013` in `catalog.spec.ts` (`test.fail` — expected failure until fixed)

---

## BG-013: Page Title Is "React App" Instead of a Branded Title (Low)

**Severity:** Low
**Status:** Open
**Reproducibility:** 100%

### Description

The `document.title` (browser tab title) is `"React App"` — the default value from Create React App's `public/index.html`. It has never been updated to a branded name like "DemoShop" or "DemoShop — QA Assessment".

### Actual vs Expected

| | Value |
|---|---|
| Actual `document.title` | `"React App"` |
| Expected | `"DemoShop"` or `"DemoShop \| QA Assessment App"` |

### Impact

- Tabs in the browser show "React App" — users and testers cannot identify the tab
- Breaks SEO signals (not relevant for a demo, but a real app issue)
- Indicates `public/index.html` was never customized

### Suggested Fix

```html
<!-- public/index.html -->
<title>DemoShop</title>
```

### Test References

- `PL-018` in `catalog.spec.ts` (`test.fail` — expected failure until fixed)
