import { getCollection } from "astro:content";
import type { APIRoute } from "astro";
import { buildIndex } from "@/lib/api";

export const GET: APIRoute = async () => {
    const [pages, entries] = await Promise.all([
        getCollection("pages"),
        getCollection("posts"),
    ]);

    return Response.json(buildIndex(pages, entries));
};
