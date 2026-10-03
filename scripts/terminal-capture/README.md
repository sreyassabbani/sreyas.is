# Terminal capture workflow

Use the isolated Ghostty profile for terminal images published in `terminal-delights`:

```sh
bun run capture:terminal -- <name> [options] -- <command> [args...]
```

The final workflow is interactive. Arrange the temporary Ghostty window and
wait for previews to finish, return to the controller, then press Enter. `--delay`
is intended for automated smoke checks and static commands, not final TUI shots.

For a scene that includes the shell prompt, launch Nushell itself and type the
article command in that new window:

```sh
bun run capture:terminal -- fastfetch --cwd ~ --force -- nu
```

This is intentionally a direct shell session. A PTY automation wrapper changes
process ancestry (Fastfetch will report the wrapper as the terminal) and can
race Nushell startup. Direct Nushell preserves the real prompt, aliases, hooks,
and environment. Ghostty 1.3's official scripting API can also stage that real
shell directly, without introducing a PTY wrapper:

```sh
bun run capture:terminal -- fastfetch --cwd ~ --html \
  --input clear --input fastfetch --delay 2 --force -- nu
```

`--input` sends a paste and Enter to the first terminal of the isolated capture
PID. It never targets the user's frontmost terminal. For slow shell startup or
interactive scenes, stage the window manually and use the normal Enter prompt.

## Selectable output

`--html` writes `<name>.terminal.json` beside the PNG. This contains the native
Ghostty screen export, its pixel ratio, and a SHA-256 digest of the PNG. Keep both
files together. `TerminalScreenshot` discovers these companions automatically
beside imported PNGs, including local content preview, so the article's
image imports do not need to change. A mismatched companion fails the build.

Discovery uses Astro's internal build-time image source path, checked in both
development and production on the pinned Astro version. Recheck this when
upgrading Astro. The component's explicit `html` prop is available if that
metadata changes.

Keep new PNGs and companions in the canonical content repository before
running `content:sync`; the local preview includes tracked and untracked files.
Track both when committing content for publication.

The reader gets selectable text, the original terminal's colors and styles,
copying, and an original-image view. Text stays at 16 CSS pixels; wide output
scrolls instead of shrinking. Screenshots use their logical Retina dimensions,
with an optional Fit width control. Small crops are never stretched to article
width by default. Without JavaScript, the default view and original-image link
still work.

The importer only publishes escaped text, color/style spans, and HTTP(S) links.
It strips scripts, event handlers, foreign markup, global styles and layout CSS;
palette variables are resolved locally. It does not infer prompt colors from
words. The native exporter temporarily uses the clipboard for Ghostty's file
path, then restores all its previous data types unless the user copied something
else during the operation. No `pbpaste-htmlsrc` installation is needed.

HTML captures terminal text, not Kitty graphics, the cursor, or animation. Keep
image-only captures for Yazi's visual preview. Capture settled output: the PNG
and text exports are sequential, not a frame-atomic snapshot of an animated TUI.
Geist does not contain every Unicode glyph. Braille graphs use the browser's
fallback font (Apple Braille on this Mac); the capture retains Ghostty's exact
glyph rendering.
Existing PNGs cannot acquire their exact original text retrospectively; recapture
them with `--html` rather than inventing an ANSI transcript or trusting OCR.

The controller always validates the full Retina capture before applying an
optional deterministic crop. `--crop-height` crops vertically from
`--crop-top` (zero by default), while `--crop-width` removes empty space only
from the right. For example, the compact `fast` frame can be recaptured with:

```sh
bun run capture:terminal -- fast \
  --crop-height 420 \
  --crop-width 950 \
  --force \
  -- nu
```

Type `fast` in the new window, wait for the graph and final prompt, then return
to the controller and press Enter. Crops are pixel baselines tied to the checked
profile; review them whenever the profile geometry changes.

## Yazi scene

Use a dedicated Yazi client ID so another Yazi session cannot restore a different
cursor. Passing the target image path opens `src/assets` with
`content-placeholder-about.jpg` selected and its Kitty preview visible:

```sh
bun run capture:terminal -- yazi \
  --profile wide \
  --cwd ~/workflow/sreyas.is/src/assets \
  --force \
  -- yazi --client-id 923481 \
    ~/workflow/sreyas.is/src/assets/content-placeholder-about.jpg
```

The default destination is the canonical content repo at
`~/workflow/content/posts/components/terminal-delights/media/<name>.png`.

## Reproducibility gates

The controller refuses a capture when the Ghostty version or font differs from
the checked profile, macOS Screen Recording is unavailable, geometry drifts,
the image is blank, or a completed command exited nonzero. It matches the
temporary window by a unique process and window identity, revalidates both
immediately before capture, normalizes the PNG to sRGB, and replaces an existing
output only after validation. Without `--force`, publication uses an atomic
no-clobber link.

The launcher gives `open` a new, minimal environment instead of inheriting the
controller's secrets and automation variables. Nushell then loads the user's
real config and direnv state normally. Do not forward the whole environment
through Ghostty CLI arguments: those values are visible in the process list and
may contain credentials.

If `ghostty.conf` intentionally changes the type or geometry, update and review
the version, font, and expected pixel-size baselines in `capture-terminal.ts` in
the same change.

Native Swift helpers explicitly use the installed Xcode SDK. The Nix shell's
SDKROOT may refer to an older SDK incompatible with Apple's Swift compiler;
compiler failures are reported separately from Screen Recording permission.
