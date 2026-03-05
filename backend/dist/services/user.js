"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.updateUser = exports.createUser = exports.findUserByEmail = exports.findUserById = void 0;
const db_1 = require("../utils/db");
const uuid_1 = require("uuid");
const findUserById = async (id) => {
    return db_1.db.user.findUnique({
        where: { id },
    });
};
exports.findUserById = findUserById;
const findUserByEmail = async (email) => {
    return db_1.db.user.findUnique({
        where: { email },
    });
};
exports.findUserByEmail = findUserByEmail;
const createUser = async (email) => {
    return db_1.db.user.create({
        data: {
            id: (0, uuid_1.v7)(),
            email,
        },
    });
};
exports.createUser = createUser;
const updateUser = async (id, data) => {
    return db_1.db.user.update({
        where: { id },
        data,
    });
};
exports.updateUser = updateUser;
const deleteUser = async (id) => {
    await db_1.db.user.delete({
        where: { id },
    });
};
exports.deleteUser = deleteUser;
