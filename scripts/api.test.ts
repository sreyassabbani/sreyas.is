import { describe, expect, test } from "bun:test";
import { mdxToMarkdown } from "../src/lib/api";

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
