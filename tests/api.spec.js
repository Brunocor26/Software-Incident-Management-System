const { test, expect, request } = require('@playwright/test');

test.describe('API Tests', () => {
    const testUser = {
        id: Math.floor(Math.random() * 10000),
        name: 'Test User',
        email: `test${Date.now()}@example.com`,
        password: 'password123',
        papel: 'admin'
    };

    test('should register a new user', async ({ request }) => {
        const response = await request.post('http://127.0.0.1:3000/users', {
            data: testUser
        });
        expect(response.ok()).toBeTruthy();
        const body = await response.json();
        expect(body.email).toBe(testUser.email);

        // Cleanup
        await request.delete(`http://127.0.0.1:3000/users/${testUser.email}`);
    });

    test('should login with the registered user', async ({ request }) => {
        // First register the user (if running independently) or assume it exists from previous test?
        // Better to make tests independent.
        // Re-registering might fail if unique constraint.
        // Let's register a unique user for this test.
        const loginUser = { ...testUser, email: `login${Date.now()}@example.com` };

        await request.post('http://127.0.0.1:3000/users', {
            data: loginUser
        });

        const response = await request.post('http://127.0.0.1:3000/login', {
            data: {
                email: loginUser.email,
                password: loginUser.password
            }
        });

        expect(response.ok()).toBeTruthy();
        const body = await response.json();
        expect(body.token).toBeDefined();
        expect(body.message).toBe('Login bem-sucedido!');

        // Cleanup
        await request.delete(`http://127.0.0.1:3000/users/${loginUser.email}`);
    });
});
