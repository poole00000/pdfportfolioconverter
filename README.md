# RAC OpsSpecs Portfolio Converter

A static GitHub Pages website that converts an Adobe PDF Portfolio containing signed FAA Operations Specifications into one normal PDF.

## What it does

- Extracts the embedded PDF files from an Adobe PDF Portfolio in the browser.
- Automatically sorts RAC OpsSpecs as TOC A-E, then Parts A-E numerically.
- Renders every page, including visible digital-signature appearances, into a flattened single PDF.
- Optionally embeds the exact original signed component PDFs in the final PDF's **Attachments** panel so their original cryptographic signatures remain independently verifiable.
- Does all processing locally in the user's browser. No OpsSpecs are uploaded to a server.

## Important signature note

A digital signature validates the bytes of the PDF that was originally signed. Pages copied into a different combined PDF cannot retain the original signature's cryptographic validation on the new combined pages.

This site handles that in two ways:

1. It **flattens the visible signed appearance** into the combined pages so signatures remain visible.
2. By default it **attaches the exact original signed component PDFs** to the new PDF so those originals can still be opened and verified in Adobe Acrobat.

## Deploy on GitHub Pages

1. Create a new GitHub repository.
2. Upload the contents of this folder to the repository root.
3. Open **Settings → Pages** in the repository.
4. Under **Build and deployment**, choose **GitHub Actions**.
5. Push/commit the files. The included workflow deploys the site automatically.

The site will then be available at your GitHub Pages URL.

## Browser support

Use a current desktop version of Chrome, Edge, or Firefox. Large portfolios can require substantial RAM because every page is rendered locally.

## Libraries

The website loads these browser libraries from jsDelivr:

- Mozilla PDF.js 6.2.108
- pdf-lib 1.17.1

No build step is required.
