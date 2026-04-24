import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const blog = defineCollection({
    loader: glob({
        pattern: ["**/*.{md,mdx}", "!README.md", "!LICENSE", "!.github/**"],
        base: "./src/content/blog",
    }),
    schema: ({ image }) =>
        z.object({
            title: z.string(),
            description: z.string(),
            pubDate: z.coerce.date(),
            updatedDate: z.coerce.date().optional(),
            type: z.enum(["long", "short"]),
            tags: z.array(z.string()).default([]),
            heroImage: image().optional(),
        }),
});

export const collections = { blog };
