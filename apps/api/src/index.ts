// apps/api/src/index.ts
// purpose: hono app entry point

import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

const app = new Hono();

app.use('*', logger());
app.use('*', cors({ origin: 'http://localhost:5173' }));

app.get('/health', (c) => c.json({ ok: true }));

const PORT = Number(process.env.PORT) || 3001;

serve({ fetch: app.fetch, port: PORT }, () => {
  console.log(`api running on http://localhost:${PORT}`);
});

export default app;
