import { readThinkingRange, type ThinkingRange } from "@/lib/thinking-range";

export type ThinkingFilters = Readonly<{
    subject: boolean;
    subjectPath: string | null;
    date: boolean;
    range: ThinkingRange | null;
}>;

export const thinkingFiltersEvent = "thinking:filters";

/** Interpret the existing static routes and the optional range query together. */
export function readThinkingFilters(
    pathname: string,
    search: string,
): ThinkingFilters {
    const subject = /^\/thinking\/about(?:\/|$)/.test(pathname);
    const onDate = /^\/thinking\/on(?:\/|$)/.test(pathname);
    const day = pathname.match(/^\/thinking\/on\/(\d{4}-\d{2}-\d{2})\/?$/)?.[1];
    const range =
        readThinkingRange(search) ??
        (day ? readThinkingRange(`?from=${day}`) : null);
    const params = new URLSearchParams(search);

    return {
        subject,
        subjectPath:
            subject && !/^\/thinking\/about\/?$/.test(pathname)
                ? `${pathname.replace(/\/$/, "")}/`
                : null,
        date:
            onDate ||
            (subject && (params.get("date") === "1" || range !== null)),
        range,
    };
}

/** Produce a static route plus query that can be opened or shared directly. */
export function getThinkingFiltersHref(filters: ThinkingFilters): string {
    const pathname = filters.subject
        ? (filters.subjectPath ?? "/thinking/about/")
        : filters.date
          ? "/thinking/on/"
          : "/thinking/";
    const params = new URLSearchParams();
    if (filters.date && filters.range) {
        params.set("from", filters.range.from);
        params.set("to", filters.range.to);
    } else if (filters.subject && filters.date) {
        params.set("date", "1");
    }
    const search = params.toString();
    return search ? `${pathname}?${search}` : pathname;
}
