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
import {
    mainNavigationGroups,
    type NavigationItem,
    type NavigationItemGroup,
} from "@/lib/navigation";

type NavigationDropdownProps = Readonly<{
    pathname: string;
}>;

const navItems: readonly NavigationItem[] = mainNavigationGroups.flatMap(
    (group: NavigationItemGroup): readonly NavigationItem[] => group.items,
);

function isCurrent(pathname: string, href: string): boolean {
    return pathname === href || pathname.startsWith(`${href}/`);
}

export function NavigationDropdown({ pathname }: NavigationDropdownProps) {
    const currentItem: NavigationItem | undefined = navItems.find(
        (item: NavigationItem): boolean => isCurrent(pathname, item.href),
    );
    const currentHref: string | null =
        currentItem?.href ?? navItems[0]?.href ?? null;
    const currentLabel: string = currentItem?.label ?? "Navigate";
    const [value, setValue] = React.useState<string | null>(currentHref);

    React.useEffect(() => {
        setValue(currentHref);
    }, [currentHref]);

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
                    {mainNavigationGroups.map(
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
