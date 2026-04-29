"use strict";
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LockedPremiumSection = LockedPremiumSection;
function LockedPremiumSection({ onUnlock, onDismiss, }) {
    return (<section className="relative overflow-hidden rounded-[1.8rem] border border-slate-800 bg-slate-900">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.18),transparent_45%)]"/>
      <div className="relative p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-4">
            {[
            "Keyword gaps",
            "Content topics competitors cover",
            "Suggested headings",
            "Full optimisation plan",
        ].map((item) => (<div key={item} className="rounded-[1.3rem] border border-slate-800/90 bg-slate-950/70 px-4 py-4 text-sm text-slate-300 blur-[1.5px]">
                {item}
              </div>))}
          </div>

          <div className="flex items-center">
            <div className="w-full rounded-[1.6rem] border border-slate-700 bg-slate-950/80 p-6 shadow-[0_24px_60px_-34px_rgba(2,6,23,0.85)] backdrop-blur">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Unlock full competitor breakdown
              </p>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-200">
                <li>See keyword gaps</li>
                <li>Get content structure to outrank them</li>
                <li>Generate full rewrite plan</li>
              </ul>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button type="button" onClick={onUnlock} className="flex-1 rounded-2xl bg-sky-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-400">
                  Unlock competitor insights
                </button>
                <button type="button" onClick={onDismiss} className="flex-1 rounded-2xl border border-slate-700 px-4 py-3 text-sm font-semibold text-slate-300 transition hover:border-slate-600">
                  Maybe later
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>);
}
