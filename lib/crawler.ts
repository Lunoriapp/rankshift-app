import { chromium, type Browser, type Page } from "playwright";

import { buildSuggestedAltText, getImageFileName } from "./alt-text";
import { extractEditorialContentInBrowser } from "./internalLinking/editorialExtractor";
import type { InternalLinkingReport } from "./internalLinking/types";

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

export interface CrawlHeading {
  level: HeadingLevel;
  text: string;
}

export interface CrawlImage {
  src: string;
  alt: string;
  fileName: string;
  surroundingText: string;
  suggestedAlt: string;
  isMissingAlt: boolean;
}

export interface CrawlInternalLink {
  href: string;
  text: string;
  normalizedUrl: string;
}

export interface CrawlContentSection {
  label: string;
  text: string;
  type: "paragraph" | "list_item";
}

export interface CrawlContentDebug {
  selectedContentSelector: string;
  totalHeadingCount: number;
  paragraphCount: number;
  listItemCount: number;
  extractedBlockCount: number;
  firstExtractedTextChunks: string[];
  fallbackStrategyUsed: boolean;
  headingCounts: {
    h1: number;
    h2: number;
    h3: number;
    h4: number;
  };
  headingTexts: {
    h1: string[];
    h2: string[];
    h3: string[];
    h4: string[];
  };
  hasMultipleVisibleH1: boolean;
  contextualBodyLinks: Array<{
    href: string;
    text: string;
  }>;
}

export interface SitePageSnapshot {
  url: string;
  title: string;
  description: string;
  h1: string;
  h2s: string[];
  headings: CrawlHeading[];
  images: CrawlImage[];
  bodyText: string;
  contentSections: CrawlContentSection[];
  contentDebug: CrawlContentDebug;
  existingInternalLinks: CrawlInternalLink[];
  canonical: string | null;
  robots: string | null;
  indexable: boolean;
  statusCode: number;
  contentType: string | null;
  hasJsonLd: boolean;
  schemaTypes?: string[];
}

export interface CrawlResult {
  url: string;
  title: string;
  description: string;
  headings: CrawlHeading[];
  images: CrawlImage[];
  canonical: string | null;
  robots: string | null;
  internalLinkCount: number;
  hasJsonLd: boolean;
  loadTimeMs: number;
  bodyText: string;
  h1: string;
  h2s: string[];
  contentSections: CrawlContentSection[];
  contentDebug: CrawlContentDebug;
  existingInternalLinks: CrawlInternalLink[];
  indexable: boolean;
  statusCode: number;
  contentType: string | null;
  schemaTypes?: string[];
  internalLinking?: InternalLinkingReport;
}

interface PageExtractionResult {
  title: string;
  description: string;
  headings: CrawlHeading[];
  images: CrawlImage[];
  canonical: string | null;
  robots: string | null;
  hasJsonLd: boolean;
  bodyText: string;
  h1: string;
  h2s: string[];
  contentSections: CrawlContentSection[];
  contentDebug: CrawlContentDebug;
  existingInternalLinks: CrawlInternalLink[];
  schemaTypes?: string[];
}

interface RawImageCandidate {
  src: string;
  alt: string;
  surroundingText: string;
}

interface RawPageMetadata {
  title: string;
  description: string;
  images: RawImageCandidate[];
  canonical: string | null;
  robots: string | null;
  hasJsonLd: boolean;
  schemaTypes?: string[];
}

interface CrawlPageSnapshotResult {
  snapshot: SitePageSnapshot;
  loadTimeMs: number;
  discoveredUrls: string[];
}

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

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function stripHtml(value: string): string {
  return decodeHtmlEntities(value.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function matchFirst(html: string, pattern: RegExp): string {
  const match = html.match(pattern);
  return match?.[1] ? stripHtml(match[1]) : "";
}

function matchMetaContent(html: string, name: string): string | null {
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

function extractAttribute(tag: string, attribute: string): string {
  const doubleQuoted = tag.match(new RegExp(`${attribute}="([^"]*)"`, "i"));
  if (doubleQuoted?.[1]) {
    return decodeHtmlEntities(doubleQuoted[1].trim());
  }

  const singleQuoted = tag.match(new RegExp(`${attribute}='([^']*)'`, "i"));
  if (singleQuoted?.[1]) {
    return decodeHtmlEntities(singleQuoted[1].trim());
  }

  return "";
}

function extractFallbackDiscoveredUrls(html: string, currentUrl: string): string[] {
  const hrefPattern = /<a\b[^>]*href=["']([^"']+)["'][^>]*>/gi;
  const urls = new Set<string>();
  let match: RegExpExecArray | null;

  while ((match = hrefPattern.exec(html)) !== null) {
    const href = match[1]?.trim();

    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
      continue;
    }

    try {
      urls.add(normalizeUrlForComparison(new URL(href, currentUrl).toString()));
    } catch {
      continue;
    }
  }

  return Array.from(urls);
}

function collectSchemaTypesFromValue(value: unknown, target: Set<string>) {
  if (!value || typeof value !== "object") {
    return;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      collectSchemaTypesFromValue(item, target);
    }
    return;
  }

  const record = value as Record<string, unknown>;
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

function extractSchemaTypesFromJsonLdScripts(html: string): string[] {
  const scripts = Array.from(
    html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi),
  );
  const detectedTypes = new Set<string>();

  for (const script of scripts) {
    const content = script[1]?.trim();

    if (!content) {
      continue;
    }

    try {
      const parsed = JSON.parse(content) as unknown;
      collectSchemaTypesFromValue(parsed, detectedTypes);
    } catch {
      continue;
    }
  }

  return Array.from(detectedTypes);
}

async function crawlPageWithBasicFetch(url: string): Promise<CrawlPageSnapshotResult> {
  const startedAt = Date.now();
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; RankshiftBot/1.0; +https://rankshift-app.vercel.app)",
      Accept: "text/html,application/xhtml+xml",
    },
  });
  const html = await response.text();
  const contentType = response.headers.get("content-type");
  const normalizedUrl = normalizeUrlForComparison(response.url || url);
  const title = matchFirst(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
  const description = matchMetaContent(html, "description") ?? "";
  const canonical = matchFirst(html, /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["'][^>]*>/i) || null;
  const robots = matchMetaContent(html, "robots");
  const h1Matches = Array.from(html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)).map((match) =>
    stripHtml(match[1]),
  );
  const h2Matches = Array.from(html.matchAll(/<h2\b[^>]*>([\s\S]*?)<\/h2>/gi)).map((match) =>
    stripHtml(match[1]),
  );
  const h3Matches = Array.from(html.matchAll(/<h3\b[^>]*>([\s\S]*?)<\/h3>/gi)).map((match) =>
    stripHtml(match[1]),
  );
  const paragraphMatches = Array.from(html.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi))
    .map((match) => stripHtml(match[1]))
    .filter(Boolean);
  const listItemMatches = Array.from(html.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi))
    .map((match) => stripHtml(match[1]))
    .filter(Boolean);
  const imageMatches = Array.from(html.matchAll(/<img\b[^>]*>/gi))
    .map((match) => {
      const tag = match[0];
      const src = extractAttribute(tag, "src");
      const alt = extractAttribute(tag, "alt");

      if (!src) {
        return null;
      }

      const fileName = getImageFileName(src);
      const surroundingText = paragraphMatches[0] ?? title;
      return {
        src: new URL(src, normalizedUrl).toString(),
        alt,
        fileName,
        surroundingText,
        suggestedAlt: buildSuggestedAltText({
          src,
          surroundingText,
        }),
        isMissingAlt: alt.trim().length === 0,
      };
    })
    .filter((image): image is CrawlImage => Boolean(image));
  const bodyText = stripHtml(html);
  const contentSections = [
    ...paragraphMatches.map((text, index) => ({
      label: `Paragraph ${index + 1}`,
      text,
      type: "paragraph" as const,
    })),
    ...listItemMatches.map((text, index) => ({
      label: `List item ${index + 1}`,
      text,
      type: "list_item" as const,
    })),
  ];
  const discoveredUrls = extractFallbackDiscoveredUrls(html, normalizedUrl);
  const existingInternalLinks = discoveredUrls.map((href) => ({
    href,
    text: "",
    normalizedUrl: href,
  }));

  return {
    loadTimeMs: Date.now() - startedAt,
    discoveredUrls,
    snapshot: {
      url: normalizedUrl,
      title,
      description,
      h1: h1Matches[0] ?? "",
      h2s: h2Matches,
      headings: [
        ...h1Matches.map((text) => ({ level: 1 as const, text })),
        ...h2Matches.map((text) => ({ level: 2 as const, text })),
        ...h3Matches.map((text) => ({ level: 3 as const, text })),
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
      },
      existingInternalLinks,
      canonical,
      robots,
      indexable: !(robots ?? "").toLowerCase().includes("noindex"),
      statusCode: response.status,
      contentType,
      hasJsonLd: /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>/i.test(html),
      schemaTypes: extractSchemaTypesFromJsonLdScripts(html),
    },
  };
}

async function launchChromiumBrowser(): Promise<Browser> {
  return chromium.launch({
    headless: true,
    args: PLAYWRIGHT_LAUNCH_ARGS,
  });
}

function shouldUseBasicFetchFallback(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);

  return (
    message.includes("Executable doesn't exist") ||
    message.includes("browserType.launch") ||
    message.includes("Failed to launch") ||
    message.includes("spawn") ||
    message.includes("ENOENT")
  );
}

function normalizeUrlForComparison(url: string): string {
  const parsed = new URL(url);
  parsed.hostname = parsed.hostname.replace(/^www\./i, "").toLowerCase();
  parsed.hash = "";
  parsed.search = "";
  parsed.pathname = parsed.pathname.replace(/\/+$/, "") || "/";
  return parsed.toString();
}

function normalizeComparableHost(host: string): string {
  return host.replace(/^www\./i, "").toLowerCase();
}

function shouldCrawlUrl(url: string, host: string): boolean {
  let parsed: URL;

  try {
    parsed = new URL(url);
  } catch {
    return false;
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    return false;
  }

  if (normalizeComparableHost(parsed.hostname) !== normalizeComparableHost(host)) {
    return false;
  }

  const pathname = parsed.pathname.toLowerCase();

  if (NON_HTML_EXTENSIONS.some((extension) => pathname.endsWith(extension))) {
    return false;
  }

  return true;
}

function isPrioritySectionUrl(url: string): boolean {
  try {
    const pathname = new URL(url).pathname.toLowerCase();
    return PRIORITY_PATH_SIGNALS.some((signal) => pathname.includes(signal));
  } catch {
    return false;
  }
}

function sortUrlsForInternalLinking(urls: string[]): string[] {
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

function extractXmlLocEntries(xml: string): string[] {
  return Array.from(xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi))
    .map((match) => match[1]?.trim() ?? "")
    .filter(Boolean);
}

async function discoverSitemapUrls(startUrl: string, maxUrls = 180): Promise<string[]> {
  try {
    const start = new URL(startUrl);
    const sitemapCandidates = [
      new URL("/sitemap.xml", start.origin).toString(),
      new URL("/sitemap_index.xml", start.origin).toString(),
    ];
    const discovered = new Set<string>();
    const fetchedSitemaps = new Set<string>();
    const queue = [...sitemapCandidates];

    while (queue.length > 0 && discovered.size < maxUrls && fetchedSitemaps.size < 10) {
      const sitemapUrl = queue.shift();

      if (!sitemapUrl || fetchedSitemaps.has(sitemapUrl)) {
        continue;
      }

      fetchedSitemaps.add(sitemapUrl);

      const response = await fetch(sitemapUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; RankshiftBot/1.0; +https://rankshift-app.vercel.app)",
          Accept: "application/xml,text/xml,text/plain,*/*",
        },
      }).catch(() => null);

      if (!response?.ok) {
        continue;
      }

      const xml = await response.text();
      const locs = extractXmlLocEntries(xml);

      for (const loc of locs) {
        try {
          const normalized = normalizeUrlForComparison(loc);
          const parsed = new URL(normalized);

          if (parsed.hostname !== start.hostname) {
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
        } catch {
          continue;
        }
      }
    }

    return sortUrlsForInternalLinking(Array.from(discovered)).slice(0, maxUrls);
  } catch {
    return [];
  }
}

async function extractPageData(page: Page): Promise<PageExtractionResult> {
  const metadata = await page.evaluate<RawPageMetadata>(() => {
    const normalizeWhitespace = (value: string): string => value.replace(/\s+/g, " ").trim();

    const getMetaContent = (selector: string): string | null => {
      const element = document.querySelector(selector);
      const content = element?.getAttribute("content")?.trim() ?? "";
      return content || null;
    };

    const getNearbyText = (image: HTMLImageElement): string => {
      const candidates: string[] = [];
      const pushText = (value: string | null | undefined) => {
        const normalized = normalizeWhitespace(value ?? "");

        if (normalized.length >= 24) {
          candidates.push(normalized);
        }
      };

      const figure = image.closest("figure");
      pushText(figure?.querySelector("figcaption")?.textContent);

      const semanticParent = image.closest(
        "p, li, section, article, main, div, aside",
      ) as HTMLElement | null;
      pushText(semanticParent?.textContent);

      let sibling: Element | null = image.previousElementSibling;

      while (sibling) {
        pushText(sibling.textContent);
        sibling = sibling.previousElementSibling;
      }

      sibling = image.nextElementSibling;

      while (sibling) {
        pushText(sibling.textContent);
        sibling = sibling.nextElementSibling;
      }

      return candidates[0] ?? "";
    };

    const images = Array.from(document.querySelectorAll("img")).map<RawImageCandidate>((image) => ({
      src: image.currentSrc || image.getAttribute("src") || "",
      alt: image.getAttribute("alt") ?? "",
      surroundingText: getNearbyText(image),
    }));

    return {
      title: normalizeWhitespace(document.title ?? ""),
      description: getMetaContent('meta[name="description"]') ?? "",
      images,
      canonical:
        document.querySelector('link[rel="canonical"]')?.getAttribute("href")?.trim() ?? null,
      robots: getMetaContent('meta[name="robots"]'),
      hasJsonLd: document.querySelector('script[type="application/ld+json"]') !== null,
      schemaTypes: (() => {
        const scripts = Array.from(
          document.querySelectorAll('script[type="application/ld+json"]'),
        );
        const types = new Set<string>();

        const collectTypes = (value: unknown) => {
          if (!value || typeof value !== "object") {
            return;
          }

          if (Array.isArray(value)) {
            value.forEach(collectTypes);
            return;
          }

          const record = value as Record<string, unknown>;
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
          try {
            const content = script.textContent?.trim() ?? "";
            if (!content) {
              return;
            }
            collectTypes(JSON.parse(content) as unknown);
          } catch {
            return;
          }
        });

        return Array.from(types);
      })(),
    };
  });
  const editorial = await page.evaluate(extractEditorialContentInBrowser, {
    cookiePatterns: COOKIE_PATTERNS,
    currentUrl: page.url(),
  });
  const images = metadata.images.map<CrawlImage>((image) => {
    const alt = image.alt.trim();

    return {
      src: image.src,
      alt,
      fileName: getImageFileName(image.src),
      surroundingText: image.surroundingText,
      suggestedAlt: buildSuggestedAltText({
        src: image.src,
        surroundingText: image.surroundingText,
      }),
      isMissingAlt: alt.length === 0,
    };
  });

  return {
    ...metadata,
    images,
    ...editorial,
  };
}

async function crawlPageSnapshot(browser: Browser, url: string): Promise<{
  snapshot: SitePageSnapshot;
  loadTimeMs: number;
  discoveredUrls: string[];
}> {
  const page = await browser.newPage();

  try {
    const startedAt = Date.now();
    const response = await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 30_000,
    });
    await page.waitForLoadState("networkidle", { timeout: 5_000 }).catch(() => null);
    await page.waitForTimeout(250);
    const loadTimeMs = Date.now() - startedAt;

    if (!response) {
      throw new Error("No response received while loading the page.");
    }

    const contentType = response.headers()["content-type"] ?? null;
    const extracted = await extractPageData(page);
    const discoveredUrls = await page.evaluate((currentUrl) => {
      const current = new URL(currentUrl);
      const urls = Array.from(document.querySelectorAll("a[href]"))
        .map((anchor) => anchor.getAttribute("href"))
        .filter((href): href is string => Boolean(href))
        .map((href) => {
          try {
            const resolved = new URL(href, current.href);

            if (
              resolved.hostname !== current.hostname ||
              resolved.protocol === "mailto:" ||
              resolved.protocol === "tel:"
            ) {
              return null;
            }

            resolved.hash = "";
            resolved.search = "";
            resolved.pathname = resolved.pathname.replace(/\/+$/, "") || "/";

            return resolved.toString();
          } catch {
            return null;
          }
        })
        .filter((value): value is string => Boolean(value));

      return [...new Set(urls)];
    }, page.url());
    const robotsLower = extracted.robots?.toLowerCase() ?? "";
    const isIndexable =
      response.ok() &&
      (contentType?.includes("text/html") ?? true) &&
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
        existingInternalLinks: extracted.existingInternalLinks.map((link) => ({
          ...link,
          normalizedUrl: normalizeUrlForComparison(link.normalizedUrl),
        })),
        canonical: extracted.canonical,
        robots: extracted.robots,
        indexable: isIndexable,
        statusCode: response.status(),
        contentType,
        hasJsonLd: extracted.hasJsonLd,
        schemaTypes: extracted.schemaTypes ?? [],
      },
    };
  } finally {
    await page.close();
  }
}

export async function crawlPage(url: string): Promise<CrawlResult> {
  let browser: Browser | null = null;

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
      schemaTypes: snapshot.schemaTypes ?? [],
    };
  } catch (error) {
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
        schemaTypes: snapshot.schemaTypes ?? [],
      };
    }

    const message = error instanceof Error ? error.message : "Unknown crawl error.";
    throw new Error(`Unable to crawl page: ${message}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

async function crawlSiteForInternalLinkingWithBasicFetch(
  startUrl: string,
  maxPages: number,
): Promise<SitePageSnapshot[]> {
  const normalizedStartUrl = normalizeUrlForComparison(startUrl);
  const start = new URL(normalizedStartUrl);
  const sitemapUrls = await discoverSitemapUrls(normalizedStartUrl, Math.min(220, maxPages * 6));
  const seededUrls = [
    normalizedStartUrl,
    ...PRIORITY_SECTION_SEEDS.map((path) => new URL(path, start.origin).toString()),
    ...sitemapUrls,
  ].filter((url, index, values) => values.indexOf(url) === index);
  const queue: string[] = sortUrlsForInternalLinking(seededUrls);
  const visited = new Set<string>();
  const pages: SitePageSnapshot[] = [];

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

      if (!(snapshot.contentType?.includes("text/html") ?? true)) {
        continue;
      }

      pages.push(snapshot);

      const prioritized = sortUrlsForInternalLinking(discoveredUrls);

      for (const discoveredUrl of prioritized) {
        const normalized = normalizeUrlForComparison(discoveredUrl);

        if (
          !visited.has(normalized) &&
          !queue.includes(normalized) &&
          shouldCrawlUrl(normalized, start.hostname)
        ) {
          if (isPrioritySectionUrl(normalized)) {
            queue.unshift(normalized);
          } else {
            queue.push(normalized);
          }
        }
      }
    } catch {
      // keep crawling other URLs
    }
  }

  console.debug(
    `[crawler] internal-linking fallback fetch discovered ${pages.length} pages starting from ${normalizedStartUrl}`,
  );

  return pages;
}

export async function crawlSiteForInternalLinking(
  startUrl: string,
  maxPages = 12,
): Promise<SitePageSnapshot[]> {
  let browser: Browser | null = null;

  try {
    const normalizedStartUrl = normalizeUrlForComparison(startUrl);
    const start = new URL(normalizedStartUrl);
    const sitemapUrls = await discoverSitemapUrls(normalizedStartUrl, Math.min(220, maxPages * 6));
    const seededUrls = [
      normalizedStartUrl,
      ...PRIORITY_SECTION_SEEDS.map((path) => new URL(path, start.origin).toString()),
      ...sitemapUrls,
    ].filter((url, index, values) => values.indexOf(url) === index);
    const queue: string[] = sortUrlsForInternalLinking(seededUrls);
    const visited = new Set<string>();
    const pages: SitePageSnapshot[] = [];
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

        if (!(snapshot.contentType?.includes("text/html") ?? true)) {
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

          if (
            !visited.has(normalized) &&
            !queue.includes(normalized) &&
            shouldCrawlUrl(normalized, start.hostname)
          ) {
            diagnostics.queueAddedFromDiscovery += 1;
            if (isPrioritySectionUrl(normalized)) {
              queue.unshift(normalized);
            } else {
              queue.push(normalized);
            }
          }
        }
      } catch {
        diagnostics.crawlFailures += 1;

        try {
          const { snapshot } = await crawlPageWithBasicFetch(nextUrl);

          if (!(snapshot.contentType?.includes("text/html") ?? true)) {
            diagnostics.skippedNonHtml += 1;
            continue;
          }

          pages.push(snapshot);
          diagnostics.fallbackFetchSucceeded += 1;
          diagnostics.internalLinksExtracted += snapshot.existingInternalLinks.length;
          if (snapshot.bodyText.length >= 120 && snapshot.contentSections.length > 0) {
            diagnostics.pagesWithUsableMainContent += 1;
          }
        } catch {
          // keep moving through queue
        }
        continue;
      }
    }

    console.debug(
      `[crawler] internal-linking crawl discovered ${pages.length} pages starting from ${normalizedStartUrl}`,
    );
    console.debug("[crawler][internal-linking][pipeline]", diagnostics);

    return pages;
  } catch (error) {
    if (shouldUseBasicFetchFallback(error)) {
      return crawlSiteForInternalLinkingWithBasicFetch(startUrl, maxPages);
    }

    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
