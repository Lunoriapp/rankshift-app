"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.crawlPage = crawlPage;
exports.crawlSiteForInternalLinking = crawlSiteForInternalLinking;
const playwright_1 = require("playwright");
const alt_text_1 = require("./alt-text");
const editorialExtractor_1 = require("./internalLinking/editorialExtractor");
const urlCompare_1 = require("./internalLinking/urlCompare");
const COOKIE_PATTERNS = [
    "cookie",
    "consent",
    "privacy",
    "gdpr",
    "cmp",
    "onetrust",
    "trustarc",
];
const NON_HTML_EXTENSIONS = [
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".webp",
    ".svg",
    ".pdf",
    ".zip",
    ".xml",
    ".json",
    ".js",
    ".css",
    ".ico",
    ".mp4",
    ".mp3",
    ".wav",
    ".avi",
    ".mov",
    ".doc",
    ".docx",
    ".xls",
    ".xlsx",
];
const PRIORITY_SECTION_SEEDS = [
    "/services/",
    "/service/",
    "/solutions/",
    "/solution/",
    "/products/",
    "/product/",
    "/features/",
    "/feature/",
    "/expertise/",
    "/industries/",
    "/use-cases/",
    "/platform/",
    "/pricing/",
    "/about/",
];
const PRIORITY_PATH_SIGNALS = [
    "/services/",
    "/service/",
    "/solutions/",
    "/solution/",
    "/products/",
    "/product/",
    "/features/",
    "/feature/",
    "/expertise/",
    "/industries/",
    "/industry/",
    "/use-cases/",
    "/use-case/",
    "/platform/",
    "/pricing/",
    "/about/",
    "/locations/",
    "/location/",
];
const PLAYWRIGHT_LAUNCH_ARGS = ["--no-sandbox", "--disable-setuid-sandbox"];
function decodeHtmlEntities(value) {
    return value
        .replace(/&nbsp;/gi, " ")
        .replace(/&amp;/gi, "&")
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")
        .replace(/&lt;/gi, "<")
        .replace(/&gt;/gi, ">");
}
function stripHtml(value) {
    return decodeHtmlEntities(value.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " "))
        .replace(/\s+/g, " ")
        .trim();
}
function matchFirst(html, pattern) {
    const match = html.match(pattern);
    return (match === null || match === void 0 ? void 0 : match[1]) ? stripHtml(match[1]) : "";
}
function matchMetaContent(html, name) {
    const patterns = [
        new RegExp(`<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']*)["'][^>]*>`, "i"),
        new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+name=["']${name}["'][^>]*>`, "i"),
        new RegExp(`<meta[^>]+property=["']${name}["'][^>]+content=["']([^"']*)["'][^>]*>`, "i"),
        new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+property=["']${name}["'][^>]*>`, "i"),
    ];
    for (const pattern of patterns) {
        const value = matchFirst(html, pattern);
        if (value) {
            return value;
        }
    }
    return null;
}
function extractAttribute(tag, attribute) {
    const doubleQuoted = tag.match(new RegExp(`${attribute}="([^"]*)"`, "i"));
    if (doubleQuoted === null || doubleQuoted === void 0 ? void 0 : doubleQuoted[1]) {
        return decodeHtmlEntities(doubleQuoted[1].trim());
    }
    const singleQuoted = tag.match(new RegExp(`${attribute}='([^']*)'`, "i"));
    if (singleQuoted === null || singleQuoted === void 0 ? void 0 : singleQuoted[1]) {
        return decodeHtmlEntities(singleQuoted[1].trim());
    }
    return "";
}
function extractFallbackInternalLinks(html, currentUrl) {
    var _a, _b, _c;
    let currentUrlObject;
    try {
        currentUrlObject = new URL(currentUrl);
    }
    catch (_d) {
        return [];
    }
    const linkPattern = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
    const links = [];
    const seen = new Set();
    let match;
    while ((match = linkPattern.exec(html)) !== null) {
        const href = decodeHtmlEntities((_b = (_a = match[1]) === null || _a === void 0 ? void 0 : _a.trim()) !== null && _b !== void 0 ? _b : "");
        const anchorText = stripHtml((_c = match[2]) !== null && _c !== void 0 ? _c : "");
        if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
            continue;
        }
        const resolvedUrl = (0, urlCompare_1.resolveUrlAgainstPage)(href, currentUrlObject.href);
        if (!resolvedUrl) {
            continue;
        }
        let resolved;
        try {
            resolved = new URL(resolvedUrl);
        }
        catch (_e) {
            continue;
        }
        if (!["http:", "https:"].includes(resolved.protocol)) {
            continue;
        }
        if ((0, urlCompare_1.normalizeComparableHost)(resolved.hostname) !==
            (0, urlCompare_1.normalizeComparableHost)(currentUrlObject.hostname)) {
            continue;
        }
        const normalizedUrl = (0, urlCompare_1.normalizeUrlForCompare)(resolvedUrl);
        if (!normalizedUrl) {
            continue;
        }
        const dedupeKey = `${normalizedUrl}|${(0, urlCompare_1.normalizeAnchorTextForCompare)(anchorText)}`;
        if (seen.has(dedupeKey)) {
            continue;
        }
        seen.add(dedupeKey);
        links.push({
            href,
            text: anchorText,
            resolvedUrl,
            normalizedUrl,
        });
    }
    return links;
}
function extractFallbackDiscoveredUrls(links) {
    return Array.from(new Set(links.map((link) => normalizeUrlForComparison(link.resolvedUrl))));
}
function collectSchemaTypesFromValue(value, target) {
    if (!value || typeof value !== "object") {
        return;
    }
    if (Array.isArray(value)) {
        for (const item of value) {
            collectSchemaTypesFromValue(item, target);
        }
        return;
    }
    const record = value;
    const typeValue = record["@type"];
    if (typeof typeValue === "string" && typeValue.trim().length > 0) {
        target.add(typeValue.trim());
    }
    if (Array.isArray(typeValue)) {
        for (const entry of typeValue) {
            if (typeof entry === "string" && entry.trim().length > 0) {
                target.add(entry.trim());
            }
        }
    }
    const graph = record["@graph"];
    if (Array.isArray(graph)) {
        for (const node of graph) {
            collectSchemaTypesFromValue(node, target);
        }
    }
    for (const nestedValue of Object.values(record)) {
        if (nestedValue && typeof nestedValue === "object") {
            collectSchemaTypesFromValue(nestedValue, target);
        }
    }
}
function extractSchemaTypesFromJsonLdScripts(html) {
    var _a;
    const scripts = Array.from(html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi));
    const detectedTypes = new Set();
    for (const script of scripts) {
        const content = (_a = script[1]) === null || _a === void 0 ? void 0 : _a.trim();
        if (!content) {
            continue;
        }
        try {
            const parsed = JSON.parse(content);
            collectSchemaTypesFromValue(parsed, detectedTypes);
        }
        catch (_b) {
            continue;
        }
    }
    return Array.from(detectedTypes);
}
async function crawlPageWithBasicFetch(url) {
    var _a, _b;
    const startedAt = Date.now();
    const response = await fetch(url, {
        headers: {
            "User-Agent": "Mozilla/5.0 (compatible; RankshiftBot/1.0; +https://rankshift-app.vercel.app)",
            Accept: "text/html,application/xhtml+xml",
        },
    });
    const html = await response.text();
    const contentType = response.headers.get("content-type");
    const normalizedUrl = normalizeUrlForComparison(response.url || url);
    const title = matchFirst(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
    const description = (_a = matchMetaContent(html, "description")) !== null && _a !== void 0 ? _a : "";
    const canonical = matchFirst(html, /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["'][^>]*>/i) || null;
    const robots = matchMetaContent(html, "robots");
    const h1Matches = Array.from(html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)).map((match) => stripHtml(match[1]));
    const h2Matches = Array.from(html.matchAll(/<h2\b[^>]*>([\s\S]*?)<\/h2>/gi)).map((match) => stripHtml(match[1]));
    const h3Matches = Array.from(html.matchAll(/<h3\b[^>]*>([\s\S]*?)<\/h3>/gi)).map((match) => stripHtml(match[1]));
    const paragraphMatches = Array.from(html.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi))
        .map((match) => stripHtml(match[1]))
        .filter(Boolean);
    const listItemMatches = Array.from(html.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi))
        .map((match) => stripHtml(match[1]))
        .filter(Boolean);
    const imageMatches = Array.from(html.matchAll(/<img\b[^>]*>/gi))
        .map((match) => {
        var _a;
        const tag = match[0];
        const src = extractAttribute(tag, "src");
        const alt = extractAttribute(tag, "alt");
        if (!src) {
            return null;
        }
        const fileName = (0, alt_text_1.getImageFileName)(src);
        const surroundingText = (_a = paragraphMatches[0]) !== null && _a !== void 0 ? _a : title;
        return {
            src: new URL(src, normalizedUrl).toString(),
            alt,
            fileName,
            surroundingText,
            suggestedAlt: (0, alt_text_1.buildSuggestedAltText)({
                src,
                surroundingText,
            }),
            isMissingAlt: alt.trim().length === 0,
        };
    })
        .filter((image) => Boolean(image));
    const bodyText = stripHtml(html);
    const contentSections = [
        ...paragraphMatches.map((text, index) => ({
            label: `Paragraph ${index + 1}`,
            text,
            type: "paragraph",
        })),
        ...listItemMatches.map((text, index) => ({
            label: `List item ${index + 1}`,
            text,
            type: "list_item",
        })),
    ];
    const existingInternalLinks = extractFallbackInternalLinks(html, normalizedUrl);
    const discoveredUrls = extractFallbackDiscoveredUrls(existingInternalLinks);
    return {
        loadTimeMs: Date.now() - startedAt,
        discoveredUrls,
        snapshot: {
            url: normalizedUrl,
            title,
            description,
            h1: (_b = h1Matches[0]) !== null && _b !== void 0 ? _b : "",
            h2s: h2Matches,
            headings: [
                ...h1Matches.map((text) => ({ level: 1, text })),
                ...h2Matches.map((text) => ({ level: 2, text })),
                ...h3Matches.map((text) => ({ level: 3, text })),
            ],
            images: imageMatches,
            bodyText,
            contentSections,
            contentDebug: {
                selectedContentSelector: "fetch-fallback",
                totalHeadingCount: h1Matches.length + h2Matches.length + h3Matches.length,
                paragraphCount: paragraphMatches.length,
                listItemCount: listItemMatches.length,
                extractedBlockCount: contentSections.length,
                firstExtractedTextChunks: contentSections.map((section) => section.text).slice(0, 5),
                fallbackStrategyUsed: true,
                headingCounts: {
                    h1: h1Matches.length,
                    h2: h2Matches.length,
                    h3: h3Matches.length,
                    h4: 0,
                },
                headingTexts: {
                    h1: h1Matches,
                    h2: h2Matches,
                    h3: h3Matches,
                    h4: [],
                },
                hasMultipleVisibleH1: h1Matches.length > 1,
                contextualBodyLinks: [],
                blockedAnchorPhrases: [],
            },
            existingInternalLinks,
            canonical,
            robots,
            indexable: !(robots !== null && robots !== void 0 ? robots : "").toLowerCase().includes("noindex"),
            statusCode: response.status,
            contentType,
            hasJsonLd: /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>/i.test(html),
            schemaTypes: extractSchemaTypesFromJsonLdScripts(html),
        },
    };
}
async function launchChromiumBrowser() {
    return playwright_1.chromium.launch({
        headless: true,
        args: PLAYWRIGHT_LAUNCH_ARGS,
    });
}
function shouldUseBasicFetchFallback(error) {
    const message = error instanceof Error ? error.message : String(error);
    return (message.includes("Executable doesn't exist") ||
        message.includes("browserType.launch") ||
        message.includes("Failed to launch") ||
        message.includes("spawn") ||
        message.includes("ENOENT"));
}
function normalizeUrlForComparison(url) {
    const parsed = new URL(url);
    parsed.hostname = parsed.hostname.replace(/^www\./i, "").toLowerCase();
    parsed.hash = "";
    parsed.search = "";
    parsed.pathname = parsed.pathname.replace(/\/+$/, "") || "/";
    return parsed.toString();
}
function shouldCrawlUrl(url, host) {
    let parsed;
    try {
        parsed = new URL(url);
    }
    catch (_a) {
        return false;
    }
    if (!["http:", "https:"].includes(parsed.protocol)) {
        return false;
    }
    if ((0, urlCompare_1.normalizeComparableHost)(parsed.hostname) !== (0, urlCompare_1.normalizeComparableHost)(host)) {
        return false;
    }
    const pathname = parsed.pathname.toLowerCase();
    if (NON_HTML_EXTENSIONS.some((extension) => pathname.endsWith(extension))) {
        return false;
    }
    return true;
}
function isPrioritySectionUrl(url) {
    try {
        const pathname = new URL(url).pathname.toLowerCase();
        return PRIORITY_PATH_SIGNALS.some((signal) => pathname.includes(signal));
    }
    catch (_a) {
        return false;
    }
}
function sortUrlsForInternalLinking(urls) {
    return [...new Set(urls)].sort((a, b) => {
        const aPriority = isPrioritySectionUrl(a);
        const bPriority = isPrioritySectionUrl(b);
        if (aPriority !== bPriority) {
            return aPriority ? -1 : 1;
        }
        const aDepth = new URL(a).pathname.split("/").filter(Boolean).length;
        const bDepth = new URL(b).pathname.split("/").filter(Boolean).length;
        return aDepth - bDepth || a.localeCompare(b);
    });
}
function extractXmlLocEntries(xml) {
    return Array.from(xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi))
        .map((match) => { var _a, _b; return (_b = (_a = match[1]) === null || _a === void 0 ? void 0 : _a.trim()) !== null && _b !== void 0 ? _b : ""; })
        .filter(Boolean);
}
async function discoverSitemapUrls(startUrl, maxUrls = 180) {
    try {
        const start = new URL(startUrl);
        const sitemapCandidates = [
            new URL("/sitemap.xml", start.origin).toString(),
            new URL("/sitemap_index.xml", start.origin).toString(),
        ];
        const discovered = new Set();
        const fetchedSitemaps = new Set();
        const queue = [...sitemapCandidates];
        while (queue.length > 0 && discovered.size < maxUrls && fetchedSitemaps.size < 10) {
            const sitemapUrl = queue.shift();
            if (!sitemapUrl || fetchedSitemaps.has(sitemapUrl)) {
                continue;
            }
            fetchedSitemaps.add(sitemapUrl);
            const response = await fetch(sitemapUrl, {
                headers: {
                    "User-Agent": "Mozilla/5.0 (compatible; RankshiftBot/1.0; +https://rankshift-app.vercel.app)",
                    Accept: "application/xml,text/xml,text/plain,*/*",
                },
            }).catch(() => null);
            if (!(response === null || response === void 0 ? void 0 : response.ok)) {
                continue;
            }
            const xml = await response.text();
            const locs = extractXmlLocEntries(xml);
            for (const loc of locs) {
                try {
                    const normalized = normalizeUrlForComparison(loc);
                    const parsed = new URL(normalized);
                    if ((0, urlCompare_1.normalizeComparableHost)(parsed.hostname) !==
                        (0, urlCompare_1.normalizeComparableHost)(start.hostname)) {
                        continue;
                    }
                    if (parsed.pathname.endsWith(".xml")) {
                        if (!fetchedSitemaps.has(normalized) && !queue.includes(normalized)) {
                            queue.push(normalized);
                        }
                        continue;
                    }
                    if (shouldCrawlUrl(normalized, start.hostname)) {
                        discovered.add(normalized);
                    }
                }
                catch (_a) {
                    continue;
                }
            }
        }
        return sortUrlsForInternalLinking(Array.from(discovered)).slice(0, maxUrls);
    }
    catch (_b) {
        return [];
    }
}
async function extractPageData(page) {
    const metadata = await page.evaluate(() => {
        var _a, _b, _c, _d, _e;
        const normalizeWhitespace = (value) => value.replace(/\s+/g, " ").trim();
        const getMetaContent = (selector) => {
            var _a, _b;
            const element = document.querySelector(selector);
            const content = (_b = (_a = element === null || element === void 0 ? void 0 : element.getAttribute("content")) === null || _a === void 0 ? void 0 : _a.trim()) !== null && _b !== void 0 ? _b : "";
            return content || null;
        };
        const getNearbyText = (image) => {
            var _a, _b;
            const candidates = [];
            const pushText = (value) => {
                const normalized = normalizeWhitespace(value !== null && value !== void 0 ? value : "");
                if (normalized.length >= 24) {
                    candidates.push(normalized);
                }
            };
            const figure = image.closest("figure");
            pushText((_a = figure === null || figure === void 0 ? void 0 : figure.querySelector("figcaption")) === null || _a === void 0 ? void 0 : _a.textContent);
            const semanticParent = image.closest("p, li, section, article, main, div, aside");
            pushText(semanticParent === null || semanticParent === void 0 ? void 0 : semanticParent.textContent);
            let sibling = image.previousElementSibling;
            while (sibling) {
                pushText(sibling.textContent);
                sibling = sibling.previousElementSibling;
            }
            sibling = image.nextElementSibling;
            while (sibling) {
                pushText(sibling.textContent);
                sibling = sibling.nextElementSibling;
            }
            return (_b = candidates[0]) !== null && _b !== void 0 ? _b : "";
        };
        const images = Array.from(document.querySelectorAll("img")).map((image) => {
            var _a;
            return ({
                src: image.currentSrc || image.getAttribute("src") || "",
                alt: (_a = image.getAttribute("alt")) !== null && _a !== void 0 ? _a : "",
                surroundingText: getNearbyText(image),
            });
        });
        return {
            title: normalizeWhitespace((_a = document.title) !== null && _a !== void 0 ? _a : ""),
            description: (_b = getMetaContent('meta[name="description"]')) !== null && _b !== void 0 ? _b : "",
            images,
            canonical: (_e = (_d = (_c = document.querySelector('link[rel="canonical"]')) === null || _c === void 0 ? void 0 : _c.getAttribute("href")) === null || _d === void 0 ? void 0 : _d.trim()) !== null && _e !== void 0 ? _e : null,
            robots: getMetaContent('meta[name="robots"]'),
            hasJsonLd: document.querySelector('script[type="application/ld+json"]') !== null,
            schemaTypes: (() => {
                const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
                const types = new Set();
                const collectTypes = (value) => {
                    if (!value || typeof value !== "object") {
                        return;
                    }
                    if (Array.isArray(value)) {
                        value.forEach(collectTypes);
                        return;
                    }
                    const record = value;
                    const typeValue = record["@type"];
                    if (typeof typeValue === "string" && typeValue.trim().length > 0) {
                        types.add(typeValue.trim());
                    }
                    if (Array.isArray(typeValue)) {
                        typeValue.forEach((entry) => {
                            if (typeof entry === "string" && entry.trim().length > 0) {
                                types.add(entry.trim());
                            }
                        });
                    }
                    const graphValue = record["@graph"];
                    if (Array.isArray(graphValue)) {
                        graphValue.forEach(collectTypes);
                    }
                    Object.values(record).forEach((entry) => {
                        if (entry && typeof entry === "object") {
                            collectTypes(entry);
                        }
                    });
                };
                scripts.forEach((script) => {
                    var _a, _b;
                    try {
                        const content = (_b = (_a = script.textContent) === null || _a === void 0 ? void 0 : _a.trim()) !== null && _b !== void 0 ? _b : "";
                        if (!content) {
                            return;
                        }
                        collectTypes(JSON.parse(content));
                    }
                    catch (_c) {
                        return;
                    }
                });
                return Array.from(types);
            })(),
        };
    });
    const editorial = await page.evaluate(editorialExtractor_1.extractEditorialContentInBrowser, {
        cookiePatterns: COOKIE_PATTERNS,
        currentUrl: page.url(),
    });
    const images = metadata.images.map((image) => {
        const alt = image.alt.trim();
        return {
            src: image.src,
            alt,
            fileName: (0, alt_text_1.getImageFileName)(image.src),
            surroundingText: image.surroundingText,
            suggestedAlt: (0, alt_text_1.buildSuggestedAltText)({
                src: image.src,
                surroundingText: image.surroundingText,
            }),
            isMissingAlt: alt.length === 0,
        };
    });
    return Object.assign(Object.assign(Object.assign({}, metadata), { images }), editorial);
}
async function crawlPageSnapshot(browser, url) {
    var _a, _b, _c, _d, _e;
    const page = await browser.newPage();
    try {
        const startedAt = Date.now();
        const response = await page.goto(url, {
            waitUntil: "domcontentloaded",
            timeout: 30000,
        });
        await page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => null);
        await page.waitForTimeout(250);
        const loadTimeMs = Date.now() - startedAt;
        if (!response) {
            throw new Error("No response received while loading the page.");
        }
        const contentType = (_a = response.headers()["content-type"]) !== null && _a !== void 0 ? _a : null;
        const extracted = await extractPageData(page);
        const discoveredUrls = await page.evaluate((currentUrl) => {
            const normalizeHost = (host) => host.trim().replace(/^www\./i, "").toLowerCase();
            const current = new URL(currentUrl);
            const urls = Array.from(document.querySelectorAll("a[href]"))
                .map((anchor) => anchor.getAttribute("href"))
                .filter((href) => Boolean(href))
                .map((href) => {
                try {
                    const resolved = new URL(href, current.href);
                    if (!["http:", "https:"].includes(resolved.protocol) ||
                        normalizeHost(resolved.hostname) !== normalizeHost(current.hostname)) {
                        return null;
                    }
                    resolved.hash = "";
                    resolved.search = "";
                    resolved.pathname = resolved.pathname.replace(/\/+$/, "") || "/";
                    return resolved.toString();
                }
                catch (_a) {
                    return null;
                }
            })
                .filter((value) => Boolean(value));
            return [...new Set(urls)];
        }, page.url());
        const robotsLower = (_c = (_b = extracted.robots) === null || _b === void 0 ? void 0 : _b.toLowerCase()) !== null && _c !== void 0 ? _c : "";
        const isIndexable = response.ok() &&
            ((_d = contentType === null || contentType === void 0 ? void 0 : contentType.includes("text/html")) !== null && _d !== void 0 ? _d : true) &&
            !robotsLower.includes("noindex");
        return {
            loadTimeMs,
            discoveredUrls,
            snapshot: {
                url: normalizeUrlForComparison(page.url()),
                title: extracted.title,
                description: extracted.description,
                h1: extracted.h1,
                h2s: extracted.h2s,
                headings: extracted.headings,
                images: extracted.images,
                bodyText: extracted.bodyText,
                contentSections: extracted.contentSections,
                contentDebug: extracted.contentDebug,
                existingInternalLinks: extracted.existingInternalLinks
                    .map((link) => {
                    const resolvedUrl = (0, urlCompare_1.resolveUrlAgainstPage)(link.resolvedUrl || link.href, page.url());
                    const normalizedUrl = (0, urlCompare_1.normalizeUrlForCompare)(link.normalizedUrl || resolvedUrl || link.href, page.url());
                    if (!resolvedUrl || !normalizedUrl) {
                        return null;
                    }
                    return {
                        href: link.href,
                        text: link.text,
                        resolvedUrl,
                        normalizedUrl,
                    };
                })
                    .filter((link) => link !== null),
                canonical: extracted.canonical,
                robots: extracted.robots,
                indexable: isIndexable,
                statusCode: response.status(),
                contentType,
                hasJsonLd: extracted.hasJsonLd,
                schemaTypes: (_e = extracted.schemaTypes) !== null && _e !== void 0 ? _e : [],
            },
        };
    }
    finally {
        await page.close();
    }
}
async function crawlPage(url) {
    var _a, _b;
    let browser = null;
    try {
        browser = await launchChromiumBrowser();
        const { snapshot, loadTimeMs } = await crawlPageSnapshot(browser, url);
        return {
            url: snapshot.url,
            title: snapshot.title,
            description: snapshot.description,
            headings: snapshot.headings,
            images: snapshot.images,
            canonical: snapshot.canonical,
            robots: snapshot.robots,
            internalLinkCount: snapshot.existingInternalLinks.length,
            hasJsonLd: snapshot.hasJsonLd,
            loadTimeMs,
            bodyText: snapshot.bodyText,
            h1: snapshot.h1,
            h2s: snapshot.h2s,
            contentSections: snapshot.contentSections,
            contentDebug: snapshot.contentDebug,
            existingInternalLinks: snapshot.existingInternalLinks,
            indexable: snapshot.indexable,
            statusCode: snapshot.statusCode,
            contentType: snapshot.contentType,
            schemaTypes: (_a = snapshot.schemaTypes) !== null && _a !== void 0 ? _a : [],
        };
    }
    catch (error) {
        if (shouldUseBasicFetchFallback(error)) {
            const { snapshot, loadTimeMs } = await crawlPageWithBasicFetch(url);
            return {
                url: snapshot.url,
                title: snapshot.title,
                description: snapshot.description,
                headings: snapshot.headings,
                images: snapshot.images,
                canonical: snapshot.canonical,
                robots: snapshot.robots,
                internalLinkCount: snapshot.existingInternalLinks.length,
                hasJsonLd: snapshot.hasJsonLd,
                loadTimeMs,
                bodyText: snapshot.bodyText,
                h1: snapshot.h1,
                h2s: snapshot.h2s,
                contentSections: snapshot.contentSections,
                contentDebug: snapshot.contentDebug,
                existingInternalLinks: snapshot.existingInternalLinks,
                indexable: snapshot.indexable,
                statusCode: snapshot.statusCode,
                contentType: snapshot.contentType,
                schemaTypes: (_b = snapshot.schemaTypes) !== null && _b !== void 0 ? _b : [],
            };
        }
        const message = error instanceof Error ? error.message : "Unknown crawl error.";
        throw new Error(`Unable to crawl page: ${message}`);
    }
    finally {
        if (browser) {
            await browser.close();
        }
    }
}
async function crawlSiteForInternalLinkingWithBasicFetch(startUrl, maxPages) {
    var _a, _b;
    const normalizedStartUrl = normalizeUrlForComparison(startUrl);
    const start = new URL(normalizedStartUrl);
    const sitemapUrls = await discoverSitemapUrls(normalizedStartUrl, Math.min(220, maxPages * 6));
    const seededUrls = [
        normalizedStartUrl,
        ...PRIORITY_SECTION_SEEDS.map((path) => new URL(path, start.origin).toString()),
        ...sitemapUrls,
    ].filter((url, index, values) => values.indexOf(url) === index);
    const queue = sortUrlsForInternalLinking(seededUrls);
    const visited = new Set();
    const pages = [];
    while (queue.length > 0 && pages.length < maxPages) {
        const nextUrl = queue.shift();
        if (!nextUrl || visited.has(nextUrl)) {
            continue;
        }
        visited.add(nextUrl);
        if (!shouldCrawlUrl(nextUrl, start.hostname)) {
            continue;
        }
        try {
            const { snapshot, discoveredUrls } = await crawlPageWithBasicFetch(nextUrl);
            if (!((_b = (_a = snapshot.contentType) === null || _a === void 0 ? void 0 : _a.includes("text/html")) !== null && _b !== void 0 ? _b : true)) {
                continue;
            }
            pages.push(snapshot);
            const prioritized = sortUrlsForInternalLinking(discoveredUrls);
            for (const discoveredUrl of prioritized) {
                const normalized = normalizeUrlForComparison(discoveredUrl);
                if (!visited.has(normalized) &&
                    !queue.includes(normalized) &&
                    shouldCrawlUrl(normalized, start.hostname)) {
                    if (isPrioritySectionUrl(normalized)) {
                        queue.unshift(normalized);
                    }
                    else {
                        queue.push(normalized);
                    }
                }
            }
        }
        catch (_c) {
            // keep crawling other URLs
        }
    }
    console.debug(`[crawler] internal-linking fallback fetch discovered ${pages.length} pages starting from ${normalizedStartUrl}`);
    return pages;
}
async function crawlSiteForInternalLinking(startUrl, maxPages = 12) {
    var _a, _b, _c, _d;
    let browser = null;
    try {
        const normalizedStartUrl = normalizeUrlForComparison(startUrl);
        const start = new URL(normalizedStartUrl);
        const sitemapUrls = await discoverSitemapUrls(normalizedStartUrl, Math.min(220, maxPages * 6));
        const seededUrls = [
            normalizedStartUrl,
            ...PRIORITY_SECTION_SEEDS.map((path) => new URL(path, start.origin).toString()),
            ...sitemapUrls,
        ].filter((url, index, values) => values.indexOf(url) === index);
        const queue = sortUrlsForInternalLinking(seededUrls);
        const visited = new Set();
        const pages = [];
        const diagnostics = {
            queueSeededUrls: seededUrls.length,
            queueDequeued: 0,
            crawlAttempts: 0,
            crawlSucceeded: 0,
            fallbackFetchSucceeded: 0,
            discoveredUrlsTotal: 0,
            queueAddedFromDiscovery: 0,
            skippedByShouldCrawl: 0,
            skippedNonHtml: 0,
            crawlFailures: 0,
            pagesWithUsableMainContent: 0,
            internalLinksExtracted: 0,
        };
        browser = await launchChromiumBrowser();
        while (queue.length > 0 && pages.length < maxPages) {
            const nextUrl = queue.shift();
            diagnostics.queueDequeued += 1;
            if (!nextUrl || visited.has(nextUrl)) {
                continue;
            }
            visited.add(nextUrl);
            if (!shouldCrawlUrl(nextUrl, start.hostname)) {
                diagnostics.skippedByShouldCrawl += 1;
                continue;
            }
            try {
                diagnostics.crawlAttempts += 1;
                const { snapshot, discoveredUrls } = await crawlPageSnapshot(browser, nextUrl);
                diagnostics.crawlSucceeded += 1;
                diagnostics.discoveredUrlsTotal += discoveredUrls.length;
                if (!((_b = (_a = snapshot.contentType) === null || _a === void 0 ? void 0 : _a.includes("text/html")) !== null && _b !== void 0 ? _b : true)) {
                    diagnostics.skippedNonHtml += 1;
                    continue;
                }
                pages.push(snapshot);
                diagnostics.internalLinksExtracted += snapshot.existingInternalLinks.length;
                if (snapshot.bodyText.length >= 120 && snapshot.contentSections.length > 0) {
                    diagnostics.pagesWithUsableMainContent += 1;
                }
                const prioritizedDiscoveredUrls = sortUrlsForInternalLinking(discoveredUrls);
                for (const discoveredUrl of prioritizedDiscoveredUrls) {
                    const normalized = normalizeUrlForComparison(discoveredUrl);
                    if (!visited.has(normalized) &&
                        !queue.includes(normalized) &&
                        shouldCrawlUrl(normalized, start.hostname)) {
                        diagnostics.queueAddedFromDiscovery += 1;
                        if (isPrioritySectionUrl(normalized)) {
                            queue.unshift(normalized);
                        }
                        else {
                            queue.push(normalized);
                        }
                    }
                }
            }
            catch (_e) {
                diagnostics.crawlFailures += 1;
                try {
                    const { snapshot } = await crawlPageWithBasicFetch(nextUrl);
                    if (!((_d = (_c = snapshot.contentType) === null || _c === void 0 ? void 0 : _c.includes("text/html")) !== null && _d !== void 0 ? _d : true)) {
                        diagnostics.skippedNonHtml += 1;
                        continue;
                    }
                    pages.push(snapshot);
                    diagnostics.fallbackFetchSucceeded += 1;
                    diagnostics.internalLinksExtracted += snapshot.existingInternalLinks.length;
                    if (snapshot.bodyText.length >= 120 && snapshot.contentSections.length > 0) {
                        diagnostics.pagesWithUsableMainContent += 1;
                    }
                }
                catch (_f) {
                    // keep moving through queue
                }
                continue;
            }
        }
        console.debug(`[crawler] internal-linking crawl discovered ${pages.length} pages starting from ${normalizedStartUrl}`);
        console.debug("[crawler][internal-linking][pipeline]", diagnostics);
        return pages;
    }
    catch (error) {
        if (shouldUseBasicFetchFallback(error)) {
            return crawlSiteForInternalLinkingWithBasicFetch(startUrl, maxPages);
        }
        throw error;
    }
    finally {
        if (browser) {
            await browser.close();
        }
    }
}
