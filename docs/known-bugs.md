# Known Bugs — DemoShop QA Assessment

## BG-001: Cart Total String Concatenation (Critical)

**Severity**: Critical / Blocker  
**Status**: Open  
**Reproducibility**: 100%

### Description
The shopping cart total calculation concatenates prices as strings instead of summing them numerically.

### Steps to Reproduce
1. Login with test credentials
2. Add "Wireless Headphones" ($99.99) to cart
3. Add "Yoga Mat" ($29.99) to cart
4. Add "Desk Lamp" ($39.99) to cart
5. Observe the "Total" in the header

### Actual Result
Header displays: `Total: $99.9929.9989.99`

### Expected Result
Header displays: `Total: $169.97`

### Root Cause Analysis
The cart total calculation uses the JavaScript `+` operator on string values. Since prices are stored/returned as strings (e.g., `"99.99"` not `99.99`), the `+` operator performs string concatenation instead of numeric addition.

### Suggested Fix
```javascript
// ❌ Current (buggy)
const total = cart.reduce((sum, item) => sum + item.price, '');

// ✅ Fixed
const total = cart.reduce((sum, item) => sum + parseFloat(item.price), 0).toFixed(2);
```

### Impact
- Users cannot see accurate cart totals
- Breaks any checkout/payment flow
- Total becomes unreadable after 2+ items
- Critical UX and business logic failure

### Test Reference
- `CT-012` in cart.spec.ts
- `CT-013` in cart.spec.ts

---

## BG-002: Favorites Count Mismatch in Toast (High)

**Severity**: High  
**Status**: Open  
**Reproducibility**: 100%

### Description
When adding a product to favorites, the toast notification displays an incorrect count ("0 total") while the header correctly shows the updated count.

### Steps to Reproduce
1. Login with test credentials
2. Click the heart icon on "Wireless Headphones"
3. Observe the toast notification AND the header favorites count

### Actual Result
- Toast shows: `Added to favorites (0 total)`
- Header shows: Heart icon with count `1`

### Expected Result
- Toast should show: `Added to favorites (1 total)`
- Header shows: Heart icon with count `1`

### Root Cause Analysis
The toast notification reads the favorites count **before** the state update completes. This is likely a stale closure or async timing issue in the React state management:

```javascript
// ❌ Likely current code (reads stale state)
const handleFavorite = () => {
  const count = favorites.length;       // Reads BEFORE update
  setFavorites([...favorites, item]);    // Updates state
  showToast(`Added to favorites (${count} total)`);  // Uses stale count
};

// ✅ Fix option 1: Use the new length
const handleFavorite = () => {
  const newFavorites = [...favorites, item];
  setFavorites(newFavorites);
  showToast(`Added to favorites (${newFavorites.length} total)`);
};
```

### Impact
- Confusing UX — user sees contradictory information
- Count is always off by one
- May indicate broader state management issues

### Test Reference
- `PL-007` in catalog.spec.ts (documents the behavior)

---

## BG-003: Potential — Out of Stock Button Click Handling

**Severity**: Medium  
**Status**: Needs Verification  
**Reproducibility**: To be confirmed

### Description
The "Out of Stock" button on the Smart Watch product may not be properly disabled. While the button text says "Out of Stock" and has different styling, it's unclear if rapid clicking or `force: true` clicks could bypass the guard.

### Verification Steps
1. Login
2. Open browser DevTools → Console
3. Rapidly click "Out of Stock" on Smart Watch 10+ times
4. Check if any cart state changes

### Test Reference
- `CT-010` in cart.spec.ts
