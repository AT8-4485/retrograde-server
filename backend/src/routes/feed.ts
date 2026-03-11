import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { fetchFeed } from '../services/wordpress';

const router = Router();

// Zod schema to parse and coerce query params
const feedQuerySchema = z.object({
  cursor: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10), // Added a max of 50 for safety!
});

router.get('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const query = feedQuerySchema.safeParse(req.query);
    if (!query.success) {
      // Let zod error handler in middleware process this
      throw query.error;
    }

    // Ensure parameters are positive integers
    const page = isNaN(query.data.cursor) || query.data.cursor < 1 ? 1 : query.data.cursor;
    const limit = isNaN(query.data.limit) || query.data.limit < 1 ? 10 : query.data.limit;

    const { data, totalPages } = await fetchFeed(page, limit);

    const hasMore = page < totalPages;
    // Cast next cursor back to string for the mobile client's contract
    const nextCursor = hasMore ? String(page + 1) : null;

    res.json({
      data,
      cursor: nextCursor,
      hasMore
    });
  } catch (error) {
    next(error);
  }
});

export default router;
