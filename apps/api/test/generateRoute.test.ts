// apps/api/test/generateRoute.test.ts
import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/index.js';
import { signToken } from '../src/lib/jwt.js';

describe('POST /generate', () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.GEMINI_API_KEY;
  const token = signToken('test-user-id');

  beforeEach(() => {
    process.env.GEMINI_API_KEY = 'AIzaSyD_MOCK_SECRET_KEY';
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    process.env.GEMINI_API_KEY = originalKey;
  });

  it('rejects unauthenticated requests with 401', async () => {
    const res = await app.request('/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'A button' }),
    });

    assert.equal(res.status, 401);
    const data = await res.json();
    assert.equal(data.error, 'Unauthorized');
  });

  it('rejects empty prompt with 400', async () => {
    const res = await app.request('/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ prompt: '   ' }),
    });

    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.error, 'Prompt is required');
  });

  it('successfully generates and returns clean JSX on 200', async () => {
    const mockJsx = '<div className="p-4 bg-blue-500 text-white rounded">Button</div>';

    globalThis.fetch = async () => {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [{ text: JSON.stringify({ jsx: mockJsx }) }],
              },
            },
          ],
        }),
      } as unknown as Response;
    };

    const res = await app.request('/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ prompt: 'A blue button' }),
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.code, mockJsx);
  });

  it('returns 429 when upstream returns rate limit error', async () => {
    globalThis.fetch = async () => {
      return {
        ok: false,
        status: 429,
        json: async () => ({ error: { message: 'Resource exhausted' } }),
      } as unknown as Response;
    };

    const res = await app.request('/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ prompt: 'A blue button' }),
    });

    assert.equal(res.status, 429);
    const data = await res.json();
    assert.ok(data.error.includes('rate limit exceeded'));
  });

  it('returns 422 when repair attempts are exhausted', async () => {
    const badJsx = '<div><span>Missing closing tag</div>';

    globalThis.fetch = async () => {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [{ text: JSON.stringify({ jsx: badJsx }) }],
              },
            },
          ],
        }),
      } as unknown as Response;
    };

    const res = await app.request('/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ prompt: 'A broken component' }),
    });

    assert.equal(res.status, 422);
    const data = await res.json();
    assert.ok(data.error.includes('failed validation after 2 repair attempts'));
  });
});
