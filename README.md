# sreyas.is

Astro site repo with writing and page content kept in a separate git repo.

## Recommended layout

```text
workspace/
  content/  # content repo
  sreyas.is/ # this repo
```

`src/content` is not committed. It is generated automatically before `bun run dev` and `bun run build`.
By default, only files tracked by git in the content repo are synced into the site repo; untracked drafts, scratch files, repo metadata, and the content repo `README.md` / `LICENSE` stay out of `src/content`.

## How mounting works

- If `CONTENT_DIR` is set, the site copies content from that path.
- Otherwise it looks for `~/workflow/content`.
- If that does not exist, it falls back to a sibling repo at `../content`.
- If neither exists, it creates an empty `src/content` directory so the site still builds.

That keeps Astro's content collection setup unchanged while avoiding submodules entirely. The copy step is important because MDX files can use relative imports that need to resolve from inside the site repo.

## Local development

```bash
git clone git@github.com:sreyassabbani/content ~/workflow/content
git clone git@github.com:sreyassabbani/sreyas.is ~/workflow/sreyas.is
cd ~/workflow/sreyas.is
direnv allow
bun install
bun run dev
```

While `bun run dev` is running, the site watches `~/workflow/content` or `CONTENT_DIR` and re-syncs `src/content` automatically whenever the content repo changes.

If you want drafts and other untracked files to appear temporarily during local development, run:

```bash
bun run dev -- --show-untracked
```

That mode includes untracked content files while the dev command is alive, then restores `src/content` back to tracked-only content when the process exits normally.

## Helix / Nix / direnv

- `flake.nix` provides `bun`, `node`, and `nu`.
- The Nix shell prepends `node_modules/.bin` to `PATH`, so repo-local tools like `astro-ls` and `typescript-language-server` are visible to Helix.
- `.helix/languages.toml` points `.astro`, `.ts`, `.tsx`, `.js`, and `.jsx` files at the right language servers without needing global installs.
- `tsconfig.json` enables `@astrojs/ts-plugin`, which is what teaches TypeScript-aware editors how to understand `.astro` imports outside VS Code.
- `bun run typecheck` runs `astro check`, which covers both `.astro` files and normal TypeScript files.
- `bun run content:sync` refreshes the generated `src/content` mount from `~/workflow/content` or `CONTENT_DIR`.
- `bun run content:watch` keeps the generated mount in sync continuously while you work.
- `bun run content:sync -- --show-untracked` and `bun run content:watch -- --show-untracked` temporarily include untracked files too.

If you launch Helix from Nushell, make sure your Nushell config loads `direnv` first so the flake shell environment reaches `hx`.

## Formatting

Biome owns formatting and linting for the repo. Astro files are the only exception: `*.astro` is excluded from Biome and formatted with Prettier plus `prettier-plugin-astro`.

- `bun run fmt` formats everything.
- `bun run check` runs Biome checks plus Astro formatting checks.
- `bun run fmt:biome` and `bun run fmt:astro` are the narrow escape hatches.

## Pre-commit sync

This repo installs a versioned `pre-commit` hook through `simple-git-hooks`.

- Every site-repo commit re-syncs `src/content` from the real content source.
- Before overwriting the generated mount, it writes a timestamped backup to `.content-sync-backups/`.
- If `src/content` has staged files that are not tracked in `~/workflow/content`, the commit is blocked.
- `~/workflow/content` is the source of truth. `src/content` stays generated and gitignored.

## Deploy pattern

The deploy workflow checks out two separate repos:

```text
/
  content/
  site/
```

Then it builds from `site/`. The build step sets `CONTENT_DIR=../content`, so the `prebuild` hook syncs the checked out content repo into `site/src/content` automatically.

Content pushes can trigger this deploy workflow directly through a `repository_dispatch` event. To enable that, add a `SITE_REPO_DISPATCH_TOKEN` secret in the content repo with permission to dispatch workflows in `sreyassabbani/sreyas.is`.

## Why this setup is cleaner than submodules

- No submodule init/update workflow.
- Content history and permissions stay isolated.
- The site repo builds the same way locally and in CI.
- Astro routes and collection code do not need to know where content came from.
