import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";

import type { AiFixOutput } from "./ai";
import type { AuditFix, FixSeverity } from "./audit-fixes";
import type { CompetitorSnapshot } from "./competitor-comparison";
import type { CrawlResult } from "./crawler";
import type { ScoreBreakdown } from "./scorer";
import { getSupabasePublicConfig, getSupabaseServerConfig } from "./supabase-config";

export interface AuditRecord {
  id: string;
  user_id: string | null;
  project_id: string | null;
  url: string;
  url_key: string;
  crawl: CrawlResult;
  score: ScoreBreakdown;
  ai_output: AiFixOutput;
  fixes: AuditFix[];
  score_value: number | null;
  issues_found: number | null;
  title_length: number | null;
  h1_present: boolean | null;
  word_count: number | null;
  internal_links: number | null;
  schema_present: boolean | null;
  created_at: string;
}

export interface AuditFixStateRecord {
  audit_id: string;
  fix_id: string;
  severity: FixSeverity;
  completed: boolean;
  completed_at: string | null;
}

export interface SavedReportSummary {
  id: string;
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
  id: string;
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

export interface CompetitorSnapshotRecord {
  id: string;
  audit_id: string;
  competitor_name: string;
  competitor_url: string | null;
  score: number;
  title_length: number;
  h1_present: boolean;
  word_count: number;
  internal_links: number;
  schema_present: boolean;
  created_at: string;
}

interface ProjectRecord {
  id: string;
  user_id: string | null;
  name: string;
  url: string;
  url_key: string;
  created_at: string;
}

interface CreateAuditInput {
  userId: string;
  accessToken: string;
  url: string;
  crawl: CrawlResult;
  score: ScoreBreakdown;
  aiOutput: AiFixOutput;
  fixes: AuditFix[];
  competitorSnapshots?: CompetitorSnapshot[];
}

let cachedClient: SupabaseClient | null = null;

interface RlsContext {
  action: string;
  table: string;
  userId?: string | null;
}

function logSupabaseFailure(context: RlsContext, error: unknown): void {
  const message = getErrorMessage(error);
  console.error("[supabase]", {
    action: context.action,
    table: context.table,
    userId: context.userId ?? null,
    message,
  });
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  if (error && typeof error === "object") {
    const record = error as Record<string, unknown>;
    if (typeof record.message === "string") {
      return record.message;
    }
  }

  return "";
}

function isMissingTableError(error: unknown, tableName: string): boolean {
  const message = getErrorMessage(error).toLowerCase();
  return (
    message.includes(`could not find the table 'public.${tableName.toLowerCase()}'`) ||
    message.includes(`relation "public.${tableName.toLowerCase()}" does not exist`)
  );
}

function isMissingColumnError(error: unknown, columnName: string, tableName?: string): boolean {
  const message = getErrorMessage(error).toLowerCase();
  const column = columnName.toLowerCase();

  const matched =
    message.includes(`could not find the '${column}' column`) ||
    message.includes(`column "${column}" does not exist`);

  if (!matched) {
    return false;
  }

  if (!tableName) {
    return true;
  }

  const table = tableName.toLowerCase();
  return (
    message.includes(`'${table}'`) ||
    message.includes(`${table}.${column}`) ||
    message.includes(` of "${table}"`)
  );
}

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

function buildProjectName(url: string): string {
  const parsed = new URL(url);
  return parsed.hostname.replace(/^www\./, "");
}

function buildCompetitorSnapshotRows(
  auditId: string,
  snapshots: CompetitorSnapshot[],
): Array<{
  audit_id: string;
  competitor_name: string;
  competitor_url: string | null;
  score: number;
  title_length: number;
  h1_present: boolean;
  word_count: number;
  internal_links: number;
  schema_present: boolean;
}> {
  return snapshots.map((snapshot) => ({
    audit_id: auditId,
    competitor_name: snapshot.name,
    competitor_url: snapshot.url ?? null,
    score: snapshot.score,
    title_length: snapshot.titleLength,
    h1_present: snapshot.h1,
    word_count: snapshot.wordCount,
    internal_links: snapshot.internalLinks,
    schema_present: snapshot.schema,
  }));
}

async function findOrCreateProject(input: {
  userId: string;
  supabase: SupabaseClient;
  url: string;
}): Promise<string | null> {
  const urlKey = normalizeUrlKey(input.url);

  const query = input.supabase
    .from("projects")
    .select("id")
    .eq("url_key", urlKey)
    .eq("user_id", input.userId)
    .limit(1);

  const { data: existing, error: existingError } = await query.maybeSingle();

  if (existingError) {
    logSupabaseFailure(
      { action: "select_or_create_project", table: "projects", userId: input.userId },
      existingError,
    );
    if (isMissingTableError(existingError, "projects")) {
      return null;
    }

    throw new Error(existingError.message);
  }

  if (existing?.id) {
    return existing.id as string;
  }

  const { data, error } = await input.supabase
    .from("projects")
    .insert({
      user_id: input.userId,
      name: buildProjectName(input.url),
      url: input.url,
      url_key: urlKey,
    })
    .select("id")
    .single();

  if (error || !data) {
    logSupabaseFailure(
      { action: "insert_project", table: "projects", userId: input.userId },
      error,
    );
    if (isMissingTableError(error, "projects")) {
      return null;
    }

    throw new Error(error?.message ?? "Failed to create project.");
  }

  return data.id as string;
}

function createAdminServerClient(): SupabaseClient {
  const { url, key } = getSupabaseServerConfig();

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

function createUserScopedServerClient(accessToken: string): SupabaseClient {
  const publicConfig = getSupabasePublicConfig();

  return createClient(publicConfig.url, publicConfig.anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
}

export function getSupabaseServerClient(accessToken?: string): SupabaseClient {
  if (accessToken) {
    return createUserScopedServerClient(accessToken);
  }

  if (cachedClient) {
    return cachedClient;
  }

  cachedClient = createAdminServerClient();

  return cachedClient;
}

export function getSupabaseAdminClient(): SupabaseClient {
  if (cachedClient) {
    return cachedClient;
  }

  cachedClient = createAdminServerClient();
  return cachedClient;
}

export async function getUserFromAccessToken(token: string): Promise<User | null> {
  // Token verification should use anon + bearer token, not service role.
  // This avoids requiring SUPABASE_SERVICE_ROLE_KEY for non-admin auth checks.
  const supabase = createUserScopedServerClient(token);
  const { data, error } = await supabase.auth.getUser(token);

  if (error) {
    throw new Error(error.message);
  }

  return data.user ?? null;
}

export async function createAuditRecord(input: CreateAuditInput): Promise<string> {
  // Audit creation is a server-side write path and must use service role only.
  const supabase = getSupabaseAdminClient();

  const projectId = await findOrCreateProject({
    userId: input.userId,
    supabase,
    url: input.url,
  });
  const savedReportName = `${buildProjectName(input.url)} audit`;
  const legacyInsert = await supabase
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

  let auditId: string | null = legacyInsert.data?.id ? (legacyInsert.data.id as string) : null;

  if (!auditId && legacyInsert.error) {
    if (
      isMissingColumnError(legacyInsert.error, "crawl", "audits") ||
      isMissingColumnError(legacyInsert.error, "score", "audits") ||
      isMissingColumnError(legacyInsert.error, "ai_output", "audits") ||
      isMissingColumnError(legacyInsert.error, "fixes", "audits")
    ) {
      const modernInsert = await supabase
        .from("audits")
        .insert({
          user_id: input.userId,
          project_id: projectId,
          url: input.url,
          url_key: normalizeUrlKey(input.url),
          crawl_data: input.crawl,
          score_breakdown: input.score,
          ai_output_data: input.aiOutput,
          fixes_data: input.fixes,
          issues_found: input.fixes.length,
          title_length: input.crawl.title.trim().length,
          h1_present: input.crawl.h1.trim().length > 0,
          word_count: input.crawl.bodyText.split(/\s+/).filter(Boolean).length,
          internal_links: input.crawl.internalLinkCount,
          schema_present: input.crawl.hasJsonLd,
        })
        .select("id")
        .single();

      auditId = modernInsert.data?.id ? (modernInsert.data.id as string) : null;

      if (!auditId) {
        logSupabaseFailure(
          { action: "insert_audit_modern", table: "audits", userId: input.userId },
          modernInsert.error,
        );
        throw new Error(modernInsert.error?.message ?? "Failed to store audit.");
      }
    } else {
      logSupabaseFailure(
        { action: "insert_audit_legacy", table: "audits", userId: input.userId },
        legacyInsert.error,
      );
      throw new Error(legacyInsert.error.message);
    }
  }

  if (!auditId) {
    throw new Error("Failed to store audit.");
  }

  const competitorRows = buildCompetitorSnapshotRows(
    auditId,
    input.competitorSnapshots ?? [],
  );

  if (competitorRows.length > 0) {
    const { error: competitorError } = await supabase
      .from("competitor_snapshots")
      .insert(competitorRows);

    if (competitorError) {
      logSupabaseFailure(
        {
          action: "insert_competitor_snapshots",
          table: "competitor_snapshots",
          userId: input.userId,
        },
        competitorError,
      );
      if (!isMissingTableError(competitorError, "competitor_snapshots")) {
        throw new Error(competitorError.message);
      }
    }
  }

  const { error: savedReportError } = await supabase
    .from("saved_reports")
    .insert({
      audit_id: auditId,
      user_id: input.userId,
      report_name: savedReportName,
    });

  if (savedReportError) {
    logSupabaseFailure(
      { action: "insert_saved_report", table: "saved_reports", userId: input.userId },
      savedReportError,
    );
    if (!isMissingTableError(savedReportError, "saved_reports")) {
      throw new Error(savedReportError.message);
    }
  }

  if (projectId) {
    const { error: usageEventError } = await supabase
      .from("usage_events")
      .insert({
        user_id: input.userId,
        project_id: projectId,
        audit_id: auditId,
        event_name: "audit_created",
        metadata: {
          url: input.url,
          issueCount: input.fixes.length,
          competitorCount: competitorRows.length,
        },
      });

    if (usageEventError && !isMissingTableError(usageEventError, "usage_events")) {
      logSupabaseFailure(
        { action: "insert_usage_event", table: "usage_events", userId: input.userId },
        usageEventError,
      );
      throw new Error(usageEventError.message);
    }
  }

  return auditId;
}

export async function getAuditRecordById(
  id: string,
  accessToken: string,
): Promise<AuditRecord | null> {
  const supabase = getSupabaseServerClient(accessToken);
  const legacyQuery = await supabase
    .from("audits")
    .select("id, user_id, url, url_key, crawl, score, ai_output, fixes, created_at")
    .eq("id", id)
    .maybeSingle();

  if (legacyQuery.error) {
    if (
      isMissingColumnError(legacyQuery.error, "crawl", "audits") ||
      isMissingColumnError(legacyQuery.error, "score", "audits") ||
      isMissingColumnError(legacyQuery.error, "ai_output", "audits")
    ) {
      const modernQuery = await supabase
        .from("audits")
        .select(
          "id, user_id, url, url_key, crawl_data, score_breakdown, ai_output_data, fixes_data, issues_found, title_length, h1_present, word_count, internal_links, schema_present, created_at",
        )
        .eq("id", id)
        .maybeSingle();

      if (modernQuery.error) {
        logSupabaseFailure({ action: "select_audit_by_id_modern", table: "audits" }, modernQuery.error);
        throw new Error(modernQuery.error.message);
      }

      if (!modernQuery.data) {
        return null;
      }

      const modernAudit = modernQuery.data as {
        id: string;
        user_id: string | null;
        url: string;
        url_key: string;
        crawl_data: CrawlResult;
        score_breakdown: ScoreBreakdown;
        ai_output_data: AiFixOutput;
        fixes_data: AuditFix[];
        issues_found: number | null;
        title_length: number | null;
        h1_present: boolean | null;
        word_count: number | null;
        internal_links: number | null;
        schema_present: boolean | null;
        created_at: string;
      };

      const normalizedScore = normalizeScoreBreakdown(modernAudit.score_breakdown);
      return {
        id: modernAudit.id,
        user_id: modernAudit.user_id,
        project_id: null,
        url: modernAudit.url,
        url_key: modernAudit.url_key,
        crawl: modernAudit.crawl_data,
        score: normalizedScore,
        ai_output: modernAudit.ai_output_data,
        fixes: modernAudit.fixes_data,
        score_value: normalizeStoredScore(normalizedScore.total, normalizedScore.maxScore),
        issues_found: modernAudit.issues_found ?? modernAudit.fixes_data.length,
        title_length: modernAudit.title_length,
        h1_present: modernAudit.h1_present,
        word_count: modernAudit.word_count,
        internal_links: modernAudit.internal_links,
        schema_present: modernAudit.schema_present,
        created_at: modernAudit.created_at,
      };
    }

    logSupabaseFailure({ action: "select_audit_by_id_legacy", table: "audits" }, legacyQuery.error);
    throw new Error(legacyQuery.error.message);
  }

  if (!legacyQuery.data) {
    return null;
  }

  const audit = legacyQuery.data as {
    id: string;
    user_id: string | null;
    url: string;
    url_key: string;
    crawl: CrawlResult;
    score: ScoreBreakdown;
    ai_output: AiFixOutput;
    fixes: AuditFix[];
    created_at: string;
  };

  const normalizedScore = normalizeScoreBreakdown(audit.score);

  return {
    id: audit.id,
    user_id: audit.user_id,
    project_id: null,
    url: audit.url,
    url_key: audit.url_key,
    crawl: audit.crawl,
    score: normalizedScore,
    ai_output: audit.ai_output,
    fixes: audit.fixes,
    score_value: normalizeStoredScore(normalizedScore.total, normalizedScore.maxScore),
    issues_found: audit.fixes.length,
    title_length: audit.crawl.title.trim().length,
    h1_present: audit.crawl.h1.trim().length > 0,
    word_count: audit.crawl.bodyText.split(/\s+/).filter(Boolean).length,
    internal_links: audit.crawl.internalLinkCount,
    schema_present: audit.crawl.hasJsonLd,
    created_at: audit.created_at,
  };
}

export async function listSavedReportsByUser(
  userId: string,
  accessToken: string,
): Promise<SavedReportSummary[]> {
  const supabase = getSupabaseServerClient(accessToken);
  const [auditsResult, fixStatesResult] = await Promise.all([
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

  let error = auditsResult.error;
  const fixStateData = fixStatesResult.data;
  const fixStateError = fixStatesResult.error;
  let rows: Array<{
    id: string;
    url: string;
    url_key: string;
    score_breakdown: ScoreBreakdown;
    fixes_data: AuditFix[] | null;
    crawl_data: CrawlResult;
    created_at: string;
  }> = [];

  if (
    error &&
    (isMissingColumnError(error, "score", "audits") ||
      isMissingColumnError(error, "fixes", "audits") ||
      isMissingColumnError(error, "crawl", "audits"))
  ) {
    const modernAudits = await supabase
      .from("audits")
      .select("id, url, url_key, score_breakdown, fixes_data, crawl_data, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    rows = (modernAudits.data ?? []).map((row) => ({
      id: row.id,
      url: row.url,
      url_key: row.url_key,
      score_breakdown: row.score_breakdown,
      fixes_data: row.fixes_data,
      crawl_data: row.crawl_data,
      created_at: row.created_at,
    }));
    error = modernAudits.error;
  } else if (!error) {
    rows = ((auditsResult.data ?? []) as Array<{
      id: string;
      url: string;
      url_key: string;
      score: ScoreBreakdown;
      fixes: AuditFix[] | null;
      crawl: CrawlResult;
      created_at: string;
    }>).map((row) => ({
      id: row.id,
      url: row.url,
      url_key: row.url_key,
      score_breakdown: row.score,
      fixes_data: row.fixes,
      crawl_data: row.crawl,
      created_at: row.created_at,
    }));
  }

  if (error) {
    logSupabaseFailure({ action: "list_saved_reports", table: "audits", userId }, error);
    throw new Error(error.message);
  }

  if (fixStateError) {
    logSupabaseFailure(
      { action: "list_saved_reports_fix_states", table: "audit_fix_states", userId },
      fixStateError,
    );
    throw new Error(fixStateError.message);
  }

  const fixStates = (fixStateData ?? []) as Array<{
    audit_id: string;
    fix_id: string;
    completed: boolean;
  }>;

  return rows.map((row, index) => {
    const previousForSameUrl = rows
      .slice(index + 1)
      .find((candidate) => candidate.url_key === row.url_key);
    const totalFixCount =
      (row.fixes_data?.length ?? 0) +
      (row.crawl_data.internalLinking?.opportunities.length ?? 0);
    const completedFixCount = fixStates.filter(
      (state) => state.audit_id === row.id && state.completed,
    ).length;

    return {
      id: row.id,
      url: row.url,
      created_at: row.created_at,
      total: normalizeStoredScore(row.score_breakdown.total, row.score_breakdown.maxScore),
      opportunityScore: row.score_breakdown.opportunity?.score ?? null,
      projectedScore: row.score_breakdown.opportunity?.projectedScore ?? null,
      changeFromPrevious: previousForSameUrl
        ? normalizeStoredScore(row.score_breakdown.total, row.score_breakdown.maxScore) -
          normalizeStoredScore(
            previousForSameUrl.score_breakdown.total,
            previousForSameUrl.score_breakdown.maxScore,
          )
        : null,
      completedFixCount,
      totalFixCount,
    };
  });
}

export async function listCompetitorSnapshotsByAudit(
  auditId: string,
  accessToken: string,
): Promise<CompetitorSnapshotRecord[]> {
  const supabase = getSupabaseServerClient(accessToken);
  const { data, error } = await supabase
    .from("competitor_snapshots")
    .select(
      "id, audit_id, competitor_name, competitor_url, score, title_length, h1_present, word_count, internal_links, schema_present, created_at",
    )
    .eq("audit_id", auditId)
    .order("created_at", { ascending: true });

  if (error) {
    logSupabaseFailure(
      { action: "list_competitor_snapshots", table: "competitor_snapshots" },
      error,
    );
    if (isMissingTableError(error, "competitor_snapshots")) {
      return [];
    }

    throw new Error(error.message);
  }

  return (data as CompetitorSnapshotRecord[] | null) ?? [];
}

export async function listAuditHistoryByUrl(
  userId: string,
  urlKey: string,
  accessToken: string,
): Promise<AuditHistoryEntry[]> {
  const supabase = getSupabaseServerClient(accessToken);
  const legacyQuery = await supabase
    .from("audits")
    .select("id, url, created_at, score, fixes, crawl")
    .eq("user_id", userId)
    .eq("url_key", urlKey)
    .order("created_at", { ascending: false });

  let error = legacyQuery.error;
  let rows: Array<{
    id: string;
    url: string;
    created_at: string;
    score_breakdown: ScoreBreakdown;
    fixes_data: AuditFix[] | null;
    crawl_data: CrawlResult;
  }> = [];

  if (
    error &&
    (isMissingColumnError(error, "score", "audits") ||
      isMissingColumnError(error, "fixes", "audits") ||
      isMissingColumnError(error, "crawl", "audits"))
  ) {
    const modernQuery = await supabase
      .from("audits")
      .select("id, url, created_at, score_breakdown, fixes_data, crawl_data")
      .eq("user_id", userId)
      .eq("url_key", urlKey)
      .order("created_at", { ascending: false });

    rows = (modernQuery.data ?? []).map((row) => ({
      id: row.id,
      url: row.url,
      created_at: row.created_at,
      score_breakdown: row.score_breakdown,
      fixes_data: row.fixes_data,
      crawl_data: row.crawl_data,
    }));
    error = modernQuery.error;
  } else if (!error) {
    rows = ((legacyQuery.data ?? []) as Array<{
      id: string;
      url: string;
      created_at: string;
      score: ScoreBreakdown;
      fixes: AuditFix[] | null;
      crawl: CrawlResult;
    }>).map((row) => ({
      id: row.id,
      url: row.url,
      created_at: row.created_at,
      score_breakdown: row.score,
      fixes_data: row.fixes,
      crawl_data: row.crawl,
    }));
  }

  if (error) {
    logSupabaseFailure({ action: "list_audit_history", table: "audits", userId }, error);
    throw new Error(error.message);
  }

  return rows.map((row, index) => ({
    id: row.id,
    url: row.url,
    created_at: row.created_at,
    score: normalizeStoredScore(row.score_breakdown.total, row.score_breakdown.maxScore),
    previousScore: rows[index + 1]
      ? normalizeStoredScore(
          rows[index + 1].score_breakdown.total,
          rows[index + 1].score_breakdown.maxScore,
        )
      : null,
    scoreDelta: rows[index + 1]
      ? normalizeStoredScore(row.score_breakdown.total, row.score_breakdown.maxScore) -
        normalizeStoredScore(
          rows[index + 1].score_breakdown.total,
          rows[index + 1].score_breakdown.maxScore,
        )
      : null,
    issueCount: row.fixes_data?.length ?? 0,
    previousIssueCount: rows[index + 1]
      ? (rows[index + 1].fixes_data?.length ?? 0)
      : null,
    issueCountDelta: rows[index + 1]
      ? (row.fixes_data?.length ?? 0) - (rows[index + 1].fixes_data?.length ?? 0)
      : null,
    internalLinkOpportunityCount: row.crawl_data.internalLinking?.opportunities.length ?? 0,
    previousInternalLinkOpportunityCount: rows[index + 1]
      ? (rows[index + 1].crawl_data.internalLinking?.opportunities.length ?? 0)
      : null,
    internalLinkOpportunityDelta: rows[index + 1]
      ? (row.crawl_data.internalLinking?.opportunities.length ?? 0) -
        (rows[index + 1].crawl_data.internalLinking?.opportunities.length ?? 0)
      : null,
  }));
}

export async function listFixStatesByAudit(
  userId: string,
  auditId: string,
  accessToken: string,
): Promise<AuditFixStateRecord[]> {
  const supabase = getSupabaseServerClient(accessToken);
  const { data, error } = await supabase
    .from("audit_fix_states")
    .select("audit_id, fix_id, severity, completed, completed_at")
    .eq("user_id", userId)
    .eq("audit_id", auditId);

  if (error) {
    logSupabaseFailure({ action: "list_fix_states", table: "audit_fix_states", userId }, error);
    if (isMissingTableError(error, "audit_fix_states")) {
      return [];
    }

    throw new Error(error.message);
  }

  return (data as AuditFixStateRecord[] | null) ?? [];
}

export async function upsertFixState(input: {
  userId: string;
  accessToken: string;
  auditId: string;
  fixId: string;
  severity: FixSeverity;
  completed: boolean;
}): Promise<AuditFixStateRecord> {
  const supabase = getSupabaseServerClient(input.accessToken);
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
    logSupabaseFailure(
      { action: "upsert_fix_state", table: "audit_fix_states", userId: input.userId },
      error,
    );
    if (isMissingTableError(error, "audit_fix_states")) {
      return {
        audit_id: input.auditId,
        fix_id: input.fixId,
        severity: input.severity,
        completed: input.completed,
        completed_at: input.completed ? new Date().toISOString() : null,
      };
    }

    throw new Error(error?.message ?? "Failed to update fix state.");
  }

  return data as AuditFixStateRecord;
}
