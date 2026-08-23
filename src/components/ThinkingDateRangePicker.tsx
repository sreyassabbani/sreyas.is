"use client";

import { format } from "date-fns";
import { ChevronDownIcon } from "lucide-react";
import * as React from "react";
import type { DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

type DateOption = Readonly<{
    dateSlug: string;
    label: string;
    count: number;
}>;

type Props = Readonly<{
    dates: readonly DateOption[];
}>;

function parseDateSlug(dateSlug: string): Date {
    return new Date(`${dateSlug}T12:00:00`);
}

function dateKey(date: Date): string {
    return format(date, "yyyy-MM-dd");
}

function rangeLabel(range: DateRange | undefined): string {
    if (!range?.from) {
        return "…";
    }

    if (!range.to || range.from.getTime() === range.to.getTime()) {
        return format(range.from, "MMM d");
    }

    const sameYear = range.from.getFullYear() === range.to.getFullYear();
    return `${format(range.from, sameYear ? "MMM d" : "MMM d, yyyy")}–${format(range.to, "MMM d, yyyy")}`;
}

export function ThinkingDateRangePicker({ dates }: Props) {
    const [range, setRange] = React.useState<DateRange | undefined>();
    const [twoMonths, setTwoMonths] = React.useState(false);
    const parsedDates = React.useMemo(
        () => dates.map((date) => parseDateSlug(date.dateSlug)),
        [dates],
    );
    const chronologicalDates = React.useMemo(
        () =>
            [...parsedDates].sort(
                (left, right) => left.getTime() - right.getTime(),
            ),
        [parsedDates],
    );

    React.useEffect(() => {
        const query = window.matchMedia("(min-width: 48rem)");
        const sync = () => setTwoMonths(query.matches);

        sync();
        query.addEventListener("change", sync);
        return () => query.removeEventListener("change", sync);
    }, []);

    const matchingDates = React.useMemo(() => {
        if (!range?.from) {
            return [];
        }

        const start = dateKey(range.from);
        const end = dateKey(range.to ?? range.from);
        const lowerBound = start < end ? start : end;
        const upperBound = start < end ? end : start;
        return dates.filter((date) => {
            return date.dateSlug >= lowerBound && date.dateSlug <= upperBound;
        });
    }, [dates, range]);

    const earliestDate = chronologicalDates[0];
    const latestDate = chronologicalDates.at(-1);

    return (
        <Popover>
            <PopoverTrigger
                render={
                    <Button
                        variant="ghost"
                        aria-label="Choose a date range"
                        className="h-auto max-w-56 bg-transparent p-0 font-brand shadow-none hover:bg-transparent focus-visible:ring-0"
                    />
                }
            >
                <span className="flex min-w-0 items-center rounded border border-muted-foreground/50 px-1.5 py-0.5 text-base font-normal text-muted-foreground transition-colors hover:border-primary hover:text-primary md:text-lg">
                    <span className="truncate">{rangeLabel(range)}</span>
                </span>
                <ChevronDownIcon />
            </PopoverTrigger>

            <PopoverContent
                align="center"
                sideOffset={8}
                className="w-auto gap-0 p-0"
            >
                <Calendar
                    mode="range"
                    selected={range}
                    onSelect={setRange}
                    resetOnSelect
                    numberOfMonths={twoMonths ? 2 : 1}
                    defaultMonth={latestDate}
                    startMonth={earliestDate}
                    endMonth={latestDate}
                    modifiers={{ hasEntries: parsedDates }}
                    modifiersClassNames={{
                        hasEntries: "font-semibold text-primary",
                    }}
                    className="[--cell-size:--spacing(8)] sm:[--cell-size:--spacing(9)]"
                />

                {range?.from && (
                    <div className="border-t border-border p-2">
                        {matchingDates.length > 0 ? (
                            <ul className="grid list-none gap-0.5 p-0">
                                {matchingDates.slice(0, 6).map((date) => (
                                    <li key={date.dateSlug}>
                                        <a
                                            href={`/thinking/on/${date.dateSlug}/`}
                                            className="flex items-center justify-between gap-4 rounded-md px-2 py-1 text-sm text-foreground no-underline transition-colors hover:bg-secondary focus-visible:bg-secondary focus-visible:outline-none"
                                        >
                                            <span>{date.label}</span>
                                            <span className="font-mono text-xs text-muted-foreground">
                                                {date.count}
                                            </span>
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="px-2 py-1 text-sm text-muted-foreground">
                                No entries in this range.
                            </p>
                        )}
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
}
