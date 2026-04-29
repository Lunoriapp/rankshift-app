"use strict";
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ThemeToggle = ThemeToggle;
const react_1 = require("react");
const THEME_STORAGE_KEY = "theme";
function applyTheme(theme) {
    const isDark = theme === "dark";
    document.documentElement.classList.toggle("dark", isDark);
    document.documentElement.style.colorScheme = theme;
}
function getSystemTheme() {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}
function getStoredTheme() {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    return storedTheme === "light" || storedTheme === "dark" ? storedTheme : null;
}
function getActiveTheme() {
    return document.documentElement.classList.contains("dark") ? "dark" : "light";
}
function ThemeToggle() {
    const [theme, setTheme] = (0, react_1.useState)("light");
    const [mounted, setMounted] = (0, react_1.useState)(false);
    (0, react_1.useEffect)(() => {
        var _a;
        const nextTheme = (_a = getStoredTheme()) !== null && _a !== void 0 ? _a : "light";
        applyTheme(nextTheme);
        setTheme(nextTheme);
        setMounted(true);
        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
        const handleSystemThemeChange = (event) => {
            const persistedTheme = getStoredTheme();
            if (!persistedTheme) {
                const systemTheme = event.matches ? "dark" : "light";
                applyTheme(systemTheme);
                setTheme(systemTheme);
            }
        };
        const observer = new MutationObserver(() => {
            setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light");
        });
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ["class"],
        });
        mediaQuery.addEventListener("change", handleSystemThemeChange);
        return () => {
            observer.disconnect();
            mediaQuery.removeEventListener("change", handleSystemThemeChange);
        };
    }, []);
    const toggleTheme = () => {
        const nextTheme = getActiveTheme() === "dark" ? "light" : "dark";
        window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
        applyTheme(nextTheme);
        setTheme(nextTheme);
    };
    return (<button type="button" onClick={toggleTheme} aria-label={mounted ? `Switch to ${theme === "dark" ? "light" : "dark"} mode` : "Toggle theme"} className="fixed right-5 top-5 z-50 inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200/80 bg-white/90 text-slate-700 shadow-[0_14px_30px_-18px_rgba(15,23,42,0.45)] backdrop-blur transition-all duration-300 hover:border-slate-300 hover:bg-white dark:border-slate-700/80 dark:bg-slate-900/90 dark:text-slate-100 dark:hover:border-slate-600 dark:hover:bg-slate-900">
      <span className={`absolute transition-all duration-300 ${mounted && theme === "dark" ? "scale-0 rotate-90 opacity-0" : "scale-100 rotate-0 opacity-100"}`}>
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4.5"/>
          <path d="M12 2.5v2.2M12 19.3v2.2M4.93 4.93l1.56 1.56M17.51 17.51l1.56 1.56M2.5 12h2.2M19.3 12h2.2M4.93 19.07l1.56-1.56M17.51 6.49l1.56-1.56"/>
        </svg>
      </span>
      <span className={`absolute transition-all duration-300 ${mounted && theme === "dark" ? "scale-100 rotate-0 opacity-100" : "scale-0 -rotate-90 opacity-0"}`}>
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.8A8.8 8.8 0 1 1 11.2 3a7.2 7.2 0 0 0 9.8 9.8Z"/>
        </svg>
      </span>
    </button>);
}
