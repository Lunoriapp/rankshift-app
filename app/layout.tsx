import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rankshift",
  description: "Rankshift helps teams find what to fix, where to link, and how to improve SEO faster.",
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900">
        {children}
      </body>
    </html>
  );
}
