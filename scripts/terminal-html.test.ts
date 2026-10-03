import { describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import type { ImageMetadata } from "astro";
import { terminalCaptureFor } from "../src/lib/terminal-assets";
import {
    imageDigest,
    validateTerminalCapture,
} from "../src/lib/terminal-capture";
import { normalizeTerminalHtml } from "../src/lib/terminal-html";

const screen = (content: string) =>
    `<div style="font-family: monospace; white-space: pre;background-color: #303446;color: #c6d0f5;">${content}</div>`;

describe("Ghostty HTML import", () => {
    test("keeps native faint, inverse, background and decoration styles", () => {
        const value = normalizeTerminalHtml(
            screen(
                '<div style="opacity:0.5;filter:invert(100%);background-color:rgb(48, 52, 70);text-decoration-line:underline line-through overline blink;text-decoration-style:wavy;text-decoration-color:#e78284">styled</div>',
            ),
        );
        expect(value.html).toContain("opacity:0.5;filter:invert(100%)");
        expect(value.html).toContain(
            "text-decoration-line:underline line-through overline",
        );
        expect(value.html).not.toContain("blink");
    });
    test("preserves real colors, bold text, spacing, entities and Unicode", () => {
        const value = normalizeTerminalHtml(
            screen(
                '  <div style="display: inline;color: rgb(140, 170, 238);">sreyas</div> <div style="font-weight:bold;font-style:italic;">&#955;</div>\n&lt;text&gt; &amp;   ',
            ),
        );
        expect(value.text).toBe("  sreyas λ\n<text> &   ");
        expect(value.style).toBe("background-color:#303446;color:#c6d0f5");
        expect(value.html).toContain('style="color:rgb(140, 170, 238)"');
        expect(value.html).toContain(
            'style="font-weight:bold;font-style:italic"',
        );
        expect(value.html).not.toContain("<div");
    });

    test("resolves palette variables without leaking global CSS", () => {
        const value = normalizeTerminalHtml(
            `<style>:root{--vt-palette-2:#a6d189;} body{display:none}</style>${screen('<div style="color:var(--vt-palette-2)">green</div>')}`,
        );
        expect(value.html).toBe('<span style="color:#a6d189">green</span>');
        expect(value.text).toBe("green");
    });

    test("removes executable markup, event handlers and layout-changing styles", () => {
        const value = normalizeTerminalHtml(
            screen(
                '<script>alert(1)</script><svg><script>bad()</script></svg><img src=x onerror=bad()><span id=evil onclick=bad() style="position:fixed;inset:0;background-image:url(https://evil);color:#fff">safe</span><a href="javascript:bad()">text</a>',
            ),
        );
        expect(value.html).toBe('<span style="color:#fff">safe</span>text');
        expect(value.text).toBe("safetext");
    });

    test("keeps web links and escapes their attributes", () => {
        const value = normalizeTerminalHtml(
            screen(
                '<a href="https://example.com/?a=&quot;x&quot;">link</a><a href="file:///private">private</a>',
            ),
        );
        expect(value.html).toBe(
            '<a href="https://example.com/?a=&quot;x&quot;" rel="noreferrer">link</a>private',
        );
    });

    test("rejects arbitrary clipboard HTML and oversized input", () => {
        expect(() => normalizeTerminalHtml("<p>not a terminal</p>")).toThrow(
            "Ghostty",
        );
        expect(() => normalizeTerminalHtml("x".repeat(2_000_001))).toThrow(
            "too large",
        );
    });
});

describe("paired captures", () => {
    const image = new Uint8Array([1, 2, 3]);
    const capture = {
        version: 1 as const,
        imageSha256: imageDigest(image),
        pixelRatio: 2,
        html: screen("real output"),
    };
    test("accepts a matching native export", () => {
        expect(validateTerminalCapture(capture, image)).toEqual(capture);
    });
    test("rejects stale text and invalid metadata", () => {
        expect(() =>
            validateTerminalCapture(capture, new Uint8Array([4])),
        ).toThrow("does not match");
        expect(() =>
            validateTerminalCapture({ ...capture, pixelRatio: 0 }, image),
        ).toThrow("invalid");
        expect(() =>
            validateTerminalCapture({ ...capture, version: 2 }, image),
        ).toThrow("invalid");
        expect(() => validateTerminalCapture(null, image)).toThrow("invalid");
    });

    test("reads only the requested image's companion, including preview assets", () => {
        const directory = mkdtempSync(
            path.join(os.tmpdir(), "terminal-assets-test-"),
        );
        try {
            const fsPath = path.join(directory, "capture.png");
            const metadata = {
                src: "/_astro/capture.hash.png",
                width: 100,
                height: 100,
                format: "png",
                fsPath,
            } as ImageMetadata & { fsPath: string };
            writeFileSync(fsPath, image);
            expect(terminalCaptureFor(metadata)).toBeUndefined();
            writeFileSync(
                path.join(directory, "capture.terminal.json"),
                JSON.stringify(capture),
            );
            writeFileSync(
                path.join(directory, "unrelated.terminal.json"),
                "invalid JSON",
            );
            expect(terminalCaptureFor(metadata)).toEqual(capture);
            expect(
                terminalCaptureFor({
                    ...metadata,
                    fsPath: undefined,
                } as ImageMetadata),
            ).toBeUndefined();
        } finally {
            rmSync(directory, { recursive: true, force: true });
        }
    });
});
