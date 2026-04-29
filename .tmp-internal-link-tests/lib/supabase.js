"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeUrlKey = normalizeUrlKey;
exports.getSupabaseServerClient = getSupabaseServerClient;
exports.getSupabaseAdminClient = getSupabaseAdminClient;
exports.getUserFromAccessToken = getUserFromAccessToken;
exports.createAuditRecord = createAuditRecord;
exports.getAuditRecordById = getAuditRecordById;
exports.listSavedReportsByUser = listSavedReportsByUser;
exports.listCompetitorSnapshotsByAudit = listCompetitorSnapshotsByAudit;
exports.listAuditHistoryByUrl = listAuditHistoryByUrl;
exports.listFixStatesByAudit = listFixStatesByAudit;
exports.upsertFixState = upsertFixState;
const supabase_js_1 = require("@supabase/supabase-js");
const supabase_config_1 = require("./supabase-config");
let cachedClient = null;
function logSupabaseFailure(context, error) {
    var _a;
    const message = getErrorMessage(error);
    console.error("[supabase]", {
        action: context.action,
        table: context.table,
        userId: (_a = context.userId) !== null && _a !== void 0 ? _a : null,
        message,
    });
}
function getErrorMessage(error) {
    if (error instanceof Error) {
        return error.message;
    }
    if (typeof error === "string") {
        return error;
    }
    if (error && typeof error === "object") {
        const record = error;
        if (typeof record.message === "string") {
            return record.message;
        }
    }
    return "";
}
function isMissingTableError(error, tableName) {
    const message = getErrorMessage(error).toLowerCase();
    return (message.includes(`could not find the table 'public.${tableName.toLowerCase()}'`) ||
        message.includes(`relation "public.${tableName.toLowerCase()}" does not exist`));
}
function isMissingColumnError(error, columnName, tableName) {
    const message = getErrorMessage(error).toLowerCase();
    const column = columnName.toLowerCase();
    const matched = message.includes(`could not find the '${column}' column`) ||
        message.includes(`column "${column}" does not exist`);
    if (!matched) {
        return false;
    }
    if (!tableName) {
        return true;
    }
    const table = tableName.toLowerCase();
    return (message.includes(`'${table}'`) ||
        message.includes(`${table}.${column}`) ||
        message.includes(` of "${table}"`));
}
function normalizeStoredScore(total, maxScore) {
    if (!maxScore || maxScore === 100) {
        return total;
    }
    return Math.max(0, Math.min(100, Math.round((total / maxScore) * 100)));
}
function normalizeScoreBreakdown(score) {
    const normalizedTotal = normalizeStoredScore(score.total, score.maxScore);
    return Object.assign(Object.assign({}, score), { total: normalizedTotal, maxScore: 100, opportunity: score.opportunity
            ? Object.assign(Object.assign({}, score.opportunity), { score: Math.max(0, Math.min(100, score.opportunity.score)), projectedScore: Math.max(0, Math.min(100, score.opportunity.projectedScore)) }) : undefined });
}
function normalizeUrlKey(url) {
    const parsed = new URL(url);
    const pathname = parsed.pathname.replace(/\/+$/, "") || "/";
    return `${parsed.hostname.toLowerCase()}${pathname}`;
}
function buildProjectName(url) {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, "");
}
function buildCompetitorSnapshotRows(auditId, snapshots) {
    return snapshots.map((snapshot) => {
        var _a;
        return ({
            audit_id: auditId,
            competitor_name: snapshot.name,
            competitor_url: (_a = snapshot.url) !== null && _a !== void 0 ? _a : null,
            score: snapshot.score,
            title_length: snapshot.titleLength,
            h1_present: snapshot.h1,
            word_count: snapshot.wordCount,
            internal_links: snapshot.internalLinks,
            schema_present: snapshot.schema,
        });
    });
}
async function findOrCreateProject(input) {
    var _a;
    const urlKey = normalizeUrlKey(input.url);
    const query = input.supabase
        .from("projects")
        .select("id")
        .eq("url_key", urlKey)
        .eq("user_id", input.userId)
        .limit(1);
    const { data: existing, error: existingError } = await query.maybeSingle();
    if (existingError) {
        logSupabaseFailure({ action: "select_or_create_project", table: "projects", userId: input.userId }, existingError);
        if (isMissingTableError(existingError, "projects")) {
            return null;
        }
        throw new Error(existingError.message);
    }
    if (existing === null || existing === void 0 ? void 0 : existing.id) {
        return existing.id;
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
        logSupabaseFailure({ action: "insert_project", table: "projects", userId: input.userId }, error);
        if (isMissingTableError(error, "projects")) {
            return null;
        }
        throw new Error((_a = error === null || error === void 0 ? void 0 : error.message) !== null && _a !== void 0 ? _a : "Failed to create project.");
    }
    return data.id;
}
function createAdminServerClient() {
    const { url, key } = (0, supabase_config_1.getSupabaseServerConfig)();
    return (0, supabase_js_1.createClient)(url, key, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false,
        },
    });
}
function createUserScopedServerClient(accessToken) {
    const publicConfig = (0, supabase_config_1.getSupabasePublicConfig)();
    return (0, supabase_js_1.createClient)(publicConfig.url, publicConfig.anonKey, {
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
function getSupabaseServerClient(accessToken) {
    if (accessToken) {
        return createUserScopedServerClient(accessToken);
    }
    if (cachedClient) {
        return cachedClient;
    }
    cachedClient = createAdminServerClient();
    return cachedClient;
}
function getSupabaseAdminClient() {
    if (cachedClient) {
        return cachedClient;
    }
    cachedClient = createAdminServerClient();
    return cachedClient;
}
async function getUserFromAccessToken(token) {
    var _a;
    // Token verification should use anon + bearer token, not service role.
    // This avoids requiring SUPABASE_SERVICE_ROLE_KEY for non-admin auth checks.
    const supabase = createUserScopedServerClient(token);
    const { data, error } = await supabase.auth.getUser(token);
    if (error) {
        throw new Error(error.message);
    }
    return (_a = data.user) !== null && _a !== void 0 ? _a : null;
}
async function createAuditRecord(input) {
    var _a, _b, _c, _d, _e;
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
    let auditId = ((_a = legacyInsert.data) === null || _a === void 0 ? void 0 : _a.id) ? legacyInsert.data.id : null;
    if (!auditId && legacyInsert.error) {
        if (isMissingColumnError(legacyInsert.error, "crawl", "audits") ||
            isMissingColumnError(legacyInsert.error, "score", "audits") ||
            isMissingColumnError(legacyInsert.error, "ai_output", "audits") ||
            isMissingColumnError(legacyInsert.error, "fixes", "audits")) {
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
            auditId = ((_b = modernInsert.data) === null || _b === void 0 ? void 0 : _b.id) ? modernInsert.data.id : null;
            if (!auditId) {
                logSupabaseFailure({ action: "insert_audit_modern", table: "audits", userId: input.userId }, modernInsert.error);
                throw new Error((_d = (_c = modernInsert.error) === null || _c === void 0 ? void 0 : _c.message) !== null && _d !== void 0 ? _d : "Failed to store audit.");
            }
        }
        else {
            logSupabaseFailure({ action: "insert_audit_legacy", table: "audits", userId: input.userId }, legacyInsert.error);
            throw new Error(legacyInsert.error.message);
        }
    }
    if (!auditId) {
        throw new Error("Failed to store audit.");
    }
    const competitorRows = buildCompetitorSnapshotRows(auditId, (_e = input.competitorSnapshots) !== null && _e !== void 0 ? _e : []);
    if (competitorRows.length > 0) {
        const { error: competitorError } = await supabase
            .from("competitor_snapshots")
            .insert(competitorRows);
        if (competitorError) {
            logSupabaseFailure({
                action: "insert_competitor_snapshots",
                table: "competitor_snapshots",
                userId: input.userId,
            }, competitorError);
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
        logSupabaseFailure({ action: "insert_saved_report", table: "saved_reports", userId: input.userId }, savedReportError);
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
            logSupabaseFailure({ action: "insert_usage_event", table: "usage_events", userId: input.userId }, usageEventError);
            throw new Error(usageEventError.message);
        }
    }
    return auditId;
}
async function getAuditRecordById(id, accessToken) {
    var _a;
    const supabase = getSupabaseServerClient(accessToken);
    const legacyQuery = await supabase
        .from("audits")
        .select("id, user_id, url, url_key, crawl, score, ai_output, fixes, created_at")
        .eq("id", id)
        .maybeSingle();
    if (legacyQuery.error) {
        if (isMissingColumnError(legacyQuery.error, "crawl", "audits") ||
            isMissingColumnError(legacyQuery.error, "score", "audits") ||
            isMissingColumnError(legacyQuery.error, "ai_output", "audits")) {
            const modernQuery = await supabase
                .from("audits")
                .select("id, user_id, url, url_key, crawl_data, score_breakdown, ai_output_data, fixes_data, issues_found, title_length, h1_present, word_count, internal_links, schema_present, created_at")
                .eq("id", id)
                .maybeSingle();
            if (modernQuery.error) {
                logSupabaseFailure({ action: "select_audit_by_id_modern", table: "audits" }, modernQuery.error);
                throw new Error(modernQuery.error.message);
            }
            if (!modernQuery.data) {
                return null;
            }
            const modernAudit = modernQuery.data;
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
                issues_found: (_a = modernAudit.issues_found) !== null && _a !== void 0 ? _a : modernAudit.fixes_data.length,
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
    const audit = legacyQuery.data;
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
async function listSavedReportsByUser(userId, accessToken) {
    var _a, _b;
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
    let rows = [];
    if (error &&
        (isMissingColumnError(error, "score", "audits") ||
            isMissingColumnError(error, "fixes", "audits") ||
            isMissingColumnError(error, "crawl", "audits"))) {
        const modernAudits = await supabase
            .from("audits")
            .select("id, url, url_key, score_breakdown, fixes_data, crawl_data, created_at")
            .eq("user_id", userId)
            .order("created_at", { ascending: false });
        rows = ((_a = modernAudits.data) !== null && _a !== void 0 ? _a : []).map((row) => ({
            id: row.id,
            url: row.url,
            url_key: row.url_key,
            score_breakdown: row.score_breakdown,
            fixes_data: row.fixes_data,
            crawl_data: row.crawl_data,
            created_at: row.created_at,
        }));
        error = modernAudits.error;
    }
    else if (!error) {
        rows = ((_b = auditsResult.data) !== null && _b !== void 0 ? _b : []).map((row) => ({
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
        logSupabaseFailure({ action: "list_saved_reports_fix_states", table: "audit_fix_states", userId }, fixStateError);
        throw new Error(fixStateError.message);
    }
    const fixStates = (fixStateData !== null && fixStateData !== void 0 ? fixStateData : []);
    return rows.map((row, index) => {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        const previousForSameUrl = rows
            .slice(index + 1)
            .find((candidate) => candidate.url_key === row.url_key);
        const totalFixCount = ((_b = (_a = row.fixes_data) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0) +
            ((_d = (_c = row.crawl_data.internalLinking) === null || _c === void 0 ? void 0 : _c.opportunities.length) !== null && _d !== void 0 ? _d : 0);
        const completedFixCount = fixStates.filter((state) => state.audit_id === row.id && state.completed).length;
        return {
            id: row.id,
            url: row.url,
            created_at: row.created_at,
            total: normalizeStoredScore(row.score_breakdown.total, row.score_breakdown.maxScore),
            opportunityScore: (_f = (_e = row.score_breakdown.opportunity) === null || _e === void 0 ? void 0 : _e.score) !== null && _f !== void 0 ? _f : null,
            projectedScore: (_h = (_g = row.score_breakdown.opportunity) === null || _g === void 0 ? void 0 : _g.projectedScore) !== null && _h !== void 0 ? _h : null,
            changeFromPrevious: previousForSameUrl
                ? normalizeStoredScore(row.score_breakdown.total, row.score_breakdown.maxScore) -
                    normalizeStoredScore(previousForSameUrl.score_breakdown.total, previousForSameUrl.score_breakdown.maxScore)
                : null,
            completedFixCount,
            totalFixCount,
        };
    });
}
async function listCompetitorSnapshotsByAudit(auditId, accessToken) {
    var _a;
    const supabase = getSupabaseServerClient(accessToken);
    const { data, error } = await supabase
        .from("competitor_snapshots")
        .select("id, audit_id, competitor_name, competitor_url, score, title_length, h1_present, word_count, internal_links, schema_present, created_at")
        .eq("audit_id", auditId)
        .order("created_at", { ascending: true });
    if (error) {
        logSupabaseFailure({ action: "list_competitor_snapshots", table: "competitor_snapshots" }, error);
        if (isMissingTableError(error, "competitor_snapshots")) {
            return [];
        }
        throw new Error(error.message);
    }
    return (_a = data) !== null && _a !== void 0 ? _a : [];
}
async function listAuditHistoryByUrl(userId, urlKey, accessToken) {
    var _a, _b;
    const supabase = getSupabaseServerClient(accessToken);
    const legacyQuery = await supabase
        .from("audits")
        .select("id, url, created_at, score, fixes, crawl")
        .eq("user_id", userId)
        .eq("url_key", urlKey)
        .order("created_at", { ascending: false });
    let error = legacyQuery.error;
    let rows = [];
    if (error &&
        (isMissingColumnError(error, "score", "audits") ||
            isMissingColumnError(error, "fixes", "audits") ||
            isMissingColumnError(error, "crawl", "audits"))) {
        const modernQuery = await supabase
            .from("audits")
            .select("id, url, created_at, score_breakdown, fixes_data, crawl_data")
            .eq("user_id", userId)
            .eq("url_key", urlKey)
            .order("created_at", { ascending: false });
        rows = ((_a = modernQuery.data) !== null && _a !== void 0 ? _a : []).map((row) => ({
            id: row.id,
            url: row.url,
            created_at: row.created_at,
            score_breakdown: row.score_breakdown,
            fixes_data: row.fixes_data,
            crawl_data: row.crawl_data,
        }));
        error = modernQuery.error;
    }
    else if (!error) {
        rows = ((_b = legacyQuery.data) !== null && _b !== void 0 ? _b : []).map((row) => ({
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
    return rows.map((row, index) => {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r;
        return ({
            id: row.id,
            url: row.url,
            created_at: row.created_at,
            score: normalizeStoredScore(row.score_breakdown.total, row.score_breakdown.maxScore),
            previousScore: rows[index + 1]
                ? normalizeStoredScore(rows[index + 1].score_breakdown.total, rows[index + 1].score_breakdown.maxScore)
                : null,
            scoreDelta: rows[index + 1]
                ? normalizeStoredScore(row.score_breakdown.total, row.score_breakdown.maxScore) -
                    normalizeStoredScore(rows[index + 1].score_breakdown.total, rows[index + 1].score_breakdown.maxScore)
                : null,
            issueCount: (_b = (_a = row.fixes_data) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0,
            previousIssueCount: rows[index + 1]
                ? ((_d = (_c = rows[index + 1].fixes_data) === null || _c === void 0 ? void 0 : _c.length) !== null && _d !== void 0 ? _d : 0)
                : null,
            issueCountDelta: rows[index + 1]
                ? ((_f = (_e = row.fixes_data) === null || _e === void 0 ? void 0 : _e.length) !== null && _f !== void 0 ? _f : 0) - ((_h = (_g = rows[index + 1].fixes_data) === null || _g === void 0 ? void 0 : _g.length) !== null && _h !== void 0 ? _h : 0)
                : null,
            internalLinkOpportunityCount: (_k = (_j = row.crawl_data.internalLinking) === null || _j === void 0 ? void 0 : _j.opportunities.length) !== null && _k !== void 0 ? _k : 0,
            previousInternalLinkOpportunityCount: rows[index + 1]
                ? ((_m = (_l = rows[index + 1].crawl_data.internalLinking) === null || _l === void 0 ? void 0 : _l.opportunities.length) !== null && _m !== void 0 ? _m : 0)
                : null,
            internalLinkOpportunityDelta: rows[index + 1]
                ? ((_p = (_o = row.crawl_data.internalLinking) === null || _o === void 0 ? void 0 : _o.opportunities.length) !== null && _p !== void 0 ? _p : 0) -
                    ((_r = (_q = rows[index + 1].crawl_data.internalLinking) === null || _q === void 0 ? void 0 : _q.opportunities.length) !== null && _r !== void 0 ? _r : 0)
                : null,
        });
    });
}
async function listFixStatesByAudit(userId, auditId, accessToken) {
    var _a;
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
    return (_a = data) !== null && _a !== void 0 ? _a : [];
}
async function upsertFixState(input) {
    var _a;
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
        logSupabaseFailure({ action: "upsert_fix_state", table: "audit_fix_states", userId: input.userId }, error);
        if (isMissingTableError(error, "audit_fix_states")) {
            return {
                audit_id: input.auditId,
                fix_id: input.fixId,
                severity: input.severity,
                completed: input.completed,
                completed_at: input.completed ? new Date().toISOString() : null,
            };
        }
        throw new Error((_a = error === null || error === void 0 ? void 0 : error.message) !== null && _a !== void 0 ? _a : "Failed to update fix state.");
    }
    return data;
}
