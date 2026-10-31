import * as React from "react";
import {
    readThinkingFilters,
    thinkingFiltersEvent,
} from "@/lib/thinking-filters";

function subscribe(callback: () => void) {
    window.addEventListener("popstate", callback);
    window.addEventListener(thinkingFiltersEvent, callback);
    return () => {
        window.removeEventListener("popstate", callback);
        window.removeEventListener(thinkingFiltersEvent, callback);
    };
}

function snapshot() {
    return `${window.location.pathname}${window.location.search}`;
}

export function useThinkingFilters(pathname: string) {
    const href = React.useSyncExternalStore(
        subscribe,
        snapshot,
        () => pathname,
    );
    const url = new URL(href, "https://example.invalid");
    return readThinkingFilters(url.pathname, url.search);
}
