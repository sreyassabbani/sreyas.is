import type { CollectionEntry } from "astro:content";

export type ThinkingEntry = CollectionEntry<"blog">;
export type ThinkingType = ThinkingEntry["data"]["type"];

export const thinkingRoot = "/thinking";

const dateFormatter = new Intl.DateTimeFormat("en", {
    month: "long",
    day: "numeric",
    year: "numeric",
});

export function sortByNewest(entries: ThinkingEntry[]) {
    return [...entries].sort(
        (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf(),
    );
}

export function isLongEntry(entry: ThinkingEntry) {
    return entry.data.type === "long";
}

export function isShortEntry(entry: ThinkingEntry) {
    return entry.data.type === "short";
}

export function getThinkingHref(entry: ThinkingEntry) {
    return isLongEntry(entry)
        ? `${thinkingRoot}/${entry.id}/`
        : `${thinkingRoot}/on/${getDateSlug(entry.data.pubDate)}#${entry.id}`;
}

export function getDateSlug(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

export function formatThinkingDate(date: Date) {
    return dateFormatter.format(date);
}

export function normalizeTag(tag: string) {
    return tag
        .trim()
        .toLowerCase()
        .replaceAll("&", "and")
        .replaceAll(/[^a-z0-9]+/g, "-")
        .replaceAll(/^-|-$/g, "");
}

export function formatTag(tag: string) {
    return tag
        .split("-")
        .filter(Boolean)
        .map((part) => part[0].toUpperCase() + part.slice(1))
        .join(" ");
}

export function getTagHref(tag: string) {
    return `${thinkingRoot}/about/${normalizeTag(tag)}/`;
}

export function getAllTags(entries: ThinkingEntry[]) {
    return Array.from(
        new Set(entries.flatMap((entry) => entry.data.tags.map(normalizeTag))),
    ).sort((a, b) => a.localeCompare(b));
}

export function getEntriesForTag(entries: ThinkingEntry[], tagSlug: string) {
    return sortByNewest(
        entries.filter((entry) =>
            entry.data.tags.some((tag) => normalizeTag(tag) === tagSlug),
        ),
    );
}

export function groupEntriesByDate(entries: ThinkingEntry[]) {
    const groups = new Map<string, ThinkingEntry[]>();

    for (const entry of sortByNewest(entries)) {
        const dateSlug = getDateSlug(entry.data.pubDate);
        groups.set(dateSlug, [...(groups.get(dateSlug) ?? []), entry]);
    }

    return Array.from(groups.entries()).map(([dateSlug, groupedEntries]) => ({
        dateSlug,
        date: groupedEntries[0].data.pubDate,
        entries: groupedEntries,
        longEntries: groupedEntries.filter(isLongEntry),
        shortEntries: groupedEntries.filter(isShortEntry),
    }));
}
