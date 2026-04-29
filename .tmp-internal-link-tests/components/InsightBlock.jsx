"use strict";
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InsightBlock = InsightBlock;
function InsightBlock({ reasons, fixes }) {
    return (<div className="grid gap-4 lg:grid-cols-2">
      <section className="rounded-[1.6rem] bg-slate-900 px-5 py-5 shadow-[0_18px_42px_-30px_rgba(2,6,23,0.65)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
          You are being outranked because:
        </p>
        <ul className="mt-4 space-y-3">
          {reasons.map((reason) => (<li key={reason} className="flex items-start gap-3 text-sm leading-6 text-slate-200">
              <span className="mt-2 h-2 w-2 rounded-full bg-red-400"/>
              <span>{reason}</span>
            </li>))}
        </ul>
      </section>

      <section className="rounded-[1.6rem] bg-slate-900 px-5 py-5 shadow-[0_18px_42px_-30px_rgba(2,6,23,0.65)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
          What to fix first:
        </p>
        <ul className="mt-4 space-y-3">
          {fixes.map((fix) => (<li key={fix} className="flex items-start gap-3 text-sm leading-6 text-slate-200">
              <span className="mt-2 h-2 w-2 rounded-full bg-sky-400"/>
              <span>{fix}</span>
            </li>))}
        </ul>
      </section>
    </div>);
}
