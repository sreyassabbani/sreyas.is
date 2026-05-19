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
const aboutItem: NavigationItem = { href: "/about", label: "About" };

export const mainNavigationGroups: readonly NavigationItemGroup[] = [
    {
        items: [thinkingItem, usingItem],
    },
    {
        items: [nowItem, aboutItem],
    },
];
