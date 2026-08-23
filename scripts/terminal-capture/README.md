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
and environment. Ghostty is blocked by the local UI-automation safety layer, so
one manual paste per prompt-bearing scene is the faithful workflow.

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
