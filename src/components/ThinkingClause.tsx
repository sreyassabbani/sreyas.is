import type { ReactNode } from "react";

/** A relationship and its picker stay together when the header wraps. */
export function ThinkingClause({
    relation,
    children,
}: {
    relation: "about" | "on";
    children: ReactNode;
}) {
    return (
        <span
            data-slot="thinking-clause"
            className="flex min-w-0 max-w-full items-center gap-x-2 font-brand text-base leading-none text-muted-foreground md:gap-x-3 md:text-lg"
        >
            <span className="shrink-0">{relation}</span>
            {children}
        </span>
    );
}
