const { test, expect } = require('@playwright/test');

test('has title', async ({ page }) => {
    await page.goto('/login/login.html');

    // Expect a title "to contain" a substring.
    await expect(page).toHaveTitle(/Login/);
});

test('login form is visible', async ({ page }) => {
    await page.goto('/login/login.html');

    // Check if the login form exists
    const loginForm = page.locator('form');
    await expect(loginForm).toBeVisible();
});
