import type {
  CrawlContentDebug,
  CrawlContentSection,
  CrawlHeading,
  CrawlInternalLink,
  HeadingLevel,
} from "@/lib/crawler";

export interface EditorialExtractionResult {
  headings: CrawlHeading[];
  h1: string;
  h2s: string[];
  bodyText: string;
  contentSections: CrawlContentSection[];
  contentDebug: CrawlContentDebug;
  existingInternalLinks: CrawlInternalLink[];
}

interface ExtractionInput {
  cookiePatterns: string[];
  currentUrl: string;
}

interface RootExtractionResult {
  bodyText: string;
  contentSections: CrawlContentSection[];
  existingInternalLinks: CrawlInternalLink[];
  headings: CrawlHeading[];
  contentDebug: CrawlContentDebug;
}

interface CandidateEvaluation {
  root: Element;
  selector: string;
  extraction: RootExtractionResult;
}

export function extractEditorialContentInBrowser(
  input: ExtractionInput,
): EditorialExtractionResult {
  const { cookiePatterns, currentUrl } = input;

  const normalizeWhitespace = (value: string): string => value.replace(/\s+/g, " ").trim();

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

  const shouldIgnoreByTag = (element: Element | null): boolean => {
    let current: Element | null = element;

    while (current) {
      const tagName = current.tagName.toLowerCase();

      if (["header", "nav", "footer", "aside", "form"].includes(tagName)) {
        return true;
      }

      current = current.parentElement;
    }

    return false;
  };

  const isCookieRelatedElement = (element: Element | null): boolean => {
    let current: Element | null = element;

    while (current) {
      const attributes = [
        current.id,
        current.className,
        current.getAttribute("role"),
        current.getAttribute("aria-label"),
        current.getAttribute("aria-labelledby"),
        current.getAttribute("data-nosnippet"),
      ]
        .filter((value): value is string => typeof value === "string" && value.length > 0)
        .join(" ")
        .toLowerCase();

      const isDialog =
        current.getAttribute("role") === "dialog" ||
        current.getAttribute("aria-modal") === "true" ||
        current.tagName.toLowerCase() === "dialog";

      if (isDialog || cookiePatterns.some((pattern) => attributes.includes(pattern))) {
        return true;
      }

      current = current.parentElement;
    }

    return false;
  };

  const hasBoilerplateSignal = (element: Element | null): boolean => {
    let current: Element | null = element;

    while (current) {
      const haystack = [
        current.id,
        current.className,
        current.getAttribute("role"),
        current.getAttribute("aria-label"),
        current.getAttribute("data-testid"),
      ]
        .filter((value): value is string => typeof value === "string" && value.length > 0)
        .join(" ")
        .toLowerCase();

      if (boilerplatePatterns.some((pattern) => haystack.includes(pattern))) {
        return true;
      }

      current = current.parentElement;
    }

    return false;
  };

  const isMeaningfulTextBlock = (text: string, isParagraph: boolean): boolean => {
    const minLength = isParagraph ? 60 : 38;
    return text.length >= minLength;
  };

  const cloneAndCleanRoot = (root: Element): HTMLElement => {
    const clonedRoot = root.cloneNode(true) as HTMLElement;

    clonedRoot
      .querySelectorAll(
        "script, style, noscript, svg, form, nav, footer, aside, iframe, dialog, [role='dialog'], [aria-modal='true'], .sr-only, .visually-hidden",
      )
      .forEach((node) => node.remove());

    clonedRoot.querySelectorAll("*").forEach((node) => {
      if (
        shouldIgnoreByTag(node) ||
        isCookieRelatedElement(node) ||
        hasBoilerplateSignal(node)
      ) {
        node.remove();
      }
    });

    clonedRoot
      .querySelectorAll(
        "[class*='cta'], [id*='cta'], [class*='related'], [id*='related'], [class*='share'], [id*='share'], [class*='recommend'], [id*='recommend'], [class*='newsletter'], [id*='newsletter'], [class*='subscribe'], [id*='subscribe'], [class*='author'], [id*='author'], [class*='comment'], [id*='comment'], [class*='breadcrumb'], [id*='breadcrumb'], [class*='popup'], [id*='popup'], [class*='hero'], [id*='hero'], [class*='promo'], [id*='promo'], [class*='search'], [id*='search'], [class*='faq'], [id*='faq']",
      )
      .forEach((node) => node.remove());

    return clonedRoot;
  };

  const isElementHidden = (element: HTMLElement): boolean => {
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

  const isInsideNonContentContainer = (element: Element | null): boolean => {
    let current: Element | null = element;

    while (current) {
      const id = current.id.toLowerCase();
      const className = typeof current.className === "string" ? current.className.toLowerCase() : "";
      const role = current.getAttribute("role")?.toLowerCase() ?? "";
      const ariaHidden = current.getAttribute("aria-hidden");

      if (
        ariaHidden === "true" ||
        id === "ccc-module" ||
        id.includes("overlay") ||
        className.includes("overlay") ||
        className.includes("cookie") ||
        className.includes("consent") ||
        role === "dialog"
      ) {
        return true;
      }

      current = current.parentElement;
    }

    return false;
  };

  const extractVisibleDocumentH1s = (): CrawlHeading[] =>
    Array.from(document.querySelectorAll("h1"))
      .map<CrawlHeading | null>((element) => {
        const heading = element as HTMLHeadingElement;
        const text = normalizeWhitespace(heading.textContent ?? "");

        if (!text || isElementHidden(heading) || isInsideNonContentContainer(heading)) {
          return null;
        }

        return {
          level: 1,
          text,
        };
      })
      .filter((heading): heading is CrawlHeading => heading !== null);

  const extractHeadingsFromContainer = (container: Element): CrawlHeading[] =>
    Array.from(container.querySelectorAll("h2, h3, h4"))
      .map<CrawlHeading | null>((element) => {
        const heading = element as HTMLElement;

        if (
          shouldIgnoreByTag(heading) ||
          isCookieRelatedElement(heading) ||
          isInsideNonContentContainer(heading) ||
          isElementHidden(heading)
        ) {
          return null;
        }

        const tagName = heading.tagName.toLowerCase();
        const level = Number.parseInt(tagName.replace("h", ""), 10);
        const text = normalizeWhitespace(heading.textContent ?? "");

        if (!text || level < 2 || level > 4) {
          return null;
        }

        return {
          level: level as HeadingLevel,
          text,
        };
      })
      .filter((heading): heading is CrawlHeading => heading !== null);

  const normalizeComparableHost = (value: string): string =>
    value.trim().replace(/^www\./i, "").toLowerCase();

  const resolveInternalLink = (
    href: string,
    anchorText: string,
    currentUrlObject: URL,
  ): CrawlInternalLink | null => {
    if (
      !href ||
      href.startsWith("#") ||
      href.startsWith("mailto:") ||
      href.startsWith("tel:")
    ) {
      return null;
    }

    try {
      const resolved = new URL(href, currentUrlObject.href);

      if (!["http:", "https:"].includes(resolved.protocol)) {
        return null;
      }

      if (
        normalizeComparableHost(resolved.hostname) !==
        normalizeComparableHost(currentUrlObject.hostname)
      ) {
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
    } catch {
      return null;
    }
  };

  const extractFromRoot = (root: Element, selector: string): RootExtractionResult => {
    const visibleH1s = extractVisibleDocumentH1s();
    const headings = [...visibleH1s, ...extractHeadingsFromContainer(root)];
    const clonedRoot = cloneAndCleanRoot(root);
    const sections: CrawlContentSection[] = [];
    const contextualLinks: CrawlInternalLink[] = [];
    const seenBlockTexts = new Set<string>();
    const seenLinkKeys = new Set<string>();
    let currentLabel = headings.find((heading) => heading.level === 1)?.text ?? "Introduction";
    let paragraphCount = 0;
    let listItemCount = 0;

    const currentUrlObject = new URL(currentUrl);
    const contentNodes = Array.from(clonedRoot.querySelectorAll("h1, h2, h3, h4, p, li"));

    for (const node of contentNodes) {
      const tagName = node.tagName.toLowerCase();
      const text = normalizeWhitespace(node.textContent ?? "");

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
      } else {
        listItemCount += 1;
      }

      const anchors = Array.from(node.querySelectorAll("a[href]"));

      for (const anchor of anchors) {
        const href = anchor.getAttribute("href")?.trim() ?? "";
        const anchorText = normalizeWhitespace(
          anchor.textContent ?? anchor.getAttribute("aria-label") ?? "",
        );
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

    const allInternalLinks: CrawlInternalLink[] = [];
    const seenAllInternalLinks = new Set<string>();

    for (const anchor of Array.from(document.querySelectorAll("a[href]"))) {
      const href = anchor.getAttribute("href")?.trim() ?? "";
      const anchorText = normalizeWhitespace(
        anchor.textContent ?? anchor.getAttribute("aria-label") ?? "",
      );
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
      },
    };
  };

  const getMeaningfulTextLength = (root: Element): number =>
    normalizeWhitespace(root.textContent ?? "").length;

  let chosenCandidate: CandidateEvaluation | null = null;

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
    const fallbackRoot = document.querySelector("article, main") ?? document.body;
    const fallbackSelector = fallbackRoot === document.body ? "body" : fallbackRoot.tagName.toLowerCase();

    chosenCandidate = {
      root: fallbackRoot,
      selector: fallbackSelector,
      extraction: extractFromRoot(fallbackRoot, fallbackSelector),
    };
  }

  const finalExtraction: RootExtractionResult = {
    ...chosenCandidate.extraction,
    contentDebug: {
      ...chosenCandidate.extraction.contentDebug,
      fallbackStrategyUsed: false,
    },
  };

  console.debug(
    `[extractor] selected selector=${finalExtraction.contentDebug.selectedContentSelector}`,
  );
  console.debug(
    `[extractor] innerHTML length=${chosenCandidate.root.innerHTML.length}`,
  );
  console.debug(
    `[extractor] total_headings=${finalExtraction.contentDebug.totalHeadingCount} h1_count=${finalExtraction.contentDebug.headingCounts.h1} h2_count=${finalExtraction.contentDebug.headingCounts.h2} h3_count=${finalExtraction.contentDebug.headingCounts.h3} h4_count=${finalExtraction.contentDebug.headingCounts.h4}`,
  );
  console.debug(
    `[extractor] h1_texts=${finalExtraction.contentDebug.headingTexts.h1.join(" | ") || "(none)"}`,
  );
  console.debug(
    `[extractor] has_multiple_visible_h1=${finalExtraction.contentDebug.hasMultipleVisibleH1}`,
  );
  console.debug(
    `[extractor] h2_texts=${finalExtraction.contentDebug.headingTexts.h2.join(" | ") || "(none)"}`,
  );
  console.debug(
    `[extractor] h3_texts=${finalExtraction.contentDebug.headingTexts.h3.join(" | ") || "(none)"}`,
  );
  console.debug(
    `[extractor] h4_texts=${finalExtraction.contentDebug.headingTexts.h4.join(" | ") || "(none)"}`,
  );

  return {
    headings: finalExtraction.headings,
    h1: finalExtraction.headings.find((heading) => heading.level === 1)?.text ?? "",
    h2s: finalExtraction.headings
      .filter((heading) => heading.level === 2)
      .map((heading) => heading.text),
    bodyText: finalExtraction.bodyText,
    contentSections: finalExtraction.contentSections,
    contentDebug: finalExtraction.contentDebug,
    existingInternalLinks: finalExtraction.existingInternalLinks,
  };
}
