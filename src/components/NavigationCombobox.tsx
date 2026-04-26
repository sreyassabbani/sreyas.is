"use client";

import * as React from "react";

import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectSeparator,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

type NavItem = {
    href: string;
    label: string;
};

const primaryItems: NavItem[] = [
    { href: "/thinking", label: "Thinking" },
    { href: "/using", label: "Using" },
];

const secondaryItems: NavItem[] = [
    { href: "/now", label: "Now" },
    { href: "/about", label: "More" },
];

const navItems = [...primaryItems, ...secondaryItems];

function isCurrent(pathname: string, href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
}

export function NavigationCombobox({ pathname }: { pathname: string }) {
    const currentItem = navItems.find((item) => isCurrent(pathname, item.href));
    const [value, setValue] = React.useState<string | null>(
        currentItem?.href ?? navItems[0]?.href,
    );
    const currentLabel = currentItem?.label ?? "Navigate";

    React.useEffect(() => {
        setValue(currentItem?.href ?? navItems[0]?.href);
    }, [currentItem]);

    return (
        <Select
            items={navItems.map((item) => ({
                label: item.label,
                value: item.href,
            }))}
            value={value}
            onValueChange={(nextHref) => {
                setValue(nextHref);

                if (nextHref && nextHref !== pathname) {
                    window.location.assign(nextHref);
                }
            }}
        >
            <div className="flex -translate-y-1 items-center gap-1">
                <span className="text-sm text-foreground">{currentLabel}</span>
                <SelectTrigger
                    aria-label="Choose page"
                    className="-mr-1 flex size-7 cursor-pointer items-center justify-center rounded-md border-0 bg-transparent p-0 text-muted-foreground shadow-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring dark:bg-transparent dark:hover:bg-muted"
                >
                    <SelectValue className="sr-only" />
                </SelectTrigger>
            </div>
            <SelectContent
                align="end"
                alignItemWithTrigger={false}
                className="w-36 min-w-36"
            >
                <SelectGroup>
                    {primaryItems.map((item) => (
                        <SelectItem key={item.href} value={item.href}>
                            {item.label}
                        </SelectItem>
                    ))}
                    <SelectSeparator className="my-1" />
                    {secondaryItems.map((item) => (
                        <SelectItem key={item.href} value={item.href}>
                            {item.label}
                        </SelectItem>
                    ))}
                </SelectGroup>
            </SelectContent>
        </Select>
    );
}
