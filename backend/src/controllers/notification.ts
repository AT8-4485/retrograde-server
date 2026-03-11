import { Request, Response, NextFunction } from 'express';
import { upsertPushToken, updateTokenPreferences, deletePushToken } from '../services/notification';

export const registerToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { token, platform, deviceName } = req.body;

    const pushToken = await upsertPushToken(userId, { token, platform, deviceName });

    res.status(201).json(pushToken);
  } catch (error) {
    next(error);
  }
};

export const updatePreferences = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { tokenId, preferences } = req.body;

    const updatedToken = await updateTokenPreferences(userId, tokenId, preferences);

    res.json(updatedToken);
  } catch (error) {
    next(error);
  }
};

export const removeToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const tokenId = req.params.tokenId as string;

    await deletePushToken(userId, tokenId);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
