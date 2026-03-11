"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const wordpress_1 = require("../services/wordpress");
const router = (0, express_1.Router)();
// Zod schema to parse and coerce query params
const feedQuerySchema = zod_1.z.object({
    cursor: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(50).default(10), // Added a max of 50 for safety!
});
router.get('/', async (req, res, next) => {
    try {
        const query = feedQuerySchema.safeParse(req.query);
        if (!query.success) {
            // Let zod error handler in middleware process this
            throw query.error;
        }
        // Ensure parameters are positive integers
        const page = isNaN(query.data.cursor) || query.data.cursor < 1 ? 1 : query.data.cursor;
        const limit = isNaN(query.data.limit) || query.data.limit < 1 ? 10 : query.data.limit;
        const { data, totalPages } = await (0, wordpress_1.fetchFeed)(page, limit);
        const hasMore = page < totalPages;
        // Cast next cursor back to string for the mobile client's contract
        const nextCursor = hasMore ? String(page + 1) : null;
        res.json({
            data,
            cursor: nextCursor,
            hasMore
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
