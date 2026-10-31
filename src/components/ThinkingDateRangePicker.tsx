"use client";

import { labelDayButton } from "@daypicker/react";
import { format, max, subMonths } from "date-fns";
import * as React from "react";

import { Calendar, type DateRange } from "@/components/ui/calendar";
import { Chip } from "@/components/ui/chip";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { parseDateSlug, type ThinkingRange } from "@/lib/thinking-range";

type Props = Readonly<{
    /** Days that have entries, as yyyy-MM-dd. */
    dates: readonly string[];
    value: ThinkingRange | null;
    onValueChange: (value: ThinkingRange | null, complete: boolean) => void;
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

function rangeLabel(range: DateRange | undefined): string | undefined {
    if (!range?.from) {
        return undefined;
    }

    if (!range.to || dateKey(range.from) === dateKey(range.to)) {
        return format(range.from, "MMM d, yyyy");
    }

    const sameYear = range.from.getFullYear() === range.to.getFullYear();
    const sameMonth = sameYear && range.from.getMonth() === range.to.getMonth();
    return `${format(range.from, sameYear ? "MMM d" : "MMM d, yyyy")}–${format(range.to, sameMonth ? "d, yyyy" : "MMM d, yyyy")}`;
}

export function ThinkingDateRangePicker({
    dates,
    value,
    onValueChange,
}: Props) {
    const [range, setRange] = React.useState<DateRange | undefined>(() =>
        toDateRange(value),
    );
    // The chip only shows a range once the picker closes: relabelling it while
    // open would resize it (and can wrap the header), dragging the popover
    // along with it. The list behind still filters on every click.
    const [shownRange, setShownRange] = React.useState(range);
    const [open, setOpen] = React.useState(false);
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

    const valueFrom = value?.from;
    const valueTo = value?.to;
    React.useEffect(() => {
        if (!open) {
            const next = toDateRange(
                valueFrom && valueTo ? { from: valueFrom, to: valueTo } : null,
            );
            setRange(next);
            setShownRange(next);
        }
    }, [open, valueFrom, valueTo]);

    React.useEffect(() => {
        if (!open) return;
        const close = () => setOpen(false);
        window.addEventListener("popstate", close);
        return () => window.removeEventListener("popstate", close);
    }, [open]);

    const select = (next: DateRange | undefined): void => {
        setRange(next);

        onValueChange(toThinkingRange(next), Boolean(next?.to));
    };

    // Open with the range (or the latest entry) in view. It's fixed when the
    // picker opens so the months don't shift while a range is being picked.
    const [openMonth, setOpenMonth] = React.useState<Date | undefined>();
    const endMonth = max([...(latestDate ? [latestDate] : []), new Date()]);

    const toggle = (open: boolean): void => {
        setOpen(open);
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

        onValueChange(toThinkingRange(range), true);
    };

    return (
        <Popover open={open} onOpenChange={toggle}>
            <PopoverTrigger
                aria-label={
                    rangeLabel(shownRange)
                        ? `Choose a date range, selected: ${rangeLabel(shownRange)}`
                        : "Choose a date range"
                }
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
                    // With two months side by side, padding days from the
                    // neighbouring month would show (and shade) the same dates
                    // twice.
                    showOutsideDays={false}
                    numberOfMonths={twoMonths ? 2 : 1}
                    defaultMonth={openMonth}
                    endMonth={endMonth}
                    modifiers={{ hasEntries: parsedDates }}
                    labels={{
                        labelDayButton: (date, modifiers, options, dateLib) =>
                            `${labelDayButton(date, modifiers, options, dateLib)}${modifiers.hasEntries ? ", has posts" : ""}`,
                    }}
                    cellSize={twoMonths ? 36 : 32}
                />
            </PopoverContent>
        </Popover>
    );
}
