import { existsSync, readFileSync } from "node:fs";
import type { ImageMetadata } from "astro";
import {
    type TerminalCapture,
    validateTerminalCapture,
} from "./terminal-capture";

// Astro's image proxy carries a non-enumerable source path during rendering.
// Read only the requested image's companion. Glob-importing content-preview
// assets could include private draft captures in the public build.
// If Astro ever removes this internal field, explicit `html` still works.
export function terminalCaptureFor(
    image: ImageMetadata,
): TerminalCapture | undefined {
    const imagePath = (image as ImageMetadata & { fsPath?: string }).fsPath;
    if (!imagePath?.endsWith(".png")) return undefined;
    const sidecar = imagePath.replace(/\.png$/, ".terminal.json");
    if (!existsSync(sidecar)) return undefined;
    return validateTerminalCapture(
        JSON.parse(readFileSync(sidecar, "utf8")),
        readFileSync(imagePath),
    );
}
