# RAC PDF Portfolio Converter — MCR-286 Short-Path Document Lab

This version is a generic **PDF Portfolio** converter. Nothing in the dispatch selections assumes the portfolio contains OpsSpecs or any other particular document type.

## Canonical service path

The correct five-key path is:

`0 6 7 8 4`

The stages configure:

1. PDF Portfolio container / embedded-object enumeration.
2. Visible page and annotation/signature appearance capture.
3. Page geometry and output-order mapping.
4. Flattening, sequential assembly, and optional preservation of original component PDFs.
5. Local file selection.

Every stage still presents 20 vectors (`0-9`, `A-J`).

## Reversible rabbit holes

Wrong selections still enter the experimental PDF-mutation system. Those branches really alter the flattened output and include transformations such as monochrome conversion, negative imaging, green/amber phosphor mapping, dithering, scanlines, mirroring, skew, microfiche framing, overscan cropping, ghosting, press marks, hex footers, binary page numbers, terminal-width squeezing, and deterministic digital speckle.

Unlike the previous build, the branch is now reversible:

- `Backspace` — go back exactly one stage.
- `Esc` — also acts as Back while still inside the pre-file maze.
- Returning from a mutation depth removes the mutation armed at that depth.
- At mutation depth 4 or deeper, `J` can still commit the strange transformation chain and open the file selector.

## Keyboard-only scrolling

Mouse, pointer, touch, drag, context-menu, and mouse-wheel interaction are disabled inside the page.

Scrolling is intentionally keyboard-only:

- `↑` / `↓` — scroll a small amount
- `Page Up` / `Page Down` — scroll one screen
- `Home` / `End` — jump to the top or bottom

The operating system's file picker is still opened by the browser and may itself support normal OS input methods.

## Controls after the file gate

- `1` — choose another PDF Portfolio
- `2` or `Enter` — convert
- `O` — cycle component ordering
- `Q` — cycle raster quality
- `A` — toggle embedding original component PDFs
- `D` — save the completed PDF
- `N` — new job
- `Backspace` — return to the final pre-file dispatch stage
- `Esc` — clear the current conversion job

All PDF processing remains local in the browser.
