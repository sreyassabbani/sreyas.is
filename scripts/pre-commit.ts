import { spawnSync } from "node:child_process";
import path from "node:path";
import {
    ensureMountedContent,
    listTrackedSourceFiles,
    mountPath,
    pathExists,
    resolveSourcePath,
} from "./mount-content";

await ensureMountedContent({
    backupExisting: true,
    logPrefix: "[pre-commit]",
});

const sourcePath = await resolveSourcePath();
const trackedSourceFiles = (await pathExists(sourcePath))
    ? new Set(listTrackedSourceFiles(sourcePath))
    : new Set<string>();

const stagedContentPathsResult = spawnSync(
    "git",
    [
        "diff",
        "--cached",
        "--name-only",
        "-z",
        "--diff-filter=ACMR",
        "--",
        "src/content",
    ],
    {
        encoding: "utf8",
    },
);

if (stagedContentPathsResult.status !== 0) {
    const errorOutput = stagedContentPathsResult.stderr.trim();
    throw new Error(
        errorOutput ||
            "failed to inspect staged content files in the site repo",
    );
}

const invalidStagedPaths = stagedContentPathsResult.stdout
    .split("\0")
    .filter(Boolean)
    .map((stagedPath) =>
        path
            .relative(mountPath, path.resolve(process.cwd(), stagedPath))
            .replaceAll("\\", "/"),
    )
    .filter((relativePath) => !trackedSourceFiles.has(relativePath));

if (invalidStagedPaths.length > 0) {
    console.error(
        "[pre-commit] refusing commit because src/content has staged files that are not tracked in the content repo:",
    );

    for (const invalidStagedPath of invalidStagedPaths) {
        console.error(`  - ${invalidStagedPath}`);
    }

    process.exit(1);
}
