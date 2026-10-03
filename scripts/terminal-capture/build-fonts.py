"""Run with Python fonttools[woff] installed. No machine configuration changes."""

import sys
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont

source = Path(sys.argv[1])
output = Path(__file__).resolve().parents[2] / "src/assets/fonts/terminal"
output.mkdir(parents=True, exist_ok=True)


def private_use(code):
    return 0xE000 <= code <= 0xF8FF or 0xF0000 <= code <= 0x10FFFF


def export(face, symbols=False):
    font = TTFont(source / f"GeistMonoNerdFontMono-{face}.otf")
    codes = {code for code in font.getBestCmap() if private_use(code) == symbols}
    sub = subset.Subsetter()
    sub.populate(unicodes=codes)
    sub.subset(font)
    for name in font["name"].names:
        if name.nameID in [1, 3, 4, 6, 16]:
            value = "Terminal Capture Symbols" if symbols else "Terminal Capture Mono"
            if not symbols and name.nameID in [3, 4, 6]:
                value += f" {face}"
            if name.nameID == 6:
                value = value.replace(" ", "")
            name.string = value.encode(name.getEncoding())
    font.flavor = "woff2"
    suffix = "symbols" if symbols else face.lower()
    destination = output / f"geist-mono-nerd-{suffix}.woff2"
    font.save(destination)
    print(destination, destination.stat().st_size)


export("Regular")
export("Bold")
export("Regular", symbols=True)
