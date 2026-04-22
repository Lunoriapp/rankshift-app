import Link from "next/link";

const resources = [
  {
    title: "Internal linking playbook",
    description: "How to choose contextual anchors and strengthen topic clusters.",
  },
  {
    title: "SEO audit checklist",
    description: "A practical checklist for metadata, headings, links, and performance.",
  },
  {
    title: "Fix prioritization guide",
    description: "Decide what to fix first based on impact and effort.",
  },
  {
    title: "Content refresh framework",
    description: "Keep pages current and maintain ranking momentum over time.",
  },
];

export default function ResourcesPage() {
  return (
    <main className="min-h-screen bg-[#f6f7fb] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1100px] rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_24px_80px_-50px_rgba(15,23,42,0.35)] sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600">Resources</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
          Guides to help you execute SEO faster
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
          Useful reference content for teams implementing ongoing SEO improvements.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {resources.map((resource) => (
            <article key={resource.title} className="rounded-xl border border-slate-200 bg-slate-50 p-5">
              <h2 className="text-lg font-semibold text-slate-950">{resource.title}</h2>
              <p className="mt-2 text-sm text-slate-600">{resource.description}</p>
            </article>
          ))}
        </div>

        <div className="mt-8">
          <Link
            href="/"
            className="inline-flex rounded-xl bg-[linear-gradient(135deg,#4f46e5,#4338ca)] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-105"
          >
            Run an audit
          </Link>
        </div>
      </div>
    </main>
  );
}
