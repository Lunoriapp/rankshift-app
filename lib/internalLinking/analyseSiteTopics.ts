import type { SitePageSnapshot } from "../crawler";

import type { SiteContentContext, SitePageTopicProfile, TopicPhraseCandidate } from "./types";
import {
  buildPageDisplayTitle,
  dedupeStrings,
  isCommercialPage,
  normalizeWhitespace,
  normalizePhrase,
  repeatedBodyPhrases,
  splitIntoSentences,
  tokenize,
  titleParts,
  topTermsFromBody,
} from "./shared";
import { normalizeAnchorTextForCompare, normalizeUrlForCompare } from "./urlCompare";

function dedupeComparableStrings(values: string[]): string[] {
  const seen = new Set<string>();
  const deduped: string[] = [];

  for (const value of values) {
    if (!value || seen.has(value)) {
      continue;
    }

    seen.add(value);
    deduped.push(value);
  }

  return deduped;
}

function dedupeInternalLinkEntries(
  entries: SitePageTopicProfile["existingInternalLinkEntries"],
): SitePageTopicProfile["existingInternalLinkEntries"] {
  const seen = new Set<string>();
  const deduped: SitePageTopicProfile["existingInternalLinkEntries"] = [];

  for (const entry of entries) {
    const key = `${entry.normalizedUrl}|${entry.normalizedAnchorText}`;

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    deduped.push(entry);
  }

  return deduped;
}

function choosePrimaryTopic(page: SitePageSnapshot): string {
  const candidates = [page.h1, ...titleParts(page.title), ...page.h2s]
    .map((candidate) => normalizeWhitespace(candidate))
    .filter((candidate) => candidate.length >= 8);

  return candidates[0] ?? buildPageDisplayTitle(page);
}

function buildTopicPhrases(page: SitePageSnapshot): TopicPhraseCandidate[] {
  const phrases: TopicPhraseCandidate[] = [];
  const addPhrase = (
    phrase: string,
    source: TopicPhraseCandidate["source"],
    weight: number,
  ) => {
    const clean = normalizeWhitespace(phrase);

    if (clean.length < 4) {
      return;
    }

    phrases.push({ phrase: clean, source, weight });
  };

  for (const phrase of titleParts(page.title)) {
    addPhrase(phrase, "title", 1);
  }

  addPhrase(page.h1, "h1", 0.98);

  for (const h2 of page.h2s) {
    addPhrase(h2, "h2", 0.88);
  }

  for (const phrase of repeatedBodyPhrases(page.bodyText, 10)) {
    addPhrase(phrase, "body_term", 0.58);
  }

  for (const term of topTermsFromBody(page.bodyText, 6)) {
    addPhrase(term, "body_term", 0.42);
  }

  const bestWeightByPhrase = new Map<string, TopicPhraseCandidate>();

  for (const entry of phrases) {
    const key = entry.phrase.toLowerCase();
    const existing = bestWeightByPhrase.get(key);

    if (!existing || existing.weight < entry.weight) {
      bestWeightByPhrase.set(key, entry);
    }
  }

  return [...bestWeightByPhrase.values()]
    .sort((a, b) => b.weight - a.weight || b.phrase.length - a.phrase.length)
    .slice(0, 18);
}

function buildBodyContexts(page: SitePageSnapshot): SiteContentContext[] {
  const contexts: SiteContentContext[] = [];
  let position = 0;

  for (const section of page.contentSections) {
    const normalizedSectionText = normalizeWhitespace(section.text);
    const sectionLabel = section.label || "Body content";

    if (normalizedSectionText.length >= 32) {
      contexts.push({
        text: normalizedSectionText,
        sectionLabel,
        blockType: section.type,
        position,
      });
      position += 1;
    }

    for (const sentence of splitIntoSentences(normalizedSectionText)) {
      if (sentence.length < 32) {
        continue;
      }

      contexts.push({
        text: sentence,
        sectionLabel,
        blockType: section.type,
        position,
      });
      position += 1;
    }
  }

  const seen = new Set<string>();
  const deduped = contexts.filter((context) => {
    const key = normalizeWhitespace(context.text).toLowerCase();

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });

  return deduped.slice(0, 220);
}

function inferPageType(page: SitePageSnapshot): SitePageTopicProfile["pageType"] {
  const urlPath = new URL(page.url).pathname.toLowerCase();
  const signals = `${page.title} ${page.h1} ${page.h2s.join(" ")} ${urlPath}`.toLowerCase();

  if (urlPath === "/") {
    return "homepage";
  }

  const profileSignals = [
    "/about",
    "/team",
    "/profile",
    "about us",
    "our team",
    "profile",
    "biography",
    "who we are",
  ];
  if (profileSignals.some((signal) => signals.includes(signal))) {
    return "profile";
  }

  const blogSignals = ["blog", "news", "guide", "article", "how to", "tips", "resources"];
  if (blogSignals.some((signal) => signals.includes(signal))) {
    return "blog";
  }

  const ecommerceSignals = [
    "product",
    "products",
    "shop",
    "category",
    "collection",
    "sku",
    "cart",
    "checkout",
    "buy",
  ];
  if (ecommerceSignals.some((signal) => signals.includes(signal))) {
    return "ecommerce";
  }

  const serviceSignals = [
    "service",
    "services",
    "agency",
    "consult",
    "consulting",
    "specialist",
    "law",
    "mediation",
    "support",
    "solutions",
  ];
  if (serviceSignals.some((signal) => signals.includes(signal))) {
    return "service";
  }

  return "generic";
}

export function analyseSiteTopics(pages: SitePageSnapshot[]): SitePageTopicProfile[] {
  const inboundCounts = new Map<string, number>();

  for (const page of pages) {
    for (const link of page.existingInternalLinks) {
      const normalizedTarget = normalizeUrlForCompare(
        link.normalizedUrl || link.resolvedUrl || link.href,
        page.url,
      );

      if (!normalizedTarget) {
        continue;
      }

      inboundCounts.set(normalizedTarget, (inboundCounts.get(normalizedTarget) ?? 0) + 1);
    }
  }

  const profiles = pages
    .filter(
      (page) =>
        page.indexable &&
        page.statusCode >= 200 &&
        page.statusCode < 400 &&
        page.bodyText.length >= 80,
    )
    .map((page) => {
      const comparablePageUrl = normalizeUrlForCompare(page.url);
      const existingInternalLinkEntries = dedupeInternalLinkEntries(
        page.existingInternalLinks
          .map((link) => {
            const normalizedTarget = normalizeUrlForCompare(
              link.normalizedUrl || link.resolvedUrl || link.href,
              page.url,
            );

            if (!normalizedTarget) {
              return null;
            }

            const anchorText = normalizeWhitespace(link.text);

            return {
              normalizedUrl: normalizedTarget,
              anchorText,
              normalizedAnchorText: normalizeAnchorTextForCompare(anchorText),
            };
          })
          .filter(
            (
              entry,
            ): entry is SitePageTopicProfile["existingInternalLinkEntries"][number] =>
              entry !== null,
          ),
      );

      return {
        url: page.url,
        canonicalUrl: page.canonical,
        title: buildPageDisplayTitle(page),
        h1: page.h1,
        h2s: page.h2s,
        primaryTopic: choosePrimaryTopic(page),
        topicPhrases: buildTopicPhrases(page),
        keywords: dedupeStrings(topTermsFromBody(page.bodyText, 12)),
        bodyContexts: buildBodyContexts(page),
        contentDebug: page.contentDebug,
        existingInternalLinkTargets: dedupeComparableStrings(
          existingInternalLinkEntries.map((entry) => entry.normalizedUrl),
        ),
        existingInternalLinkEntries,
        inboundInternalLinkCount: comparablePageUrl
          ? (inboundCounts.get(comparablePageUrl) ?? 0)
          : 0,
        outboundInternalLinkCount: page.existingInternalLinks.length,
        commerciallyImportant: isCommercialPage(page),
        pageType: inferPageType(page),
        indexable: page.indexable,
      };
    });

  const phrasePageFrequency = new Map<string, number>();

  for (const profile of profiles) {
    const seenOnPage = new Set<string>();

    for (const phrase of profile.topicPhrases) {
      const key = normalizePhrase(phrase.phrase);

      if (!key || seenOnPage.has(key)) {
        continue;
      }

      seenOnPage.add(key);
      phrasePageFrequency.set(key, (phrasePageFrequency.get(key) ?? 0) + 1);
    }
  }

  const profileCount = profiles.length;

  return profiles.map((profile) => {
    const primaryTopicTokens = new Set(tokenize(profile.primaryTopic));
    const filteredTopicPhrases = profile.topicPhrases.filter((phrase) => {
      const key = normalizePhrase(phrase.phrase);
      const frequency = phrasePageFrequency.get(key) ?? 0;
      const frequencyRatio = profileCount > 0 ? frequency / profileCount : 0;
      const appearsTooWidely = frequency >= 3 && frequencyRatio >= 0.45;

      if (!appearsTooWidely) {
        return true;
      }

      const phraseTokens = tokenize(phrase.phrase);
      const overlap = phraseTokens.filter((token) => primaryTopicTokens.has(token)).length;

      return overlap >= 2;
    });

    return {
      ...profile,
      topicPhrases:
        filteredTopicPhrases.length > 0
          ? filteredTopicPhrases
          : profile.topicPhrases.slice(0, 8),
    };
  });
}
