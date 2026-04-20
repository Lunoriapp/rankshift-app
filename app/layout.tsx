import type { Metadata } from "next";
import { ThemeToggle } from "@/components/theme-toggle";
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
    <html lang="en" suppressHydrationWarning>
      <body className="bg-slate-50 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                try {
                  var storageKey = "theme";
                  var storedTheme = window.localStorage.getItem(storageKey);
                  var theme = storedTheme === "light" || storedTheme === "dark"
                    ? storedTheme
                    : "light";
                  document.documentElement.classList.toggle("dark", theme === "dark");
                  document.documentElement.style.colorScheme = theme;
                } catch (error) {}
              })();
            `,
          }}
        />
        <ThemeToggle />
        {children}
      </body>
    </html>
  );
}
