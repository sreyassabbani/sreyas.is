"use client";

import * as React from "react";

import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

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
    const [value, setValue] = React.useState<string | null>(
        currentTopic?.href ?? null,
    );

    React.useEffect(() => {
        setValue(currentTopic?.href ?? null);
    }, [currentTopic]);

    return (
        <Select
            items={topics.map((topic) => ({
                label: topic.label,
                value: topic.href,
            }))}
            value={value}
            onValueChange={(nextHref) => {
                setValue(nextHref);

                if (nextHref && nextHref !== pathname) {
                    window.location.assign(nextHref);
                }
            }}
        >
            <SelectTrigger
                aria-label="Choose a subject"
                className="h-auto w-auto max-w-44 cursor-pointer border-0 bg-transparent p-0 font-brand shadow-none hover:bg-transparent focus-visible:ring-0 dark:bg-transparent dark:hover:bg-transparent sm:max-w-56"
            >
                <span className="flex min-w-0 items-center rounded border border-muted-foreground/50 px-1.5 py-0.5 text-base font-normal text-muted-foreground transition-colors hover:border-primary hover:text-primary md:text-lg">
                    <span className="truncate">
                        {currentTopic ? currentTopic.label.toLowerCase() : "…"}
                    </span>
                </span>
                <SelectValue className="sr-only" />
            </SelectTrigger>

            <SelectContent
                align="end"
                alignItemWithTrigger={false}
                className="w-40 min-w-40"
            >
                <SelectGroup>
                    {topics.map((topic) => (
                        <SelectItem key={topic.href} value={topic.href}>
                            <span className="flex min-w-0 flex-1 items-center justify-between gap-4">
                                <span className="truncate">
                                    {topic.label.toLowerCase()}
                                </span>
                                <span className="font-mono text-[0.68rem] text-muted-foreground">
                                    {topic.count}
                                </span>
                            </span>
                        </SelectItem>
                    ))}
                </SelectGroup>
            </SelectContent>
        </Select>
    );
}
