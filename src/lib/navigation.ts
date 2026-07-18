export type NavigationItem = Readonly<{
    href: string;
    label: string;
}>;

export type NavigationItemGroup = Readonly<{
    items: readonly NavigationItem[];
}>;
