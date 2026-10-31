import type { Transition } from "motion/react";
import { spring } from "@/lib/springs";

export type HighlightRect = {
    left: number;
    top: number;
    width: number;
    height: number;
};

/** Shared geometry and spring policy for React and DOM highlight renderers. */
export function highlightTarget(rect: HighlightRect) {
    return {
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height,
    };
}

export function highlightPositionTransition(
    transition: Transition | false | undefined,
    reduceMotion: boolean,
): Transition {
    return transition === false || reduceMotion
        ? { duration: 0 }
        : (transition ?? spring.fast);
}
