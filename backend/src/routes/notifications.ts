import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { registerToken, updatePreferences, removeToken, simulatePush } from '../controllers/notification';
import { ApiError } from '../middleware/errorHandler';

const router = Router();

// Ensure all routes in this router require authentication
router.use(requireAuth);

const registerTokenBodySchema = z.object({
  token: z.string().min(1, 'Token is required'),
  platform: z.enum(['ios', 'android', 'web']),
  deviceName: z.string().optional(),
});

const updatePreferencesBodySchema = z.object({
  tokenId: z.string().min(1, 'Token ID is required'),
  // We expect a valid JSON string from the client for flexible preferences
  preferences: z.string().min(2, 'Preferences string cannot be empty'), 
});

const validateBody = (schema: z.ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const messages = result.error.issues.map((e) => e.message).join(', ');
    return next(new ApiError(400, 'https://api.retrogradenews.app/errors/bad-request', 'Bad Request', messages));
  }
  next();
};

const simulatePushBodySchema = z.object({
  mode: z.enum(['raw', 'article']),
  title: z.string().optional(),
  body: z.string().optional(),
  articleId: z.string().optional(),
}).refine(data => {
  if (data.mode === 'raw') {
    return !!data.title && !!data.body;
  }
  if (data.mode === 'article') {
    return !!data.articleId;
  }
  return true;
}, {
  message: "Raw mode requires title and body. Article mode requires articleId."
});

router.post('/token', validateBody(registerTokenBodySchema), registerToken);
router.patch('/preferences', validateBody(updatePreferencesBodySchema), updatePreferences);
router.delete('/token/:tokenId', removeToken);
router.post('/simulate', validateBody(simulatePushBodySchema), simulatePush);

export default router;
