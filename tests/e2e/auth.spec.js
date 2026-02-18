import { test, expect } from '@playwright/test';

/**
 * Critical Flow Test: Signup → Login → Dashboard
 * 
 * This test verifies the most critical user journey:
 * 1. User can sign up for a new account
 * 2. User can log in with credentials
 * 3. Dashboard loads successfully
 * 4. User profile is displayed correctly
 */

test.describe('Authentication Flow', () => {
    const testEmail = `test-${Date.now()}@afrikoni-test.com`;
    const testPassword = 'TestPassword123!';
    const testCompanyName = 'Test Company Ltd';

    test('should complete full signup and login flow', async ({ page }) => {
        // Navigate to signup page
        await page.goto('/en/signup');

        // Wait for page to load
        await expect(page).toHaveTitle(/Afrikoni/);

        // Fill signup form
        await page.fill('input[name="email"]', testEmail);
        await page.fill('input[name="password"]', testPassword);
        await page.fill('input[name="full_name"]', 'Test User');
        await page.fill('input[name="company_name"]', testCompanyName);

        // Select role (buyer)
        await page.click('input[value="buyer"]');

        // Submit form
        await page.click('button[type="submit"]');

        // Wait for redirect to dashboard or email verification
        await page.waitForURL(/\/(dashboard|verify-email)/, { timeout: 10000 });

        // If email verification is required, skip to login test
        const currentURL = page.url();
        if (currentURL.includes('verify-email')) {
            console.log('Email verification required - skipping to login test');

            // Navigate to login
            await page.goto('/en/login');

            // Fill login form
            await page.fill('input[name="email"]', testEmail);
            await page.fill('input[name="password"]', testPassword);

            // Submit login
            await page.click('button[type="submit"]');

            // Wait for dashboard
            await page.waitForURL(/\/dashboard/, { timeout: 10000 });
        }

        // Verify dashboard loaded
        await expect(page).toHaveURL(/\/dashboard/);

        // Verify user is logged in (check for user menu or profile)
        const userMenu = page.locator('[data-testid="user-menu"]').or(page.locator('text=/Test User|' + testEmail + '/'));
        await expect(userMenu).toBeVisible({ timeout: 5000 });

        // Verify company name is displayed
        const companyDisplay = page.locator(`text=${testCompanyName}`);
        await expect(companyDisplay).toBeVisible({ timeout: 5000 });
    });

    test('should show error for invalid login', async ({ page }) => {
        await page.goto('/en/login');

        // Try to login with invalid credentials
        await page.fill('input[name="email"]', 'invalid@example.com');
        await page.fill('input[name="password"]', 'wrongpassword');
        await page.click('button[type="submit"]');

        // Verify error message is shown
        const errorMessage = page.locator('text=/Invalid|incorrect|failed/i');
        await expect(errorMessage).toBeVisible({ timeout: 5000 });
    });

    test('should logout successfully', async ({ page }) => {
        // First login
        await page.goto('/en/login');
        await page.fill('input[name="email"]', testEmail);
        await page.fill('input[name="password"]', testPassword);
        await page.click('button[type="submit"]');

        // Wait for dashboard
        await page.waitForURL(/\/dashboard/, { timeout: 10000 });

        // Click logout button
        const logoutButton = page.locator('[data-testid="logout-button"]').or(page.locator('text=/Logout|Sign Out/i'));
        await logoutButton.click();

        // Verify redirected to login
        await page.waitForURL(/\/login/, { timeout: 5000 });

        // Verify user is logged out (login form is visible)
        const loginForm = page.locator('input[name="email"]');
        await expect(loginForm).toBeVisible();
    });
});
