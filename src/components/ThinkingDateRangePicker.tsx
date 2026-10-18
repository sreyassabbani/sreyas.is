"use client";

import { format, max, subMonths } from "date-fns";
import * as React from "react";
import type { DateRange } from "react-day-picker";

import { Calendar } from "@/components/ui/calendar";
import { Chip } from "@/components/ui/chip";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    getThinkingRangeHref,
    parseDateSlug,
    readThinkingRange,
    type ThinkingRange,
    thinkingRangeEvent,
} from "@/lib/thinking-range";

type Props = Readonly<{
    /** Days that have entries, as yyyy-MM-dd. */
    dates: readonly string[];
    /**
     * The day a /thinking/on/<date>/ page shows. Without it the picker is on
     * /thinking/on/ and filters that page's list in place.
     */
    selected?: string;
}>;

function dateKey(date: Date): string {
    return format(date, "yyyy-MM-dd");
}

function toDateRange(range: ThinkingRange | null): DateRange | undefined {
    return range
        ? { from: parseDateSlug(range.from), to: parseDateSlug(range.to) }
        : undefined;
}

function toThinkingRange(range: DateRange | undefined): ThinkingRange | null {
    if (!range?.from) {
        return null;
    }

    const from = dateKey(range.from);
    const to = dateKey(range.to ?? range.from);
    return from <= to ? { from, to } : { from: to, to: from };
}

function rangeLabel(range: DateRange | undefined): string {
    if (!range?.from) {
        return "…";
    }

    if (!range.to || dateKey(range.from) === dateKey(range.to)) {
        return format(range.from, "MMM d, yyyy");
    }

    const sameYear = range.from.getFullYear() === range.to.getFullYear();
    return `${format(range.from, sameYear ? "MMM d" : "MMM d, yyyy")}–${format(range.to, "MMM d, yyyy")}`;
}

export function ThinkingDateRangePicker({ dates, selected }: Props) {
    const filtersInPlace = selected === undefined;
    const [range, setRange] = React.useState<DateRange | undefined>(() =>
        selected ? toDateRange({ from: selected, to: selected }) : undefined,
    );
    // The chip only shows a range once the picker closes: relabelling it while
    // open would resize it (and can wrap the header), dragging the popover
    // along with it. The list behind still filters on every click.
    const [shownRange, setShownRange] = React.useState(range);
    const [twoMonths, setTwoMonths] = React.useState(false);
    const parsedDates = React.useMemo(() => dates.map(parseDateSlug), [dates]);
    const latestDate = React.useMemo(
        () =>
            dates.length > 0
                ? parseDateSlug([...dates].sort().at(-1) ?? "")
                : undefined,
        [dates],
    );

    React.useEffect(() => {
        const query = window.matchMedia("(min-width: 48rem)");
        const sync = () => setTwoMonths(query.matches);

        sync();
        query.addEventListener("change", sync);
        return () => query.removeEventListener("change", sync);
    }, []);

    // The server can't see the query string, so the in-place range is read
    // once the picker is live.
    React.useEffect(() => {
        if (filtersInPlace) {
            const initial = toDateRange(
                readThinkingRange(window.location.search),
            );
            setRange(initial);
            setShownRange(initial);
        }
    }, [filtersInPlace]);

    const select = (next: DateRange | undefined): void => {
        setRange(next);

        const nextRange = toThinkingRange(next);

        if (!filtersInPlace) {
            if (next?.from && next.to) {
                window.location.assign(getThinkingRangeHref(nextRange));
            }
            return;
        }

        window.history.replaceState(
            window.history.state,
            "",
            getThinkingRangeHref(nextRange),
        );
        document.dispatchEvent(
            new CustomEvent<ThinkingRange | null>(thinkingRangeEvent, {
                detail: nextRange,
            }),
        );
    };

    // Open with the range (or the latest entry) in view. It's fixed when the
    // picker opens so the months don't shift while a range is being picked.
    const [openMonth, setOpenMonth] = React.useState<Date | undefined>();
    const endMonth = max([...(latestDate ? [latestDate] : []), new Date()]);

    const toggle = (open: boolean): void => {
        if (open) {
            const anchor = range?.from ?? latestDate;
            setOpenMonth(
                anchor && twoMonths && !range?.from
                    ? subMonths(anchor, 1)
                    : anchor,
            );
            return;
        }

        setShownRange(range);

        // A single click on a /thinking/on/<date>/ page starts a new range;
        // closing the picker there goes to that day.
        if (!filtersInPlace && range?.from && !range.to) {
            window.location.assign(
                getThinkingRangeHref(toThinkingRange(range)),
            );
        }
    };

    return (
        <Popover onOpenChange={toggle}>
            <PopoverTrigger
                aria-label="Choose a date range"
                render={<Chip className="max-w-64" />}
            >
                {rangeLabel(shownRange)}
            </PopoverTrigger>

            <PopoverContent
                align="start"
                sideOffset={8}
                className="w-auto gap-0 p-0"
            >
                <Calendar
                    mode="range"
                    selected={range}
                    onSelect={select}
                    resetOnSelect
                    // With two months side by side, padding days from the
                    // neighbouring month would show (and shade) the same dates
                    // twice.
                    showOutsideDays={false}
                    numberOfMonths={twoMonths ? 2 : 1}
                    defaultMonth={openMonth}
                    endMonth={endMonth}
                    modifiers={{ hasEntries: parsedDates }}
                    modifiersClassNames={{
                        hasEntries: "font-semibold text-primary",
                    }}
                    className="[--cell-size:--spacing(8)] sm:[--cell-size:--spacing(9)]"
                />
            </PopoverContent>
        </Popover>
    );
}
