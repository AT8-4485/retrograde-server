"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.posthog = void 0;
const posthog_node_1 = require("posthog-node");
const config_1 = require("./config");
exports.posthog = new posthog_node_1.PostHog(config_1.config.POSTHOG_PROJECT_TOKEN || '', {
    host: config_1.config.POSTHOG_HOST,
    // Disable if the token isn't provided (e.g., in local dev without env vars)
    disabled: !config_1.config.POSTHOG_PROJECT_TOKEN,
    // Flush events frequently since this is a server handling stateless requests
    flushAt: 1,
    flushInterval: 0
});
