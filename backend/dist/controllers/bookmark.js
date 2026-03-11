"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.remove = exports.create = exports.get = void 0;
const bookmark_1 = require("../services/bookmark");
const get = async (req, res, next) => {
    try {
        // Validated by Zod in the route definition
        const limit = Number(req.query.limit);
        const cursor = req.query.cursor;
        const type = req.query.type;
        // req.user is guaranteed by requireAuth middleware
        const userId = req.user.id;
        const result = await (0, bookmark_1.getBookmarks)(userId, limit, cursor, type);
        res.json({
            data: result.data,
            cursor: result.nextCursor,
            hasMore: result.hasMore,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.get = get;
const create = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const data = req.body;
        const bookmark = await (0, bookmark_1.createBookmark)(userId, data);
        res.status(201).json(bookmark);
    }
    catch (error) {
        next(error);
    }
};
exports.create = create;
const remove = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const bookmarkId = req.params.id;
        await (0, bookmark_1.deleteBookmark)(userId, bookmarkId);
        // 204 No Content is standard for successful deletions
        res.status(204).send();
    }
    catch (error) {
        next(error);
    }
};
exports.remove = remove;
