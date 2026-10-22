// Rehype receives both HAST elements and preserved MDX JSX elements.
interface ContentNode {
    type: string;
    tagName?: string;
    name?: string | null;
    value?: string;
    children?: ContentNode[];
    properties?: Record<string, unknown>;
    attributes?: { type: string; name?: string; value?: unknown }[];
}

const internalHosts = new Set([
    "sreyas.is",
    "www.sreyas.is",
    "sreyassabbani.github.io",
]);
const mediaTags = new Set([
    "img",
    "picture",
    "svg",
    "video",
    "audio",
    "canvas",
]);

function tagName(node: ContentNode) {
    if (node.type === "element") return node.tagName;
    if (
        node.type === "mdxJsxFlowElement" ||
        node.type === "mdxJsxTextElement"
    ) {
        return node.name;
    }
}

function isExternal(href: unknown) {
    if (typeof href !== "string" || !/^(https?:)?\/\//i.test(href)) {
        return false;
    }
    try {
        const url = new URL(href, "https://sreyas.is");
        return !internalHosts.has(url.hostname);
    } catch {
        return false;
    }
}

function containsMedia(node: ContentNode): boolean {
    const name = tagName(node);
    return (
        (typeof name === "string" && mediaTags.has(name)) ||
        (node.children?.some(containsMedia) ?? false)
    );
}

function containsText(node: ContentNode): boolean {
    return (
        (node.type === "text" && !!node.value?.trim()) ||
        (node.children?.some(containsText) ?? false)
    );
}

function markLink(node: ContentNode) {
    if (!node.children) return;
    let href: unknown;
    if (node.type === "element") {
        if (node.properties && "dataPlainLink" in node.properties) return;
        href = node.properties?.href;
    } else {
        // Expressions and spreads may change the destination at runtime.
        if (
            node.attributes?.some(
                (attribute) =>
                    attribute.type === "mdxJsxExpressionAttribute" ||
                    attribute.name === "data-plain-link",
            )
        ) {
            return;
        }
        const attribute = node.attributes?.find(
            (attribute) =>
                attribute.type === "mdxJsxAttribute" &&
                attribute.name === "href",
        );
        if (attribute?.type === "mdxJsxAttribute") href = attribute.value;
    }

    if (!isExternal(href) || containsMedia(node) || !containsText(node)) return;

    node.children.push({
        type: "element",
        tagName: "svg",
        properties: {
            className: ["external-link-marker"],
            ariaHidden: "true",
            focusable: "false",
            viewBox: "0 0 12 12",
            fill: "none",
            stroke: "currentColor",
            strokeWidth: 1.5,
            strokeLinecap: "round",
            strokeLinejoin: "round",
        },
        children: [
            {
                type: "element",
                tagName: "path",
                properties: { d: "M3 9 9 3M3 3h6v6" },
                children: [],
            },
        ],
    });
}

/** Mark prose links at build time, including literal <a> elements in MDX. */
export default function rehypeExternalLinks() {
    return function walk(node: ContentNode) {
        if (!node.children) return;
        if (node.type !== "root" && tagName(node) === "a") {
            markLink(node);
            return;
        }
        for (const child of node.children) walk(child);
    };
}
