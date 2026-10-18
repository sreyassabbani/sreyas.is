"use client";

import { Select as SelectPrimitive } from "@base-ui/react/select";
import * as React from "react";

import { Chip } from "@/components/ui/chip";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectSeparator,
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
            <div className="flex items-center font-brand text-[clamp(1.45rem,6vw,2.35rem)] font-semibold tracking-tight leading-none md:text-[clamp(1.8rem,8vw,2.35rem)]">
                <a href="/" className="no-underline hover:text-foreground">
                    <span className="select-none">sreyas</span>
                    <span className="text-primary select-none">.is</span>
                </a>
                <SelectPrimitive.Trigger
                    aria-label="Choose page"
                    render={<Chip className="ml-2 md:ml-4" />}
                >
                    {currentItem && currentItem.href !== "/"
                        ? currentItem.label.toLowerCase()
                        : "..."}
                </SelectPrimitive.Trigger>
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
