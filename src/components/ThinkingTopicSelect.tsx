"use client";

import { ChevronDownIcon } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandShortcut,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

type Topic = Readonly<{
    href: string;
    label: string;
    count: number;
}>;

type Props = Readonly<{
    pathname: string;
    topics: readonly Topic[];
}>;

export function ThinkingTopicSelect({ pathname, topics }: Props) {
    const currentTopic = topics.find(
        (topic) => pathname === topic.href || pathname.startsWith(topic.href),
    );
    const [open, setOpen] = React.useState(false);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger
                render={
                    <Button
                        variant="ghost"
                        aria-label="Choose a subject"
                        className="h-auto w-auto max-w-44 cursor-pointer bg-transparent p-0 font-brand shadow-none hover:bg-transparent focus-visible:ring-0 sm:max-w-56"
                    />
                }
            >
                <span className="flex min-w-0 items-center rounded border border-muted-foreground/50 px-1.5 py-0.5 text-base font-normal text-muted-foreground transition-colors hover:border-primary hover:text-primary md:text-lg">
                    <span className="truncate">
                        {currentTopic ? currentTopic.label.toLowerCase() : "…"}
                    </span>
                </span>
                <ChevronDownIcon />
            </PopoverTrigger>

            <PopoverContent
                align="end"
                sideOffset={6}
                className="w-[min(20rem,calc(100vw-2rem))] gap-0 p-0"
            >
                <Command>
                    <CommandInput
                        aria-label="Filter subjects"
                        placeholder="Find a subject…"
                    />
                    <CommandList className="max-h-[min(20rem,var(--available-height))]">
                        <CommandEmpty>No subjects found.</CommandEmpty>
                        <CommandGroup>
                            {topics.map((topic) => (
                                <CommandItem
                                    key={topic.href}
                                    value={topic.href}
                                    keywords={[topic.label]}
                                    data-current={
                                        topic.href === currentTopic?.href
                                    }
                                    className="min-w-0 data-[current=true]:text-primary"
                                    onSelect={(nextHref) => {
                                        setOpen(false);

                                        if (nextHref !== pathname) {
                                            window.location.assign(nextHref);
                                        }
                                    }}
                                >
                                    <span className="min-w-0 flex-1 truncate">
                                        {topic.label.toLowerCase()}
                                    </span>
                                    <CommandShortcut className="w-[3ch] shrink-0 text-right font-brand text-[0.68rem] leading-none tracking-normal tabular-nums">
                                        {topic.count}
                                    </CommandShortcut>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
