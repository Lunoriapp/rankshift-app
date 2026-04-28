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
  position: number;
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
  existingInternalLinkEntries: Array<{
    normalizedUrl: string;
    anchorText: string;
    normalizedAnchorText: string;
  }>;
  inboundInternalLinkCount: number;
  outboundInternalLinkCount: number;
  commerciallyImportant: boolean;
  pageType: "service" | "blog" | "ecommerce" | "general";
  indexable: boolean;
}

export interface InternalLinkOpportunity {
  id: string;
  sourceUrl: string;
  sourceTitle: string;
  targetUrl: string;
  targetTitle: string;
  suggestedAnchor: string | null;
  rewriteSuggestion?: string | null;
  matchedSnippet: string;
  placementHint: string;
  reason: string;
  expectedOutcome?: string;
  confidence: InternalLinkConfidence;
  confidenceScore: number;
  status: InternalLinkOpportunityStatus;
  category: "Internal linking";
  opportunityType?: "contextual" | "related";
  recommendationType?:
    | "related service"
    | "supporting information"
    | "next-step page"
    | "nearby topic"
    | "location/service related page";
  otherPossibleMatches?: Array<{
    targetUrl: string;
    targetTitle: string;
    suggestedAnchor: string | null;
    confidence: InternalLinkConfidence;
    confidenceScore: number;
  }>;
}

export interface InternalLinkDebugEntry {
  sourceUrl: string;
  sourceTitle: string;
  sourcePrimaryTopic: string;
  extractedTopicTerms: string[];
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
    candidateAnchorPhrases: Array<{
      anchor: string;
      matchType: "exact" | "close" | "fallback";
      sectionLabel: string;
      sourceBlockType: SiteContentContext["blockType"];
      score: number;
      confidence: InternalLinkConfidence;
      reason: string;
    }>;
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
  diagnostics?: {
    pagesInput: number;
    pagesWithUsableContent: number;
    internalLinksExtracted: number;
    candidateSourcePages: number;
    candidateDestinationPages: number;
    contextsEvaluated: number;
    pairEvaluations: number;
    rawBodyAnchorMatchesFound: number;
    rawAcceptedCandidates: number;
    droppedByFilter: {
      contentLength: number;
      samePage: number;
      alreadyLinked: number;
      canonicalTarget: number;
      samePrimaryTopic: number;
      notIndexable: number;
      anchorMatchOrSimilarity: number;
      fallbackAnchor: number;
      shortAnchor: number;
      lowScore: number;
    };
    duplicateCandidatesRemoved: number;
    removedByPerSourceCap: number;
    removedByGlobalCap: number;
    relatedCandidatesGenerated: number;
    relatedSelected: number;
    finalOpportunities: number;
  };
}
