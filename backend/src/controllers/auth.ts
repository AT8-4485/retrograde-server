import { Request, Response, NextFunction } from 'express';
import { sendOtp, verifyAndIssueTokens, refreshAccessToken, revokeSession } from '../services/auth';

export const requestOtp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email } = req.body;
    await sendOtp(email);

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
    const { user, tokens } = await verifyAndIssueTokens(email, code);

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
