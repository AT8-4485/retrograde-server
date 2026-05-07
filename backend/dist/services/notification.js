"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendNewArticleNotification = exports.reserveNotificationDispatch = exports.getActivePushTokens = exports.getUserPushTokens = exports.deletePushTokenByToken = exports.deletePushToken = exports.updateTokenPreferences = exports.upsertPushToken = void 0;
const db_1 = require("../utils/db");
const client_1 = require("@prisma/client");
const uuid_1 = require("uuid");
const expoPush_1 = require("./expoPush");
const upsertPushToken = async (userId, data) => {
    const now = new Date();
    return db_1.db.pushToken.upsert({
        where: { token: data.token },
        update: {
            userId: userId ?? null,
            platform: data.platform,
            deviceName: data.deviceName,
            lastSeenAt: now,
        },
        create: {
            id: (0, uuid_1.v7)(),
            userId: userId ?? null,
            token: data.token,
            platform: data.platform,
            deviceName: data.deviceName,
            lastSeenAt: now,
        },
    });
};
exports.upsertPushToken = upsertPushToken;
const updateTokenPreferences = async (userId, tokenId, preferences) => {
    // First, verify the token belongs to the user
    const tokenRecord = await db_1.db.pushToken.findFirst({
        where: { id: tokenId, userId },
    });
    if (!tokenRecord) {
        throw new Error('Token not found or does not belong to user');
    }
    return db_1.db.pushToken.update({
        where: { id: tokenId },
        data: { preferences },
    });
};
exports.updateTokenPreferences = updateTokenPreferences;
const deletePushToken = async (userId, tokenId) => {
    await db_1.db.pushToken.deleteMany({
        where: {
            id: tokenId,
            userId,
        },
    });
};
exports.deletePushToken = deletePushToken;
const deletePushTokenByToken = async (token) => {
    await db_1.db.pushToken.deleteMany({
        where: { token },
    });
};
exports.deletePushTokenByToken = deletePushTokenByToken;
const getUserPushTokens = async (userId) => {
    return db_1.db.pushToken.findMany({
        where: { userId },
    });
};
exports.getUserPushTokens = getUserPushTokens;
const getActivePushTokens = async () => {
    return db_1.db.pushToken.findMany({
        select: { token: true },
    });
};
exports.getActivePushTokens = getActivePushTokens;
const reserveNotificationDispatch = async (articleId, type) => {
    try {
        await db_1.db.notificationDispatch.create({
            data: {
                id: (0, uuid_1.v7)(),
                articleId,
                type,
            },
        });
        return true;
    }
    catch (error) {
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            return false;
        }
        throw error;
    }
};
exports.reserveNotificationDispatch = reserveNotificationDispatch;
const cleanText = (value) => {
    if (!value)
        return '';
    return value
        .replace(/<[^>]*>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&apos;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/\s+/g, ' ')
        .trim();
};
const sendNewArticleNotification = async (article) => {
    const dispatchReserved = await (0, exports.reserveNotificationDispatch)(article.id, 'new_article');
    if (!dispatchReserved) {
        return 'duplicate';
    }
    const tokenRecords = await (0, exports.getActivePushTokens)();
    if (tokenRecords.length === 0) {
        return 'no-tokens';
    }
    await (0, expoPush_1.sendPushNotification)(tokenRecords.map(record => record.token), cleanText(article.title) || 'New article', cleanText(article.excerpt) || 'Read the latest from The Retrograde.', {
        type: 'article',
        postId: article.id,
    });
    return 'sent';
};
exports.sendNewArticleNotification = sendNewArticleNotification;
