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

function normalizeUrlForComparison(url: string): string {
  const parsed = new URL(url);
  parsed.hash = "";
  parsed.search = "";
  parsed.pathname = parsed.pathname.replace(/\/+$/, "") || "/";
  return parsed.toString();
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

  if (parsed.hostname !== host) {
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
      },
    };
  } finally {
    await page.close();
  }
}

export async function crawlPage(url: string): Promise<CrawlResult> {
  let browser: Browser | null = null;

  try {
    browser = await chromium.launch({ headless: true });
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
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown crawl error.";
    throw new Error(`Unable to crawl page: ${message}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

export async function crawlSiteForInternalLinking(
  startUrl: string,
  maxPages = 12,
): Promise<SitePageSnapshot[]> {
  let browser: Browser | null = null;

  try {
    const normalizedStartUrl = normalizeUrlForComparison(startUrl);
    const start = new URL(normalizedStartUrl);
    const seededUrls = [
      normalizedStartUrl,
      ...PRIORITY_SECTION_SEEDS.map((path) => new URL(path, start.origin).toString()),
    ].filter((url, index, values) => values.indexOf(url) === index);
    const queue: string[] = sortUrlsForInternalLinking(seededUrls);
    const visited = new Set<string>();
    const pages: SitePageSnapshot[] = [];

    browser = await chromium.launch({ headless: true });

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
        const { snapshot, discoveredUrls } = await crawlPageSnapshot(browser, nextUrl);

        if (!(snapshot.contentType?.includes("text/html") ?? true)) {
          continue;
        }

        pages.push(snapshot);

        const prioritizedDiscoveredUrls = sortUrlsForInternalLinking(discoveredUrls);

        for (const discoveredUrl of prioritizedDiscoveredUrls) {
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
        continue;
      }
    }

    console.debug(
      `[crawler] internal-linking crawl discovered ${pages.length} pages starting from ${normalizedStartUrl}`,
    );

    return pages;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
