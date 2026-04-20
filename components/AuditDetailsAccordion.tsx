"use client";

import type { ReactNode } from "react";

interface AuditDetailsAccordionSection {
  id: string;
  title: string;
  description: string;
  content: ReactNode;
}

interface AuditDetailsAccordionProps {
  sections: AuditDetailsAccordionSection[];
  openSectionIds: string[];
  onToggleSection: (id: string) => void;
}

export function AuditDetailsAccordion({
  sections,
  openSectionIds,
  onToggleSection,
}: AuditDetailsAccordionProps) {
  return (
    <section className="space-y-4">
      {sections.map((section) => {
        const isOpen = openSectionIds.includes(section.id);

        return (
          <div
            key={section.id}
            className="overflow-hidden rounded-[1.6rem] border border-slate-800 bg-slate-900"
          >
            <button
              type="button"
              onClick={() => onToggleSection(section.id)}
              className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left transition hover:bg-slate-800/70 sm:px-6"
            >
              <div>
                <p className="text-lg font-semibold tracking-[-0.02em] text-white">{section.title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">{section.description}</p>
              </div>
              <span className="text-2xl leading-none text-slate-400">{isOpen ? "−" : "+"}</span>
            </button>

            {isOpen ? <div className="border-t border-slate-800 px-5 py-5 sm:px-6">{section.content}</div> : null}
          </div>
        );
      })}
    </section>
  );
}
