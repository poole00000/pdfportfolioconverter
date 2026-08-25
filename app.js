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
let sourcePdfTask = null;
let detectedAttachments = [];
let outputUrl = null;
let attachmentOrderCounter = 0;

const sortDisplay = $('sortDisplay');
const qualityDisplay = $('qualityDisplay');
const attachDisplay = $('attachDisplay');
const mutationDisplay = $('mutationDisplay');
const commandStatus = $('commandStatus');
const promptPrefix = $('promptPrefix');
const commands = $('commands');
const mazeCard = $('mazeCard');
const mazeHeader = $('mazeHeader');
const mazeNotice = $('mazeNotice');
const mazeOptions = $('mazeOptions');
const trapCard = $('trapCard');
const trapBanner = $('trapBanner');
const trapPath = $('trapPath');
const trapDump = $('trapDump');
const trapOptions = $('trapOptions');
const hexLine = $('hexLine');
const regAX = $('regAX');
const regBX = $('regBX');
const regCX = $('regCX');
const regDX = $('regDX');
const regDS = $('regDS');
const regES = $('regES');
const regIP = $('regIP');
const regFL = $('regFL');

// -----------------------------------------------------------------------------
// RAC MCR-286 DOCUMENT TRANSFORMATION DISPATCH MATRIX
//
// CANONICAL SERVICE PATH:
//   0 6 1 2 1 9 9 4 0 6 7 8 4
//
// Each canonical choice corresponds to a real stage of the portfolio-to-single-
// PDF conversion. Every other choice enters the EXPERIMENTAL DOCUMENT BRANCH.
// In that branch the selected commands become real visual mutations that are
// applied to every rendered PDF page. The canonical return vector is discarded;
// reload the page if you want to get back to the normal pipeline.
// -----------------------------------------------------------------------------

// XOR-obscured canonical service vector. Decodes to: 0612199406784
const ACCESS_VECTOR = [53,51,52,55,52,60,60,49,53,51,50,61,49]
  .map(v => String.fromCharCode(v ^ 5)).join('');

const SELECTORS = '0123456789ABCDEFGHIJ'.split('');
let mazeIndex = 0;
let trapped = false;
let trapDepth = 0;
let trapHistory = [];
let maintenanceUnlocked = false;
let experimentalMode = false;
let experimentalTransforms = [];
const MAX_ACTIVE_TRANSFORMS = 10;
const MIN_TRAP_DEPTH_FOR_COMMIT = 4;

const CANONICAL_STAGES = [
  { key:'0', title:'PORTFOLIO CONTAINER INTERROGATION',
    notice:'ESTABLISH THE INPUT OBJECT MODEL BEFORE ANY PAGE DATA IS TOUCHED.',
    canonical:'MOUNT ACROBAT PORTFOLIO CONTAINER / READ EMBEDDED FILE TREE' },
  { key:'6', title:'EMBEDDED OBJECT ENUMERATION',
    notice:'FILTER THE PORTFOLIO NAME TREE DOWN TO PDF COMPONENT STREAMS.',
    canonical:'ENUMERATE EMBEDDED PDF COMPONENTS / IGNORE NON-PDF PAYLOADS' },
  { key:'1', title:'OPSPEC SEQUENCE RESOLUTION',
    notice:'RECONSTRUCT HUMAN READING ORDER FROM TOC AND PARAGRAPH FILENAMES.',
    canonical:'SORT TOC A-E THEN OPSPEC PART/PARAGRAPH IN NUMERIC ORDER' },
  { key:'2', title:'ANNOTATION APPEARANCE CAPTURE',
    notice:'PRESERVE WHAT THE SIGNED PAGE VISUALLY LOOKS LIKE BEFORE REASSEMBLY.',
    canonical:'RENDER ANNOTATION/SIGNATURE APPEARANCE STREAMS INTO PAGE RASTER' },
  { key:'1', title:'PAGE RASTER CLOCK',
    notice:'SELECT A CONSERVATIVE RENDER SCALE FOR VISIBLE SIGNATURE FIDELITY.',
    canonical:'RASTERIZE EACH COMPONENT PAGE AT THE STANDARD 144-DPI CLOCK' },
  { key:'9', title:'PAGE BOX NORMALIZATION',
    notice:'KEEP THE ORIGINAL PHYSICAL PAGE GEOMETRY WHILE REPLACING PAGE CONTENT.',
    canonical:'PRESERVE SOURCE MEDIA/CROP DIMENSIONS FOR EVERY OUTPUT PAGE' },
  { key:'9', title:'VISUAL FLATTENING PASS',
    notice:'COLLAPSE PAGE GRAPHICS, TEXT, AND VISIBLE SIGNATURE APPEARANCES TO ONE PLANE.',
    canonical:'FLATTEN EACH RENDERED PAGE TO A SINGLE IMMUTABLE IMAGE LAYER' },
  { key:'4', title:'SEQUENTIAL DOCUMENT ASSEMBLY',
    notice:'ALLOCATE A NEW NORMAL PDF AND APPEND PAGES IN RESOLVED ORDER.',
    canonical:'REBUILD ALL COMPONENT PAGES INTO ONE CONTIGUOUS PDF DOCUMENT' },
  { key:'0', title:'SOURCE-SIGNATURE RETENTION',
    notice:'THE NEW PAGE IMAGES ARE VISUAL COPIES; PRESERVE ORIGINAL SIGNED COMPONENTS TOO.',
    canonical:'EMBED ORIGINAL SIGNED COMPONENT PDFS UNCHANGED AS ATTACHMENTS' },
  { key:'6', title:'COMPONENT IDENTITY MAPPING',
    notice:'PRESERVE ORIGINAL COMPONENT NAMES SO THE ATTACHMENT SET REMAINS AUDITABLE.',
    canonical:'RETAIN SOURCE FILENAMES AND COMPONENT IDENTIFIERS IN OUTPUT' },
  { key:'7', title:'OUTPUT CATALOG SYNTHESIS',
    notice:'WRITE A CLEAN PDF CATALOG, INFO DICTIONARY, AND PRODUCER METADATA.',
    canonical:'WRITE OUTPUT CATALOG / TITLE / CREATOR / DOCUMENT METADATA' },
  { key:'8', title:'INTEGRITY RECONCILIATION',
    notice:'COMPARE EXPECTED COMPONENT/PAGE COUNTS BEFORE THE FILE IS COMMITTED.',
    canonical:'VERIFY COMPONENT COUNT, PAGE COUNT, AND FINAL OUTPUT BUFFER' },
  { key:'4', title:'LOCAL MEDIA ACQUISITION',
    notice:'CANONICAL PIPELINE IS ARMED. EXPOSE THE BROWSER FILE CHANNEL.',
    canonical:'OPEN LOCAL PDF PORTFOLIO SELECTOR / BEGIN CONVERSION SESSION' }
];

const TRANSFORMS = [
  { id:'grayscale', short:'MONO-LUMA', label:'COLOR PIPE: COLLAPSE RGB THROUGH REC.601 LUMA MATRIX', detail:'CONVERT EVERY PAGE TO GRAYSCALE BEFORE EMBEDDING' },
  { id:'invert', short:'NEGATIVE', label:'PIXEL ALU: XOR DISPLAY LUMA AGAINST FULL-SCALE WHITE', detail:'INVERT ALL PAGE COLORS LIKE A PHOTOGRAPHIC NEGATIVE' },
  { id:'green', short:'P1-PHOSPHOR', label:'PHOSPHOR LUT: REMAP PAGE LUMA TO P1 GREEN CRT RESPONSE', detail:'TINT THE ENTIRE DOCUMENT GREEN/BLACK' },
  { id:'amber', short:'AMBER-TERM', label:'PHOSPHOR LUT: REMAP PAGE LUMA TO AMBER TERMINAL RESPONSE', detail:'TINT THE ENTIRE DOCUMENT AMBER/BLACK' },
  { id:'bilevel', short:'1BIT-HARD', label:'QUANTIZER: COLLAPSE 8-BIT LUMA TO 1-BIT HARD THRESHOLD', detail:'TURN EACH PAGE INTO PURE BLACK AND WHITE' },
  { id:'dither', short:'BAYER-4X4', label:'HALFTONE CORE: APPLY 4X4 ORDERED BAYER ERROR MASK', detail:'SIMULATE A 1980S 1-BIT PRINTER/DISPLAY HALFTONE' },
  { id:'scanlines', short:'SCANLINE', label:'RASTER TIMING: INSERT ALTERNATE HORIZONTAL CRT SCAN LINES', detail:'OVERLAY FINE DARK SCANLINES ACROSS EVERY PAGE' },
  { id:'mirrorx', short:'X-MIRROR', label:'PAGE CTM: NEGATE X AXIS ABOUT MEDIA-BOX CENTERLINE', detail:'MIRROR EVERY PAGE LEFT-TO-RIGHT' },
  { id:'mirrory', short:'Y-MIRROR', label:'PAGE CTM: NEGATE Y AXIS ABOUT MEDIA-BOX CENTERLINE', detail:'FLIP EVERY PAGE TOP-TO-BOTTOM' },
  { id:'rotateodd', short:'ODD-180', label:'PAGE CTM: ROTATE ODD OUTPUT PAGES BY 180 DEGREES', detail:'TURN EVERY OTHER PAGE UPSIDE DOWN' },
  { id:'skew', short:'SKEW-1.5', label:'AFFINE CORE: APPLY +1.5 DEGREE SHEAR TO PAGE DEVICE MATRIX', detail:'SLIGHTLY SKEW EACH PAGE LIKE A BAD SCAN' },
  { id:'shrinkframe', short:'MICROFRAME', label:'MEDIA BOX: SHRINK PAGE IMAGE TO 84 PERCENT WITH REGISTRATION FRAME', detail:'PUT EACH PAGE INSIDE A SMALLER FRAMED MICROFICHE-LIKE WINDOW' },
  { id:'crop3', short:'OVERSCAN', label:'CROP BOX: DISCARD 3.125 PERCENT EDGE BAND THEN RE-EXPAND', detail:'CROP THE OUTER EDGES AND STRETCH THE REMAINDER BACK TO SIZE' },
  { id:'ghost', short:'GHOST-AP', label:'COMPOSITOR: REPLAY PAGE RASTER AT +9,+7 PIXELS / ALPHA 0.18', detail:'ADD A FAINT OFFSET GHOST IMAGE BEHIND THE PAGE' },
  { id:'register', short:'PRESS-MARK', label:'PREPRESS: SYNTHESIZE CORNER REGISTRATION/CROP TARGETS', detail:'ADD OLD-SCHOOL PRINT REGISTRATION MARKS AROUND THE PAGE' },
  { id:'hexfooter', short:'HEX-FOOT', label:'TRAILER BUS: STAMP PAGE CRC/FILE HASH INTO HEX FOOTER', detail:'ADD A TECHNICAL HEX CHECKSUM STRIP TO EACH PAGE' },
  { id:'binarypage', short:'BIN-PAGE', label:'INDEX ENCODER: WRITE OUTPUT PAGE NUMBER AS 16-BIT BINARY WORD', detail:'STAMP EACH PAGE NUMBER IN BINARY' },
  { id:'letterbox', short:'80COL-FIT', label:'DEVICE FIT: COMPRESS PAGE X SCALE TO 80-COLUMN TERMINAL APERTURE', detail:'SQUEEZE THE PAGE HORIZONTALLY WITH BLACK SIDE BARS' },
  { id:'noise', short:'DRAM-SPECK', label:'MEMORY BUS: INJECT DETERMINISTIC 4164-DRAM SPECKLE INTO LUMA', detail:'ADD LIGHT MONOCHROME DIGITAL SPECKLE TO THE PAGE' }
];

fileInput.addEventListener('change', () => {
  if (fileInput.files?.[0]) loadPortfolio(fileInput.files[0]);
});

sortMode.addEventListener('change', () => {
  renderAttachmentList();
  refreshTerminalOptions();
});
qualityMode.addEventListener('change', refreshTerminalOptions);
attachOriginals.addEventListener('change', refreshTerminalOptions);

function setCommandStatus(text) {
  if (commandStatus) commandStatus.textContent = text;
}

function refreshTerminalOptions() {
  if (sortDisplay) {
    sortDisplay.textContent = {
      smart: 'OPSPECS SMART ORDER',
      portfolio: 'PORTFOLIO ATTACHMENT ORDER',
      name: 'FILENAME A-Z',
    }[sortMode.value] || sortMode.value;
  }
  if (qualityDisplay) {
    qualityDisplay.textContent = {
      '144': '144 DPI / STANDARD',
      '180': '180 DPI / HIGH',
      '216': '216 DPI / VERY HIGH',
    }[qualityMode.value] || `${qualityMode.value} DPI`;
  }
  if (attachDisplay) attachDisplay.textContent = attachOriginals.checked ? 'YES' : 'NO';
  if (mutationDisplay) {
    if (experimentalMode) {
      const names = experimentalTransforms.map(id => TRANSFORMS.find(t => t.id === id)?.short || id);
      mutationDisplay.textContent = names.length ? names.join(' -> ') : 'EXPERIMENTAL / NO MUTATORS';
    } else {
      mutationDisplay.textContent = 'CANONICAL / NO VISUAL MUTATIONS';
    }
  }
}

function cycleSelect(select, values) {
  const i = Math.max(0, values.indexOf(select.value));
  select.value = values[(i + 1) % values.length];
  select.dispatchEvent(new Event('change'));
}

function hex4(n) { return (n & 0xFFFF).toString(16).toUpperCase().padStart(4, '0'); }
function hash16(seed) {
  let h = 0xA55A;
  for (const ch of String(seed)) h = ((h << 5) ^ (h >>> 3) ^ ch.charCodeAt(0) ^ 0x9E37) & 0xFFFF;
  return h;
}
function transformFor(stage, slot) {
  return TRANSFORMS[(stage * 7 + slot * 3) % TRANSFORMS.length];
}

function addrFor(stage, slot, trap = false) {
  const h = hash16(`${trap ? 'D' : 'C'}:${stage}:${slot}`);
  return `${hex4(0x0800 + ((h >>> 4) & 0x7F0))}:${hex4((h * 13 + slot * 0x31) & 0xFFFF)}`;
}

function renderCanonicalTwenty(target, stage) {
  target.innerHTML = '';
  const canonical = CANONICAL_STAGES[stage];
  const expected = canonical.key;
  SELECTORS.forEach((key, slot) => {
    const row = document.createElement('div');
    const isCanonical = key === expected;
    const transform = transformFor(stage, slot);
    row.className = `maze-option ${isCanonical ? 'canonical-vector' : 'mutation-vector'}`;
    row.innerHTML = isCanonical
      ? `<span class="key">${key}</span><span class="addr">${addrFor(stage, slot, false)}</span><span class="mnemonic">${canonical.canonical}</span>`
      : `<span class="key">${key}</span><span class="addr">${addrFor(stage, slot, false)}</span><span class="mnemonic">${transform.label}</span>`;
    target.appendChild(row);
  });
}

function trapChoiceFor(key, depth) {
  const slot = SELECTORS.indexOf(key);
  if (key === 'J' && depth >= MIN_TRAP_DEPTH_FOR_COMMIT) {
    return { commit:true, label:'COMMIT MUTATION CHAIN / MOUNT PORTFOLIO INTO EXPERIMENTAL PIPELINE' };
  }
  const transform = TRANSFORMS[(depth * 5 + slot * 11 + trapHistory.length * 3) % TRANSFORMS.length];
  return { commit:false, transform };
}

function renderTrapTwenty(target) {
  target.innerHTML = '';
  SELECTORS.forEach((key, slot) => {
    const choice = trapChoiceFor(key, trapDepth);
    const row = document.createElement('div');
    row.className = `maze-option ${choice.commit ? 'commit-vector' : 'mutation-vector'}`;
    row.innerHTML = choice.commit
      ? `<span class="key">${key}</span><span class="addr">${addrFor(trapDepth, slot, true)}</span><span class="mnemonic">${choice.label}</span>`
      : `<span class="key">${key}</span><span class="addr">${addrFor(trapDepth, slot, true)}</span><span class="mnemonic">${choice.transform.label}</span>`;
    target.appendChild(row);
  });
}

function updateRegisters(seed) {
  const h = hash16(seed);
  regAX.textContent = hex4(h * 3 + 0x101);
  regBX.textContent = hex4(h ^ 0xBEEF);
  regCX.textContent = hex4((h << 1) ^ 0x3A7C);
  regDX.textContent = hex4((h * 17) ^ 0x00E9);
  regDS.textContent = hex4(0x0800 + (h & 0x07F0));
  regES.textContent = hex4(0xA000 ^ (h & 0x0FF0));
  regIP.textContent = hex4(0x0100 + ((h * 5) & 0x7EFF));
  regFL.textContent = hex4(0x0202 | (h & 0x00D5));
  const bytes = Array.from({length:16}, (_,i) => ((h >>> (i % 8)) + i * 29 + mazeIndex * 7) & 0xFF);
  hexLine.textContent = `${regDS.textContent}:${regIP.textContent}  ${bytes.map(v => v.toString(16).toUpperCase().padStart(2,'0')).join(' ')}`;
}

function renderMaze() {
  const stage = CANONICAL_STAGES[mazeIndex];
  const stateHash = hash16(`maze:${mazeIndex}:${ACCESS_VECTOR.slice(0, mazeIndex)}`);
  mazeHeader.textContent = `STAGE=${String(mazeIndex + 1).padStart(2,'0')}/${CANONICAL_STAGES.length}  ${stage.title}  STATE=${hex4(stateHash)}  CPL=0`;
  mazeNotice.textContent = `${stage.notice}  SELECT ONE OF 20 IMPLEMENTATIONS.`;
  promptPrefix.textContent = `DOC${String(mazeIndex).padStart(2,'0')}:${hex4(stateHash)}>`;
  setCommandStatus('AWAITING DOCUMENT-PIPELINE VECTOR');
  updateRegisters(`maze:${mazeIndex}:${stateHash}`);
  renderCanonicalTwenty(mazeOptions, mazeIndex);
}

function addExperimentalTransform(transform, source = '') {
  experimentalMode = true;
  if (experimentalTransforms.length < MAX_ACTIVE_TRANSFORMS) {
    experimentalTransforms.push(transform.id);
  }
  setCommandStatus(`MUTATION ${transform.short} ARMED${source ? ` / ${source}` : ''} / PIPELINE=${experimentalTransforms.length}`);
}

function enterTrap(key, stageIndex) {
  const slot = SELECTORS.indexOf(key);
  const transform = transformFor(stageIndex, slot);
  addExperimentalTransform(transform, `BRANCH ${key}`);
  trapped = true;
  trapDepth = 1;
  trapHistory = [key];
  mazeCard.classList.add('hidden');
  trapCard.classList.remove('hidden');
  renderTrap();
}

function memoryDump(seed) {
  const h = hash16(seed);
  const rows = [];
  const chain = experimentalTransforms.map(id => TRANSFORMS.find(t => t.id === id)?.short || id).join(' -> ') || 'NONE';
  rows.push(`ACTIVE PAGE MUTATION CHAIN: ${chain}`);
  rows.push(`CANONICAL RETURN VECTOR: NIL  |  MAX ACTIVE MUTATORS: ${MAX_ACTIVE_TRANSFORMS}`);
  for (let r = 0; r < 4; r++) {
    const seg = hex4(0x1000 + ((h + r * 0x123) & 0x6FF0));
    const off = hex4((h * (r + 3) + r * 0x71) & 0xFFF0);
    const bs = Array.from({length:16}, (_,i) => ((h + r * 37 + i * 19 + trapDepth * 13) ^ (i << (r % 3))) & 0xFF);
    const ascii = bs.map(v => (v >= 33 && v <= 126) ? String.fromCharCode(v) : '.').join('');
    rows.push(`${seg}:${off}  ${bs.map(v => v.toString(16).toUpperCase().padStart(2,'0')).join(' ')}  ${ascii}`);
  }
  return rows.join('\n');
}

function renderTrap() {
  const h = hash16(`${trapDepth}:${trapHistory.join('')}:${experimentalTransforms.join(',')}`);
  trapBanner.textContent = trapDepth === 1
    ? 'EXPERIMENTAL PAGE-TRANSFORM BRANCH LOCKED. CANONICAL RETURN VECTOR DISCARDED.'
    : `MUTATION SUBSYSTEM DEPTH ${String(trapDepth).padStart(3,'0')} / CANONICAL RETURN STILL NIL.`;
  trapPath.textContent = `PATH=${trapHistory.join('>')}  DEPTH=${trapDepth}  ACTIVE_MUTATORS=${experimentalTransforms.length}  RET=NIL`;
  trapDump.textContent = memoryDump(`trap:${h}`);
  promptPrefix.textContent = `XPDF${hex4(h)}>`;
  const commitHint = trapDepth >= MIN_TRAP_DEPTH_FOR_COMMIT
    ? 'J NOW COMMITS THE CURRENT MUTATION CHAIN AND OPENS THE FILE CHANNEL.'
    : `COMMIT VECTOR LOCKED UNTIL DESCENT ${MIN_TRAP_DEPTH_FOR_COMMIT}.`;
  setCommandStatus(`SELECT ANOTHER REAL PAGE MUTATION / ${commitHint}`);
  updateRegisters(`trap:${h}`);
  renderTrapTwenty(trapOptions);
}

async function descendTrap(key) {
  const choice = trapChoiceFor(key, trapDepth);
  trapHistory.push(key);
  if (trapHistory.length > 24) trapHistory = trapHistory.slice(-24);
  if (choice.commit) {
    await commitExperimentalGate();
    return;
  }
  addExperimentalTransform(choice.transform, `DEPTH ${trapDepth}`);
  trapDepth += 1;
  renderTrap();
}

async function commitExperimentalGate() {
  trapped = false;
  maintenanceUnlocked = true;
  experimentalMode = true;
  mazeCard.classList.add('hidden');
  trapCard.classList.add('hidden');
  $('inputCard').classList.remove('hidden');
  commands.classList.remove('hidden');
  promptPrefix.textContent = 'X:\\PDF>';
  refreshTerminalOptions();
  setCommandStatus(`EXPERIMENTAL PIPELINE COMMITTED / ${experimentalTransforms.length} MUTATOR(S) / INVOKING FILE SELECTOR`);
  fileInput.click();
}

async function unlockMaintenanceGate() {
  maintenanceUnlocked = true;
  experimentalMode = false;
  experimentalTransforms = [];
  mazeCard.classList.add('hidden');
  trapCard.classList.add('hidden');
  $('inputCard').classList.remove('hidden');
  commands.classList.remove('hidden');
  promptPrefix.textContent = 'A:\\RAC>';
  refreshTerminalOptions();
  setCommandStatus('CANONICAL MEDIA GATE OPEN / INVOKING DOCUMENT SELECTOR');
  // This call remains inside the key event that completed the service path,
  // so browsers treat it as a user-initiated file-selection request.
  fileInput.click();
}

async function selectNewPortfolio() {
  if (!maintenanceUnlocked) return;
  if (sourcePdf || sourceFile || detectedAttachments.length) await resetAll();
  $('inputCard').classList.remove('hidden');
  setCommandStatus('READING DISK DIRECTORY...');
  fileInput.click();
}

function triggerDownload() {
  if (!outputUrl || successCard.classList.contains('hidden')) {
    setCommandStatus('NO OUTPUT FILE AVAILABLE');
    return;
  }
  setCommandStatus('WRITING OUTPUT FILE TO DISK...');
  downloadButton.click();
  window.setTimeout(() => setCommandStatus('OUTPUT SAVED / WAITING FOR KEYBOARD INPUT'), 400);
}

window.addEventListener('keydown', async (event) => {
  // Preserve browser-level emergency controls such as Ctrl+R / Cmd+R.
  if (event.ctrlKey || event.altKey || event.metaKey) return;
  const key = event.key;
  const upper = key.toUpperCase();

  if (trapped) {
    event.preventDefault();
    if (key === 'Escape') {
      trapDepth += 2;
      trapHistory.push('NMI');
      setCommandStatus('ESC GENERATED NMI / CANONICAL RETURN REMAINS DESTROYED');
      renderTrap();
      return;
    }
    if (SELECTORS.includes(upper)) await descendTrap(upper);
    else setCommandStatus(`SCAN CODE ${key.length === 1 ? key.charCodeAt(0).toString(16).toUpperCase() : '??'} UNMAPPED / EXPERIMENTAL BRANCH REMAINS LOCKED`);
    return;
  }

  if (!maintenanceUnlocked) {
    if (!SELECTORS.includes(upper)) {
      if (key === 'Escape') {
        event.preventDefault();
        mazeNotice.textContent = 'ESCAPE VECTOR IS MASKED AT PRIVILEGE LEVEL 0.';
        setCommandStatus('INT 1BH MASKED / SELECT A DISPATCH VECTOR');
      }
      return;
    }
    event.preventDefault();
    const expected = ACCESS_VECTOR[mazeIndex];
    if (upper === expected) {
      mazeIndex += 1;
      if (mazeIndex >= ACCESS_VECTOR.length) {
        await unlockMaintenanceGate();
      } else {
        renderMaze();
      }
    } else {
      enterTrap(upper, mazeIndex);
    }
    return;
  }

  const lower = key.toLowerCase();
  if (key === 'Escape') {
    event.preventDefault();
    await resetAll();
    $('inputCard').classList.remove('hidden');
    setCommandStatus('JOB CLEARED / MEDIA GATE REMAINS OPEN');
    return;
  }
  if (lower === '1') {
    event.preventDefault();
    await selectNewPortfolio();
    return;
  }
  if (lower === '2' || key === 'Enter') {
    if (!reviewCard.classList.contains('hidden') && sourcePdf && detectedAttachments.length) {
      event.preventDefault();
      setCommandStatus('EXECUTING CONCENTRATION BATCH...');
      await convertPortfolio();
    }
    return;
  }
  if (lower === 'o' && !reviewCard.classList.contains('hidden')) {
    event.preventDefault();
    cycleSelect(sortMode, ['smart', 'portfolio', 'name']);
    setCommandStatus(`SORT VECTOR = ${sortDisplay.textContent}`);
    return;
  }
  if (lower === 'q' && !reviewCard.classList.contains('hidden')) {
    event.preventDefault();
    cycleSelect(qualityMode, ['144', '180', '216']);
    setCommandStatus(`RASTER CLOCK = ${qualityDisplay.textContent}`);
    return;
  }
  if (lower === 'a' && !reviewCard.classList.contains('hidden')) {
    event.preventDefault();
    attachOriginals.checked = !attachOriginals.checked;
    attachOriginals.dispatchEvent(new Event('change'));
    setCommandStatus(`SOURCE CHAIN = ${attachDisplay.textContent}`);
    return;
  }
  if (lower === 'd') {
    event.preventDefault();
    triggerDownload();
    return;
  }
  if (lower === 'n' && !successCard.classList.contains('hidden')) {
    event.preventDefault();
    await resetAll();
    $('inputCard').classList.remove('hidden');
    setCommandStatus('NEW JOB / MEDIA GATE OPEN');
  }
});

renderMaze();
refreshTerminalOptions();
// Disable wheel scrolling and pointer-generated interactions inside the application.
window.addEventListener('wheel', (event) => event.preventDefault(), { passive: false });
document.addEventListener('contextmenu', (event) => event.preventDefault());
document.addEventListener('pointerdown', (event) => event.preventDefault(), true);
document.addEventListener('dragstart', (event) => event.preventDefault(), true);

async function loadPortfolio(file) {
  clearError();
  successCard.classList.add('hidden');
  reviewCard.classList.add('hidden');
  progressCard.classList.remove('hidden');
  setProgress(2, 'OPENING PORTFOLIO...', `READING ${file.name}`);
  setCommandStatus('READING PORTFOLIO...');
  clearLog();

  try {
    sourceFile = file;
    const bytes = new Uint8Array(await file.arrayBuffer());
    sourcePdfTask = pdfjsLib.getDocument({ data: bytes, enableScripting: false });
    sourcePdf = await sourcePdfTask.promise;
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

    fileMeta.textContent = `INPUT FILE: ${file.name}  |  SIZE: ${formatBytes(file.size)}`;
    fileMeta.classList.remove('hidden');
    stats.innerHTML = `
      <div class="stat"><strong>${pdfItems.length}</strong><span>PDF FILES</span></div>
      <div class="stat"><strong>${formatBytes(file.size)}</strong><span>INPUT SIZE</span></div>
      <div class="stat"><strong>LOCAL</strong><span>PROCESSING MODE</span></div>`;
    fileCountLabel.textContent = `(${pdfItems.length})`;
    renderAttachmentList();
    progressCard.classList.add('hidden');
    reviewCard.classList.remove('hidden');
    addLog(`DETECTED ${pdfItems.length} PDF ATTACHMENTS.`);
    refreshTerminalOptions();
    if (experimentalMode && experimentalTransforms.length) {
      addLog(`EXPERIMENTAL PAGE MUTATIONS ARMED: ${experimentalTransforms.map(id => TRANSFORMS.find(t => t.id === id)?.short || id).join(' -> ')}.`);
    }
    setCommandStatus(experimentalMode ? 'PORTFOLIO READY / EXPERIMENTAL MUTATORS ARMED / PRESS 2 TO CONVERT' : 'PORTFOLIO READY / PRESS 2 TO CONVERT');
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
    output.setTitle(experimentalMode ? 'Reliant Air Charter Operations Specifications - Experimental Transform Export' : 'Reliant Air Charter Operations Specifications');
    output.setSubject(experimentalMode
      ? `Experimental flattened export. Active page mutations: ${experimentalTransforms.join(', ')}`
      : 'Flattened single-document export from signed FAA OpsSpecs PDF Portfolio');
    output.setCreator('RAC OpsSpecs Portfolio Converter / MCR-286 Document Lab');
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
      const task = pdfjsLib.getDocument({ data: bytes.slice(), enableScripting: false });
      const doc = await task.promise;
      const numPages = doc.numPages;
      totalPages += numPages;
      prepared.push({ item, bytes, numPages });
      await safeDestroyPdf(task, doc);
      addLog(`${item.filename}: ${numPages} page${numPages === 1 ? '' : 's'}.`);
      await yieldToBrowser();
    }

    addLog(`Total output pages: ${totalPages}.`);

    for (let fileIndex = 0; fileIndex < prepared.length; fileIndex++) {
      const { item, bytes, numPages } = prepared[fileIndex];
      const componentTask = pdfjsLib.getDocument({ data: bytes.slice(), enableScripting: false });
      const component = await componentTask.promise;
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

        if (experimentalMode && experimentalTransforms.length) {
          applyExperimentalTransforms(canvas, {
            outputPageNumber: processedPages + 1,
            componentPageNumber: pageNumber,
            filename: item.filename,
          });
        }

        const imageBytes = await canvasToBytes(canvas, 'image/jpeg', experimentalMode ? .92 : .94);
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
        setProgress(
          percent,
          experimentalMode ? 'Applying page mutations + flattening…' : 'Flattening signed pages…',
          `${processedPages} of ${totalPages} pages • ${item.filename} • page ${pageNumber}/${numPages}`
        );
        if (processedPages % 2 === 0) await yieldToBrowser();
      }
      await safeDestroyPdf(componentTask, component);
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

    setProgress(100, 'COMPLETE', `CREATED ${totalPages} PAGES.`);
    const mutationSuffix = experimentalMode && experimentalTransforms.length
      ? `  |  MUTATIONS: ${experimentalTransforms.map(id => TRANSFORMS.find(t => t.id === id)?.short || id).join('>')}`
      : '';
    successSummary.textContent = `${totalPages} PAGES FROM ${prepared.length} EMBEDDED PDF FILES  |  ${formatBytes(blob.size)}${attachOriginals.checked ? '  |  ORIGINAL SIGNED PDF FILES EMBEDDED' : ''}${mutationSuffix}`;
    progressCard.classList.add('hidden');
    successCard.classList.remove('hidden');
    addLog(`FINISHED: ${formatBytes(blob.size)}.`);
    setCommandStatus('JOB COMPLETE / PRESS D TO SAVE OUTPUT');
  } catch (error) {
    showError(error);
  } finally {
    convertButton.disabled = false;
  }
}


function snapshotCanvas(canvas) {
  const copy = document.createElement('canvas');
  copy.width = canvas.width;
  copy.height = canvas.height;
  copy.getContext('2d', { alpha: false }).drawImage(canvas, 0, 0);
  return copy;
}

function redrawWithFilter(canvas, filter) {
  const src = snapshotCanvas(canvas);
  const ctx = canvas.getContext('2d', { alpha: false });
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.filter = filter;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(src, 0, 0);
  ctx.restore();
  ctx.filter = 'none';
}

function mutatePixels(canvas, mutator) {
  const ctx = canvas.getContext('2d', { alpha: false, willReadFrequently: true });
  const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = image.data;
  for (let i = 0, p = 0; i < d.length; i += 4, p++) mutator(d, i, p, canvas.width, canvas.height);
  ctx.putImageData(image, 0, 0);
}

function pageLuma(r, g, b) {
  return Math.max(0, Math.min(255, Math.round(0.299 * r + 0.587 * g + 0.114 * b)));
}

function drawRegistrationMarks(canvas) {
  const ctx = canvas.getContext('2d', { alpha: false });
  const w = canvas.width, h = canvas.height;
  const m = Math.max(10, Math.round(Math.min(w, h) * 0.018));
  const len = Math.max(14, Math.round(m * 1.8));
  ctx.save();
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = Math.max(1, Math.round(Math.min(w, h) / 900));
  const corners = [[m,m,1,1],[w-m,m,-1,1],[m,h-m,1,-1],[w-m,h-m,-1,-1]];
  for (const [x,y,sx,sy] of corners) {
    ctx.beginPath();
    ctx.moveTo(x - sx * len, y); ctx.lineTo(x + sx * len, y);
    ctx.moveTo(x, y - sy * len); ctx.lineTo(x, y + sy * len);
    ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y, len * .35, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.restore();
}

function drawHexFooter(canvas, meta) {
  const ctx = canvas.getContext('2d', { alpha: false });
  const h = hash16(`${meta.filename}:${meta.outputPageNumber}:${experimentalTransforms.join(',')}`);
  const text = `MCR286 ${String(meta.outputPageNumber).padStart(4,'0')}  CRC=${hex4(h)}  OBJ=${hex4(h ^ 0xA55A)}  ${meta.filename}`;
  const band = Math.max(18, Math.round(canvas.height * .022));
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,.82)'; ctx.fillRect(0, canvas.height - band, canvas.width, band);
  ctx.fillStyle = '#ffffff'; ctx.font = `${Math.max(9, Math.round(band * .55))}px "Courier New", monospace`;
  ctx.textBaseline = 'middle'; ctx.fillText(text, Math.max(5, band * .3), canvas.height - band / 2, canvas.width - band);
  ctx.restore();
}

function drawBinaryPage(canvas, meta) {
  const ctx = canvas.getContext('2d', { alpha: false });
  const bits = (meta.outputPageNumber & 0xFFFF).toString(2).padStart(16, '0');
  const label = `PAGE ${bits}`;
  ctx.save();
  ctx.font = `${Math.max(11, Math.round(canvas.height * .012))}px "Courier New", monospace`;
  const metrics = ctx.measureText(label);
  const pad = Math.max(5, Math.round(canvas.height * .006));
  const x = canvas.width - metrics.width - pad * 2, y = pad;
  const boxH = Math.max(18, Math.round(canvas.height * .024));
  ctx.fillStyle = 'rgba(255,255,255,.88)'; ctx.fillRect(x, y, metrics.width + pad * 2, boxH);
  ctx.strokeStyle = '#000000'; ctx.strokeRect(x, y, metrics.width + pad * 2, boxH);
  ctx.fillStyle = '#000000'; ctx.textBaseline = 'middle'; ctx.fillText(label, x + pad, y + boxH / 2);
  ctx.restore();
}

function applyExperimentalTransforms(canvas, meta) {
  for (const id of experimentalTransforms) {
    const ctx = canvas.getContext('2d', { alpha: false });
    if (id === 'grayscale') {
      redrawWithFilter(canvas, 'grayscale(1)');
    } else if (id === 'invert') {
      redrawWithFilter(canvas, 'invert(1)');
    } else if (id === 'green') {
      mutatePixels(canvas, (d, i) => { const l = pageLuma(d[i], d[i+1], d[i+2]); d[i]=Math.round(l*.10); d[i+1]=Math.min(255,Math.round(l*1.05)); d[i+2]=Math.round(l*.14); });
    } else if (id === 'amber') {
      mutatePixels(canvas, (d, i) => { const l = pageLuma(d[i], d[i+1], d[i+2]); d[i]=Math.min(255,Math.round(l*1.05)); d[i+1]=Math.round(l*.72); d[i+2]=Math.round(l*.12); });
    } else if (id === 'bilevel') {
      mutatePixels(canvas, (d, i) => { const v = pageLuma(d[i], d[i+1], d[i+2]) >= 164 ? 255 : 0; d[i]=d[i+1]=d[i+2]=v; });
    } else if (id === 'dither') {
      const bayer = [0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5];
      mutatePixels(canvas, (d, i, p, w) => { const x=p%w, y=Math.floor(p/w); const t=(bayer[(y%4)*4+(x%4)]+.5)*16; const v=pageLuma(d[i],d[i+1],d[i+2])>t?255:0; d[i]=d[i+1]=d[i+2]=v; });
    } else if (id === 'scanlines') {
      ctx.save(); ctx.fillStyle='rgba(0,0,0,.11)'; const step=Math.max(3,Math.round(canvas.height/560)); for(let y=0;y<canvas.height;y+=step*2) ctx.fillRect(0,y,canvas.width,step); ctx.restore();
    } else if (id === 'mirrorx') {
      const src=snapshotCanvas(canvas); ctx.save(); ctx.setTransform(-1,0,0,1,canvas.width,0); ctx.drawImage(src,0,0); ctx.restore();
    } else if (id === 'mirrory') {
      const src=snapshotCanvas(canvas); ctx.save(); ctx.setTransform(1,0,0,-1,0,canvas.height); ctx.drawImage(src,0,0); ctx.restore();
    } else if (id === 'rotateodd') {
      if(meta.outputPageNumber%2===1){ const src=snapshotCanvas(canvas); ctx.save(); ctx.setTransform(-1,0,0,-1,canvas.width,canvas.height); ctx.drawImage(src,0,0); ctx.restore(); }
    } else if (id === 'skew') {
      const src=snapshotCanvas(canvas), sh=Math.tan(1.5*Math.PI/180); ctx.save(); ctx.setTransform(1,0,sh,1,-canvas.height*sh/2,0); ctx.fillStyle='#fff'; ctx.fillRect(-canvas.width,-canvas.height,canvas.width*3,canvas.height*3); ctx.drawImage(src,0,0); ctx.restore();
    } else if (id === 'shrinkframe') {
      const src=snapshotCanvas(canvas), px=Math.round(canvas.width*.08), py=Math.round(canvas.height*.08); ctx.save(); ctx.setTransform(1,0,0,1,0,0); ctx.fillStyle='#f2f2f2'; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.fillStyle='#fff'; ctx.fillRect(px,py,canvas.width-px*2,canvas.height-py*2); ctx.drawImage(src,px,py,canvas.width-px*2,canvas.height-py*2); ctx.strokeStyle='#000'; ctx.lineWidth=Math.max(2,Math.round(canvas.width/500)); ctx.strokeRect(px,py,canvas.width-px*2,canvas.height-py*2); ctx.restore();
    } else if (id === 'crop3') {
      const src=snapshotCanvas(canvas), x=Math.round(canvas.width*.03125), y=Math.round(canvas.height*.03125); ctx.save(); ctx.setTransform(1,0,0,1,0,0); ctx.fillStyle='#fff'; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.drawImage(src,x,y,canvas.width-x*2,canvas.height-y*2,0,0,canvas.width,canvas.height); ctx.restore();
    } else if (id === 'ghost') {
      const src=snapshotCanvas(canvas); ctx.save(); ctx.globalAlpha=.18; ctx.globalCompositeOperation='multiply'; ctx.drawImage(src,Math.max(4,canvas.width*.006),Math.max(4,canvas.height*.006)); ctx.restore();
    } else if (id === 'register') {
      drawRegistrationMarks(canvas);
    } else if (id === 'hexfooter') {
      drawHexFooter(canvas, meta);
    } else if (id === 'binarypage') {
      drawBinaryPage(canvas, meta);
    } else if (id === 'letterbox') {
      const src=snapshotCanvas(canvas), targetW=Math.round(canvas.width*.80), x=Math.round((canvas.width-targetW)/2); ctx.save(); ctx.fillStyle='#000'; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.drawImage(src,x,0,targetW,canvas.height); ctx.restore();
    } else if (id === 'noise') {
      const seed=hash16(`${meta.filename}:${meta.outputPageNumber}`); mutatePixels(canvas,(d,i,p)=>{ const n=(((seed+p*1103515245)>>>8)&0x0F)-7; d[i]=Math.max(0,Math.min(255,d[i]+n)); d[i+1]=Math.max(0,Math.min(255,d[i+1]+n)); d[i+2]=Math.max(0,Math.min(255,d[i+2]+n)); });
    }
  }
}

async function safeDestroyPdf(task, doc) {
  // PDF.js versions differ on where destroy() is exposed.
  // Prefer the loading task, then fall back to the document proxy.
  try {
    if (task && typeof task.destroy === 'function') {
      await task.destroy();
      return;
    }
    if (doc && typeof doc.destroy === 'function') {
      await doc.destroy();
      return;
    }
    if (doc && typeof doc.cleanup === 'function') {
      await doc.cleanup();
    }
  } catch (err) {
    console.warn('PDF cleanup warning:', err);
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
  errorText.textContent = (error?.message || String(error)).toUpperCase();
  setCommandStatus('PROGRAM HALTED / PRESS ESC TO RESET');
  errorCard.classList.remove('hidden');
}

function clearError() { errorCard.classList.add('hidden'); }

async function resetAll() {
  if (outputUrl) {
    URL.revokeObjectURL(outputUrl);
    outputUrl = null;
  }
  if (sourcePdf || sourcePdfTask) {
    await safeDestroyPdf(sourcePdfTask, sourcePdf);
  }
  sourceFile = null;
  sourcePdf = null;
  sourcePdfTask = null;
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
  window.scrollTo({ top: 0, behavior: 'auto' });
  refreshTerminalOptions();
  setCommandStatus(
    maintenanceUnlocked
      ? (experimentalMode ? 'EXPERIMENTAL MEDIA GATE OPEN / MUTATION BRANCH LOCKED' : 'CANONICAL MEDIA GATE OPEN / WAITING FOR KEYBOARD INPUT')
      : 'WAITING FOR DISPATCH VECTOR'
  );
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
