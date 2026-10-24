// apps/api/src/db.ts
// purpose: shared prisma client instance

import { PrismaClient } from '@prisma/client';

export const db = new PrismaClient();
