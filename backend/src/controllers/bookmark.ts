import { Request, Response, NextFunction } from 'express';
import { getBookmarks, createBookmark, deleteBookmark } from '../services/bookmark';

export const get = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Validated by Zod in the route definition
    const limit = Number(req.query.limit);
    const cursor = req.query.cursor as string | undefined;
    const type = req.query.type as string | undefined;

    // req.user is guaranteed by requireAuth middleware
    const userId = req.user!.id;

    const result = await getBookmarks(userId, limit, cursor, type);

    res.json({
      data: result.data,
      cursor: result.nextCursor,
      hasMore: result.hasMore,
    });
  } catch (error) {
    next(error);
  }
};

export const create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const data = req.body;

    const bookmark = await createBookmark(userId, data);

    res.status(201).json(bookmark);
  } catch (error) {
    next(error);
  }
};

export const remove = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const bookmarkId = req.params.id as string;

    await deleteBookmark(userId, bookmarkId);

    // 204 No Content is standard for successful deletions
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
