// ═══════════════════════════════════════════════════
//  ARTIFACT ENGINE (artifact.js) — Refactored v2
//  Single CodeMirror instance for view + edit + search
//  No hljs dual-render. No DOM table injection.
// ═══════════════════════════════════════════════════

const ART = { cur: null, tab: 'code', isMob: () => window.innerWidth < 600 };

// ── Inject styles once ──
(function () {
  if (document.getElementById('artCmStyles')) return;
  const s = document.createElement('style');
  s.id = 'artCmStyles';
  s.textContent = `
    #viewCode { flex-direction:column; overflow:hidden; flex:1; min-height:0; }
    #viewCode .CodeMirror {
      height:100%; width:100%;
      font-family:'JetBrains Mono',monospace;
      font-size:12px; line-height:1.6;
      border:none !important; border-radius:0 !important;
    }
    #viewCode .CodeMirror-scroll {
      height:100% !important;
      min-height:300px;
      overflow-y:auto !important;
      overflow-x:auto !important;
    }
    #viewCode .CodeMirror-sizer { min-height:300px !important; }
    #viewCode .CodeMirror-gutters { min-height:300px !important; }
    #artTabBar::-webkit-scrollbar { height:3px; }
    #artTabBar::-webkit-scrollbar-thumb { background:rgba(255,255,255,.08);border-radius:10px; }
    #artSearchBar input::placeholder { color:var(--text-muted); }
    #artSearchBar button:hover { background:var(--bg-hover)!important;color:var(--text)!important; }
    .art-cm-search-match { background:rgba(109,40,217,.35); border-radius:2px; }
    .art-cm-search-match-active { background:rgba(109,40,217,.8); color:#fff; border-radius:2px; }
  `;
  document.head.appendChild(s);
})();

// ═══════════════════════════════════════════════════
//  UTILITIES
// ═══════════════════════════════════════════════════

function artEscapeHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, ch => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]
  ));
}

function artDecodeB64Text(b64) {
  try {
    const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    return new TextDecoder('utf-8').decode(bytes);
  } catch (e) {
    try { return atob(b64); } catch (_) { return ''; }
  }
}

function artEncodeB64Text(text) {
  const bytes = new TextEncoder().encode(text);
  let bin = '';
  bytes.forEach(b => bin += String.fromCharCode(b));
  return btoa(bin);
}

// ═══════════════════════════════════════════════════
//  FILE TYPE CONFIG
// ═══════════════════════════════════════════════════

const FT_CFG = {
  html: { badge: 'HTML', cls: 'b-html', icon: 'HTML', canPrev: true,  cmMode: 'htmlmixed' },
  js:   { badge: 'JS',   cls: 'b-js',   icon: 'JS',   canPrev: false, cmMode: 'javascript' },
  css:  { badge: 'CSS',  cls: 'b-css',  icon: 'CSS',  canPrev: false, cmMode: 'css' },
  json: { badge: 'JSON', cls: 'b-json', icon: '{}',   canPrev: false, cmMode: 'javascript' },
  py:   { badge: 'PY',   cls: 'b-py',   icon: 'PY',   canPrev: false, cmMode: 'python' },
  txt:  { badge: 'TXT',  cls: 'b-txt',  icon: 'FILE', canPrev: false, cmMode: 'plaintext' },
  md:   { badge: 'MD',   cls: 'b-txt',  icon: 'MD',   canPrev: false, cmMode: 'markdown' },
  csv:  { badge: 'CSV',  cls: 'b-txt',  icon: 'CSV',  canPrev: false, cmMode: 'plaintext' },
  png:  { badge: 'IMG',  cls: 'b-img',  icon: 'IMG',  canPrev: true,  isImg: true },
  jpg:  { badge: 'IMG',  cls: 'b-img',  icon: 'IMG',  canPrev: true,  isImg: true },
  jpeg: { badge: 'IMG',  cls: 'b-img',  icon: 'IMG',  canPrev: true,  isImg: true },
  webp: { badge: 'IMG',  cls: 'b-img',  icon: 'IMG',  canPrev: true,  isImg: true },
  gif:  { badge: 'GIF',  cls: 'b-img',  icon: 'GIF',  canPrev: true,  isImg: true },
  pdf:  { badge: 'PDF',  cls: 'b-pdf',  icon: 'PDF',  canPrev: true,  isPdf: true },
};
function ftCfg(ext) {
  return FT_CFG[ext] || { badge: ext.toUpperCase(), cls: 'b-txt', icon: '📄', canPrev: false, cmMode: 'plaintext' };
}

// ═══════════════════════════════════════════════════
//  CODEMIRROR — SINGLE INSTANCE MANAGER
//  Handles both view (readOnly) and edit mode
// ═══════════════════════════════════════════════════

const CM = (() => {
  let _instance = null;   // the single CodeMirror instance
  let _mode = 'view';     // 'view' | 'edit'
  let _overlayMarkers = [];
  let _searchCursor = null;
  let _searchIdx = 0;     // private — replaces CM._searchIdx
  const _MAX_MARKERS = 500; // cap for large files to prevent marker accumulation

  // --- CodeMirror availability guard (core + search addon) ---
  function _available() {
    return typeof CodeMirror !== 'undefined';
  }
  function _searchAvailable() {
    return _available() && typeof CodeMirror.createSearchCursor === 'function';
  }

  // --- Resolve CM mode from ext ---
  function _resolveMode(ext) {
    return ftCfg(ext).cmMode || 'plaintext';
  }

  // --- Destroy existing instance safely ---
  function _destroy() {
    _clearSearchMarkers();
    if (_instance) {
      try {
        const wrap = _instance.getWrapperElement();
        if (wrap && wrap.parentNode) wrap.parentNode.removeChild(wrap);
      } catch (_) {}
      _instance = null;
    }
    _mode = 'view';
    _searchCursor = null;
    _searchIdx = 0;
  }

  // --- Mount CM into a container div ---
  function _mount(container, txt, ext, readOnly) {
    _destroy();
    if (!_available()) return null;
    // Ensure container has measurable height before CM mounts
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.flex = '1';
    container.style.minHeight = '0';
    container.style.overflow = 'hidden';
    _instance = CodeMirror(container, {
      value: txt || '',
      mode: _resolveMode(ext),
      theme: 'dracula',
      lineNumbers: true,
      lineWrapping: true,
      readOnly: readOnly ? 'nocursor' : false,
      indentUnit: 2,
      tabSize: 2,
      autofocus: !readOnly,
      cursorBlinkRate: readOnly ? -1 : 530,
    });
    // Force CM wrapper to fill container
    const wrapper = _instance.getWrapperElement();
    wrapper.style.cssText = 'flex:1;min-height:0;height:100%;overflow:hidden;';
    _mode = readOnly ? 'view' : 'edit';
    return _instance;
  }

  // --- Switch between view / edit without re-mounting ---
  function setReadOnly(flag) {
    if (!_instance) return;
    _instance.setOption('readOnly', flag ? 'nocursor' : false);
    _instance.setOption('cursorBlinkRate', flag ? -1 : 530);
    _mode = flag ? 'view' : 'edit';
  }

  // --- Get/Set content ---
  function getValue() { return _instance ? _instance.getValue() : ''; }
  function setValue(txt) { if (_instance) _instance.setValue(txt || ''); }

  // --- Change language mode live ---
  function setMode(ext) {
    if (_instance) _instance.setOption('mode', _resolveMode(ext));
  }

  // --- Force re-layout (needed after display:none → flex) ---
  function refresh() {
    if (!_instance) return;
    setTimeout(() => { _instance.refresh(); }, 30);
    setTimeout(() => { _instance.refresh(); }, 150); // second pass for old PCs
  }

  // --- Native CM search via SearchCursor ---
  function _clearSearchMarkers() {
    _overlayMarkers.forEach(m => m.clear());
    _overlayMarkers = [];
  }

  function search(query, direction, onResult) {
    _clearSearchMarkers();
    if (!_instance || !query || !_searchAvailable()) {
      onResult && onResult(0, 0);
      return;
    }

    const doc = _instance.getDoc();
    const cursor = CodeMirror.createSearchCursor(doc, query, { caseFold: true });
    const allMatches = [];

    // Collect all match ranges
    while (cursor.findNext()) {
      allMatches.push({ from: cursor.from(), to: cursor.to() });
    }

    if (!allMatches.length) {
      onResult && onResult(0, 0);
      return;
    }

    // Cap markers for large files — mark only first _MAX_MARKERS matches
    const markable = allMatches.slice(0, _MAX_MARKERS);
    markable.forEach(m => {
      const marker = doc.markText(m.from, m.to, { className: 'art-cm-search-match' });
      _overlayMarkers.push(marker);
    });

    // Track active index (private closure var)
    if (direction === 'reset') _searchIdx = 0;
    else if (direction === 1) _searchIdx = (_searchIdx + 1) % allMatches.length;
    else if (direction === -1) _searchIdx = (_searchIdx - 1 + allMatches.length) % allMatches.length;

    // Highlight active
    const active = allMatches[_searchIdx];
    const activeMarker = doc.markText(active.from, active.to, { className: 'art-cm-search-match-active' });
    _overlayMarkers.push(activeMarker);
    _instance.scrollIntoView({ from: active.from, to: active.to }, 80);

    onResult && onResult(_searchIdx + 1, allMatches.length);
  }

  function clearSearch() {
    _clearSearchMarkers();
    _searchIdx = 0;
  }

  function isReady() { return !!_instance; }
  function getMode() { return _mode; }

  return { mount: _mount, destroy: _destroy, setReadOnly, getValue, setValue, setMode, refresh, search, clearSearch, isReady, getMode };
})();

// ═══════════════════════════════════════════════════
//  OPEN / CLOSE ARTIFACT
// ═══════════════════════════════════════════════════

function openArt(file, b64) {
  const ext = file.name.split('.').pop().toLowerCase();
  const cfg = ftCfg(ext);
  if (ART.cur?.objUrl) URL.revokeObjectURL(ART.cur.objUrl);
  let objUrl = null;
  if (cfg.isImg || cfg.isPdf) {
    const mime = cfg.isImg ? file.type : 'application/pdf';
    const ba = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    objUrl = URL.createObjectURL(new Blob([ba], { type: mime }));
  }
  const txt = (!cfg.isImg && !cfg.isPdf) ? artDecodeB64Text(b64) : null;
  ART.cur = { name: file.name, ext, b64, mime: file.type, objUrl, cfg, txt };
  if (ART.isMob()) _openSheet(); else _openPanel();
}

function _openPanel() {
  _tabAdd(ART.cur);
  _openPanelRender();
}

function closeArt() {
  CM.destroy();
  _artSearchClose();
  ART_TABS.list = [];
  ART_TABS.active = -1;
  const bar = document.getElementById('artTabBar');
  if (bar) bar.style.display = 'none';
  _uiEditMode(false); // reset toolbar buttons
  document.getElementById('artPanel').classList.remove('open');
}

// ═══════════════════════════════════════════════════
//  PANEL RENDER
// ═══════════════════════════════════════════════════

function _openPanelRender() {
  const { name, ext, txt, cfg } = ART.cur;
  document.getElementById('artBadge').innerHTML = `<span class="ftbdg ${cfg.cls}">${cfg.badge}</span>`;
  document.getElementById('artTitle').textContent = name;
  document.getElementById('tabPreview').style.display = cfg.canPrev ? 'flex' : 'none';
  document.getElementById('openTabBtn').style.display = ext === 'html' ? 'flex' : 'none';
  if (txt) {
    const l = txt.split('\n').length, c = txt.length;
    document.getElementById('artMeta').textContent = `${l} lines · ${(c / 1024).toFixed(1)}kb`;
  } else {
    document.getElementById('artMeta').textContent = '';
  }
  _uiEditMode(false);
  switchTab(cfg.isImg || cfg.isPdf ? 'preview' : 'code');
  document.getElementById('artPanel').classList.add('open');
  _injectSearchBtn();
  _artSearchClose();
}

// ═══════════════════════════════════════════════════
//  TAB SWITCH
// ═══════════════════════════════════════════════════

function switchTab(t) {
  ART.tab = t;
  if (!ART.cur) return;
  const { ext, txt, objUrl, cfg } = ART.cur;

  document.getElementById('tabCode').classList.toggle('active', t === 'code');
  document.getElementById('tabPreview').classList.toggle('active', t === 'preview');
  ['viewCode', 'viewPreview', 'viewImg', 'viewPdf'].forEach(id =>
    document.getElementById(id).style.display = 'none'
  );

  if (t === 'code' && txt !== null) {
    const viewCode = document.getElementById('viewCode');
    viewCode.style.display = 'flex';
    // Mount CM viewer (readOnly)
    CM.mount(viewCode, txt, ext, true);
    CM.refresh();
  } else if (t === 'preview') {
    CM.destroy(); // free memory when in preview
    if (cfg.isImg) {
      document.getElementById('viewImg').style.display = 'flex';
      document.getElementById('imgEl').src = objUrl;
    } else if (cfg.isPdf) {
      document.getElementById('viewPdf').style.display = 'flex';
      document.getElementById('pdfEl').setAttribute('src', objUrl);
    } else if (ext === 'html') {
      document.getElementById('viewPreview').style.display = 'flex';
      const iframe = document.getElementById('previewIframe');
      iframe.setAttribute('sandbox', 'allow-scripts');
      iframe.srcdoc = txt;
    }
  }
}

// ═══════════════════════════════════════════════════
//  EDIT MODE — toggle readOnly on same CM instance
// ═══════════════════════════════════════════════════

function toggleArtEdit() {
  if (!ART.cur || !ART.cur.txt) return;
  const viewCode = document.getElementById('viewCode');

  // If CM not ready (e.g. user toggled preview), mount fresh
  if (!CM.isReady()) {
    viewCode.style.display = 'flex';
    CM.mount(viewCode, ART.cur.txt, ART.cur.ext, false);
    CM.refresh();
  } else {
    CM.setReadOnly(false);
    CM.refresh();
  }
  _uiEditMode(true);
}

function saveArtEdit() {
  if (!CM.isReady() || !ART.cur) return;
  const newCode = CM.getValue();
  ART.cur.txt = newCode;
  const b64 = artEncodeB64Text(newCode);
  ART.cur.b64 = b64;

  // Firebase save
  const proj = document.getElementById('activeProjectSelect')?.value || 'default';
  if (proj !== 'default' && typeof saveFileToCloudWorkspace === 'function') {
    saveFileToCloudWorkspace(proj, ART.cur.name, ART.cur.mime || 'text/plain', b64);
  }
  if (typeof saveFileToMemory === 'function') {
    saveFileToMemory(ART.cur.name, b64, ART.cur.mime || 'text/plain');
  }

  // Switch back to readOnly view — same CM instance, no re-render
  CM.setReadOnly(true);
  _uiEditMode(false);

  const sb = document.getElementById('saveArtBtn');
  if (sb) {
    sb.textContent = 'Saved ✓';
    setTimeout(() => {
      sb.innerHTML = '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>Save';
    }, 2000);
  }
}

// ── Toolbar UI state helper ──
function _uiEditMode(editing) {
  const editBtn = document.getElementById('editArtBtn');
  const saveBtn = document.getElementById('saveArtBtn');
  const viewEditor = document.getElementById('viewEditor');
  if (editBtn) editBtn.style.display = editing ? 'none' : 'flex';
  if (saveBtn) saveBtn.style.display = editing ? 'flex' : 'none';
  // viewEditor div is legacy — hide it always since CM mounts into viewCode
  if (viewEditor) viewEditor.style.display = 'none';
}

// ═══════════════════════════════════════════════════
//  MOBILE SHEET — CM viewer (unified, no hljs dual system)
// ═══════════════════════════════════════════════════

let _shCmInstance = null; // separate lightweight CM instance for mobile sheet

function _openSheet() {
  const { name, cfg } = ART.cur;
  document.getElementById('shBadge').innerHTML = `<span class="ftbdg ${cfg.cls}">${cfg.badge}</span>`;
  document.getElementById('shTitle').textContent = name;
  document.getElementById('shTabPreview').style.display = cfg.canPrev ? 'flex' : 'none';
  _renderSheet('code');
  document.getElementById('artOverlay').classList.add('open');
  document.getElementById('artSheet').classList.add('open');
}

function _renderSheet(t) {
  const { ext, txt, objUrl, cfg } = ART.cur;
  const c = document.getElementById('shContent');
  // Destroy any previous mobile CM instance
  if (_shCmInstance) {
    try { const w = _shCmInstance.getWrapperElement(); if (w && w.parentNode) w.parentNode.removeChild(w); } catch(_) {}
    _shCmInstance = null;
  }
  c.innerHTML = '';
  document.getElementById('shTabCode').classList.toggle('active', t === 'code');
  document.getElementById('shTabPreview').classList.toggle('active', t === 'preview');
  if (t === 'code' && txt !== null) {
    _shRenderCode(c, txt, cfg, ext);
  } else if (t === 'preview') {
    _shRenderPreview(c, cfg, ext, objUrl, txt);
  }
}

function _shRenderCode(container, txt, cfg, ext) {
  // Use CM if available (unified architecture), fallback to hljs for very old browsers
  if (typeof CodeMirror !== 'undefined') {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'min-height:200px;font-size:12px;line-height:1.6;';
    container.appendChild(wrap);
    _shCmInstance = CodeMirror(wrap, {
      value: txt || '',
      mode: cfg.cmMode || 'plaintext',
      theme: 'dracula',
      lineNumbers: true,
      lineWrapping: true,
      readOnly: 'nocursor',
      cursorBlinkRate: -1,
    });
  } else {
    // hljs fallback (graceful degradation)
    const pre = document.createElement('pre');
    pre.style.cssText = 'margin:0;border-radius:0;border:none;min-height:200px;font-size:12px;line-height:1.6;';
    const code = document.createElement('code');
    code.className = `language-${cfg.cmMode || 'plaintext'}`;
    code.textContent = txt;
    pre.appendChild(code);
    container.appendChild(pre);
    if (typeof hljs !== 'undefined') hljs.highlightElement(code);
  }
}

function _shRenderPreview(container, cfg, ext, objUrl, txt) {
  if (cfg.isImg) {
    const w = document.createElement('div');
    w.style.cssText = 'display:flex;align-items:center;justify-content:center;padding:16px;background:#111;min-height:200px;';
    const img = document.createElement('img');
    img.src = objUrl;
    img.style.cssText = 'max-width:100%;border-radius:8px;';
    w.appendChild(img);
    container.appendChild(w);
  } else if (cfg.isPdf) {
    const em = document.createElement('embed');
    em.src = objUrl; em.type = 'application/pdf';
    em.style.cssText = 'width:100%;height:60vh;border:none;';
    container.appendChild(em);
  } else if (ext === 'html') {
    const ifr = document.createElement('iframe');
    ifr.style.cssText = 'width:100%;height:60vh;border:none;background:#fff;';
    // Safer sandbox: allow-scripts only — no allow-same-origin to prevent iframe escaping sandbox
    ifr.setAttribute('sandbox', 'allow-scripts');
    ifr.srcdoc = txt;
    container.appendChild(ifr);
  }
}

function switchSheetTab(t) { _renderSheet(t); }
function closeSheet() {
  document.getElementById('artOverlay').classList.remove('open');
  document.getElementById('artSheet').classList.remove('open');
}

// ═══════════════════════════════════════════════════
//  TOOLBAR ACTIONS
// ═══════════════════════════════════════════════════

function copyArt() {
  if (!ART.cur) return;
  const t = ART.cur.txt || '';
  navigator.clipboard.writeText(t).then(() => {
    const b = document.getElementById('copyArtBtn');
    if (b) { const o = b.innerHTML; b.textContent = 'Copied'; setTimeout(() => b.innerHTML = o, 2000); }
  });
}

function dlArt() {
  if (!ART.cur) return;
  const { name, objUrl, txt, mime } = ART.cur;
  const url = objUrl || URL.createObjectURL(new Blob([txt], { type: mime || 'text/plain' }));
  const a = document.createElement('a'); a.href = url; a.download = name; a.click();
  if (!objUrl) URL.revokeObjectURL(url);
}

function openArtTab() {
  if (!ART.cur?.txt) return;
  const blobUrl = URL.createObjectURL(new Blob([ART.cur.txt], { type: 'text/html' }));
  window.open(blobUrl, '_blank');
  // Revoke after short delay to allow the new tab to load
  setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
}

// ═══════════════════════════════════════════════════
//  ARTIFACT CARDS
// ═══════════════════════════════════════════════════

function makeArtCard(name, ext, b64, fileMeta) {
  const cfg = ftCfg(ext);
  const card = document.createElement('div');
  card.className = 'art-card';
  const icon = document.createElement('div');
  icon.className = 'art-card-icon'; icon.textContent = cfg.icon;
  const info = document.createElement('div'); info.className = 'art-card-info';
  const title = document.createElement('div'); title.className = 'art-card-name'; title.textContent = name;
  const meta = document.createElement('div'); meta.className = 'art-card-meta';
  meta.innerHTML = `<span class="ftbdg ${cfg.cls}" style="font-size:9px;padding:1px 5px;">${cfg.badge}</span> · Click to view`;
  info.appendChild(title); info.appendChild(meta);
  const arrow = document.createElement('span');
  arrow.style.cssText = 'color:var(--text-muted);flex-shrink:0;font-size:18px;line-height:1;';
  arrow.textContent = '>';
  card.appendChild(icon); card.appendChild(info); card.appendChild(arrow);
  card.onclick = () => openArt(fileMeta, b64);
  return card;
}

// ── Code block buttons (chat messages) ──
function addArtifactButtons(el) {
  el.querySelectorAll('pre').forEach((pre, idx) => {
    const codeEl = pre.querySelector('code');
    if (codeEl && typeof hljs !== 'undefined') hljs.highlightElement(codeEl);
    if (!pre.querySelector('.run-art-btn') && codeEl) {
      const langMatch = codeEl.className.match(/language-(\w+)/);
      let ext = langMatch ? langMatch[1] : 'txt';
      if (ext === 'javascript') ext = 'js';
      if (ext === 'python') ext = 'py';
      const btn = document.createElement('button');
      btn.className = 'tbtn prim run-art-btn';
      btn.textContent = 'Run / View';
      btn.onclick = () => {
        const b64 = artEncodeB64Text(codeEl.innerText);
        openArt({ name: `Nivi_Code_${idx + 1}.${ext}`, type: 'text/plain' }, b64);
      };
      pre.appendChild(btn);
    }
  });
}

// ═══════════════════════════════════════════════════
//  MANUAL ARTIFACT MODAL
// ═══════════════════════════════════════════════════

let _manLang = 'js';
window.setManLang = function (lang) {
  _manLang = lang;
  ['js', 'html', 'py', 'css', 'txt'].forEach(l => {
    const btn = document.getElementById('manArtLang' + l.charAt(0).toUpperCase() + l.slice(1));
    if (btn) btn.style.borderColor = '';
  });
  const activeBtn = document.getElementById('manArtLang' + lang.charAt(0).toUpperCase() + lang.slice(1));
  if (activeBtn) activeBtn.style.borderColor = 'var(--accent)';
};

window.openManualArt = function () {
  const ta = document.getElementById('manualArtInput');
  if (ta) ta.value = '';
  _manLang = 'js';
  ['js', 'html', 'py', 'css', 'txt'].forEach(l => {
    const btn = document.getElementById('manArtLang' + l.charAt(0).toUpperCase() + l.slice(1));
    if (btn) btn.style.borderColor = l === 'js' ? 'rgba(251,191,36,.4)' : '';
  });
  document.getElementById('manualArtModal').classList.add('open');
  setTimeout(() => ta && ta.focus(), 150);
};

window.submitManualArt = function () {
  const code = document.getElementById('manualArtInput')?.value?.trim();
  if (!code) return;
  closeModal('manualArtModal');
  const b64 = artEncodeB64Text(code);
  const nameMap = { js: 'manual_fix.js', html: 'manual_fix.html', py: 'manual_fix.py', css: 'manual_fix.css', txt: 'manual_fix.txt' };
  const mimeMap = { js: 'text/javascript', html: 'text/html', py: 'text/plain', css: 'text/css', txt: 'text/plain' };
  openArt({ name: nameMap[_manLang] || 'manual_fix.js', type: mimeMap[_manLang] || 'text/plain' }, b64);
};

// ═══════════════════════════════════════════════════
//  PROMPT-TO-ACTION (explain / fix / optimize)
// ═══════════════════════════════════════════════════

async function artAction(action) {
  if (!ART.cur || !ART.cur.txt) return;
  const code = ART.cur.txt;
  const lang = ART.cur.cfg.cmMode || 'code';
  let apiPrompt = '';
  if (action === 'explain') {
    apiPrompt = `Please explain this ${lang} code.\n<nivi-hidden>\nPlease explain how this code works step-by-step in Gujarati:\n\n\`\`\`${lang}\n${code}\n\`\`\`\n</nivi-hidden>`;
  } else if (action === 'fix') {
    apiPrompt = `Please find and fix bugs in this ${lang} code.\n<nivi-hidden>\nPlease review this code for any bugs or errors, and provide the fixed version:\n\n\`\`\`${lang}\n${code}\n\`\`\`\n</nivi-hidden>`;
  } else if (action === 'optimize') {
    apiPrompt = `Please optimize this ${lang} code.\n<nivi-hidden>\nPlease optimize this code for better performance and readability:\n\n\`\`\`${lang}\n${code}\n\`\`\`\n</nivi-hidden>`;
  }

  appendMsg('user', apiPrompt);
  if (window.AppState) {
    AppState._tabChatHistory.push({ role: 'user', text: apiPrompt });
    localStorage.setItem('niviTabChat', JSON.stringify(AppState._tabChatHistory));
  }
  setTimeout(() => { const wrap = document.getElementById('chatWrap'); if (wrap) wrap.scrollTop = wrap.scrollHeight; }, 50);

  toggleGen(true);
  if (window.AppState) AppState._abortController = new AbortController();
  const resId = 'nivi-' + Date.now();
  appendMsg('nivi', `<div class="thinking"><span></span><span></span><span></span></div>`, resId);

  try {
    const hist = window.AppState
      ? AppState._tabChatHistory.slice(0, -1).map(m => ({ role: m.role === 'nivi' ? 'model' : 'user', parts: [{ text: m.text }] }))
      : [];
    if (typeof directGeminiCallStreamMultiTurn === 'function') {
      await directGeminiCallStreamMultiTurn(hist, apiPrompt, (chunk) => {
        if (!AppState?._abortController?.signal.aborted) updateMsg(resId, chunk);
      });
    }
  } catch (err) {
    if (!AppState?._abortController?.signal.aborted) updateMsg(resId, 'Error: ' + err.message);
  } finally {
    toggleGen(false);
    const _wasAborted = AppState?._abortController?.signal.aborted;
    if (window.AppState) AppState._abortController = null;
    if (!_wasAborted && window.AppState) {
      const bubble = document.getElementById(resId);
      let rawText = '';
      if (bubble) {
        const attr = bubble.getAttribute('data-raw');
        rawText = attr
          ? attr.replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
          : bubble.innerText || '';
      }
      AppState._tabChatHistory.push({ role: 'nivi', text: rawText });
      localStorage.setItem('niviTabChat', JSON.stringify(AppState._tabChatHistory));
      // Auto-save corrected code
      if (ART.cur?.name && rawText && typeof saveFileToMemory === 'function') {
        const codeMatch = rawText.match(/```(?:\w+)?\n([\s\S]*?)```/);
        if (codeMatch?.[1]) {
          const correctedCode = codeMatch[1].trim();
          const b64 = artEncodeB64Text(correctedCode);
          saveFileToMemory(ART.cur.name, b64, ART.cur.mime || 'text/plain');
          ART.cur.txt = correctedCode;
          ART.cur.b64 = b64;
          // Refresh CM viewer with new content (stay in readOnly)
          if (CM.isReady()) CM.setValue(correctedCode);
        }
      }
    }
    if (typeof saveUserData === 'function') saveUserData('history');
    renderSidebarData();
  }
}

// ═══════════════════════════════════════════════════
//  FILE TABS
// ═══════════════════════════════════════════════════

const ART_TABS = { list: [], active: -1 };

function _tabsRender() {
  let bar = document.getElementById('artTabBar');
  if (!bar) {
    bar = document.createElement('div');
    bar.id = 'artTabBar';
    bar.style.cssText = 'display:flex;align-items:center;overflow-x:auto;background:var(--bg);border-bottom:1px solid var(--border);padding:0 4px;flex-shrink:0;min-height:36px;scrollbar-width:none;';
    const artHdr = document.getElementById('artTabs');
    artHdr.parentNode.insertBefore(bar, artHdr);
  }
  bar.innerHTML = '';
  ART_TABS.list.forEach((t, i) => {
    const tab = document.createElement('div');
    const isActive = i === ART_TABS.active;
    tab.style.cssText = `display:flex;align-items:center;gap:6px;padding:5px 10px;cursor:pointer;font-family:var(--mono);font-size:11px;white-space:nowrap;flex-shrink:0;border-bottom:2px solid ${isActive ? 'var(--accent)' : 'transparent'};color:${isActive ? 'var(--accent-text)' : 'var(--text-sub)'};background:${isActive ? 'var(--accent-dim)' : 'transparent'};transition:all .15s;`;
    const cfg = t.cfg;
    tab.innerHTML = `<span class="ftbdg ${cfg.cls}" style="font-size:9px;padding:1px 5px;">${cfg.badge}</span><span>${t.name}</span><span data-tabclose="${i}" style="opacity:.5;font-size:13px;line-height:1;padding:0 2px;border-radius:3px;margin-left:2px;" onmouseover="this.style.opacity=1;this.style.background='rgba(255,255,255,.08)'" onmouseout="this.style.opacity=.5;this.style.background='transparent'">×</span>`;
    tab.addEventListener('click', (e) => {
      if (e.target.dataset.tabclose !== undefined) _tabClose(parseInt(e.target.dataset.tabclose));
      else _tabSwitch(i);
    });
    bar.appendChild(tab);
  });
  bar.style.display = ART_TABS.list.length > 0 ? 'flex' : 'none';
}

function _tabAdd(fileObj) {
  const existing = ART_TABS.list.findIndex(t => t.name === fileObj.name);
  if (existing !== -1) {
    ART_TABS.list[existing] = { ...fileObj };
    ART_TABS.active = existing;
    _tabsRender();
    return;
  }
  ART_TABS.list.push({ ...fileObj });
  ART_TABS.active = ART_TABS.list.length - 1;
  _tabsRender();
}

function _tabSwitch(i) {
  if (i < 0 || i >= ART_TABS.list.length) return;
  ART_TABS.active = i;
  ART.cur = ART_TABS.list[i];
  _tabsRender();
  _openPanelRender();
}

function _tabClose(i) {
  ART_TABS.list.splice(i, 1);
  if (ART_TABS.list.length === 0) {
    ART_TABS.active = -1;
    _tabsRender();
    closeArt();
    return;
  }
  ART_TABS.active = Math.max(0, i - 1);
  ART.cur = ART_TABS.list[ART_TABS.active];
  _tabsRender();
  _openPanelRender();
}

// ═══════════════════════════════════════════════════
//  SEARCH — delegates to CM.search() (native CM overlay)
// ═══════════════════════════════════════════════════

let _artSearchActive = false;
let _artSearchLastQuery = '';

function _artSearchInject() {
  if (document.getElementById('artSearchBar')) return;
  const bar = document.createElement('div');
  bar.id = 'artSearchBar';
  bar.style.cssText = 'display:none;align-items:center;gap:8px;padding:6px 10px;background:var(--bg-panel);border-bottom:1px solid var(--border-a);flex-shrink:0;';
  bar.innerHTML = `
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--accent-text)" stroke-width="2" style="flex-shrink:0;"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
    <input id="artSearchInput" placeholder="Search in file…" style="flex:1;background:transparent;border:none;outline:none;color:var(--text);font-family:var(--mono);font-size:12px;min-width:0;" autocomplete="off" spellcheck="false">
    <span id="artSearchCount" style="font-family:var(--mono);font-size:10px;color:var(--text-muted);flex-shrink:0;"></span>
    <button id="artSearchPrev" title="Previous (Shift+Enter)" style="background:transparent;border:1px solid var(--border);color:var(--text-sub);border-radius:5px;padding:3px 7px;cursor:pointer;font-size:11px;">▲</button>
    <button id="artSearchNext" title="Next (Enter)" style="background:transparent;border:1px solid var(--border);color:var(--text-sub);border-radius:5px;padding:3px 7px;cursor:pointer;font-size:11px;">▼</button>
    <button id="artSearchClose" title="Close (Esc)" style="background:transparent;border:none;color:var(--text-sub);cursor:pointer;font-size:16px;line-height:1;padding:0 4px;">×</button>
  `;
  const ref = document.getElementById('artTabs');
  ref.parentNode.insertBefore(bar, ref);

  const inp = document.getElementById('artSearchInput');
  inp.addEventListener('input', () => _artSearchRun(inp.value, 'reset'));
  inp.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); _artSearchRun(inp.value, e.shiftKey ? -1 : 1); }
    if (e.key === 'Escape') { e.preventDefault(); _artSearchClose(); }
  });
  document.getElementById('artSearchClose').addEventListener('click', _artSearchClose);
  document.getElementById('artSearchNext').addEventListener('click', () => _artSearchRun(_artSearchLastQuery, 1));
  document.getElementById('artSearchPrev').addEventListener('click', () => _artSearchRun(_artSearchLastQuery, -1));
}

function _artSearchOpen() {
  _artSearchInject();
  document.getElementById('artSearchBar').style.display = 'flex';
  _artSearchActive = true;
  const inp = document.getElementById('artSearchInput');
  inp.focus(); inp.select();
  if (_artSearchLastQuery) _artSearchRun(_artSearchLastQuery, 'reset');
}

function _artSearchClose() {
  const bar = document.getElementById('artSearchBar');
  if (bar) bar.style.display = 'none';
  _artSearchActive = false;
  CM.clearSearch();
  const count = document.getElementById('artSearchCount');
  if (count) count.textContent = '';
}

function _artSearchRun(query, direction) {
  if (!query) { CM.clearSearch(); document.getElementById('artSearchCount').textContent = ''; return; }
  _artSearchLastQuery = query;
  CM.search(query, direction, (current, total) => {
    const count = document.getElementById('artSearchCount');
    if (count) count.textContent = total ? `${current}/${total}` : 'No results';
  });
}

// ── Search button injection ──
function _injectSearchBtn() {
  if (document.getElementById('artSearchBtn')) return;
  const toolbar = document.querySelector('.art-toolbar');
  if (!toolbar) return;
  const btn = document.createElement('button');
  btn.id = 'artSearchBtn';
  btn.className = 'tbtn';
  btn.title = 'Search in file (Ctrl+F)';
  btn.innerHTML = `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>Search`;
  btn.onclick = _artSearchOpen;
  toolbar.insertBefore(btn, toolbar.firstChild);
  const sep = document.createElement('span');
  sep.style.cssText = 'width:1px;height:14px;background:var(--border);margin:0 2px;';
  toolbar.insertBefore(sep, btn.nextSibling);
}

// ── Ctrl+F intercept ──
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
    const panel = document.getElementById('artPanel');
    if (panel && panel.classList.contains('open')) {
      e.preventDefault();
      _artSearchOpen();
    }
  }
}, true);

// ═══════════════════════════════════════════════════
//  PATCH ENGINE — Apply Nivi FILE/FIND/REPLACE diffs
//  (Preserved exactly — no structural changes)
// ═══════════════════════════════════════════════════

function _parsePatchBlocks() {
  const history = window.AppState?._tabChatHistory || [];
  const patches = [];
  const niviMsgs = history.filter(m => m.role === 'nivi');
  for (const msg of niviMsgs) {
    const text = msg.text || '';
    const blockRe = /FILE:\s*([^\n]+)\s*\n(?:LINE:[^\n]*\n)?FIND:\s*\n?```(?:\w+)?\n([\s\S]*?)```\s*\nREPLACE:\s*\n?```(?:\w+)?\n([\s\S]*?)```/gi;
    let match;
    while ((match = blockRe.exec(text)) !== null) {
      const file = match[1].trim().replace(/\s*\(.*?\)/, '');
      const find = match[2];
      const replace = match[3];
      if (file && find !== undefined && replace !== undefined) {
        patches.push({ file, find, replace });
      }
    }
  }
  return patches;
}

function _applyPatches(originalContent, patches, targetFilename) {
  let content = originalContent;
  const results = [];
  const relevant = patches.filter(p => {
    const pFile = p.file.toLowerCase().trim();
    const tFile = targetFilename.toLowerCase().trim();
    return tFile.endsWith(pFile) || pFile.endsWith(tFile) || pFile === tFile;
  });
  if (relevant.length === 0) {
    return { content, results: [{ ok: false, msg: `No patches found for "${targetFilename}" in chat history.` }] };
  }
  for (const patch of relevant) {
    const normalize = t => (t || '').replace(/\r\n/g, '\n').trim();
    const findText = patch.find;
    if (normalize(content).includes(normalize(findText))) {
      content = content.split(findText).join(patch.replace);
      results.push({ ok: true, msg: `✅ Applied: ${findText.trim().slice(0, 60)}...` });
    } else {
      const findTrimmed = findText.trim();
      if (content.includes(findTrimmed)) {
        content = content.split(findTrimmed).join(patch.replace.trim());
        results.push({ ok: true, msg: `✅ Applied (trimmed): ${findTrimmed.slice(0, 60)}...` });
      } else {
        results.push({ ok: false, msg: `❌ Not found: ${findText.trim().slice(0, 60)}...` });
      }
    }
  }
  return { content, results };
}

function _showPatchToast(results, filename) {
  const ok = results.filter(r => r.ok).length;
  const fail = results.filter(r => !r.ok).length;
  const msg = `Patch "${filename}": ${ok} applied${fail > 0 ? `, ${fail} not found` : ' ✅'}`;
  const toast = document.createElement('div');
  toast.style.cssText = `position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:${fail > 0 ? '#7c3aed' : '#1D9E75'};color:#fff;padding:8px 16px;border-radius:8px;font-size:12px;font-family:var(--mono);z-index:9999;pointer-events:none;`;
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

window.triggerPatchUpload = function () {
  const history = window.AppState?._tabChatHistory || [];
  if (history.length === 0) {
    _showPatchToast([{ ok: false, msg: 'Chat history empty. Ask Nivi to fix your code first!' }], '');
    return;
  }
  const patches = _parsePatchBlocks();
  if (patches.length === 0) {
    _showPatchToast([{ ok: false, msg: 'No FILE/FIND/REPLACE patch blocks in chat. Ask Nivi using patch format.' }], '');
    return;
  }
  document.getElementById('patchFileInp').click();
};

window.applyPatchFromFile = async function (input) {
  if (!input.files || !input.files[0]) return;
  const file = input.files[0];
  input.value = '';
  try {
    const originalContent = await new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result);
      r.onerror = () => rej(new Error('File read failed'));
      r.readAsText(file, 'utf-8');
    });
    const patches = _parsePatchBlocks();
    const { content: patchedContent, results } = _applyPatches(originalContent, patches, file.name);
    _showPatchToast(results, file.name);
    const b64 = artEncodeB64Text(patchedContent);
    const patchedFile = { name: file.name, type: file.type || 'text/plain' };
    openArt(patchedFile, b64);
    if (typeof saveFileToMemory === 'function') {
      saveFileToMemory(file.name, b64, file.type || 'text/plain');
    }
  } catch (e) {
    alert('Patch failed: ' + e.message);
  }
};
