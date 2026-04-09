"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const auth_1 = require("../middleware/auth");
const bookmark_1 = require("../controllers/bookmark");
const errorHandler_1 = require("../middleware/errorHandler");
const router = (0, express_1.Router)();
// Ensure all routes in this router require authentication
router.use(auth_1.requireAuth);
const getBookmarksQuerySchema = zod_1.z.object({
    cursor: zod_1.z.string().optional(),
    limit: zod_1.z.coerce.number().int().min(1).max(50).default(10),
    type: zod_1.z.string().optional(),
});
const createBookmarkBodySchema = zod_1.z.object({
    type: zod_1.z.string().min(1, 'Type is required'),
    title: zod_1.z.string().min(1, 'Title is required'),
    url: zod_1.z.string().url('Must be a valid URL'),
    thumbnailUrl: zod_1.z.string().url('Must be a valid URL').optional().or(zod_1.z.literal('')),
    metadata: zod_1.z.string().optional(), // Expected to be JSON string if provided
});
const validateQuery = (schema) => (req, res, next) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
        const messages = result.error.issues.map((e) => e.message).join(', ');
        return next(new errorHandler_1.ApiError(400, 'https://api.retrogradenews.app/errors/bad-request', 'Bad Request', messages));
    }
    // Optional: override req.query with the coerced/defaulted values
    Object.assign(req.query, result.data);
    next();
};
const validateBody = (schema) => (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
        const messages = result.error.issues.map((e) => e.message).join(', ');
        return next(new errorHandler_1.ApiError(400, 'https://api.retrogradenews.app/errors/bad-request', 'Bad Request', messages));
    }
    next();
};
router.get('/', validateQuery(getBookmarksQuerySchema), bookmark_1.get);
router.post('/', validateBody(createBookmarkBodySchema), bookmark_1.create);
router.delete('/:id', bookmark_1.remove);
exports.default = router;
