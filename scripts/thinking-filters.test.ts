import { describe, expect, test } from "bun:test";
import {
    getThinkingFiltersHref,
    readThinkingFilters,
} from "../src/lib/thinking-filters";
import {
    isInThinkingRange,
    readThinkingRange,
} from "../src/lib/thinking-range";

describe("thinking filter URLs", () => {
    test("preserves a date when adding, changing, and removing a subject", () => {
        const date = readThinkingFilters("/thinking/on/2026-03-24/", "");
        expect(date.range).toEqual({ from: "2026-03-24", to: "2026-03-24" });
        const addSubject = { ...date, subject: true, subjectPath: null };
        expect(getThinkingFiltersHref(addSubject)).toBe(
            "/thinking/about/?from=2026-03-24&to=2026-03-24",
        );
        const selected = {
            ...addSubject,
            subjectPath: "/thinking/about/math/",
        };
        const url = new URL(
            getThinkingFiltersHref(selected),
            "https://example.test",
        );
        expect(readThinkingFilters(url.pathname, url.search)).toEqual(selected);
        expect(
            getThinkingFiltersHref({
                ...selected,
                subject: false,
                subjectPath: null,
            }),
        ).toBe("/thinking/on/?from=2026-03-24&to=2026-03-24");
    });

    test("keeps a subject when adding or removing an empty or selected date", () => {
        const subject = readThinkingFilters("/thinking/about/math/", "");
        const withEmptyDate = { ...subject, date: true };
        expect(getThinkingFiltersHref(withEmptyDate)).toBe(
            "/thinking/about/math/?date=1",
        );
        expect(readThinkingFilters("/thinking/about/math/", "?date=1")).toEqual(
            withEmptyDate,
        );
        const withRange = {
            ...withEmptyDate,
            range: { from: "2026-03-01", to: "2026-03-31" },
        };
        expect(getThinkingFiltersHref(withRange)).toBe(
            "/thinking/about/math/?from=2026-03-01&to=2026-03-31",
        );
        expect(
            getThinkingFiltersHref({ ...withRange, date: false, range: null }),
        ).toBe("/thinking/about/math/");
    });

    test("normalizes valid ranges, rejects invalid dates, and includes both endpoints", () => {
        const range = readThinkingRange("?from=2026-03-31&to=2026-03-01");
        expect(range).toEqual({ from: "2026-03-01", to: "2026-03-31" });
        expect(readThinkingRange("?from=2026-02-30")).toBeNull();
        if (!range) throw new Error("Expected a valid range");
        expect(isInThinkingRange("2026-03-01", range)).toBe(true);
        expect(isInThinkingRange("2026-03-31", range)).toBe(true);
        expect(isInThinkingRange("2026-04-01", range)).toBe(false);
    });
});
