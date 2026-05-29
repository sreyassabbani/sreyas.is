"use client";

import { formatInTimeZone } from "date-fns-tz";
import { ClockIcon, MapPinIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const TIME_ZONE = "America/New_York";

export function HomePresence() {
    const [now, setNow] = useState<Date | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        setNow(new Date());

        const timeout = setTimeout(
            () => {
                setNow(new Date());
                const interval = setInterval(() => {
                    setNow(new Date());
                }, 60000);
                return () => clearInterval(interval);
            },
            (60 - new Date().getSeconds()) * 1000,
        );

        return () => clearTimeout(timeout);
    }, []);

    const { etTime, offsetText } = useMemo(() => {
        if (!now) return { etTime: "", offsetText: "" };

        // 1. Format the ET time string
        const etTime = formatInTimeZone(now, TIME_ZONE, "h:mm a");

        // 2. Calculate offsets relative to the user
        const etOffsetStr = now.toLocaleString("en-US", {
            timeZone: TIME_ZONE,
            timeZoneName: "shortOffset",
        });
        const etOffsetMatch = etOffsetStr.match(/GMT([+-]\d+)(?::(\d+))?$/);
        let etOffsetMinutes = 0;
        if (etOffsetMatch) {
            const [_, hours, minutes] = etOffsetMatch;
            etOffsetMinutes =
                Number.parseInt(hours, 10) * 60 +
                (minutes ? Number.parseInt(minutes, 10) : 0) *
                    (hours.startsWith("-") ? -1 : 1);
        }

        const localOffsetMinutes = -now.getTimezoneOffset();

        const diffMinutes = etOffsetMinutes - localOffsetMinutes;
        const diffHours = Math.round(diffMinutes / 60);

        let offsetText = "same time";
        if (diffHours !== 0) {
            const absHours = Math.abs(diffHours);
            const direction = diffHours > 0 ? "ahead" : "behind";
            offsetText = `${absHours} ${absHours === 1 ? "hour" : "hours"} ${direction}`;
        }

        return { etTime, offsetText };
    }, [now]);

    if (!mounted || !now) {
        return <div className="h-6 w-full" aria-hidden="true" />;
    }

    return (
        <div className="flex flex-wrap gap-x-5 gap-y-2 pt-2 text-[0.95rem] text-muted-foreground/80">
            <div className="flex items-center gap-1.5 transition-colors hover:text-foreground">
                <MapPinIcon
                    className="size-3.5 translate-y-[1px]"
                    aria-hidden="true"
                />
                <span className="font-medium">Alpharetta, GA</span>
            </div>

            <div className="flex items-center gap-1.5 transition-colors hover:text-foreground">
                <ClockIcon
                    className="size-3.5 translate-y-[1px]"
                    aria-hidden="true"
                />
                <time dateTime={now.toISOString()} className="font-medium">
                    {etTime}{" "}
                    <span className="font-normal opacity-60">
                        ({offsetText})
                    </span>
                </time>
            </div>
        </div>
    );
}
