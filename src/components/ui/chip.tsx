import { ChevronDownIcon } from "lucide-react";
import type * as React from "react";

import { cn } from "@/lib/utils";

/**
 * The bordered word + chevron used for every picker in the header sentence
 * ("sreyas.is [thinking] about [calculus]"). Render it through a Base UI
 * trigger (`<PopoverTrigger render={<Chip />}>label</PopoverTrigger>`) so the
 * trigger's `data-popup-open` drives the open state.
 */
function Chip({
    className,
    children,
    ...props
}: React.ComponentProps<"button">) {
    return (
        <button
            type="button"
            data-slot="chip"
            className={cn(
                "group/chip inline-flex min-w-0 cursor-pointer items-center gap-1.5 border-0 bg-transparent p-0 font-brand text-base font-normal text-muted-foreground outline-none md:text-lg",
                className,
            )}
            {...props}
        >
            <span
                data-slot="chip-label"
                className="flex min-w-[calc(3ch+0.75rem+2px)] items-center overflow-hidden rounded border border-muted-foreground/50 px-1.5 py-0.5 transition-colors group-hover/chip:border-primary group-hover/chip:text-primary group-focus-visible/chip:border-primary group-focus-visible/chip:text-primary group-focus-visible/chip:ring-2 group-focus-visible/chip:ring-ring/50 group-data-popup-open/chip:border-primary group-data-popup-open/chip:text-primary"
            >
                <span
                    className={cn(
                        "truncate",
                        children == null && "[font-variant-ligatures:none]",
                    )}
                >
                    {children ?? "..."}
                </span>
            </span>
            <ChevronDownIcon
                aria-hidden="true"
                className="pointer-events-none size-4 shrink-0 transition-colors group-hover/chip:text-primary group-focus-visible/chip:text-primary group-data-popup-open/chip:text-primary"
            />
        </button>
    );
}

export { Chip };
