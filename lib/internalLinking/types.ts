import type { CrawlContentDebug, CrawlContentSection } from "../crawler";

export type InternalLinkConfidence = "High" | "Medium" | "Low";
export type InternalLinkOpportunityStatus = "open" | "completed";

export interface TopicPhraseCandidate {
  phrase: string;
  source: "title" | "h1" | "h2" | "body_term";
  weight: number;
}

export interface SiteContentContext {
  text: string;
  sectionLabel: string;
  blockType: CrawlContentSection["type"];
}

export interface SitePageTopicProfile {
  url: string;
  canonicalUrl: string | null;
  title: string;
  h1: string;
  h2s: string[];
  primaryTopic: string;
  topicPhrases: TopicPhraseCandidate[];
  keywords: string[];
  bodyContexts: SiteContentContext[];
  contentDebug: CrawlContentDebug;
  existingInternalLinkTargets: string[];
  inboundInternalLinkCount: number;
  outboundInternalLinkCount: number;
  commerciallyImportant: boolean;
  indexable: boolean;
}

export interface InternalLinkOpportunity {
  id: string;
  sourceUrl: string;
  sourceTitle: string;
  targetUrl: string;
  targetTitle: string;
  suggestedAnchor: string;
  matchedSnippet: string;
  placementHint: string;
  reason: string;
  confidence: InternalLinkConfidence;
  confidenceScore: number;
  status: InternalLinkOpportunityStatus;
  category: "Internal linking";
  otherPossibleMatches?: Array<{
    targetUrl: string;
    targetTitle: string;
    suggestedAnchor: string;
    confidence: InternalLinkConfidence;
    confidenceScore: number;
  }>;
}

export interface InternalLinkDebugEntry {
  sourceUrl: string;
  selectedContentSelector: string;
  paragraphCount: number;
  extractedChunkCount: number;
  firstExtractedTextChunks: string[];
  fallbackStrategyUsed: boolean;
  headingCounts: CrawlContentDebug["headingCounts"];
  headingTexts: CrawlContentDebug["headingTexts"];
  hasMultipleVisibleH1: boolean;
  contextualBodyLinks: CrawlContentDebug["contextualBodyLinks"];
  candidateTargetPagesConsidered: number;
  opportunitiesFound: number;
  targetEvaluations: Array<{
    targetUrl: string;
    targetTitle: string;
    candidatePhrases: string[];
    existingContextualBodyLink: boolean;
    matchedSnippets: string[];
    decision: "accepted" | "rejected" | "skipped";
    reasons: string[];
  }>;
}

export interface InternalLinkingReport {
  pages: SitePageTopicProfile[];
  opportunities: InternalLinkOpportunity[];
  scannedPageCount: number;
  debug: InternalLinkDebugEntry[];
}
