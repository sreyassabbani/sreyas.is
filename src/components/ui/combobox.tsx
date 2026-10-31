import { Combobox as ComboboxPrimitive } from "@base-ui/react";
import { CheckIcon, ChevronDownIcon, SearchIcon, XIcon } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { FluidList, useFluidListItem } from "@/components/ui/fluid-list";
import {
    InputGroup,
    InputGroupAddon,
    InputGroupButton,
    InputGroupInput,
} from "@/components/ui/input-group";
import {
    pickerItemClass,
    pickerPopupClass,
} from "@/components/ui/picker-styles";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const Combobox = ComboboxPrimitive.Root;

function ComboboxValue({ ...props }: ComboboxPrimitive.Value.Props) {
    return <ComboboxPrimitive.Value data-slot="combobox-value" {...props} />;
}

function ComboboxTrigger({
    className,
    children,
    showIcon = true,
    ...props
}: ComboboxPrimitive.Trigger.Props & { showIcon?: boolean }) {
    return (
        <ComboboxPrimitive.Trigger
            data-slot="combobox-trigger"
            className={cn("[&_svg:not([class*='size-'])]:size-4", className)}
            {...props}
        >
            {showIcon ? (
                <>
                    {children}
                    <ChevronDownIcon className="pointer-events-none size-4 text-muted-foreground" />
                </>
            ) : (
                children
            )}
        </ComboboxPrimitive.Trigger>
    );
}

/** Search field for a combobox whose trigger is separate from its input. */
function ComboboxSearch({
    className,
    ...props
}: ComboboxPrimitive.Input.Props) {
    return (
        <InputGroup className="h-8! w-auto rounded-lg! border-input/30 bg-input/30 shadow-none!">
            <InputGroupAddon>
                <SearchIcon className="opacity-50" />
            </InputGroupAddon>
            <ComboboxPrimitive.Input
                data-slot="combobox-search"
                render={<InputGroupInput />}
                className={className}
                {...props}
            />
        </InputGroup>
    );
}

function ComboboxClear({ className, ...props }: ComboboxPrimitive.Clear.Props) {
    return (
        <ComboboxPrimitive.Clear
            data-slot="combobox-clear"
            render={<InputGroupButton variant="ghost" size="icon-xs" />}
            className={cn(className)}
            {...props}
        >
            <XIcon className="pointer-events-none" />
        </ComboboxPrimitive.Clear>
    );
}

function ComboboxInput({
    className,
    children,
    disabled = false,
    showTrigger = true,
    showClear = false,
    ...props
}: ComboboxPrimitive.Input.Props & {
    showTrigger?: boolean;
    showClear?: boolean;
}) {
    return (
        <InputGroup className={cn("w-auto", className)}>
            <ComboboxPrimitive.Input
                render={<InputGroupInput disabled={disabled} />}
                {...props}
            />
            <InputGroupAddon align="inline-end">
                {showTrigger && (
                    <InputGroupButton
                        size="icon-xs"
                        variant="ghost"
                        render={<ComboboxTrigger />}
                        data-slot="input-group-button"
                        className="group-has-data-[slot=combobox-clear]/input-group:hidden data-pressed:bg-transparent"
                        disabled={disabled}
                    />
                )}
                {showClear && <ComboboxClear disabled={disabled} />}
            </InputGroupAddon>
            {children}
        </InputGroup>
    );
}

function ComboboxContent({
    className,
    side = "bottom",
    sideOffset = 6,
    align = "start",
    alignOffset = 0,
    anchor,
    ...props
}: ComboboxPrimitive.Popup.Props &
    Pick<
        ComboboxPrimitive.Positioner.Props,
        "side" | "align" | "sideOffset" | "alignOffset" | "anchor"
    >) {
    return (
        <ComboboxPrimitive.Portal>
            <ComboboxPrimitive.Positioner
                side={side}
                sideOffset={sideOffset}
                align={align}
                alignOffset={alignOffset}
                anchor={anchor}
                className="isolate z-50"
            >
                <ComboboxPrimitive.Popup
                    data-slot="combobox-content"
                    data-chips={!!anchor}
                    className={cn(
                        pickerPopupClass,
                        "group/combobox-content relative max-h-(--available-height) w-(--anchor-width) max-w-(--available-width) min-w-[calc(var(--anchor-width)+--spacing(7))] overflow-hidden data-[chips=true]:min-w-(--anchor-width) *:data-[slot=input-group]:m-1 *:data-[slot=input-group]:mb-0 *:data-[slot=input-group]:h-8 *:data-[slot=input-group]:border-input/30 *:data-[slot=input-group]:bg-input/30 *:data-[slot=input-group]:shadow-none",
                        className,
                    )}
                    {...props}
                />
            </ComboboxPrimitive.Positioner>
        </ComboboxPrimitive.Portal>
    );
}

function ComboboxList({
    className,
    children,
    ...props
}: ComboboxPrimitive.List.Props) {
    return (
        <ScrollArea
            className="max-h-[min(calc(--spacing(72)---spacing(9)),calc(var(--available-height)---spacing(9)))]"
            viewportClassName="scroll-fade-y h-auto max-h-[inherit] scroll-py-1 overscroll-contain overflow-x-hidden! [&>[data-slot=scroll-area-content]]:min-w-0!"
        >
            <ComboboxPrimitive.List
                data-slot="combobox-list"
                className={cn(
                    "p-1 pr-3 outline-none data-empty:p-0",
                    className,
                )}
                {...props}
            >
                <FluidList keepActiveOnLeave>
                    {typeof children === "function" ? (
                        <ComboboxPrimitive.Collection>
                            {children}
                        </ComboboxPrimitive.Collection>
                    ) : (
                        children
                    )}
                </FluidList>
            </ComboboxPrimitive.List>
        </ScrollArea>
    );
}

function ComboboxItem({
    className,
    children,
    ref,
    trailing,
    ...props
}: ComboboxPrimitive.Item.Props & { trailing?: React.ReactNode }) {
    const item = useFluidListItem<HTMLDivElement>(ref);

    // Base UI keeps focus on the search input and updates the highlighted row
    // through aria-activedescendant, so row focus alone cannot drive the fill.
    React.useEffect(() => {
        const element = item.elementRef.current;
        if (!element) return;
        const sync = () => {
            if (element.hasAttribute("data-highlighted")) item.activate();
        };
        const observer = new MutationObserver(sync);
        observer.observe(element, {
            attributes: true,
            attributeFilter: ["data-highlighted"],
        });
        sync();
        return () => observer.disconnect();
    }, [item.activate, item.elementRef]);

    return (
        <ComboboxPrimitive.Item
            ref={item.ref}
            data-slot="combobox-item"
            className={cn(
                pickerItemClass,
                "group/combobox-item",
                !item.fluid && "data-highlighted:bg-hover",
                className,
            )}
            {...props}
        >
            {children}
            <span className="pointer-events-none absolute right-2 flex min-w-[3ch] items-center justify-end">
                {trailing != null && (
                    <span className="group-data-selected/combobox-item:hidden">
                        {trailing}
                    </span>
                )}
                <ComboboxPrimitive.ItemIndicator>
                    <CheckIcon className="pointer-events-none" />
                </ComboboxPrimitive.ItemIndicator>
            </span>
        </ComboboxPrimitive.Item>
    );
}

function ComboboxGroup({ className, ...props }: ComboboxPrimitive.Group.Props) {
    return (
        <ComboboxPrimitive.Group
            data-slot="combobox-group"
            className={cn(className)}
            {...props}
        />
    );
}

function ComboboxLabel({
    className,
    ...props
}: ComboboxPrimitive.GroupLabel.Props) {
    return (
        <ComboboxPrimitive.GroupLabel
            data-slot="combobox-label"
            className={cn(
                "px-2 py-1.5 text-xs text-muted-foreground",
                className,
            )}
            {...props}
        />
    );
}

function ComboboxCollection({ ...props }: ComboboxPrimitive.Collection.Props) {
    return (
        <ComboboxPrimitive.Collection
            data-slot="combobox-collection"
            {...props}
        />
    );
}

function ComboboxEmpty({ className, ...props }: ComboboxPrimitive.Empty.Props) {
    return (
        <ComboboxPrimitive.Empty
            data-slot="combobox-empty"
            className={cn(
                "hidden w-full justify-center py-2 text-center text-sm text-muted-foreground group-data-empty/combobox-content:flex",
                className,
            )}
            {...props}
        />
    );
}

function ComboboxSeparator({
    className,
    ...props
}: ComboboxPrimitive.Separator.Props) {
    return (
        <ComboboxPrimitive.Separator
            data-slot="combobox-separator"
            className={cn("-mx-1 my-1 h-px bg-border", className)}
            {...props}
        />
    );
}

function ComboboxChips({
    className,
    ...props
}: React.ComponentPropsWithRef<typeof ComboboxPrimitive.Chips> &
    ComboboxPrimitive.Chips.Props) {
    return (
        <ComboboxPrimitive.Chips
            data-slot="combobox-chips"
            className={cn(
                "flex min-h-8 flex-wrap items-center gap-1 rounded-lg border border-input bg-transparent bg-clip-padding px-2.5 py-1 text-sm transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 has-aria-invalid:border-destructive has-aria-invalid:ring-3 has-aria-invalid:ring-destructive/20 has-data-[slot=combobox-chip]:px-1 dark:bg-input/30 dark:has-aria-invalid:border-destructive/50 dark:has-aria-invalid:ring-destructive/40",
                className,
            )}
            {...props}
        />
    );
}

function ComboboxChip({
    className,
    children,
    showRemove = true,
    ...props
}: ComboboxPrimitive.Chip.Props & {
    showRemove?: boolean;
}) {
    return (
        <ComboboxPrimitive.Chip
            data-slot="combobox-chip"
            className={cn(
                "flex h-[calc(--spacing(5.25))] w-fit items-center justify-center gap-1 rounded-sm bg-muted px-1.5 text-xs font-medium whitespace-nowrap text-foreground has-disabled:pointer-events-none has-disabled:cursor-not-allowed has-disabled:opacity-50 has-data-[slot=combobox-chip-remove]:pr-0",
                className,
            )}
            {...props}
        >
            {children}
            {showRemove && (
                <ComboboxPrimitive.ChipRemove
                    render={<Button variant="ghost" size="icon-xs" />}
                    className="-ml-1 opacity-50 hover:opacity-100"
                    data-slot="combobox-chip-remove"
                >
                    <XIcon className="pointer-events-none" />
                </ComboboxPrimitive.ChipRemove>
            )}
        </ComboboxPrimitive.Chip>
    );
}

function ComboboxChipsInput({
    className,
    ...props
}: ComboboxPrimitive.Input.Props) {
    return (
        <ComboboxPrimitive.Input
            data-slot="combobox-chip-input"
            className={cn("min-w-16 flex-1 outline-none", className)}
            {...props}
        />
    );
}

function useComboboxAnchor() {
    return React.useRef<HTMLDivElement | null>(null);
}

export {
    Combobox,
    ComboboxInput,
    ComboboxSearch,
    ComboboxContent,
    ComboboxList,
    ComboboxItem,
    ComboboxGroup,
    ComboboxLabel,
    ComboboxCollection,
    ComboboxEmpty,
    ComboboxSeparator,
    ComboboxChips,
    ComboboxChip,
    ComboboxChipsInput,
    ComboboxTrigger,
    ComboboxValue,
    useComboboxAnchor,
};
