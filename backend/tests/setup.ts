import dotenv from 'dotenv';
dotenv.config({ path: '.envtest', override: true });

import { prisma } from '../src/utils/db';

beforeAll(async () => {
  await prisma.$connect();
});

beforeEach(async () => {
  // Use Prisma's deleteMany for safer cross-database cascading deletes
  await prisma.bookmark.deleteMany({});
  await prisma.gameResult.deleteMany({});
  await prisma.pushToken.deleteMany({});
  await prisma.session.deleteMany({});
  await prisma.user.deleteMany({});
});

afterAll(async () => {
  await prisma.$disconnect();
});
