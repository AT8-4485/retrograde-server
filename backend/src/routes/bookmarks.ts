import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { get, create, remove } from '../controllers/bookmark';
import { ApiError } from '../middleware/errorHandler';

const router = Router();

// Ensure all routes in this router require authentication
router.use(requireAuth);

const getBookmarksQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  type: z.string().optional(),
});

const createBookmarkBodySchema = z.object({
  type: z.string().min(1, 'Type is required'),
  title: z.string().min(1, 'Title is required'),
  url: z.string().url('Must be a valid URL'),
  thumbnailUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  metadata: z.string().optional(), // Expected to be JSON string if provided
});

const validateQuery = (schema: z.ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
  const result = schema.safeParse(req.query);
  if (!result.success) {
    const messages = result.error.issues.map((e) => e.message).join(', ');
    return next(new ApiError(400, 'https://api.retrogradenews.app/errors/bad-request', 'Bad Request', messages));
  }
  // Optional: override req.query with the coerced/defaulted values
  Object.assign(req.query, result.data);
  next();
};

const validateBody = (schema: z.ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const messages = result.error.issues.map((e) => e.message).join(', ');
    return next(new ApiError(400, 'https://api.retrogradenews.app/errors/bad-request', 'Bad Request', messages));
  }
  next();
};

router.get('/', validateQuery(getBookmarksQuerySchema), get);
router.post('/', validateBody(createBookmarkBodySchema), create);
router.delete('/:id', remove);

export default router;
