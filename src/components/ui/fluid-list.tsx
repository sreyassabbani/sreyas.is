"use client";

import * as React from "react";
import { FluidHoverHighlight } from "@/components/fluid-hover-highlight";
import { useFluidHover } from "@/hooks/use-fluid-hover";
import { isDisabledRow } from "@/lib/popup";
import { cn } from "@/lib/utils";

type FluidListContextValue = ReturnType<typeof useFluidHover> & {
    allocateIndex: () => number;
};

const FluidListContext = React.createContext<FluidListContextValue | null>(
    null,
);

/** Fluid's hover system, composed around our existing accessible primitives. */
function FluidList({
    className,
    children,
    keepActiveOnLeave = false,
    layoutKey,
}: React.PropsWithChildren<{
    className?: string;
    keepActiveOnLeave?: boolean;
    layoutKey?: string;
}>) {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const nextIndex = React.useRef(0);
    const allocateIndex = React.useCallback(() => nextIndex.current++, []);
    // In particular, padding around a clear-filter action must stay inert.
    const hover = useFluidHover(containerRef, {
        isItemDisabled: isDisabledRow,
        gapClick: false,
    });
    const { remeasure } = hover;
    // Search libraries may reorder existing DOM nodes without resizing them.
    React.useEffect(() => {
        remeasure();
    }, [layoutKey, remeasure]);

    return (
        <FluidListContext.Provider value={{ ...hover, allocateIndex }}>
            <div
                ref={containerRef}
                role="group"
                data-slot="fluid-list"
                className={cn("relative isolate", className)}
                {...hover.handlers}
                onMouseLeave={
                    keepActiveOnLeave ? undefined : hover.handlers.onMouseLeave
                }
            >
                <FluidHoverHighlight hover={hover} className="rounded-md" />
                {children}
            </div>
        </FluidListContext.Provider>
    );
}

function useFluidListItem<T extends HTMLElement>(forwardedRef?: React.Ref<T>) {
    const context = React.useContext(FluidListContext);
    const register = context?.registerItem;
    const setActive = context?.setActiveIndex;
    const allocateIndex = context?.allocateIndex;
    const indexRef = React.useRef<number | undefined>(undefined);
    const elementRef = React.useRef<T | null>(null);

    // Callback registration also hears cmdk removing a filtered row's DOM
    // while leaving the React wrapper mounted.
    const ref = React.useCallback(
        (element: T | null) => {
            elementRef.current = element;
            if (element && indexRef.current === undefined) {
                indexRef.current = allocateIndex?.();
            }
            const index = indexRef.current;
            if (index !== undefined) register?.(index, element);
            if (typeof forwardedRef === "function") {
                const cleanup = forwardedRef(element);
                if (cleanup) {
                    return () => {
                        elementRef.current = null;
                        if (index !== undefined) register?.(index, null);
                        cleanup();
                    };
                }
            } else if (forwardedRef) {
                forwardedRef.current = element;
            }
        },
        [allocateIndex, forwardedRef, register],
    );

    const activate = React.useCallback(() => {
        if (indexRef.current !== undefined) setActive?.(indexRef.current);
    }, [setActive]);

    return { ref, elementRef, activate, fluid: context !== null };
}

export { FluidList, useFluidListItem };
