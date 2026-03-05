"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = exports.prisma = void 0;
const client_1 = require("@prisma/client");
const uuid_1 = require("uuid");
exports.prisma = global.prisma || new client_1.PrismaClient();
if (process.env.NODE_ENV !== 'production') {
    global.prisma = exports.prisma;
}
exports.db = exports.prisma.$extends({
    query: {
        $allModels: {
            async create({ args, query }) {
                args.data = {
                    ...args.data,
                    id: args.data.id || (0, uuid_1.v7)(),
                };
                return query(args);
            },
        },
    },
});
