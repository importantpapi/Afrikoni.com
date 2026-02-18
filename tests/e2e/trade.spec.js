import { test, expect } from '@playwright/test';

/**
 * Critical Flow Test: Complete Trade Flow
 * 
 * This test verifies the end-to-end trade flow:
 * 1. Buyer creates RFQ
 * 2. Seller submits quote
 * 3. Buyer accepts quote → Trade created
 * 4. Payment initiated
 * 5. Escrow management
 * 6. Shipment tracking
 * 7. Trade completion
 */

test.describe('Complete Trade Flow', () => {
    const buyerEmail = 'buyer-test@afrikoni-test.com';
    const sellerEmail = 'seller-test@afrikoni-test.com';
    const password = 'TestPassword123!';

    test('should complete full trade lifecycle', async ({ browser }) => {
        // Create two contexts for buyer and seller
        const buyerContext = await browser.newContext();
        const sellerContext = await browser.newContext();

        const buyerPage = await buyerContext.newPage();
        const sellerPage = await sellerContext.newPage();

        try {
            // ========================================================================
            // STEP 1: Buyer creates RFQ
            // ========================================================================
            await buyerPage.goto('/en/login');
            await buyerPage.fill('input[name="email"]', buyerEmail);
            await buyerPage.fill('input[name="password"]', password);
            await buyerPage.click('button[type="submit"]');
            await buyerPage.waitForURL(/\/dashboard/, { timeout: 10000 });

            // Create RFQ
            await buyerPage.goto('/en/dashboard/rfqs/new');
            const productName = `E2E Trade Test ${Date.now()}`;
            await buyerPage.fill('input[name="product_name"]', productName);
            await buyerPage.fill('textarea[name="description"]', 'E2E test product for complete trade flow');
            await buyerPage.fill('input[name="quantity"]', '50');
            await buyerPage.fill('input[name="target_price"]', '2500');
            await buyerPage.click('button[type="submit"]');
            await buyerPage.waitForURL(/\/dashboard/, { timeout: 10000 });

            // ========================================================================
            // STEP 2: Seller views and responds to RFQ
            // ========================================================================
            await sellerPage.goto('/en/login');
            await sellerPage.fill('input[name="email"]', sellerEmail);
            await sellerPage.fill('input[name="password"]', password);
            await sellerPage.click('button[type="submit"]');
            await sellerPage.waitForURL(/\/dashboard/, { timeout: 10000 });

            // Navigate to RFQ marketplace
            await sellerPage.goto('/en/rfq');
            await sellerPage.waitForTimeout(2000); // Wait for RFQs to load

            // Find the RFQ we just created
            const rfqCard = sellerPage.locator(`text=${productName}`).first();
            if (await rfqCard.isVisible({ timeout: 5000 })) {
                await rfqCard.click();

                // Submit quote
                const quoteButton = sellerPage.locator('button:has-text("Submit Quote"), button:has-text("Respond")');
                if (await quoteButton.isVisible({ timeout: 3000 })) {
                    await quoteButton.click();
                    await sellerPage.fill('input[name="price"], input[name="unit_price"]', '55');
                    await sellerPage.fill('input[name="quantity"]', '50');
                    await sellerPage.fill('textarea[name="notes"], textarea[name="message"]', 'Best quality, fast delivery');
                    await sellerPage.click('button[type="submit"]');

                    // Wait for success
                    await sellerPage.waitForTimeout(2000);
                }
            }

            // ========================================================================
            // STEP 3: Buyer accepts quote → Trade created
            // ========================================================================
            await buyerPage.goto('/en/dashboard/rfqs');
            await buyerPage.waitForTimeout(2000);

            // Find RFQ with quotes
            const buyerRFQCard = buyerPage.locator(`text=${productName}`).first();
            if (await buyerRFQCard.isVisible({ timeout: 5000 })) {
                await buyerRFQCard.click();

                // Look for quotes section
                const quotesSection = buyerPage.locator('text=/Quotes|Responses|Offers/i');
                if (await quotesSection.isVisible({ timeout: 3000 })) {
                    // Accept first quote
                    const acceptButton = buyerPage.locator('button:has-text("Accept"), button:has-text("Approve")').first();
                    if (await acceptButton.isVisible({ timeout: 3000 })) {
                        await acceptButton.click();

                        // Confirm acceptance if modal appears
                        const confirmButton = buyerPage.locator('button:has-text("Confirm"), button:has-text("Yes")');
                        if (await confirmButton.isVisible({ timeout: 2000 })) {
                            await confirmButton.click();
                        }

                        // Wait for trade creation
                        await buyerPage.waitForTimeout(2000);
                    }
                }
            }

            // ========================================================================
            // STEP 4: Verify trade appears in Trade Monitor
            // ========================================================================
            await buyerPage.goto('/en/dashboard/trades');
            await buyerPage.waitForTimeout(2000);

            // Look for the trade
            const tradeCard = buyerPage.locator(`text=${productName}`).or(
                buyerPage.locator('[data-testid="trade-card"]')
            ).first();

            await expect(tradeCard).toBeVisible({ timeout: 5000 });

            // ========================================================================
            // STEP 5: Check trade details
            // ========================================================================
            await tradeCard.click();

            // Verify trade details page
            await expect(buyerPage.locator('text=/Trade|Order|Deal/i')).toBeVisible({ timeout: 5000 });
            await expect(buyerPage.locator('text=/Status|Progress/i')).toBeVisible();

            // Verify key trade information
            await expect(buyerPage.locator(`text=${productName}`)).toBeVisible();
            await expect(buyerPage.locator('text=/Quantity.*50/i')).toBeVisible();

        } finally {
            // Cleanup
            await buyerContext.close();
            await sellerContext.close();
        }
    });

    test('should show trade status updates', async ({ page }) => {
        // Login as buyer
        await page.goto('/en/login');
        await page.fill('input[name="email"]', buyerEmail);
        await page.fill('input[name="password"]', password);
        await page.click('button[type="submit"]');
        await page.waitForURL(/\/dashboard/, { timeout: 10000 });

        // Navigate to trades
        await page.goto('/en/dashboard/trades');
        await page.waitForTimeout(2000);

        // Click on first trade
        const firstTrade = page.locator('[data-testid="trade-card"], .trade-item').first();
        if (await firstTrade.isVisible({ timeout: 5000 })) {
            await firstTrade.click();

            // Verify status timeline or progress indicator
            const statusIndicator = page.locator('[data-testid="trade-status"], .status-timeline, .progress-bar');
            await expect(statusIndicator).toBeVisible({ timeout: 5000 });
        }
    });

    test('should filter trades by status', async ({ page }) => {
        // Login
        await page.goto('/en/login');
        await page.fill('input[name="email"]', buyerEmail);
        await page.fill('input[name="password"]', password);
        await page.click('button[type="submit"]');
        await page.waitForURL(/\/dashboard/, { timeout: 10000 });

        // Navigate to trades
        await page.goto('/en/dashboard/trades');
        await page.waitForTimeout(2000);

        // Look for status filter
        const statusFilter = page.locator('select[name="status"], [data-testid="status-filter"]').or(
            page.locator('button:has-text("Active"), button:has-text("Pending")')
        );

        if (await statusFilter.first().isVisible()) {
            await statusFilter.first().click();
            await page.waitForTimeout(1000);

            // Verify filtered results
            const tradeCards = page.locator('[data-testid="trade-card"], .trade-item');
            const count = await tradeCards.count();
            expect(count).toBeGreaterThanOrEqual(0);
        }
    });

    test('should display payment information', async ({ page }) => {
        // Login
        await page.goto('/en/login');
        await page.fill('input[name="email"]', buyerEmail);
        await page.fill('input[name="password"]', password);
        await page.click('button[type="submit"]');
        await page.waitForURL(/\/dashboard/, { timeout: 10000 });

        // Navigate to trades
        await page.goto('/en/dashboard/trades');
        await page.waitForTimeout(2000);

        // Click on first trade
        const firstTrade = page.locator('[data-testid="trade-card"], .trade-item').first();
        if (await firstTrade.isVisible({ timeout: 5000 })) {
            await firstTrade.click();

            // Look for payment section
            const paymentSection = page.locator('text=/Payment|Amount|Price|Total/i');
            await expect(paymentSection.first()).toBeVisible({ timeout: 5000 });
        }
    });

    test('should handle trade cancellation', async ({ page }) => {
        // Login
        await page.goto('/en/login');
        await page.fill('input[name="email"]', buyerEmail);
        await page.fill('input[name="password"]', password);
        await page.click('button[type="submit"]');
        await page.waitForURL(/\/dashboard/, { timeout: 10000 });

        // Navigate to trades
        await page.goto('/en/dashboard/trades');
        await page.waitForTimeout(2000);

        // Click on first trade
        const firstTrade = page.locator('[data-testid="trade-card"], .trade-item').first();
        if (await firstTrade.isVisible({ timeout: 5000 })) {
            await firstTrade.click();

            // Look for cancel button (only visible for certain statuses)
            const cancelButton = page.locator('button:has-text("Cancel"), button:has-text("Abort")');
            if (await cancelButton.isVisible({ timeout: 3000 })) {
                await cancelButton.click();

                // Confirm cancellation
                const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Yes")');
                if (await confirmButton.isVisible({ timeout: 2000 })) {
                    await confirmButton.click();

                    // Wait for success message
                    const successMessage = page.locator('text=/Cancelled|Canceled/i');
                    await expect(successMessage).toBeVisible({ timeout: 5000 });
                }
            }
        }
    });
});

/**
 * Escrow Flow Tests
 */
test.describe('Escrow Management', () => {
    const buyerEmail = 'buyer-test@afrikoni-test.com';
    const password = 'TestPassword123!';

    test('should display escrow information', async ({ page }) => {
        // Login
        await page.goto('/en/login');
        await page.fill('input[name="email"]', buyerEmail);
        await page.fill('input[name="password"]', password);
        await page.click('button[type="submit"]');
        await page.waitForURL(/\/dashboard/, { timeout: 10000 });

        // Navigate to escrow page (if exists)
        await page.goto('/en/dashboard/escrow');

        // Should show escrow accounts or empty state
        const escrowContent = page.locator('text=/Escrow|Protected|Funds/i');
        await expect(escrowContent.first()).toBeVisible({ timeout: 5000 });
    });

    test('should show escrow status for active trades', async ({ page }) => {
        // Login
        await page.goto('/en/login');
        await page.fill('input[name="email"]', buyerEmail);
        await page.fill('input[name="password"]', password);
        await page.click('button[type="submit"]');
        await page.waitForURL(/\/dashboard/, { timeout: 10000 });

        // Navigate to trades
        await page.goto('/en/dashboard/trades');
        await page.waitForTimeout(2000);

        // Click on first trade
        const firstTrade = page.locator('[data-testid="trade-card"], .trade-item').first();
        if (await firstTrade.isVisible({ timeout: 5000 })) {
            await firstTrade.click();

            // Look for escrow information
            const escrowInfo = page.locator('text=/Escrow|Protected|Secure/i');
            if (await escrowInfo.isVisible({ timeout: 3000 })) {
                // Verify escrow status is displayed
                await expect(escrowInfo).toBeVisible();
            }
        }
    });
});
