"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const auth_1 = require("../middleware/auth");
const notification_1 = require("../controllers/notification");
const errorHandler_1 = require("../middleware/errorHandler");
const router = (0, express_1.Router)();
// Ensure all routes in this router require authentication
router.use(auth_1.requireAuth);
const registerTokenBodySchema = zod_1.z.object({
    token: zod_1.z.string().min(1, 'Token is required'),
    platform: zod_1.z.enum(['ios', 'android', 'web']),
    deviceName: zod_1.z.string().optional(),
});
const updatePreferencesBodySchema = zod_1.z.object({
    tokenId: zod_1.z.string().min(1, 'Token ID is required'),
    // We expect a valid JSON string from the client for flexible preferences
    preferences: zod_1.z.string().min(2, 'Preferences string cannot be empty'),
});
const validateBody = (schema) => (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
        const messages = result.error.issues.map((e) => e.message).join(', ');
        return next(new errorHandler_1.ApiError(400, 'https://api.retrogradenews.app/errors/bad-request', 'Bad Request', messages));
    }
    next();
};
const simulatePushBodySchema = zod_1.z.object({
    mode: zod_1.z.enum(['raw', 'article']),
    title: zod_1.z.string().optional(),
    body: zod_1.z.string().optional(),
    articleId: zod_1.z.string().optional(),
}).refine(data => {
    if (data.mode === 'raw') {
        return !!data.title && !!data.body;
    }
    if (data.mode === 'article') {
        return !!data.articleId;
    }
    return true;
}, {
    message: "Raw mode requires title and body. Article mode requires articleId."
});
router.post('/token', validateBody(registerTokenBodySchema), notification_1.registerToken);
router.patch('/preferences', validateBody(updatePreferencesBodySchema), notification_1.updatePreferences);
router.delete('/token/:tokenId', notification_1.removeToken);
router.post('/simulate', validateBody(simulatePushBodySchema), notification_1.simulatePush);
exports.default = router;
