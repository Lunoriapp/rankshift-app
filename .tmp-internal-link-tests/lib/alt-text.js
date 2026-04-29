"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getImageFileName = getImageFileName;
exports.buildSuggestedAltText = buildSuggestedAltText;
const GENERIC_IMAGE_WORDS = new Set([
    "image",
    "images",
    "img",
    "photo",
    "photos",
    "picture",
    "pictures",
    "graphic",
    "graphics",
    "banner",
    "hero",
    "icon",
    "logo",
    "thumbnail",
    "thumb",
    "stock",
    "copy",
    "final",
    "large",
    "small",
    "medium",
    "desktop",
    "mobile",
    "web",
    "site",
    "homepage",
]);
const STOP_WORDS = new Set([
    "a",
    "an",
    "and",
    "are",
    "as",
    "at",
    "be",
    "by",
    "for",
    "from",
    "in",
    "into",
    "is",
    "it",
    "of",
    "on",
    "or",
    "our",
    "that",
    "the",
    "their",
    "this",
    "to",
    "with",
    "your",
]);
function normalizeWhitespace(value) {
    return value.replace(/\s+/g, " ").trim();
}
function toWords(value) {
    return normalizeWhitespace(value
        .toLowerCase()
        .replace(/\.[a-z0-9]{2,5}$/i, " ")
        .replace(/[_\-]+/g, " ")
        .replace(/[^a-z0-9\s]/g, " "))
        .split(" ")
        .map((part) => part.trim())
        .filter(Boolean)
        .map((part) => part.replace(/(?:es|s)$/i, (match) => (part.length > 4 ? "" : match)))
        .filter((part) => part.length > 1 && !/^\d+$/.test(part));
}
function getImageFileName(src) {
    var _a, _b, _c;
    if (!src) {
        return "unknown-image";
    }
    try {
        const parsed = new URL(src);
        const fileName = parsed.pathname.split("/").filter(Boolean).pop();
        return fileName || src;
    }
    catch (_d) {
        const withoutQuery = (_b = (_a = src.split("?")[0]) === null || _a === void 0 ? void 0 : _a.split("#")[0]) !== null && _b !== void 0 ? _b : src;
        return (_c = withoutQuery.split("/").filter(Boolean).pop()) !== null && _c !== void 0 ? _c : src;
    }
}
function getMeaningfulFilenameWords(src) {
    return toWords(getImageFileName(src)).filter((word) => !GENERIC_IMAGE_WORDS.has(word));
}
function getContextWords(surroundingText) {
    return toWords(surroundingText).filter((word) => !STOP_WORDS.has(word) && !GENERIC_IMAGE_WORDS.has(word));
}
function sentenceCase(words) {
    if (words.length === 0) {
        return "";
    }
    const text = words.join(" ");
    return text.charAt(0).toUpperCase() + text.slice(1);
}
function buildSuggestedAltText(input) {
    const fileWords = getMeaningfulFilenameWords(input.src);
    const contextWords = getContextWords(input.surroundingText);
    const chosenWords = [...fileWords];
    for (const word of contextWords) {
        if (chosenWords.includes(word)) {
            continue;
        }
        chosenWords.push(word);
        if (chosenWords.length >= 8) {
            break;
        }
    }
    const fallbackWords = contextWords.slice(0, 6);
    const altWords = (chosenWords.length > 0 ? chosenWords : fallbackWords).slice(0, 12);
    if (altWords.length === 0) {
        return "Descriptive page image";
    }
    return sentenceCase(altWords);
}
