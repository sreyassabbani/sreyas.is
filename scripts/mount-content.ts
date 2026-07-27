import type { Dirent } from "node:fs";
import { cp, lstat, mkdir, readdir, rm, stat, unlink } from "node:fs/promises";
import path from "node:path";
import { Glob } from "bun";

const root = process.cwd();
const homePath = Bun.env.HOME ?? "";
export const mountPath = path.resolve(root, "src/content-preview");
export const backupDraftMirrorPath = path.join("/tmp", "sreyas.is-content-bak");
export const ignoredPathSegments = new Set([
    ".git",
    ".github",
    "drafts",
    "scripts",
]);
export const ignoredSourceFiles = new Set([
    ".gitignore",
    "LICENSE",
    "README.md",
]);
export const ignoredSourceBasenames = new Set([".DS_Store"]);
export const showUntrackedFlag = "--show-untracked";
const backupDraftGlob = new Glob("**/*-bak*.mdx");

export async function pathExists(targetPath: string) {
    try {
        await lstat(targetPath);
        return true;
    } catch {
        return false;
    }
}

export async function resolveSourcePath() {
    const configuredSource = Bun.env.CONTENT_DIR?.trim();
    const sourceCandidates = [
        configuredSource ? path.resolve(root, configuredSource) : undefined,
        homePath ? path.join(homePath, "workflow/content") : undefined,
        path.resolve(root, "../content"),
    ].filter((candidate): candidate is string => Boolean(candidate));

    for (const candidate of sourceCandidates) {
        if (await pathExists(candidate)) {
            return candidate;
        }
    }

    return sourceCandidates[0] ?? path.join(homePath, "content");
}

async function directoryHasEntries(targetPath: string) {
    try {
        const entries = await readdir(targetPath);
        return entries.length > 0;
    } catch {
        return false;
    }
}

function isIgnoredRelativePath(relativePath: string) {
    const normalizedRelativePath = relativePath.replaceAll("\\", "/");

    return (
        ignoredSourceFiles.has(normalizedRelativePath) ||
        ignoredSourceBasenames.has(path.basename(normalizedRelativePath)) ||
        normalizedRelativePath
            .split("/")
            .some((segment) => ignoredPathSegments.has(segment))
    );
}

export function listTrackedSourceFiles(sourcePath: string) {
    const result = Bun.spawnSync({
        cmd: ["git", "-C", sourcePath, "ls-files", "-z"],
        stdout: "pipe",
        stderr: "pipe",
    });

    if (result.exitCode !== 0) {
        const errorOutput = result.stderr.toString().trim();
        throw new Error(
            errorOutput || `failed to list tracked files in ${sourcePath}`,
        );
    }

    return result.stdout
        .toString()
        .split("\0")
        .filter(Boolean)
        .filter((relativePath) => !isIgnoredRelativePath(relativePath));
}

function listSourceFiles(
    sourcePath: string,
    options: { includeUntracked?: boolean } = {},
) {
    const { includeUntracked = false } = options;
    const gitArgs = includeUntracked
        ? [
              "-C",
              sourcePath,
              "ls-files",
              "-z",
              "--cached",
              "--others",
              "--exclude-standard",
          ]
        : ["-C", sourcePath, "ls-files", "-z"];
    const result = Bun.spawnSync({
        cmd: ["git", ...gitArgs],
        stdout: "pipe",
        stderr: "pipe",
    });

    if (result.exitCode !== 0) {
        const errorOutput = result.stderr.toString().trim();
        throw new Error(
            errorOutput || `failed to list source files in ${sourcePath}`,
        );
    }

    return result.stdout
        .toString()
        .split("\0")
        .filter(Boolean)
        .filter((relativePath) => !isIgnoredRelativePath(relativePath));
}

async function listMountedFiles(
    directoryPath: string,
    basePath = directoryPath,
) {
    const files: string[] = [];

    let entries: Dirent[];
    try {
        entries = await readdir(directoryPath, { withFileTypes: true });
    } catch {
        return files;
    }

    for (const entry of entries) {
        const entryPath = path.join(directoryPath, entry.name);

        if (entry.isDirectory()) {
            files.push(...(await listMountedFiles(entryPath, basePath)));
            continue;
        }

        if (entry.isFile()) {
            files.push(path.relative(basePath, entryPath));
        }
    }

    return files;
}

async function pruneEmptyDirectories(
    directoryPath: string,
    basePath = directoryPath,
) {
    let entries: Dirent[];
    try {
        entries = await readdir(directoryPath, { withFileTypes: true });
    } catch {
        return;
    }

    for (const entry of entries) {
        if (entry.isDirectory()) {
            await pruneEmptyDirectories(
                path.join(directoryPath, entry.name),
                basePath,
            );
        }
    }

    if (directoryPath === basePath) {
        return;
    }

    const remainingEntries = await readdir(directoryPath);
    if (remainingEntries.length === 0) {
        await rm(directoryPath, { force: true, recursive: true });
    }
}

async function filesDiffer(sourceFilePath: string, mountFilePath: string) {
    try {
        const [sourceStats, mountStats] = await Promise.all([
            stat(sourceFilePath),
            stat(mountFilePath),
        ]);

        return (
            sourceStats.size !== mountStats.size ||
            Math.abs(sourceStats.mtimeMs - mountStats.mtimeMs) > 1
        );
    } catch {
        return true;
    }
}

async function mirroredFileIsFresh(
    sourceFilePath: string,
    mirrorFilePath: string,
) {
    try {
        const [sourceStats, mirrorStats] = await Promise.all([
            stat(sourceFilePath),
            stat(mirrorFilePath),
        ]);

        return (
            sourceStats.size === mirrorStats.size &&
            mirrorStats.mtimeMs >= sourceStats.mtimeMs
        );
    } catch {
        return false;
    }
}

async function listBackupDraftFiles(sourcePath: string) {
    const files: string[] = [];

    for await (const relativePath of backupDraftGlob.scan({
        cwd: sourcePath,
        onlyFiles: true,
    })) {
        if (!isIgnoredRelativePath(relativePath)) {
            files.push(relativePath);
        }
    }

    return files;
}

export async function syncBackupDraftMirror(
    options: { logPrefix?: string } = {},
) {
    const { logPrefix = "[content-bak]" } = options;
    const sourcePath = await resolveSourcePath();

    if (!(await pathExists(sourcePath))) {
        await rm(backupDraftMirrorPath, { force: true, recursive: true });
        return;
    }

    const backupDraftFiles = await listBackupDraftFiles(sourcePath);
    const backupDraftFileSet = new Set(backupDraftFiles);
    let changedFileCount = 0;
    let removedFileCount = 0;

    await mkdir(backupDraftMirrorPath, { recursive: true });

    await Promise.all(
        backupDraftFiles.map(async (relativePath) => {
            const sourceFilePath = path.join(sourcePath, relativePath);
            const mirrorFilePath = path.join(
                backupDraftMirrorPath,
                relativePath,
            );

            await mkdir(path.dirname(mirrorFilePath), { recursive: true });

            if (await mirroredFileIsFresh(sourceFilePath, mirrorFilePath)) {
                return;
            }

            await Bun.write(Bun.file(mirrorFilePath), Bun.file(sourceFilePath));
            changedFileCount += 1;
        }),
    );

    for (const relativePath of await listMountedFiles(backupDraftMirrorPath)) {
        if (backupDraftFileSet.has(relativePath)) {
            continue;
        }

        await unlink(path.join(backupDraftMirrorPath, relativePath));
        removedFileCount += 1;
    }

    await pruneEmptyDirectories(backupDraftMirrorPath);

    if (changedFileCount > 0 || removedFileCount > 0) {
        console.log(
            `${logPrefix} mirrored ${backupDraftFiles.length} *-bak*.mdx files -> ${backupDraftMirrorPath} (${changedFileCount} changed, ${removedFileCount} removed)`,
        );
    }
}

async function syncSourceFiles(
    sourcePath: string,
    options: { includeUntracked?: boolean } = {},
) {
    const sourceFiles = listSourceFiles(sourcePath, options);
    const sourceFileSet = new Set(sourceFiles);
    let changedFileCount = 0;
    let removedFileCount = 0;

    for (const relativePath of sourceFiles) {
        const sourceFilePath = path.join(sourcePath, relativePath);

        if (!(await pathExists(sourceFilePath))) {
            continue;
        }

        const mountFilePath = path.join(mountPath, relativePath);

        await mkdir(path.dirname(mountFilePath), { recursive: true });
        if (await filesDiffer(sourceFilePath, mountFilePath)) {
            await cp(sourceFilePath, mountFilePath, {
                force: true,
                preserveTimestamps: true,
            });
            changedFileCount += 1;
        }
    }

    for (const relativePath of await listMountedFiles(mountPath)) {
        if (sourceFileSet.has(relativePath)) {
            continue;
        }

        await unlink(path.join(mountPath, relativePath));
        removedFileCount += 1;
    }

    await pruneEmptyDirectories(mountPath);

    return {
        changedFileCount,
        removedFileCount,
        totalFileCount: sourceFiles.length,
    };
}

type EnsureMountedContentOptions = {
    backupExisting?: boolean;
    backupRoot?: string;
    includeUntracked?: boolean;
    logPrefix?: string;
};

export function parseMountContentArgs(argv = process.argv.slice(2)) {
    return {
        includeUntracked: argv.includes(showUntrackedFlag),
    };
}

export async function ensureMountedContent(
    options: EnsureMountedContentOptions = {},
) {
    const {
        backupExisting = false,
        backupRoot = path.resolve(root, ".content-sync-backups"),
        includeUntracked = false,
        logPrefix = "[mount-content]",
    } = options;
    const sourcePath = await resolveSourcePath();
    const sourceExists = await pathExists(sourcePath);
    const mountExists = await pathExists(mountPath);

    await mkdir(path.dirname(mountPath), { recursive: true });

    if (
        backupExisting &&
        mountExists &&
        (await directoryHasEntries(mountPath))
    ) {
        const stamp = new Date().toISOString().replaceAll(":", "-");
        const backupPath = path.join(backupRoot, stamp);

        await mkdir(backupRoot, { recursive: true });
        await cp(mountPath, backupPath, { recursive: true });
        console.log(
            `${logPrefix} backed up existing src/content -> ${path.relative(root, backupPath)}`,
        );
    }

    if (sourceExists) {
        await mkdir(mountPath, { recursive: true });
        const { changedFileCount, removedFileCount, totalFileCount } =
            await syncSourceFiles(sourcePath, {
                includeUntracked,
            });
        const syncModeLabel = includeUntracked ? "files" : "tracked files";
        console.log(
            `${logPrefix} synced ${totalFileCount} ${syncModeLabel} from ${path.relative(root, sourcePath)} -> src/content-preview (${changedFileCount} changed, ${removedFileCount} removed)`,
        );
        return;
    }

    await rm(mountPath, { force: true, recursive: true });
    await mkdir(mountPath, { recursive: true });
    console.warn(
        `${logPrefix} no content repo found at ${sourcePath}; using empty src/content-preview`,
    );
}

if (import.meta.main) {
    await ensureMountedContent(parseMountContentArgs());
}
