// apps/api/test/e2e.test.ts
// purpose: end-to-end application lifecycle test: auth -> generate -> render check -> save -> retrieve -> delete

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/index.js';
import { db } from '../src/db.js';
import { verifyJsxRender } from '../benchmark/renderValidator.js';

describe('End-to-End User Flow', () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.GEMINI_API_KEY;
  const originalKeys = process.env.GEMINI_API_KEYS;

  const userEmail = `e2e-user-${Date.now()}@example.com`;
  const userPassword = 'E2EPassword123!';
  let authToken = '';
  let userId = '';
  let generatedCode = '';
  let savedComponentId = '';

  const mockGeneratedJsx =
    '<div className="p-6 max-w-sm mx-auto bg-white rounded-2xl shadow-md border border-gray-100">' +
    '<h3 className="text-lg font-bold text-gray-900">E2E Card</h3>' +
    '<p className="text-sm text-gray-500">End-to-end generated and persisted component.</p>' +
    '</div>';

  before(async () => {
    process.env.GEMINI_API_KEY = 'AIzaSyD_MOCK_KEY';
    delete process.env.GEMINI_API_KEYS;

    // Mock upstream Gemini fetch response deterministically
    globalThis.fetch = async () => {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [{ text: JSON.stringify({ jsx: mockGeneratedJsx }) }],
              },
            },
          ],
        }),
      } as unknown as Response;
    };
  });

  after(async () => {
    globalThis.fetch = originalFetch;
    process.env.GEMINI_API_KEY = originalKey;
    if (originalKeys !== undefined) {
      process.env.GEMINI_API_KEYS = originalKeys;
    }

    // Clean up created test data
    await db.component.deleteMany({ where: { user: { email: { contains: 'e2e-user-' } } } });
    await db.user.deleteMany({ where: { email: { contains: 'e2e-user-' } } });
  });

  it('Step 1: Authenticates new user via registration', async () => {
    const res = await app.request('/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userEmail, password: userPassword }),
    });

    assert.equal(res.status, 201);
    const data = await res.json();
    assert.ok(data.token);
    assert.equal(data.user.email, userEmail);
    assert.ok(data.user.id);

    authToken = data.token;
    userId = data.user.id;
  });

  it('Step 2: Generates a React component via AI pipeline', async () => {
    assert.ok(authToken);

    const res = await app.request('/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ prompt: 'A simple card' }),
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(data.code);
    assert.equal(data.code, mockGeneratedJsx);
    generatedCode = data.code;
  });

  it('Step 3: Verifies that the preview renders without runtime exceptions', () => {
    assert.ok(generatedCode);

    // Verify headless execution of the component tree in React runtime
    const renderResult = verifyJsxRender(generatedCode);
    assert.equal(renderResult.rendered, true);
    assert.equal(renderResult.error, undefined);
    assert.equal(renderResult.element?.type, 'div');
  });

  it('Step 4: Saves the generated component to persistent storage', async () => {
    assert.ok(authToken);
    assert.ok(generatedCode);

    const res = await app.request('/components', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        prompt: 'A simple card',
        code: generatedCode,
        title: 'E2E Card Title',
      }),
    });

    assert.equal(res.status, 201);
    const saved = await res.json();
    assert.ok(saved.id);
    assert.equal(saved.userId, userId);
    assert.equal(saved.title, 'E2E Card Title');
    assert.equal(saved.code, generatedCode);
    savedComponentId = saved.id;
  });

  it('Step 5 & 6: Reloads component library and verifies persistence', async () => {
    assert.ok(authToken);
    assert.ok(savedComponentId);

    const res = await app.request('/components', {
      method: 'GET',
      headers: { Authorization: `Bearer ${authToken}` },
    });

    assert.equal(res.status, 200);
    const components = await res.json();
    assert.ok(Array.isArray(components));

    const found = components.find((c: any) => c.id === savedComponentId);
    assert.ok(found, 'Saved component should exist in user component library');
    assert.equal(found.title, 'E2E Card Title');
    assert.equal(found.code, generatedCode);
    assert.equal(found.userId, userId);
  });

  it('Step 7: Deletes the component and verifies its permanent removal', async () => {
    assert.ok(authToken);
    assert.ok(savedComponentId);

    // Delete component
    const deleteRes = await app.request(`/components/${savedComponentId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${authToken}` },
    });

    assert.equal(deleteRes.status, 200);
    const deleteData = await deleteRes.json();
    assert.equal(deleteData.ok, true);

    // Re-query library to confirm removal
    const listRes = await app.request('/components', {
      method: 'GET',
      headers: { Authorization: `Bearer ${authToken}` },
    });

    assert.equal(listRes.status, 200);
    const updatedComponents = await listRes.json();
    const stillExists = updatedComponents.some((c: any) => c.id === savedComponentId);
    assert.equal(stillExists, false, 'Deleted component must no longer appear in library');
  });
});
