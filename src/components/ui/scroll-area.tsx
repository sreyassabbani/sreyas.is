import { ScrollArea as ScrollAreaPrimitive } from "@base-ui/react/scroll-area";

import { cn } from "@/lib/utils";

function ScrollArea({
    className,
    viewportClassName,
    children,
    ...props
}: ScrollAreaPrimitive.Root.Props & { viewportClassName?: string }) {
    return (
        <ScrollAreaPrimitive.Root
            data-slot="scroll-area"
            className={cn("relative overflow-hidden", className)}
            {...props}
        >
            <ScrollAreaPrimitive.Viewport
                data-slot="scroll-area-viewport"
                className={cn(
                    "size-full rounded-[inherit] transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1",
                    viewportClassName,
                )}
            >
                <ScrollAreaPrimitive.Content data-slot="scroll-area-content">
                    {children}
                </ScrollAreaPrimitive.Content>
            </ScrollAreaPrimitive.Viewport>
            <ScrollBar />
            <ScrollAreaPrimitive.Corner />
        </ScrollAreaPrimitive.Root>
    );
}

function ScrollBar({
    className,
    orientation = "vertical",
    ...props
}: ScrollAreaPrimitive.Scrollbar.Props) {
    return (
        <ScrollAreaPrimitive.Scrollbar
            data-slot="scroll-area-scrollbar"
            data-orientation={orientation}
            orientation={orientation}
            className={cn(
                "group/scrollbar absolute z-20 flex touch-none select-none data-horizontal:h-2.5 data-horizontal:flex-col data-vertical:w-2.5",
                className,
            )}
            {...props}
        >
            <ScrollAreaPrimitive.Thumb
                data-slot="scroll-area-thumb"
                className={cn(
                    "relative rounded-full bg-muted-foreground/70 transition-[width,height,background-color] duration-150 group-hover/scrollbar:bg-foreground/80 motion-reduce:transition-none",
                    orientation === "vertical"
                        ? "mx-auto my-1 h-(--scroll-area-thumb-height) w-1 group-hover/scrollbar:w-1.5"
                        : "mx-1 my-auto h-1 w-(--scroll-area-thumb-width) group-hover/scrollbar:h-1.5",
                )}
            />
        </ScrollAreaPrimitive.Scrollbar>
    );
}

export { ScrollArea, ScrollBar };
