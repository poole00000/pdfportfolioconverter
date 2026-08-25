# RAC PDF Portfolio Converter — MCR-286 Fauna Exception Edition

This is the keyboard-only black/green 1980s-style PDF Portfolio converter.

## Canonical service path

The only valid five-key dispatch sequence is:

`0 6 7 8 4`

Those five stages configure the normal PDF Portfolio conversion pipeline.

## Wrong command behavior

At any dispatch stage, choosing any of the other menu vectors immediately invokes the MCR-286 exception handler.

The browser generates and downloads:

`INVALID_COMMAND_FROGS_AND_SEALS_100_PAGES.pdf`

It contains 100 pages alternating between computer-drawn frog and seal pictures. The PDF is generated locally in the browser and does not fetch images from the internet.

After the file is generated, the converter resets to dispatch stage 1.

## Keyboard-only interface

- Mouse/pointer input is disabled on the terminal page.
- Mouse-wheel and touch scrolling are blocked.
- `↑` / `↓` scroll one increment.
- `Page Up` / `Page Down` scroll one screen.
- `Home` / `End` jump to the beginning/end.
- `Backspace` backs up through the valid pre-file sequence.
- The operating-system file picker is still controlled by the browser/OS.

## Normal converter controls after the valid path

- `1` choose another PDF Portfolio
- `2` or `Enter` convert
- `O` cycle ordering
- `Q` cycle raster quality
- `A` toggle embedding original component PDFs
- `D` save result
- `N` new job
- `Backspace` return to the final pre-file dispatch stage
