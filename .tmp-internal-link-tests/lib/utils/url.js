"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeUrl = normalizeUrl;
const WEBSITE_ERROR_MESSAGE = "Please enter a valid website";
function normalizeUrl(input) {
    const trimmed = input.trim();
    if (!trimmed) {
        throw new Error(WEBSITE_ERROR_MESSAGE);
    }
    const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    if (/\s/.test(withProtocol)) {
        throw new Error(WEBSITE_ERROR_MESSAGE);
    }
    let parsed;
    try {
        parsed = new URL(withProtocol);
    }
    catch (_a) {
        throw new Error(WEBSITE_ERROR_MESSAGE);
    }
    if (!["http:", "https:"].includes(parsed.protocol)) {
        throw new Error(WEBSITE_ERROR_MESSAGE);
    }
    if (!parsed.hostname || !parsed.hostname.includes(".")) {
        throw new Error(WEBSITE_ERROR_MESSAGE);
    }
    return withProtocol;
}
