// apps/api/src/lib/jwt.ts
// purpose: sign and verify jwt tokens

import jwt from 'jsonwebtoken';

export const getJwtSecret = (): string => {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET environment variable is required in production');
  }
  return 'dev_secret';
};

export const signToken = (userId: string, expiresIn: string = '7d'): string =>
  jwt.sign({ userId }, getJwtSecret(), { expiresIn } as any);

export const verifyToken = (token: string): { userId: string } =>
  jwt.verify(token, getJwtSecret()) as { userId: string };
