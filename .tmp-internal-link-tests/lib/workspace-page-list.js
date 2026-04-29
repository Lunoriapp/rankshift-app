"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWorkspacePagePriority = getWorkspacePagePriority;
exports.getScoreDelta = getScoreDelta;
exports.formatScoreDelta = formatScoreDelta;
exports.formatLastScannedDate = formatLastScannedDate;
function getWorkspacePagePriority(score) {
    if (score <= 39) {
        return "critical";
    }
    if (score <= 59) {
        return "high";
    }
    if (score <= 79) {
        return "medium";
    }
    return "good";
}
function getScoreDelta(score, previousScore) {
    if (previousScore === null) {
        return null;
    }
    return score - previousScore;
}
function formatScoreDelta(delta) {
    if (delta === null || delta === 0) {
        return "0";
    }
    return delta > 0 ? `+${delta}` : `${delta}`;
}
function formatLastScannedDate(value) {
    const date = new Date(value);
    return new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
    }).format(date);
}
