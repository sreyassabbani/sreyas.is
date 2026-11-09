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

/** Components that are purely decorative, so dropping them loses nothing. */
const DECORATIVE_COMPONENTS = new Set(["EllipsisBreak"]);

type Cleaned = { markdown: string; omitted: boolean };

type PageLike = {
    id: string;
    data: { title: string; description: string };
    body?: string;
};

export type ApiLink = { id: string; label: string; url: string };

export type ApiProps = Record<string, string | number | boolean | null>;

/**
 * An entry split into renderable pieces. A component that wraps Markdown
 * becomes a `markdown` block with its name as a `layout` hint; one that stands
 * alone becomes a `widget` with whatever literal props it was given.
 */
export type ApiBlock =
    | { type: "markdown"; text: string; layout?: string }
    | { type: "widget"; name: string; props: ApiProps };

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

type Token =
    | { kind: "text"; value: string }
    | {
          kind: "tag";
          name: string;
          role: "open" | "close" | "self";
          raw: string;
          /** The tag sits on a line of its own. */
          block: boolean;
      };

/** Split MDX into text and component tags, leaving fenced code untouched. */
function tokenize(source: string): Token[] {
    const lines = source.replaceAll("\r\n", "\n").split("\n");
    const tokens: Token[] = [];
    let fence: string | null = null;
    let prose: string[] = [];

    const flush = () => {
        if (prose.length === 0) return;
        tokens.push(...scanProse(`${prose.join("\n")}\n`));
        prose = [];
    };

    for (const line of lines) {
        const marker = line.match(/^\s*(`{3,}|~{3,})/)?.[1];

        if (fence) {
            tokens.push({ kind: "text", value: `${line}\n` });
            if (marker?.[0] === fence[0] && marker.length >= fence.length) {
                fence = null;
            }
        } else if (marker) {
            flush();
            fence = marker;
            tokens.push({ kind: "text", value: `${line}\n` });
        } else {
            prose.push(line);
        }
    }
    flush();

    return tokens;
}

function scanProse(raw: string): Token[] {
    const text = raw
        // `import x from "y"` (possibly multi-line) and `import "y"`.
        .replaceAll(/^import\s[^;]*?from\s+["'][^"']+["'];?[ \t]*$/gm, "")
        .replaceAll(/^import\s+["'][^"']+["'];?[ \t]*$/gm, "")
        .replaceAll(/^export\s+.*$/gm, "")
        .replaceAll(/\{\/\*[\s\S]*?\*\/\}/g, "");

    const tokens: Token[] = [];
    let index = 0;
    let textStart = 0;

    while (index < text.length) {
        const start = text.indexOf("<", index);
        if (start === -1) break;

        const next = text[start + 1] ?? "";
        const isClosing = next === "/" && /[A-Z]/.test(text[start + 2] ?? "");
        const end =
            /[A-Z]/.test(next) || isClosing ? findTagEnd(text, start) : -1;

        if (end === -1) {
            index = start + 1;
            continue;
        }

        const tag = text.slice(start, end + 1);
        const lineStart = text.lastIndexOf("\n", start - 1) + 1;
        const lineEnd = text.indexOf("\n", end);
        const before = text.slice(lineStart, start);
        const after = text.slice(end + 1, lineEnd === -1 ? undefined : lineEnd);

        if (start > textStart) {
            tokens.push({ kind: "text", value: text.slice(textStart, start) });
        }
        tokens.push({
            kind: "tag",
            name: tag.match(/^<\/?([A-Z][A-Za-z0-9_.]*)/)?.[1] ?? "",
            role: isClosing ? "close" : tag.endsWith("/>") ? "self" : "open",
            raw: tag,
            block: !before.trim() && !after.trim(),
        });
        index = end + 1;
        textStart = index;
    }

    if (textStart < text.length) {
        tokens.push({ kind: "text", value: text.slice(textStart) });
    }

    return tokens;
}

function tidy(markdown: string) {
    return markdown.replaceAll(/\n{3,}/g, "\n\n").trim();
}

/**
 * Turn the MDX source of an entry into plain Markdown: drop `import`/`export`
 * lines, MDX comments and JSX component tags (keeping a component's children),
 * and report whether anything visual or interactive was removed.
 *
 * Fenced code is left untouched.
 */
export function mdxToMarkdown(source: string): Cleaned {
    let markdown = "";
    let omitted = false;

    for (const token of tokenize(source)) {
        if (token.kind === "text") {
            markdown += token.value;
        } else if (
            token.role === "self" &&
            !DECORATIVE_COMPONENTS.has(token.name)
        ) {
            omitted = true;
        }
    }

    return { markdown: `${tidy(markdown)}\n`, omitted };
}

export function kebabCase(name: string) {
    return name
        .replaceAll(/([a-z0-9])([A-Z])/g, "$1-$2")
        .replaceAll(".", "-")
        .toLowerCase();
}

/** Literal props of a component tag; expressions that need code are skipped. */
export function parseProps(tag: string): ApiProps {
    const props: ApiProps = {};
    const body = tag.replace(/^<[A-Za-z0-9_.]+/, "").replace(/\/?>$/, "");
    const pattern =
        /([A-Za-z_][\w:-]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|\{([^{}]*)\}))?/g;

    for (const match of body.matchAll(pattern)) {
        const [, name, double, single, expression] = match;
        if (name.includes(":")) continue;

        if (double !== undefined || single !== undefined) {
            props[name] = double ?? single ?? "";
        } else if (expression !== undefined) {
            try {
                const value: unknown = JSON.parse(expression.trim());
                if (
                    value === null ||
                    ["string", "number", "boolean"].includes(typeof value)
                ) {
                    props[name] = value as string | number | boolean | null;
                }
            } catch {
                // An identifier or real code: only the web can evaluate it.
            }
        } else {
            props[name] = true;
        }
    }

    return props;
}

/** Split an entry into Markdown blocks (with layout hints) and widgets. */
export function mdxToBlocks(source: string): ApiBlock[] {
    const blocks: ApiBlock[] = [];
    let buffer = "";
    let wrapper: { name: string; depth: number } | null = null;

    const flush = () => {
        const text = tidy(buffer);
        buffer = "";
        if (!text) return;
        blocks.push(
            wrapper
                ? { type: "markdown", text, layout: kebabCase(wrapper.name) }
                : { type: "markdown", text },
        );
    };

    for (const token of tokenize(source)) {
        if (token.kind === "text") {
            buffer += token.value;
            continue;
        }

        if (token.role === "self") {
            if (DECORATIVE_COMPONENTS.has(token.name)) {
                buffer += "\n\n";
            } else if (token.block) {
                flush();
                blocks.push({
                    type: "widget",
                    name: kebabCase(token.name),
                    props: parseProps(token.raw),
                });
            }
            continue;
        }

        if (wrapper && token.name === wrapper.name) {
            wrapper.depth += token.role === "open" ? 1 : -1;
            if (wrapper.depth === 0) {
                flush();
                wrapper = null;
            }
            continue;
        }

        if (!wrapper && token.role === "open" && token.block) {
            flush();
            wrapper = { name: token.name, depth: 1 };
        }
    }
    flush();

    return blocks;
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
        blocks: mdxToBlocks(page.body ?? ""),
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
        blocks: mdxToBlocks(entry.body ?? ""),
    };
}
