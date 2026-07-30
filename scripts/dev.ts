import {
    ensureMountedContent,
    onlyPublishIntentFlag,
    parseMountContentArgs,
    syncBackupDraftMirror,
} from "./mount-content";

const root = process.cwd();
const args = process.argv.slice(2);
const onlyPublishedFlag = "--only-published";
const onlyPublished = args.includes(onlyPublishedFlag);
const { mode } = parseMountContentArgs(args);
const astroArgs = args.filter(
    (arg) => arg !== onlyPublishIntentFlag && arg !== onlyPublishedFlag,
);
type ManagedProcess = ReturnType<typeof Bun.spawn>;

if (onlyPublished && mode === "publish-intent") {
    throw new Error(
        `${onlyPublishIntentFlag} and ${onlyPublishedFlag} cannot be used together`,
    );
}

function spawnProcess(
    cmd: string[],
    options: {
        env?: Record<string, string>;
        stdin?: "ignore" | "inherit";
    } = {},
) {
    return Bun.spawn(cmd, {
        cwd: root,
        env: { ...Bun.env, ...options.env },
        stdin: options.stdin === "inherit" ? "inherit" : null,
        stdout: "inherit",
        stderr: "inherit",
    });
}

const waitForExit = async (process: ManagedProcess) => await process.exited;

const terminate = (
    processes: ManagedProcess[],
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

const childProcesses: ManagedProcess[] = [];

if (!onlyPublished) {
    await ensureMountedContent({ mode });
    await syncBackupDraftMirror();

    const watchArgs = ["--skip-initial-sync"];
    if (mode === "publish-intent") {
        watchArgs.push(onlyPublishIntentFlag);
    }

    childProcesses.push(
        spawnProcess([
            process.execPath,
            "--bun",
            "./scripts/watch-content.ts",
            ...watchArgs,
        ]),
    );
}

const astroProcess = spawnProcess(
    [
        process.execPath,
        "--bun",
        "./node_modules/.bin/astro",
        "dev",
        ...astroArgs,
    ],
    {
        env: { CONTENT_PREVIEW: onlyPublished ? "false" : "true" },
        stdin: "inherit",
    },
);
childProcesses.push(astroProcess);
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

    process.exit(exitCode);
}

for (const signal of ["SIGINT", "SIGTERM"] as const) {
    process.on(signal, () => {
        void shutdown(0, signal);
    });
}

const { code } = await Promise.race([
    ...childProcesses.map((childProcess) =>
        waitForExit(childProcess).then((exitCode) => ({
            code: exitCode,
        })),
    ),
]);

await shutdown(code ?? 0);
