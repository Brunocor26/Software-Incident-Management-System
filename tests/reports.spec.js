const { test, expect } = require('@playwright/test');

test.describe('Reports API', () => {
  test('GET /api/incidents should support date filtering', async ({ request }) => {
    const response = await request.get('http://127.0.0.1:3000/api/incidents?startDate=2023-01-01&endDate=2025-12-31');
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(Array.isArray(data.items)).toBeTruthy();
  });

  test('GET /api/incidents/report/pdf should return a PDF', async ({ request }) => {
    const response = await request.get('http://127.0.0.1:3000/api/incidents/report/pdf');
    expect(response.ok()).toBeTruthy();
    expect(response.headers()['content-type']).toBe('application/pdf');
  });
});
