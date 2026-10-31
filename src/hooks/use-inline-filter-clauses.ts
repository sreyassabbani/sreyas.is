import * as React from "react";

/** Include the full label when a chip is currently ellipsized. */
function preferredWidth(element: HTMLElement): number {
    const text = element.querySelector<HTMLElement>(
        '[data-slot="chip-label"] > span',
    );
    return (
        element.getBoundingClientRect().width +
        (text ? Math.max(0, text.scrollWidth - text.clientWidth) : 0)
    );
}

/** Keep all clauses on the first line only when their full labels fit. */
export function useInlineFilterClauses(subject: boolean, date: boolean) {
    const ref = React.useRef<HTMLDivElement>(null);
    const [inline, setInline] = React.useState(false);

    React.useEffect(() => {
        if (!subject && !date) return;
        const clauses = ref.current;
        const grid = clauses?.closest<HTMLElement>("[data-navigation-grid]");
        const logo = grid?.querySelector<HTMLElement>("[data-navigation-logo]");
        const picker = grid?.querySelector<HTMLElement>(
            "[data-navigation-picker]",
        );
        if (!clauses || !grid || !logo || !picker) return;

        const update = () => {
            const rows = Array.from(
                clauses.querySelectorAll<HTMLElement>(
                    '[data-slot="thinking-clause"]',
                ),
            );
            const gridGap =
                Number.parseFloat(getComputedStyle(grid).columnGap) || 0;
            const clauseGap =
                Number.parseFloat(getComputedStyle(clauses).columnGap) || 0;
            const required =
                preferredWidth(logo) +
                preferredWidth(picker) +
                gridGap * 2 +
                rows.reduce((sum, row) => sum + preferredWidth(row), 0) +
                Math.max(0, rows.length - 1) * clauseGap;
            const fits = rows.length > 0 && required <= grid.clientWidth;
            grid.dataset.filtersInline = String(fits);
            setInline(fits);
        };

        const resize = new ResizeObserver(update);
        for (const element of [
            grid,
            clauses,
            logo,
            picker,
            ...clauses.children,
        ]) {
            resize.observe(element);
        }
        const mutations = new MutationObserver(update);
        mutations.observe(clauses, {
            subtree: true,
            childList: true,
            characterData: true,
        });
        mutations.observe(picker, {
            subtree: true,
            childList: true,
            characterData: true,
        });
        document.fonts.addEventListener("loadingdone", update);
        update();

        return () => {
            resize.disconnect();
            mutations.disconnect();
            document.fonts.removeEventListener("loadingdone", update);
            delete grid.dataset.filtersInline;
        };
    }, [subject, date]);

    return { ref, inline };
}
