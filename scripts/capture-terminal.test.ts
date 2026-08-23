import { describe, expect, test } from "bun:test";
import path from "node:path";
import {
    captureProcessEnvironment,
    parseCaptureArgs,
} from "./capture-terminal";

describe("parseCaptureArgs", () => {
    test("parses an interactive command", () => {
        expect(
            parseCaptureArgs(["yazi", "--cwd", "src/assets", "--", "yazi"]),
        ).toMatchObject({
            command: ["yazi"],
            cropHeight: null,
            cropTop: 0,
            cropWidth: null,
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
            cropHeight: null,
            cropTop: 0,
            cropWidth: null,
            cwd: process.cwd(),
            delay: 1.5,
            force: true,
            keepOpen: false,
            name: "fastfetch",
            output: "/tmp/fastfetch.png",
            profile: "standard",
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

    test("parses a validated crop height", () => {
        expect(
            parseCaptureArgs(["fast", "--crop-height", "360", "--", "fast"]),
        ).toMatchObject({ cropHeight: 360 });
    });

    test("parses a crop offset", () => {
        expect(
            parseCaptureArgs([
                "tt",
                "--crop-top",
                "300",
                "--crop-height",
                "500",
                "--",
                "tt",
            ]),
        ).toMatchObject({ cropHeight: 500, cropTop: 300 });
    });

    test("parses a validated crop width", () => {
        expect(
            parseCaptureArgs(["fast", "--crop-width", "950", "--", "fast"]),
        ).toMatchObject({ cropWidth: 950 });
    });

    test("rejects crop widths outside the capture baseline", () => {
        expect(() =>
            parseCaptureArgs(["fast", "--crop-width", "2017", "--", "fast"]),
        ).toThrow("cannot exceed 2016 pixels");
    });

    test("requires a crop height with a crop offset", () => {
        expect(() =>
            parseCaptureArgs(["tt", "--crop-top", "300", "--", "tt"]),
        ).toThrow("--crop-top requires --crop-height");
    });

    test("rejects crop heights outside the capture baseline", () => {
        expect(() =>
            parseCaptureArgs(["fast", "--crop-height", "1369", "--", "fast"]),
        ).toThrow("cannot exceed 1368 pixels");
    });

    test("parses the wide profile", () => {
        expect(
            parseCaptureArgs(["yazi", "--profile", "wide", "--", "yazi"]),
        ).toMatchObject({ profile: "wide" });
    });
});

describe("captureProcessEnvironment", () => {
    test("forwards display inputs without leaking unrelated environment", () => {
        expect(
            captureProcessEnvironment({
                API_TOKEN: "secret",
                LSCOLORS: "Gxfxcxdx",
                LS_COLORS: "di=1;36:ln=35",
                PATH: "/bin:/usr/bin",
                XDG_CONFIG_HOME: "/tmp/config",
            }),
        ).toEqual({
            COLORTERM: "truecolor",
            LSCOLORS: "Gxfxcxdx",
            LS_COLORS: "di=1;36:ln=35",
            PATH: "/bin:/usr/bin",
            XDG_CONFIG_HOME: "/tmp/config",
        });
    });

    test("preserves an explicit color terminal mode", () => {
        expect(captureProcessEnvironment({ COLORTERM: "24bit" })).toEqual({
            COLORTERM: "24bit",
        });
    });
});
