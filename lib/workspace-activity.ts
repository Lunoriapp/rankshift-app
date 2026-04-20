import type {
  InternalLinkOpportunityInsert,
  InternalLinkOpportunityRow,
  TaskInsert,
  TaskRow,
  TaskStatus,
} from "@/lib/database.types";
import type { InternalLinkOpportunity, InternalLinkOpportunityStatus } from "@/lib/internalLinking/types";
import { getSupabaseServerClient } from "@/lib/supabase";
import type {
  SeoTask,
  SeoTaskCompletionState,
  SeoTaskPriority,
} from "@/lib/task-system";

export interface WorkspacePageProgressCounts {
  totalTasks: number;
  completedTasks: number;
  totalInternalLinkOpportunities: number;
  completedInternalLinkOpportunities: number;
}

interface WorkspacePageScope {
  workspaceId: string;
  pageId: string;
}

interface SyncTasksInput extends WorkspacePageScope {
  auditId: string;
  tasks: SeoTask[];
}

interface SyncInternalLinkOpportunitiesInput extends WorkspacePageScope {
  auditId: string;
  opportunities: InternalLinkOpportunity[];
}

function normalizeComparableUrl(url: string): string {
  const parsed = new URL(url);
  parsed.hash = "";
  parsed.search = "";
  parsed.pathname = parsed.pathname.replace(/\/+$/, "") || "/";
  return parsed.toString();
}

async function assertPageInWorkspace({ workspaceId, pageId }: WorkspacePageScope) {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("pages")
    .select("id, workspace_id")
    .eq("id", pageId)
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Page not found for workspace.");
  }

  return data;
}

function toDbTaskPriority(priority: SeoTaskPriority): TaskInsert["priority"] {
  return priority.toLowerCase() as TaskInsert["priority"];
}

function fromDbTaskPriority(priority: TaskRow["priority"]): SeoTaskPriority {
  if (priority === "high") {
    return "High";
  }

  if (priority === "medium") {
    return "Medium";
  }

  return "Low";
}

function toDbTaskStatus(state: SeoTaskCompletionState): TaskStatus {
  return state === "completed" ? "completed" : "open";
}

function fromDbTaskStatus(status: TaskRow["status"]): SeoTaskCompletionState {
  return status === "completed" ? "completed" : "open";
}

function confidenceToNumber(confidence: InternalLinkOpportunity["confidence"]): number {
  if (confidence === "High") {
    return 90;
  }

  if (confidence === "Medium") {
    return 72;
  }

  return 48;
}

function numberToConfidence(value: number | null): InternalLinkOpportunity["confidence"] {
  if ((value ?? 0) >= 80) {
    return "High";
  }

  if ((value ?? 0) >= 60) {
    return "Medium";
  }

  return "Low";
}

function toDbInternalLinkStatus(
  status: InternalLinkOpportunityStatus,
): InternalLinkOpportunityInsert["status"] {
  return status;
}

function fromDbInternalLinkStatus(
  status: InternalLinkOpportunityRow["status"],
): InternalLinkOpportunityStatus {
  return status === "completed" ? "completed" : "open";
}

function mapTaskToInsert(input: {
  auditId: string;
  pageId: string;
  task: SeoTask;
}): TaskInsert {
  const { auditId, pageId, task } = input;

  return {
    audit_id: auditId,
    page_id: pageId,
    external_key: task.id,
    title: task.title,
    description: task.whatToDo,
    what_is_wrong: task.whatIsWrong,
    why_it_matters: task.whyItMatters,
    what_to_do: task.whatToDo,
    category: task.category,
    priority: toDbTaskPriority(task.priority),
    status: toDbTaskStatus(task.completionState),
    source: "audit",
    completed_at: task.completionState === "completed" ? task.dateCompleted : null,
  };
}

function mapTaskRowToSeoTask(row: TaskRow): SeoTask {
  return {
    id: row.external_key,
    category: row.category as SeoTask["category"],
    title: row.title,
    whatIsWrong: row.what_is_wrong,
    whyItMatters: row.why_it_matters,
    whatToDo: row.what_to_do,
    priority: fromDbTaskPriority(row.priority),
    completionState: fromDbTaskStatus(row.status),
    dateCompleted: row.completed_at,
  };
}

async function resolveTargetPageId(workspaceId: string, targetUrl: string): Promise<string | null> {
  const supabase = getSupabaseServerClient();
  const normalizedTargetUrl = normalizeComparableUrl(targetUrl);
  const { data, error } = await supabase
    .from("pages")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("normalized_url", normalizedTargetUrl)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data?.id as string | undefined) ?? null;
}

async function mapInternalLinkToInsert(input: {
  workspaceId: string;
  auditId: string;
  pageId: string;
  opportunity: InternalLinkOpportunity;
}): Promise<InternalLinkOpportunityInsert> {
  const { workspaceId, auditId, pageId, opportunity } = input;

  return {
    audit_id: auditId,
    page_id: pageId,
    external_key: opportunity.id,
    target_page_id: await resolveTargetPageId(workspaceId, opportunity.targetUrl),
    source_url: opportunity.sourceUrl,
    source_title: opportunity.sourceTitle,
    target_url: opportunity.targetUrl,
    target_title: opportunity.targetTitle,
    suggested_anchor: opportunity.suggestedAnchor,
    matched_snippet: opportunity.matchedSnippet,
    placement_hint: opportunity.placementHint,
    reason: opportunity.reason,
    confidence: confidenceToNumber(opportunity.confidence),
    status: toDbInternalLinkStatus(opportunity.status),
    completed_at: opportunity.status === "completed" ? new Date().toISOString() : null,
    notes: null,
  };
}

function mapInternalLinkRowToOpportunity(row: InternalLinkOpportunityRow): InternalLinkOpportunity {
  return {
    id: row.external_key,
    sourceUrl: row.source_url,
    sourceTitle: row.source_title,
    targetUrl: row.target_url,
    targetTitle: row.target_title,
    suggestedAnchor: row.suggested_anchor,
    matchedSnippet: row.matched_snippet,
    placementHint: row.placement_hint,
    reason: row.reason,
    confidence: numberToConfidence(row.confidence),
    confidenceScore: row.confidence ?? 0,
    status: fromDbInternalLinkStatus(row.status),
    category: "Internal linking",
  };
}

async function deleteStaleTaskRows(pageId: string, auditId: string, externalKeys: string[]) {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("tasks")
    .select("id, external_key")
    .eq("page_id", pageId)
    .eq("audit_id", auditId);

  if (error) {
    throw new Error(error.message);
  }

  const staleIds = ((data as Array<{ id: string; external_key: string }> | null) ?? [])
    .filter((row) => !externalKeys.includes(row.external_key))
    .map((row) => row.id);

  if (staleIds.length === 0) {
    return;
  }

  const { error: deleteError } = await supabase.from("tasks").delete().in("id", staleIds);

  if (deleteError) {
    throw new Error(deleteError.message);
  }
}

async function deleteStaleInternalLinkRows(
  pageId: string,
  auditId: string,
  externalKeys: string[],
) {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("internal_link_opportunities")
    .select("id, external_key")
    .eq("page_id", pageId)
    .eq("audit_id", auditId);

  if (error) {
    throw new Error(error.message);
  }

  const staleIds = ((data as Array<{ id: string; external_key: string }> | null) ?? [])
    .filter((row) => !externalKeys.includes(row.external_key))
    .map((row) => row.id);

  if (staleIds.length === 0) {
    return;
  }

  const { error: deleteError } = await supabase
    .from("internal_link_opportunities")
    .delete()
    .in("id", staleIds);

  if (deleteError) {
    throw new Error(deleteError.message);
  }
}

export async function syncTasksForPage(input: SyncTasksInput): Promise<SeoTask[]> {
  await assertPageInWorkspace(input);
  const supabase = getSupabaseServerClient();
  const rows = input.tasks.map((task) => mapTaskToInsert({ auditId: input.auditId, pageId: input.pageId, task }));

  if (rows.length > 0) {
    const { error } = await supabase.from("tasks").upsert(rows, {
      onConflict: "audit_id,page_id,external_key",
    });

    if (error) {
      throw new Error(error.message);
    }
  }

  await deleteStaleTaskRows(
    input.pageId,
    input.auditId,
    input.tasks.map((task) => task.id),
  );

  return listTasksByWorkspaceAndPage({
    workspaceId: input.workspaceId,
    pageId: input.pageId,
    auditId: input.auditId,
  });
}

export async function listTasksByWorkspaceAndPage(input: WorkspacePageScope & { auditId?: string }) {
  await assertPageInWorkspace(input);
  const supabase = getSupabaseServerClient();
  let query = supabase
    .from("tasks")
    .select(
      "id, audit_id, page_id, external_key, title, description, what_is_wrong, why_it_matters, what_to_do, category, priority, status, effort, source, completed_at, created_at, updated_at",
    )
    .eq("page_id", input.pageId)
    .order("created_at", { ascending: false });

  if (input.auditId) {
    query = query.eq("audit_id", input.auditId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return ((data as TaskRow[] | null) ?? []).map(mapTaskRowToSeoTask);
}

export async function setTaskCompletionState(input: {
  taskExternalKey: string;
  pageId: string;
  auditId?: string;
  completed: boolean;
  changedByUserId?: string | null;
}) {
  const supabase = getSupabaseServerClient();
  let existingQuery = supabase
    .from("tasks")
    .select(
      "id, audit_id, page_id, external_key, title, description, what_is_wrong, why_it_matters, what_to_do, category, priority, status, effort, source, completed_at, created_at, updated_at",
    )
    .eq("external_key", input.taskExternalKey)
    .eq("page_id", input.pageId);

  if (input.auditId) {
    existingQuery = existingQuery.eq("audit_id", input.auditId);
  }

  const { data: existing, error: existingError } = await existingQuery
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (existingError || !existing) {
    throw new Error(existingError?.message ?? "Task not found.");
  }

  const nextStatus: TaskStatus = input.completed ? "completed" : "open";
  const { data, error } = await supabase
    .from("tasks")
    .update({
      status: nextStatus,
      completed_at: input.completed ? new Date().toISOString() : null,
    })
    .eq("id", existing.id)
    .select(
      "id, audit_id, page_id, external_key, title, description, what_is_wrong, why_it_matters, what_to_do, category, priority, status, effort, source, completed_at, created_at, updated_at",
    )
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Unable to update task state.");
  }

  const { error: historyError } = await supabase.from("task_completion_history").insert({
    task_id: existing.id,
    changed_by_user_id: input.changedByUserId ?? null,
    from_status: existing.status,
    to_status: nextStatus,
    note: input.completed
      ? "Marked complete from the task system UI."
      : "Moved back to open from the task system UI.",
  });

  if (historyError) {
    throw new Error(historyError.message);
  }

  return mapTaskRowToSeoTask(data as TaskRow);
}

export async function syncInternalLinkOpportunitiesForPage(
  input: SyncInternalLinkOpportunitiesInput,
): Promise<InternalLinkOpportunity[]> {
  await assertPageInWorkspace(input);
  const supabase = getSupabaseServerClient();
  const rows = await Promise.all(
    input.opportunities.map((opportunity) =>
      mapInternalLinkToInsert({
        workspaceId: input.workspaceId,
        auditId: input.auditId,
        pageId: input.pageId,
        opportunity,
      }),
    ),
  );

  if (rows.length > 0) {
    const { error } = await supabase.from("internal_link_opportunities").upsert(rows, {
      onConflict: "audit_id,page_id,external_key",
    });

    if (error) {
      throw new Error(error.message);
    }
  }

  await deleteStaleInternalLinkRows(
    input.pageId,
    input.auditId,
    input.opportunities.map((opportunity) => opportunity.id),
  );

  return listInternalLinkOpportunitiesByWorkspaceAndPage({
    workspaceId: input.workspaceId,
    pageId: input.pageId,
    auditId: input.auditId,
  });
}

export async function listInternalLinkOpportunitiesByWorkspaceAndPage(
  input: WorkspacePageScope & { auditId?: string },
) {
  await assertPageInWorkspace(input);
  const supabase = getSupabaseServerClient();
  let query = supabase
    .from("internal_link_opportunities")
    .select(
      "id, audit_id, page_id, external_key, target_page_id, source_url, source_title, target_url, target_title, suggested_anchor, matched_snippet, placement_hint, reason, confidence, status, notes, completed_at, created_at, updated_at",
    )
    .eq("page_id", input.pageId)
    .order("created_at", { ascending: false });

  if (input.auditId) {
    query = query.eq("audit_id", input.auditId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return ((data as InternalLinkOpportunityRow[] | null) ?? []).map(
    mapInternalLinkRowToOpportunity,
  );
}

export async function setInternalLinkOpportunityCompletionState(input: {
  externalKey: string;
  pageId: string;
  auditId?: string;
  completed: boolean;
}) {
  const supabase = getSupabaseServerClient();
  const nextStatus: InternalLinkOpportunityInsert["status"] = input.completed
    ? "completed"
    : "open";

  let existingQuery = supabase
    .from("internal_link_opportunities")
    .select(
      "id, audit_id, page_id, external_key, target_page_id, source_url, source_title, target_url, target_title, suggested_anchor, matched_snippet, placement_hint, reason, confidence, status, notes, completed_at, created_at, updated_at",
    )
    .eq("external_key", input.externalKey)
    .eq("page_id", input.pageId);

  if (input.auditId) {
    existingQuery = existingQuery.eq("audit_id", input.auditId);
  }

  const { data: existing, error: existingError } = await existingQuery
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (existingError || !existing) {
    throw new Error(existingError?.message ?? "Internal link opportunity not found.");
  }

  const { data, error } = await supabase
    .from("internal_link_opportunities")
    .update({
      status: nextStatus,
      completed_at: input.completed ? new Date().toISOString() : null,
    })
    .eq("id", existing.id)
    .select(
      "id, audit_id, page_id, external_key, target_page_id, source_url, source_title, target_url, target_title, suggested_anchor, matched_snippet, placement_hint, reason, confidence, status, notes, completed_at, created_at, updated_at",
    )
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Unable to update internal link opportunity.");
  }

  return mapInternalLinkRowToOpportunity(data as InternalLinkOpportunityRow);
}

export async function getWorkspacePageProgressCounts(
  input: WorkspacePageScope,
): Promise<WorkspacePageProgressCounts> {
  await assertPageInWorkspace(input);
  const supabase = getSupabaseServerClient();
  const [{ data: tasksData, error: tasksError }, { data: linksData, error: linksError }] =
    await Promise.all([
      supabase.from("tasks").select("status").eq("page_id", input.pageId),
      supabase
        .from("internal_link_opportunities")
        .select("status")
        .eq("page_id", input.pageId),
    ]);

  if (tasksError) {
    throw new Error(tasksError.message);
  }

  if (linksError) {
    throw new Error(linksError.message);
  }

  const taskRows = ((tasksData as Array<{ status: TaskStatus }> | null) ?? []);
  const linkRows =
    ((linksData as Array<{ status: InternalLinkOpportunityRow["status"] }> | null) ?? []);

  return {
    totalTasks: taskRows.length,
    completedTasks: taskRows.filter((row) => row.status === "completed").length,
    totalInternalLinkOpportunities: linkRows.length,
    completedInternalLinkOpportunities: linkRows.filter(
      (row) => row.status === "completed",
    ).length,
  };
}
