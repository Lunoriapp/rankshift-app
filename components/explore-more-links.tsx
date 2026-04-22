interface ExploreMoreLinksProps {
  reportId: string;
  isPaid: boolean;
}

interface ExploreCard {
  slug: "details" | "scoring" | "history" | "insights" | "export";
  title: string;
  description: string;
  unlocks: string;
  paidOnly: boolean;
}

const EXPLORE_CARDS: ExploreCard[] = [
  {
    slug: "details",
    title: "Full audit details",
    description: "Open the complete fix list, internal link queue, and rewrite implementation view.",
    unlocks: "Full implementation workflow",
    paidOnly: false,
  },
  {
    slug: "scoring",
    title: "Scoring logic",
    description: "See exactly how each SEO area contributes to the total score.",
    unlocks: "Category-level scoring breakdown",
    paidOnly: false,
  },
  {
    slug: "history",
    title: "Scan history",
    description: "Track score movement, completed actions, and scan comparisons over time.",
    unlocks: "Historical score movement and comparisons",
    paidOnly: true,
  },
  {
    slug: "insights",
    title: "Premium insights",
    description: "Reveal deeper competitor topic gaps and stronger content opportunities.",
    unlocks: "Competitor topic gaps and advanced opportunities",
    paidOnly: true,
  },
  {
    slug: "export",
    title: "Export centre",
    description: "Generate shareable outputs for clients, teams, and stakeholders.",
    unlocks: "PDF export, CSV export, and shareable client view",
    paidOnly: true,
  },
];

export function ExploreMoreLinks({ reportId, isPaid }: ExploreMoreLinksProps) {
  return (
    <section className="rounded-[1.9rem] border border-slate-200 bg-white p-6 shadow-[0_24px_60px_-34px_rgba(15,23,42,0.3)] transition-colors duration-300 dark:border-slate-800 dark:bg-slate-900 dark:shadow-[0_24px_60px_-34px_rgba(2,6,23,0.8)] sm:p-8">
      <div className="space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
          Continue in Rankshift
        </p>
        <h2 className="text-2xl font-semibold tracking-[-0.03em] text-slate-950 dark:text-white">
          Explore more
        </h2>
        <p className="max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-300">
          Use these product areas for deeper analysis and delivery workflows.
        </p>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {EXPLORE_CARDS.map((card) => {
          const locked = card.paidOnly && !isPaid;
          const href = `/report/${reportId}/${card.slug}`;

          return (
            <a
              key={card.slug}
              href={href}
              className="group rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-5 transition hover:border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600 dark:hover:bg-slate-700"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-lg font-semibold text-slate-950 dark:text-slate-100">{card.title}</h3>
                <span
                  className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${
                    locked
                      ? "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-200"
                      : "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-200"
                  }`}
                >
                  {locked ? "Locked" : "Available"}
                </span>
              </div>
              <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{card.description}</p>
              <p className="mt-3 text-xs font-medium uppercase tracking-[0.13em] text-slate-500 dark:text-slate-400">
                {card.unlocks}
              </p>
              <p className="mt-4 text-sm font-semibold text-sky-700 transition group-hover:text-sky-600 dark:text-sky-300 dark:group-hover:text-sky-200">
                {locked ? "Upgrade to unlock" : card.paidOnly ? "Open" : "Open"}
              </p>
            </a>
          );
        })}
      </div>
    </section>
  );
}
