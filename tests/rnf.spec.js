// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Non-Functional Requirements (RNFs)', () => {

  test('RNF1: System should be fast (response time < 3s)', async ({ page }) => {
    const start = Date.now();
    await page.goto('/login/login.html');
    const end = Date.now();
    const duration = end - start;
    console.log(`Page load time: ${duration}ms`);
    expect(duration).toBeLessThan(3000);
  });

  test('RNF2: Interface should be intuitive and minimize mandatory fields', async ({ page }) => {
    await page.goto('/login/login.html');
    await expect(page.locator('#username')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    
    const inputs = await page.locator('input:visible').count();
    expect(inputs).toBeLessThan(5);
  });

  test('RNF3: System should use secure authentication and data encryption', async ({ page }) => {
    await page.goto('/login/login.html');
    const passwordField = page.locator('#password');
    await expect(passwordField).toHaveAttribute('type', 'password');
  });

  test('RNF6: Interface should follow good usability practices', async ({ page }) => {
    await page.goto('/login/login.html');
    await expect(page).toHaveTitle(/Login|Incident Management/i);
    
    const viewportMeta = page.locator('meta[name="viewport"]');
    await expect(viewportMeta).toHaveCount(1);
  });

});
