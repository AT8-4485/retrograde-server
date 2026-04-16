import { db } from '../utils/db';
import { PushToken } from '@prisma/client';
import { v7 as uuidv7 } from 'uuid';

export const upsertPushToken = async (
  userId: string,
  data: { token: string; platform: string; deviceName?: string }
): Promise<PushToken> => {
  // We use upsert to cleanly handle assigning an existing token to a new user
  // or creating it fresh if it's new.
  return db.pushToken.upsert({
    where: { token: data.token },
    update: {
      userId,
      platform: data.platform,
      deviceName: data.deviceName,
    },
    create: {
      id: uuidv7(),
      userId,
      token: data.token,
      platform: data.platform,
      deviceName: data.deviceName,
    },
  });
};

export const updateTokenPreferences = async (
  userId: string,
  tokenId: string,
  preferences: string
): Promise<PushToken> => {
  // First, verify the token belongs to the user
  const tokenRecord = await db.pushToken.findFirst({
    where: { id: tokenId, userId },
  });

  if (!tokenRecord) {
    throw new Error('Token not found or does not belong to user');
  }

  return db.pushToken.update({
    where: { id: tokenId },
    data: { preferences },
  });
};

export const deletePushToken = async (userId: string, tokenId: string): Promise<void> => {
  await db.pushToken.deleteMany({
    where: {
      id: tokenId,
      userId,
    },
  });
};

export const getUserPushTokens = async (userId: string) => {
  return db.pushToken.findMany({
    where: { userId },
  });
};
