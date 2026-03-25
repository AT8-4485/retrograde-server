import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { requestOtp, verifyOtp, refreshTokens, logout } from '../controllers/auth';
import { publicLimiter, authLimiter, otpLimiter } from '../middleware/rateLimiter';
import { ApiError } from '../middleware/errorHandler';

const router = Router();

const requestOtpSchema = z.object({
  email: z.string().email('Invalid email address'),
});

const verifyOtpSchema = z.object({
  email: z.string().email('Invalid email address'),
  code: z.string().min(1, 'OTP code is required'),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh Token is required'),
});

const validateBody = (schema: z.ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const messages = result.error.issues.map((e) => e.message).join(', ');
    return next(new ApiError(400, 'https://api.retrogradenews.app/errors/bad-request', 'Bad Request', messages));
  }
  next();
};

router.post('/request-otp', otpLimiter, validateBody(requestOtpSchema), requestOtp);
router.post('/verify-otp', publicLimiter, validateBody(verifyOtpSchema), verifyOtp);
router.post('/refresh', publicLimiter, validateBody(refreshSchema), refreshTokens);
router.post('/logout', authLimiter, validateBody(refreshSchema), logout);

export default router;
