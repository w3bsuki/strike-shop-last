/**
 * Test Data Fixtures for E2E Tests
 * Provides consistent test data across E2E tests
 */

export const testProducts = [
  {
    id: 'test-product-1',
    title: 'Test Smartphone',
    handle: 'test-smartphone',
    price: 699.99,
    currency: 'USD',
    category: 'Electronics',
    description: 'A high-quality test smartphone for E2E testing',
    image: '/test-images/smartphone.jpg',
    stock: 10,
    variants: [
      { id: 'var-1', color: 'Black', size: '128GB', price: 699.99, stock: 5 },
      { id: 'var-2', color: 'White', size: '256GB', price: 799.99, stock: 5 },
    ],
  },
  {
    id: 'test-product-2',
    title: 'Test Laptop',
    handle: 'test-laptop',
    price: 1299.99,
    currency: 'USD',
    category: 'Electronics',
    description: 'A powerful test laptop for development',
    image: '/test-images/laptop.jpg',
    stock: 5,
    variants: [
      { id: 'var-3', color: 'Silver', size: '16GB RAM', price: 1299.99, stock: 3 },
      { id: 'var-4', color: 'Space Gray', size: '32GB RAM', price: 1599.99, stock: 2 },
    ],
  },
  {
    id: 'test-product-3',
    title: 'Test Headphones',
    handle: 'test-headphones',
    price: 199.99,
    currency: 'USD',
    category: 'Audio',
    description: 'Premium noise-cancelling test headphones',
    image: '/test-images/headphones.jpg',
    stock: 15,
    variants: [
      { id: 'var-5', color: 'Black', size: 'Standard', price: 199.99, stock: 10 },
      { id: 'var-6', color: 'White', size: 'Standard', price: 199.99, stock: 5 },
    ],
  },
];

export const testUsers = {
  customer: {
    email: 'test@example.com',
    password: 'testpassword123',
    firstName: 'Test',
    lastName: 'Customer',
    address: {
      street: '123 Test Street',
      city: 'Test City',
      state: 'Test State',
      zipCode: '12345',
      country: 'United States',
    },
    paymentMethod: {
      cardNumber: '4242424242424242', // Stripe test card
      expiryMonth: '12',
      expiryYear: '2030',
      cvc: '123',
      name: 'Test Customer',
    },
  },
  admin: {
    email: 'admin@example.com',
    password: 'adminpassword123',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin',
  },
};

export const testOrders = {
  completed: {
    id: 'test-order-1',
    status: 'completed',
    items: [
      { productId: 'test-product-1', variantId: 'var-1', quantity: 1, price: 699.99 },
      { productId: 'test-product-3', variantId: 'var-5', quantity: 2, price: 199.99 },
    ],
    total: 1099.97,
    shippingAddress: testUsers.customer.address,
  },
  pending: {
    id: 'test-order-2',
    status: 'pending',
    items: [
      { productId: 'test-product-2', variantId: 'var-3', quantity: 1, price: 1299.99 },
    ],
    total: 1299.99,
    shippingAddress: testUsers.customer.address,
  },
};

export const testCategories = [
  {
    id: 'electronics',
    name: 'Electronics',
    handle: 'electronics',
    description: 'Electronic devices and gadgets',
  },
  {
    id: 'audio',
    name: 'Audio',
    handle: 'audio',
    description: 'Audio equipment and accessories',
  },
  {
    id: 'computers',
    name: 'Computers',
    handle: 'computers',
    description: 'Computers and computer accessories',
  },
];

export const testCoupons = [
  {
    code: 'TEST10',
    type: 'percentage',
    value: 10,
    description: '10% off test coupon',
    minOrder: 50,
    expiresAt: '2030-12-31',
  },
  {
    code: 'SAVE20',
    type: 'fixed',
    value: 20,
    description: '$20 off test coupon',
    minOrder: 100,
    expiresAt: '2030-12-31',
  },
];