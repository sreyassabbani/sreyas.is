import { randomUUID } from "node:crypto";
import { rmSync } from "node:fs";
import { access, mkdir, readFile, rename, rm, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createInterface } from "node:readline/promises";
import { setTimeout as sleep } from "node:timers/promises";
import sharp from "sharp";

const root = path.resolve(import.meta.dir, "..");
const ghosttyApp = "/Applications/Ghostty.app";
const ghosttyBinary = path.join(ghosttyApp, "Contents/MacOS/ghostty");
const captureConfig = path.join(
    import.meta.dir,
    "terminal-capture/ghostty.conf",
);
const windowIdHelper = path.join(
    import.meta.dir,
    "terminal-capture/window-id.swift",
);
const commandRunner = path.join(
    import.meta.dir,
    "terminal-capture/run-command.zsh",
);
const defaultOutputDirectory = path.join(
    os.homedir(),
    "workflow/content/posts/components/terminal-delights/media",
);
const captureFont = "GeistMono Nerd Font Mono";
const supportedGhosttyVersion = "Ghostty 1.3.1";
const expectedCaptureSize = { width: 2016, height: 1368 };
const forwardedEnvironmentNames = [
    "HOME",
    "LANG",
    "LC_ALL",
    "LC_CTYPE",
    "LSCOLORS",
    "LS_COLORS",
    "PATH",
    "TERMINFO_DIRS",
    "XDG_CACHE_HOME",
    "XDG_CONFIG_DIRS",
    "XDG_CONFIG_HOME",
    "XDG_DATA_DIRS",
    "XDG_DATA_HOME",
    "YAZI_CONFIG_HOME",
    "YAZI_FILE_ONE",
] as const;

type CaptureOptions = {
    command: string[];
    cwd: string;
    delay: number | null;
    force: boolean;
    keepOpen: boolean;
    name: string;
    output: string;
};

function printUsage() {
    console.log(`Usage:
  bun run capture:terminal -- <name> [options] -- <command> [args...]

Options:
  --cwd <path>       Initial terminal directory (default: current directory)
  --output <path>    PNG destination (default: terminal-delights media folder)
  --delay <seconds>  Capture automatically after a delay instead of waiting
  --force            Replace an existing output file
  --keep-open        Leave the temporary Ghostty instance open after capture
  --help             Show this help

Interactive example:
  bun run capture:terminal -- yazi --cwd ~/workflow/sreyas.is -- yazi --client-id 923481

Timed example:
  bun run capture:terminal -- fastfetch --delay 2 -- fastfetch --logo none`);
}

function expandHome(value: string) {
    if (value === "~") return os.homedir();
    if (value.startsWith("~/")) {
        return path.join(os.homedir(), value.slice(2));
    }

    return value;
}

function parsePositiveNumber(value: string, flag: string) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) {
        throw new Error(`${flag} must be a non-negative number`);
    }

    return parsed;
}

function takeValue(args: string[], index: number, flag: string) {
    const value = args[index + 1];
    if (!value) throw new Error(`${flag} requires a value`);
    return value;
}

export function parseCaptureArgs(args: string[]): CaptureOptions | null {
    const separatorIndex = args.indexOf("--");
    const optionArgs =
        separatorIndex === -1 ? args : args.slice(0, separatorIndex);
    const command = separatorIndex === -1 ? [] : args.slice(separatorIndex + 1);
    if (optionArgs.includes("--help") || optionArgs.includes("-h")) return null;
    const name = optionArgs[0];

    if (!name) throw new Error("a capture name is required");
    if (!/^[a-z0-9][a-z0-9_-]*$/.test(name)) {
        throw new Error(
            "capture names must use lowercase letters, numbers, hyphens, or underscores",
        );
    }
    if (command.length === 0) {
        throw new Error("a command is required after --");
    }

    let cwd = process.cwd();
    let delay: number | null = null;
    let force = false;
    let keepOpen = false;
    let output = path.join(defaultOutputDirectory, `${name}.png`);

    for (let index = 1; index < optionArgs.length; index += 1) {
        const arg = optionArgs[index];

        switch (arg) {
            case "--cwd":
                cwd = takeValue(optionArgs, index, arg);
                index += 1;
                break;
            case "--output":
                output = takeValue(optionArgs, index, arg);
                index += 1;
                break;
            case "--delay":
                delay = parsePositiveNumber(
                    takeValue(optionArgs, index, arg),
                    arg,
                );
                index += 1;
                break;
            case "--force":
                force = true;
                break;
            case "--keep-open":
                keepOpen = true;
                break;
            default:
                throw new Error(`unknown option: ${arg}`);
        }
    }

    return {
        command,
        cwd: path.resolve(expandHome(cwd)),
        delay,
        force,
        keepOpen,
        name,
        output: path.resolve(expandHome(output)),
    };
}

function run(command: string[], options: { ignoreExitCode?: boolean } = {}) {
    const result = Bun.spawnSync(command, {
        cwd: root,
        env: Bun.env,
        stdout: "pipe",
        stderr: "pipe",
    });

    if (result.exitCode !== 0 && !options.ignoreExitCode) {
        const message = result.stderr.toString().trim();
        throw new Error(message || `command failed: ${command.join(" ")}`);
    }

    return result.stdout.toString().trim();
}

function ghosttyProcesses() {
    const output = run(["/bin/ps", "-ww", "-axo", "pid=,command="]);
    const processes = new Map<number, string>();

    for (const line of output.split("\n")) {
        const match = line.trim().match(/^(\d+)\s+(.+)$/);
        if (!match || !match[2].includes(ghosttyBinary)) continue;
        processes.set(Number(match[1]), match[2]);
    }

    return processes;
}

async function waitForCaptureProcess(captureId: string, timeoutMs = 12_000) {
    const deadline = Date.now() + timeoutMs;
    const marker = `TERMINAL_CAPTURE_ID=${captureId}`;

    while (Date.now() < deadline) {
        const nextPid = [...ghosttyProcesses()].find(([, command]) =>
            command.includes(marker),
        )?.[0];
        if (nextPid) return nextPid;
        await sleep(100);
    }

    throw new Error("timed out waiting for the capture Ghostty process");
}

export function captureEnvironmentArgs(
    environment: Record<string, string | undefined>,
) {
    const values = forwardedEnvironmentNames.flatMap((name) => {
        const value = environment[name];
        return value ? [`--env=${name}=${value}`] : [];
    });

    if (!environment.COLORTERM) values.push("--env=COLORTERM=truecolor");
    else values.push(`--env=COLORTERM=${environment.COLORTERM}`);

    return values;
}

async function waitForWindowId(
    pid: number,
    windowTitle: string,
    timeoutMs = 12_000,
) {
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
        const result = Bun.spawnSync(
            ["/usr/bin/swift", windowIdHelper, String(pid), windowTitle],
            { stdout: "pipe", stderr: "pipe" },
        );
        const windowId = Number(result.stdout.toString().trim());
        if (result.exitCode === 0 && Number.isInteger(windowId)) {
            return windowId;
        }
        await sleep(150);
    }

    throw new Error("timed out waiting for the capture Ghostty window");
}

function assertScreenCapturePermission() {
    const result = Bun.spawnSync(
        ["/usr/bin/swift", windowIdHelper, "--preflight"],
        { stdout: "pipe", stderr: "pipe" },
    );
    if (result.exitCode !== 0 || result.stdout.toString().trim() !== "true") {
        throw new Error(
            "macOS Screen Recording permission is required for the shell running Bun; enable it in System Settings → Privacy & Security → Screen & System Audio Recording",
        );
    }
}

function quoteCommandPart(value: string) {
    return `'${value.replaceAll("'", `'\\''`)}'`;
}

function resolveExecutable(command: string[]) {
    const [executable, ...rest] = command;
    if (executable.includes("/")) return command;

    const resolved = Bun.which(executable);
    if (!resolved) throw new Error(`command not found: ${executable}`);
    return [resolved, ...rest];
}

async function waitForCapture(options: CaptureOptions) {
    if (options.delay !== null) {
        console.log(
            `[terminal-capture] capturing in ${options.delay.toFixed(1)}s`,
        );
        await sleep(options.delay * 1000);
        return;
    }

    console.log(
        "[terminal-capture] stage the new Ghostty window, return here, then press Enter",
    );
    const prompt = createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    await prompt.question("");
    prompt.close();
}

async function fileExists(filePath: string) {
    try {
        await access(filePath);
        return true;
    } catch {
        return false;
    }
}

async function assertCommandDidNotFail(statusFile: string) {
    if (!(await fileExists(statusFile))) return;

    const exitCode = Number((await readFile(statusFile, "utf8")).trim());
    if (!Number.isInteger(exitCode)) {
        throw new Error("capture command wrote an invalid exit status");
    }
    if (exitCode !== 0) {
        throw new Error(`capture command exited with status ${exitCode}`);
    }
}

async function captureTerminal(options: CaptureOptions) {
    for (const requiredPath of [
        ghosttyBinary,
        captureConfig,
        windowIdHelper,
        commandRunner,
    ]) {
        await access(requiredPath);
    }
    const cwdStats = await stat(options.cwd);
    if (!cwdStats.isDirectory()) {
        throw new Error(
            `capture working directory is not a directory: ${options.cwd}`,
        );
    }

    if (!options.force && (await fileExists(options.output))) {
        throw new Error(
            `${options.output} already exists; pass --force to replace it`,
        );
    }

    assertScreenCapturePermission();
    run([ghosttyBinary, "+validate-config", `--config-file=${captureConfig}`]);
    const ghosttyVersion = run([ghosttyBinary, "--version"]).split("\n")[0];
    if (ghosttyVersion !== supportedGhosttyVersion) {
        throw new Error(
            `capture profile expects ${supportedGhosttyVersion}; found ${ghosttyVersion}. Review rendering changes before updating the baseline`,
        );
    }
    const availableFonts = run([ghosttyBinary, "+list-fonts"]);
    if (!availableFonts.split("\n").includes(captureFont)) {
        throw new Error(
            `required capture font is not installed: ${captureFont}`,
        );
    }

    const captureId = randomUUID();
    const windowTitle = `terminal-capture-${captureId}`;
    const commandStatusFile = path.join(
        os.tmpdir(),
        `terminal-capture-${captureId}.status`,
    );
    const resolvedCommand = resolveExecutable(options.command);
    const commandValue = [
        "/bin/zsh",
        commandRunner,
        commandStatusFile,
        ...resolvedCommand,
    ]
        .map(quoteCommandPart)
        .join(" ");
    const openArgs = [
        "/usr/bin/open",
        "-na",
        ghosttyApp,
        "--args",
        "--config-default-files=false",
        `--config-file=${captureConfig}`,
        `--title=${windowTitle}`,
        `--working-directory=${options.cwd}`,
        `--env=TERMINAL_CAPTURE_ID=${captureId}`,
        ...captureEnvironmentArgs(process.env),
        `--command=${commandValue}`,
    ];

    const openProcess = Bun.spawn(openArgs, {
        cwd: options.cwd,
        env: Bun.env,
        stdout: "pipe",
        stderr: "pipe",
    });
    const openExitCode = await openProcess.exited;
    if (openExitCode !== 0) {
        throw new Error(
            (await new Response(openProcess.stderr).text()).trim() ||
                "failed to launch Ghostty",
        );
    }

    let pid: number | undefined;
    let shouldClose = !options.keepOpen;

    const closeCaptureInstance = () => {
        if (!shouldClose) return;
        shouldClose = false;
        const capturePids = pid
            ? [pid]
            : [...ghosttyProcesses()]
                  .filter(([, command]) =>
                      command.includes(`TERMINAL_CAPTURE_ID=${captureId}`),
                  )
                  .map(([capturePid]) => capturePid);
        for (const capturePid of capturePids) {
            try {
                process.kill(capturePid, "SIGTERM");
            } catch {
                // The command may have already closed its dedicated window.
            }
        }
    };

    const signalHandlers = new Map<NodeJS.Signals, () => void>();
    for (const signal of ["SIGINT", "SIGTERM"] as const) {
        const handler = () => {
            closeCaptureInstance();
            rmSync(commandStatusFile, { force: true });
            process.exit(130);
        };
        signalHandlers.set(signal, handler);
        process.once(signal, handler);
    }

    let rawOutput: string | undefined;
    let normalizedOutput: string | undefined;
    try {
        pid = await waitForCaptureProcess(captureId);
        const windowId = await waitForWindowId(pid, windowTitle);
        console.log(`[terminal-capture] ready: pid ${pid}, window ${windowId}`);
        await waitForCapture(options);
        await assertCommandDidNotFail(commandStatusFile);
        await mkdir(path.dirname(options.output), { recursive: true });
        rawOutput = path.join(
            path.dirname(options.output),
            `${path.basename(options.output)}.${randomUUID()}.raw.png`,
        );
        normalizedOutput = path.join(
            path.dirname(options.output),
            `${path.basename(options.output)}.${randomUUID()}.normalized.png`,
        );

        run([
            "/usr/sbin/screencapture",
            "-x",
            "-o",
            "-r",
            "-t",
            "png",
            `-l${windowId}`,
            rawOutput,
        ]);

        if (!(await fileExists(rawOutput))) {
            throw new Error(
                "macOS did not produce a screenshot; verify Screen Recording permission and that the capture window stayed open",
            );
        }
        await sharp(rawOutput)
            .toColorspace("srgb")
            .withIccProfile("srgb")
            .png({ compressionLevel: 9 })
            .toFile(normalizedOutput);

        const image = sharp(normalizedOutput);
        const metadata = await image.metadata();
        if (!metadata.width || !metadata.height) {
            throw new Error("the captured PNG has invalid dimensions");
        }
        if (
            metadata.width !== expectedCaptureSize.width ||
            metadata.height !== expectedCaptureSize.height
        ) {
            throw new Error(
                `capture was ${metadata.width}×${metadata.height}; expected ${expectedCaptureSize.width}×${expectedCaptureSize.height}. Keep the Ghostty window on the Retina display or intentionally update the capture baseline`,
            );
        }
        const stats = await image.stats();
        if (
            stats.channels.slice(0, 3).every((channel) => channel.stdev < 0.5)
        ) {
            throw new Error(
                "capture is visually blank; check macOS Screen Recording permission for the shell running Bun",
            );
        }

        await rename(normalizedOutput, options.output);
        normalizedOutput = undefined;

        console.log(
            `[terminal-capture] wrote ${metadata.width}×${metadata.height} PNG -> ${options.output}`,
        );
    } finally {
        for (const [signal, handler] of signalHandlers) {
            process.off(signal, handler);
        }
        if (rawOutput) await rm(rawOutput, { force: true });
        if (normalizedOutput) await rm(normalizedOutput, { force: true });
        await rm(commandStatusFile, { force: true });
        closeCaptureInstance();
    }
}

if (import.meta.main) {
    try {
        const options = parseCaptureArgs(process.argv.slice(2));
        if (!options) {
            printUsage();
            process.exit(0);
        }

        await captureTerminal(options);
    } catch (error) {
        console.error(
            `[terminal-capture] ${error instanceof Error ? error.message : String(error)}`,
        );
        process.exit(1);
    }
}
