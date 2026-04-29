"use strict";
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComparisonTable = ComparisonTable;
function toneClasses(tone) {
    if (tone === "strong") {
        return "text-emerald-700 dark:text-emerald-300";
    }
    if (tone === "weak") {
        return "text-red-700 dark:text-red-300";
    }
    return "text-slate-700 dark:text-slate-200";
}
function indicatorClasses(tone) {
    if (tone === "strong") {
        return "bg-emerald-400";
    }
    if (tone === "weak") {
        return "bg-red-400";
    }
    return "bg-slate-500";
}
function ComparisonTable({ data, rows }) {
    var _a, _b, _c, _d;
    const competitorAName = (_b = (_a = data.competitors[0]) === null || _a === void 0 ? void 0 : _a.name) !== null && _b !== void 0 ? _b : "Competitor";
    const competitorBName = (_d = (_c = data.competitors[1]) === null || _c === void 0 ? void 0 : _c.name) !== null && _d !== void 0 ? _d : "N/A";
    return (<div className="overflow-hidden rounded-[1.8rem] border border-slate-200 bg-white shadow-[0_24px_60px_-34px_rgba(15,23,42,0.3)] transition-colors duration-300 dark:border-slate-800 dark:bg-slate-900 dark:shadow-[0_24px_60px_-34px_rgba(2,6,23,0.7)]">
      <div className="grid grid-cols-[1.15fr_0.95fr_0.95fr_0.95fr] gap-px bg-slate-200 dark:bg-slate-800">
        <div className="bg-white px-4 py-4 dark:bg-slate-900"/>
        <div className="bg-white px-4 py-4 dark:bg-slate-900">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            Your Page
          </p>
        </div>
        <div className="bg-white px-4 py-4 dark:bg-slate-900">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            {competitorAName}
          </p>
        </div>
        <div className="bg-white px-4 py-4 dark:bg-slate-900">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            {competitorBName}
          </p>
        </div>

        {rows.map((row) => (<div key={row.key} className="contents">
            <div key={`${row.key}-label`} className="bg-white px-4 py-4 dark:bg-slate-900">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{row.label}</p>
            </div>
            <div key={`${row.key}-user`} className="bg-white px-4 py-4 dark:bg-slate-900">
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${indicatorClasses(row.userTone)}`}/>
                <span className={`text-sm font-semibold ${toneClasses(row.userTone)}`}>
                  {row.userValue}
                </span>
              </div>
            </div>
            <div key={`${row.key}-a`} className="bg-white px-4 py-4 dark:bg-slate-900">
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${indicatorClasses(row.competitorATone)}`}/>
                <span className={`text-sm font-semibold ${toneClasses(row.competitorATone)}`}>
                  {row.competitorAValue}
                </span>
              </div>
            </div>
            <div key={`${row.key}-b`} className="bg-white px-4 py-4 dark:bg-slate-900">
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${indicatorClasses(row.competitorBTone)}`}/>
                <span className={`text-sm font-semibold ${toneClasses(row.competitorBTone)}`}>
                  {row.competitorBValue}
                </span>
              </div>
            </div>
          </div>))}
      </div>
    </div>);
}
