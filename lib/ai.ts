import type { CrawlResult } from "./crawler";
import type { ScoreBreakdown } from "./scorer";

export interface AiFixOutput {
  fixes: {
    critical: string[];
    high: string[];
    medium: string[];
  };
  rewrites: {
    title: string;
    description: string;
    h1: string;
  };
}

interface OpenAIChoice {
  message?: {
    content?: string | null;
  };
}

interface OpenAIResponse {
  choices?: OpenAIChoice[];
}

function clampText(value: string, maxLength: number): string {
  return value.trim().slice(0, maxLength);
}

function firstH1(crawl: CrawlResult): string {
  return crawl.headings.find((heading) => heading.level === 1)?.text.trim() ?? "";
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function splitCandidates(value: string): string[] {
  return value
    .split(/[|:-]/)
    .map((part) => normalizeWhitespace(part))
    .filter((part) => part.length > 0);
}

function dedupeWords(value: string): string {
  const words = normalizeWhitespace(value).split(" ");
  const seen = new Set<string>();
  const deduped: string[] = [];

  for (const word of words) {
    const key = word.toLowerCase();

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    deduped.push(word);
  }

  return deduped.join(" ");
}

function findPrimaryTopic(crawl: CrawlResult): string {
  const candidates = [
    ...splitCandidates(firstH1(crawl)),
    ...splitCandidates(crawl.title),
    ...splitCandidates(crawl.description),
  ];

  const filtered = candidates.find((candidate) => {
    const lower = candidate.toLowerCase();

    return (
      candidate.length >= 12 &&
      !lower.includes("seo-optimized") &&
      !lower.includes("discover the main offering")
    );
  });

  return dedupeWords(
    filtered ??
      firstH1(crawl) ??
      crawl.title.trim() ??
      new URL(crawl.url).hostname.replace(/^www\./, ""),
  );
}

function findBrandName(crawl: CrawlResult): string {
  const titleParts = splitCandidates(crawl.title);
  const h1Parts = splitCandidates(firstH1(crawl));
  const candidates = [...titleParts.reverse(), ...h1Parts.reverse()];

  const brand = candidates.find((candidate) => candidate.length >= 3 && candidate.length <= 30);

  return brand ?? new URL(crawl.url).hostname.replace(/^www\./, "");
}

function toTitleCase(value: string): string {
  return value
    .split(" ")
    .map((word) => {
      if (word.length <= 2 || word === word.toUpperCase()) {
        return word;
      }

      return `${word.charAt(0).toUpperCase()}${word.slice(1).toLowerCase()}`;
    })
    .join(" ");
}

function normalizeSeparators(value: string): string {
  return normalizeWhitespace(value.replace(/\s*[|:-]\s*/g, " | "));
}

function buildTitle(primaryTopic: string, brandName: string): string {
  const base = normalizeWhitespace(primaryTopic);
  const brand = normalizeWhitespace(brandName);

  if (base.toLowerCase().includes(brand.toLowerCase())) {
    return clampText(base, 60);
  }

  const combined = `${base} | ${brand}`;
  if (combined.length <= 60) {
    return combined;
  }

  return clampText(base, 60);
}

function buildDescription(crawl: CrawlResult, primaryTopic: string, brandName: string): string {
  const existing = normalizeWhitespace(crawl.description);

  if (existing.length >= 50 && existing.length <= 160) {
    return existing;
  }

  const sentences = [
    `${primaryTopic} from ${brandName}.`,
    "Clear service positioning, stronger relevance, and a more search-friendly summary for this page.",
  ];

  return clampText(sentences.join(" "), 160);
}

function buildH1(primaryTopic: string, brandName: string): string {
  const topic = normalizeWhitespace(primaryTopic);
  const brand = normalizeWhitespace(brandName);

  if (topic.toLowerCase().includes(brand.toLowerCase())) {
    return clampText(topic, 80);
  }

  const combined = `${topic} at ${brand}`;
  return clampText(combined, 80);
}

function rewriteTitle(crawl: CrawlResult, primaryTopic: string, brandName: string): string {
  const existing = normalizeSeparators(crawl.title);

  if (existing.length >= 10 && existing.length <= 60) {
    return existing;
  }

  const currentH1 = firstH1(crawl);

  if (existing.length > 60) {
    const titleParts = splitCandidates(crawl.title);
    const keywordRichPart = titleParts.find((part) => part.split(" ").length >= 3);

    if (keywordRichPart) {
      return buildTitle(keywordRichPart, brandName);
    }
  }

  return buildTitle(currentH1 || primaryTopic, brandName);
}

function rewriteDescription(crawl: CrawlResult, primaryTopic: string, brandName: string): string {
  const existing = normalizeWhitespace(crawl.description);

  if (existing.length >= 50 && existing.length <= 160) {
    return existing;
  }

  return buildDescription(crawl, primaryTopic, brandName);
}

function rewriteH1(crawl: CrawlResult, primaryTopic: string, brandName: string): string {
  const existing = normalizeWhitespace(firstH1(crawl));

  if (existing.length > 0 && existing.length <= 80) {
    return existing;
  }

  const candidate = primaryTopic || crawl.title.trim();
  return buildH1(toTitleCase(candidate), brandName);
}

function buildLocalFixes(crawl: CrawlResult, score: ScoreBreakdown): AiFixOutput {
  const critical: string[] = [];
  const high: string[] = [];
  const medium: string[] = [];
  const currentH1 = firstH1(crawl);
  const headingCount = crawl.headings.length;
  const h1Count = crawl.headings.filter((heading) => heading.level === 1).length;
  const imagesWithMissingAlt = crawl.images.filter((image) => image.alt.trim().length === 0)
    .length;
  const primaryTopic = findPrimaryTopic(crawl);
  const brandName = findBrandName(crawl);

  if (crawl.title.trim().length < 10 || crawl.title.trim().length > 60) {
    critical.push("Rewrite the title tag to stay between 10 and 60 characters and lead with the primary page topic.");
  }

  if (
    crawl.description.trim().length < 50 ||
    crawl.description.trim().length > 160
  ) {
    critical.push("Rewrite the meta description to stay between 50 and 160 characters with a clear value proposition.");
  }

  if (h1Count !== 1) {
    critical.push("Use exactly one H1 so the page has a single primary heading.");
  }

  if (!crawl.hasJsonLd) {
    high.push("Add JSON-LD schema markup that matches the page content to strengthen search understanding.");
  }

  if (headingCount < 3) {
    high.push("Expand the heading structure with supporting H2 and H3 sections so the content is easier to scan.");
  }

  if (imagesWithMissingAlt > 0) {
    high.push(`Add descriptive alt text to ${imagesWithMissingAlt} image${imagesWithMissingAlt === 1 ? "" : "s"} to improve accessibility and image relevance.`);
  }

  if (crawl.loadTimeMs >= 4_000) {
    high.push("Improve load performance by compressing heavy assets and reducing render-blocking resources.");
  } else if (crawl.loadTimeMs >= 2_000) {
    medium.push("Trim page weight and review third-party scripts to bring load time below two seconds.");
  }

  if (!crawl.canonical) {
    medium.push("Add a canonical tag to clarify the preferred version of this page.");
  }

  if (!crawl.robots) {
    medium.push("Add a robots meta tag only if you need explicit crawl or index directives.");
  }

  if (crawl.internalLinkCount < 3) {
    medium.push("Add more relevant internal links to connect this page with nearby topic and service pages.");
  }

  if (score.total >= 80 && critical.length === 0 && high.length === 0) {
    medium.push("The page is in good shape overall; focus on incremental content and internal linking improvements.");
  }

  const rewrittenTitle = rewriteTitle(crawl, primaryTopic, brandName);
  const rewrittenDescription = rewriteDescription(crawl, primaryTopic, brandName);
  const rewrittenH1 = rewriteH1(crawl, primaryTopic, brandName);

  return {
    fixes: {
      critical,
      high,
      medium,
    },
    rewrites: {
      title: rewrittenTitle,
      description: rewrittenDescription,
      h1: rewrittenH1,
    },
  };
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isAiFixOutput(value: unknown): value is AiFixOutput {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Record<string, unknown>;
  const fixes = record.fixes as Record<string, unknown> | undefined;
  const rewrites = record.rewrites as Record<string, unknown> | undefined;

  return Boolean(
    fixes &&
      rewrites &&
      isStringArray(fixes.critical) &&
      isStringArray(fixes.high) &&
      isStringArray(fixes.medium) &&
      typeof rewrites.title === "string" &&
      typeof rewrites.description === "string" &&
      typeof rewrites.h1 === "string",
  );
}

export async function generateFixes(
  crawl: CrawlResult,
  score: ScoreBreakdown,
): Promise<AiFixOutput> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return buildLocalFixes(crawl, score);
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
        response_format: {
          type: "json_object",
        },
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content:
              "You are an SEO audit assistant. Return only valid JSON matching the requested shape. Do not include markdown or commentary.",
          },
          {
            role: "user",
            content: JSON.stringify({
              instruction:
                "Analyze this SEO audit payload and return prioritized fixes plus rewritten title, meta description, and H1. Use the exact JSON shape requested.",
              required_shape: {
                fixes: {
                  critical: ["string"],
                  high: ["string"],
                  medium: ["string"],
                },
                rewrites: {
                  title: "string",
                  description: "string",
                  h1: "string",
                },
              },
              crawl,
              score,
            }),
          },
        ],
      }),
    });

    if (!response.ok) {
      return buildLocalFixes(crawl, score);
    }

    const payload = (await response.json()) as OpenAIResponse;
    const content = payload.choices?.[0]?.message?.content;

    if (!content) {
      return buildLocalFixes(crawl, score);
    }

    const parsed: unknown = JSON.parse(content);

    if (!isAiFixOutput(parsed)) {
      return buildLocalFixes(crawl, score);
    }

    return parsed;
  } catch {
    return buildLocalFixes(crawl, score);
  }
}
