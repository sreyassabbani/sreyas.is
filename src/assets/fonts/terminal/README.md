# Terminal web fonts

Derived from GeistMono Nerd Font Mono 1.401, Nerd Fonts 3.4.0, matching the
checked Ghostty capture profile. Sources:

- https://github.com/vercel/geist-font
- https://github.com/ryanoasis/nerd-fonts/tree/v3.4.0/patched-fonts/GeistMono

The subsets use the internal names Terminal Capture Mono and Terminal Capture
Symbols. Regular and bold text are separate WOFF2 files (~40 and ~43 KB).
Private-use Nerd glyphs are separated by CSS unicode-range (~1.1 MB) and are
downloaded only when output includes those symbols. Image-only captures do not
need the terminal web font. These are the installed font's actual outlines;
the site does not redraw icons or substitute a different monospace family.

FontTools 4.60.2 and Brotli 1.2.0 produced these subsets. Use
`scripts/terminal-capture/build-fonts.py <directory-containing-the-OTFs>` to
regenerate them. License and copyright notices are included alongside them.
