## Agent Operating Guide

### Mission
Keep this repo easy for coding agents to change safely. Prefer small,
verifiable patches over broad rewrites, and preserve the authored feel of the
site.

### Project Shape
- Astro site using Bun, React islands, Tailwind CSS v4, Biome, and strict
  TypeScript.
- Blog content is generated into `src/content/blog` from a separate blog repo.
  Treat `src/content/blog` as disposable build input, not source.
- The usual source files live in `src/pages`, `src/components`, `src/layouts`,
  `src/lib`, `src/styles`, and `scripts`.

### Commands
- Install dependencies: `bun install`
- Start dev server: `bun run dev`
- Sync blog content once: `bun run blog:sync`
- Include untracked local blog drafts during dev: `bun run dev -- --show-untracked`
- Format in place: `bun run fmt`
- Apply safe Biome fixes: `bun run check:fix`
- Validate without mutating files: `bun run ci`
- Type-check only: `bun run typecheck`
- Build only: `bun run build`

### Guardrails
- Do not edit `src/content/blog` directly. Change the blog source repo instead,
  then run `bun run blog:sync`.
- Do not commit generated output from `dist`, `.astro`, `.blog-sync-backups`, or
  `node_modules`.
- Do not run mutating format/fix commands unless you intend to keep all touched
  files. For final verification, prefer `bun run ci` because it is non-mutating.
- Before editing, check `git status --short` and avoid overwriting user changes.
- Keep dependency changes intentional. If `package.json` changes, `bun.lock`
  should normally change with it after `bun install`.
- Use repo-local tools through Bun or the Nix/direnv shell; avoid assuming global
  Node, Astro, Biome, or TypeScript installs.
- Avoid adding decorative UI chrome, generic card grids, glow effects, or loud
  gradients unless explicitly requested.

### Review Priorities
- User-facing copy and layout should stay modest, precise, and personal.
- Light and dark themes need equal attention.
- Blog routing, RSS, sitemap, and generated blog sync are high-risk areas; run
  `bun run build` or `bun run ci` after touching them.
- Public writing lives under `/thinking`; keep `/blog` only as a compatibility
  redirect surface for old links.
- Component changes should preserve accessibility semantics and keyboard paths,
  especially in `src/components/ui`.

## Design Context

### Users
This is a personal site for technically curious readers, friends, peers, and anyone landing here to get a sense of Sreyas and browse his writing. The main jobs are to understand who he is, what he cares about, and then move naturally into his thinking and writing.

### Brand Personality
Thoughtful, modest, precise.
The interface should feel calm, self-assured, and personal without sounding performative or overdesigned.

### Aesthetic Direction
Modern editorial minimalism with a serif-led voice. Light and dark mode should both feel restrained and clean. Favor centered moments only when they are intentional, especially for portraits or introductory hero sections. Avoid glows, heavy boxed cards, loud gradients, all-caps labels, generic AI-looking layouts, and decorative chrome that competes with the writing.

### Design Principles
1. Let spacing do the work before borders, fills, or effects.
2. Prefer subtle separators and rhythm over card grids.
3. Keep typography refined and modest, with clear hierarchy and no shouting.
4. Make pages feel authored and personal, not templated.
5. Use simple structures that stay elegant in both light and dark themes.
