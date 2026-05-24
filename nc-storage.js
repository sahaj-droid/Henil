// ══════════════════════════════════════════════════════════
//  NC-STORAGE — IndexedDB / localStorage file persistence
// ══════════════════════════════════════════════════════════

// ── INDEXEDDB FILE SAVE ──
async function saveFileToMemory(filename, base64Data, mimeType) {
  const projId = document.getElementById('activeProjectSelect')?.value ||
                 window._activeProjectId || 'default';

  // Primary: IndexedDB (supports large files)
  if (window.NiviDB) {
    try {
      await NiviDB.saveFile(projId, filename, mimeType, base64Data);
    } catch(e) {
      console.warn('IndexedDB save failed, falling back to localStorage:', e);
    }
  }

  // Secondary: localStorage — project-aware key, truncate large payloads
  const _fileKey = `nivi_file_memory_${projId}`;
  let files = JSON.parse(localStorage.getItem(_fileKey) || '[]');
  const idx = files.findIndex(f => f.name === filename);
  const isLarge = base64Data && base64Data.length > 500000;
  const entry = {
    name: filename, ts: Date.now(),
    data: isLarge ? null : base64Data,
    mimeType: mimeType || 'text/plain', projId,
    idbOnly: isLarge,
  };
  if (idx >= 0) files[idx] = entry; else files.push(entry);
  try {
    localStorage.setItem(_fileKey, JSON.stringify(files));
  } catch(e) {
    // localStorage quota hit — keep metadata, drop binary data
    files = files.map(f => ({ ...f, data: null, idbOnly: true }));
    try { localStorage.setItem(_fileKey, JSON.stringify(files)); } catch(_) {}
  }

  // Await the async cloud backup
  if (projId !== 'default' && typeof saveFileToCloudWorkspace === 'function') {
    await saveFileToCloudWorkspace(projId, filename, mimeType, base64Data);
  }

  if (typeof renderSidebarData === 'function') renderSidebarData();
}
