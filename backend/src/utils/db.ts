import { PrismaClient } from '@prisma/client';
import { v7 as uuidv7 } from 'uuid';
import { config } from './config';

declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma = global.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

export const db = prisma.$extends({
  query: {
    $allModels: {
      async create({ args, query }) {
        args.data = {
          ...args.data,
          id: (args.data as any).id || uuidv7(),
        };
        return query(args);
      },
    },
  },
});
