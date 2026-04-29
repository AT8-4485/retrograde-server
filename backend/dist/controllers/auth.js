"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.refreshTokens = exports.verifyOtp = exports.requestOtp = void 0;
const auth_1 = require("../services/auth");
const posthog_1 = require("../utils/posthog");
const requestOtp = async (req, res, next) => {
    try {
        const { email } = req.body;
        const distinctId = req.headers['x-posthog-distinct-id'];
        const sessionId = req.headers['x-posthog-session-id'];
        await (0, auth_1.sendOtp)(email);
        posthog_1.posthog.capture({
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
    }
    catch (error) {
        next(error);
    }
};
exports.requestOtp = requestOtp;
const verifyOtp = async (req, res, next) => {
    try {
        const { email, code } = req.body;
        const distinctId = req.headers['x-posthog-distinct-id'];
        const sessionId = req.headers['x-posthog-session-id'];
        const { user, tokens } = await (0, auth_1.verifyAndIssueTokens)(email, code);
        if (distinctId && distinctId !== user.id) {
            posthog_1.posthog.alias({
                distinctId: user.id,
                alias: distinctId
            });
        }
        posthog_1.posthog.identify({
            distinctId: user.id,
            properties: {
                email: user.email,
                name: user.displayName,
            }
        });
        posthog_1.posthog.capture({
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
    }
    catch (error) {
        next(error);
    }
};
exports.verifyOtp = verifyOtp;
const refreshTokens = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        const { accessToken } = await (0, auth_1.refreshAccessToken)(refreshToken);
        res.json({ accessToken });
    }
    catch (error) {
        next(error);
    }
};
exports.refreshTokens = refreshTokens;
const logout = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        await (0, auth_1.revokeSession)(refreshToken);
        res.status(204).send();
    }
    catch (error) {
        next(error);
    }
};
exports.logout = logout;
