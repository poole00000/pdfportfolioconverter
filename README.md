# RAC OpsSpecs Portfolio Converter — MCR-286 Document Lab

This build keeps the black-screen / green-phosphor 1980s terminal interface and the keyboard-only controls, but the dispatch maze now corresponds to the real PDF conversion pipeline.

## Canonical service path

The normal portfolio-to-single-document path is still:

`0 6 1 2 1 9 9 4 0 6 7 8 4`

The 13 stages now represent real work:

1. Mount the Acrobat Portfolio container.
2. Enumerate embedded PDF components.
3. Resolve OpsSpec reading order.
4. Capture visible annotation/signature appearances.
5. Rasterize component pages.
6. Preserve page geometry.
7. Flatten each page into one visual layer.
8. Assemble one sequential PDF.
9. Embed the original signed component PDFs.
10. Preserve component filenames/identity.
11. Write the output catalog and metadata.
12. Reconcile page/component counts.
13. Open the local file selector.

Every stage still presents 20 keyboard choices (`0-9`, `A-J`).

## Experimental rabbit holes

Choosing any non-canonical vector permanently diverts the session into the **Experimental Document Mutation Subsystem**. The canonical return vector is intentionally destroyed for that browser session; reload the page to return to the normal path.

Unlike the old fake rabbit hole, the strange commands now perform real page transformations. Examples include:

- grayscale and photographic-negative conversion
- green or amber phosphor mapping
- 1-bit threshold and Bayer dithering
- CRT scanlines
- X/Y mirroring and odd-page 180-degree rotation
- slight affine skew
- microfiche-style shrink/frame
- edge crop/overscan
- ghosted duplicate raster
- print registration marks
- hexadecimal checksum footers
- binary page numbers
- 80-column horizontal squeeze
- deterministic DRAM-style speckle

Each additional rabbit-hole selection adds another transformation to the active chain (up to 10 active mutators). After reaching mutation depth 4, `J` commits the current experimental chain and opens the file selector. The selected transformations are then actually applied to every flattened output page.

If original signed component PDFs are embedded, those attachments remain unchanged; only the newly flattened visible pages receive the experimental transformations.

## Keyboard controls after the file gate opens

- `1` — select another PDF Portfolio
- `2` or `Enter` — convert
- `O` — cycle document order
- `Q` — cycle raster quality
- `A` — toggle embedding original signed PDFs
- `D` — save finished PDF
- `N` — new job
- `Esc` — clear current job

## GitHub Pages

Replace `index.html`, `styles.css`, and `app.js` in the repository root, commit, wait for Pages to redeploy, and force-refresh with `Ctrl+F5`.

The application remains browser-local; uploaded PDFs are processed on the user's computer and are not sent to a server by this site.
