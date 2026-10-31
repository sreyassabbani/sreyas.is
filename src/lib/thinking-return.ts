import { readThinkingFilters } from "@/lib/thinking-filters";
import { parseDateSlug } from "@/lib/thinking-range";

const storageKey = "thinking:return";

type ThinkingOrigin = {
    origin: string;
    article: string;
};

function withoutHash(url: URL): string {
    return `${url.origin}${url.pathname}${url.search}`;
}

export function thinkingBackLabel(origin: URL): string {
    const filters = readThinkingFilters(origin.pathname, origin.search);
    let label = "← thinking";
    if (filters.subject) {
        const slug = filters.subjectPath?.split("/").filter(Boolean).at(-1);
        label += slug
            ? ` about ${decodeURIComponent(slug).replaceAll("-", " ")}`
            : " about…";
    }
    if (filters.date) {
        if (!filters.range) return `${label} on…`;
        const format = new Intl.DateTimeFormat("en", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
        const from = parseDateSlug(filters.range.from);
        const to = parseDateSlug(filters.range.to);
        const date =
            filters.range.from === filters.range.to
                ? format.format(from)
                : format.formatRange(from, to);
        label += ` on ${date}`;
    }
    return label;
}

export function rememberThinkingOrigin(articleHref: string) {
    try {
        const origin = new URL(window.location.href);
        const article = new URL(articleHref, origin);
        if (
            article.origin !== origin.origin ||
            !/^\/thinking(?:\/(?:about|on)(?:\/[^/]+)?)?\/?$/.test(
                origin.pathname,
            )
        ) {
            return;
        }
        const record: ThinkingOrigin = {
            origin: withoutHash(origin),
            article: withoutHash(article),
        };
        sessionStorage.setItem(storageKey, JSON.stringify(record));
    } catch {
        // Storage can be unavailable; the ordinary link remains usable.
    }
}

export function restoreThinkingBackLink(link: HTMLAnchorElement) {
    try {
        const stored = sessionStorage.getItem(storageKey);
        if (!stored || !document.referrer) return;
        const record: unknown = JSON.parse(stored);
        if (
            typeof record !== "object" ||
            record === null ||
            !("origin" in record) ||
            !("article" in record) ||
            typeof record.origin !== "string" ||
            typeof record.article !== "string"
        ) {
            return;
        }

        const current = new URL(window.location.href);
        const origin = new URL(record.origin);
        const referrer = new URL(document.referrer);
        if (
            origin.origin !== current.origin ||
            withoutHash(referrer) !== withoutHash(origin) ||
            record.article !== withoutHash(current) ||
            !/^\/thinking(?:\/(?:about|on)(?:\/[^/]+)?)?\/?$/.test(
                origin.pathname,
            )
        ) {
            return;
        }

        link.href = origin.href;
        link.textContent = thinkingBackLabel(origin);
    } catch {
        // Keep the default /thinking link for direct visits or blocked storage.
    }
}
