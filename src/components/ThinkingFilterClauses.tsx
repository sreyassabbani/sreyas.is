"use client";

import { ThinkingClause } from "@/components/ThinkingClause";
import { ThinkingDateRangePicker } from "@/components/ThinkingDateRangePicker";
import {
    ThinkingTopicSelect,
    type Topic,
} from "@/components/ThinkingTopicSelect";
import { useInlineFilterClauses } from "@/hooks/use-inline-filter-clauses";
import { useThinkingFilters } from "@/hooks/use-thinking-filters";
import {
    getThinkingFiltersHref,
    thinkingFiltersEvent,
} from "@/lib/thinking-filters";
import { isInThinkingRange, type ThinkingRange } from "@/lib/thinking-range";
import { cn } from "@/lib/utils";

type TopicWithDates = Topic & { dates: readonly string[] };

type Props = {
    pathname: string;
    topics: readonly TopicWithDates[];
    dates: readonly string[];
};

// Keep renderer detection independent of the currently selected filters.
export function ThinkingFilterClauses(props: Props) {
    return <ThinkingFilterClausesContent {...props} />;
}

function ThinkingFilterClausesContent({ pathname, topics, dates }: Props) {
    const filters = useThinkingFilters(pathname);
    const { ref, inline } = useInlineFilterClauses(
        filters.subject,
        filters.date,
    );
    const currentRange = filters.date ? filters.range : null;
    const filteredTopics = currentRange
        ? topics.map((topic) => ({
              ...topic,
              count: topic.dates.filter((date) =>
                  isInThinkingRange(date, currentRange),
              ).length,
          }))
        : topics;

    function changeRange(range: ThinkingRange | null, complete: boolean) {
        if (
            range?.from === filters.range?.from &&
            range?.to === filters.range?.to
        )
            return;
        const href = getThinkingFiltersHref({ ...filters, date: true, range });
        // Day pages contain only one day's rendered content. A new range needs
        // the full date index; keep an unfinished selection in the calendar.
        if (
            /^\/thinking\/on\/\d{4}-\d{2}-\d{2}\/?$/.test(
                window.location.pathname,
            )
        ) {
            if (complete) window.location.assign(href);
            return;
        }
        window.history.pushState(window.history.state, "", href);
        window.dispatchEvent(new Event(thinkingFiltersEvent));
    }

    if (!filters.subject && !filters.date) return null;

    return (
        <div
            ref={ref}
            className={cn(
                "col-span-2 flex min-w-0 flex-col items-start gap-x-2 gap-y-3 md:gap-x-3 @md/nav:col-span-1 @md/nav:col-start-2",
                inline &&
                    "col-span-1 col-start-3 row-start-1 flex-row @md/nav:col-start-3",
            )}
        >
            {filters.subject && (
                <ThinkingClause relation="about">
                    <ThinkingTopicSelect
                        value={filters.subjectPath}
                        topics={filteredTopics}
                        onValueChange={(subjectPath) =>
                            window.location.assign(
                                getThinkingFiltersHref({
                                    ...filters,
                                    subjectPath,
                                }),
                            )
                        }
                    />
                </ThinkingClause>
            )}
            {filters.date && (
                <ThinkingClause relation="on">
                    <ThinkingDateRangePicker
                        dates={dates}
                        value={filters.range}
                        onValueChange={changeRange}
                    />
                </ThinkingClause>
            )}
        </div>
    );
}
