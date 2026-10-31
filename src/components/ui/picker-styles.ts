// Shared presentation for selectable rows in the select and searchable picker.
export const pickerRowClass =
    "relative z-10 flex min-h-8 w-full cursor-default items-center gap-1.5 rounded-md py-1 pl-1.5 text-sm outline-hidden select-none data-disabled:pointer-events-none data-disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-ring/50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4";

export const pickerItemClass = `${pickerRowClass} pr-8`;

export const pickerIndicatorClass =
    "pointer-events-none absolute right-2 flex size-4 items-center justify-center";

export const pickerPopupSurfaceClass =
    "rounded-lg bg-popover text-popover-foreground shadow-popover ring-1 ring-foreground/10";

export const pickerPopupClass = `origin-(--transform-origin) ${pickerPopupSurfaceClass} duration-100 data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-left-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 motion-reduce:animate-none`;
