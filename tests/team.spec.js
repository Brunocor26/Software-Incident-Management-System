const { test, expect } = require('@playwright/test');

test.describe('Team Management', () => {
  test('GET /users should return list of users', async ({ request }) => {
    const response = await request.get('http://127.0.0.1:3000/users');
    expect(response.ok()).toBeTruthy();
    const users = await response.json();
    expect(Array.isArray(users)).toBeTruthy();
    expect(users.length).toBeGreaterThan(0);
  });

  test('Settings page should display team members', async ({ page }) => {
    await page.goto('http://127.0.0.1:8080/settings/settings.html');
    await expect(page.locator('#team-members-body tr')).not.toHaveCount(0);
    await expect(page.locator('#team-members-body')).toContainText('@'); // Check for email
  });
});
