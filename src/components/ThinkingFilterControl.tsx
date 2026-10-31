"use client";

import {
    CalendarDaysIcon,
    CheckIcon,
    FunnelIcon,
    type LucideIcon,
    TagsIcon,
    XIcon,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button-variants";
import { FluidList, useFluidListItem } from "@/components/ui/fluid-list";
import {
    pickerIndicatorClass,
    pickerItemClass,
} from "@/components/ui/picker-styles";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { useThinkingFilters } from "@/hooks/use-thinking-filters";
import {
    getThinkingFiltersHref,
    type ThinkingFilters,
} from "@/lib/thinking-filters";
import { cn } from "@/lib/utils";

type Props = {
    pathname: string;
};

type FilterOption = Readonly<{
    key: "date" | "subject";
    label: string;
    icon: LucideIcon;
}>;

const options: readonly FilterOption[] = [
    {
        key: "date",
        label: "By date",
        icon: CalendarDaysIcon,
    },
    {
        key: "subject",
        label: "By subject",
        icon: TagsIcon,
    },
];

const controlChromeClass = cn(
    buttonVariants({ variant: "outline", size: "icon" }),
    "rounded-full bg-background text-foreground shadow-none transition-colors duration-200 hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:bg-background dark:hover:bg-secondary",
);

// The pill clips both halves to its outline: the funnel and X are plain
// rectangles inside it, so their hit areas tile the pill with no gaps. They're
// measured from the pill's outer edge (hence -ml-px past its 1px border) so
// each icon sits on the center of its circle. It
// expands on hover/focus, and turns red while the X is hovered or focused.
const pillActiveClass = cn(
    "border-primary bg-primary text-primary-foreground hover:w-16 hover:bg-primary hover:text-primary-foreground focus-within:w-16 dark:border-primary dark:bg-primary dark:hover:bg-primary",
    "has-[[data-slot=thinking-filter-clear]:hover]:border-destructive/50 has-[[data-slot=thinking-filter-clear]:hover]:bg-destructive-tint has-[[data-slot=thinking-filter-clear]:hover]:text-foreground",
    "has-[[data-slot=thinking-filter-clear]:focus-visible]:border-destructive/50 has-[[data-slot=thinking-filter-clear]:focus-visible]:bg-destructive-tint has-[[data-slot=thinking-filter-clear]:focus-visible]:text-foreground",
    "dark:has-[[data-slot=thinking-filter-clear]:hover]:border-destructive/50 dark:has-[[data-slot=thinking-filter-clear]:hover]:bg-destructive-tint",
    "dark:has-[[data-slot=thinking-filter-clear]:focus-visible]:border-destructive/50 dark:has-[[data-slot=thinking-filter-clear]:focus-visible]:bg-destructive-tint",
);

// Astro's renderer detection needs an element even when the control itself
// renders nothing, so keep the stateful component behind this boundary.
export function ThinkingFilterControl(props: Props) {
    return <ThinkingFilterControlContent {...props} />;
}

function ThinkingFilterControlContent({ pathname }: Props) {
    const filters = useThinkingFilters(pathname);
    const isThinking: boolean = pathname.startsWith("/thinking");
    const isActive = filters.subject || filters.date;

    if (!isThinking) {
        return null;
    }

    return (
        <Popover>
            {/* Fixed width so the pill can expand without moving the header
                controls. */}
            <fieldset className="relative m-0 h-8 w-16 min-w-16 border-0 p-0">
                <legend className="sr-only">Thinking filters</legend>
                <div
                    className={cn(
                        controlChromeClass,
                        "absolute left-0 top-0 h-8 w-8 justify-start overflow-hidden p-0 transition-[width,background-color,border-color,color] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring/50",
                        isActive && pillActiveClass,
                    )}
                >
                    <PopoverTrigger
                        aria-label="Filter thinking"
                        className={cn(
                            "-ml-px flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center border-0 bg-transparent p-0 text-current outline-none transition-colors duration-200",
                            isActive &&
                                "hover:bg-primary-foreground/10 focus-visible:bg-primary-foreground/10",
                        )}
                    >
                        <FunnelIcon className="size-4" aria-hidden="true" />
                    </PopoverTrigger>

                    {isActive && (
                        <a
                            href="/thinking"
                            aria-label="Clear all thinking filters"
                            data-slot="thinking-filter-clear"
                            className="flex h-8 w-8 shrink-0 items-center justify-center text-current no-underline outline-none transition-colors duration-200 hover:text-destructive focus-visible:text-destructive"
                        >
                            <XIcon className="size-4" aria-hidden="true" />
                        </a>
                    )}
                </div>
            </fieldset>

            <PopoverContent
                align="end"
                sideOffset={8}
                className="w-40 gap-1 p-1"
            >
                <FluidList>
                    {options.map((option) => (
                        <FilterOptionLink
                            key={option.key}
                            option={option}
                            filters={filters}
                        />
                    ))}
                </FluidList>
            </PopoverContent>
        </Popover>
    );
}

function FilterOptionLink({
    option,
    filters,
}: {
    option: FilterOption;
    filters: ThinkingFilters;
}) {
    const item = useFluidListItem<HTMLAnchorElement>();
    const Icon = option.icon;
    const active = filters[option.key];
    const next =
        option.key === "subject"
            ? { ...filters, subject: !active, subjectPath: null }
            : {
                  ...filters,
                  date: !active,
                  range: active ? null : filters.range,
              };

    return (
        <a
            ref={item.ref}
            href={getThinkingFiltersHref(next)}
            aria-label={`${active ? "Remove" : "Add"} ${option.key} filter`}
            onFocus={item.activate}
            className={cn(
                pickerItemClass,
                "text-popover-foreground no-underline",
            )}
        >
            <span className="flex items-center gap-2">
                <Icon className="size-4" aria-hidden="true" />
                <span>{option.label}</span>
            </span>
            {active && (
                <CheckIcon
                    className={pickerIndicatorClass}
                    aria-hidden="true"
                />
            )}
        </a>
    );
}
