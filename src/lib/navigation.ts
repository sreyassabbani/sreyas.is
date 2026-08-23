export type NavigationItem = Readonly<{
    href: string;
    label: string;
}>;

export type NavigationItemGroup = Readonly<{
    items: readonly NavigationItem[];
}>;

export function createNavigationGroups(
    contentPageItems: readonly NavigationItem[],
): readonly NavigationItemGroup[] {
    return [
        {
            items: [
                { href: "/thinking", label: "Thinking" },
                ...contentPageItems,
            ],
        },
        {
            items: [{ href: "/about", label: "About" }],
        },
    ];
}
