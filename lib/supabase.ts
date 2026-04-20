import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";

import type { AiFixOutput } from "./ai";
import type { AuditFix, FixSeverity } from "./audit-fixes";
import type { CrawlResult } from "./crawler";
import type { ScoreBreakdown } from "./scorer";

export interface AuditRecord {
  id: number;
  user_id: string | null;
  url: string;
  url_key: string;
  crawl: CrawlResult;
  score: ScoreBreakdown;
  ai_output: AiFixOutput;
  fixes: AuditFix[];
  created_at: string;
}

export interface AuditFixStateRecord {
  audit_id: number;
  fix_id: string;
  severity: FixSeverity;
  completed: boolean;
  completed_at: string | null;
}

export interface SavedReportSummary {
  id: number;
  url: string;
  created_at: string;
  total: number;
  opportunityScore: number | null;
  projectedScore: number | null;
  changeFromPrevious: number | null;
  completedFixCount: number;
  totalFixCount: number;
}

export interface AuditHistoryEntry {
  id: number;
  url: string;
  created_at: string;
  score: number;
  previousScore: number | null;
  scoreDelta: number | null;
  issueCount: number;
  previousIssueCount: number | null;
  issueCountDelta: number | null;
  internalLinkOpportunityCount: number;
  previousInternalLinkOpportunityCount: number | null;
  internalLinkOpportunityDelta: number | null;
}

interface CreateAuditInput {
  userId: string | null;
  url: string;
  crawl: CrawlResult;
  score: ScoreBreakdown;
  aiOutput: AiFixOutput;
  fixes: AuditFix[];
}

let cachedClient: SupabaseClient | null = null;

function normalizeStoredScore(total: number, maxScore: number | undefined): number {
  if (!maxScore || maxScore === 100) {
    return total;
  }

  return Math.max(0, Math.min(100, Math.round((total / maxScore) * 100)));
}

function normalizeScoreBreakdown(score: ScoreBreakdown): ScoreBreakdown {
  const normalizedTotal = normalizeStoredScore(score.total, score.maxScore);

  return {
    ...score,
    total: normalizedTotal,
    maxScore: 100,
    opportunity: score.opportunity
      ? {
          ...score.opportunity,
          score: Math.max(0, Math.min(100, score.opportunity.score)),
          projectedScore: Math.max(0, Math.min(100, score.opportunity.projectedScore)),
        }
      : undefined,
  };
}

export function normalizeUrlKey(url: string): string {
  const parsed = new URL(url);
  const pathname = parsed.pathname.replace(/\/+$/, "") || "/";
  return `${parsed.hostname.toLowerCase()}${pathname}`;
}

export function getSupabaseServerClient(): SupabaseClient {
  if (cachedClient) {
    return cachedClient;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase environment variables are not configured.");
  }

  cachedClient = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return cachedClient;
}

export async function getUserFromAccessToken(token: string): Promise<User | null> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser(token);

  if (error) {
    throw new Error(error.message);
  }

  return data.user ?? null;
}

export async function createAuditRecord(input: CreateAuditInput): Promise<number> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("audits")
    .insert({
      user_id: input.userId,
      url: input.url,
      url_key: normalizeUrlKey(input.url),
      crawl: input.crawl,
      score: input.score,
      ai_output: input.aiOutput,
      fixes: input.fixes,
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to store audit.");
  }

  return data.id as number;
}

export async function getAuditRecordById(id: string): Promise<AuditRecord | null> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("audits")
    .select("id, user_id, url, url_key, crawl, score, ai_output, fixes, created_at")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  const audit = data as AuditRecord;
  return {
    ...audit,
    score: normalizeScoreBreakdown(audit.score),
  };
}

export async function listSavedReportsByUser(userId: string): Promise<SavedReportSummary[]> {
  const supabase = getSupabaseServerClient();
  const [{ data, error }, { data: fixStateData, error: fixStateError }] = await Promise.all([
    supabase
      .from("audits")
      .select("id, url, url_key, score, fixes, crawl, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    supabase
      .from("audit_fix_states")
      .select("audit_id, fix_id, completed")
      .eq("user_id", userId),
  ]);

  if (error) {
    throw new Error(error.message);
  }

  if (fixStateError) {
    throw new Error(fixStateError.message);
  }

  const rows = (data ?? []) as Array<{
    id: number;
    url: string;
    url_key: string;
    score: ScoreBreakdown;
    fixes: AuditFix[] | null;
    crawl: CrawlResult;
    created_at: string;
  }>;
  const fixStates = (fixStateData ?? []) as Array<{
    audit_id: number;
    fix_id: string;
    completed: boolean;
  }>;

  return rows.map((row, index) => {
    const previousForSameUrl = rows
      .slice(index + 1)
      .find((candidate) => candidate.url_key === row.url_key);
    const totalFixCount =
      (row.fixes?.length ?? 0) + (row.crawl.internalLinking?.opportunities.length ?? 0);
    const completedFixCount = fixStates.filter(
      (state) => state.audit_id === row.id && state.completed,
    ).length;

    return {
      id: row.id,
      url: row.url,
      created_at: row.created_at,
      total: normalizeStoredScore(row.score.total, row.score.maxScore),
      opportunityScore: row.score.opportunity?.score ?? null,
      projectedScore: row.score.opportunity?.projectedScore ?? null,
      changeFromPrevious: previousForSameUrl
        ? normalizeStoredScore(row.score.total, row.score.maxScore) -
          normalizeStoredScore(previousForSameUrl.score.total, previousForSameUrl.score.maxScore)
        : null,
      completedFixCount,
      totalFixCount,
    };
  });
}

export async function listAuditHistoryByUrl(userId: string, urlKey: string): Promise<AuditHistoryEntry[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("audits")
    .select("id, url, created_at, score, fixes, crawl")
    .eq("user_id", userId)
    .eq("url_key", urlKey)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as Array<{
    id: number;
    url: string;
    created_at: string;
    score: ScoreBreakdown;
    fixes: AuditFix[] | null;
    crawl: CrawlResult;
  }>;

  return rows.map((row, index) => ({
    id: row.id,
    url: row.url,
    created_at: row.created_at,
    score: normalizeStoredScore(row.score.total, row.score.maxScore),
    previousScore: rows[index + 1]
      ? normalizeStoredScore(rows[index + 1].score.total, rows[index + 1].score.maxScore)
      : null,
    scoreDelta: rows[index + 1]
      ? normalizeStoredScore(row.score.total, row.score.maxScore) -
        normalizeStoredScore(rows[index + 1].score.total, rows[index + 1].score.maxScore)
      : null,
    issueCount: row.fixes?.length ?? 0,
    previousIssueCount: rows[index + 1]
      ? (rows[index + 1].fixes?.length ?? 0)
      : null,
    issueCountDelta: rows[index + 1]
      ? (row.fixes?.length ?? 0) - (rows[index + 1].fixes?.length ?? 0)
      : null,
    internalLinkOpportunityCount: row.crawl.internalLinking?.opportunities.length ?? 0,
    previousInternalLinkOpportunityCount: rows[index + 1]
      ? (rows[index + 1].crawl.internalLinking?.opportunities.length ?? 0)
      : null,
    internalLinkOpportunityDelta: rows[index + 1]
      ? (row.crawl.internalLinking?.opportunities.length ?? 0) -
        (rows[index + 1].crawl.internalLinking?.opportunities.length ?? 0)
      : null,
  }));
}

export async function listFixStatesByAudit(
  userId: string,
  auditId: number,
): Promise<AuditFixStateRecord[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("audit_fix_states")
    .select("audit_id, fix_id, severity, completed, completed_at")
    .eq("user_id", userId)
    .eq("audit_id", auditId);

  if (error) {
    throw new Error(error.message);
  }

  return (data as AuditFixStateRecord[] | null) ?? [];
}

export async function upsertFixState(input: {
  userId: string;
  auditId: number;
  fixId: string;
  severity: FixSeverity;
  completed: boolean;
}): Promise<AuditFixStateRecord> {
  const supabase = getSupabaseServerClient();
  const payload = {
    user_id: input.userId,
    audit_id: input.auditId,
    fix_id: input.fixId,
    severity: input.severity,
    completed: input.completed,
    completed_at: input.completed ? new Date().toISOString() : null,
  };

  const { data, error } = await supabase
    .from("audit_fix_states")
    .upsert(payload, {
      onConflict: "user_id,audit_id,fix_id",
    })
    .select("audit_id, fix_id, severity, completed, completed_at")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to update fix state.");
  }

  return data as AuditFixStateRecord;
}
