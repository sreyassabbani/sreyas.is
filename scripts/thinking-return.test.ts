import { afterEach, describe, expect, test } from "bun:test";
import {
    rememberThinkingOrigin,
    restoreThinkingBackLink,
} from "../src/lib/thinking-return";

const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
const originalDocument = Object.getOwnPropertyDescriptor(
    globalThis,
    "document",
);
const originalStorage = Object.getOwnPropertyDescriptor(
    globalThis,
    "sessionStorage",
);

afterEach(() => {
    for (const [key, descriptor] of [
        ["window", originalWindow],
        ["document", originalDocument],
        ["sessionStorage", originalStorage],
    ] as const) {
        if (descriptor) Object.defineProperty(globalThis, key, descriptor);
        else Reflect.deleteProperty(globalThis, key);
    }
});

function setup() {
    const values = new Map<string, string>();
    let backCalls = 0;
    const mockWindow = {
        location: {
            href: "https://example.com/thinking/about/math/?from=2026-01-01",
        },
        history: {
            length: 2,
            back: () => {
                backCalls++;
            },
        },
    };
    const mockDocument = { referrer: "" };
    Object.defineProperty(globalThis, "window", {
        configurable: true,
        value: mockWindow,
    });
    Object.defineProperty(globalThis, "document", {
        configurable: true,
        value: mockDocument,
    });
    Object.defineProperty(globalThis, "sessionStorage", {
        configurable: true,
        value: {
            setItem: (key: string, value: string) => values.set(key, value),
            getItem: (key: string) => values.get(key) ?? null,
        },
    });
    let onClick: ((event: MouseEvent) => void) | undefined;
    const link = {
        href: "https://example.com/thinking",
        addEventListener: (
            _type: string,
            handler: (event: MouseEvent) => void,
        ) => {
            onClick = handler;
        },
    } as HTMLAnchorElement;
    return {
        mockWindow,
        mockDocument,
        link,
        getBackCalls: () => backCalls,
        click: (options: Partial<MouseEvent> = {}) => {
            let prevented = false;
            onClick?.({
                button: 0,
                preventDefault: () => {
                    prevented = true;
                },
                ...options,
            } as MouseEvent);
            return prevented;
        },
    };
}

describe("returning to Thinking", () => {
    test("links to the filtered origin after section navigation", () => {
        const page = setup();
        const origin = page.mockWindow.location.href;
        rememberThinkingOrigin("https://example.com/thinking/jacobians/");
        page.mockWindow.location.href =
            "https://example.com/thinking/jacobians/#section";
        page.mockDocument.referrer = origin;
        restoreThinkingBackLink(page.link);

        expect(page.link.href).toBe(origin);
        expect(page.link.textContent).toBe(
            "← thinking about math on Jan 1, 2026",
        );
        expect(page.click({ metaKey: true })).toBe(false);
        expect(page.getBackCalls()).toBe(0);
        expect(page.click()).toBe(false);
        expect(page.getBackCalls()).toBe(0);
    });

    test("direct or unrelated visits retain the fallback", () => {
        const page = setup();
        rememberThinkingOrigin("https://example.com/thinking/jacobians/");
        page.mockWindow.location.href =
            "https://example.com/thinking/jacobians/";
        page.mockDocument.referrer = "https://example.com/watching/";
        restoreThinkingBackLink(page.link);
        expect(page.link.href).toBe("https://example.com/thinking");
        expect(page.click()).toBe(false);
        expect(page.getBackCalls()).toBe(0);
    });
});
