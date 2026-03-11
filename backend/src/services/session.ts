import { db } from '../utils/db';
import { Session } from '@prisma/client';
import { v7 as uuidv7 } from 'uuid';

export const createSession = async (userId: string, jti: string, expiresAt: Date): Promise<Session> => {
  return db.session.create({
    data: {
      id: uuidv7(),
      userId,
      jti,
      expiresAt,
    },
  });
};

export const findSessionByJti = async (jti: string): Promise<Session | null> => {
  return db.session.findUnique({
    where: { jti },
  });
};

export const deleteSessionByJti = async (jti: string): Promise<void> => {
  await db.session.delete({
    where: { jti },
  });
};
