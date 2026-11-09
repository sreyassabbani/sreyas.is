import { SITE_DESCRIPTION, SITE_TITLE, SITE_URL } from "../consts";
import {
    getDateSlug,
    getThinkingHref,
    normalizeTag,
    sortByNewest,
    type ThinkingEntry,
} from "./thinking";

/**
 * Machine-readable view of the site, consumed by the `sreyas.is` CLI.
 *
 * This is a public contract: bump API_VERSION and the `/api/v<N>/` path
 * together for any breaking change, and keep the old version served.
 */
export const API_VERSION = 1;
export const API_ROOT = `/api/v${API_VERSION}`;

/** Pages whose JSX is purely decorative, so dropping them loses nothing. */
const DECORATIVE_COMPONENTS = new Set(["EllipsisBreak"]);

type Cleaned = { markdown: string; omitted: boolean };

type PageLike = {
    id: string;
    data: { title: string; description: string };
    body?: string;
};

export type ApiLink = { id: string; label: string; url: string };

export const API_LINKS: ApiLink[] = [
    {
        id: "github",
        label: "GitHub",
        url: "https://github.com/sreyassabbani",
    },
];

export function absolute(path: string) {
    return new URL(path, SITE_URL).toString();
}

export function pageHref(id: string) {
    return `/${id}/`;
}

export function entryApiHref(kind: "pages" | "thinking", id: string) {
    return `${API_ROOT}/${kind}/${id}.json`;
}

/**
 * Turn the MDX source of an entry into plain Markdown: drop `import`/`export`
 * lines, MDX comments and JSX component tags (keeping a component's children),
 * and report whether anything visual or interactive was removed.
 *
 * Fenced code is left untouched.
 */
export function mdxToMarkdown(source: string): Cleaned {
    const lines = source.replaceAll("\r\n", "\n").split("\n");
    const out: string[] = [];
    let fence: string | null = null;
    let omitted = false;
    let prose: string[] = [];

    const flush = () => {
        if (prose.length === 0) return;
        const cleaned = stripJsx(prose.join("\n"));
        omitted ||= cleaned.omitted;
        out.push(cleaned.markdown);
        prose = [];
    };

    for (const line of lines) {
        const marker = line.match(/^\s*(`{3,}|~{3,})/)?.[1];

        if (fence) {
            out.push(line);
            if (marker?.[0] === fence[0] && marker.length >= fence.length) {
                fence = null;
            }
        } else if (marker) {
            flush();
            fence = marker;
            out.push(line);
        } else {
            prose.push(line);
        }
    }
    flush();

    return {
        markdown: `${out
            .join("\n")
            .replaceAll(/\n{3,}/g, "\n\n")
            .trim()}\n`,
        omitted,
    };
}

function stripJsx(text: string): Cleaned {
    let omitted = false;

    let result = text
        // `import x from "y"` (possibly multi-line) and `import "y"`.
        .replaceAll(/^import\s[^;]*?from\s+["'][^"']+["'];?[ \t]*$/gm, "")
        .replaceAll(/^import\s+["'][^"']+["'];?[ \t]*$/gm, "")
        .replaceAll(/^export\s+.*$/gm, "")
        .replaceAll(/\{\/\*[\s\S]*?\*\/\}/g, "");

    let output = "";
    let index = 0;

    while (index < result.length) {
        const start = result.indexOf("<", index);
        if (start === -1) {
            output += result.slice(index);
            break;
        }

        const next = result[start + 1] ?? "";
        const isClosing = next === "/" && /[A-Z]/.test(result[start + 2] ?? "");
        const isOpening = /[A-Z]/.test(next);

        if (!isOpening && !isClosing) {
            output += result.slice(index, start + 1);
            index = start + 1;
            continue;
        }

        const end = findTagEnd(result, start);
        if (end === -1) {
            output += result.slice(index, start + 1);
            index = start + 1;
            continue;
        }

        const tag = result.slice(start, end + 1);
        const name = tag.match(/^<\/?([A-Z][A-Za-z0-9_.]*)/)?.[1] ?? "";
        const selfClosing = !isClosing && tag.endsWith("/>");

        // A component that wraps prose (e.g. a margin note) keeps its text;
        // one that stands alone is a visual or interactive element.
        if (selfClosing && !DECORATIVE_COMPONENTS.has(name)) omitted = true;

        output += result.slice(index, start);
        index = end + 1;
    }

    result = output;
    return { markdown: result, omitted };
}

/** Index of the `>` that closes the tag starting at `start`, honoring quotes and braces. */
function findTagEnd(text: string, start: number) {
    let depth = 0;
    let quote: string | null = null;

    for (let i = start + 1; i < text.length; i++) {
        const char = text[i];

        if (quote) {
            if (char === quote) quote = null;
        } else if (depth > 0) {
            if (char === "{") depth++;
            else if (char === "}") depth--;
            else if (char === '"' || char === "'" || char === "`") quote = char;
        } else if (char === "{") {
            depth++;
        } else if (char === '"' || char === "'") {
            quote = char;
        } else if (char === ">") {
            return i;
        }
    }

    return -1;
}

export function buildIndex(pages: PageLike[], entries: ThinkingEntry[]) {
    return {
        version: API_VERSION,
        site: SITE_URL,
        title: SITE_TITLE,
        description: SITE_DESCRIPTION,
        pages: pages
            .map((page) => ({
                id: page.id,
                title: page.data.title,
                description: page.data.description,
                url: absolute(pageHref(page.id)),
                api: absolute(entryApiHref("pages", page.id)),
            }))
            .sort((a, b) => a.id.localeCompare(b.id)),
        thinking: sortByNewest(entries).map((entry) => ({
            id: entry.id,
            title: entry.data.title,
            description: entry.data.description,
            type: entry.data.type,
            date: getDateSlug(entry.data.pubDate),
            tags: entry.data.tags.map(normalizeTag),
            url: absolute(getThinkingHref(entry)),
            api: absolute(entryApiHref("thinking", entry.id)),
        })),
        links: API_LINKS,
    };
}

export function buildPage(page: PageLike) {
    const { markdown, omitted } = mdxToMarkdown(page.body ?? "");

    return {
        version: API_VERSION,
        kind: "page" as const,
        id: page.id,
        title: page.data.title,
        description: page.data.description,
        url: absolute(pageHref(page.id)),
        format: "markdown" as const,
        omitted,
        body: markdown,
    };
}

export function buildThinking(entry: ThinkingEntry) {
    const { markdown, omitted } = mdxToMarkdown(entry.body ?? "");

    return {
        version: API_VERSION,
        kind: "thinking" as const,
        id: entry.id,
        title: entry.data.title,
        description: entry.data.description,
        type: entry.data.type,
        date: getDateSlug(entry.data.pubDate),
        updated: entry.data.updatedDate
            ? getDateSlug(entry.data.updatedDate)
            : null,
        tags: entry.data.tags.map(normalizeTag),
        url: absolute(getThinkingHref(entry)),
        format: "markdown" as const,
        omitted,
        body: markdown,
    };
}
