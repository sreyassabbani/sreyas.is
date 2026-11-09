import { describe, expect, test } from "bun:test";
import { mdxToBlocks, mdxToMarkdown, parseProps } from "../src/lib/api";

describe("mdxToMarkdown", () => {
    test("drops imports, exports and MDX comments", () => {
        const { markdown } = mdxToMarkdown(
            [
                'import Foo from "@/components/Foo.astro";',
                "import {",
                "    a,",
                '} from "./b";',
                "export const x = 1;",
                "",
                "{/* a comment */}",
                "Hello.",
            ].join("\n"),
        );

        expect(markdown).toBe("Hello.\n");
    });

    test("removes decorative components without flagging omitted content", () => {
        const result = mdxToMarkdown("One.\n\n<EllipsisBreak />\n\nTwo.");

        expect(result.markdown).toBe("One.\n\nTwo.\n");
        expect(result.omitted).toBe(false);
    });

    test("flags standalone components, even with multi-line props", () => {
        const result = mdxToMarkdown(
            [
                "Before.",
                "",
                "<TerminalOutput",
                '    title="a > b"',
                "    svg={zoxideOutput}",
                "/>",
                "",
                "After.",
            ].join("\n"),
        );

        expect(result.markdown).toBe("Before.\n\nAfter.\n");
        expect(result.omitted).toBe(true);
    });

    test("keeps the prose inside a wrapping component", () => {
        const result = mdxToMarkdown(
            'A <MarginNote id="1">side remark</MarginNote> inline.',
        );

        expect(result.markdown).toBe("A side remark inline.\n");
        expect(result.omitted).toBe(false);
    });

    test("leaves fenced code and math untouched", () => {
        const source = [
            "```tsx",
            'import X from "x";',
            "<Thing prop={1} />",
            "```",
            "",
            "$$",
            "{} - ; & x",
            "$$",
        ].join("\n");

        expect(mdxToMarkdown(source).markdown).toBe(`${source}\n`);
    });

    test("does not treat comparisons or lowercase tags as components", () => {
        const { markdown } = mdxToMarkdown(
            "if a < b and c > d, use <kbd>q</kbd>.",
        );

        expect(markdown).toBe("if a < b and c > d, use <kbd>q</kbd>.\n");
    });
});

describe("mdxToBlocks", () => {
    test("turns a wrapping component into a Markdown block with a layout", () => {
        expect(
            mdxToBlocks(
                [
                    "Intro.",
                    "",
                    "<Shelf>",
                    "",
                    "## laptop",
                    "",
                    "M4 Air",
                    "",
                    "</Shelf>",
                    "",
                    "Outro.",
                ].join("\n"),
            ),
        ).toEqual([
            { type: "markdown", text: "Intro." },
            { type: "markdown", text: "## laptop\n\nM4 Air", layout: "shelf" },
            { type: "markdown", text: "Outro." },
        ]);
    });

    test("turns a standalone component into a widget with literal props", () => {
        expect(
            mdxToBlocks(
                [
                    'import { HomePresence } from "@/components/HomePresence";',
                    "",
                    '<HomePresence client:load place="Alpharetta, GA" timeZone="America/New_York" />',
                    "",
                    "- physics",
                ].join("\n"),
            ),
        ).toEqual([
            {
                type: "widget",
                name: "home-presence",
                props: {
                    place: "Alpharetta, GA",
                    timeZone: "America/New_York",
                },
            },
            { type: "markdown", text: "- physics" },
        ]);
    });

    test("keeps inline components as text and drops decorative ones", () => {
        expect(
            mdxToBlocks(
                'A <MarginNote id="1">note</MarginNote> here.\n\n<EllipsisBreak />\n\nNext.',
            ),
        ).toEqual([{ type: "markdown", text: "A note here.\n\nNext." }]);
    });

    test("does not read tags inside fenced code", () => {
        const source = "```mdx\n<Shelf>\n<Widget />\n```";
        expect(mdxToBlocks(source)).toEqual([
            { type: "markdown", text: source },
        ]);
    });
});

describe("parseProps", () => {
    test("keeps literals and skips expressions that need code", () => {
        expect(
            parseProps(
                '<X a="1" b=\'two\' c={3} d={true} e={"s"} f={someVar} g client:load />',
            ),
        ).toEqual({ a: "1", b: "two", c: 3, d: true, e: "s", g: true });
    });
});
