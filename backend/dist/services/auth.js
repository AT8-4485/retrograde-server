"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.revokeSession = exports.refreshAccessToken = exports.verifyAndIssueTokens = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const uuid_1 = require("uuid");
const firebase_1 = require("../utils/firebase");
const config_1 = require("../utils/config");
const user_1 = require("./user");
const session_1 = require("./session");
const errorHandler_1 = require("../middleware/errorHandler");
/**
 * Validates a Firebase token, provisions the user if they do not exist,
 * and issues local Access and Refresh tokens.
 */
const verifyAndIssueTokens = async (firebaseIdToken) => {
    try {
        let email = '';
        // Local Test Mode Bypass
        if ((config_1.config.NODE_ENV === 'dev' || config_1.config.NODE_ENV === 'test') && firebaseIdToken === 'MOCK_TOKEN_LEON@TEST.COM') {
            email = 'leon@test.com';
        }
        else {
            const decodedToken = await firebase_1.firebaseAuth.verifyIdToken(firebaseIdToken);
            if (!decodedToken.email) {
                throw new errorHandler_1.ApiError(400, 'https://api.retrogradenews.app/errors/bad-request', 'Bad Request', 'Firebase token does not contain an email');
            }
            email = decodedToken.email;
        }
        let user = await (0, user_1.findUserByEmail)(email);
        if (!user) {
            user = await (0, user_1.createUser)(email);
        }
        const tokens = await generateLocalTokens(user.id);
        return { user, tokens };
    }
    catch (error) {
        if (error instanceof errorHandler_1.ApiError) {
            throw error;
        }
        throw new errorHandler_1.ApiError(401, 'https://api.retrogradenews.app/errors/unauthorized', 'Unauthorized', 'Invalid Firebase ID token');
    }
};
exports.verifyAndIssueTokens = verifyAndIssueTokens;
/**
 * Validates a Refresh token, checks its existence in the database,
 * and issues a fresh Access token if valid.
 */
const refreshAccessToken = async (refreshToken) => {
    try {
        const decoded = jsonwebtoken_1.default.verify(refreshToken, config_1.config.JWT_REFRESH_SECRET);
        const jti = decoded.jti;
        const session = await (0, session_1.findSessionByJti)(jti);
        if (!session || new Date() > session.expiresAt) {
            throw new Error('Session expired or invalid');
        }
        const accessToken = jsonwebtoken_1.default.sign({ id: session.userId }, config_1.config.JWT_SECRET, { expiresIn: '15m' });
        return { accessToken };
    }
    catch (error) {
        throw new errorHandler_1.ApiError(401, 'https://api.retrogradenews.app/errors/unauthorized', 'Unauthorized', 'Invalid or expired refresh token');
    }
};
exports.refreshAccessToken = refreshAccessToken;
/**
 * Logs a user out by revoking their Refresh token (deleting the session).
 */
const revokeSession = async (refreshToken) => {
    try {
        // We ignore expiration so they can still log out even if the token has naturally expired
        const decoded = jsonwebtoken_1.default.verify(refreshToken, config_1.config.JWT_REFRESH_SECRET, { ignoreExpiration: true });
        const jti = decoded.jti;
        const session = await (0, session_1.findSessionByJti)(jti);
        if (session) {
            await (0, session_1.deleteSessionByJti)(jti);
        }
    }
    catch (error) {
        // If the token is completely malformed, we just ignore the logout attempt
        console.warn("Attempted to logout with malformed token", error);
    }
};
exports.revokeSession = revokeSession;
/**
 * Helper function to generate Access and Refresh tokens and save the session.
 */
const generateLocalTokens = async (userId) => {
    const accessToken = jsonwebtoken_1.default.sign({ id: userId }, config_1.config.JWT_SECRET, { expiresIn: '15m' });
    const jti = (0, uuid_1.v7)();
    // 60 days from now
    const expiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
    const refreshToken = jsonwebtoken_1.default.sign({ id: userId, jti }, config_1.config.JWT_REFRESH_SECRET, { expiresIn: '60d' });
    await (0, session_1.createSession)(userId, jti, expiresAt);
    return { accessToken, refreshToken };
};
