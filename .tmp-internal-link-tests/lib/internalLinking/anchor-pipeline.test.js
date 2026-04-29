"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const suggestAnchorText_1 = require("./suggestAnchorText");
function makeTarget(overrides) {
    return Object.assign({ url: "https://example.com/services/recruitment-agency", canonicalUrl: null, title: "Recruitment Agency Services", h1: "Recruitment Agency", h2s: ["Executive Search", "Hiring Support"], primaryTopic: "recruitment agency services", topicPhrases: [{ phrase: "recruitment agency", source: "title", weight: 1 }], keywords: ["recruitment", "agency", "hiring"], bodyContexts: [], contentDebug: {
            selectedContentSelector: "main",
            totalHeadingCount: 0,
            paragraphCount: 0,
            listItemCount: 0,
            extractedBlockCount: 0,
            firstExtractedTextChunks: [],
            fallbackStrategyUsed: false,
            headingCounts: { h1: 0, h2: 0, h3: 0, h4: 0 },
            headingTexts: { h1: [], h2: [], h3: [], h4: [] },
            hasMultipleVisibleH1: false,
            contextualBodyLinks: [],
            blockedAnchorPhrases: [],
        }, existingInternalLinkTargets: [], existingInternalLinkEntries: [], inboundInternalLinkCount: 0, outboundInternalLinkCount: 0, commerciallyImportant: true, pageType: "service", indexable: true }, overrides);
}
function run() {
    var _a, _b;
    const rejected = ["bobs studio can", "dawson who can", "dawson on 01933"];
    for (const anchor of rejected) {
        strict_1.default.equal((0, suggestAnchorText_1.isValidAnchor)(anchor), false, `Expected anchor to be rejected: ${anchor}`);
    }
    const accepted = [
        "contemporary sculptor",
        "bronze sculptures",
        "recruitment agency",
        "family mediation",
        "technical SEO audit",
    ];
    for (const anchor of accepted) {
        strict_1.default.equal((0, suggestAnchorText_1.isValidAnchor)(anchor), true, `Expected anchor to be valid: ${anchor}`);
    }
    const recruitmentTarget = makeTarget({
        url: "https://example.com/services/recruitment-agency",
        title: "Recruitment Agency Services",
        h1: "Recruitment Agency",
        h2s: ["Recruitment Services"],
        primaryTopic: "recruitment agency",
        topicPhrases: [{ phrase: "recruitment agency", source: "title", weight: 1 }],
        pageType: "service",
    });
    const recruitmentSentence = "Spencer & James are a unique recruitment agency, with extensive experience in the search and selection of quality candidates.";
    const recruitmentSuggestion = (0, suggestAnchorText_1.suggestAnchorText)(recruitmentSentence, recruitmentTarget, {
        brandCandidates: ["spencer and james", "spencer & james"],
        sourcePageType: "service",
    });
    strict_1.default.equal(recruitmentSuggestion === null || recruitmentSuggestion === void 0 ? void 0 : recruitmentSuggestion.anchor, "recruitment agency", `Expected recruitment agency anchor, got: ${(_a = recruitmentSuggestion === null || recruitmentSuggestion === void 0 ? void 0 : recruitmentSuggestion.anchor) !== null && _a !== void 0 ? _a : "null"}`);
    const sculptureTarget = makeTarget({
        url: "https://example.com/bronze-sculptures",
        title: "Bronze Sculptures and Commissions",
        h1: "Bronze Sculptures",
        h2s: ["Commissioned Bronze Sculptures"],
        primaryTopic: "bronze sculptures",
        topicPhrases: [{ phrase: "bronze sculptures", source: "title", weight: 1 }],
        pageType: "profile",
    });
    const sculptureSentence = "Bob Dawson is a contemporary sculptor renowned for his bronze sculptures and his skill in working with materials such as cast aluminium, resin, plaster, concrete, and glass fibre.";
    const sculptureSuggestion = (0, suggestAnchorText_1.suggestAnchorText)(sculptureSentence, sculptureTarget, {
        brandCandidates: ["bob dawson", "dawson"],
        sourcePageType: "profile",
    });
    strict_1.default.equal(sculptureSuggestion === null || sculptureSuggestion === void 0 ? void 0 : sculptureSuggestion.anchor, "bronze sculptures", `Expected bronze sculptures anchor, got: ${(_b = sculptureSuggestion === null || sculptureSuggestion === void 0 ? void 0 : sculptureSuggestion.anchor) !== null && _b !== void 0 ? _b : "null"}`);
    console.log("anchor-pipeline tests passed");
}
run();
