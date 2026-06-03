import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const posts = defineCollection({
    loader: glob({
        pattern: ["**/*.{md,mdx}"],
        base: "./src/content/posts",
    }),
    schema: ({ image }) =>
        z
            .object({
                title: z.string(),
                description: z.string(),
                pubDate: z.coerce.date(),
                updatedDate: z.coerce.date().optional(),
                type: z.enum(["long", "short"]),
                tags: z.array(z.string()).default([]),
                toc: z.boolean().default(true),
                headingDisplay: z
                    .enum(["visible", "toc-only"])
                    .default("visible"),
                heroImage: image().optional(),
            })
            .refine(
                ({ headingDisplay, toc }) =>
                    headingDisplay !== "toc-only" || toc,
                {
                    message:
                        'headingDisplay: "toc-only" requires toc to be true',
                    path: ["headingDisplay"],
                },
            ),
});

const pages = defineCollection({
    loader: glob({
        pattern: ["**/*.{md,mdx}"],
        base: "./src/content/pages",
    }),
    schema: z.object({
        title: z.string(),
        description: z.string(),
    }),
});

export const collections = { posts, pages };
