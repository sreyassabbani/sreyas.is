// A date range is kept in the URL as ?from=yyyy-MM-dd&to=yyyy-MM-dd.

export type ThinkingRange = Readonly<{ from: string; to: string }>;

export const thinkingOnRoot = "/thinking/on/";

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

const longDate = new Intl.DateTimeFormat("en", {
    month: "long",
    day: "numeric",
    year: "numeric",
});
const longDateNoYear = new Intl.DateTimeFormat("en", {
    month: "long",
    day: "numeric",
});

export function parseDateSlug(dateSlug: string): Date {
    return new Date(`${dateSlug}T12:00:00`);
}

export function readThinkingRange(search: string): ThinkingRange | null {
    const params = new URLSearchParams(search);
    const from = params.get("from");
    const to = params.get("to") ?? from;

    const valid = (value: string) => {
        if (!datePattern.test(value)) return false;
        const date = parseDateSlug(value);
        return (
            !Number.isNaN(date.valueOf()) &&
            `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}` ===
                value
        );
    };
    if (!from || !to || !valid(from) || !valid(to)) {
        return null;
    }

    return from <= to ? { from, to } : { from: to, to: from };
}

export function getThinkingRangeHref(range: ThinkingRange | null): string {
    if (!range) {
        return thinkingOnRoot;
    }

    const params = new URLSearchParams({ from: range.from, to: range.to });
    return `${thinkingOnRoot}?${params}`;
}

export function isInThinkingRange(dateSlug: string, range: ThinkingRange) {
    return dateSlug >= range.from && dateSlug <= range.to;
}

export function describeEmptyThinkingRange(range: ThinkingRange): string {
    const from = parseDateSlug(range.from);
    const to = parseDateSlug(range.to);

    if (range.from === range.to) {
        return `No posts on ${longDate.format(from)}.`;
    }

    const sameYear = from.getFullYear() === to.getFullYear();
    const start = (sameYear ? longDateNoYear : longDate).format(from);
    return `No posts between ${start} and ${longDate.format(to)}.`;
}
