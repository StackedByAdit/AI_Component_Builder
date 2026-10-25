// apps/api/src/routes/components.ts
// purpose: GET and POST /components (auth required)

import { Hono } from 'hono';
import { db } from '../db.js';
import { requireAuth, type AuthEnv } from '../middleware/auth.js';
import type { SaveComponentRequest } from '@repo/types';

export const componentsRouter = new Hono<AuthEnv>();

componentsRouter.use('*', requireAuth);

componentsRouter.get('/', async (c) => {
  const userId = c.get('userId');
  const components = await db.component.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
  return c.json(components);
});

componentsRouter.post('/', async (c) => {
  const userId = c.get('userId');
  const { prompt, code, title } = await c.req.json<SaveComponentRequest>();
  const component = await db.component.create({
    data: { prompt, code, title, userId },
  });
  return c.json(component, 201);
});

componentsRouter.delete('/:id', async (c) => {
  const userId = c.get('userId');
  const { id } = c.req.param();
  await db.component.deleteMany({ where: { id, userId } });
  return c.json({ ok: true });
});
