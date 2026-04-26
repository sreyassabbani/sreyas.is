import type { MarkdownHeading } from "astro";

export type TocLink = {
    slug: string;
    text: string;
};

export type TocGroup = TocLink & {
    children: TocLink[];
};

type HeadingSlice = TocLink & {
    depth: number;
};

function sliceHeadings(
    headings: MarkdownHeading[],
    minDepth: number,
    maxDepth: number,
): HeadingSlice[] {
    return headings
        .filter(({ depth }) => depth >= minDepth && depth <= maxDepth)
        .map(({ depth, slug, text }) => ({ depth, slug, text }));
}

function groupHeadings(headings: HeadingSlice[]): TocGroup[] {
    if (headings.length === 0) {
        return [];
    }

    const topLevelDepth = Math.min(...headings.map(({ depth }) => depth));
    const childDepth = topLevelDepth + 1;
    const groups: TocGroup[] = [];

    for (const heading of headings) {
        if (heading.depth === topLevelDepth || groups.length === 0) {
            groups.push({
                slug: heading.slug,
                text: heading.text,
                children: [],
            });
            continue;
        }

        if (heading.depth === childDepth) {
            groups[groups.length - 1].children.push({
                slug: heading.slug,
                text: heading.text,
            });
        }
    }

    return groups;
}

export function getInlineTocGroups(headings: MarkdownHeading[]) {
    return groupHeadings(sliceHeadings(headings, 1, 2));
}

export function getRailTocGroups(headings: MarkdownHeading[]) {
    const primaryHeadings = sliceHeadings(headings, 1, 2);
    const fallbackHeadings = sliceHeadings(headings, 2, 3);

    return groupHeadings(
        primaryHeadings.length > 0 ? primaryHeadings : fallbackHeadings,
    );
}

export const topFallbackTocGroup: TocGroup = {
    slug: "top",
    text: "Top",
    children: [],
};
