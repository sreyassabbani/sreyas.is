import { afterEach, describe, expect, test } from "bun:test";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
    parseMountContentArgs,
    selectPublishIntentFiles,
} from "./mount-content";

const temporaryPaths: string[] = [];

async function makeContentSource() {
    const sourcePath = await mkdtemp(
        path.join(os.tmpdir(), "mount-content-test-"),
    );
    temporaryPaths.push(sourcePath);
    await mkdir(path.join(sourcePath, "pages"), { recursive: true });
    await mkdir(path.join(sourcePath, "posts"), { recursive: true });
    return sourcePath;
}

function entry(frontmatter: string) {
    return `---\n${frontmatter}\n---\n\nBody\n`;
}

afterEach(async () => {
    await Promise.all(
        temporaryPaths
            .splice(0)
            .map((temporaryPath) =>
                rm(temporaryPath, { force: true, recursive: true }),
            ),
    );
});

describe("content preview mode", () => {
    test("defaults to all content", () => {
        expect(parseMountContentArgs([])).toEqual({ mode: "all" });
    });

    test("recognizes publish-intent content", () => {
        expect(parseMountContentArgs(["--only-publish-intent"])).toEqual({
            mode: "publish-intent",
        });
    });

    test("selects publish:true entries regardless of publication date", async () => {
        const sourcePath = await makeContentSource();
        const files = [
            "pages/about.mdx",
            "posts/future.mdx",
            "posts/private.mdx",
            "posts/components/future/figure.tsx",
            "posts/components/private/secret.tsx",
        ];

        await writeFile(
            path.join(sourcePath, "pages/about.mdx"),
            entry("publish: true"),
        );
        await writeFile(
            path.join(sourcePath, "posts/future.mdx"),
            entry('publish: true\npubDate: "Dec 31 2099"'),
        );
        await writeFile(
            path.join(sourcePath, "posts/private.mdx"),
            entry('publish: false\npubDate: "Jan 1 2020"'),
        );

        expect(await selectPublishIntentFiles(sourcePath, files)).toEqual([
            "pages/about.mdx",
            "posts/future.mdx",
            "posts/components/future/figure.tsx",
        ]);
    });

    test("rejects malformed frontmatter instead of silently hiding it", async () => {
        const sourcePath = await makeContentSource();
        await writeFile(path.join(sourcePath, "posts/broken.mdx"), "Body\n");

        let thrownError: unknown;
        try {
            await selectPublishIntentFiles(sourcePath, ["posts/broken.mdx"]);
        } catch (error) {
            thrownError = error;
        }

        expect(thrownError).toBeInstanceOf(Error);
        expect((thrownError as Error).message).toContain(
            "missing YAML frontmatter",
        );
    });
});
