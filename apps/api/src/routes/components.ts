// apps/api/src/routes/components.ts
// purpose: GET, POST, and DELETE /components (auth required)

import { Hono } from 'hono';
import { db } from '../db.js';
import { requireAuth, type AuthEnv } from '../middleware/auth.js';
import type { SaveComponentRequest } from '@repo/types';

export const componentsRouter = new Hono<AuthEnv>();

componentsRouter.use('*', requireAuth);

componentsRouter.get('/', async (c) => {
  const userId = c.get('userId');
  try {
    const components = await db.component.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return c.json(components);
  } catch {
    return c.json({ error: 'Failed to retrieve components' }, 500);
  }
});

componentsRouter.post('/', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json<SaveComponentRequest>().catch(() => null);
  if (
    !body ||
    typeof body.prompt !== 'string' ||
    !body.prompt.trim() ||
    typeof body.code !== 'string' ||
    !body.code.trim()
  ) {
    return c.json({ error: 'Prompt and code are required' }, 400);
  }

  const title =
    typeof body.title === 'string' && body.title.trim()
      ? body.title.trim().slice(0, 100)
      : body.prompt.trim().slice(0, 60);

  try {
    const component = await db.component.create({
      data: {
        prompt: body.prompt.trim(),
        code: body.code.trim(),
        title,
        userId,
      },
    });
    return c.json(component, 201);
  } catch {
    return c.json({ error: 'Failed to save component' }, 500);
  }
});

componentsRouter.delete('/:id', async (c) => {
  const userId = c.get('userId');
  const { id } = c.req.param();
  if (!id) return c.json({ error: 'Component ID is required' }, 400);

  try {
    const result = await db.component.deleteMany({ where: { id, userId } });
    if (result.count === 0) {
      return c.json({ error: 'Component not found' }, 404);
    }
    return c.json({ ok: true });
  } catch {
    return c.json({ error: 'Failed to delete component' }, 500);
  }
});
