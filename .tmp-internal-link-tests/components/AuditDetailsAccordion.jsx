"use strict";
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditDetailsAccordion = AuditDetailsAccordion;
function AuditDetailsAccordion({ sections, openSectionIds, onToggleSection, }) {
    return (<section className="space-y-4">
      {sections.map((section) => {
            const isOpen = openSectionIds.includes(section.id);
            return (<div key={section.id} className="overflow-hidden rounded-[1.6rem] border border-slate-200 bg-white transition-colors duration-300 dark:border-slate-800 dark:bg-slate-900">
            <button type="button" onClick={() => onToggleSection(section.id)} className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left transition hover:bg-slate-100 dark:hover:bg-slate-800/70 sm:px-6">
              <div>
                <p className="text-lg font-semibold tracking-[-0.02em] text-slate-950 dark:text-white">{section.title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{section.description}</p>
              </div>
              <span className="text-2xl leading-none text-slate-500 dark:text-slate-400">{isOpen ? "−" : "+"}</span>
            </button>

            {isOpen ? <div className="border-t border-slate-200 dark:border-slate-800 px-5 py-5 sm:px-6">{section.content}</div> : null}
          </div>);
        })}
    </section>);
}
