interface MetricCardProps {
  label: string;
  value: string;
  detail: string;
  tone?: "default" | "strong" | "warning";
}

const toneClasses: Record<NonNullable<MetricCardProps["tone"]>, string> = {
  default: "border-white/60 bg-white/75 text-slate-900",
  strong: "border-emerald-200/70 bg-emerald-50/90 text-emerald-950",
  warning: "border-amber-200/80 bg-amber-50/90 text-amber-950",
};

export function MetricCard({
  label,
  value,
  detail,
  tone = "default",
}: MetricCardProps) {
  return (
    <article
      className={`rounded-[28px] border p-5 shadow-[0_12px_40px_rgba(15,23,42,0.06)] backdrop-blur ${toneClasses[tone]}`}
    >
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{detail}</p>
    </article>
  );
}
