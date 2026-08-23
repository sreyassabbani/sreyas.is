"use client";

import * as React from "react";

import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
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
    const isAbout = pathname.startsWith("/thinking/about");
    const currentTopic = topics.find(
        (topic) => pathname === topic.href || pathname.startsWith(topic.href),
    );
    const [value, setValue] = React.useState<string | null>(
        currentTopic?.href ?? null,
    );

    React.useEffect(() => {
        setValue(currentTopic?.href ?? null);
    }, [currentTopic]);

    if (!isAbout) {
        return null;
    }

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
                aria-label="Choose what to think about"
                className="h-auto max-w-44 cursor-pointer rounded border-muted-foreground/35 bg-transparent px-1.5 py-0.5 font-brand text-sm text-muted-foreground shadow-none hover:border-primary hover:bg-transparent hover:text-primary focus-visible:ring-2 focus-visible:ring-ring dark:bg-transparent dark:hover:bg-transparent sm:max-w-56"
            >
                <span className="truncate">
                    {currentTopic ? currentTopic.label.toLowerCase() : "about…"}
                </span>
                <SelectValue className="sr-only" />
            </SelectTrigger>

            <SelectContent
                align="start"
                alignOffset={-4}
                alignItemWithTrigger={false}
                className="min-w-56"
            >
                <SelectGroup>
                    <SelectLabel>Thinking about…</SelectLabel>
                    {topics.map((topic) => (
                        <SelectItem key={topic.href} value={topic.href}>
                            <span className="flex min-w-0 flex-1 items-center justify-between gap-6">
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
