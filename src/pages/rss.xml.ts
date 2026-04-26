import { getCollection } from "astro:content";
import rss from "@astrojs/rss";
import type { APIRoute } from "astro";
import { getThinkingHref, isLongEntry, sortByNewest } from "@/lib/thinking";
import { SITE_DESCRIPTION, SITE_TITLE } from "../consts";

export const GET: APIRoute = async ({ site }) => {
    if (!site) {
        throw new Error("Astro site config is required to generate RSS.");
    }

    const posts = sortByNewest(
        (await getCollection("posts")).filter(isLongEntry),
    );
    return rss({
        title: SITE_TITLE,
        description: SITE_DESCRIPTION,
        site,
        items: posts.map((post) => ({
            ...post.data,
            link: getThinkingHref(post),
        })),
    });
};
