// ══════════════════════════════════════════════════════════
//  NIVI — FILE SYSTEM AGENT (fs-agent.js)
//  Direct local folder access via File System Access API
//  Persists folder handle in IndexedDB across sessions
// ══════════════════════════════════════════════════════════

window.FSAgent = (() => {
  const IDB_DB_NAME    = 'nivi-fs-agent';
  const IDB_STORE_NAME = 'handles';
  const IDB_KEY        = 'root-handle';

  // ── Internal State ──
  let _dirHandle   = null;   // FileSystemDirectoryHandle
  let _status      = 'idle'; // 'idle' | 'granted' | 'denied' | 'unsupported'
  let _folderName  = '';
  let _fileCache   = [];     // { name, kind, size, lastModified }

  // ── IndexedDB helper (separate from NiviDB) ──
  function _openIDB() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(IDB_DB_NAME, 1);
      req.onupgradeneeded = e => e.target.result.createObjectStore(IDB_STORE_NAME);
      req.onsuccess = e => resolve(e.target.result);
      req.onerror   = e => reject(e.target.error);
    });
  }

  async function _saveHandle(handle) {
    try {
      const db    = await _openIDB();
      const tx    = db.transaction(IDB_STORE_NAME, 'readwrite');
      tx.objectStore(IDB_STORE_NAME).put(handle, IDB_KEY);
      await new Promise((res, rej) => { tx.oncomplete = res; tx.onerror = rej; });
      db.close();
    } catch(e) { console.warn('[FSAgent] Could not persist handle:', e); }
  }

  async function _loadHandle() {
    try {
      const db   = await _openIDB();
      const tx   = db.transaction(IDB_STORE_NAME, 'readonly');
      const req  = tx.objectStore(IDB_STORE_NAME).get(IDB_KEY);
      const handle = await new Promise((res, rej) => { req.onsuccess = () => res(req.result); req.onerror = rej; });
      db.close();
      return handle || null;
    } catch(e) { return null; }
  }

  async function _clearHandle() {
    try {
      const db = await _openIDB();
      const tx = db.transaction(IDB_STORE_NAME, 'readwrite');
      tx.objectStore(IDB_STORE_NAME).delete(IDB_KEY);
      db.close();
    } catch(e) {}
  }

  // ── Permission verify ──
  async function _verifyPermission(handle, mode = 'readwrite') {
    const opts = { mode };
    if (await handle.queryPermission(opts) === 'granted') return true;
    if (await handle.requestPermission(opts) === 'granted') return true;
    return false;
  }

  // ── Scan directory ──
  async function _scanDir(handle) {
    const files = [];
    try {
      for await (const [name, entry] of handle.entries()) {
        if (entry.kind === 'file') {
          const file = await entry.getFile();
          files.push({ name, kind: 'file', size: file.size, lastModified: file.lastModified, handle: entry });
        } else if (entry.kind === 'directory') {
          files.push({ name, kind: 'directory' });
        }
      }
    } catch(e) { console.warn('[FSAgent] Scan error:', e); }
    return files.sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === 'directory' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  }

  // ── Notify UI ──
  function _emit(event, data) {
    document.dispatchEvent(new CustomEvent('fs-agent-' + event, { detail: data }));
  }

  // ══════════════════════════
  //  PUBLIC API
  // ══════════════════════════

  /** Check if File System Access API is supported */
  function isSupported() {
    return 'showDirectoryPicker' in window;
  }

  /**
   * Ask user to grant a folder. Persists handle.
   * @returns {boolean} success
   */
  async function grantAccess() {
    if (!isSupported()) {
      _status = 'unsupported';
      _emit('status', { status: 'unsupported' });
      return false;
    }
    try {
      const handle = await window.showDirectoryPicker({ mode: 'readwrite', startIn: 'documents' });
      _dirHandle  = handle;
      _folderName = handle.name;
      _status     = 'granted';
      await _saveHandle(handle);
      _fileCache  = await _scanDir(handle);
      _emit('status',  { status: 'granted', folder: _folderName });
      _emit('files',   { files: _fileCache });
      _renderFSPanel();
      return true;
    } catch(e) {
      if (e.name !== 'AbortError') console.warn('[FSAgent] grantAccess failed:', e);
      _status = 'denied';
      _emit('status', { status: 'denied' });
      return false;
    }
  }

  /**
   * On page load — restore persisted handle and verify permission.
   */
  async function restoreAccess() {
    if (!isSupported()) { _status = 'unsupported'; _renderFSPanel(); return; }
    const handle = await _loadHandle();
    if (!handle) { _status = 'idle'; _renderFSPanel(); return; }
    try {
      const ok = await _verifyPermission(handle, 'readwrite');
      if (ok) {
        _dirHandle  = handle;
        _folderName = handle.name;
        _status     = 'granted';
        _fileCache  = await _scanDir(handle);
        _emit('status', { status: 'granted', folder: _folderName });
        _emit('files',  { files: _fileCache });
      } else {
        _status = 'idle'; // needs manual re-grant
        await _clearHandle();
      }
    } catch(e) {
      _status = 'idle';
      await _clearHandle();
    }
    _renderFSPanel();
  }

  /** Revoke access and clear persisted handle */
  async function revokeAccess() {
    _dirHandle  = null;
    _folderName = '';
    _status     = 'idle';
    _fileCache  = [];
    await _clearHandle();
    _emit('status', { status: 'idle' });
    _renderFSPanel();
  }

  /** Refresh file listing */
  async function refresh() {
    if (!_dirHandle) return;
    _fileCache = await _scanDir(_dirHandle);
    _emit('files', { files: _fileCache });
    _renderFSPanel();
  }

  /**
   * Read a file as text.
   * @param {string} filename
   * @returns {string|null}
   */
  async function readFile(filename) {
    if (!_dirHandle) return null;
    try {
      const fileHandle = await _dirHandle.getFileHandle(filename);
      const file       = await fileHandle.getFile();
      return await file.text();
    } catch(e) {
      console.warn('[FSAgent] readFile failed:', filename, e);
      return null;
    }
  }

  /**
   * Write text content to a file in the granted folder.
   * Creates the file if it doesn't exist.
   * @param {string} filename
   * @param {string} content
   * @returns {boolean} success
   */
  async function writeFile(filename, content) {
    if (!_dirHandle) return false;
    try {
      const fileHandle = await _dirHandle.getFileHandle(filename, { create: true });
      const writable   = await fileHandle.createWritable();
      await writable.write(content);
      await writable.close();
      await refresh();
      return true;
    } catch(e) {
      console.warn('[FSAgent] writeFile failed:', filename, e);
      return false;
    }
  }

  /**
   * Read a file as base64 (for images/binary).
   * @param {string} filename
   * @returns {{ b64: string, mimeType: string }|null}
   */
  async function readFileAsBase64(filename) {
    if (!_dirHandle) return null;
    try {
      const fileHandle = await _dirHandle.getFileHandle(filename);
      const file       = await fileHandle.getFile();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve({ b64: reader.result.split(',')[1], mimeType: file.type || 'text/plain' });
        reader.readAsDataURL(file);
      });
    } catch(e) { return null; }
  }

  /**
   * Get current file list.
   */
  function getFiles() { return _fileCache; }

  /** Get current status */
  function getStatus() { return { status: _status, folder: _folderName, files: _fileCache }; }

  // ══════════════════════════
  //  AUTO-PATCH DETECTOR
  //  Watches Nivi replies for FILE: / FIND: / REPLACE: pattern
  //  and auto-writes to disk
  // ══════════════════════════

  window._fsAgentPatchQueue = [];

  /**
   * Parse and apply patches from a Nivi response.
   * Pattern:
   *   FILE: filename.ext
   *   FIND:
   *   ```
   *   (old content or FULL_FILE)
   *   ```
   *   REPLACE:
   *   ```
   *   (new content)
   *   ```
   */
  async function applyPatchFromText(text) {
    if (_status !== 'granted') return;

    // Match full-file replacement: FILE: x.js\nFULL:\n```\n...\n```
    const fullPattern = /FILE:\s*([^\n]+)\nFULL:\s*\n```[^\n]*\n([\s\S]*?)```/gm;
    let match;
    const applied = [];

    while ((match = fullPattern.exec(text)) !== null) {
      const filename = match[1].trim();
      const content  = match[2];
      const ok = await writeFile(filename, content);
      if (ok) applied.push({ file: filename, type: 'full' });
    }

    // Match find-replace: FILE: x.js\nFIND:\n```...\n```\nREPLACE:\n```...\n```
    const patchPattern = /FILE:\s*([^\n]+)\nFIND:\s*\n```[^\n]*\n([\s\S]*?)```\s*\nREPLACE:\s*\n```[^\n]*\n([\s\S]*?)```/gm;
    while ((match = patchPattern.exec(text)) !== null) {
      const filename = match[1].trim();
      const findStr  = match[2];
      const replStr  = match[3];
      const existing = await readFile(filename);
      if (existing === null) continue;
      if (!existing.includes(findStr.trim())) {
        console.warn('[FSAgent] FIND block not found in', filename);
        continue;
      }
      const newContent = existing.replace(findStr.trim(), replStr.trimEnd());
      const ok = await writeFile(filename, newContent);
      if (ok) applied.push({ file: filename, type: 'patch' });
    }

    if (applied.length > 0) {
      _showPatchBanner(applied);
    }
  }

  function _showPatchBanner(applied) {
    const existing = document.getElementById('fs-patch-banner');
    if (existing) existing.remove();
    const banner = document.createElement('div');
    banner.id = 'fs-patch-banner';
    banner.className = 'fs-patch-banner';
    banner.innerHTML = `
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
      <span>Applied to disk: <strong>${applied.map(a => a.file).join(', ')}</strong></span>
      <button onclick="this.parentElement.remove()" style="margin-left:auto;background:none;border:none;color:inherit;cursor:pointer;opacity:.6;font-size:13px;">×</button>
    `;
    document.getElementById('chatWrap')?.appendChild(banner);
    setTimeout(() => banner?.remove(), 6000);
  }

  // ══════════════════════════
  //  SIDEBAR PANEL RENDERER
  // ══════════════════════════

  function _renderFSPanel() {
    const panel = document.getElementById('fs-agent-panel');
    if (!panel) return;

    const TEXT_EXTS = ['js','html','css','json','txt','md','py','csv','ts','jsx','tsx'];

    if (!isSupported()) {
      panel.innerHTML = `<div class="si" style="opacity:.45;cursor:default;font-size:10px;color:var(--red);">Not supported in this browser</div>`;
      return;
    }

    if (_status === 'idle') {
      panel.innerHTML = `
        <button class="fs-grant-btn" onclick="FSAgent.grantAccess()">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
            <line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/>
          </svg>
          Grant Folder Access
        </button>
        <div style="font-size:10px;color:var(--text-muted);padding:4px 5px;line-height:1.5;">
          Grant once — Nivi reads & writes files directly. No re-upload needed.
        </div>`;
      return;
    }

    if (_status === 'granted') {
      const fileItems = _fileCache.filter(f => f.kind === 'file').map(f => {
        const ext = f.name.split('.').pop().toLowerCase();
        const isText = TEXT_EXTS.includes(ext);
        const sn  = encodeURIComponent(f.name);
        const sz  = f.size < 1024 ? f.size + ' B' : (f.size / 1024).toFixed(1) + ' KB';
        return `
          <div class="si" style="position:relative;" title="${f.name}"
            onmouseenter="this.querySelector('.fs-fdel').style.opacity='1'"
            onmouseleave="this.querySelector('.fs-fdel').style.opacity='0'">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--accent-lt);flex-shrink:0;cursor:pointer;" onclick="FSAgent.openInArtifact(decodeURIComponent('${sn}'))">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;cursor:pointer;" onclick="FSAgent.openInArtifact(decodeURIComponent('${sn}'))">${f.name}</span>
            <span style="font-size:9px;color:var(--text-muted);flex-shrink:0;">${sz}</span>
            <button class="fs-fdel" onclick="event.stopPropagation();FSAgent.sendToChat(decodeURIComponent('${sn}'))"
              title="Send to chat" style="opacity:0;background:none;border:none;color:var(--accent-lt);cursor:pointer;padding:0;display:flex;align-items:center;flex-shrink:0;transition:opacity .15s;">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
            </button>
          </div>`;
      }).join('');

      const dirItems = _fileCache.filter(f => f.kind === 'directory').map(f => `
        <div class="si" style="opacity:.6;cursor:default;">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--amber);flex-shrink:0;">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
          </svg>
          <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${f.name}/</span>
        </div>`).join('');

      panel.innerHTML = `
        <div class="fs-folder-pill">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--accent-lt);flex-shrink:0;">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
          </svg>
          <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:11px;color:var(--accent-lt);">${_folderName}</span>
          <button onclick="FSAgent.refresh()" title="Refresh" style="background:none;border:none;color:var(--text-muted);cursor:pointer;padding:2px;display:flex;align-items:center;transition:.15s;" onmouseover="this.style.color='var(--text)'" onmouseout="this.style.color='var(--text-muted)'">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
          </button>
          <button onclick="FSAgent.revokeAccess()" title="Revoke" style="background:none;border:none;color:var(--text-muted);cursor:pointer;padding:2px;display:flex;align-items:center;transition:.15s;" onmouseover="this.style.color='var(--red)'" onmouseout="this.style.color='var(--text-muted)'">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        ${dirItems}${fileItems}
        ${_fileCache.length === 0 ? '<div class="si" style="opacity:.4;cursor:default;font-size:10px;">Folder is empty</div>' : ''}
      `;
    }
  }

  // ── Open a local file in Nivi's artifact panel ──
  async function openInArtifact(filename) {
    const ext  = filename.split('.').pop().toLowerCase();
    const isBinary = ['png','jpg','jpeg','gif','webp','pdf'].includes(ext);
    
    let b64 = '';
    let mime = window.getFileMimeType ? window.getFileMimeType(filename) : 'text/plain';

    if (isBinary) {
      const res = await readFileAsBase64(filename);
      if (!res) { alert('Could not read binary file: ' + filename); return; }
      b64 = res.b64;
      mime = res.mimeType || mime;
    } else {
      const content = await readFile(filename);
      if (content === null) { alert('Could not read file: ' + filename); return; }
      b64  = btoa(unescape(encodeURIComponent(content)));
    }
    
    if (typeof openArt === 'function') openArt({ name: filename, type: mime }, b64);
  }

  // ── Send file content to chat input ──
  async function sendToChat(filename) {
    const content = await readFile(filename);
    if (content === null) return;
    const inp = document.getElementById('mainInput');
    if (inp) {
      inp.value = `📁 ${filename}\n\`\`\`\n${content.slice(0, 6000)}\n\`\`\`\n`;
      inp.style.height = 'auto';
      inp.style.height = Math.min(inp.scrollHeight, 170) + 'px';
      inp.focus();
    }
  }

  // ══════════════════════════
  //  INIT
  // ══════════════════════════
  document.addEventListener('DOMContentLoaded', () => {
    restoreAccess();
  });

  // Hook into Nivi response stream for auto-patch
  const _origUpdateMsg = window.updateMsg;
  // We do not override updateMsg here to avoid timing issues.
  // Instead, TaskManager hooks in after final message via 'nivi-message-final'
  document.addEventListener('nivi-message-final', async (e) => {
    if (_status === 'granted' && e.detail?.text) {
      await applyPatchFromText(e.detail.text);
    }
  });

  return {
    isSupported,
    grantAccess,
    restoreAccess,
    revokeAccess,
    refresh,
    readFile,
    writeFile,
    readFileAsBase64,
    getFiles,
    getStatus,
    openInArtifact,
    sendToChat,
    applyPatchFromText,
  };
})();
