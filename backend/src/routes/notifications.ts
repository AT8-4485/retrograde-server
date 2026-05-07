import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { registerToken, updatePreferences, removeToken, removeTokenById, simulatePush } from '../controllers/notification';
import { ApiError } from '../middleware/errorHandler';

const router = Router();

const registerTokenBodySchema = z.object({
  token: z.string().min(1, 'Token is required'),
  platform: z.enum(['ios', 'android']),
  deviceName: z.string().optional(),
});

const deleteTokenBodySchema = z.object({
  token: z.string().min(1, 'Token is required'),
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
router.delete('/token', validateBody(deleteTokenBodySchema), removeToken);
router.patch('/preferences', requireAuth, validateBody(updatePreferencesBodySchema), updatePreferences);
router.delete('/token/:tokenId', requireAuth, removeTokenById);
router.post('/simulate', requireAuth, validateBody(simulatePushBodySchema), simulatePush);

export default router;
