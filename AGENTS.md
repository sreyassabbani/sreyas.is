# [`sreyas.is`](https://sreyas.is)

This is a personal site for technically curious readers, friends, peers, and anyone landing here to get a sense of Sreyas and browse his writing.

Astro site using Bun, React islands, Tailwind v4.

Environment: using Nix Flakes and `direnv`

Repository is hosted at `sreyassabbani/sreyas.is` on GitHub. Feel free to use `gh` CLI in this environment.

Inspect the relevant files directly when necessary: `flake.nix`, `.envrc`, `.helix/`, and `package.json`.

Content is generated into `sreyas.is/src/content` from a separate content repo. On Sreyas's machine, it is at `~/workflow/content`. That folder is version-tracked and its repository is also hosted on GitHub, at `sreyassabbani/content`. Anything inside `sreyas.is/src/content` is disposable build input.

Never edit any content unless explicitly told so. In the case when permitted, your edit destinations will be `~/workflow/content` on Sreyas's machine.

## Minor Quirks

- Biome owns formatting and linting, except `*.astro` files, which are formatted by Prettier with `prettier-plugin-astro`.

## UI

Do not edit any visual element unless strictly told to bypass this filter.
