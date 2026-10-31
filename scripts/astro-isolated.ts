import { cp, mkdtemp, realpath, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

// Astro writes .astro/content-modules.mjs in both build/check and dev. The
// preview and published collections have different source paths, so running
// them in one project root can break a live preview. Snapshot the project into
// a private temporary root and keep both Astro and Vite caches there.
const projectRoot = process.cwd();
const [command, ...arguments_] = process.argv.slice(2);
if (command !== "build" && command !== "check") {
    throw new Error("Expected 'build' or 'check'.");
}
if (arguments_.some((arg) => arg === "--root" || arg.startsWith("--root="))) {
    throw new Error(
        "The isolated command manages --root; run Astro directly for a custom root.",
    );
}

let outputDir = "dist";
const astroArgs: string[] = [];
for (let index = 0; index < arguments_.length; index++) {
    const arg = arguments_[index];
    if (command === "build" && arg === "--outDir") {
        const next = arguments_[++index];
        if (!next) throw new Error("--outDir requires a directory.");
        outputDir = next;
    } else if (command === "build" && arg.startsWith("--outDir=")) {
        outputDir = arg.slice("--outDir=".length);
        if (!outputDir) throw new Error("--outDir requires a directory.");
    } else {
        astroArgs.push(arg);
    }
}

const destination = path.resolve(projectRoot, outputDir);
const projectFromDestination = path.relative(destination, projectRoot);
if (
    command === "build" &&
    (!projectFromDestination ||
        (!projectFromDestination.startsWith(`..${path.sep}`) &&
            projectFromDestination !== ".." &&
            !path.isAbsolute(projectFromDestination)))
) {
    throw new Error("The build output cannot contain the project root.");
}
if (command === "build") {
    for (const protectedDir of [
        "src",
        "public",
        "scripts",
        "node_modules",
        ".git",
    ]) {
        const protectedPath = path.join(projectRoot, protectedDir);
        const relative = path.relative(protectedPath, destination);
        if (
            !relative ||
            (!relative.startsWith(`..${path.sep}`) &&
                relative !== ".." &&
                !path.isAbsolute(relative))
        ) {
            throw new Error(
                `The build output cannot be inside ${protectedDir}.`,
            );
        }
    }
}

const excluded = new Set([
    ".astro",
    ".claude",
    ".content-sync-backups",
    ".direnv",
    ".git",
    "dist",
    "node_modules",
]);
const temporaryRoot = await realpath(
    await mkdtemp(path.join(tmpdir(), "sreyas-astro-")),
);
let child: ReturnType<typeof Bun.spawn> | undefined;
let interrupted = false;
const onInterrupt = (signal: NodeJS.Signals) => {
    interrupted = true;
    child?.kill(signal);
};
const onSigint = () => onInterrupt("SIGINT");
const onSigterm = () => onInterrupt("SIGTERM");
process.on("SIGINT", onSigint);
process.on("SIGTERM", onSigterm);

try {
    await cp(projectRoot, temporaryRoot, {
        recursive: true,
        filter(source) {
            const first = path.relative(projectRoot, source).split(path.sep)[0];
            return !excluded.has(first);
        },
    });
    await symlink(
        path.join(projectRoot, "node_modules"),
        path.join(temporaryRoot, "node_modules"),
        "dir",
    );
    if (interrupted) throw new Error("Astro command interrupted.");
    child = Bun.spawn(
        [
            process.execPath,
            "--bun",
            path.join(projectRoot, "node_modules/.bin/astro"),
            command,
            ...astroArgs,
            ...(command === "build"
                ? ["--outDir", path.join(temporaryRoot, "dist")]
                : []),
        ],
        {
            cwd: temporaryRoot,
            env: {
                ...process.env,
                SREYAS_ASTRO_ISOLATED_CACHE: path.join(
                    temporaryRoot,
                    ".astro-cache",
                ),
            },
            stdin: "inherit",
            stdout: "inherit",
            stderr: "inherit",
        },
    );
    const exitCode = await child.exited;
    if (exitCode !== 0 || interrupted) {
        process.exitCode = exitCode || 1;
    } else if (
        command === "build" &&
        !astroArgs.includes("--help") &&
        !astroArgs.includes("-h")
    ) {
        await rm(destination, { recursive: true, force: true });
        await cp(path.join(temporaryRoot, "dist"), destination, {
            recursive: true,
        });
        console.log(`[astro-isolated] Build copied to ${destination}`);
    }
} finally {
    await rm(temporaryRoot, { recursive: true, force: true });
    process.off("SIGINT", onSigint);
    process.off("SIGTERM", onSigterm);
}
