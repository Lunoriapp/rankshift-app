import type { SitePageSnapshot } from "../crawler";

import type { SiteContentContext, SitePageTopicProfile, TopicPhraseCandidate } from "./types";
import {
  buildPageDisplayTitle,
  dedupeStrings,
  isCommercialPage,
  normalizeWhitespace,
  repeatedBodyPhrases,
  splitIntoSentences,
  titleParts,
  topTermsFromBody,
} from "./shared";

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

export function analyseSiteTopics(pages: SitePageSnapshot[]): SitePageTopicProfile[] {
  const inboundCounts = new Map<string, number>();

  for (const page of pages) {
    for (const link of page.existingInternalLinks) {
      inboundCounts.set(link.normalizedUrl, (inboundCounts.get(link.normalizedUrl) ?? 0) + 1);
    }
  }

  return pages
    .filter(
      (page) =>
        page.indexable &&
        page.statusCode >= 200 &&
        page.statusCode < 400 &&
        page.bodyText.length >= 80,
    )
    .map((page) => ({
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
      existingInternalLinkTargets: dedupeStrings(
        page.existingInternalLinks.map((link) => link.normalizedUrl),
      ),
      inboundInternalLinkCount: inboundCounts.get(page.url) ?? 0,
      outboundInternalLinkCount: page.existingInternalLinks.length,
      commerciallyImportant: isCommercialPage(page),
      indexable: page.indexable,
    }));
}
