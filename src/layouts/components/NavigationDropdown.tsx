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
import type { NavigationItem, NavigationItemGroup } from "@/lib/navigation";

type NavigationDropdownProps = Readonly<{
    pathname: string;
    groups: readonly NavigationItemGroup[];
}>;

function isCurrent(pathname: string, href: string): boolean {
    if (href === "/") {
        return pathname === "/";
    }
    return pathname === href || pathname.startsWith(`${href}/`);
}

export function NavigationDropdown({
    pathname,
    groups,
}: NavigationDropdownProps) {
    const navItems: readonly NavigationItem[] = groups.flatMap(
        (group: NavigationItemGroup): readonly NavigationItem[] => group.items,
    );
    const currentItem: NavigationItem | undefined = navItems.find(
        (item: NavigationItem): boolean => isCurrent(pathname, item.href),
    );
    // If on home, we shouldn't force 'thinking' as the default value if it's not the actual current path.
    const currentHref: string | null =
        pathname !== "/" ? (currentItem?.href ?? null) : null;
    const [value, setValue] = React.useState<string | null>(currentHref);

    React.useEffect(() => {
        setValue(pathname !== "/" ? (currentItem?.href ?? null) : null);
    }, [pathname, currentItem]);

    return (
        <Select
            items={navItems.map((item: NavigationItem) => ({
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
            <div className="flex items-center font-brand text-[clamp(1.8rem,8vw,2.35rem)] font-semibold tracking-tight leading-none">
                <a href="/" className="no-underline hover:text-foreground">
                    <span className="select-none">sreyas</span>
                    <span className="text-primary select-none">.is</span>
                </a>
                <SelectTrigger
                    aria-label="Choose page"
                    className="ml-4 h-auto w-auto cursor-pointer border-0 bg-transparent p-0 shadow-none hover:bg-transparent focus-visible:ring-0 dark:bg-transparent dark:hover:bg-transparent"
                >
                    <span className="flex items-center rounded border border-muted-foreground/50 px-1.5 py-0.5 text-lg font-normal text-muted-foreground transition-colors hover:border-primary hover:text-primary">
                        {currentItem && currentItem.href !== "/"
                            ? currentItem.label.toLowerCase()
                            : "..."}
                    </span>
                    <SelectValue className="sr-only" />
                </SelectTrigger>
            </div>

            <SelectContent
                align="start"
                alignOffset={-4}
                alignItemWithTrigger={false}
                className="w-40 min-w-40"
            >
                <SelectGroup>
                    {groups.map(
                        (group: NavigationItemGroup, groupIndex: number) => (
                            <React.Fragment
                                key={group.items
                                    .map((item) => item.href)
                                    .join("|")}
                            >
                                {groupIndex > 0 && (
                                    <SelectSeparator className="my-1" />
                                )}
                                {group.items.map((item: NavigationItem) => (
                                    <SelectItem
                                        key={item.href}
                                        value={item.href}
                                    >
                                        {item.label}
                                    </SelectItem>
                                ))}
                            </React.Fragment>
                        ),
                    )}
                </SelectGroup>
            </SelectContent>
        </Select>
    );
}
