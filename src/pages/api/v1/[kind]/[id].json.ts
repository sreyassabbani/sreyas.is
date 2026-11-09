import { getCollection } from "astro:content";
import type { APIRoute, GetStaticPaths } from "astro";
import { buildPage, buildThinking } from "@/lib/api";

export const getStaticPaths = (async () => {
    const [pages, entries] = await Promise.all([
        getCollection("pages"),
        getCollection("posts"),
    ]);

    return [
        ...pages.map((page) => ({
            params: { kind: "pages", id: page.id },
            props: { body: buildPage(page) },
        })),
        ...entries.map((entry) => ({
            params: { kind: "thinking", id: entry.id },
            props: { body: buildThinking(entry) },
        })),
    ];
}) satisfies GetStaticPaths;

export const GET: APIRoute = ({ props }) => Response.json(props.body);
