"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatHistoryDelta = formatHistoryDelta;
exports.interpretAuditHistory = interpretAuditHistory;
function signedValue(value) {
    if (value === null) {
        return "Baseline";
    }
    return value > 0 ? `+${value}` : `${value}`;
}
function formatHistoryDelta(value, invertMeaning = false) {
    if (value === null) {
        return "Baseline";
    }
    const adjusted = invertMeaning ? value * -1 : value;
    return signedValue(adjusted);
}
function interpretAuditHistory(entry) {
    var _a, _b;
    if (!entry || entry.scoreDelta === null) {
        return {
            headline: "This scan is your baseline",
            body: "Use this run as the reference point. The next scan will show whether score, issue count, and internal linking coverage are improving in the right direction.",
            tone: "neutral",
        };
    }
    const scoreUp = entry.scoreDelta > 0;
    const issuesDown = ((_a = entry.issueCountDelta) !== null && _a !== void 0 ? _a : 0) < 0;
    const linksDown = ((_b = entry.internalLinkOpportunityDelta) !== null && _b !== void 0 ? _b : 0) < 0;
    if (scoreUp && issuesDown && linksDown) {
        return {
            headline: "The page is moving in the right direction",
            body: `Score is up ${signedValue(entry.scoreDelta)}, while issues and internal link gaps are both down versus the previous scan.`,
            tone: "positive",
        };
    }
    if (!scoreUp && !issuesDown) {
        return {
            headline: "Recent changes are not improving the page yet",
            body: `Score changed ${signedValue(entry.scoreDelta)} and issue count changed ${signedValue(entry.issueCountDelta)}. Recheck the highest-impact fixes before the next scan.`,
            tone: "warning",
        };
    }
    return {
        headline: "Some signals are improving, but the page is still mixed",
        body: `Score changed ${signedValue(entry.scoreDelta)}, issue count changed ${signedValue(entry.issueCountDelta)}, and internal linking opportunities changed ${signedValue(entry.internalLinkOpportunityDelta)}.`,
        tone: "neutral",
    };
}
