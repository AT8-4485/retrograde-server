"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.firebaseAuth = void 0;
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const config_1 = require("./config");
try {
    const serviceAccount = JSON.parse(config_1.config.FIREBASE_SERVICE_ACCOUNT);
    if (!firebase_admin_1.default.apps.length) {
        firebase_admin_1.default.initializeApp({
            credential: firebase_admin_1.default.credential.cert(serviceAccount)
        });
    }
}
catch (error) {
    console.warn("⚠️ Firebase Initialization Failed.");
    console.warn("If you are running locally, ensure FIREBASE_SERVICE_ACCOUNT in .env is a structurally valid JSON with a 'private_key' and 'client_email'.");
    console.warn("Local auth tests bypassing Firebase will still work using the magic MOCK_TOKEN_LEON@TEST.COM token.");
}
exports.firebaseAuth = firebase_admin_1.default.apps.length ? firebase_admin_1.default.auth() : {};
