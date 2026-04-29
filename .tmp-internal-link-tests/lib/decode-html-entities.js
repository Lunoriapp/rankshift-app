"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decodeHtmlEntities = decodeHtmlEntities;
const NAMED_ENTITIES = {
    amp: "&",
    lt: "<",
    gt: ">",
    quot: '"',
    apos: "'",
    nbsp: " ",
};
function decodeHtmlEntities(value) {
    return value
        .replace(/&([a-zA-Z]+);/g, (match, name) => {
        var _a;
        const lower = name.toLowerCase();
        return (_a = NAMED_ENTITIES[lower]) !== null && _a !== void 0 ? _a : match;
    })
        .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number.parseInt(code, 10)))
        .replace(/&#x([0-9a-fA-F]+);/g, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)));
}
