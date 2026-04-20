"use client";

import { useEffect, useMemo, useState } from "react";

import { getSupabaseAccessToken } from "@/lib/supabase-browser";
import { ProgressSummary } from "@/components/tasks/progress-summary";
import { TaskList } from "@/components/tasks/task-list";
import {
  getSeoTaskProgressSummary,
  mockSeoTasks,
  type SeoTask,
} from "@/lib/task-system";

interface TaskSystemProps {
  workspaceId?: string;
  pageId?: string;
  auditId?: string;
}

export function TaskSystem({ workspaceId, pageId, auditId }: TaskSystemProps) {
  const [tasks, setTasks] = useState<SeoTask[]>(() =>
    workspaceId && pageId ? [] : mockSeoTasks,
  );
  const [isLoading, setIsLoading] = useState(Boolean(workspaceId && pageId));
  const [error, setError] = useState<string | null>(null);

  const shouldUseDatabase = Boolean(workspaceId && pageId);

  useEffect(() => {
    if (!shouldUseDatabase || !workspaceId || !pageId) {
      return;
    }

    const load = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const accessToken = await getSupabaseAccessToken();
        const query = auditId ? `?auditId=${encodeURIComponent(auditId)}` : "";
        const response = await fetch(
          `/api/workspaces/${workspaceId}/pages/${pageId}/tasks${query}`,
          {
            headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
          },
        );
        const payload = (await response.json()) as
          | { tasks?: SeoTask[]; error?: string }
          | null;

        if (!response.ok || !payload?.tasks) {
          throw new Error(payload?.error ?? "Unable to load tasks.");
        }

        setTasks(payload.tasks);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load tasks.");
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, [auditId, pageId, shouldUseDatabase, workspaceId]);

  async function handleToggleTask(taskId: string) {
    const task = tasks.find((item) => item.id === taskId);

    if (!task) {
      return;
    }

    if (!shouldUseDatabase) {
      const isCompleted = task.completionState === "completed";
      setTasks((current) =>
        current.map((item) =>
          item.id === taskId
            ? {
                ...item,
                completionState: isCompleted ? "open" : "completed",
                dateCompleted: isCompleted ? null : new Date().toISOString(),
              }
            : item,
        ),
      );
      return;
    }

    try {
      const accessToken = await getSupabaseAccessToken();
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({
          completed: task.completionState !== "completed",
          pageId,
          auditId,
        }),
      });
      const payload = (await response.json()) as
        | { task?: SeoTask; error?: string }
        | null;

      if (!response.ok || !payload?.task) {
        throw new Error(payload?.error ?? "Unable to update task.");
      }

      setTasks((current) =>
        current.map((item) => (item.id === taskId ? payload.task! : item)),
      );
      setError(null);
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Unable to update task.");
    }
  }

  const summary = getSeoTaskProgressSummary(tasks);
  const sortedTasks = useMemo(
    () =>
      [...tasks].sort((a, b) => {
        if (a.completionState !== b.completionState) {
          return a.completionState === "open" ? -1 : 1;
        }

        const priorityOrder = { High: 0, Medium: 1, Low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }),
    [tasks],
  );

  return (
    <div className="space-y-6">
      {isLoading ? (
        <div className="rounded-[28px] border border-slate-200 bg-white/85 px-5 py-4 text-sm text-slate-500 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
          Loading tasks...
        </div>
      ) : null}
      {error ? (
        <div className="rounded-[28px] border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
          {error}
        </div>
      ) : null}
      <ProgressSummary summary={summary} />
      <TaskList tasks={sortedTasks} onToggleTask={handleToggleTask} />
    </div>
  );
}
