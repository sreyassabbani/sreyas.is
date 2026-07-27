# sreyas.is

Astro site with published writing committed under `src/content`. Private
content lives in the separate `sreyassabbani/content` repository.

## Content layout

```text
workspace/
  content/   # private source of truth
  sreyas.is/
    src/content/          # tracked public snapshot
    src/content-preview/  # ignored local preview mirror
```

Production and CI build only from `src/content`, so they do not need access to
the private repository. The private content repository publishes eligible
entries by committing a generated snapshot here.

## Local development

```bash
git clone git@github.com:sreyassabbani/content ~/workflow/content
git clone git@github.com:sreyassabbani/sreyas.is ~/workflow/sreyas.is
cd ~/workflow/sreyas.is
direnv allow
bun install
bun run dev
```

`bun run dev` mirrors the private repository into the ignored
`src/content-preview` directory and watches it for changes. Astro reads that
preview directory only in development; normal builds continue to read the
tracked public snapshot.

To include files that have not yet been committed in the private repository:

```bash
bun run dev -- --show-untracked
```

The related commands are:

- `bun run content:sync` refreshes the private preview mirror.
- `bun run content:watch` keeps the preview mirror synchronized.
- `bun run content:sync -- --show-untracked` includes untracked source files.

## Publication

Content frontmatter must contain `publish: true` before it can become public.
Posts publish at 11:59 PM America/New_York on their `pubDate`; pages publish
immediately.

The private repository's workflow runs after source pushes, manually, and at
the primary and retry publication times. It:

1. Generates the eligible snapshot into `src/content`.
2. Builds and validates the public site.
3. Commits and pushes only when the public snapshot changed.

Private entry dependencies live under per-entry directories such as
`posts/components/<post-name>`. Astro's collections load only top-level entry
documents, so dependency files cannot become routes themselves.

## Helix, Nix, and direnv

- `flake.nix` provides `bun`, `node`, and `nu`.
- The Nix shell prepends `node_modules/.bin` to `PATH`.
- `.helix/languages.toml` configures Astro and TypeScript language servers.
- `tsconfig.json` enables `@astrojs/ts-plugin`.
- `bun run typecheck` checks Astro and TypeScript files.

If Helix is launched from Nushell, ensure the Nushell configuration loads
`direnv` first so the flake environment reaches `hx`.

## Formatting and checks

Biome owns formatting and linting except for `*.astro`, which uses Prettier
with `prettier-plugin-astro`.

- `bun run fmt`
- `bun run check`
- `bun run typecheck`
- `bun run build`
- `bun run ci`
