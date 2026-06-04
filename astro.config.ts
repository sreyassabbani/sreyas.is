import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import type { Root } from "hast";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import type { VFile } from "vfile";

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
    site: "https://sreyassabbani.github.io",
    integrations: [mdx(), react(), sitemap()],
    markdown: {
        remarkPlugins: [remarkMath],
        rehypePlugins: [rehypeKatexWithPostMacros],
        syntaxHighlight: "shiki",
        shikiConfig: {
            themes: {
                light: "catppuccin-latte",
                dark: "catppuccin-frappe",
            },
            wrap: true,
        },
    },
    vite: {
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
