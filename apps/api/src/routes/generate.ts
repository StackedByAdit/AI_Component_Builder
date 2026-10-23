// apps/api/src/routes/generate.ts
// purpose: POST /generate — proxies prompt to gemini and returns clean jsx

import { Hono } from 'hono';
import { requireAuth, type AuthEnv } from '../middleware/auth.js';
import { cleanGeneratedCode } from '../lib/codeCleaner.js';
import type { GenerateRequest, GenerateResponse } from '@repo/types';

export const generateRouter = new Hono<AuthEnv>();

generateRouter.use('*', requireAuth);

generateRouter.post('/', async (c) => {
  const { prompt } = await c.req.json<GenerateRequest>();
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return c.json({ error: 'GEMINI_API_KEY not set' }, 500);

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `You are a React UI generator.\n\nReturn ONLY valid JSX.\nNo explanations.\nNo markdown.\nNo code fences.\nNo imports.\n\nThe output MUST start with <div> and end with </div>.\n\nUse Tailwind CSS.\n\nComponent:\n${prompt}`,
          }],
        }],
      }),
    }
  );

  const data = await res.json();
  const raw: string =
    data?.candidates
      ?.flatMap((c: any) => c.content?.parts || [])
      ?.map((p: any) => p.text || '')
      ?.join('\n') || '';

  if (!raw) return c.json({ error: 'No code generated' }, 500);

  const code = cleanGeneratedCode(raw);
  const response: GenerateResponse = { code };
  return c.json(response);
});
