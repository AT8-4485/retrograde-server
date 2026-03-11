"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteSessionByJti = exports.findSessionByJti = exports.createSession = void 0;
const db_1 = require("../utils/db");
const uuid_1 = require("uuid");
const createSession = async (userId, jti, expiresAt) => {
    return db_1.db.session.create({
        data: {
            id: (0, uuid_1.v7)(),
            userId,
            jti,
            expiresAt,
        },
    });
};
exports.createSession = createSession;
const findSessionByJti = async (jti) => {
    return db_1.db.session.findUnique({
        where: { jti },
    });
};
exports.findSessionByJti = findSessionByJti;
const deleteSessionByJti = async (jti) => {
    await db_1.db.session.delete({
        where: { jti },
    });
};
exports.deleteSessionByJti = deleteSessionByJti;
