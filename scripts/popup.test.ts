import { describe, expect, test } from "bun:test";
import { isDisabledRow } from "../src/lib/popup";

function row(attributes: Record<string, string>): HTMLElement {
    return {
        getAttribute: (name: string) => attributes[name] ?? null,
        hasAttribute: (name: string) => Object.hasOwn(attributes, name),
    } as HTMLElement;
}

describe("popup row availability", () => {
    test("accepts cmdk's explicitly enabled rows and skips disabled rows", () => {
        expect(isDisabledRow(row({ "data-disabled": "false" }))).toBe(false);
        expect(isDisabledRow(row({ "data-disabled": "true" }))).toBe(true);
        expect(isDisabledRow(row({ "data-disabled": "" }))).toBe(true);
        expect(isDisabledRow(row({ "aria-disabled": "true" }))).toBe(true);
    });
});
