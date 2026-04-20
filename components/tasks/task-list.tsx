import type { SeoTask } from "@/lib/task-system";

interface TaskListProps {
  tasks: SeoTask[];
  onToggleTask: (taskId: string) => void;
}

function priorityClasses(priority: SeoTask["priority"]) {
  if (priority === "High") {
    return "border-amber-200 bg-amber-50 text-amber-900";
  }

  if (priority === "Medium") {
    return "border-sky-200 bg-sky-50 text-sky-900";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
}

function categoryClasses(category: SeoTask["category"]) {
  if (category === "Internal Linking") {
    return "bg-emerald-50 text-emerald-700";
  }

  if (category === "Performance") {
    return "bg-rose-50 text-rose-700";
  }

  if (category === "Schema") {
    return "bg-violet-50 text-violet-700";
  }

  return "bg-slate-100 text-slate-700";
}

function formatCompletedDate(value: string | null) {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function TaskList({ tasks, onToggleTask }: TaskListProps) {
  return (
    <section className="rounded-[32px] border border-white/60 bg-white/82 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur sm:p-7">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            Tasks
          </p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">
            Actionable SEO fixes
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Each task is written to explain the issue, why it matters, and the exact next move
            so the team can execute without extra translation work.
          </p>
        </div>
        <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-600">
          {tasks.length} total tasks
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {tasks.map((task) => {
          const isCompleted = task.completionState === "completed";
          const completedDate = formatCompletedDate(task.dateCompleted);

          return (
            <article
              key={task.id}
              className={`rounded-[28px] border p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)] transition-all ${
                isCompleted
                  ? "border-emerald-200 bg-emerald-50/70"
                  : "border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.97),rgba(247,250,252,0.94))]"
              }`}
            >
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${categoryClasses(task.category)}`}
                    >
                      {task.category}
                    </span>
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${priorityClasses(task.priority)}`}
                    >
                      {task.priority} priority
                    </span>
                    {isCompleted ? (
                      <span className="rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
                        Completed
                      </span>
                    ) : null}
                  </div>

                  <h3 className="mt-4 text-xl font-semibold tracking-tight text-slate-950">
                    {task.title}
                  </h3>

                  <div className="mt-4 grid gap-4 md:grid-cols-3">
                    <div className="rounded-2xl bg-white/70 p-4">
                      <p className="text-sm font-semibold text-slate-900">What is wrong</p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{task.whatIsWrong}</p>
                    </div>
                    <div className="rounded-2xl bg-white/70 p-4">
                      <p className="text-sm font-semibold text-slate-900">Why it matters</p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {task.whyItMatters}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-white/70 p-4">
                      <p className="text-sm font-semibold text-slate-900">What to do</p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{task.whatToDo}</p>
                    </div>
                  </div>

                  {completedDate ? (
                    <p className="mt-4 text-sm font-medium text-emerald-700">
                      Completed on {completedDate}
                    </p>
                  ) : (
                    <p className="mt-4 text-sm text-slate-500">
                      Not completed yet. This task is still part of the active queue.
                    </p>
                  )}
                </div>

                <div className="lg:w-[13rem]">
                  <button
                    type="button"
                    onClick={() => onToggleTask(task.id)}
                    className={`w-full rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                      isCompleted
                        ? "border border-emerald-300 bg-white text-emerald-800 hover:bg-emerald-50"
                        : "bg-slate-950 text-white hover:bg-slate-800"
                    }`}
                  >
                    {isCompleted ? "Mark as open" : "Mark completed"}
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
