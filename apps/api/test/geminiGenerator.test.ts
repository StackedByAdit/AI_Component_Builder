// apps/api/test/geminiGenerator.test.ts
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  generateComponentWithRepair,
  scrubSecrets,
  GenerationError,
  GenerationValidationError,
} from '../src/lib/geminiGenerator.js';

const FAKE_KEY = 'AIzaSyD_TEST_SECRET_KEY_98765';

const createMockFetch = (responses: Array<{ status?: number; data: any; delayMs?: number }>) => {
  let callIndex = 0;
  const calls: Array<{ url: string; body: any }> = [];

  const mockFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === 'string' ? input : input.toString();
    const body = init?.body ? JSON.parse(init.body as string) : null;
    calls.push({ url, body });

    if (init?.signal?.aborted) {
      const err = new Error('The operation was aborted');
      err.name = 'AbortError';
      throw err;
    }

    const currentResponse = responses[callIndex] || responses[responses.length - 1];
    callIndex++;

    if (currentResponse.delayMs) {
      await new Promise((resolve, reject) => {
        const timer = setTimeout(resolve, currentResponse.delayMs);
        if (init?.signal) {
          init.signal.addEventListener('abort', () => {
            clearTimeout(timer);
            const err = new Error('The operation was aborted');
            err.name = 'AbortError';
            reject(err);
          });
        }
      });
    }

    const status = currentResponse.status ?? 200;
    const ok = status >= 200 && status < 300;

    return {
      ok,
      status,
      json: async () => currentResponse.data,
      text: async () => JSON.stringify(currentResponse.data),
    } as unknown as Response;
  };

  return { mockFetch, calls };
};

const makeCandidate = (jsxString: string) => ({
  candidates: [
    {
      content: {
        parts: [{ text: JSON.stringify({ jsx: jsxString }) }],
      },
    },
  ],
});

describe('geminiGenerator', () => {
  describe('scrubSecrets', () => {
    it('redacts raw API keys from text', () => {
      const msg = `Failed request with key ${FAKE_KEY} at endpoint`;
      const scrubbed = scrubSecrets(msg, [FAKE_KEY]);
      assert.equal(scrubbed.includes(FAKE_KEY), false);
      assert.ok(scrubbed.includes('[REDACTED]'));
    });

    it('redacts key query parameters', () => {
      const msg = 'Error fetching https://example.com/api?key=AIzaSyD123456789&lang=en';
      const scrubbed = scrubSecrets(msg, []);
      assert.equal(scrubbed.includes('AIzaSyD123456789'), false);
      assert.ok(scrubbed.includes('key=[REDACTED]'));
    });
  });

  describe('generateComponentWithRepair', () => {
    it('succeeds on first attempt when valid JSX is generated', async () => {
      const validJsx = '<div className="p-4 bg-white rounded-lg">Hello World</div>';
      const { mockFetch, calls } = createMockFetch([
        { data: makeCandidate(validJsx) },
      ]);

      const result = await generateComponentWithRepair({
        prompt: 'A simple card',
        apiKey: FAKE_KEY,
        fetchFn: mockFetch as any,
      });

      assert.equal(result.code, validJsx);
      assert.equal(result.attempts, 1);
      assert.equal(calls.length, 1);
    });

    it('automatically repairs invalid JSX on second attempt', async () => {
      const invalidJsx = '<div><span>Missing closing span</div>';
      const repairedJsx = '<div className="p-4"><span>Valid and closed</span></div>';

      const { mockFetch, calls } = createMockFetch([
        { data: makeCandidate(invalidJsx) },
        { data: makeCandidate(repairedJsx) },
      ]);

      const result = await generateComponentWithRepair({
        prompt: 'A card with a span',
        apiKey: FAKE_KEY,
        fetchFn: mockFetch as any,
      });

      assert.equal(result.code, repairedJsx);
      assert.equal(result.attempts, 2);
      assert.equal(calls.length, 2);

      // Verify the repair prompt includes the detected error and previous code
      const secondCallPrompt = calls[1].body.contents[0].parts[0].text;
      assert.ok(secondCallPrompt.includes('failed compilation and syntax validation'));
      assert.ok(secondCallPrompt.includes(invalidJsx));
    });

    it('bounds repair attempts and throws after 2 repairs fail', async () => {
      const invalidJsx = '<div><span>Never closed</div>';

      // 1 initial attempt + 2 repairs = 3 total calls
      const { mockFetch, calls } = createMockFetch([
        { data: makeCandidate(invalidJsx) },
        { data: makeCandidate(invalidJsx) },
        { data: makeCandidate(invalidJsx) },
      ]);

      await assert.rejects(
        async () => {
          await generateComponentWithRepair({
            prompt: 'An invalid component',
            apiKey: FAKE_KEY,
            fetchFn: mockFetch as any,
          });
        },
        (err: any) => {
          assert.ok(err instanceof GenerationValidationError);
          assert.equal(err.statusCode, 422);
          assert.ok(err.message.includes('failed validation after 2 repair attempts'));
          assert.ok(err.errors.length > 0);
          return true;
        }
      );

      // Verify bounded execution: exactly 3 calls
      assert.equal(calls.length, 3);
    });

    it('handles HTTP 429 rate limit errors cleanly', async () => {
      const { mockFetch } = createMockFetch([
        {
          status: 429,
          data: { error: { message: 'Quota exceeded for quota metric' } },
        },
      ]);

      await assert.rejects(
        async () => {
          await generateComponentWithRepair({
            prompt: 'Rate limited card',
            apiKey: FAKE_KEY,
            fetchFn: mockFetch as any,
          });
        },
        (err: any) => {
          assert.ok(err instanceof GenerationError);
          assert.equal(err.statusCode, 429);
          assert.ok(err.message.includes('rate limit exceeded'));
          return true;
        }
      );
    });

    it('handles upstream 503 service unavailable errors cleanly', async () => {
      const { mockFetch } = createMockFetch([
        {
          status: 503,
          data: { error: { message: 'Service Temporarily Unavailable' } },
        },
      ]);

      await assert.rejects(
        async () => {
          await generateComponentWithRepair({
            prompt: 'Service down test',
            apiKey: FAKE_KEY,
            fetchFn: mockFetch as any,
          });
        },
        (err: any) => {
          assert.ok(err instanceof GenerationError);
          assert.equal(err.statusCode, 502);
          assert.ok(err.message.includes('temporarily unavailable'));
          return true;
        }
      );
    });

    it('scrubs API key from error responses', async () => {
      const { mockFetch } = createMockFetch([
        {
          status: 400,
          data: { error: { message: `Invalid parameter with key ${FAKE_KEY}` } },
        },
      ]);

      await assert.rejects(
        async () => {
          await generateComponentWithRepair({
            prompt: 'Bad parameter test',
            apiKey: FAKE_KEY,
            fetchFn: mockFetch as any,
          });
        },
        (err: any) => {
          assert.ok(err instanceof GenerationError);
          assert.equal(err.message.includes(FAKE_KEY), false);
          assert.ok(err.message.includes('[REDACTED]'));
          return true;
        }
      );
    });

    it('supports client cancellation via AbortController', async () => {
      const controller = new AbortController();
      const { mockFetch } = createMockFetch([
        { data: makeCandidate('<div />'), delayMs: 100 },
      ]);

      // Abort immediately
      controller.abort();

      await assert.rejects(
        async () => {
          await generateComponentWithRepair({
            prompt: 'Cancelled test',
            apiKey: FAKE_KEY,
            signal: controller.signal,
            fetchFn: mockFetch as any,
          });
        },
        (err: any) => {
          assert.ok(err.name === 'AbortError' || err.statusCode === 499);
          return true;
        }
      );
    });

    it('handles timeout when request exceeds timeoutMs', async () => {
      const { mockFetch } = createMockFetch([
        { data: makeCandidate('<div />'), delayMs: 100 },
      ]);

      await assert.rejects(
        async () => {
          await generateComponentWithRepair({
            prompt: 'Timeout test',
            apiKey: FAKE_KEY,
            timeoutMs: 20, // 20ms timeout vs 100ms delay
            fetchFn: mockFetch as any,
          });
        },
        (err: any) => {
          assert.ok(err instanceof GenerationError);
          assert.equal(err.statusCode, 504);
          assert.ok(err.message.includes('timed out'));
          return true;
        }
      );
    });
  });
});
