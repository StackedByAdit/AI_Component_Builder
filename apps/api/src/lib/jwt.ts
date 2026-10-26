// apps/api/src/lib/jwt.ts
// purpose: sign and verify jwt tokens

import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET ?? 'dev_secret';

export const signToken = (userId: string, expiresIn: string = '7d'): string =>
  jwt.sign({ userId }, SECRET, { expiresIn } as any);

export const verifyToken = (token: string): { userId: string } =>
  jwt.verify(token, SECRET) as { userId: string };
