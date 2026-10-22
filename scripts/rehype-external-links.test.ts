import { expect, test } from "bun:test";
import rehypeExternalLinks from "../src/lib/rehype-external-links";

type ContentNode = Parameters<ReturnType<typeof rehypeExternalLinks>>[0];
const text = (value: string): ContentNode => ({ type: "text", value });
const marker = {
    type: "element",
    tagName: "svg",
    properties: expect.objectContaining({
        className: ["external-link-marker"],
        ariaHidden: "true",
        focusable: "false",
    }),
    children: expect.any(Array),
};
const anchor = (href: string, children = [text("reference")]): ContentNode => ({
    type: "element",
    tagName: "a",
    properties: { href },
    children,
});

function transform(...children: ContentNode[]) {
    rehypeExternalLinks()({ type: "root", children });
}

test("marks external Markdown links after text, code, and emphasis", () => {
    const code: ContentNode = {
        type: "element",
        tagName: "code",
        properties: {},
        children: [text("fastfetch")],
    };
    const emphasis = { ...code, tagName: "em", children: [text("emphasis")] };
    const links = [
        anchor("https://example.com"),
        anchor("http://example.com", [code]),
        anchor("//example.com", [emphasis]),
    ];
    transform({ type: "element", tagName: "p", children: links });
    expect(links[0].children).toEqual([text("reference"), marker]);
    expect(links[1].children).toEqual([code, marker]);
    expect(links[2].children).toEqual([emphasis, marker]);
    expect(links[0].properties).toEqual({ href: "https://example.com" });
});

test.each([
    "mdxJsxTextElement",
    "mdxJsxFlowElement",
])("marks literal %s anchors without changing their attributes", (type) => {
    const link: ContentNode = {
        type,
        name: "a",
        attributes: [
            {
                type: "mdxJsxAttribute",
                name: "href",
                value: "https://example.com",
            },
            { type: "mdxJsxAttribute", name: "target", value: "_blank" },
        ],
        children: [text("reference")],
    };
    const originalAttributes = structuredClone(link.attributes);
    transform(link);
    expect(link.children).toEqual([text("reference"), marker]);
    expect(link.attributes).toEqual(originalAttributes);
});

test.each([
    "/thinking/post",
    "post",
    "#eq-1",
    "#user-content-fn-1",
    "https://sreyas.is/using",
    "https://www.sreyas.is",
    "https://sreyassabbani.github.io/now",
    "mailto:hello@example.com",
    "https://[invalid",
])("leaves %s unmarked", (href) => {
    const link = anchor(href);
    transform(link);
    expect(link.children).toEqual([text("reference")]);
});

test("matches internal hostnames exactly", () => {
    const link = anchor("https://sreyas.is.example.com");
    transform(link);
    expect(link.children).toEqual([text("reference"), marker]);
});

test("leaves image, icon, empty, and explicitly plain links unmarked", () => {
    const links = [
        anchor("https://example.com", [{ type: "element", tagName: "img" }]),
        anchor("https://example.com", [
            {
                type: "mdxJsxTextElement",
                name: "svg",
                children: [text("Icon")],
            },
        ]),
        anchor("https://example.com", [text(" ")]),
        {
            ...anchor("https://example.com"),
            properties: { href: "https://example.com", dataPlainLink: true },
        },
    ];
    const originalLinks = structuredClone(links);
    transform(...links);
    expect(links).toEqual(originalLinks);
});

test("leaves runtime MDX destinations, spreads, and plain links untouched", () => {
    const links: ContentNode[] = [
        {
            type: "mdxJsxTextElement",
            name: "a",
            attributes: [
                {
                    type: "mdxJsxAttribute",
                    name: "href",
                    value: {
                        type: "mdxJsxAttributeValueExpression",
                        value: "url",
                    },
                },
            ],
            children: [text("dynamic")],
        },
        {
            type: "mdxJsxTextElement",
            name: "a",
            attributes: [
                {
                    type: "mdxJsxAttribute",
                    name: "href",
                    value: "https://example.com",
                },
                { type: "mdxJsxExpressionAttribute", value: "...linkProps" },
            ],
            children: [text("spread")],
        },
        {
            type: "mdxJsxFlowElement",
            name: "a",
            attributes: [
                {
                    type: "mdxJsxAttribute",
                    name: "href",
                    value: "https://example.com",
                },
                { type: "mdxJsxAttribute", name: "data-plain-link" },
            ],
            children: [text("plain")],
        },
    ];
    const originalLinks = structuredClone(links);
    transform(...links);
    expect(links).toEqual(originalLinks);
});
