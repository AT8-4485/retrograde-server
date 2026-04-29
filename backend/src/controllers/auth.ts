import { Request, Response, NextFunction } from 'express';
import { sendOtp, verifyAndIssueTokens, refreshAccessToken, revokeSession } from '../services/auth';
import { posthog } from '../utils/posthog';

export const requestOtp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email } = req.body;
    
    const distinctId = req.headers['x-posthog-distinct-id'] as string;
    const sessionId = req.headers['x-posthog-session-id'] as string;
    
    await sendOtp(email);

    posthog.capture({
      distinctId: distinctId || email,
      event: 'otp_requested_server',
      properties: {
        $session_id: sessionId,
        email: email
      }
    });

    res.json({
      message: 'If the email exists, a one-time code has been sent.',
      expiresInSeconds: 600
    });
  } catch (error) {
    next(error);
  }
};

export const verifyOtp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, code } = req.body;
    
    const distinctId = req.headers['x-posthog-distinct-id'] as string;
    const sessionId = req.headers['x-posthog-session-id'] as string;
    
    const { user, tokens } = await verifyAndIssueTokens(email, code);

    if (distinctId && distinctId !== user.id) {
      posthog.alias({
        distinctId: user.id,
        alias: distinctId
      });
    }

    posthog.identify({
      distinctId: user.id,
      properties: {
        email: user.email,
        name: user.displayName,
      }
    });

    posthog.capture({
      distinctId: user.id,
      event: 'user_signed_in_server',
      properties: {
        $session_id: sessionId,
        email: user.email
      }
    });

    res.json({
      user,
      tokens
    });
  } catch (error) {
    next(error);
  }
};

export const refreshTokens = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    const { accessToken } = await refreshAccessToken(refreshToken);

    res.json({ accessToken });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    await revokeSession(refreshToken);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
