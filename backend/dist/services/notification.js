"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deletePushToken = exports.updateTokenPreferences = exports.upsertPushToken = void 0;
const db_1 = require("../utils/db");
const uuid_1 = require("uuid");
const upsertPushToken = async (userId, data) => {
    // We use upsert to cleanly handle assigning an existing token to a new user
    // or creating it fresh if it's new.
    return db_1.db.pushToken.upsert({
        where: { token: data.token },
        update: {
            userId,
            platform: data.platform,
            deviceName: data.deviceName,
        },
        create: {
            id: (0, uuid_1.v7)(),
            userId,
            token: data.token,
            platform: data.platform,
            deviceName: data.deviceName,
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
