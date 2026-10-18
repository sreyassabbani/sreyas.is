"use client";

import {
    CalendarDaysIcon,
    FunnelIcon,
    type LucideIcon,
    TagsIcon,
    XIcon,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button-variants";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type Props = {
    pathname: string;
};

type FilterOption = Readonly<{
    href: string;
    label: string;
    icon: LucideIcon;
    activePath: string;
}>;

const options: readonly FilterOption[] = [
    {
        href: "/thinking/on/",
        label: "By date",
        icon: CalendarDaysIcon,
        activePath: "/thinking/on",
    },
    {
        href: "/thinking/about/",
        label: "By subject",
        icon: TagsIcon,
        activePath: "/thinking/about",
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

export function ThinkingFilterControl({ pathname }: Props) {
    const isThinking: boolean = pathname.startsWith("/thinking");
    const isActive: boolean =
        isThinking &&
        options.some((option: FilterOption): boolean =>
            pathname.startsWith(option.activePath),
        );

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
                            aria-label="Clear thinking filter"
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
                {options.map((option: FilterOption) => {
                    const Icon: LucideIcon = option.icon;
                    const optionActive: boolean = pathname.startsWith(
                        option.activePath,
                    );

                    return (
                        // The current filter's row clears it: hovering swaps its
                        // label for the same X as the clear button.
                        <a
                            key={option.href}
                            href={optionActive ? "/thinking" : option.href}
                            aria-label={
                                optionActive ? "Clear filter" : undefined
                            }
                            className={cn(
                                "group/option relative flex items-center rounded-md px-2 py-1.5 text-sm text-foreground no-underline outline-none transition-colors duration-150 hover:bg-secondary focus-visible:bg-secondary",
                                optionActive &&
                                    "bg-primary text-primary-foreground hover:bg-destructive/15 focus-visible:bg-destructive/15",
                            )}
                        >
                            <span
                                className={cn(
                                    "flex items-center gap-2",
                                    optionActive &&
                                        "transition-opacity duration-150 group-hover/option:opacity-0 group-focus-visible/option:opacity-0",
                                )}
                            >
                                <Icon className="size-4" aria-hidden="true" />
                                <span>{option.label}</span>
                            </span>
                            {optionActive && (
                                <XIcon
                                    className="absolute inset-0 m-auto size-4 text-destructive opacity-0 transition-opacity duration-150 group-hover/option:opacity-100 group-focus-visible/option:opacity-100"
                                    aria-hidden="true"
                                />
                            )}
                        </a>
                    );
                })}
            </PopoverContent>
        </Popover>
    );
}
