"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.workos = void 0;
const node_1 = require("@workos-inc/node");
const config_1 = require("./config");
exports.workos = new node_1.WorkOS(config_1.config.WORKOS_API_KEY);
