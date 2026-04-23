"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";

const navItems = [
  { label: "Features", href: "/features" },
  { label: "How It Works", href: "/how-it-works" },
  { label: "Pricing", href: "/pricing" },
  { label: "Resources", href: "/resources" },
];

function isActivePath(pathname: string, href: string): boolean {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MarketingSiteHeader() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuId = useId();

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  return (
    <header className="border-b border-slate-100 px-6 py-5 sm:px-8 lg:px-10">
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/"
          aria-label="Go to Rankshift homepage"
          className="text-4xl font-semibold tracking-tight text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
        >
          Rankshift
        </Link>

        <nav aria-label="Primary navigation" className="hidden items-center gap-9 text-sm font-medium text-slate-600 lg:flex">
          {navItems.map((item) => {
            const isActive = isActivePath(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 ${
                  isActive ? "text-slate-900" : "hover:text-slate-900"
                }`}
              >
                <span className={`border-b pb-1 ${isActive ? "border-indigo-500" : "border-transparent"}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-4 sm:flex">
          <Link
            href="/reports"
            className="text-sm font-semibold text-slate-700 transition hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
          >
            Log in
          </Link>
          <Link
            href="/#start-audit"
            className="rounded-xl bg-[linear-gradient(135deg,#4f46e5,#4338ca)] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_24px_-16px_rgba(79,70,229,0.95)] transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
          >
            Start Free Audit
          </Link>
        </div>

        <button
          type="button"
          className="inline-flex items-center justify-center rounded-lg border border-slate-200 p-2 text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 lg:hidden"
          aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-controls={mobileMenuId}
          aria-expanded={isMobileMenuOpen}
          onClick={() => setIsMobileMenuOpen((open) => !open)}
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
            {isMobileMenuOpen ? (
              <path d="M6 6 18 18M18 6 6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </div>

      <div
        id={mobileMenuId}
        className={`overflow-hidden transition-all duration-200 ease-out lg:hidden ${
          isMobileMenuOpen ? "mt-4 max-h-[420px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <nav aria-label="Mobile navigation" className="space-y-1 border-t border-slate-100 pt-4">
          {navItems.map((item) => {
            const isActive = isActivePath(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`block rounded-lg px-3 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 ${
                  isActive ? "bg-indigo-50 text-indigo-700" : "text-slate-700 hover:bg-slate-50 hover:text-slate-950"
                }`}
              >
                {item.label}
              </Link>
            );
          })}

          <div className="mt-3 flex flex-col gap-2 pt-2 sm:hidden">
            <Link
              href="/reports"
              className="inline-flex justify-center rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
            >
              Log in
            </Link>
            <Link
              href="/#start-audit"
              className="inline-flex justify-center rounded-xl bg-[linear-gradient(135deg,#4f46e5,#4338ca)] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_24px_-16px_rgba(79,70,229,0.95)] transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
            >
              Start Free Audit
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
