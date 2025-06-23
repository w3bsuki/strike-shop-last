/**
 * User Authentication E2E Test
 * Tests user registration, login, logout, and profile management
 * Critical for user experience and account security
 */

import { test, expect } from '../fixtures/auth';
import { testUsers } from '../fixtures/data';

test.describe('User Authentication Journey', () => {
  test('new user can register successfully', async ({ guestPage }) => {
    // Step 1: Navigate to registration page
    await guestPage.goto('/sign-up');
    await expect(guestPage.locator('[data-testid="signup-form"]')).toBeVisible();

    // Step 2: Fill registration form
    const newUser = {
      firstName: 'New',
      lastName: 'User',
      email: `newuser${Date.now()}@example.com`,
      password: 'newuserpassword123',
      confirmPassword: 'newuserpassword123',
    };

    await guestPage.fill('[data-testid="first-name-input"]', newUser.firstName);
    await guestPage.fill('[data-testid="last-name-input"]', newUser.lastName);
    await guestPage.fill('[data-testid="email-input"]', newUser.email);
    await guestPage.fill('[data-testid="password-input"]', newUser.password);
    await guestPage.fill('[data-testid="confirm-password-input"]', newUser.confirmPassword);

    // Step 3: Accept terms and conditions
    await guestPage.check('[data-testid="terms-checkbox"]');

    // Step 4: Submit registration
    await guestPage.click('[data-testid="signup-button"]');

    // Step 5: Verify successful registration
    await expect(guestPage).toHaveURL(/dashboard|welcome/);
    await expect(guestPage.locator('[data-testid="welcome-message"]')).toBeVisible();

    // Step 6: Verify user is logged in
    const userMenu = guestPage.locator('[data-testid="user-menu"]');
    await expect(userMenu).toContainText(newUser.firstName);
  });

  test('existing user can login successfully', async ({ guestPage }) => {
    // Step 1: Navigate to login page
    await guestPage.goto('/sign-in');
    await expect(guestPage.locator('[data-testid="signin-form"]')).toBeVisible();

    // Step 2: Fill login form
    await guestPage.fill('[data-testid="email-input"]', testUsers.customer.email);
    await guestPage.fill('[data-testid="password-input"]', testUsers.customer.password);

    // Step 3: Submit login
    await guestPage.click('[data-testid="signin-button"]');

    // Step 4: Verify successful login
    await expect(guestPage).toHaveURL(/dashboard/);
    await expect(guestPage.locator('[data-testid="user-dashboard"]')).toBeVisible();

    // Step 5: Verify user information is displayed
    const welcomeMessage = guestPage.locator('[data-testid="user-welcome"]');
    await expect(welcomeMessage).toContainText(testUsers.customer.firstName);
  });

  test('user can logout successfully', async ({ authenticatedPage }) => {
    // Step 1: Verify user is logged in
    await authenticatedPage.goto('/');
    const userMenu = authenticatedPage.locator('[data-testid="user-menu"]');
    await expect(userMenu).toBeVisible();

    // Step 2: Open user menu and logout
    await userMenu.click();
    const logoutButton = authenticatedPage.locator('[data-testid="logout-button"]');
    await expect(logoutButton).toBeVisible();
    await logoutButton.click();

    // Step 3: Verify successful logout
    await expect(authenticatedPage).toHaveURL('/');
    const signInButton = authenticatedPage.locator('[data-testid="sign-in-link"]');
    await expect(signInButton).toBeVisible();

    // Step 4: Verify protected pages redirect to login
    await authenticatedPage.goto('/dashboard');
    await expect(authenticatedPage).toHaveURL(/sign-in/);
  });

  test('user can reset password', async ({ guestPage }) => {
    // Step 1: Go to login and click forgot password
    await guestPage.goto('/sign-in');
    await guestPage.click('[data-testid="forgot-password-link"]');

    // Step 2: Verify forgot password page
    await expect(guestPage).toHaveURL(/forgot-password/);
    await expect(guestPage.locator('[data-testid="forgot-password-form"]')).toBeVisible();

    // Step 3: Enter email address
    await guestPage.fill('[data-testid="email-input"]', testUsers.customer.email);
    await guestPage.click('[data-testid="reset-password-button"]');

    // Step 4: Verify confirmation message
    await expect(guestPage.locator('[data-testid="reset-email-sent"]')).toBeVisible();
    await expect(guestPage.locator('[data-testid="reset-email-sent"]')).toContainText(
      /reset link has been sent/i
    );
  });

  test('user profile can be updated', async ({ authenticatedPage }) => {
    // Step 1: Navigate to profile page
    await authenticatedPage.goto('/profile');
    await expect(authenticatedPage.locator('[data-testid="profile-form"]')).toBeVisible();

    // Step 2: Update profile information
    const updatedInfo = {
      firstName: 'Updated',
      lastName: 'Name',
      phone: '+1234567890',
    };

    await authenticatedPage.fill('[data-testid="first-name-input"]', updatedInfo.firstName);
    await authenticatedPage.fill('[data-testid="last-name-input"]', updatedInfo.lastName);
    await authenticatedPage.fill('[data-testid="phone-input"]', updatedInfo.phone);

    // Step 3: Save changes
    await authenticatedPage.click('[data-testid="save-profile-button"]');

    // Step 4: Verify success message
    await expect(authenticatedPage.locator('[data-testid="profile-updated"]')).toBeVisible();

    // Step 5: Verify changes persist after refresh
    await authenticatedPage.reload();
    await expect(authenticatedPage.locator('[data-testid="first-name-input"]')).toHaveValue(
      updatedInfo.firstName
    );
  });

  test('user can manage shipping addresses', async ({ authenticatedPage }) => {
    // Step 1: Navigate to addresses page
    await authenticatedPage.goto('/profile/addresses');
    await expect(authenticatedPage.locator('[data-testid="addresses-page"]')).toBeVisible();

    // Step 2: Add new address
    await authenticatedPage.click('[data-testid="add-address-button"]');
    
    const newAddress = {
      firstName: 'John',
      lastName: 'Doe',
      address: '456 New Street',
      city: 'New City',
      state: 'NY',
      zipCode: '10001',
      country: 'United States',
    };

    // Fill address form
    await authenticatedPage.fill('[data-testid="address-first-name"]', newAddress.firstName);
    await authenticatedPage.fill('[data-testid="address-last-name"]', newAddress.lastName);
    await authenticatedPage.fill('[data-testid="address-street"]', newAddress.address);
    await authenticatedPage.fill('[data-testid="address-city"]', newAddress.city);
    await authenticatedPage.selectOption('[data-testid="address-state"]', newAddress.state);
    await authenticatedPage.fill('[data-testid="address-zip"]', newAddress.zipCode);
    await authenticatedPage.selectOption('[data-testid="address-country"]', newAddress.country);

    // Step 3: Save address
    await authenticatedPage.click('[data-testid="save-address-button"]');

    // Step 4: Verify address appears in list
    const addressCards = authenticatedPage.locator('[data-testid="address-card"]');
    await expect(addressCards).toHaveCount({ min: 1 });
    await expect(addressCards.last()).toContainText(newAddress.address);

    // Step 5: Set as default address
    await addressCards.last().locator('[data-testid="set-default-address"]').click();
    await expect(addressCards.last()).toContainText('Default');

    // Step 6: Edit address
    await addressCards.last().locator('[data-testid="edit-address"]').click();
    await authenticatedPage.fill('[data-testid="address-street"]', '789 Updated Street');
    await authenticatedPage.click('[data-testid="save-address-button"]');
    await expect(addressCards.last()).toContainText('789 Updated Street');

    // Step 7: Delete address (except default)
    const nonDefaultAddress = addressCards.first();
    if (!(await nonDefaultAddress.locator('[data-testid="default-badge"]').isVisible())) {
      await nonDefaultAddress.locator('[data-testid="delete-address"]').click();
      await authenticatedPage.click('[data-testid="confirm-delete"]');
    }
  });

  test('user can view order history', async ({ authenticatedPage }) => {
    // Step 1: Navigate to orders page
    await authenticatedPage.goto('/profile/orders');
    await expect(authenticatedPage.locator('[data-testid="orders-page"]')).toBeVisible();

    // Step 2: Verify order list is displayed
    const orderCards = authenticatedPage.locator('[data-testid="order-card"]');
    
    if ((await orderCards.count()) > 0) {
      // Step 3: View order details
      await orderCards.first().click();
      await expect(authenticatedPage.locator('[data-testid="order-details"]')).toBeVisible();

      // Step 4: Verify order information
      await expect(authenticatedPage.locator('[data-testid="order-number"]')).toBeVisible();
      await expect(authenticatedPage.locator('[data-testid="order-status"]')).toBeVisible();
      await expect(authenticatedPage.locator('[data-testid="order-items"]')).toBeVisible();

      // Step 5: Test order tracking (if available)
      const trackingLink = authenticatedPage.locator('[data-testid="track-order"]');
      if (await trackingLink.isVisible()) {
        await trackingLink.click();
        await expect(authenticatedPage.locator('[data-testid="tracking-info"]')).toBeVisible();
      }
    } else {
      // No orders - verify empty state
      await expect(authenticatedPage.locator('[data-testid="no-orders"]')).toBeVisible();
    }
  });

  test('protected routes require authentication', async ({ guestPage }) => {
    const protectedRoutes = [
      '/dashboard',
      '/profile',
      '/profile/orders',
      '/profile/addresses',
      '/wishlist',
    ];

    for (const route of protectedRoutes) {
      await guestPage.goto(route);
      
      // Should redirect to sign-in
      await expect(guestPage).toHaveURL(/sign-in/);
      
      // Should have redirect parameter to return after login
      const url = new URL(guestPage.url());
      expect(url.searchParams.get('redirect')).toBeTruthy();
    }
  });

  test('authentication persists across browser sessions', async ({ guestPage }) => {
    // Step 1: Login
    await guestPage.goto('/sign-in');
    await guestPage.fill('[data-testid="email-input"]', testUsers.customer.email);
    await guestPage.fill('[data-testid="password-input"]', testUsers.customer.password);
    await guestPage.check('[data-testid="remember-me"]'); // Remember me checkbox
    await guestPage.click('[data-testid="signin-button"]');

    // Step 2: Verify login success
    await expect(guestPage).toHaveURL(/dashboard/);

    // Step 3: Simulate browser refresh/restart
    await guestPage.reload();
    await guestPage.waitForLoadState('networkidle');

    // Step 4: Verify still logged in
    await expect(guestPage.locator('[data-testid="user-menu"]')).toBeVisible();
    
    // Should not redirect to login
    await guestPage.goto('/profile');
    await expect(guestPage).toHaveURL(/profile/);
  });

  test('social login works correctly', async ({ guestPage }) => {
    // Skip if social login not configured
    await guestPage.goto('/sign-in');
    
    const googleLogin = guestPage.locator('[data-testid="google-login"]');
    const facebookLogin = guestPage.locator('[data-testid="facebook-login"]');
    
    if (await googleLogin.isVisible()) {
      // Test Google login flow (mock/test environment)
      await googleLogin.click();
      
      // In test environment, this might be mocked
      // Verify popup or redirect
      await expect(guestPage).toHaveURL(/google|oauth|dashboard/);
    }
    
    if (await facebookLogin.isVisible()) {
      // Test Facebook login flow
      await facebookLogin.click();
      await expect(guestPage).toHaveURL(/facebook|oauth|dashboard/);
    }
  });
});

test.describe('Authentication Security', () => {
  test('validates password strength requirements', async ({ guestPage }) => {
    await guestPage.goto('/sign-up');

    const weakPasswords = [
      '123', // Too short
      'password', // Common word
      '12345678', // Only numbers
      'abcdefgh', // Only letters
    ];

    for (const password of weakPasswords) {
      await guestPage.fill('[data-testid="password-input"]', password);
      await guestPage.fill('[data-testid="first-name-input"]', 'Test'); // Trigger validation
      
      const passwordError = guestPage.locator('[data-testid="password-error"]');
      await expect(passwordError).toBeVisible();
    }

    // Test strong password
    await guestPage.fill('[data-testid="password-input"]', 'StrongPassword123!');
    const passwordStrength = guestPage.locator('[data-testid="password-strength"]');
    await expect(passwordStrength).toContainText(/strong|good/i);
  });

  test('prevents multiple failed login attempts', async ({ guestPage }) => {
    await guestPage.goto('/sign-in');

    // Attempt multiple failed logins
    for (let i = 0; i < 5; i++) {
      await guestPage.fill('[data-testid="email-input"]', testUsers.customer.email);
      await guestPage.fill('[data-testid="password-input"]', 'wrongpassword');
      await guestPage.click('[data-testid="signin-button"]');
      
      await expect(guestPage.locator('[data-testid="login-error"]')).toBeVisible();
    }

    // After multiple attempts, should show rate limiting
    const rateLimitMessage = guestPage.locator('[data-testid="rate-limit-error"]');
    if (await rateLimitMessage.isVisible()) {
      await expect(rateLimitMessage).toContainText(/too many attempts|try again later/i);
    }
  });

  test('validates email format and uniqueness', async ({ guestPage }) => {
    await guestPage.goto('/sign-up');

    // Test invalid email formats
    const invalidEmails = [
      'invalid-email',
      'invalid@',
      '@invalid.com',
      'invalid..email@test.com',
    ];

    for (const email of invalidEmails) {
      await guestPage.fill('[data-testid="email-input"]', email);
      await guestPage.fill('[data-testid="first-name-input"]', 'Test'); // Trigger validation
      
      const emailError = guestPage.locator('[data-testid="email-error"]');
      await expect(emailError).toContainText(/valid email/i);
    }

    // Test existing email
    await guestPage.fill('[data-testid="email-input"]', testUsers.customer.email);
    await guestPage.fill('[data-testid="first-name-input"]', 'Test');
    await guestPage.fill('[data-testid="password-input"]', 'Password123!');
    await guestPage.click('[data-testid="signup-button"]');
    
    const duplicateError = guestPage.locator('[data-testid="email-exists-error"]');
    await expect(duplicateError).toContainText(/already exists|already registered/i);
  });
});