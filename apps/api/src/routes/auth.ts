// apps/api/src/routes/auth.ts
// purpose: POST /auth/signup, POST /auth/signin, GET /auth/me, POST /auth/signout

import { Hono } from 'hono';
import bcrypt from 'bcryptjs';
import { db } from '../db.js';
import { signToken } from '../lib/jwt.js';
import { requireAuth, type AuthEnv } from '../middleware/auth.js';
import type { SignupRequest, SigninRequest, AuthResponse, UserResponse } from '@repo/types';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// In-memory rate limiter for signin brute-force protection
interface RateLimitRecord {
  count: number;
  resetAt: number;
}
const loginAttempts = new Map<string, RateLimitRecord>();
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

export const checkRateLimit = (key: string): boolean => {
  const now = Date.now();
  const record = loginAttempts.get(key);
  if (!record || now > record.resetAt) {
    return true;
  }
  return record.count < MAX_LOGIN_ATTEMPTS;
};

export const recordFailedAttempt = (key: string): void => {
  const now = Date.now();
  const record = loginAttempts.get(key);
  if (!record || now > record.resetAt) {
    loginAttempts.set(key, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
  } else {
    record.count++;
  }
};

export const clearRateLimit = (key: string): void => {
  loginAttempts.delete(key);
};

export const _resetRateLimitsForTesting = (): void => {
  loginAttempts.clear();
};

export const authRouter = new Hono<AuthEnv>();

authRouter.post('/signup', async (c) => {
  const body = await c.req.json<SignupRequest>().catch(() => null);
  if (
    !body ||
    typeof body.email !== 'string' ||
    !body.email.trim() ||
    typeof body.password !== 'string' ||
    !body.password
  ) {
    return c.json({ error: 'Email and password are required' }, 400);
  }

  const email = body.email.trim().toLowerCase();
  const password = body.password;

  if (!EMAIL_REGEX.test(email)) {
    return c.json({ error: 'Valid email is required' }, 400);
  }

  if (password.length < 8) {
    return c.json({ error: 'Password must be at least 8 characters' }, 400);
  }

  if (typeof body.confirmPassword === 'string' && body.confirmPassword !== password) {
    return c.json({ error: 'Passwords do not match' }, 400);
  }

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
  const body = await c.req.json<SigninRequest>().catch(() => null);
  if (
    !body ||
    typeof body.email !== 'string' ||
    !body.email.trim() ||
    typeof body.password !== 'string' ||
    !body.password
  ) {
    return c.json({ error: 'Email and password are required' }, 400);
  }

  const email = body.email.trim().toLowerCase();
  const password = body.password;

  const clientIp = c.req.header('x-forwarded-for') || 'local';
  const rateLimitKey = `${clientIp}:${email}`;

  if (!checkRateLimit(rateLimitKey)) {
    return c.json({ error: 'Too many failed login attempts. Please try again later.' }, 429);
  }

  const user = await db.user.findUnique({ where: { email } });
  if (!user) {
    recordFailedAttempt(rateLimitKey);
    return c.json({ error: 'Invalid credentials' }, 401);
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    recordFailedAttempt(rateLimitKey);
    return c.json({ error: 'Invalid credentials' }, 401);
  }

  clearRateLimit(rateLimitKey);

  const token = signToken(user.id);
  const res: AuthResponse = {
    token,
    user: { id: user.id, email: user.email, createdAt: user.createdAt.getTime() },
  };
  return c.json(res);
});

authRouter.get('/me', requireAuth, async (c) => {
  const userId = c.get('userId');
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, createdAt: true },
    });
    if (!user) {
      return c.json({ error: 'User not found' }, 401);
    }
    const res: UserResponse = {
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt.getTime(),
      },
    };
    return c.json(res);
  } catch {
    return c.json({ error: 'Failed to retrieve user' }, 500);
  }
});

authRouter.post('/signout', async (c) => {
  return c.json({ ok: true });
});

authRouter.post('/logout', async (c) => {
  return c.json({ ok: true });
});
