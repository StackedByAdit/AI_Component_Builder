// apps/api/src/routes/generate.ts
// purpose: POST /generate — proxies prompt to gemini, validates, auto-repairs, and returns clean jsx

import { Hono } from 'hono';
import { requireAuth, type AuthEnv } from '../middleware/auth.js';
import { generateComponentWithRepair, scrubSecrets } from '../lib/geminiGenerator.js';
import type { GenerateRequest, GenerateResponse } from '@repo/types';

export const generateRouter = new Hono<AuthEnv>();

generateRouter.use('*', requireAuth);

generateRouter.post('/', async (c) => {
  const body = await c.req.json<GenerateRequest>().catch(() => null);
  if (!body || typeof body.prompt !== 'string' || !body.prompt.trim()) {
    return c.json({ error: 'Prompt is required' }, 400);
  }

  const apiKey = process.env.GEMINI_API_KEY;
  const apiKeys = process.env.GEMINI_API_KEYS
    ? process.env.GEMINI_API_KEYS.split(',').map((k) => k.trim()).filter(Boolean)
    : apiKey
    ? [apiKey]
    : [];

  if (apiKeys.length === 0) {
    return c.json({ error: 'GEMINI_API_KEY not set' }, 500);
  }

  try {
    const result = await generateComponentWithRepair({
      prompt: body.prompt.trim(),
      apiKeys,
      signal: c.req.raw.signal,
    });

    const response: GenerateResponse = { code: result.code };
    return c.json(response);
  } catch (err: any) {
    if (c.req.raw.signal?.aborted || err.name === 'AbortError' || err.statusCode === 499) {
      return c.json({ error: 'Generation was cancelled' }, 499 as any);
    }

    const statusCode =
      typeof err.statusCode === 'number' && err.statusCode >= 400 && err.statusCode < 600
        ? err.statusCode
        : 500;

    const message = scrubSecrets(err.message || 'Generation failed', [apiKey]);
    return c.json({ error: message }, statusCode as any);
  }
});
