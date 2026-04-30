import { Request, Response, NextFunction } from 'express';
import { PushToken } from '@prisma/client';
import { upsertPushToken, updateTokenPreferences, deletePushToken, deletePushTokenByToken, getUserPushTokens } from '../services/notification';
import { sendPushNotification } from '../services/expoPush';
import { fetchFromWP } from '../services/wordpress';
import { ApiError } from '../middleware/errorHandler';

const serializePublicPushToken = (pushToken: PushToken) => ({
  id: pushToken.id,
  token: pushToken.token,
  platform: pushToken.platform,
  deviceName: pushToken.deviceName,
  createdAt: pushToken.createdAt,
  lastSeenAt: pushToken.lastSeenAt,
});

export const registerToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { token, platform, deviceName } = req.body;

    const pushToken = await upsertPushToken(userId, { token, platform, deviceName });

    res.status(201).json(serializePublicPushToken(pushToken));
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
    const { token } = req.body;

    await deletePushTokenByToken(token);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const removeTokenById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const tokenId = req.params.tokenId as string;

    await deletePushToken(userId, tokenId);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const simulatePush = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { mode, title, body, articleId } = req.body;

    // Fetch the user's registered push tokens
    const userTokens = await getUserPushTokens(userId);
    if (userTokens.length === 0) {
      throw new ApiError(404, 'https://api.retrogradenews.app/errors/not-found', 'No Push Tokens Found', 'You have not registered any devices for push notifications.');
    }

    const tokens = userTokens.map(t => t.token);

    if (mode === 'raw') {
      await sendPushNotification(tokens, title!, body!, { simulator: true });
      res.json({ message: 'Raw push notification sent successfully', tokens });
      return;
    }

    if (mode === 'article') {
      // Fetch the actual article from WordPress
      const params = new URLSearchParams({ include: articleId });
      const { data: articles } = await fetchFromWP(params);

      if (articles.length === 0) {
        throw new ApiError(404, 'https://api.retrogradenews.app/errors/not-found', 'Article Not Found', `Could not find an article with ID ${articleId}`);
      }

      const article = articles[0];
      const pushTitle = 'Breaking News';
      const pushBody = article.title;
      
      // The mobile app will use this deep link payload to navigate to the article
      const pushData = {
        type: 'article',
        postId: article.id,
        url: `retrograde://article/${article.id}`, 
        simulator: true
      };

      await sendPushNotification(tokens, pushTitle, pushBody, pushData);
      
      res.json({ 
        message: 'Article push notification simulated successfully', 
        articleTitle: pushBody,
        tokens
      });
      return;
    }

  } catch (error) {
    next(error);
  }
};
