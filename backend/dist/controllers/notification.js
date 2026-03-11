"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeToken = exports.updatePreferences = exports.registerToken = void 0;
const notification_1 = require("../services/notification");
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
