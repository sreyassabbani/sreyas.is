import { rememberThinkingOrigin } from "@/lib/thinking-return";

document.addEventListener("click", (event) => {
    if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        !(event.target instanceof Element)
    ) {
        return;
    }
    const link = event.target.closest<HTMLAnchorElement>(
        "a[data-thinking-article]",
    );
    if (!link || link.target || link.hasAttribute("download")) return;
    rememberThinkingOrigin(link.href);
});
