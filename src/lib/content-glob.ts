import { glob, type Loader } from "astro/loaders";

/** Keep preview and published entries from sharing cached source paths. */
export function contentGlob(base: string): Loader {
    const loader = glob({ pattern: ["*.{md,mdx}"], base });
    return {
        ...loader,
        async load(context) {
            // Astro's glob cache compares file contents, which can be identical
            // in both trees even though their adjacent media are different.
            if (context.meta.get("source-base") !== base) {
                context.store.clear();
                context.meta.set("source-base", base);
            }
            await loader.load(context);
        },
    };
}
