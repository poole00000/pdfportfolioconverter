import * as pdfjsLib from 'https://cdn.jsdelivr.net/npm/pdfjs-dist@6.2.108/build/pdf.mjs';

// pdf-lib is loaded as its official browser UMD build from index.html.
// Using the UMD build avoids a Chrome/module minification issue seen with the CDN ESM bundle.
const { PDFDocument } = window.PDFLib || {};
if (!PDFDocument) {
  throw new Error('PDF library did not load. Refresh the page and try again.');
}

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@6.2.108/build/pdf.worker.mjs';

const $ = (id) => document.getElementById(id);
const fileInput = $('fileInput');
const dropZone = $('dropZone');
const chooseButton = $('chooseButton');
const fileMeta = $('fileMeta');
const reviewCard = $('reviewCard');
const stats = $('stats');
const attachmentList = $('attachmentList');
const fileCountLabel = $('fileCountLabel');
const sortMode = $('sortMode');
const qualityMode = $('qualityMode');
const attachOriginals = $('attachOriginals');
const convertButton = $('convertButton');
const progressCard = $('progressCard');
const progressTitle = $('progressTitle');
const percentLabel = $('percentLabel');
const progressBar = $('progressBar');
const progressDetail = $('progressDetail');
const log = $('log');
const successCard = $('successCard');
const successSummary = $('successSummary');
const downloadButton = $('downloadButton');
const errorCard = $('errorCard');
const errorText = $('errorText');

let sourceFile = null;
let sourcePdf = null;
let detectedAttachments = [];
let outputUrl = null;
let attachmentOrderCounter = 0;

chooseButton.addEventListener('click', (event) => {
  event.stopPropagation();
  fileInput.click();
});
dropZone.addEventListener('click', () => fileInput.click());
dropZone.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    fileInput.click();
  }
});
fileInput.addEventListener('change', () => {
  if (fileInput.files?.[0]) loadPortfolio(fileInput.files[0]);
});

['dragenter', 'dragover'].forEach((name) => {
  dropZone.addEventListener(name, (event) => {
    event.preventDefault();
    dropZone.classList.add('dragover');
  });
});
['dragleave', 'drop'].forEach((name) => {
  dropZone.addEventListener(name, (event) => {
    event.preventDefault();
    dropZone.classList.remove('dragover');
  });
});
dropZone.addEventListener('drop', (event) => {
  const file = [...event.dataTransfer.files].find((f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'));
  if (file) loadPortfolio(file);
});

sortMode.addEventListener('change', renderAttachmentList);
$('resetButton').addEventListener('click', resetAll);
$('convertAnotherButton').addEventListener('click', resetAll);
$('errorResetButton').addEventListener('click', resetAll);
convertButton.addEventListener('click', convertPortfolio);

async function loadPortfolio(file) {
  clearError();
  successCard.classList.add('hidden');
  reviewCard.classList.add('hidden');
  progressCard.classList.remove('hidden');
  setProgress(2, 'Opening portfolio…', `Reading ${file.name}`);
  clearLog();

  try {
    sourceFile = file;
    const bytes = new Uint8Array(await file.arrayBuffer());
    sourcePdf = await pdfjsLib.getDocument({ data: bytes, enableScripting: false }).promise;
    addLog(`Opened ${file.name} (${formatBytes(file.size)}).`);

    const raw = await sourcePdf.getAttachments();
    const entries = normalizeAttachmentEntries(raw);
    if (!entries.length) {
      throw new Error('No embedded PDF files were found. Make sure you selected the Adobe PDF Portfolio itself, not a normal single PDF.');
    }

    attachmentOrderCounter = 0;
    const pdfItems = [];
    for (const [key, attachment] of entries) {
      const filename = attachment?.filename || attachment?.name || key || `attachment-${pdfItems.length + 1}.pdf`;
      if (!filename.toLowerCase().endsWith('.pdf')) continue;
      pdfItems.push({
        key,
        filename,
        attachment,
        originalIndex: attachmentOrderCounter++,
      });
    }

    if (!pdfItems.length) throw new Error('Attachments were found, but none of them were PDF files.');
    detectedAttachments = pdfItems;

    fileMeta.textContent = `${file.name} • ${formatBytes(file.size)}`;
    fileMeta.classList.remove('hidden');
    stats.innerHTML = `
      <div class="stat"><strong>${pdfItems.length}</strong><span>embedded PDFs</span></div>
      <div class="stat"><strong>${formatBytes(file.size)}</strong><span>portfolio size</span></div>
      <div class="stat"><strong>Local</strong><span>no server upload</span></div>`;
    fileCountLabel.textContent = `(${pdfItems.length})`;
    renderAttachmentList();
    progressCard.classList.add('hidden');
    reviewCard.classList.remove('hidden');
    addLog(`Detected ${pdfItems.length} PDF attachments.`);
  } catch (error) {
    showError(error);
  }
}

function normalizeAttachmentEntries(raw) {
  if (!raw) return [];
  if (raw instanceof Map) return [...raw.entries()];
  return Object.entries(raw);
}

function orderedAttachments() {
  const items = [...detectedAttachments];
  if (sortMode.value === 'portfolio') return items.sort((a, b) => a.originalIndex - b.originalIndex);
  if (sortMode.value === 'name') return items.sort((a, b) => naturalCompare(a.filename, b.filename));
  return items.sort(compareOpsSpecFiles);
}

function renderAttachmentList() {
  const items = orderedAttachments();
  attachmentList.innerHTML = '';
  for (const item of items) {
    const li = document.createElement('li');
    li.textContent = item.filename;
    attachmentList.appendChild(li);
  }
}

function compareOpsSpecFiles(a, b) {
  const ka = opsSpecSortKey(a.filename);
  const kb = opsSpecSortKey(b.filename);
  for (let i = 0; i < Math.max(ka.length, kb.length); i++) {
    const av = ka[i] ?? '';
    const bv = kb[i] ?? '';
    if (typeof av === 'number' && typeof bv === 'number' && av !== bv) return av - bv;
    if (String(av) !== String(bv)) return naturalCompare(String(av), String(bv));
  }
  return naturalCompare(a.filename, b.filename);
}

function opsSpecSortKey(filename) {
  const upper = filename.toUpperCase();
  const toc = upper.match(/(?:^|[_\s-])TOC[_\s-]*([A-E])(?:[_\s.-]|$)/);
  if (toc) return [0, partRank(toc[1]), 0, upper];

  const para = upper.match(/(?:^|[_\s-])([A-E])(\d{3})(?:[_\s.-]|$)/);
  if (para) return [1, partRank(para[1]), Number(para[2]), upper];

  return [2, 99, 9999, upper];
}

function partRank(letter) {
  return { A: 0, B: 1, C: 2, D: 3, E: 4 }[letter] ?? 9;
}

function naturalCompare(a, b) {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}

async function getAttachmentBytes(item) {
  const attachment = item.attachment || {};
  const direct = attachment.content ?? attachment.data ?? attachment.bytes;
  if (direct instanceof Uint8Array) return direct;
  if (direct instanceof ArrayBuffer) return new Uint8Array(direct);
  if (ArrayBuffer.isView(direct)) return new Uint8Array(direct.buffer, direct.byteOffset, direct.byteLength);

  const id = attachment.id ?? item.key;
  if (sourcePdf?.getAttachmentContent && id != null) {
    const fetched = await sourcePdf.getAttachmentContent(String(id));
    const content = fetched?.content ?? fetched?.data ?? fetched;
    if (content instanceof Uint8Array) return content;
    if (content instanceof ArrayBuffer) return new Uint8Array(content);
    if (ArrayBuffer.isView(content)) return new Uint8Array(content.buffer, content.byteOffset, content.byteLength);
  }

  throw new Error(`Could not read the embedded bytes for ${item.filename}.`);
}

async function convertPortfolio() {
  if (!sourcePdf || !detectedAttachments.length) return;
  convertButton.disabled = true;
  reviewCard.classList.add('hidden');
  successCard.classList.add('hidden');
  progressCard.classList.remove('hidden');
  clearError();
  clearLog();

  try {
    const items = orderedAttachments();
    const dpi = Number(qualityMode.value || 144);
    const renderScale = dpi / 72;
    const output = await PDFDocument.create();
    output.setTitle('Reliant Air Charter Operations Specifications');
    output.setSubject('Flattened single-document export from signed FAA OpsSpecs PDF Portfolio');
    output.setCreator('RAC OpsSpecs Portfolio Converter');
    output.setProducer('pdf-lib / PDF.js');
    output.setCreationDate(new Date());
    output.setModificationDate(new Date());

    let totalPages = 0;
    let processedPages = 0;
    const prepared = [];

    setProgress(2, 'Reading embedded PDFs…', 'Counting pages before conversion.');

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      setProgress(2 + Math.round((i / items.length) * 8), 'Reading embedded PDFs…', `${i + 1} of ${items.length}: ${item.filename}`);
      const bytes = await getAttachmentBytes(item);
      const doc = await pdfjsLib.getDocument({ data: bytes.slice(), enableScripting: false }).promise;
      const numPages = doc.numPages;
      totalPages += numPages;
      prepared.push({ item, bytes, numPages });
      await doc.destroy();
      addLog(`${item.filename}: ${numPages} page${numPages === 1 ? '' : 's'}.`);
      await yieldToBrowser();
    }

    addLog(`Total output pages: ${totalPages}.`);

    for (let fileIndex = 0; fileIndex < prepared.length; fileIndex++) {
      const { item, bytes, numPages } = prepared[fileIndex];
      const component = await pdfjsLib.getDocument({ data: bytes.slice(), enableScripting: false }).promise;
      addLog(`Rendering ${item.filename}…`);

      for (let pageNumber = 1; pageNumber <= numPages; pageNumber++) {
        const page = await component.getPage(pageNumber);
        const baseViewport = page.getViewport({ scale: 1 });
        const renderViewport = page.getViewport({ scale: renderScale });

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.ceil(renderViewport.width));
        canvas.height = Math.max(1, Math.ceil(renderViewport.height));
        const ctx = canvas.getContext('2d', { alpha: false });
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();

        const renderTask = page.render({
          canvasContext: ctx,
          viewport: renderViewport,
          annotationMode: pdfjsLib.AnnotationMode?.ENABLE ?? 1,
          intent: 'display',
        });
        await renderTask.promise;

        const imageBytes = await canvasToBytes(canvas, 'image/jpeg', .94);
        const image = await output.embedJpg(imageBytes);
        const outPage = output.addPage([baseViewport.width, baseViewport.height]);
        outPage.drawImage(image, {
          x: 0,
          y: 0,
          width: baseViewport.width,
          height: baseViewport.height,
        });

        canvas.width = 1;
        canvas.height = 1;
        page.cleanup();

        processedPages += 1;
        const percent = 10 + Math.round((processedPages / Math.max(1, totalPages)) * 76);
        setProgress(percent, 'Flattening signed pages…', `${processedPages} of ${totalPages} pages • ${item.filename} • page ${pageNumber}/${numPages}`);
        if (processedPages % 2 === 0) await yieldToBrowser();
      }
      await component.destroy();
    }

    if (attachOriginals.checked) {
      setProgress(88, 'Embedding original signed PDFs…', 'Preserving the exact component files for independent signature verification.');
      for (let i = 0; i < prepared.length; i++) {
        const { item, bytes } = prepared[i];
        await output.attach(bytes, item.filename, {
          mimeType: 'application/pdf',
          description: 'Original signed OpsSpec component preserved from the source PDF Portfolio.',
        });
        setProgress(88 + Math.round(((i + 1) / prepared.length) * 6), 'Embedding original signed PDFs…', `${i + 1} of ${prepared.length}: ${item.filename}`);
        if (i % 5 === 0) await yieldToBrowser();
      }
    }

    setProgress(96, 'Building final PDF…', 'Writing the single-document file.');
    const saved = await output.save({ useObjectStreams: true, addDefaultPage: false, objectsPerTick: 20 });
    const blob = new Blob([saved], { type: 'application/pdf' });

    if (outputUrl) URL.revokeObjectURL(outputUrl);
    outputUrl = URL.createObjectURL(blob);
    downloadButton.href = outputUrl;
    const baseName = sourceFile.name.replace(/\.pdf$/i, '').replace(/\s+/g, '_');
    downloadButton.download = `${baseName}_Single_Document.pdf`;

    setProgress(100, 'Complete', `Created ${totalPages} pages.`);
    successSummary.textContent = `${totalPages} pages from ${prepared.length} embedded PDFs • ${formatBytes(blob.size)}${attachOriginals.checked ? ' • original signed PDFs embedded' : ''}`;
    progressCard.classList.add('hidden');
    successCard.classList.remove('hidden');
    addLog(`Finished: ${formatBytes(blob.size)}.`);
  } catch (error) {
    showError(error);
  } finally {
    convertButton.disabled = false;
  }
}

function canvasToBytes(canvas, mimeType, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(async (blob) => {
      if (!blob) return reject(new Error('The browser could not encode a rendered page.'));
      resolve(new Uint8Array(await blob.arrayBuffer()));
    }, mimeType, quality);
  });
}

function setProgress(percent, title, detail) {
  const value = Math.max(0, Math.min(100, Math.round(percent)));
  percentLabel.textContent = `${value}%`;
  progressBar.style.width = `${value}%`;
  progressTitle.textContent = title;
  progressDetail.textContent = detail;
}

function addLog(message) {
  const row = document.createElement('div');
  row.textContent = message;
  log.appendChild(row);
  log.scrollTop = log.scrollHeight;
}

function clearLog() { log.innerHTML = ''; }

function showError(error) {
  console.error(error);
  progressCard.classList.add('hidden');
  reviewCard.classList.add('hidden');
  errorText.textContent = error?.message || String(error);
  errorCard.classList.remove('hidden');
}

function clearError() { errorCard.classList.add('hidden'); }

async function resetAll() {
  if (outputUrl) {
    URL.revokeObjectURL(outputUrl);
    outputUrl = null;
  }
  if (sourcePdf) {
    try { await sourcePdf.destroy(); } catch (_) { /* no-op */ }
  }
  sourceFile = null;
  sourcePdf = null;
  detectedAttachments = [];
  fileInput.value = '';
  fileMeta.textContent = '';
  fileMeta.classList.add('hidden');
  reviewCard.classList.add('hidden');
  progressCard.classList.add('hidden');
  successCard.classList.add('hidden');
  errorCard.classList.add('hidden');
  attachmentList.innerHTML = '';
  clearLog();
  setProgress(0, 'Preparing conversion…', 'Reading portfolio attachments.');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes)) return '';
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let value = bytes / 1024;
  let unit = units[0];
  for (let i = 1; i < units.length && value >= 1024; i++) {
    value /= 1024;
    unit = units[i];
  }
  return `${value >= 100 ? value.toFixed(0) : value >= 10 ? value.toFixed(1) : value.toFixed(2)} ${unit}`;
}

function yieldToBrowser() {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}
