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

        // Dismiss cookie banner if present
        const acceptCookies = page.locator('button:has-text("Accept all"), button:has-text("Accept cookies"), button:has-text("I agree")').first();
        try {
            if (await acceptCookies.isVisible({ timeout: 2000 })) {
                await acceptCookies.click();
            }
        } catch (e) {
            // Ignore if button not found or already gone
        }

        // Wait for page to load
        await expect(page).toHaveTitle(/Afrikoni/);

        // Fill signup form
        await page.fill('input[name="email"]', testEmail);
        await page.fill('input[name="password"]', testPassword);
        await page.fill('input[name="fullName"]', 'Test User');

        // Select role (buyer) - NOT in current signup flow
        // await page.click('input[value="buyer"]');

        // Submit form
        await page.click('button[type="submit"]');

        // Wait for redirect to dashboard or success message
        try {
            await page.waitForURL(/\/(dashboard|verify-email|auth\/post-login)/, { timeout: 5000 });
        } catch (e) {
            // If timeout, check if success message is visible (implies email verification needed)
            const successMessage = page.getByText(/Account created|Welcome/i).first();
            if (await successMessage.isVisible()) {
                console.log('Signup successful (no redirect) - proceeding to login');
            } else {
                console.log('Signup wait timed out without success message');
                // Don't throw yet, let the next steps fail if really broken
            }
        }

        // Check if we need to login manually
        const currentURL = page.url();
        const needsLogin = currentURL.includes('signup') || currentURL.includes('login') || currentURL.includes('verify-email');

        if (needsLogin) {
            console.log('Manual login required...');

            // Navigate to login if not already there
            if (!currentURL.includes('login')) {
                await page.goto('/en/login');
            }

            // Fill login form
            await page.fill('input[name="email"]', testEmail);
            await page.fill('input[name="password"]', testPassword);

            // Submit login
            await page.click('button[type="submit"]');

            // Wait for dashboard
            await page.waitForURL(/\/dashboard/, { timeout: 15000 });
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

        // Verify error message is shown (Sonner toast)
        const errorMessage = page.getByText(/Invalid|incorrect|failed/i).first();
        await expect(errorMessage).toBeVisible({ timeout: 10000 });
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
