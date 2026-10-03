# Terminal presentation review

## Previous agent

Read the August terminal-capture conversation and the most recent October agent
transcript, including the narrow TerminalScreenshot PR. The native Ghostty
workflow solved the earlier fidelity problems: guessed prompt styles,
NO_COLOR, Fastfetch reporting a PTY wrapper, and Yazi's Kitty image preview.

The remaining display bug was in the component. Intrinsic width/height
attributes preserve aspect ratio, but `width: 100%` still stretches every crop
to the same article width. A 950-pixel crop and a 2016-pixel capture therefore
have different apparent font sizes. PNG pixels also cannot provide native text
selection. The earlier reconstructed transcript should not be reinstated.

## Personal blogs and direct examples

These are people's own articles, rather than company documentation:

- [Amos / fasterthanlime: A terminal case of Linux](https://fasterthanli.me/articles/a-terminal-case-of-linux)
  mixes screenshots illustrating color/TTY behavior with selectable command and
  source blocks. Useful precedent for choosing the medium per example.
- [Thorsten Ball / Amp: Unicorn Unix Magic Tricks](https://thorstenball.com/blog/2014/11/20/unicorn-unix-magic-tricks/)
  presents commands and process trees as text. His
  [terminal experiment](https://registerspill.thorstenball.com/p/joy-and-curiosity-64)
  also uses a native capture loop to inspect actual rendering.
- [Mitchell Hashimoto / Superlogical: Ghostty Devlog 006](https://mitchellh.com/writing/ghostty-devlog-006)
  is relevant to terminal behavior and fidelity. The concrete export capability
  comes from Ghostty's
  [rich clipboard support](https://ghostty.org/docs/install/release-notes/1-3-0#rich-clipboard-copy)
  and [scripting API](https://ghostty.org/docs/features/applescript).
- [Guillermo Rauch / Vercel: Develop, Preview, Test](https://rauchg.com/2020/develop-preview-test)
  supports inspecting and testing the rendered result in browsers. It does not
  document a terminal-capture exporter.
- [Micah R. L.: Color HTML Ghostty transcripts](https://me.micahrl.com/blog/color-html-ghostty-transcripts/)
  directly uses Ghostty's native HTML for colored, selectable blog transcripts.
  This is the closest practical solution to the requested feature.

## Choice

Use native Ghostty HTML for settled text output, with the real capture available
alongside it. Keep screenshots for graphics-heavy TUIs. Give wide terminal
blocks more room on desktop and horizontal scrolling on smaller screens. Keep
a stable reading size and make fitting an explicit reader choice.

An invisible text layer over a screenshot, like a searchable PDF, could preserve
every pixel while enabling selection. It needs matching cell coordinates and
glyph geometry; OCR adds transcription errors. Inline text SVG and a terminal
replay are other options, but involve font, renderer, selection, and graphics
compatibility work. Native HTML already solves the common case without another
terminal emulator in the page.

The README describes capture, integration, and the remaining fidelity limits.

## Implementation and verification (October 3, 2026)

- Native PNG plus HTML companions, with image digests to reject stale text.
- Selectable, sanitized HTML with native RGB colors and terminal styles, real
  Geist/Nerd glyphs, and the original image available alongside it.
- Stable text size and logical Retina image dimensions. Wide scenes can extend
  beyond the prose column on desktop; narrow screens scroll horizontally.
- Official Ghostty scripting stages the direct Nushell session. No PTY wrapper
  changes Fastfetch's terminal identity. The exporter restores the clipboard.
- Native permission check, Fastfetch, fast, Zoxide, and glyph/style probes passed.
  Parallel captures kept their export paths distinct and the clipboard's data
  fingerprint was unchanged afterward.
- Chrome checks passed at 1440, 768, 390, and 320 pixels in light and dark themes:
  mouse selection, exact copy payload (clipboard API mocked), view controls,
  image fitting, keyboard scrolling, and no document-wide horizontal overflow.
  JavaScript-free rendering and denied clipboard handling also passed.
- Chrome's font inspection confirmed the custom regular, bold, and Nerd symbol
  faces were actually rendered. The self-contained preview works offline.
- `direnv exec . bun run ci` passed: 30 tests, formatting/lint, type checking with
  zero errors/warnings, and the production build. Temporary QA content was
  removed before that build.

The dependency upgrade already present in the worktree exposed two unrelated
build problems. Added the Markdown type package, aligned Shiki transformers
with Astro's Shiki version, and retained the older `ToolTip` export spelling
used by an existing article. The dependency upgrade itself was preserved.

After local approval, the fresh fast, Fastfetch, and Zoxide captures and their
text companions were applied to the canonical content repository. The article's
image imports discover the companions automatically. No changes were committed
or deployed.

Local application also exposed an Astro cache issue when switching content
roots: identical MDX contents retained the published tree's old media paths.
The content loader now invalidates cached source paths when its base changes,
with a regression test. Desktop and mobile checks on the actual local article
confirmed all three selectable outputs and their original-image switches.
