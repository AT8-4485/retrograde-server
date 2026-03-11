"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteBookmark = exports.createBookmark = exports.getBookmarks = void 0;
const db_1 = require("../utils/db");
const uuid_1 = require("uuid");
const getBookmarks = async (userId, limit, cursor, type) => {
    const whereClause = { userId };
    if (type) {
        whereClause.type = type;
    }
    const queryParams = {
        where: whereClause,
        take: limit + 1, // Fetch one extra to determine if there are more
        orderBy: { createdAt: 'desc' },
    };
    if (cursor) {
        queryParams.cursor = { id: cursor };
    }
    const bookmarks = await db_1.db.bookmark.findMany(queryParams);
    let hasMore = false;
    if (bookmarks.length > limit) {
        hasMore = true;
        bookmarks.pop(); // Remove the extra record
    }
    const nextCursor = hasMore ? bookmarks[bookmarks.length - 1].id : null;
    return { data: bookmarks, nextCursor, hasMore };
};
exports.getBookmarks = getBookmarks;
const createBookmark = async (userId, data) => {
    return db_1.db.bookmark.create({
        data: {
            id: (0, uuid_1.v7)(),
            userId,
            type: data.type,
            title: data.title,
            url: data.url,
            thumbnailUrl: data.thumbnailUrl,
            metadata: data.metadata,
        },
    });
};
exports.createBookmark = createBookmark;
const deleteBookmark = async (userId, bookmarkId) => {
    await db_1.db.bookmark.deleteMany({
        where: {
            id: bookmarkId,
            userId, // Critical IDOR protection
        },
    });
};
exports.deleteBookmark = deleteBookmark;
