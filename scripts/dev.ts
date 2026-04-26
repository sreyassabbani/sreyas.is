import { type ChildProcess, spawn } from "node:child_process";
import {
    ensureMountedContent,
    parseMountContentArgs,
    showUntrackedFlag,
} from "./mount-content";

const root = process.cwd();
const args = process.argv.slice(2);
const { includeUntracked } = parseMountContentArgs(args);
const astroArgs = args.filter((arg) => arg !== showUntrackedFlag);

function spawnProcess(
    cmd: string[],
    options: { stdin?: "ignore" | "inherit" } = {},
) {
    return spawn(cmd[0], cmd.slice(1), {
        cwd: root,
        env: process.env,
        stdio: [options.stdin ?? "ignore", "inherit", "inherit"],
    });
}

const waitForExit = (process: ChildProcess) =>
    new Promise<number | null>((resolve) => {
        if (process.exitCode !== null || process.signalCode !== null) {
            resolve(process.exitCode);
            return;
        }

        process.once("exit", (code) => resolve(code));
    });

const terminate = (
    processes: ChildProcess[],
    signal: NodeJS.Signals = "SIGTERM",
) => {
    for (const process of processes) {
        try {
            process.kill(signal);
        } catch {
            // Ignore errors while shutting down sibling processes.
        }
    }
};

await ensureMountedContent({ includeUntracked });

const watchArgs = ["--skip-initial-sync"];
if (includeUntracked) {
    watchArgs.push(showUntrackedFlag);
}

const watchProcess = spawnProcess([
    process.execPath,
    "--bun",
    "./scripts/watch-content.ts",
    ...watchArgs,
]);

const astroProcess = spawnProcess(
    [
        process.execPath,
        "--bun",
        "./node_modules/.bin/astro",
        "dev",
        ...astroArgs,
    ],
    { stdin: "inherit" },
);

const childProcesses = [watchProcess, astroProcess];
let shuttingDown = false;

async function shutdown(exitCode = 0, signal: NodeJS.Signals = "SIGTERM") {
    if (shuttingDown) {
        return;
    }

    shuttingDown = true;
    terminate(childProcesses, signal);
    await Promise.allSettled(
        childProcesses.map((process) => waitForExit(process)),
    );

    if (includeUntracked) {
        try {
            await ensureMountedContent({ logPrefix: "[dev:cleanup]" });
        } catch (error) {
            console.error(
                "[dev:cleanup] failed to restore tracked-only mount",
                error,
            );
            exitCode = exitCode || 1;
        }
    }

    process.exit(exitCode);
}

for (const signal of ["SIGINT", "SIGTERM"] as const) {
    process.on(signal, () => {
        void shutdown(0, signal);
    });
}

const { code } = await Promise.race([
    waitForExit(watchProcess).then((exitCode) => ({
        name: "watch",
        code: exitCode,
    })),
    waitForExit(astroProcess).then((exitCode) => ({
        name: "astro",
        code: exitCode,
    })),
]);

await shutdown(code ?? 0);
