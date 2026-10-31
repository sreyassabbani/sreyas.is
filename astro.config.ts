import path from "node:path";
import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import {
    transformerMetaHighlight,
    transformerNotationDiff,
    transformerNotationFocus,
    transformerNotationHighlight,
} from "@shikijs/transformers";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import type { Root } from "hast";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import type { VFile } from "vfile";
import rehypeExternalLinks from "./src/lib/rehype-external-links";

// An isolated build/check uses its own caches as well as its own .astro dir.
const isolatedCache = process.env.SREYAS_ASTRO_ISOLATED_CACHE;

const jacobianCoordinateMacros = {
    "\\cx": "\\textcolor{#D55E00}{x}",
    "\\cy": "\\textcolor{#009E73}{y}",
    "\\cz": "\\textcolor{#F0E442}{z}",
    "\\crho": "\\textcolor{#CC79A7}{\\rho}",
    "\\ctheta": "\\textcolor{#E69F00}{\\theta}",
    "\\cphi": "\\textcolor{#56B4E9}{\\phi}",
    "\\dx": "d\\cx",
    "\\dy": "d\\cy",
    "\\dz": "d\\cz",
    "\\drho": "d\\crho",
    "\\dtheta": "d\\ctheta",
    "\\dphi": "d\\cphi",
};

function rehypeKatexWithPostMacros() {
    return (tree: Root, file: VFile) =>
        rehypeKatex(
            file.path.endsWith("/jacobians.mdx")
                ? { macros: jacobianCoordinateMacros }
                : undefined,
        )(tree, file);
}

export default defineConfig({
    cacheDir: isolatedCache ? path.join(isolatedCache, "astro") : undefined,
    site: "https://sreyassabbani.github.io",
    redirects: {
        "/about": "/",
    },
    // Fetch a page when a link is hovered, so the view transition runs from
    // cache instead of waiting on the network.
    prefetch: {
        prefetchAll: true,
        defaultStrategy: "hover",
    },
    integrations: [mdx(), react(), sitemap()],
    markdown: {
        remarkPlugins: [remarkMath],
        rehypePlugins: [rehypeKatexWithPostMacros, rehypeExternalLinks],
        syntaxHighlight: "shiki",
        shikiConfig: {
            themes: {
                light: "catppuccin-latte",
                dark: "catppuccin-frappe",
            },
            wrap: false,
            transformers: [
                transformerMetaHighlight(),
                transformerNotationDiff(),
                transformerNotationHighlight(),
                transformerNotationFocus(),
            ],
        },
    },
    vite: {
        ...(isolatedCache
            ? { cacheDir: path.join(isolatedCache, "vite") }
            : {}),
        plugins: [tailwindcss()],
        resolve: {
            dedupe: ["react", "react-dom"],
        },
        ssr: {
            // Ensure KaTeX CSS is bundled by Vite instead of being loaded directly by Node.
            noExternal: ["katex"],
        },
    },
});
