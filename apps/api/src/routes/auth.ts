// apps/api/src/routes/auth.ts
// purpose: POST /auth/signup and POST /auth/signin

import { Hono } from 'hono';
import bcrypt from 'bcryptjs';
import { db } from '../db.js';
import { signToken } from '../lib/jwt.js';
import type { SignupRequest, SigninRequest, AuthResponse } from '@repo/types';

export const authRouter = new Hono();

authRouter.post('/signup', async (c) => {
  const { email, password } = await c.req.json<SignupRequest>();

  const exists = await db.user.findUnique({ where: { email } });
  if (exists) return c.json({ error: 'Email already in use' }, 400);

  const hashed = await bcrypt.hash(password, 10);
  const user = await db.user.create({ data: { email, password: hashed } });

  const token = signToken(user.id);
  const res: AuthResponse = {
    token,
    user: { id: user.id, email: user.email, createdAt: user.createdAt.getTime() },
  };
  return c.json(res, 201);
});

authRouter.post('/signin', async (c) => {
  const { email, password } = await c.req.json<SigninRequest>();

  const user = await db.user.findUnique({ where: { email } });
  if (!user) return c.json({ error: 'Invalid credentials' }, 401);

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return c.json({ error: 'Invalid credentials' }, 401);

  const token = signToken(user.id);
  const res: AuthResponse = {
    token,
    user: { id: user.id, email: user.email, createdAt: user.createdAt.getTime() },
  };
  return c.json(res);
});
