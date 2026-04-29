"use strict";
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskSystem = TaskSystem;
const react_1 = require("react");
const supabase_browser_1 = require("@/lib/supabase-browser");
const progress_summary_1 = require("@/components/tasks/progress-summary");
const task_list_1 = require("@/components/tasks/task-list");
const task_system_1 = require("@/lib/task-system");
function TaskSystem({ workspaceId, pageId, auditId }) {
    const [tasks, setTasks] = (0, react_1.useState)(() => workspaceId && pageId ? [] : task_system_1.mockSeoTasks);
    const [isLoading, setIsLoading] = (0, react_1.useState)(Boolean(workspaceId && pageId));
    const [error, setError] = (0, react_1.useState)(null);
    const shouldUseDatabase = Boolean(workspaceId && pageId);
    (0, react_1.useEffect)(() => {
        if (!shouldUseDatabase || !workspaceId || !pageId) {
            return;
        }
        const load = async () => {
            var _a;
            setIsLoading(true);
            setError(null);
            try {
                const accessToken = await (0, supabase_browser_1.getSupabaseAccessToken)();
                const query = auditId ? `?auditId=${encodeURIComponent(auditId)}` : "";
                const response = await fetch(`/api/workspaces/${workspaceId}/pages/${pageId}/tasks${query}`, {
                    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
                });
                const payload = (await response.json());
                if (!response.ok || !(payload === null || payload === void 0 ? void 0 : payload.tasks)) {
                    throw new Error((_a = payload === null || payload === void 0 ? void 0 : payload.error) !== null && _a !== void 0 ? _a : "Unable to load tasks.");
                }
                setTasks(payload.tasks);
            }
            catch (loadError) {
                setError(loadError instanceof Error ? loadError.message : "Unable to load tasks.");
            }
            finally {
                setIsLoading(false);
            }
        };
        void load();
    }, [auditId, pageId, shouldUseDatabase, workspaceId]);
    async function handleToggleTask(taskId) {
        var _a;
        const task = tasks.find((item) => item.id === taskId);
        if (!task) {
            return;
        }
        if (!shouldUseDatabase) {
            const isCompleted = task.completionState === "completed";
            setTasks((current) => current.map((item) => item.id === taskId
                ? Object.assign(Object.assign({}, item), { completionState: isCompleted ? "open" : "completed", dateCompleted: isCompleted ? null : new Date().toISOString() }) : item));
            return;
        }
        try {
            const accessToken = await (0, supabase_browser_1.getSupabaseAccessToken)();
            const response = await fetch(`/api/tasks/${taskId}`, {
                method: "PATCH",
                headers: Object.assign({ "Content-Type": "application/json" }, (accessToken ? { Authorization: `Bearer ${accessToken}` } : {})),
                body: JSON.stringify({
                    completed: task.completionState !== "completed",
                    pageId,
                    auditId,
                }),
            });
            const payload = (await response.json());
            if (!response.ok || !(payload === null || payload === void 0 ? void 0 : payload.task)) {
                throw new Error((_a = payload === null || payload === void 0 ? void 0 : payload.error) !== null && _a !== void 0 ? _a : "Unable to update task.");
            }
            setTasks((current) => current.map((item) => (item.id === taskId ? payload.task : item)));
            setError(null);
        }
        catch (updateError) {
            setError(updateError instanceof Error ? updateError.message : "Unable to update task.");
        }
    }
    const summary = (0, task_system_1.getSeoTaskProgressSummary)(tasks);
    const sortedTasks = (0, react_1.useMemo)(() => [...tasks].sort((a, b) => {
        if (a.completionState !== b.completionState) {
            return a.completionState === "open" ? -1 : 1;
        }
        const priorityOrder = { High: 0, Medium: 1, Low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
    }), [tasks]);
    return (<div className="space-y-6">
      {isLoading ? (<div className="rounded-[28px] border border-slate-200 bg-white/85 px-5 py-4 text-sm text-slate-500 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
          Loading tasks...
        </div>) : null}
      {error ? (<div className="rounded-[28px] border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
          {error}
        </div>) : null}
      <progress_summary_1.ProgressSummary summary={summary}/>
      <task_list_1.TaskList tasks={sortedTasks} onToggleTask={handleToggleTask}/>
    </div>);
}
