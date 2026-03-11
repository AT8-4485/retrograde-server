"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.refreshTokens = exports.verifyFirebaseToken = void 0;
const auth_1 = require("../services/auth");
const verifyFirebaseToken = async (req, res, next) => {
    try {
        const { firebaseIdToken } = req.body;
        const { user, tokens } = await (0, auth_1.verifyAndIssueTokens)(firebaseIdToken);
        res.json({
            user,
            tokens
        });
    }
    catch (error) {
        next(error);
    }
};
exports.verifyFirebaseToken = verifyFirebaseToken;
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
