import { describe, expect, test } from "bun:test";
import path from "node:path";
import { captureEnvironmentArgs, parseCaptureArgs } from "./capture-terminal";

describe("parseCaptureArgs", () => {
    test("parses an interactive command", () => {
        expect(
            parseCaptureArgs(["yazi", "--cwd", "src/assets", "--", "yazi"]),
        ).toMatchObject({
            command: ["yazi"],
            cwd: path.resolve("src/assets"),
            delay: null,
            force: false,
            keepOpen: false,
            name: "yazi",
        });
    });

    test("parses timed capture options", () => {
        expect(
            parseCaptureArgs([
                "fastfetch",
                "--delay",
                "1.5",
                "--force",
                "--output",
                "/tmp/fastfetch.png",
                "--",
                "fastfetch",
                "--logo",
                "none",
            ]),
        ).toEqual({
            command: ["fastfetch", "--logo", "none"],
            cwd: process.cwd(),
            delay: 1.5,
            force: true,
            keepOpen: false,
            name: "fastfetch",
            output: "/tmp/fastfetch.png",
        });
    });

    test("requires a command after the separator", () => {
        expect(() => parseCaptureArgs(["yazi"])).toThrow(
            "a command is required after --",
        );
    });

    test("returns null for help", () => {
        expect(parseCaptureArgs(["--help"])).toBeNull();
    });

    test("passes help flags through to the captured command", () => {
        expect(
            parseCaptureArgs(["fastfetch", "--", "fastfetch", "--help"]),
        ).toMatchObject({ command: ["fastfetch", "--help"] });
    });
});

describe("captureEnvironmentArgs", () => {
    test("forwards display inputs without leaking unrelated environment", () => {
        expect(
            captureEnvironmentArgs({
                API_TOKEN: "secret",
                LSCOLORS: "Gxfxcxdx",
                LS_COLORS: "di=1;36:ln=35",
                PATH: "/bin:/usr/bin",
                XDG_CONFIG_HOME: "/tmp/config",
            }),
        ).toEqual([
            "--env=LSCOLORS=Gxfxcxdx",
            "--env=LS_COLORS=di=1;36:ln=35",
            "--env=PATH=/bin:/usr/bin",
            "--env=XDG_CONFIG_HOME=/tmp/config",
            "--env=COLORTERM=truecolor",
        ]);
    });

    test("preserves an explicit color terminal mode", () => {
        expect(captureEnvironmentArgs({ COLORTERM: "24bit" })).toEqual([
            "--env=COLORTERM=24bit",
        ]);
    });
});
