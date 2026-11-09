import { expect, test } from "bun:test";
import rehypeShelf, { type ShelfNode } from "../src/lib/rehype-shelf";

const text = (value: string): ShelfNode => ({ type: "text", value });
const el = (
    tagName: string,
    children: ShelfNode[],
    properties: Record<string, unknown> = {},
): ShelfNode => ({
    type: "element",
    tagName,
    properties,
    children,
});

test("lays out each ## label and its lines as a section", () => {
    const tree: ShelfNode = {
        type: "root",
        children: [
            {
                type: "mdxJsxFlowElement",
                name: "Shelf",
                children: [
                    text("\n"),
                    el("h2", [text("system")], { id: "system" }),
                    el("p", [
                        el("a", [text("Ghostty")], { href: "https://x" }),
                        text(", tools"),
                    ]),
                    el("p", [text("more")]),
                ],
            },
        ],
    };

    rehypeShelf()(tree);

    expect(tree.children?.[0]).toEqual(
        el(
            "div",
            [
                el(
                    "section",
                    [
                        el("h2", [el("span", [text("system")])], {
                            className: [
                                "m-0",
                                "translate-y-[0.4375rem]",
                                "font-mono",
                                "text-xs",
                                "font-normal",
                                "leading-4",
                                "text-muted-foreground",
                            ],
                        }),
                        el(
                            "div",
                            [
                                el("div", [
                                    el("a", [text("Ghostty")], {
                                        href: "https://x",
                                        className: ["text-link"],
                                    }),
                                    text(", tools"),
                                ]),
                                el("div", [text("more")]),
                            ],
                            {
                                className: [
                                    "space-y-0.5",
                                    "text-sm",
                                    "leading-7",
                                    "text-foreground",
                                ],
                            },
                        ),
                    ],
                    {
                        className: [
                            "grid",
                            "gap-3",
                            "py-5",
                            "sm:grid-cols-[7rem_1fr]",
                        ],
                    },
                ),
            ],
            { className: ["not-prose"] },
        ),
    );
});

test("rejects lines before the first label", () => {
    const tree: ShelfNode = {
        type: "root",
        children: [
            {
                type: "mdxJsxFlowElement",
                name: "Shelf",
                children: [el("p", [text("orphan")])],
            },
        ],
    };

    expect(() => rehypeShelf()(tree)).toThrow(/## heading/);
});
