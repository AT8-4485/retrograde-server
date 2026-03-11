import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { fetchFeed, fetchFeedByCategory, fetchIssues, fetchLatestIssue, fetchArticlesByDate } from '../services/wordpress';
import { ApiError } from '../middleware/errorHandler';

const router = Router();

// Zod schema to parse and coerce query params
const feedQuerySchema = z.object({
  cursor: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

const categoryQuerySchema = feedQuerySchema.extend({
  categories: z.preprocess(
    (val) => {
      if (typeof val === 'string') {
        return val.split(',').map((v) => parseInt(v.trim(), 10)).filter((v) => !isNaN(v));
      }
      return val;
    },
    z.array(z.number()).min(1)
  ),
});

router.get('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const query = feedQuerySchema.safeParse(req.query);
    if (!query.success) {
      throw new ApiError(400, 'https://api.retrogradenews.app/errors/bad-request', 'Bad Request', query.error.issues.map((e: any) => e.message).join(', '));
    }

    const page = query.data.cursor;
    const limit = query.data.limit;

    const { data, totalPages } = await fetchFeed(page, limit);

    const hasMore = page < totalPages;
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

router.get('/category', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const query = categoryQuerySchema.safeParse(req.query);
    if (!query.success) {
      throw new ApiError(400, 'https://api.retrogradenews.app/errors/bad-request', 'Bad Request', query.error.issues.map((e: any) => e.message).join(', '));
    }

    const page = query.data.cursor;
    const limit = query.data.limit;
    const categories = query.data.categories;

    const { data, totalPages } = await fetchFeedByCategory(categories, page, limit);

    const hasMore = page < totalPages;
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

router.get('/issues', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const query = feedQuerySchema.safeParse(req.query);
    if (!query.success) {
      throw new ApiError(400, 'https://api.retrogradenews.app/errors/bad-request', 'Bad Request', query.error.issues.map((e: any) => e.message).join(', '));
    }

    const page = query.data.cursor;
    const limit = query.data.limit;

    const { data, totalPages } = await fetchIssues(page, limit);

    const hasMore = page < totalPages;
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

router.get('/issues/latest', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const issue = await fetchLatestIssue();
    if (!issue) {
      res.json({ issue: null, articles: [] });
      return;
    }

    const { data: articles } = await fetchArticlesByDate(issue.publishedAt);

    res.json({
      issue,
      articles
    });
  } catch (error) {
    next(error);
  }
});

export default router;
