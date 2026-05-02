export type NavigationItem = {
    href: string;
    label: string;
};

export type NavigationItemGroup = {
    items: NavigationItem[];
};

export type NavigationSelectConfig = {
    label: string;
    ariaLabel: string;
    groups: NavigationItemGroup[];
    contentClassName?: string;
};

export const mainNavigationGroups: NavigationItemGroup[] = [
    {
        items: [
            { href: "/thinking", label: "Thinking" },
            { href: "/using", label: "Using" },
        ],
    },
    {
        items: [
            { href: "/now", label: "Now" },
            { href: "/about", label: "More" },
        ],
    },
];
