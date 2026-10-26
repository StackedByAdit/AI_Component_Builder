// apps/api/test/components.test.ts
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/index.js';
import { db } from '../src/db.js';

describe('Component Persistence & Management', () => {
  const userEmail = `test-comp-user-${Date.now()}@example.com`;
  let userToken = '';
  let userId = '';
  let createdComponentId = '';

  before(async () => {
    // Create an authenticated test user
    const res = await app.request('/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userEmail, password: 'SecurePassword123!' }),
    });
    const data = await res.json();
    userToken = data.token;
    userId = data.user.id;
  });

  after(async () => {
    await db.component.deleteMany({ where: { user: { email: { contains: 'test-comp-user-' } } } });
    await db.user.deleteMany({ where: { email: { contains: 'test-comp-user-' } } });
  });

  describe('POST /components (Save Component)', () => {
    it('successfully saves a valid component and associates with authenticated userId', async () => {
      const payload = {
        prompt: 'A sleek pricing card with monthly/annual toggle',
        code: '<div className="p-6 bg-white rounded-xl shadow-md"><h2>Pricing</h2></div>',
        title: 'Sleek Pricing Card',
      };

      const res = await app.request('/components', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify(payload),
      });

      assert.equal(res.status, 201);
      const data = await res.json();
      assert.ok(data.id);
      assert.equal(data.prompt, payload.prompt);
      assert.equal(data.code, payload.code);
      assert.equal(data.title, payload.title);
      assert.equal(data.userId, userId);
      createdComponentId = data.id;
    });

    it('defaults title from prompt if title is omitted', async () => {
      const payload = {
        prompt: 'A quick badge component',
        code: '<div className="badge">Active</div>',
      };

      const res = await app.request('/components', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify(payload),
      });

      assert.equal(res.status, 201);
      const data = await res.json();
      assert.equal(data.title, 'A quick badge component');
    });

    it('rejects payload with missing code with 400', async () => {
      const res = await app.request('/components', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({ prompt: 'A missing code component' }),
      });

      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.error, 'Prompt and code are required');
    });

    it('rejects payload with missing or empty prompt with 400', async () => {
      const res = await app.request('/components', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({ prompt: '   ', code: '<div />' }),
      });

      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.error, 'Prompt and code are required');
    });

    it('rejects malformed non-JSON body with 400', async () => {
      const res = await app.request('/components', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`,
        },
        body: 'non-json-content',
      });

      assert.equal(res.status, 400);
    });
  });

  describe('GET /components (Retrieve Components)', () => {
    it('retrieves saved components for the authenticated user ordered by createdAt descending', async () => {
      const res = await app.request('/components', {
        method: 'GET',
        headers: { Authorization: `Bearer ${userToken}` },
      });

      assert.equal(res.status, 200);
      const components = await res.json();
      assert.ok(Array.isArray(components));
      assert.ok(components.length >= 2);

      // Verify ownership
      for (const comp of components) {
        assert.equal(comp.userId, userId);
      }

      // Verify ordering
      for (let i = 0; i < components.length - 1; i++) {
        const current = new Date(components[i].createdAt).getTime();
        const next = new Date(components[i + 1].createdAt).getTime();
        assert.ok(current >= next);
      }
    });
  });

  describe('DELETE /components/:id (Delete Component)', () => {
    it('successfully deletes an existing component belonging to user', async () => {
      assert.ok(createdComponentId);

      const res = await app.request(`/components/${createdComponentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${userToken}` },
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.ok, true);

      // Verify removal from database
      const checkInDb = await db.component.findUnique({
        where: { id: createdComponentId },
      });
      assert.equal(checkInDb, null);
    });

    it('returns 404 when attempting to delete a nonexistent component ID', async () => {
      const res = await app.request('/components/nonexistent-component-id-999', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${userToken}` },
      });

      assert.equal(res.status, 404);
      const data = await res.json();
      assert.equal(data.error, 'Component not found');
    });
  });

  describe('Persistence Error Handling', () => {
    it('returns 500 when database throws an exception during component creation', async () => {
      const originalCreate = db.component.create;
      try {
        (db.component as any).create = async () => {
          throw new Error('Database connection lost');
        };

        const res = await app.request('/components', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${userToken}`,
          },
          body: JSON.stringify({ prompt: 'test', code: '<div />' }),
        });

        assert.equal(res.status, 500);
        const data = await res.json();
        assert.equal(data.error, 'Failed to save component');
      } finally {
        db.component.create = originalCreate;
      }
    });

    it('returns 500 when database throws an exception during component retrieval', async () => {
      const originalFindMany = db.component.findMany;
      try {
        (db.component as any).findMany = async () => {
          throw new Error('Database connection lost');
        };

        const res = await app.request('/components', {
          method: 'GET',
          headers: { Authorization: `Bearer ${userToken}` },
        });

        assert.equal(res.status, 500);
        const data = await res.json();
        assert.equal(data.error, 'Failed to retrieve components');
      } finally {
        db.component.findMany = originalFindMany;
      }
    });
  });
});
