import { Router } from 'express';
import { z } from 'zod';
import { optionalAuth } from '../middleware/auth';
import * as gameController from '../controllers/game';
import { ApiError } from '../middleware/errorHandler';
import { Request, Response, NextFunction } from 'express';

const router = Router();

const submitResultSchema = z.object({
  score: z.number().int(),
  maxScore: z.number().int().optional(),
  durationMs: z.number().int().min(0),
  answers: z.any().optional(),
});

const validateBody = (schema: z.ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const messages = result.error.issues.map((e) => e.message).join(', ');
    return next(new ApiError(400, 'https://api.retrogradenews.app/errors/bad-request', 'Bad Request', messages));
  }
  next();
};

router.get('/', gameController.listGames);
router.get('/:gameId/challenge/today', gameController.getTodayChallenge);
router.post('/:gameId/results', optionalAuth, validateBody(submitResultSchema), gameController.submitResult);
router.get('/:gameId/leaderboard', optionalAuth, gameController.getLeaderboard);

export default router;
