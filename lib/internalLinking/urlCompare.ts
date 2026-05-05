const TRACKING_QUERY_PARAM_NAMES = new Set([
  "fbclid",
  "gclid",
  "gbraid",
  "wbraid",
  "msclkid",
  "mc_cid",
  "mc_eid",
  "_ga",
  "_gl",
  "igshid",
]);

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function normalizePathname(pathname: string): string {
  const decodedPath = pathname
    .split("/")
    .map((segment) => safeDecode(segment))
    .join("/");

  let compacted = decodedPath.replace(/\/{2,}/g, "/").toLowerCase();

  // Treat index documents as the same page as their parent URL.
  compacted = compacted.replace(/\/index\.html?$/i, "/");

  return compacted.replace(/\/+$/, "") || "/";
}

function shouldDropTrackingParam(name: string): boolean {
  const normalized = safeDecode(name).trim().toLowerCase();
  if (!normalized) {
    return true;
  }

  return (
    normalized.startsWith("utm_") ||
    normalized.endsWith("clid") ||
    TRACKING_QUERY_PARAM_NAMES.has(normalized)
  );
}

function normalizeQuery(searchParams: URLSearchParams): string {
  const kept: Array<[string, string]> = [];

  for (const [rawName, rawValue] of searchParams.entries()) {
    const name = safeDecode(rawName).trim().toLowerCase();

    if (shouldDropTrackingParam(name)) {
      continue;
    }

    kept.push([name, safeDecode(rawValue).trim()]);
  }

  kept.sort((a, b) => a[0].localeCompare(b[0]) || a[1].localeCompare(b[1]));

  if (kept.length === 0) {
    return "";
  }

  return kept.map(([name, value]) => `${encodeURIComponent(name)}=${encodeURIComponent(value)}`).join("&");
}

export function normalizeComparableHost(host: string): string {
  return safeDecode(host).trim().replace(/^www\./i, "").toLowerCase();
}

export function resolveUrlAgainstPage(url: string, pageUrl: string): string | null {
  try {
    return new URL(url, pageUrl).toString();
  } catch {
    return null;
  }
}

interface NormalizeUrlForCompareOptions {
  keepQueryParams?: boolean;
}

export function normalizeUrlForCompare(
  url: string,
  pageUrl?: string,
  options: NormalizeUrlForCompareOptions = {},
): string | null {
  const raw = url.trim();

  if (!raw) {
    return null;
  }

  let parsed: URL;

  try {
    parsed = pageUrl ? new URL(raw, pageUrl) : new URL(raw);
  } catch {
    return null;
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    return null;
  }

  const host = normalizeComparableHost(parsed.hostname);
  const hasDefaultPort =
    (parsed.protocol === "http:" && parsed.port === "80") ||
    (parsed.protocol === "https:" && parsed.port === "443");
  const port = parsed.port && !hasDefaultPort ? `:${parsed.port}` : "";
  const pathname = normalizePathname(parsed.pathname);
  const normalizedQuery = options.keepQueryParams
    ? normalizeQuery(parsed.searchParams)
    : "";

  return `${host}${port}${pathname}${normalizedQuery ? `?${normalizedQuery}` : ""}`;
}

export function areEquivalentPageUrls(left: string, right: string): boolean {
  const leftNormalized = normalizeUrlForCompare(left);
  const rightNormalized = normalizeUrlForCompare(right);

  if (!leftNormalized || !rightNormalized) {
    return false;
  }

  return leftNormalized === rightNormalized;
}

export function normalizeAnchorTextForCompare(value: string): string {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
}
