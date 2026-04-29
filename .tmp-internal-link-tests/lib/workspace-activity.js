"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncTasksForPage = syncTasksForPage;
exports.listTasksByWorkspaceAndPage = listTasksByWorkspaceAndPage;
exports.setTaskCompletionState = setTaskCompletionState;
exports.syncInternalLinkOpportunitiesForPage = syncInternalLinkOpportunitiesForPage;
exports.listInternalLinkOpportunitiesByWorkspaceAndPage = listInternalLinkOpportunitiesByWorkspaceAndPage;
exports.setInternalLinkOpportunityCompletionState = setInternalLinkOpportunityCompletionState;
exports.getWorkspacePageProgressCounts = getWorkspacePageProgressCounts;
const supabase_1 = require("@/lib/supabase");
function normalizeComparableUrl(url) {
    const parsed = new URL(url);
    parsed.hash = "";
    parsed.search = "";
    parsed.pathname = parsed.pathname.replace(/\/+$/, "") || "/";
    return parsed.toString();
}
async function assertPageInWorkspace({ workspaceId, pageId, accessToken }) {
    const supabase = (0, supabase_1.getSupabaseServerClient)(accessToken);
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
function toDbTaskPriority(priority) {
    return priority.toLowerCase();
}
function fromDbTaskPriority(priority) {
    if (priority === "high") {
        return "High";
    }
    if (priority === "medium") {
        return "Medium";
    }
    return "Low";
}
function toDbTaskStatus(state) {
    return state === "completed" ? "completed" : "open";
}
function fromDbTaskStatus(status) {
    return status === "completed" ? "completed" : "open";
}
function confidenceToNumber(confidence) {
    if (confidence === "High") {
        return 90;
    }
    if (confidence === "Medium") {
        return 72;
    }
    return 48;
}
const REWRITE_ANCHOR_PREFIX = "__rewrite__:";
function getPersistedAnchorText(opportunity) {
    var _a, _b, _c, _d;
    const anchor = (_b = (_a = opportunity.suggestedAnchor) === null || _a === void 0 ? void 0 : _a.trim()) !== null && _b !== void 0 ? _b : "";
    if (anchor.length > 0) {
        return anchor;
    }
    const rewriteSuggestion = (_d = (_c = opportunity.rewriteSuggestion) === null || _c === void 0 ? void 0 : _c.trim()) !== null && _d !== void 0 ? _d : "";
    if (rewriteSuggestion.length > 0) {
        return `${REWRITE_ANCHOR_PREFIX}${rewriteSuggestion}`;
    }
    return "No strong anchor found";
}
function numberToConfidence(value) {
    if ((value !== null && value !== void 0 ? value : 0) >= 80) {
        return "High";
    }
    if ((value !== null && value !== void 0 ? value : 0) >= 60) {
        return "Medium";
    }
    return "Low";
}
function toDbInternalLinkStatus(status) {
    return status;
}
function fromDbInternalLinkStatus(status) {
    return status === "completed" ? "completed" : "open";
}
function mapTaskToInsert(input) {
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
function mapTaskRowToSeoTask(row) {
    return {
        id: row.external_key,
        category: row.category,
        title: row.title,
        whatIsWrong: row.what_is_wrong,
        whyItMatters: row.why_it_matters,
        whatToDo: row.what_to_do,
        priority: fromDbTaskPriority(row.priority),
        completionState: fromDbTaskStatus(row.status),
        dateCompleted: row.completed_at,
    };
}
async function resolveTargetPageId(workspaceId, targetUrl, accessToken) {
    var _a;
    const supabase = (0, supabase_1.getSupabaseServerClient)(accessToken);
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
    return (_a = data === null || data === void 0 ? void 0 : data.id) !== null && _a !== void 0 ? _a : null;
}
async function mapInternalLinkToInsert(input) {
    const { workspaceId, auditId, pageId, accessToken, opportunity } = input;
    return {
        audit_id: auditId,
        page_id: pageId,
        external_key: opportunity.id,
        target_page_id: await resolveTargetPageId(workspaceId, opportunity.targetUrl, accessToken),
        source_url: opportunity.sourceUrl,
        source_title: opportunity.sourceTitle,
        target_url: opportunity.targetUrl,
        target_title: opportunity.targetTitle,
        suggested_anchor: getPersistedAnchorText(opportunity),
        matched_snippet: opportunity.matchedSnippet,
        placement_hint: opportunity.placementHint,
        reason: opportunity.reason,
        confidence: confidenceToNumber(opportunity.confidence),
        status: toDbInternalLinkStatus(opportunity.status),
        completed_at: opportunity.status === "completed" ? new Date().toISOString() : null,
        notes: null,
    };
}
function mapInternalLinkRowToOpportunity(row) {
    var _a;
    const normalizedStoredAnchor = row.suggested_anchor.trim();
    const isLegacyRewriteOnlyAnchor = normalizedStoredAnchor.toLowerCase() === "no strong anchor found";
    const isRewritePrefixedAnchor = normalizedStoredAnchor.startsWith(REWRITE_ANCHOR_PREFIX);
    const rewriteSuggestion = isRewritePrefixedAnchor
        ? normalizedStoredAnchor.slice(REWRITE_ANCHOR_PREFIX.length).trim()
        : isLegacyRewriteOnlyAnchor
            ? "Rewrite sentence to include a natural internal link to this page"
            : null;
    return {
        id: row.external_key,
        sourceUrl: row.source_url,
        sourceTitle: row.source_title,
        targetUrl: row.target_url,
        targetTitle: row.target_title,
        suggestedAnchor: rewriteSuggestion ? null : row.suggested_anchor,
        rewriteSuggestion,
        matchedSnippet: row.matched_snippet,
        placementHint: row.placement_hint,
        reason: row.reason,
        confidence: numberToConfidence(row.confidence),
        confidenceScore: (_a = row.confidence) !== null && _a !== void 0 ? _a : 0,
        status: fromDbInternalLinkStatus(row.status),
        category: "Internal linking",
    };
}
async function deleteStaleTaskRows(pageId, auditId, externalKeys, accessToken) {
    var _a;
    const supabase = (0, supabase_1.getSupabaseServerClient)(accessToken);
    const { data, error } = await supabase
        .from("tasks")
        .select("id, external_key")
        .eq("page_id", pageId)
        .eq("audit_id", auditId);
    if (error) {
        throw new Error(error.message);
    }
    const staleIds = ((_a = data) !== null && _a !== void 0 ? _a : [])
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
async function deleteStaleInternalLinkRows(pageId, auditId, externalKeys, accessToken) {
    var _a;
    const supabase = (0, supabase_1.getSupabaseServerClient)(accessToken);
    const { data, error } = await supabase
        .from("internal_link_opportunities")
        .select("id, external_key")
        .eq("page_id", pageId)
        .eq("audit_id", auditId);
    if (error) {
        throw new Error(error.message);
    }
    const staleIds = ((_a = data) !== null && _a !== void 0 ? _a : [])
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
async function syncTasksForPage(input) {
    await assertPageInWorkspace(input);
    const supabase = (0, supabase_1.getSupabaseServerClient)(input.accessToken);
    const rows = input.tasks.map((task) => mapTaskToInsert({ auditId: input.auditId, pageId: input.pageId, task }));
    if (rows.length > 0) {
        const { error } = await supabase.from("tasks").upsert(rows, {
            onConflict: "audit_id,page_id,external_key",
        });
        if (error) {
            throw new Error(error.message);
        }
    }
    await deleteStaleTaskRows(input.pageId, input.auditId, input.tasks.map((task) => task.id), input.accessToken);
    return listTasksByWorkspaceAndPage({
        workspaceId: input.workspaceId,
        pageId: input.pageId,
        accessToken: input.accessToken,
        auditId: input.auditId,
    });
}
async function listTasksByWorkspaceAndPage(input) {
    var _a;
    await assertPageInWorkspace(input);
    const supabase = (0, supabase_1.getSupabaseServerClient)(input.accessToken);
    let query = supabase
        .from("tasks")
        .select("id, audit_id, page_id, external_key, title, description, what_is_wrong, why_it_matters, what_to_do, category, priority, status, effort, source, completed_at, created_at, updated_at")
        .eq("page_id", input.pageId)
        .order("created_at", { ascending: false });
    if (input.auditId) {
        query = query.eq("audit_id", input.auditId);
    }
    const { data, error } = await query;
    if (error) {
        throw new Error(error.message);
    }
    return ((_a = data) !== null && _a !== void 0 ? _a : []).map(mapTaskRowToSeoTask);
}
async function setTaskCompletionState(input) {
    var _a, _b, _c;
    const supabase = (0, supabase_1.getSupabaseServerClient)(input.accessToken);
    let existingQuery = supabase
        .from("tasks")
        .select("id, audit_id, page_id, external_key, title, description, what_is_wrong, why_it_matters, what_to_do, category, priority, status, effort, source, completed_at, created_at, updated_at")
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
        throw new Error((_a = existingError === null || existingError === void 0 ? void 0 : existingError.message) !== null && _a !== void 0 ? _a : "Task not found.");
    }
    const nextStatus = input.completed ? "completed" : "open";
    const { data, error } = await supabase
        .from("tasks")
        .update({
        status: nextStatus,
        completed_at: input.completed ? new Date().toISOString() : null,
    })
        .eq("id", existing.id)
        .select("id, audit_id, page_id, external_key, title, description, what_is_wrong, why_it_matters, what_to_do, category, priority, status, effort, source, completed_at, created_at, updated_at")
        .single();
    if (error || !data) {
        throw new Error((_b = error === null || error === void 0 ? void 0 : error.message) !== null && _b !== void 0 ? _b : "Unable to update task state.");
    }
    const { error: historyError } = await supabase.from("task_completion_history").insert({
        task_id: existing.id,
        changed_by_user_id: (_c = input.changedByUserId) !== null && _c !== void 0 ? _c : null,
        from_status: existing.status,
        to_status: nextStatus,
        note: input.completed
            ? "Marked complete from the task system UI."
            : "Moved back to open from the task system UI.",
    });
    if (historyError) {
        throw new Error(historyError.message);
    }
    return mapTaskRowToSeoTask(data);
}
async function syncInternalLinkOpportunitiesForPage(input) {
    await assertPageInWorkspace(input);
    const supabase = (0, supabase_1.getSupabaseServerClient)(input.accessToken);
    const rows = await Promise.all(input.opportunities.map((opportunity) => mapInternalLinkToInsert({
        workspaceId: input.workspaceId,
        auditId: input.auditId,
        pageId: input.pageId,
        accessToken: input.accessToken,
        opportunity,
    })));
    if (rows.length > 0) {
        const { error } = await supabase.from("internal_link_opportunities").upsert(rows, {
            onConflict: "audit_id,page_id,external_key",
        });
        if (error) {
            throw new Error(error.message);
        }
    }
    await deleteStaleInternalLinkRows(input.pageId, input.auditId, input.opportunities.map((opportunity) => opportunity.id), input.accessToken);
    return listInternalLinkOpportunitiesByWorkspaceAndPage({
        workspaceId: input.workspaceId,
        pageId: input.pageId,
        accessToken: input.accessToken,
        auditId: input.auditId,
    });
}
async function listInternalLinkOpportunitiesByWorkspaceAndPage(input) {
    var _a;
    await assertPageInWorkspace(input);
    const supabase = (0, supabase_1.getSupabaseServerClient)(input.accessToken);
    let query = supabase
        .from("internal_link_opportunities")
        .select("id, audit_id, page_id, external_key, target_page_id, source_url, source_title, target_url, target_title, suggested_anchor, matched_snippet, placement_hint, reason, confidence, status, notes, completed_at, created_at, updated_at")
        .eq("page_id", input.pageId)
        .order("created_at", { ascending: false });
    if (input.auditId) {
        query = query.eq("audit_id", input.auditId);
    }
    const { data, error } = await query;
    if (error) {
        throw new Error(error.message);
    }
    return ((_a = data) !== null && _a !== void 0 ? _a : []).map(mapInternalLinkRowToOpportunity);
}
async function setInternalLinkOpportunityCompletionState(input) {
    var _a, _b;
    const supabase = (0, supabase_1.getSupabaseServerClient)(input.accessToken);
    const nextStatus = input.completed
        ? "completed"
        : "open";
    let existingQuery = supabase
        .from("internal_link_opportunities")
        .select("id, audit_id, page_id, external_key, target_page_id, source_url, source_title, target_url, target_title, suggested_anchor, matched_snippet, placement_hint, reason, confidence, status, notes, completed_at, created_at, updated_at")
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
        throw new Error((_a = existingError === null || existingError === void 0 ? void 0 : existingError.message) !== null && _a !== void 0 ? _a : "Internal link opportunity not found.");
    }
    const { data, error } = await supabase
        .from("internal_link_opportunities")
        .update({
        status: nextStatus,
        completed_at: input.completed ? new Date().toISOString() : null,
    })
        .eq("id", existing.id)
        .select("id, audit_id, page_id, external_key, target_page_id, source_url, source_title, target_url, target_title, suggested_anchor, matched_snippet, placement_hint, reason, confidence, status, notes, completed_at, created_at, updated_at")
        .single();
    if (error || !data) {
        throw new Error((_b = error === null || error === void 0 ? void 0 : error.message) !== null && _b !== void 0 ? _b : "Unable to update internal link opportunity.");
    }
    return mapInternalLinkRowToOpportunity(data);
}
async function getWorkspacePageProgressCounts(input) {
    var _a, _b;
    await assertPageInWorkspace(input);
    const supabase = (0, supabase_1.getSupabaseServerClient)(input.accessToken);
    const [{ data: tasksData, error: tasksError }, { data: linksData, error: linksError }] = await Promise.all([
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
    const taskRows = ((_a = tasksData) !== null && _a !== void 0 ? _a : []);
    const linkRows = ((_b = linksData) !== null && _b !== void 0 ? _b : []);
    return {
        totalTasks: taskRows.length,
        completedTasks: taskRows.filter((row) => row.status === "completed").length,
        totalInternalLinkOpportunities: linkRows.length,
        completedInternalLinkOpportunities: linkRows.filter((row) => row.status === "completed").length,
    };
}
