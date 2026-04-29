"use strict";
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CopyButton = CopyButton;
const react_1 = require("react");
function CopyButton({ value }) {
    const [copied, setCopied] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(false);
    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(value);
            setError(false);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1500);
        }
        catch (_a) {
            setError(true);
            window.setTimeout(() => setError(false), 1500);
        }
    };
    return (<button type="button" onClick={handleCopy} className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 hover:text-slate-950 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-50">
      {copied ? "Copied" : error ? "Failed" : "Copy"}
    </button>);
}
