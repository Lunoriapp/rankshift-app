"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mockSeoTasks = void 0;
exports.getSeoTaskProgressSummary = getSeoTaskProgressSummary;
exports.mockSeoTasks = [
    {
        id: "meta-home-title",
        category: "Meta",
        title: "Rewrite the homepage title tag for stronger intent match",
        whatIsWrong: "The current title is generic and does not reflect the core commercial keyword theme.",
        whyItMatters: "Title tags are one of the strongest on-page relevance signals and heavily influence search click-through.",
        whatToDo: "Update the title to lead with the primary keyword, keep it concise, and make the value proposition obvious.",
        priority: "High",
        completionState: "open",
        dateCompleted: null,
    },
    {
        id: "headings-services-h1",
        category: "Headings",
        title: "Fix duplicate H1 patterns across service pages",
        whatIsWrong: "Several key landing pages use near-identical H1s, which weakens topical clarity.",
        whyItMatters: "Clear page-level heading structure helps search engines understand intent and makes pages easier to scan for users.",
        whatToDo: "Give each service page a distinct H1 aligned to its specific offer and supporting keyword target.",
        priority: "High",
        completionState: "open",
        dateCompleted: null,
    },
    {
        id: "images-alt-missing",
        category: "Images",
        title: "Add descriptive alt text to missing images",
        whatIsWrong: "Product and service-supporting images are missing alt text or use placeholder filenames.",
        whyItMatters: "Alt text improves accessibility and gives search engines more context about visual content.",
        whatToDo: "Add short descriptive alt text that explains the image and supports surrounding page intent without stuffing keywords.",
        priority: "Medium",
        completionState: "completed",
        dateCompleted: "2026-04-16T14:20:00.000Z",
    },
    {
        id: "schema-services",
        category: "Schema",
        title: "Implement service schema on primary conversion pages",
        whatIsWrong: "Important service pages are missing structured data that could clarify the page type and offering.",
        whyItMatters: "Schema helps search engines interpret your content more reliably and can improve eligibility for richer search results.",
        whatToDo: "Add valid service schema with accurate business and offer details, then validate it in your QA flow.",
        priority: "Medium",
        completionState: "open",
        dateCompleted: null,
    },
    {
        id: "performance-lcp",
        category: "Performance",
        title: "Reduce hero image weight on the homepage",
        whatIsWrong: "The main hero asset is oversized and likely slowing Largest Contentful Paint.",
        whyItMatters: "Slow load performance hurts user experience and can weaken both rankings and conversion rates.",
        whatToDo: "Compress the asset, serve responsive sizes, and ensure the browser is not downloading a larger image than needed.",
        priority: "High",
        completionState: "open",
        dateCompleted: null,
    },
    {
        id: "internal-linking-cluster",
        category: "Internal Linking",
        title: "Add supporting links from blog content into money pages",
        whatIsWrong: "Informational articles are not consistently linking into your core service pages.",
        whyItMatters: "Internal links pass context and authority, helping important pages earn stronger visibility over time.",
        whatToDo: "Add natural in-content links from relevant blog posts into the most valuable commercial pages using descriptive anchor text.",
        priority: "Medium",
        completionState: "open",
        dateCompleted: null,
    },
];
function getSeoTaskProgressSummary(tasks) {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((task) => task.completionState === "completed").length;
    const openTasks = totalTasks - completedTasks;
    const highPriorityOpenTasks = tasks.filter((task) => task.priority === "High" && task.completionState === "open").length;
    const completionPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    return {
        totalTasks,
        completedTasks,
        openTasks,
        highPriorityOpenTasks,
        completionPercent,
    };
}
