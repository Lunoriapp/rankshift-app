import type { AiFixOutput } from "./ai";
import type { CrawlResult } from "./crawler";
import type { ScoreBreakdown } from "./scorer";

export type FixSeverity = "critical" | "high" | "medium";

export interface AuditFix {
  id: string;
  severity: FixSeverity;
  pillar:
    | "meta"
    | "headings"
    | "images"
    | "performance"
    | "schema"
    | "internalLinking"
    | "aiVisibility";
  title: string;
  issue: string;
  whyItMatters: string;
  action: string;
}

export interface OptimisationStep {
  id: string;
  title: string;
  description: string;
  deliverable: string;
  fixIds: string[];
}

export interface AuditPlan {
  steps: OptimisationStep[];
}

function pushFix(target: AuditFix[], fix: AuditFix) {
  if (!target.find((item) => item.id === fix.id)) {
    target.push(fix);
  }
}

export function buildAuditFixes(
  crawl: CrawlResult,
  score: ScoreBreakdown,
  aiOutput: AiFixOutput,
): AuditFix[] {
  const fixes: AuditFix[] = [];
  const titleLength = crawl.title.trim().length;
  const descriptionLength = crawl.description.trim().length;
  const h1Count = crawl.headings.filter((heading) => heading.level === 1).length;
  const totalHeadings = crawl.headings.length;
  const missingAltCount = crawl.images.filter((image) => image.alt.trim().length === 0).length;

  if (score.pillars.meta.checks[0] && !score.pillars.meta.checks[0].passed) {
    pushFix(fixes, {
      id: "meta-title",
      severity: "critical",
      pillar: "meta",
      title: "Rewrite the title tag for stronger relevance",
      issue: `The current title is ${titleLength} characters long, which falls outside the ideal 10-60 character range.`,
      whyItMatters:
        "Title tags are one of the clearest ranking and click-through signals. Weak length or unclear wording can reduce both relevance and snippet quality.",
      action: `Replace the existing title with "${aiOutput.rewrites.title}" or a close variant that keeps the primary topic intact and stays within the target range.`,
    });
  }

  if (score.pillars.meta.checks[1] && !score.pillars.meta.checks[1].passed) {
    pushFix(fixes, {
      id: "meta-description",
      severity: "critical",
      pillar: "meta",
      title: "Tighten the meta description to win more clicks",
      issue: `The current meta description is ${descriptionLength} characters long, so it is likely too thin, too long, or commercially unclear.`,
      whyItMatters:
        "Meta descriptions do not directly change rank, but they strongly influence click-through rate. Better snippets turn visibility into traffic.",
      action: `Use "${aiOutput.rewrites.description}" as the new starting point and keep the final version between 50 and 160 characters.`,
    });
  }

  if (h1Count !== 1) {
    pushFix(fixes, {
      id: "single-h1",
      severity: "critical",
      pillar: "headings",
      title: "Use one clear primary H1",
      issue: `This page currently exposes ${h1Count} H1 headings instead of a single main page heading.`,
      whyItMatters:
        "Multiple or missing H1s dilute the page topic and make it harder for search engines to understand what should rank.",
      action: `Keep one page-defining H1 and use "${aiOutput.rewrites.h1}" as the preferred primary heading if it matches the live content.`,
    });
  }

  if (totalHeadings < 3) {
    pushFix(fixes, {
      id: "heading-depth",
      severity: "high",
      pillar: "headings",
      title: "Add stronger H2 and H3 structure",
      issue: `Only ${totalHeadings} headings were detected, which suggests the page may be under-structured.`,
      whyItMatters:
        "Supporting headings help search engines map subtopics and make the page easier to scan, which supports engagement and semantic depth.",
      action:
        "Expand the page with meaningful H2 and H3 sections around services, benefits, FAQs, proof points, or next-step content.",
    });
  }

  if (missingAltCount > 0) {
    pushFix(fixes, {
      id: "image-alt",
      severity: "high",
      pillar: "images",
      title: "Add descriptive alt text to missing images",
      issue: `${missingAltCount} image${missingAltCount === 1 ? "" : "s"} are missing alt text.`,
      whyItMatters:
        "Missing alt text weakens accessibility and removes image-level relevance signals that can support topical SEO and image search visibility.",
      action:
        "Add descriptive alt text that reflects the actual image content. Include target phrases only where they fit naturally and accurately.",
    });
  }

  if (score.pillars.performance.score < 20) {
    pushFix(fixes, {
      id: "page-speed",
      severity: score.pillars.performance.score <= 5 ? "high" : "medium",
      pillar: "performance",
      title: "Reduce load friction before users reach the page content",
      issue: `The measured load time is ${crawl.loadTimeMs}ms, which leaves performance headroom.`,
      whyItMatters:
        "Slower pages reduce conversion confidence, increase bounce risk, and can limit how efficiently search engines process the page.",
      action:
        "Compress large assets, reduce third-party script weight, and review anything blocking the initial content render.",
    });
  }

  if (!crawl.hasJsonLd) {
    pushFix(fixes, {
      id: "schema-jsonld",
      severity: "high",
      pillar: "schema",
      title: "Add JSON-LD schema to clarify page context",
      issue: "No JSON-LD schema markup was detected on the page.",
      whyItMatters:
        "Structured data strengthens machine-readable context and can improve eligibility for richer search result presentation.",
      action:
        "Add schema that matches the page type and content, such as Organisation, LocalBusiness, Service, Article, or FAQ where appropriate.",
    });
  }

  if (!crawl.canonical) {
    pushFix(fixes, {
      id: "canonical-tag",
      severity: "medium",
      pillar: "meta",
      title: "Add a canonical tag to protect page preference",
      issue: "No canonical URL was detected in the page head.",
      whyItMatters:
        "Canonical tags help search engines understand which URL should be treated as the preferred version when similar variants exist.",
      action:
        "Add a self-referencing canonical tag unless this page intentionally points to a different preferred version.",
    });
  }

  if (crawl.internalLinkCount < 5) {
    pushFix(fixes, {
      id: "internal-links",
      severity: "medium",
      pillar: "internalLinking",
      title: "Add stronger contextual internal links",
      issue: `Only ${crawl.internalLinkCount} internal link${crawl.internalLinkCount === 1 ? "" : "s"} were detected on the page.`,
      whyItMatters:
        "Weak internal linking reduces topical relevance, limits authority flow, and makes it harder for users to reach the most important pages.",
      action:
        "Add 2-3 contextual internal links to the most relevant service, category, or proof pages using descriptive anchor text that fits naturally in the copy.",
    });
  }

  const aiVisibilityChecks = score.pillars.aiVisibility?.checks ?? [];
  const summaryCheck = aiVisibilityChecks.find((check) =>
    check.label.toLowerCase().includes("summary answer near top"),
  );
  const faqCheck = aiVisibilityChecks.find((check) =>
    check.label.toLowerCase().includes("faq-style"),
  );
  const authorCheck = aiVisibilityChecks.find((check) =>
    check.label.toLowerCase().includes("author and credibility"),
  );
  const entityCheck = aiVisibilityChecks.find((check) =>
    check.label.toLowerCase().includes("entity clarity"),
  );
  const schemaVisibilityCheck = aiVisibilityChecks.find((check) =>
    check.label.toLowerCase().includes("basic schema signals"),
  );
  const internalTopicCheck = aiVisibilityChecks.find((check) =>
    check.label.toLowerCase().includes("internal links support"),
  );

  if (summaryCheck && !summaryCheck.passed) {
    pushFix(fixes, {
      id: "ai-summary-answer",
      severity: "high",
      pillar: "aiVisibility",
      title: "Add a clear summary answer near the top",
      issue: "The page does not show a concise answer-style summary in the opening section.",
      whyItMatters:
        "AI systems often extract short, direct answers first. Without one, your page is less likely to be chosen in AI summaries.",
      action:
        "Add a 50-120 word summary near the top that directly answers the main question and includes the primary topic phrase.",
    });
  }

  if (faqCheck && !faqCheck.passed) {
    pushFix(fixes, {
      id: "ai-faq-section",
      severity: "medium",
      pillar: "aiVisibility",
      title: "Add an FAQ section with direct Q&A format",
      issue: "FAQ-style question-and-answer content is missing or too weak.",
      whyItMatters:
        "Q&A content helps AI systems understand user intent and can improve visibility in AI-generated summaries.",
      action:
        "Add 3-5 FAQ questions with short direct answers that match how users ask the topic.",
    });
  }

  if (authorCheck && !authorCheck.passed) {
    pushFix(fixes, {
      id: "ai-author-credibility",
      severity: "medium",
      pillar: "aiVisibility",
      title: "Add author and expertise details",
      issue: "The page does not clearly show who wrote or reviewed the content and why they are credible.",
      whyItMatters:
        "AI systems and users both rely on trust signals. Clear authorship can improve confidence and citation potential.",
      action:
        "Add author name, role, and short expertise line near the top or end of the page.",
    });
  }

  if (entityCheck && !entityCheck.passed) {
    pushFix(fixes, {
      id: "ai-entity-clarity",
      severity: "medium",
      pillar: "aiVisibility",
      title: "Improve entity clarity in the copy",
      issue: "Who the page is for, what it offers, and where it applies are not explicit enough.",
      whyItMatters:
        "AI systems perform better when pages clearly state key entities and context.",
      action:
        "Add one short section that clearly states who you help, what the service/content is, and where it applies.",
    });
  }

  if (internalTopicCheck && !internalTopicCheck.passed) {
    pushFix(fixes, {
      id: "ai-topic-internal-links",
      severity: "medium",
      pillar: "aiVisibility",
      title: "Add internal links that reinforce topic relationships",
      issue: "Internal links are not strongly supporting related topic pages.",
      whyItMatters:
        "Connected topical pages help AI systems understand authority and context across your site.",
      action:
        "Add links from this page to closely related pages using natural anchor phrases already present in the content.",
    });
  }

  if (schemaVisibilityCheck && !schemaVisibilityCheck.passed) {
    pushFix(fixes, {
      id: "ai-schema-signals",
      severity: "medium",
      pillar: "aiVisibility",
      title: "Add basic schema types for AI visibility",
      issue: "Relevant schema signals are missing or not detectable.",
      whyItMatters:
        "Schema gives AI systems clearer machine-readable context for page type and content.",
      action:
        "Add JSON-LD schema using the best fit for this page, such as FAQ, Article, or Organization.",
    });
  }

  if (fixes.length === 0) {
    pushFix(fixes, {
      id: "maintain-gains",
      severity: "medium",
      pillar: "internalLinking",
      title: "Maintain momentum with periodic refreshes",
      issue: "The page currently shows a strong SEO baseline with no urgent blockers detected.",
      whyItMatters:
        "Strong pages still need monitoring. Competitors, SERPs, and user expectations continue to move over time.",
      action:
        "Track score changes over time, refresh proof points, and review internal linking as the rest of the site evolves.",
    });
  }

  return fixes;
}

export function buildOptimisationPlan(fixes: AuditFix[], aiOutput: AiFixOutput): AuditPlan {
  const steps: OptimisationStep[] = [];
  const metadataFixIds = fixes
    .filter((fix) => fix.pillar === "meta")
    .map((fix) => fix.id);
  const headingFixIds = fixes
    .filter((fix) => fix.pillar === "headings")
    .map((fix) => fix.id);
  const imageFixIds = fixes
    .filter((fix) => fix.pillar === "images")
    .map((fix) => fix.id);
  const structuralFixIds = fixes
    .filter(
      (fix) =>
        fix.pillar === "schema" ||
        fix.pillar === "performance" ||
        (fix.pillar === "internalLinking" && fix.id !== "internal-links"),
    )
    .map((fix) => fix.id);
  const internalLinkingFixIds = fixes
    .filter((fix) => fix.pillar === "internalLinking")
    .map((fix) => fix.id);

  if (headingFixIds.length > 0) {
    steps.push({
      id: "step-headings",
      title: "Fix heading structure",
      description:
        "Make the page easier to interpret by locking in one clear H1 and giving the rest of the content stronger section hierarchy.",
      deliverable: `Primary H1 ready to use: "${aiOutput.rewrites.h1}"`,
      fixIds: headingFixIds,
    });
  }

  if (imageFixIds.length > 0) {
    steps.push({
      id: "step-images",
      title: "Fix image accessibility and relevance signals",
      description:
        "Bring image metadata up to standard so the page is more accessible and visually relevant in search.",
      deliverable: "All key images should carry descriptive, accurate alt text.",
      fixIds: imageFixIds,
    });
  }

  if (metadataFixIds.length > 0) {
    steps.push({
      id: "step-metadata",
      title: "Apply rewritten metadata",
      description:
        "Refresh the page title and meta description so the SERP listing reflects clearer intent and stronger commercial promise.",
      deliverable: `Updated title and description ready for implementation: "${aiOutput.rewrites.title}"`,
      fixIds: metadataFixIds,
    });
  }

  if (structuralFixIds.length > 0) {
    steps.push({
      id: "step-technical",
      title: "Strengthen technical support signals",
      description:
        "Close the remaining technical gaps around speed, schema, canonical handling, and internal linking.",
      deliverable: "The page should be easier to crawl, understand, and support through the wider site architecture.",
      fixIds: structuralFixIds,
    });
  }

  if (internalLinkingFixIds.length > 0) {
    steps.push({
      id: "step-internal-linking",
      title: "Strengthen internal linking support",
      description:
        "Improve how this page is supported by the wider site by adding stronger contextual links and closing the clearest internal linking gaps.",
      deliverable:
        "Internal linking is distributing authority more clearly and the most important related pages are connected with stronger context.",
      fixIds: internalLinkingFixIds,
    });
  }

  if (steps.length === 0) {
    steps.push({
      id: "step-maintain",
      title: "Maintain and monitor",
      description:
        "No major blockers were detected, so the next move is to protect current performance and track score movement over time.",
      deliverable: "Re-run the audit after content or technical updates to verify gains are holding.",
      fixIds: fixes.map((fix) => fix.id),
    });
  }

  return { steps };
}
