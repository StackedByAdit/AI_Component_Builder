// apps/api/src/lib/jwt.ts
// purpose: sign and verify jwt tokens

import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET ?? 'dev_secret';

export const signToken = (userId: string): string =>
  jwt.sign({ userId }, SECRET, { expiresIn: '7d' });

export const verifyToken = (token: string): { userId: string } =>
  jwt.verify(token, SECRET) as { userId: string };
