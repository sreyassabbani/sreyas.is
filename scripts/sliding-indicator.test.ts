import { afterEach, expect, test } from "bun:test";
import {
    highlightPositionTransition,
    highlightTarget,
} from "../src/lib/highlight-motion";
import { createSlidingIndicator } from "../src/lib/sliding-indicator";
import { spring } from "../src/lib/springs";

const originals = new Map(
    ["window", "requestAnimationFrame", "cancelAnimationFrame"].map((key) => [
        key,
        Object.getOwnPropertyDescriptor(globalThis, key),
    ]),
);

afterEach(() => {
    for (const [key, descriptor] of originals) {
        if (descriptor) Object.defineProperty(globalThis, key, descriptor);
        else Reflect.deleteProperty(globalThis, key);
    }
});

test("the shared highlight motion preserves geometry and reduced-motion behavior", () => {
    expect(
        highlightTarget({ left: 4, top: 8, width: 120, height: 30 }),
    ).toEqual({
        x: 4,
        y: 8,
        width: 120,
        height: 30,
    });
    expect(highlightPositionTransition(undefined, false)).toEqual(spring.fast);
    expect(highlightPositionTransition(spring.moderate, false)).toEqual(
        spring.moderate,
    );
    expect(highlightPositionTransition(spring.moderate, true)).toEqual({
        duration: 0,
    });
    expect(highlightPositionTransition(false, false)).toEqual({ duration: 0 });
});

test("indicator snaps to a measured descendant and handles hidden layout becoming visible", () => {
    Object.defineProperty(globalThis, "window", {
        configurable: true,
        value: { matchMedia: () => ({ matches: true }) },
    });
    Object.defineProperty(globalThis, "requestAnimationFrame", {
        configurable: true,
        value: () => 1,
    });
    Object.defineProperty(globalThis, "cancelAnimationFrame", {
        configurable: true,
        value: () => {},
    });
    let size = 0;
    const target = {
        getBoundingClientRect: () => ({
            left: 110,
            top: 240,
            width: size,
            height: 30,
        }),
    } as HTMLElement;
    const container = {
        contains: (element: HTMLElement) => element === target,
        getBoundingClientRect: () => ({ left: 100, top: 200 }),
    } as HTMLElement;
    const indicator = { hidden: true, style: {} } as HTMLElement;
    const slider = createSlidingIndicator({ container, indicator });

    slider.move(target);
    expect(indicator.hidden).toBe(true);
    size = 120;
    slider.remeasure();
    expect(indicator.hidden).toBe(false);
    expect(indicator.style.transform).toBe("translate(10px, 40px)");
    expect(indicator.style.width).toBe("120px");
    expect(indicator.style.height).toBe("30px");
    slider.moveToRect({ left: 0, top: 65, width: 24, height: 2 });
    expect(indicator.style.transform).toBe("translate(0px, 65px)");
    expect(indicator.style.width).toBe("24px");
    slider.move(null);
    expect(indicator.hidden).toBe(true);
    slider.destroy();
});
