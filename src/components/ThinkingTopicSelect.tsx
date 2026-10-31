"use client";

import { prefetch } from "astro:prefetch";
import { Chip } from "@/components/ui/chip";
import {
    Combobox,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxItem,
    ComboboxList,
    ComboboxSearch,
    ComboboxTrigger,
} from "@/components/ui/combobox";

export type Topic = Readonly<{
    href: string;
    label: string;
    count: number;
}>;

type Props = Readonly<{
    value: string | null;
    topics: readonly Topic[];
    onValueChange: (href: string) => void;
}>;

export function ThinkingTopicSelect({ value, topics, onValueChange }: Props) {
    const currentTopic = topics.find((topic) => value === topic.href);
    return (
        <Combobox
            items={topics}
            value={currentTopic ?? null}
            itemToStringLabel={(topic: Topic) => topic.label.toLowerCase()}
            autoHighlight
            onOpenChange={(nextOpen) => {
                // Subjects navigate from script; warm them when the list opens.
                if (nextOpen) {
                    for (const topic of topics) {
                        prefetch(topic.href);
                    }
                }
            }}
            onValueChange={(topic: Topic | null) => {
                if (topic && topic.href !== value) {
                    onValueChange(topic.href);
                }
            }}
        >
            <ComboboxTrigger
                aria-label={
                    currentTopic
                        ? `Choose a subject, selected: ${currentTopic.label.toLowerCase()}`
                        : "Choose a subject"
                }
                showIcon={false}
                render={<Chip className="max-w-full" />}
            >
                {currentTopic?.label.toLowerCase()}
            </ComboboxTrigger>

            <ComboboxContent
                align="start"
                sideOffset={6}
                className="w-[min(20rem,calc(100vw-2rem))] min-w-0"
            >
                <ComboboxSearch
                    aria-label="Filter subjects"
                    placeholder="Find a subject..."
                />
                <ComboboxEmpty>No subjects found.</ComboboxEmpty>
                <ComboboxList>
                    {(topic: Topic) => (
                        <ComboboxItem
                            key={topic.href}
                            value={topic}
                            trailing={
                                <span className="font-brand text-[0.68rem] leading-none text-muted-foreground tabular-nums">
                                    {topic.count}
                                </span>
                            }
                        >
                            <span className="min-w-0 flex-1 truncate">
                                {topic.label.toLowerCase()}
                            </span>
                        </ComboboxItem>
                    )}
                </ComboboxList>
            </ComboboxContent>
        </Combobox>
    );
}
