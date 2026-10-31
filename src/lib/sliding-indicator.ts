import { animate, motionValue } from "motion";
import {
    type HighlightRect,
    highlightPositionTransition,
    highlightTarget,
} from "@/lib/highlight-motion";
import { spring } from "@/lib/springs";

type IndicatorOptions = {
    container: HTMLElement;
    indicator: HTMLElement;
    transition?:
        | typeof spring.fast
        | typeof spring.moderate
        | typeof spring.slow;
    onUpdate?: (rect: HighlightRect) => void;
};

/**
 * A single, measured indicator that follows any descendant of its container.
 * The caller owns selection, hover, and semantics; this only moves the visual
 * layer. Repositioning the same target after layout changes snaps into place.
 */
export function createSlidingIndicator({
    container,
    indicator,
    transition = spring.moderate,
    onUpdate,
}: IndicatorOptions) {
    const values = {
        x: motionValue(0),
        y: motionValue(0),
        width: motionValue(0),
        height: motionValue(0),
    };
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let target: HTMLElement | null = null;
    let positioned = false;
    let frame = 0;

    const render = () => {
        frame = 0;
        indicator.style.transform = `translate(${values.x.get()}px, ${values.y.get()}px)`;
        indicator.style.width = `${values.width.get()}px`;
        indicator.style.height = `${values.height.get()}px`;
        onUpdate?.({
            left: values.x.get(),
            top: values.y.get(),
            width: values.width.get(),
            height: values.height.get(),
        });
    };
    const scheduleRender = () => {
        if (!frame) frame = requestAnimationFrame(render);
    };
    const subscriptions = Object.values(values).map((value) =>
        value.on("change", scheduleRender),
    );

    const moveToRect = (rect: HighlightRect, snap = false) => {
        if (!rect.width || !rect.height) return;
        const coordinates = highlightTarget(rect);
        const immediate = snap || !positioned || reducedMotion.matches;
        positioned = true;
        for (const key of ["x", "y", "width", "height"] as const) {
            if (immediate) values[key].jump(coordinates[key]);
            else if (Math.abs(values[key].get() - coordinates[key]) > 0.1) {
                void animate(
                    values[key],
                    coordinates[key],
                    highlightPositionTransition(transition, false),
                );
            }
        }
        if (immediate) {
            if (frame) cancelAnimationFrame(frame);
            render();
        }
        indicator.hidden = false;
    };

    const move = (next: HTMLElement | null, snap = false) => {
        if (!next || !container.contains(next)) {
            target = null;
            positioned = false;
            for (const value of Object.values(values)) value.stop();
            indicator.hidden = true;
            return;
        }
        target = next;
        const base = container.getBoundingClientRect();
        const rect = next.getBoundingClientRect();
        moveToRect(
            {
                left: rect.left - base.left,
                top: rect.top - base.top,
                width: rect.width,
                height: rect.height,
            },
            snap,
        );
    };

    return {
        move,
        /** Move to a point or rectangle in the container's coordinate space. */
        moveToRect: (rect: HighlightRect, snap = false) => {
            target = null;
            moveToRect(rect, snap);
        },
        remeasure: () => move(target, true),
        destroy: () => {
            if (frame) cancelAnimationFrame(frame);
            for (const unsubscribe of subscriptions) unsubscribe();
            for (const value of Object.values(values)) value.stop();
        },
    };
}
