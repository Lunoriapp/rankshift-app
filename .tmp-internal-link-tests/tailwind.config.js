"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config = {
    darkMode: "class",
    content: [
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            fontSize: {
                "6xl": ["2.75rem", { lineHeight: "1.2" }],
            },
        },
    },
    plugins: [],
};
exports.default = config;
