"use client";

import { CalendarDaysIcon, FunnelIcon, TagsIcon, XIcon } from "lucide-react";
import * as React from "react";

import { buttonVariants } from "@/components/ui/button-variants";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type Props = {
    pathname: string;
    className?: string;
};

const options = [
    {
        href: "/thinking/on/",
        label: "Date",
        icon: CalendarDaysIcon,
        activePath: "/thinking/on",
    },
    {
        href: "/thinking/about/",
        label: "Topic",
        icon: TagsIcon,
        activePath: "/thinking/about",
    },
];

const controlChromeClass = cn(
    buttonVariants({ variant: "outline", size: "icon" }),
    "rounded-full bg-background text-foreground shadow-none transition-colors duration-200 hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:bg-background dark:hover:bg-secondary",
);

export function ThinkingFilterControl({ pathname, className }: Props) {
    const [expanded, setExpanded] = React.useState(false);
    const [resetHot, setResetHot] = React.useState(false);
    const isThinking = pathname.startsWith("/thinking");
    const isActive =
        isThinking &&
        options.some((option) => pathname.startsWith(option.activePath));

    const expand = () => {
        if (!isActive) {
            return;
        }

        setExpanded(true);
    };

    const collapse = () => {
        setExpanded(false);
        setResetHot(false);
    };

    if (!isThinking) {
        return null;
    }

    return (
        <Popover>
            <fieldset
                onMouseEnter={expand}
                onMouseLeave={collapse}
                onFocusCapture={expand}
                onBlurCapture={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget)) {
                        collapse();
                    }
                }}
                className={cn(
                    "relative m-0 h-8 w-16 min-w-16 border-0 p-0",
                    className,
                )}
            >
                <legend className="sr-only">Thinking filters</legend>
                <div
                    className={cn(
                        controlChromeClass,
                        "absolute left-0 top-0 h-8 overflow-hidden p-0 transition-[width,background-color,border-color,color] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]",
                        isActive && expanded ? "w-16" : "w-8",
                        isActive &&
                            "border-primary bg-primary text-primary-foreground",
                        resetHot &&
                            "border-destructive/40 bg-destructive/10 text-destructive",
                    )}
                />

                <PopoverTrigger
                    aria-label="Filter thinking"
                    className={cn(
                        "absolute left-0 top-0 flex size-8 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent p-0 text-current outline-none transition-colors duration-200 hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                        isActive && "hover:bg-primary/90",
                        resetHot && "hover:bg-transparent",
                    )}
                >
                    <FunnelIcon className="size-4" aria-hidden="true" />
                </PopoverTrigger>

                {isActive ? (
                    <a
                        href="/thinking"
                        aria-label="Clear thinking filter"
                        tabIndex={expanded ? 0 : -1}
                        onMouseEnter={() => setResetHot(true)}
                        onMouseLeave={() => setResetHot(false)}
                        onFocus={() => setResetHot(true)}
                        onBlur={() => setResetHot(false)}
                        className={cn(
                            "absolute right-0 top-0 flex size-8 items-center justify-center rounded-full text-current outline-none transition-[opacity,transform] duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:ring-2 focus-visible:ring-destructive/40",
                            expanded
                                ? "pointer-events-auto translate-x-0 opacity-100"
                                : "pointer-events-none -translate-x-0.5 opacity-0",
                        )}
                    >
                        <XIcon className="size-4" aria-hidden="true" />
                    </a>
                ) : (
                    <span
                        aria-hidden="true"
                        className="pointer-events-none absolute right-0 top-0 flex size-8 -translate-x-0.5 items-center justify-center rounded-full opacity-0"
                    >
                        <XIcon className="size-4" aria-hidden="true" />
                    </span>
                )}
            </fieldset>

            <PopoverContent
                align="end"
                sideOffset={8}
                className="w-36 gap-1 p-1"
            >
                {options.map((option) => {
                    const Icon = option.icon;
                    const optionActive = pathname.startsWith(option.activePath);

                    return (
                        <a
                            key={option.href}
                            href={option.href}
                            aria-current={optionActive ? "page" : undefined}
                            className={cn(
                                "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-foreground no-underline outline-none transition-colors duration-150 hover:bg-secondary focus-visible:bg-secondary",
                                optionActive &&
                                    "bg-primary text-primary-foreground hover:bg-primary/90",
                            )}
                        >
                            <Icon className="size-4" aria-hidden="true" />
                            <span>{option.label}</span>
                        </a>
                    );
                })}
            </PopoverContent>
        </Popover>
    );
}
