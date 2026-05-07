import { db } from '../utils/db';
import { Prisma, PushToken } from '@prisma/client';
import { v7 as uuidv7 } from 'uuid';
import { sendPushNotification } from './expoPush';
import { LeanArticle } from './wordpress';

export const upsertPushToken = async (
  userId: string | undefined,
  data: { token: string; platform: string; deviceName?: string }
): Promise<PushToken> => {
  const now = new Date();

  return db.pushToken.upsert({
    where: { token: data.token },
    update: {
      userId: userId ?? null,
      platform: data.platform,
      deviceName: data.deviceName,
      lastSeenAt: now,
    },
    create: {
      id: uuidv7(),
      userId: userId ?? null,
      token: data.token,
      platform: data.platform,
      deviceName: data.deviceName,
      lastSeenAt: now,
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

export const deletePushTokenByToken = async (token: string): Promise<void> => {
  await db.pushToken.deleteMany({
    where: { token },
  });
};

export const getUserPushTokens = async (userId: string) => {
  return db.pushToken.findMany({
    where: { userId },
  });
};

export const getActivePushTokens = async () => {
  return db.pushToken.findMany({
    select: { token: true },
  });
};

export const reserveNotificationDispatch = async (
  articleId: string,
  type: string
): Promise<boolean> => {
  try {
    await db.notificationDispatch.create({
      data: {
        id: uuidv7(),
        articleId,
        type,
      },
    });
    return true;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return false;
    }
    throw error;
  }
};

const cleanText = (value: string | null | undefined): string => {
  if (!value) return '';

  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
};

export type ArticleNotificationResult = 'sent' | 'duplicate' | 'no-tokens';

export const sendNewArticleNotification = async (
  article: LeanArticle
): Promise<ArticleNotificationResult> => {
  const dispatchReserved = await reserveNotificationDispatch(article.id, 'new_article');
  if (!dispatchReserved) {
    return 'duplicate';
  }

  const tokenRecords = await getActivePushTokens();
  if (tokenRecords.length === 0) {
    return 'no-tokens';
  }

  await sendPushNotification(
    tokenRecords.map(record => record.token),
    cleanText(article.title) || 'New article',
    cleanText(article.excerpt) || 'Read the latest from The Retrograde.',
    {
      type: 'article',
      postId: article.id,
    }
  );

  return 'sent';
};
