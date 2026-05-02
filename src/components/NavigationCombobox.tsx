import { mainNavigationGroups } from "@/lib/navigation";
import { NavigationSelect } from "./NavigationSelect";

export function NavigationCombobox({ pathname }: { pathname: string }) {
    return (
        <NavigationSelect
            pathname={pathname}
            groups={mainNavigationGroups}
            ariaLabel="Choose page"
        />
    );
}
