import { expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import type { LoaderContext } from "astro/loaders";
import { contentGlob } from "../src/lib/content-glob";

test("invalidates cached source paths only when the content base changes", async () => {
    const directory = mkdtempSync(path.join(os.tmpdir(), "content-glob-"));
    const metadata = new Map<string, string>();
    let clears = 0;
    const root = pathToFileURL(`${directory}/`);
    const context = {
        config: { root, srcDir: root },
        collection: "posts",
        meta: metadata,
        store: {
            clear: () => {
                clears += 1;
            },
            keys: () => [].values(),
            delete: () => false,
        },
        logger: { warn: () => {} },
        entryTypes: new Map(),
    } as unknown as LoaderContext;
    try {
        await contentGlob(directory).load(context);
        expect(clears).toBe(1);
        expect(metadata.get("source-base")).toBe(directory);
        await contentGlob(directory).load(context);
        expect(clears).toBe(1);
        metadata.set("source-base", "./src/content/posts");
        await contentGlob(directory).load(context);
        expect(clears).toBe(2);
    } finally {
        rmSync(directory, { recursive: true, force: true });
    }
});
