const { test, expect } = require('@playwright/test');

test('has title', async ({ page }) => {
    await page.goto('/');

    // Expect a title "to contain" a substring.
    await expect(page).toHaveTitle(/Login/);
});

test('login form is visible', async ({ page }) => {
    await page.goto('/');

    // Check if the login form exists
    const loginForm = page.locator('form');
    await expect(loginForm).toBeVisible();
});
