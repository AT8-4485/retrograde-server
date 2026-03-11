import dotenv from 'dotenv';
dotenv.config({ path: '.envtest', override: true });

import { prisma } from '../src/utils/db';

beforeAll(async () => {
  await prisma.$connect();
});

beforeEach(async () => {
  await prisma.$executeRawUnsafe('DELETE FROM "Bookmark";');
  await prisma.$executeRawUnsafe('DELETE FROM "GameResult";');
  await prisma.$executeRawUnsafe('DELETE FROM "PushToken";');
  await prisma.$executeRawUnsafe('DELETE FROM "User";');
});

afterAll(async () => {
  await prisma.$disconnect();
});
