// apps/api/test/auth.test.ts
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/index.js';
import { db } from '../src/db.js';
import { signToken } from '../src/lib/jwt.js';

describe('Authentication & Authorization', () => {
  const testEmail = `test-auth-${Date.now()}@example.com`;
  const testPassword = 'Password123!';
  let testUserToken = '';
  let testUserId = '';

  after(async () => {
    // Clean up created test users
    await db.component.deleteMany({ where: { user: { email: { contains: 'test-auth-' } } } });
    await db.user.deleteMany({ where: { email: { contains: 'test-auth-' } } });
  });

  describe('POST /auth/signup', () => {
    it('successfully registers a new user and returns a token with user data', async () => {
      const res = await app.request('/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail, password: testPassword }),
      });

      assert.equal(res.status, 201);
      const data = await res.json();
      assert.ok(data.token);
      assert.equal(data.user.email, testEmail);
      assert.ok(data.user.id);
      testUserToken = data.token;
      testUserId = data.user.id;
    });

    it('rejects duplicate registration with 400', async () => {
      const res = await app.request('/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail, password: testPassword }),
      });

      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.error, 'Email already in use');
    });

    it('rejects missing or empty email payload with 400', async () => {
      const res = await app.request('/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: testPassword }),
      });

      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.error, 'Email and password are required');
    });

    it('rejects missing or empty password payload with 400', async () => {
      const res = await app.request('/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: `unique-${Date.now()}@example.com` }),
      });

      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.error, 'Email and password are required');
    });

    it('rejects malformed non-JSON payload with 400', async () => {
      const res = await app.request('/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid-json-content',
      });

      assert.equal(res.status, 400);
    });
  });

  describe('POST /auth/signin', () => {
    it('successfully logs in with valid credentials and returns a token', async () => {
      const res = await app.request('/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail, password: testPassword }),
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.ok(data.token);
      assert.equal(data.user.email, testEmail);
    });

    it('rejects login with incorrect password with 401', async () => {
      const res = await app.request('/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail, password: 'WrongPassword999!' }),
      });

      assert.equal(res.status, 401);
      const data = await res.json();
      assert.equal(data.error, 'Invalid credentials');
    });

    it('rejects login with nonexistent email with 401', async () => {
      const res = await app.request('/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'nonexistent@example.com', password: testPassword }),
      });

      assert.equal(res.status, 401);
      const data = await res.json();
      assert.equal(data.error, 'Invalid credentials');
    });

    it('rejects signin with invalid payload with 400', async () => {
      const res = await app.request('/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail }),
      });

      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.error, 'Email and password are required');
    });
  });

  describe('Protected Endpoints & Token Validation', () => {
    it('blocks access to GET /components without Authorization header with 401', async () => {
      const res = await app.request('/components', { method: 'GET' });
      assert.equal(res.status, 401);
      const data = await res.json();
      assert.equal(data.error, 'Unauthorized');
    });

    it('blocks access to POST /components without Authorization header with 401', async () => {
      const res = await app.request('/components', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: 'test', code: '<div />' }),
      });
      assert.equal(res.status, 401);
    });

    it('blocks access to DELETE /components/:id without Authorization header with 401', async () => {
      const res = await app.request('/components/some-id', { method: 'DELETE' });
      assert.equal(res.status, 401);
    });

    it('blocks access to POST /generate without Authorization header with 401', async () => {
      const res = await app.request('/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: 'Card' }),
      });
      assert.equal(res.status, 401);
    });

    it('rejects malformed Bearer token with 401', async () => {
      const res = await app.request('/components', {
        method: 'GET',
        headers: { Authorization: 'Bearer not-a-valid-jwt' },
      });
      assert.equal(res.status, 401);
    });

    it('rejects non-Bearer authorization scheme with 401', async () => {
      const res = await app.request('/components', {
        method: 'GET',
        headers: { Authorization: 'Basic dXNlcjpwYXNz' },
      });
      assert.equal(res.status, 401);
    });

    it('rejects expired token with 401', async () => {
      const expiredToken = signToken('any-user-id', '-1s');
      const res = await app.request('/components', {
        method: 'GET',
        headers: { Authorization: `Bearer ${expiredToken}` },
      });
      assert.equal(res.status, 401);
      const data = await res.json();
      assert.equal(data.error, 'Unauthorized');
    });
  });

  describe('Cross-User Authorization (Tenant Isolation)', () => {
    let userAId = '';
    let userAToken = '';
    let userBToken = '';
    let userAComponentId = '';

    before(async () => {
      // Create User A
      const emailA = `test-user-a-${Date.now()}@example.com`;
      const resA = await app.request('/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailA, password: 'PasswordA123!' }),
      });
      const dataA = await resA.json();
      userAId = dataA.user.id;
      userAToken = dataA.token;

      // Create User B
      const emailB = `test-user-b-${Date.now()}@example.com`;
      const resB = await app.request('/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailB, password: 'PasswordB123!' }),
      });
      const dataB = await resB.json();
      userBToken = dataB.token;

      // User A creates a component
      const compRes = await app.request('/components', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userAToken}`,
        },
        body: JSON.stringify({
          prompt: "User A's Private Card",
          code: '<div className="p-4">Private to User A</div>',
          title: "User A's Card",
        }),
      });
      const compData = await compRes.json();
      userAComponentId = compData.id;
    });

    it('prevents User B from deleting User A component by identifier', async () => {
      // User B tries to delete User A's component
      const deleteRes = await app.request(`/components/${userAComponentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${userBToken}` },
      });

      // Must fail with 404 (not found in User B's scope)
      assert.equal(deleteRes.status, 404);

      // Verify User A's component still exists in database
      const componentInDb = await db.component.findUnique({
        where: { id: userAComponentId },
      });
      assert.ok(componentInDb);
      assert.equal(componentInDb.userId, userAId);
    });

    it('prevents User B from listing User A components in GET /components', async () => {
      const listRes = await app.request('/components', {
        method: 'GET',
        headers: { Authorization: `Bearer ${userBToken}` },
      });

      assert.equal(listRes.status, 200);
      const components = await listRes.json();
      const hasUserAComp = components.some((c: any) => c.id === userAComponentId);
      assert.equal(hasUserAComp, false);
    });
  });
});
