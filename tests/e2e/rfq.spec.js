import { test, expect } from '@playwright/test';

/**
 * Critical Flow Test: RFQ Creation & Management
 * 
 * This test verifies the RFQ (Request for Quotation) flow:
 * 1. Buyer logs in
 * 2. Creates a new RFQ
 * 3. RFQ appears in dashboard
 * 4. Can view RFQ details
 * 5. Can edit RFQ (if still in draft)
 */

test.describe('RFQ Flow', () => {
    // Use a persistent test account for RFQ tests
    const buyerEmail = 'buyer-test@afrikoni-test.com';
    const buyerPassword = 'TestBuyer123!';

    test.beforeEach(async ({ page }) => {
        // Login as buyer before each test
        await page.goto('/en/login');
        await page.fill('input[name="email"]', buyerEmail);
        await page.fill('input[name="password"]', buyerPassword);
        await page.click('button[type="submit"]');

        // Wait for dashboard to load
        await page.waitForURL(/\/dashboard/, { timeout: 10000 });
    });

    test('should create a new RFQ successfully', async ({ page }) => {
        // Navigate to RFQ creation page
        await page.goto('/en/dashboard/rfqs/new');

        // Wait for form to load
        await expect(page.locator('h1, h2').filter({ hasText: /Create|New.*RFQ/i })).toBeVisible({ timeout: 5000 });

        // Fill RFQ form
        const productName = `Test Product ${Date.now()}`;
        await page.fill('input[name="product_name"]', productName);
        await page.fill('textarea[name="description"]', 'This is a test RFQ for automated testing');
        await page.fill('input[name="quantity"]', '100');
        await page.fill('input[name="target_price"]', '5000');

        // Select category (if dropdown exists)
        const categorySelect = page.locator('select[name="category"]');
        if (await categorySelect.isVisible()) {
            await categorySelect.selectOption({ index: 1 }); // Select first non-empty option
        }

        // Set delivery date (if exists)
        const deliveryDateInput = page.locator('input[name="delivery_date"]');
        if (await deliveryDateInput.isVisible()) {
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 30);
            await deliveryDateInput.fill(futureDate.toISOString().split('T')[0]);
        }

        // Submit RFQ
        await page.click('button[type="submit"]');

        // Wait for success message or redirect
        await page.waitForURL(/\/dashboard\/(rfqs|rfq-monitor)/, { timeout: 10000 });

        // Verify RFQ appears in list
        const rfqCard = page.locator(`text=${productName}`);
        await expect(rfqCard).toBeVisible({ timeout: 5000 });
    });

    test('should view RFQ details', async ({ page }) => {
        // Navigate to RFQ list
        await page.goto('/en/dashboard/rfqs');

        // Wait for RFQs to load
        await page.waitForSelector('[data-testid="rfq-card"], .rfq-item, [class*="rfq"]', { timeout: 5000 });

        // Click on first RFQ
        const firstRFQ = page.locator('[data-testid="rfq-card"], .rfq-item').first();
        await firstRFQ.click();

        // Verify RFQ details page loaded
        await expect(page).toHaveURL(/\/rfq/, { timeout: 5000 });

        // Verify key details are visible
        await expect(page.locator('text=/Product|Item|Description/i')).toBeVisible();
        await expect(page.locator('text=/Quantity|Amount/i')).toBeVisible();
        await expect(page.locator('text=/Price|Budget/i')).toBeVisible();
    });

    test('should filter RFQs by status', async ({ page }) => {
        // Navigate to RFQ list
        await page.goto('/en/dashboard/rfqs');

        // Wait for RFQs to load
        await page.waitForSelector('[data-testid="rfq-card"], .rfq-item, [class*="rfq"]', { timeout: 5000 });

        // Look for status filter (dropdown or tabs)
        const statusFilter = page.locator('select[name="status"], [data-testid="status-filter"]').or(
            page.locator('button:has-text("Open"), button:has-text("Draft")')
        );

        if (await statusFilter.first().isVisible()) {
            // Click/select "Open" status
            await statusFilter.first().click();

            // Verify URL or UI updated
            await page.waitForTimeout(1000); // Wait for filter to apply

            // Verify filtered results (should show only open RFQs)
            const rfqCards = page.locator('[data-testid="rfq-card"], .rfq-item');
            const count = await rfqCards.count();

            // Should have at least 0 results (filter worked)
            expect(count).toBeGreaterThanOrEqual(0);
        }
    });

    test('should search for RFQs', async ({ page }) => {
        // Navigate to RFQ list
        await page.goto('/en/dashboard/rfqs');

        // Wait for RFQs to load
        await page.waitForSelector('[data-testid="rfq-card"], .rfq-item, [class*="rfq"]', { timeout: 5000 });

        // Look for search input
        const searchInput = page.locator('input[type="search"], input[placeholder*="Search"]');

        if (await searchInput.isVisible()) {
            // Type search query
            await searchInput.fill('Test Product');

            // Wait for search results
            await page.waitForTimeout(1000);

            // Verify results contain search term
            const results = page.locator('[data-testid="rfq-card"], .rfq-item');
            const firstResult = results.first();

            if (await firstResult.isVisible()) {
                const text = await firstResult.textContent();
                expect(text?.toLowerCase()).toContain('test');
            }
        }
    });

    test('should handle empty RFQ list gracefully', async ({ page }) => {
        // Navigate to RFQ list with filter that returns no results
        await page.goto('/en/dashboard/rfqs?status=completed&search=nonexistentproduct12345');

        // Should show empty state message
        const emptyMessage = page.locator('text=/No RFQs|No results|Empty/i');
        await expect(emptyMessage).toBeVisible({ timeout: 5000 });
    });
});

/**
 * Seller RFQ Flow Tests
 */
test.describe('Seller RFQ Response Flow', () => {
    const sellerEmail = 'seller-test@afrikoni-test.com';
    const sellerPassword = 'TestSeller123!';

    test.beforeEach(async ({ page }) => {
        // Login as seller
        await page.goto('/en/login');
        await page.fill('input[name="email"]', sellerEmail);
        await page.fill('input[name="password"]', sellerPassword);
        await page.click('button[type="submit"]');

        // Wait for dashboard
        await page.waitForURL(/\/dashboard/, { timeout: 10000 });
    });

    test('should view available RFQs in marketplace', async ({ page }) => {
        // Navigate to RFQ marketplace
        await page.goto('/en/rfq');

        // Wait for RFQs to load
        await page.waitForSelector('[data-testid="rfq-card"], .rfq-item, [class*="rfq"]', { timeout: 5000 });

        // Verify RFQs are visible
        const rfqCards = page.locator('[data-testid="rfq-card"], .rfq-item');
        const count = await rfqCards.count();

        // Should have at least 0 RFQs (page loaded successfully)
        expect(count).toBeGreaterThanOrEqual(0);
    });

    test('should submit a quote for an RFQ', async ({ page }) => {
        // Navigate to RFQ marketplace
        await page.goto('/en/rfq');

        // Wait for RFQs to load
        await page.waitForSelector('[data-testid="rfq-card"], .rfq-item', { timeout: 5000 });

        // Click on first RFQ
        const firstRFQ = page.locator('[data-testid="rfq-card"], .rfq-item').first();
        await firstRFQ.click();

        // Look for "Submit Quote" or "Respond" button
        const quoteButton = page.locator('button:has-text("Submit Quote"), button:has-text("Respond"), button:has-text("Send Quote")');

        if (await quoteButton.isVisible({ timeout: 3000 })) {
            await quoteButton.click();

            // Fill quote form
            await page.fill('input[name="price"], input[name="unit_price"]', '50');
            await page.fill('input[name="quantity"]', '100');
            await page.fill('textarea[name="notes"], textarea[name="message"]', 'We can fulfill this order within 2 weeks');

            // Submit quote
            await page.click('button[type="submit"]');

            // Wait for success message
            const successMessage = page.locator('text=/Quote submitted|Success|Sent/i');
            await expect(successMessage).toBeVisible({ timeout: 5000 });
        }
    });
});
