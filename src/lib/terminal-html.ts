import { type DefaultTreeAdapterMap, parseFragment } from "parse5";

type Node = DefaultTreeAdapterMap["node"];
type Element = DefaultTreeAdapterMap["element"];

export type TerminalHtml = {
    html: string;
    text: string;
    style: string;
};

const discardedTags = new Set([
    "script",
    "style",
    "iframe",
    "object",
    "embed",
    "svg",
    "math",
    "template",
]);
const colorPattern =
    /^(?:#[\da-f]{3}(?:[\da-f]{3})?|rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\))$/i;
const styleValues: Record<string, RegExp> = {
    "font-weight": /^(?:normal|bold|[1-9]00)$/,
    "font-style": /^(?:normal|italic)$/,
    "text-decoration-line":
        /^(?:none|(?:underline|overline|line-through)(?: (?:underline|overline|line-through))*)$/,
    "text-decoration-style": /^(?:solid|double|dotted|dashed|wavy)$/,
    opacity: /^(?:0(?:\.\d+)?|1(?:\.0+)?)$/,
    visibility: /^(?:visible|hidden)$/,
    filter: /^invert\(100%\)$/,
};

function escapeHtml(value: string) {
    return value.replace(/[&<>"']/g, (char) => {
        return (
            {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;",
            }[char] ?? char
        );
    });
}

function attribute(node: Element, name: string) {
    return node.attrs.find((attr) => attr.name === name)?.value ?? "";
}

function safeStyles(value: string, palette: Map<string, string>) {
    const styles: string[] = [];
    for (const declaration of value.split(";")) {
        const index = declaration.indexOf(":");
        if (index < 0) continue;
        const property = declaration.slice(0, index).trim().toLowerCase();
        let content = declaration
            .slice(index + 1)
            .trim()
            .toLowerCase();
        if (property === "text-decoration-line") {
            content = content.replace(/(?:^|\s)blink(?=\s|$)/g, "").trim();
        }
        const variable = /^var\((--vt-palette-\d{1,3})\)$/.exec(content);
        if (variable) content = palette.get(variable[1]) ?? "";
        if (
            (["color", "background-color", "text-decoration-color"].includes(
                property,
            ) &&
                colorPattern.test(content)) ||
            styleValues[property]?.test(content)
        ) {
            styles.push(`${property}:${content}`);
        }
    }
    return styles.join(";");
}

/** Import Ghostty's HTML as static, selectable text. Never publish raw clipboard HTML. */
export function normalizeTerminalHtml(source: string): TerminalHtml {
    if (source.length > 2_000_000)
        throw new Error("terminal export is too large");
    const fragment = parseFragment(source);
    const palette = new Map<string, string>();
    function readPalette(node: Node) {
        if ("tagName" in node && node.tagName === "style") {
            const css = node.childNodes
                .filter((child) => child.nodeName === "#text")
                .map(
                    (child) =>
                        (child as DefaultTreeAdapterMap["textNode"]).value,
                )
                .join("");
            for (const match of css.matchAll(
                /(--vt-palette-\d{1,3})\s*:\s*(#[\da-f]{6})\s*;/gi,
            )) {
                palette.set(match[1], match[2].toLowerCase());
            }
        }
        if ("childNodes" in node) node.childNodes.forEach(readPalette);
    }
    readPalette(fragment);
    const screen = fragment.childNodes.find(
        (node): node is Element =>
            "tagName" in node &&
            node.tagName === "div" &&
            /white-space\s*:\s*pre(?:;|$)/i.test(attribute(node, "style")),
    );
    if (!screen) throw new Error("expected a Ghostty HTML screen export");

    function render(node: Node): { html: string; text: string } {
        if (node.nodeName === "#text") {
            const text = (node as DefaultTreeAdapterMap["textNode"]).value;
            return { html: escapeHtml(text), text };
        }
        if (!("tagName" in node) || discardedTags.has(node.tagName))
            return { html: "", text: "" };
        if (node.tagName === "br") return { html: "\n", text: "\n" };
        const children = node.childNodes.map(render);
        const text = children.map((child) => child.text).join("");
        const html = children.map((child) => child.html).join("");
        const style = safeStyles(attribute(node, "style"), palette);
        // Terminal links may be useful, but only ordinary web URLs are published.
        const href = attribute(node, "href");
        if (node.tagName === "a" && /^https?:\/\//i.test(href)) {
            return {
                html: `<a href="${escapeHtml(href)}" rel="noreferrer"${style ? ` style="${style}"` : ""}>${html}</a>`,
                text,
            };
        }
        return {
            html: style ? `<span style="${style}">${html}</span>` : html,
            text,
        };
    }
    const children = screen.childNodes.map(render);
    return {
        html: children.map((child) => child.html).join(""),
        text: children.map((child) => child.text).join(""),
        style: safeStyles(attribute(screen, "style"), palette),
    };
}
