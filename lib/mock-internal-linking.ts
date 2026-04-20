import type { InternalLinkOpportunity } from "@/lib/internalLinking/types";

export const mockInternalLinkingOpportunities: InternalLinkOpportunity[] = [
  {
    id: "internal-link-home-services",
    sourceUrl: "https://northstarcontent.com/blog/content-strategy-framework",
    sourceTitle: "Content Strategy Framework",
    targetUrl: "https://northstarcontent.com/services/content-strategy",
    targetTitle: "Content Strategy Services",
    suggestedAnchor: "content strategy services",
    matchedSnippet:
      "A strong content strategy helps teams align publishing with business goals, audience intent, and measurable growth opportunities.",
    placementHint:
      'Add the link in the opening body copy where "content strategy services" is already being discussed.',
    reason:
      "The source article introduces the same topic as the target service page, but it does not currently guide readers into the commercial destination.",
    confidence: "High",
    confidenceScore: 88,
    status: "open",
    category: "Internal linking",
  },
  {
    id: "internal-link-schema-guide",
    sourceUrl: "https://northstarcontent.com/blog/technical-seo-checklist",
    sourceTitle: "Technical SEO Checklist",
    targetUrl: "https://northstarcontent.com/blog/schema-markup-guide",
    targetTitle: "Schema Markup Guide",
    suggestedAnchor: "schema markup guide",
    matchedSnippet:
      "Structured data can make core page meaning easier for search engines to interpret when the markup is valid and well maintained.",
    placementHint:
      'Add the link in the paragraph under "Technical foundations" where "schema markup guide" is mentioned naturally.',
    reason:
      "Readers on the source page are already in a technical SEO context, so linking to the deeper schema resource creates a stronger learning path.",
    confidence: "Medium",
    confidenceScore: 73,
    status: "open",
    category: "Internal linking",
  },
  {
    id: "internal-link-audit-page",
    sourceUrl: "https://northstarcontent.com/blog/internal-linking-best-practices",
    sourceTitle: "Internal Linking Best Practices",
    targetUrl: "https://northstarcontent.com/services/seo-audit",
    targetTitle: "SEO Audit Services",
    suggestedAnchor: "SEO audit services",
    matchedSnippet:
      "Teams usually uncover internal link gaps during a full audit, especially when important pages are buried or under-supported.",
    placementHint:
      'Add the link in the paragraph under "How teams find link gaps" where "SEO audit services" fits as the next action.',
    reason:
      "The source post already explains the problem space that the service page solves, making this a natural conversion-supporting internal link.",
    confidence: "High",
    confidenceScore: 85,
    status: "completed",
    category: "Internal linking",
  },
];
