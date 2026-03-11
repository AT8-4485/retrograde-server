"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const wordpress_1 = require("../services/wordpress");
const errorHandler_1 = require("../middleware/errorHandler");
const router = (0, express_1.Router)();
// Zod schema to parse and coerce query params
const feedQuerySchema = zod_1.z.object({
    cursor: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(50).default(10),
});
const categoryQuerySchema = feedQuerySchema.extend({
    categories: zod_1.z.preprocess((val) => {
        if (typeof val === 'string') {
            return val.split(',').map((v) => parseInt(v.trim(), 10)).filter((v) => !isNaN(v));
        }
        return val;
    }, zod_1.z.array(zod_1.z.number()).min(1)),
});
router.get('/', async (req, res, next) => {
    try {
        const query = feedQuerySchema.safeParse(req.query);
        if (!query.success) {
            throw new errorHandler_1.ApiError(400, 'https://api.retrogradenews.app/errors/bad-request', 'Bad Request', query.error.issues.map((e) => e.message).join(', '));
        }
        const page = query.data.cursor;
        const limit = query.data.limit;
        const { data, totalPages } = await (0, wordpress_1.fetchFeed)(page, limit);
        const hasMore = page < totalPages;
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
router.get('/category', async (req, res, next) => {
    try {
        const query = categoryQuerySchema.safeParse(req.query);
        if (!query.success) {
            throw new errorHandler_1.ApiError(400, 'https://api.retrogradenews.app/errors/bad-request', 'Bad Request', query.error.issues.map((e) => e.message).join(', '));
        }
        const page = query.data.cursor;
        const limit = query.data.limit;
        const categories = query.data.categories;
        const { data, totalPages } = await (0, wordpress_1.fetchFeedByCategory)(categories, page, limit);
        const hasMore = page < totalPages;
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
router.get('/issues', async (req, res, next) => {
    try {
        const query = feedQuerySchema.safeParse(req.query);
        if (!query.success) {
            throw new errorHandler_1.ApiError(400, 'https://api.retrogradenews.app/errors/bad-request', 'Bad Request', query.error.issues.map((e) => e.message).join(', '));
        }
        const page = query.data.cursor;
        const limit = query.data.limit;
        const { data, totalPages } = await (0, wordpress_1.fetchIssues)(page, limit);
        const hasMore = page < totalPages;
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
router.get('/issues/latest', async (req, res, next) => {
    try {
        const issue = await (0, wordpress_1.fetchLatestIssue)();
        if (!issue) {
            res.json({ issue: null, articles: [] });
            return;
        }
        const { data: articles } = await (0, wordpress_1.fetchArticlesByDate)(issue.publishedAt);
        res.json({
            issue,
            articles
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
