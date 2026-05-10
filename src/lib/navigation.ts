export type NavigationItem = Readonly<{
    href: string;
    label: string;
}>;

export type NavigationItemGroup = Readonly<{
    items: readonly NavigationItem[];
}>;

const thinkingItem: NavigationItem = { href: "/thinking", label: "Thinking" };
const usingItem: NavigationItem = { href: "/using", label: "Using" };
const nowItem: NavigationItem = { href: "/now", label: "Now" };
const moreItem: NavigationItem = { href: "/about", label: "More" };

export const homeNavigationItems: readonly NavigationItem[] = [
    thinkingItem,
    usingItem,
    moreItem,
];

export const mainNavigationGroups: readonly NavigationItemGroup[] = [
    {
        items: [thinkingItem, usingItem],
    },
    {
        items: [nowItem, moreItem],
    },
];
