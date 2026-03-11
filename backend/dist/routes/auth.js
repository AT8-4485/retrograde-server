"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const auth_1 = require("../controllers/auth");
const rateLimiter_1 = require("../middleware/rateLimiter");
const errorHandler_1 = require("../middleware/errorHandler");
const router = (0, express_1.Router)();
const verifySchema = zod_1.z.object({
    firebaseIdToken: zod_1.z.string().min(1, 'Firebase ID Token is required'),
});
const refreshSchema = zod_1.z.object({
    refreshToken: zod_1.z.string().min(1, 'Refresh Token is required'),
});
const validateBody = (schema) => (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
        const messages = result.error.issues.map((e) => e.message).join(', ');
        return next(new errorHandler_1.ApiError(400, 'https://api.retrogradenews.app/errors/bad-request', 'Bad Request', messages));
    }
    next();
};
router.post('/verify', rateLimiter_1.publicLimiter, validateBody(verifySchema), auth_1.verifyFirebaseToken);
router.post('/refresh', rateLimiter_1.publicLimiter, validateBody(refreshSchema), auth_1.refreshTokens);
router.post('/logout', rateLimiter_1.authLimiter, validateBody(refreshSchema), auth_1.logout);
exports.default = router;
