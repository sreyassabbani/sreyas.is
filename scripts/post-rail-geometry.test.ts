import { afterAll, beforeAll, expect, test } from "bun:test";
import {
    postRailHoverWidth,
    visiblePostLeft,
} from "../src/lib/post-rail-geometry";

test("keeps the normal post gutter target when visible content stays inside prose", () => {
    expect(postRailHoverWidth(500, 500)).toBe(224);
    expect(postRailHoverWidth(256, 256)).toBe(224);
});

test("uses a narrow edge for any content protruding left of the post", () => {
    expect(postRailHoverWidth(500, 203)).toBe(28);
    expect(postRailHoverWidth(500, 350)).toBe(28);
    expect(postRailHoverWidth(500, 40)).toBe(24);
});

test("keeps a reachable minimum strip for full-bleed content", () => {
    expect(postRailHoverWidth(500, 0)).toBe(8);
    expect(postRailHoverWidth(500, -100)).toBe(8);
});

test("maintains clearance from ordinary content in a smaller gutter", () => {
    expect(postRailHoverWidth(180, 180)).toBe(164);
    expect(postRailHoverWidth(20, 20)).toBe(8);
});

type Rect = { left: number; right: number; top: number; bottom: number };
const viewport = { left: 0, right: 1800, top: 0, bottom: 1000 };
const styles = new WeakMap<Element, Partial<CSSStyleDeclaration>>();
const originalGetComputedStyle = globalThis.getComputedStyle;

beforeAll(() => {
    globalThis.getComputedStyle = (element) =>
        ({
            display: "block",
            opacity: "1",
            visibility: "visible",
            contentVisibility: "visible",
            overflowX: "visible",
            overflowY: "visible",
            ...styles.get(element),
        }) as CSSStyleDeclaration;
});

afterAll(() => {
    globalThis.getComputedStyle = originalGetComputedStyle;
});

function box(
    rect: Rect,
    children: Element[] = [],
    style: Partial<CSSStyleDeclaration> = {},
): Element {
    const element = {
        getBoundingClientRect: () => rect,
        children,
    } as unknown as Element;
    styles.set(element, style);
    return element;
}

function post(children: Element[]): Element {
    return box({ left: 500, right: 1300, top: 0, bottom: 2000 }, children);
}

test("measures generic protruding descendant geometry without renderer selectors", () => {
    const child = box({ left: 203, right: 1500, top: 100, bottom: 600 });
    expect(visiblePostLeft(post([child]), viewport)).toBe(203);
});

test("ignores hidden subtrees and content outside the viewport", () => {
    const protrusion = box({ left: 10, right: 600, top: 100, bottom: 400 });
    for (const style of [
        { display: "none" },
        { opacity: "0" },
        { contentVisibility: "hidden" },
    ]) {
        const hidden = box(
            { left: 10, right: 600, top: 100, bottom: 400 },
            [protrusion],
            style,
        );
        expect(visiblePostLeft(post([hidden]), viewport)).toBe(500);
    }
    const offscreen = box({ left: 10, right: 600, top: 1100, bottom: 1300 });
    expect(visiblePostLeft(post([offscreen]), viewport)).toBe(500);
});

test("measures only the visible part of horizontally clipped children", () => {
    const oversized = box({ left: 100, right: 900, top: 100, bottom: 200 });
    const scrollContainer = box(
        { left: 500, right: 800, top: 100, bottom: 200 },
        [oversized],
        { overflowX: "hidden" },
    );
    expect(visiblePostLeft(post([scrollContainer]), viewport)).toBe(500);
});

test("inspects visible overflow even when the wrapper itself is offscreen", () => {
    const visible = box({ left: 203, right: 1000, top: 100, bottom: 200 });
    const wrapper = box({ left: 500, right: 1000, top: 1100, bottom: 1200 }, [
        visible,
    ]);
    expect(visiblePostLeft(post([wrapper]), viewport)).toBe(203);
});

test("lets a descendant override inherited visibility while ignoring a hidden box", () => {
    const visible = box({ left: 203, right: 1000, top: 100, bottom: 200 });
    const hidden = box(
        { left: 0, right: 1000, top: 100, bottom: 200 },
        [visible],
        { visibility: "hidden" },
    );
    expect(visiblePostLeft(post([hidden]), viewport)).toBe(203);
});

test("clamps a full-bleed descendant to its visible viewport edge", () => {
    const fullBleed = box({ left: -100, right: 1800, top: 100, bottom: 200 });
    expect(visiblePostLeft(post([fullBleed]), viewport)).toBe(0);
});
