"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractEditorialContentInBrowser = extractEditorialContentInBrowser;
function extractEditorialContentInBrowser(input) {
    var _a, _b, _c;
    const { cookiePatterns, currentUrl } = input;
    const normalizeWhitespace = (value) => value.replace(/\s+/g, " ").trim();
    const normalizeAnchorPhrase = (value) => normalizeWhitespace(value)
        .replace(/^[^a-z0-9]+|[^a-z0-9]+$/gi, "")
        .toLowerCase();
    const prioritizedSelectors = [
        ".article-body",
        "#ai-content .article-body",
        "#ai-content",
        "article",
        "main",
    ];
    const boilerplatePatterns = [
        "nav",
        "footer",
        "header",
        "sidebar",
        "aside",
        "cookie",
        "consent",
        "banner",
        "cta",
        "call-to-action",
        "newsletter",
        "subscribe",
        "signup",
        "sign-up",
        "related",
        "recommended",
        "share",
        "social",
        "breadcrumb",
        "breadcrumbs",
        "author",
        "comment",
        "pagination",
        "popup",
        "modal",
        "form",
        "search",
        "filter",
        "toc",
        "table-of-contents",
        "hero",
        "promo",
        "announcement",
        "faq",
    ];
    const shouldIgnoreByTag = (element) => {
        let current = element;
        while (current) {
            const tagName = current.tagName.toLowerCase();
            if (["header", "nav", "footer", "aside", "form"].includes(tagName)) {
                return true;
            }
            current = current.parentElement;
        }
        return false;
    };
    const isCookieRelatedElement = (element) => {
        let current = element;
        while (current) {
            const attributes = [
                current.id,
                current.className,
                current.getAttribute("role"),
                current.getAttribute("aria-label"),
                current.getAttribute("aria-labelledby"),
                current.getAttribute("data-nosnippet"),
            ]
                .filter((value) => typeof value === "string" && value.length > 0)
                .join(" ")
                .toLowerCase();
            const isDialog = current.getAttribute("role") === "dialog" ||
                current.getAttribute("aria-modal") === "true" ||
                current.tagName.toLowerCase() === "dialog";
            if (isDialog || cookiePatterns.some((pattern) => attributes.includes(pattern))) {
                return true;
            }
            current = current.parentElement;
        }
        return false;
    };
    const hasBoilerplateSignal = (element) => {
        let current = element;
        while (current) {
            const haystack = [
                current.id,
                current.className,
                current.getAttribute("role"),
                current.getAttribute("aria-label"),
                current.getAttribute("data-testid"),
            ]
                .filter((value) => typeof value === "string" && value.length > 0)
                .join(" ")
                .toLowerCase();
            if (boilerplatePatterns.some((pattern) => haystack.includes(pattern))) {
                return true;
            }
            current = current.parentElement;
        }
        return false;
    };
    const isMeaningfulTextBlock = (text, isParagraph) => {
        const minLength = isParagraph ? 60 : 38;
        return text.length >= minLength;
    };
    const cloneAndCleanRoot = (root) => {
        const clonedRoot = root.cloneNode(true);
        clonedRoot
            .querySelectorAll("script, style, noscript, svg, form, nav, footer, aside, iframe, dialog, [role='dialog'], [aria-modal='true'], .sr-only, .visually-hidden")
            .forEach((node) => node.remove());
        clonedRoot.querySelectorAll("*").forEach((node) => {
            if (shouldIgnoreByTag(node) ||
                isCookieRelatedElement(node) ||
                hasBoilerplateSignal(node)) {
                node.remove();
            }
        });
        clonedRoot
            .querySelectorAll("[class*='cta'], [id*='cta'], [class*='related'], [id*='related'], [class*='share'], [id*='share'], [class*='recommend'], [id*='recommend'], [class*='newsletter'], [id*='newsletter'], [class*='subscribe'], [id*='subscribe'], [class*='author'], [id*='author'], [class*='comment'], [id*='comment'], [class*='breadcrumb'], [id*='breadcrumb'], [class*='popup'], [id*='popup'], [class*='hero'], [id*='hero'], [class*='promo'], [id*='promo'], [class*='search'], [id*='search'], [class*='faq'], [id*='faq']")
            .forEach((node) => node.remove());
        return clonedRoot;
    };
    const isElementHidden = (element) => {
        if (element.getAttribute("aria-hidden") === "true" || element.hidden) {
            return true;
        }
        if (element.offsetParent === null) {
            const style = window.getComputedStyle(element);
            if (style.position !== "fixed") {
                return true;
            }
            if (style.display === "none" || style.visibility === "hidden") {
                return true;
            }
        }
        return false;
    };
    const isInsideNonContentContainer = (element) => {
        var _a, _b;
        let current = element;
        while (current) {
            const id = current.id.toLowerCase();
            const className = typeof current.className === "string" ? current.className.toLowerCase() : "";
            const role = (_b = (_a = current.getAttribute("role")) === null || _a === void 0 ? void 0 : _a.toLowerCase()) !== null && _b !== void 0 ? _b : "";
            const ariaHidden = current.getAttribute("aria-hidden");
            if (ariaHidden === "true" ||
                id === "ccc-module" ||
                id.includes("overlay") ||
                className.includes("overlay") ||
                className.includes("cookie") ||
                className.includes("consent") ||
                role === "dialog") {
                return true;
            }
            current = current.parentElement;
        }
        return false;
    };
    const extractVisibleDocumentH1s = () => Array.from(document.querySelectorAll("h1"))
        .map((element) => {
        var _a;
        const heading = element;
        const text = normalizeWhitespace((_a = heading.textContent) !== null && _a !== void 0 ? _a : "");
        if (!text || isElementHidden(heading) || isInsideNonContentContainer(heading)) {
            return null;
        }
        return {
            level: 1,
            text,
        };
    })
        .filter((heading) => heading !== null);
    const extractHeadingsFromContainer = (container) => Array.from(container.querySelectorAll("h2, h3, h4"))
        .map((element) => {
        var _a;
        const heading = element;
        if (shouldIgnoreByTag(heading) ||
            isCookieRelatedElement(heading) ||
            isInsideNonContentContainer(heading) ||
            isElementHidden(heading)) {
            return null;
        }
        const tagName = heading.tagName.toLowerCase();
        const level = Number.parseInt(tagName.replace("h", ""), 10);
        const text = normalizeWhitespace((_a = heading.textContent) !== null && _a !== void 0 ? _a : "");
        if (!text || level < 2 || level > 4) {
            return null;
        }
        return {
            level: level,
            text,
        };
    })
        .filter((heading) => heading !== null);
    const normalizeComparableHost = (value) => value.trim().replace(/^www\./i, "").toLowerCase();
    const resolveInternalLink = (href, anchorText, currentUrlObject) => {
        if (!href ||
            href.startsWith("#") ||
            href.startsWith("mailto:") ||
            href.startsWith("tel:")) {
            return null;
        }
        try {
            const resolved = new URL(href, currentUrlObject.href);
            if (!["http:", "https:"].includes(resolved.protocol)) {
                return null;
            }
            if (normalizeComparableHost(resolved.hostname) !==
                normalizeComparableHost(currentUrlObject.hostname)) {
                return null;
            }
            resolved.hash = "";
            const resolvedUrl = resolved.toString();
            return {
                href,
                text: anchorText,
                resolvedUrl,
                normalizedUrl: resolvedUrl,
            };
        }
        catch (_a) {
            return null;
        }
    };
    const extractFromRoot = (root, selector) => {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
        const visibleH1s = extractVisibleDocumentH1s();
        const headings = [...visibleH1s, ...extractHeadingsFromContainer(root)];
        const clonedRoot = cloneAndCleanRoot(root);
        const sections = [];
        const contextualLinks = [];
        const seenBlockTexts = new Set();
        const seenLinkKeys = new Set();
        let currentLabel = (_b = (_a = headings.find((heading) => heading.level === 1)) === null || _a === void 0 ? void 0 : _a.text) !== null && _b !== void 0 ? _b : "Introduction";
        let paragraphCount = 0;
        let listItemCount = 0;
        const currentUrlObject = new URL(currentUrl);
        const contentNodes = Array.from(clonedRoot.querySelectorAll("h1, h2, h3, h4, p, li"));
        for (const node of contentNodes) {
            const tagName = node.tagName.toLowerCase();
            const text = normalizeWhitespace((_c = node.textContent) !== null && _c !== void 0 ? _c : "");
            if (!text) {
                continue;
            }
            if (tagName.startsWith("h")) {
                currentLabel = text;
                continue;
            }
            const isParagraph = tagName === "p";
            if (!isMeaningfulTextBlock(text, isParagraph)) {
                continue;
            }
            const normalizedKey = text.toLowerCase();
            if (seenBlockTexts.has(normalizedKey)) {
                continue;
            }
            seenBlockTexts.add(normalizedKey);
            sections.push({
                label: currentLabel,
                text,
                type: isParagraph ? "paragraph" : "list_item",
            });
            if (isParagraph) {
                paragraphCount += 1;
            }
            else {
                listItemCount += 1;
            }
            const anchors = Array.from(node.querySelectorAll("a[href]"));
            for (const anchor of anchors) {
                const href = (_e = (_d = anchor.getAttribute("href")) === null || _d === void 0 ? void 0 : _d.trim()) !== null && _e !== void 0 ? _e : "";
                const anchorText = normalizeWhitespace((_g = (_f = anchor.textContent) !== null && _f !== void 0 ? _f : anchor.getAttribute("aria-label")) !== null && _g !== void 0 ? _g : "");
                const link = resolveInternalLink(href, anchorText, currentUrlObject);
                if (!link || !anchorText) {
                    continue;
                }
                const dedupeKey = `${link.resolvedUrl}|${anchorText.toLowerCase()}|${normalizedKey}`;
                if (seenLinkKeys.has(dedupeKey)) {
                    continue;
                }
                seenLinkKeys.add(dedupeKey);
                contextualLinks.push(link);
            }
        }
        const allInternalLinks = [];
        const seenAllInternalLinks = new Set();
        for (const anchor of Array.from(document.querySelectorAll("a[href]"))) {
            const href = (_j = (_h = anchor.getAttribute("href")) === null || _h === void 0 ? void 0 : _h.trim()) !== null && _j !== void 0 ? _j : "";
            const anchorText = normalizeWhitespace((_l = (_k = anchor.textContent) !== null && _k !== void 0 ? _k : anchor.getAttribute("aria-label")) !== null && _l !== void 0 ? _l : "");
            const link = resolveInternalLink(href, anchorText, currentUrlObject);
            if (!link) {
                continue;
            }
            const dedupeKey = `${link.resolvedUrl}|${anchorText.toLowerCase()}`;
            if (seenAllInternalLinks.has(dedupeKey)) {
                continue;
            }
            seenAllInternalLinks.add(dedupeKey);
            allInternalLinks.push(link);
        }
        const blockedAnchorPhrases = new Set();
        const blockedElements = Array.from(document.querySelectorAll("h1, h2, h3, h4, h5, h6, nav, footer, header, button, a"));
        const addBlockedPhrasesFromText = (text) => {
            var _a;
            const normalizedText = normalizeWhitespace(text);
            if (!normalizedText) {
                return;
            }
            const fullNormalized = normalizeAnchorPhrase(normalizedText);
            if (fullNormalized.length >= 2) {
                blockedAnchorPhrases.add(fullNormalized);
            }
            const words = ((_a = normalizedText.match(/[a-z0-9&'-]+/gi)) !== null && _a !== void 0 ? _a : [])
                .map((word) => normalizeWhitespace(word))
                .filter((word) => word.length >= 2);
            for (let size = 2; size <= 5; size += 1) {
                for (let index = 0; index <= words.length - size; index += 1) {
                    const phrase = normalizeAnchorPhrase(words.slice(index, index + size).join(" "));
                    if (phrase.length >= 4) {
                        blockedAnchorPhrases.add(phrase);
                    }
                }
            }
        };
        for (const element of blockedElements) {
            if (isElementHidden(element) || isInsideNonContentContainer(element)) {
                continue;
            }
            const text = normalizeWhitespace((_o = (_m = element.textContent) !== null && _m !== void 0 ? _m : element.getAttribute("aria-label")) !== null && _o !== void 0 ? _o : "");
            if (!text) {
                continue;
            }
            addBlockedPhrasesFromText(text);
        }
        const headingTexts = {
            h1: headings.filter((heading) => heading.level === 1).map((heading) => heading.text),
            h2: headings.filter((heading) => heading.level === 2).map((heading) => heading.text),
            h3: headings.filter((heading) => heading.level === 3).map((heading) => heading.text),
            h4: headings.filter((heading) => heading.level === 4).map((heading) => heading.text),
        };
        const bodyText = normalizeWhitespace(sections.map((section) => section.text).join(" "));
        return {
            headings,
            bodyText,
            contentSections: sections,
            existingInternalLinks: allInternalLinks,
            contentDebug: {
                selectedContentSelector: selector,
                totalHeadingCount: headings.length,
                paragraphCount,
                listItemCount,
                extractedBlockCount: sections.length,
                firstExtractedTextChunks: sections.slice(0, 5).map((section) => section.text),
                fallbackStrategyUsed: false,
                headingCounts: {
                    h1: headingTexts.h1.length,
                    h2: headingTexts.h2.length,
                    h3: headingTexts.h3.length,
                    h4: headingTexts.h4.length,
                },
                headingTexts,
                hasMultipleVisibleH1: headingTexts.h1.length > 1,
                contextualBodyLinks: contextualLinks.map((link) => ({
                    href: link.resolvedUrl,
                    text: link.text,
                })),
                blockedAnchorPhrases: [...blockedAnchorPhrases],
            },
        };
    };
    const getMeaningfulTextLength = (root) => { var _a; return normalizeWhitespace((_a = root.textContent) !== null && _a !== void 0 ? _a : "").length; };
    let chosenCandidate = null;
    for (const selector of prioritizedSelectors) {
        const root = document.querySelector(selector);
        if (!root) {
            continue;
        }
        if (getMeaningfulTextLength(root) > 300) {
            chosenCandidate = {
                root,
                selector,
                extraction: extractFromRoot(root, selector),
            };
            break;
        }
    }
    if (!chosenCandidate) {
        const fallbackRoot = (_a = document.querySelector("article, main")) !== null && _a !== void 0 ? _a : document.body;
        const fallbackSelector = fallbackRoot === document.body ? "body" : fallbackRoot.tagName.toLowerCase();
        chosenCandidate = {
            root: fallbackRoot,
            selector: fallbackSelector,
            extraction: extractFromRoot(fallbackRoot, fallbackSelector),
        };
    }
    const finalExtraction = Object.assign(Object.assign({}, chosenCandidate.extraction), { contentDebug: Object.assign(Object.assign({}, chosenCandidate.extraction.contentDebug), { fallbackStrategyUsed: false }) });
    console.debug(`[extractor] selected selector=${finalExtraction.contentDebug.selectedContentSelector}`);
    console.debug(`[extractor] innerHTML length=${chosenCandidate.root.innerHTML.length}`);
    console.debug(`[extractor] total_headings=${finalExtraction.contentDebug.totalHeadingCount} h1_count=${finalExtraction.contentDebug.headingCounts.h1} h2_count=${finalExtraction.contentDebug.headingCounts.h2} h3_count=${finalExtraction.contentDebug.headingCounts.h3} h4_count=${finalExtraction.contentDebug.headingCounts.h4}`);
    console.debug(`[extractor] h1_texts=${finalExtraction.contentDebug.headingTexts.h1.join(" | ") || "(none)"}`);
    console.debug(`[extractor] has_multiple_visible_h1=${finalExtraction.contentDebug.hasMultipleVisibleH1}`);
    console.debug(`[extractor] h2_texts=${finalExtraction.contentDebug.headingTexts.h2.join(" | ") || "(none)"}`);
    console.debug(`[extractor] h3_texts=${finalExtraction.contentDebug.headingTexts.h3.join(" | ") || "(none)"}`);
    console.debug(`[extractor] h4_texts=${finalExtraction.contentDebug.headingTexts.h4.join(" | ") || "(none)"}`);
    return {
        headings: finalExtraction.headings,
        h1: (_c = (_b = finalExtraction.headings.find((heading) => heading.level === 1)) === null || _b === void 0 ? void 0 : _b.text) !== null && _c !== void 0 ? _c : "",
        h2s: finalExtraction.headings
            .filter((heading) => heading.level === 2)
            .map((heading) => heading.text),
        bodyText: finalExtraction.bodyText,
        contentSections: finalExtraction.contentSections,
        contentDebug: finalExtraction.contentDebug,
        existingInternalLinks: finalExtraction.existingInternalLinks,
    };
}
