// apps/api/src/middleware/auth.ts
// purpose: validates bearer token and attaches userId to context

import type { MiddlewareHandler } from 'hono';
import { verifyToken } from '../lib/jwt.js';

export interface AuthEnv {
  Variables: {
    userId: string;
  };
}

export const requireAuth: MiddlewareHandler<AuthEnv> = async (c, next) => {
  const header = c.req.header('Authorization');
  if (!header?.startsWith('Bearer ')) return c.json({ error: 'Unauthorized' }, 401);

  try {
    const { userId } = verifyToken(header.slice(7));
    c.set('userId', userId);
    await next();
  } catch {
    return c.json({ error: 'Unauthorized' }, 401);
  }
};
