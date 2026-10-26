// apps/api/src/index.ts
// purpose: hono app entry point

try {
  process.loadEnvFile?.();
} catch {}

import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { authRouter } from './routes/auth.js';
import { componentsRouter } from './routes/components.js';
import { generateRouter } from './routes/generate.js';

const app = new Hono();

app.use('*', logger());
app.use('*', cors({ origin: 'http://localhost:5173' }));

app.get('/health', (c) => c.json({ ok: true }));
app.route('/auth', authRouter);
app.route('/components', componentsRouter);
app.route('/generate', generateRouter);

const PORT = Number(process.env.PORT) || 3001;

const isTest =
  process.env.NODE_ENV === 'test' ||
  process.execArgv.includes('--test') ||
  process.argv.some((a) => a.includes('test')) ||
  Boolean(process.env.NODE_TEST_CONTEXT);

if (!isTest) {
  serve({ fetch: app.fetch, port: PORT }, () => {
    console.log(`api running on http://localhost:${PORT}`);
  });
}

export default app;
