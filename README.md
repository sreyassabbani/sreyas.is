My website @ [`sreyas.is`](https://sreyas.is). See source for various pages and posts in [`src/content`](src/content).

I version control drafts in a separate, private repository (`sreyassabbani/content`). They are committed into [`src/content`](src/content) when their frontmatter has `publish: true`; posts become eligible at 11:59 PM `America/New_York` on their `pubDate`, while pages become eligible immediately.

## Local development

```bash
direnv allow
bun i
bun dev
```

`bun dev` looks for the private content repository at `~/workflow/content` or `../content`. Set `CONTENT_DIR` to override that location; relative paths are resolved from this repository's root.

All three commands start Astro in watch/HMR mode:

- `bun dev`: mirrors _all_ tracked and untracked working content from the private repository into the ignored `src/content-preview` directory.
- `bun dev --only-publish-intent`: mirrors only entries with `publish: true`, including posts whose scheduled publication time has not arrived.
- `bun dev --only-published`: uses the committed snapshot in [`src/content`](src/content), matching the content on public [`sreyas.is`](https://sreyas.is).

### Publication

Content frontmatter must contain `publish: true` before it can become public. Posts publish at 11:59 PM `America/New_York` on their `pubDate`; pages publish immediately.

The private repository's workflow runs after source pushes, manually, and at the primary and retry publication times. It:

1. Generates the eligible snapshot into `src/content`.
2. Builds and validates the public site.
3. Commits and pushes only when the public snapshot changed.

Private entry dependencies live under per-entry directories such as `posts/components/<post-name>`. Astro's collections load only top-level entry documents, so dependency files cannot become routes themselves.

### Formatting and checks

Biome owns formatting and linting except for `*.astro`, which uses Prettier with `prettier-plugin-astro`.
