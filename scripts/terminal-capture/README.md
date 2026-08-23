# Terminal capture workflow

Use the isolated Ghostty profile for terminal images published in `terminal-delights`:

```sh
bun run capture:terminal -- <name> [options] -- <command> [args...]
```

The normal workflow is interactive. Arrange the temporary Ghostty window and
wait for previews to finish, return to the controller, then press Enter. `--delay`
is intended for automated smoke checks and static commands, not final TUI shots.

## Yazi scene

Use a dedicated Yazi client ID so another Yazi session cannot restore a different
cursor. With the current repository ordering, this opens `~/workflow/sreyas.is`
with `dist` selected, matching the article scene:

```sh
bun run capture:terminal -- yazi \
  --cwd ~/workflow/sreyas.is \
  --force \
  -- yazi --client-id 923481
```

The default destination is the canonical content repo at
`~/workflow/content/posts/components/terminal-delights/media/<name>.png`.

## Reproducibility gates

The controller refuses a capture when the Ghostty version or font differs from
the checked profile, macOS Screen Recording is unavailable, the output is not
2016×1368, the image is blank, or the captured command has exited nonzero. It
matches the temporary window by a unique process and title marker, normalizes
the PNG to sRGB, and replaces an existing output only after validation.

The wrapper removes Codex's automation-only `NO_COLOR` variable while passing a
small allowlist of locale, terminfo, XDG, and color variables. Do not forward the
whole environment through Ghostty CLI arguments: those values are visible in
the process list and may contain credentials.

If `ghostty.conf` intentionally changes the type or geometry, update and review
the version, font, and expected pixel-size baselines in `capture-terminal.ts` in
the same change.
