import { db } from '../utils/db';
import { Bookmark } from '@prisma/client';

import { v7 as uuidv7 } from 'uuid';

export const getBookmarks = async (
  userId: string,
  limit: number,
  cursor?: string,
  type?: string
): Promise<{ data: Bookmark[]; nextCursor: string | null; hasMore: boolean }> => {
  const whereClause: any = { userId };
  if (type) {
    whereClause.type = type;
  }

  const queryParams: any = {
    where: whereClause,
    take: limit + 1, // Fetch one extra to determine if there are more
    orderBy: { createdAt: 'desc' },
  };

  if (cursor) {
    queryParams.cursor = { id: cursor };
  }

  const bookmarks = await db.bookmark.findMany(queryParams);

  let hasMore = false;
  if (bookmarks.length > limit) {
    hasMore = true;
    bookmarks.pop(); // Remove the extra record
  }

  const nextCursor = hasMore ? bookmarks[bookmarks.length - 1].id : null;

  return { data: bookmarks, nextCursor, hasMore };
};

export const createBookmark = async (
  userId: string,
  data: { type: string; title: string; url: string; thumbnailUrl?: string; metadata?: string }
): Promise<Bookmark> => {
  return db.bookmark.create({
    data: {
      id: uuidv7(),
      userId,
      type: data.type,
      title: data.title,
      url: data.url,
      thumbnailUrl: data.thumbnailUrl,
      metadata: data.metadata,
    },
  });
};

export const deleteBookmark = async (userId: string, bookmarkId: string): Promise<void> => {
  await db.bookmark.deleteMany({
    where: {
      id: bookmarkId,
      userId, // Critical IDOR protection
    },
  });
};
