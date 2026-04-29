"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.metadata = void 0;
exports.default = RootLayout;
const google_1 = require("next/font/google");
require("./globals.css");
const poppins = (0, google_1.Poppins)({
    subsets: ["latin"],
    weight: ["400", "500", "600"],
    display: "swap",
    variable: "--font-poppins",
});
const inter = (0, google_1.Inter)({
    subsets: ["latin"],
    display: "swap",
    variable: "--font-inter",
});
exports.metadata = {
    title: "Rankshift",
    description: "Rankshift helps teams find what to fix, where to link, and how to improve SEO faster.",
};
function RootLayout({ children }) {
    return (<html lang="en">
      <body className={`${poppins.variable} ${inter.variable} bg-slate-50 text-slate-900`}>
        {children}
      </body>
    </html>);
}
