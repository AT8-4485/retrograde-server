import { Request, Response, NextFunction } from 'express';
import { verifyAndIssueTokens, refreshAccessToken, revokeSession } from '../services/auth';

export const verifyFirebaseToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { firebaseIdToken } = req.body;
    const { user, tokens } = await verifyAndIssueTokens(firebaseIdToken);

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
