import jwt from 'jsonwebtoken';
import { v7 as uuidv7 } from 'uuid';
import { firebaseAuth } from '../utils/firebase';
import { config } from '../utils/config';
import { findUserByEmail, createUser } from './user';
import { User } from '@prisma/client';
import { createSession, findSessionByJti, deleteSessionByJti } from './session';
import { ApiError } from '../middleware/errorHandler';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

/**
 * Validates a Firebase token, provisions the user if they do not exist,
 * and issues local Access and Refresh tokens.
 */
export const verifyAndIssueTokens = async (firebaseIdToken: string): Promise<{ user: User, tokens: AuthTokens }> => {
  try {
    let email = '';

    // Local Test Mode Bypass
    if ((config.NODE_ENV === 'dev' || config.NODE_ENV === 'test') && firebaseIdToken === 'MOCK_TOKEN_LEON@TEST.COM') {
      email = 'leon@test.com';
    } else {
      const decodedToken = await firebaseAuth.verifyIdToken(firebaseIdToken);
      if (!decodedToken.email) {
        throw new ApiError(400, 'https://api.retrogradenews.app/errors/bad-request', 'Bad Request', 'Firebase token does not contain an email');
      }
      email = decodedToken.email;
    }

    let user = await findUserByEmail(email);

    if (!user) {
      user = await createUser(email);
    }

    const tokens = await generateLocalTokens(user.id);
    return { user, tokens };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(401, 'https://api.retrogradenews.app/errors/unauthorized', 'Unauthorized', 'Invalid Firebase ID token');
  }
};

/**
 * Validates a Refresh token, checks its existence in the database,
 * and issues a fresh Access token if valid.
 */
export const refreshAccessToken = async (refreshToken: string): Promise<{ accessToken: string }> => {
  try {
    const decoded = jwt.verify(refreshToken, config.JWT_REFRESH_SECRET) as { jti: string, id: string };
    const jti = decoded.jti;

    const session = await findSessionByJti(jti);

    if (!session || new Date() > session.expiresAt) {
      throw new Error('Session expired or invalid');
    }

    const accessToken = jwt.sign({ id: session.userId }, config.JWT_SECRET, { expiresIn: '15m' });

    return { accessToken };
  } catch (error) {
    throw new ApiError(401, 'https://api.retrogradenews.app/errors/unauthorized', 'Unauthorized', 'Invalid or expired refresh token');
  }
};

/**
 * Logs a user out by revoking their Refresh token (deleting the session).
 */
export const revokeSession = async (refreshToken: string): Promise<void> => {
  try {
    // We ignore expiration so they can still log out even if the token has naturally expired
    const decoded = jwt.verify(refreshToken, config.JWT_REFRESH_SECRET, { ignoreExpiration: true }) as { jti: string };
    const jti = decoded.jti;

    const session = await findSessionByJti(jti);
    if (session) {
      await deleteSessionByJti(jti);
    }
  } catch (error) {
    // If the token is completely malformed, we just ignore the logout attempt
    console.warn("Attempted to logout with malformed token", error);
  }
};

/**
 * Helper function to generate Access and Refresh tokens and save the session.
 */
const generateLocalTokens = async (userId: string): Promise<AuthTokens> => {
  const accessToken = jwt.sign({ id: userId }, config.JWT_SECRET, { expiresIn: '15m' });
  
  const jti = uuidv7();
  // 60 days from now
  const expiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
  
  const refreshToken = jwt.sign({ id: userId, jti }, config.JWT_REFRESH_SECRET, { expiresIn: '60d' });

  await createSession(userId, jti, expiresAt);

  return { accessToken, refreshToken };
};
