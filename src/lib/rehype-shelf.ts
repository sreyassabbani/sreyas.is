// Lays out `<Shelf>` blocks in content: plain Markdown where each `## label`
// starts a row and the paragraphs under it are that row's lines. Content stays
// readable Markdown (and so renders in the CLI), while the page gets the
// two-column layout.

export interface ShelfNode {
    type: string;
    tagName?: string;
    name?: string | null;
    value?: string;
    children?: ShelfNode[];
    properties?: Record<string, unknown>;
}

const sectionClass = ["grid", "gap-3", "py-5", "sm:grid-cols-[7rem_1fr]"];
const labelClass = [
    "m-0",
    "translate-y-[0.4375rem]",
    "font-mono",
    "text-xs",
    "font-normal",
    "leading-4",
    "text-muted-foreground",
];
const linesClass = ["space-y-0.5", "text-sm", "leading-7", "text-foreground"];

function element(
    tagName: string,
    className: string[] | undefined,
    children: ShelfNode[],
): ShelfNode {
    return {
        type: "element",
        tagName,
        properties: className ? { className } : {},
        children,
    };
}

function isBlank(node: ShelfNode) {
    return node.type === "text" && !node.value?.trim();
}

function markLinks(node: ShelfNode) {
    if (node.type === "element" && node.tagName === "a") {
        const properties = node.properties ?? {};
        const existing = properties.className;
        const classes = Array.isArray(existing) ? existing : [];
        if (!classes.includes("text-link")) {
            properties.className = [...classes, "text-link"];
        }
        node.properties = properties;
    }
    node.children?.forEach(markLinks);
}

function layoutShelf(shelf: ShelfNode): ShelfNode {
    const sections: ShelfNode[] = [];
    let lines: ShelfNode[] | null = null;

    for (const child of shelf.children ?? []) {
        if (isBlank(child)) continue;

        if (child.type === "element" && child.tagName === "h2") {
            lines = [];
            sections.push(
                element("section", sectionClass, [
                    element("h2", labelClass, [
                        element("span", undefined, child.children ?? []),
                    ]),
                    element("div", linesClass, lines),
                ]),
            );
            continue;
        }

        if (!lines) {
            throw new Error("<Shelf> content must start with a ## heading.");
        }

        const line =
            child.type === "element" && child.tagName === "p"
                ? element("div", undefined, child.children ?? [])
                : child;
        markLinks(line);
        lines.push(line);
    }

    return element("div", ["not-prose"], sections);
}

function transform(node: ShelfNode) {
    if (!node.children) return;
    node.children = node.children.map((child) =>
        child.type === "mdxJsxFlowElement" && child.name === "Shelf"
            ? layoutShelf(child)
            : child,
    );
    node.children.forEach(transform);
}

export default function rehypeShelf() {
    return transform;
}
