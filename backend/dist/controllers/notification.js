"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.simulatePush = exports.removeToken = exports.updatePreferences = exports.registerToken = void 0;
const notification_1 = require("../services/notification");
const expoPush_1 = require("../services/expoPush");
const wordpress_1 = require("../services/wordpress");
const errorHandler_1 = require("../middleware/errorHandler");
const registerToken = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { token, platform, deviceName } = req.body;
        const pushToken = await (0, notification_1.upsertPushToken)(userId, { token, platform, deviceName });
        res.status(201).json(pushToken);
    }
    catch (error) {
        next(error);
    }
};
exports.registerToken = registerToken;
const updatePreferences = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { tokenId, preferences } = req.body;
        const updatedToken = await (0, notification_1.updateTokenPreferences)(userId, tokenId, preferences);
        res.json(updatedToken);
    }
    catch (error) {
        next(error);
    }
};
exports.updatePreferences = updatePreferences;
const removeToken = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const tokenId = req.params.tokenId;
        await (0, notification_1.deletePushToken)(userId, tokenId);
        res.status(204).send();
    }
    catch (error) {
        next(error);
    }
};
exports.removeToken = removeToken;
const simulatePush = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { mode, title, body, articleId } = req.body;
        // Fetch the user's registered push tokens
        const userTokens = await (0, notification_1.getUserPushTokens)(userId);
        if (userTokens.length === 0) {
            throw new errorHandler_1.ApiError(404, 'https://api.retrogradenews.app/errors/not-found', 'No Push Tokens Found', 'You have not registered any devices for push notifications.');
        }
        const tokens = userTokens.map(t => t.token);
        if (mode === 'raw') {
            await (0, expoPush_1.sendPushNotification)(tokens, title, body, { simulator: true });
            res.json({ message: 'Raw push notification sent successfully', tokens });
            return;
        }
        if (mode === 'article') {
            // Fetch the actual article from WordPress
            const params = new URLSearchParams({ include: articleId });
            const { data: articles } = await (0, wordpress_1.fetchFromWP)(params);
            if (articles.length === 0) {
                throw new errorHandler_1.ApiError(404, 'https://api.retrogradenews.app/errors/not-found', 'Article Not Found', `Could not find an article with ID ${articleId}`);
            }
            const article = articles[0];
            const pushTitle = 'Breaking News';
            const pushBody = article.title;
            // The mobile app will use this deep link payload to navigate to the article
            const pushData = {
                type: 'article',
                articleId: article.id,
                url: `retrograde://article/${article.id}`,
                simulator: true
            };
            await (0, expoPush_1.sendPushNotification)(tokens, pushTitle, pushBody, pushData);
            res.json({
                message: 'Article push notification simulated successfully',
                articleTitle: pushBody,
                tokens
            });
            return;
        }
    }
    catch (error) {
        next(error);
    }
};
exports.simulatePush = simulatePush;
