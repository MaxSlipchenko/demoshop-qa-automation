/**
 * Test Data & Constants for DemoShop QA Automation
 *
 * Centralized test data avoids magic strings scattered across test files
 * and makes maintenance easier when app data changes.
 */

// ── Authentication ──
export const TEST_CREDENTIALS = {
  valid: {
    email: 'user@test.com',
    password: 'password123',
  },
  invalid: {
    email: 'wrong@email.com',
    password: 'wrongpassword',
  },
  malformed: {
    email: 'notanemail',
    password: 'x',
  },
};

// ── Products ──
export interface Product {
  name: string;
  price: number;
  priceText: string;
  rating: number;
  stock: number;
  stockText: string;
  category: Category;
  inStock: boolean;
}

export type Category = 'All' | 'Electronics' | 'Sports' | 'Home';

export const CATEGORIES: Category[] = ['All', 'Electronics', 'Sports', 'Home'];

export const PRODUCTS: Record<string, Product> = {
  wirelessHeadphones: {
    name: 'Wireless Headphones',
    price: 99.99,
    priceText: '$99.99',
    rating: 4.5,
    stock: 5,
    stockText: '5 in stock',
    category: 'Electronics',
    inStock: true,
  },
  smartWatch: {
    name: 'Smart Watch',
    price: 249.99,
    priceText: '$249.99',
    rating: 4.8,
    stock: 0,
    stockText: 'Out of stock',
    category: 'Electronics',
    inStock: false,
  },
  runningShoes: {
    name: 'Running Shoes',
    price: 79.99,
    priceText: '$79.99',
    rating: 4.2,
    stock: 12,
    stockText: '12 in stock',
    category: 'Sports',
    inStock: true,
  },
  yogaMat: {
    name: 'Yoga Mat',
    price: 29.99,
    priceText: '$29.99',
    rating: 4.6,
    stock: 8,
    stockText: '8 in stock',
    category: 'Sports',
    inStock: true,
  },
  coffeeMaker: {
    name: 'Coffee Maker',
    price: 89.99,
    priceText: '$89.99',
    rating: 4.4,
    stock: 3,
    stockText: '3 in stock',
    category: 'Home',
    inStock: true,
  },
  deskLamp: {
    name: 'Desk Lamp',
    price: 39.99,
    priceText: '$39.99',
    rating: 4.1,
    stock: 15,
    stockText: '15 in stock',
    category: 'Home',
    inStock: true,
  },
};

// Derived helpers
export const ALL_PRODUCT_NAMES = Object.values(PRODUCTS).map((p) => p.name);
export const IN_STOCK_PRODUCTS = Object.values(PRODUCTS).filter((p) => p.inStock);
export const OUT_OF_STOCK_PRODUCTS = Object.values(PRODUCTS).filter((p) => !p.inStock);

export const PRODUCTS_BY_CATEGORY: Record<Category, Product[]> = {
  All: Object.values(PRODUCTS),
  Electronics: Object.values(PRODUCTS).filter((p) => p.category === 'Electronics'),
  Sports: Object.values(PRODUCTS).filter((p) => p.category === 'Sports'),
  Home: Object.values(PRODUCTS).filter((p) => p.category === 'Home'),
};

// ── Expected Counts ──
export const EXPECTED_COUNTS = {
  All: 6,
  Electronics: 2,
  Sports: 2,
  Home: 2,
};

// ── Security Payloads ──
export const XSS_PAYLOADS = [
  '<script>alert(1)</script>',
  '<img src=x onerror=alert(1)>',
  '"><script>alert(document.cookie)</script>',
  "'; DROP TABLE users; --",
];

export const SQL_INJECTION_PAYLOADS = [
  "' OR 1=1 --",
  "' OR '1'='1",
  "1; DROP TABLE users",
  "' UNION SELECT * FROM users --",
];

// ── Timeouts & Thresholds ──
export const PERFORMANCE = {
  pageLoadTimeout: 5_000,
  apiResponseTimeout: 3_000,
  toastDismissTimeout: 5_000,
  animationTimeout: 1_000,
};
