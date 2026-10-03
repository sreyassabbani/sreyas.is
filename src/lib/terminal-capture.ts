import { createHash } from "node:crypto";
import { normalizeTerminalHtml } from "./terminal-html";

export type TerminalCapture = {
    version: 1;
    imageSha256: string;
    pixelRatio: number;
    html: string;
};

export function imageDigest(image: Uint8Array) {
    return createHash("sha256").update(image).digest("hex");
}

export function validateTerminalCapture(
    value: unknown,
    image: Uint8Array,
): TerminalCapture {
    if (typeof value !== "object" || value === null)
        throw new Error("invalid terminal capture metadata");
    const capture = value as Partial<TerminalCapture>;
    if (
        capture.version !== 1 ||
        typeof capture.html !== "string" ||
        typeof capture.pixelRatio !== "number" ||
        !Number.isFinite(capture.pixelRatio) ||
        capture.pixelRatio < 1 ||
        capture.pixelRatio > 4
    ) {
        throw new Error("invalid terminal capture metadata");
    }
    if (capture.imageSha256 !== imageDigest(image))
        throw new Error(
            "terminal text does not match its screenshot; recapture both together",
        );
    normalizeTerminalHtml(capture.html);
    return capture as TerminalCapture;
}
