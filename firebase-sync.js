// ══════════════════════════════════════════════════════════
//  NIVI — LOCAL-FIRST STORAGE (firebase-sync.js replacement)
//  Backend: IndexedDB (primary) + localStorage (fallback)
//  Firebase: REMOVED — no more data loss on refresh
//  Future: Google Drive integration ready (stubbed)
// ══════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════
//  INDEXEDDB MODULE — NiviDB
//  File storage — no 5MB limit, persists across refresh
// ══════════════════════════════════════════════════════════
const NiviDB = {
  _db: null,
  DB_NAME:     'NiviProDB',
  DB_VERSION:  3,
  STORE_FILES: 'projectFiles',
  STORE_CHATS: 'projectChats',
  STORE_META:  'projectMeta',

  async open() {
    if (this._db) return this._db;
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(this.DB_NAME, this.DB_VERSION);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(this.STORE_FILES)) {
          const s = db.createObjectStore(this.STORE_FILES, { keyPath: 'id' });
          s.createIndex('byProject', 'projId', { unique: false });
        }
        if (!db.objectStoreNames.contains(this.STORE_CHATS)) {
          db.createObjectStore(this.STORE_CHATS, { keyPath: 'projId' });
        }
        if (!db.objectStoreNames.contains(this.STORE_META)) {
          db.createObjectStore(this.STORE_META, { keyPath: 'key' });
        }
      };
      req.onsuccess = (e) => { this._db = e.target.result; resolve(this._db); };
      req.onerror   = (e) => reject(e.target.error);
    });
  },

  async saveFile(projId, fileName, mimeType, base64Data) {
    const db = await this.open();
    const id = projId + '::' + fileName;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.STORE_FILES, 'readwrite');
      tx.objectStore(this.STORE_FILES).put({ id, projId, name: fileName, mimeType, data: base64Data, savedAt: Date.now() });
      tx.oncomplete = () => resolve(true);
      tx.onerror    = (e) => reject(e.target.error);
    });
  },

  async getProjectFiles(projId) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx  = db.transaction(this.STORE_FILES, 'readonly');
      const idx = tx.objectStore(this.STORE_FILES).index('byProject');
      const req = idx.getAll(projId);
      req.onsuccess = () => resolve(req.result || []);
      req.onerror   = (e) => reject(e.target.error);
    });
  },

  async deleteFile(projId, fileName) {
    const db = await this.open();
    const id = projId + '::' + fileName;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.STORE_FILES, 'readwrite');
      tx.objectStore(this.STORE_FILES).delete(id);
      tx.oncomplete = () => resolve(true);
      tx.onerror    = (e) => reject(e.target.error);
    });
  },

  async deleteProjectFiles(projId) {
    const files = await this.getProjectFiles(projId);
    for (const f of files) await this.deleteFile(projId, f.name);
  },

  async syncToLocalMemory(projId) {
    try {
      const files = await this.getProjectFiles(projId);
      localStorage.setItem(`nivi_file_memory_${projId}`, JSON.stringify(files));
      if (typeof renderSidebarData === 'function') renderSidebarData();
      return files;
    } catch(e) {
      console.error('syncToLocalMemory error:', e);
      return [];
    }
  },

  async saveChat(projId, messages) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.STORE_CHATS, 'readwrite');
      tx.objectStore(this.STORE_CHATS).put({ projId, messages, savedAt: Date.now() });
      tx.oncomplete = () => resolve(true);
      tx.onerror    = (e) => reject(e.target.error);
    });
  },

  async getChat(projId) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx  = db.transaction(this.STORE_CHATS, 'readonly');
      const req = tx.objectStore(this.STORE_CHATS).get(projId);
      req.onsuccess = () => resolve(req.result ? req.result.messages : null);
      req.onerror   = (e) => reject(e.target.error);
    });
  },

  async deleteChat(projId) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.STORE_CHATS, 'readwrite');
      tx.objectStore(this.STORE_CHATS).delete(projId);
      tx.oncomplete = () => resolve(true);
      tx.onerror    = (e) => reject(e.target.error);
    });
  },

  async saveMeta(key, value) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.STORE_META, 'readwrite');
      tx.objectStore(this.STORE_META).put({ key, value, savedAt: Date.now() });
      tx.oncomplete = () => resolve(true);
      tx.onerror    = (e) => reject(e.target.error);
    });
  },

  async getMeta(key) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx  = db.transaction(this.STORE_META, 'readonly');
      const req = tx.objectStore(this.STORE_META).get(key);
      req.onsuccess = () => resolve(req.result ? req.result.value : null);
      req.onerror   = (e) => reject(e.target.error);
    });
  },
};
window.NiviDB = NiviDB;

// ══════════════════════════════════════════════════════════
//  PROJECTS — LocalStorage only, no Firebase
// ══════════════════════════════════════════════════════════

function _getProjects() {
  try { return JSON.parse(localStorage.getItem('nivi_projects') || '[]'); } catch(e) { return []; }
}
function _saveProjects(projs) {
  localStorage.setItem('nivi_projects', JSON.stringify(projs));
}

async function createCloudWorkspace(projId, projName) {
  const projs = _getProjects();
  if (!projs.find(p => p.id === projId)) {
    projs.push({ id: projId, name: projName, createdAt: Date.now() });
    _saveProjects(projs);
  }
  if (typeof renderProjectsUI === 'function') renderProjectsUI();
}

async function deleteCloudWorkspace(projId) {
  if (!projId || projId === 'default') return;
  let projs = _getProjects().filter(p => p.id !== projId);
  _saveProjects(projs);
  if (window.NiviDB) await NiviDB.deleteProjectFiles(projId).catch(() => {});
  if (typeof renderProjectsUI === 'function') renderProjectsUI();
}

async function fetchCloudWorkspaces() {
  // Local only — no remote fetch needed
  if (typeof renderProjectsUI === 'function') renderProjectsUI();
}

// ══════════════════════════════════════════════════════════
//  FILES — IndexedDB primary, NO Firebase, NO data loss
// ══════════════════════════════════════════════════════════

async function saveFileToCloudWorkspace(projId, fileName, mimeType, base64Data) {
  // Save to IndexedDB only — no Firebase
  try {
    await NiviDB.saveFile(projId, fileName, mimeType, base64Data);
  } catch(e) { console.warn('IDB file save failed:', e); }
  // Sync to localStorage for sidebar
  await syncWorkspaceFiles(projId);
}

async function syncWorkspaceFiles(projId) {
  // ⛔ OLD BUG: used to clear files — FIXED: only reads from IDB
  if (!projId) return;
  try {
    const files = await NiviDB.getProjectFiles(projId);
    // Update localStorage sidebar cache without wiping anything
    if (files.length > 0) {
      localStorage.setItem(`nivi_file_memory_${projId}`, JSON.stringify(files));
    }
    if (typeof renderSidebarData === 'function') renderSidebarData();
  } catch(e) {
    console.warn('syncWorkspaceFiles error:', e);
    // Fallback: just render with what's in localStorage — never wipe
    if (typeof renderSidebarData === 'function') renderSidebarData();
  }
}

// ══════════════════════════════════════════════════════════
//  CHAT — IndexedDB primary + localStorage backup
// ══════════════════════════════════════════════════════════

async function saveNiviChat(chatHistory) {
  try {
    // Save to IndexedDB (always — even empty array, to clear deleted msgs)
    await NiviDB.saveChat('default', chatHistory);
    // Always sync localStorage so deletions persist
    localStorage.setItem('niviTabChat', JSON.stringify(chatHistory));
    _updateSyncUI('connected');
  } catch(e) {
    console.warn('saveNiviChat error:', e);
    // Fallback to localStorage only
    localStorage.setItem('niviTabChat', JSON.stringify(chatHistory));
    _updateSyncUI('local');
  }
}

async function loadNiviChat() {
  try {
    // Try IndexedDB first
    const idbChat = await NiviDB.getChat('default');
    if (idbChat && idbChat.length > 0) return idbChat;
  } catch(e) { console.warn('IDB load failed, falling back to localStorage'); }
  // Fallback to localStorage
  try {
    const local = JSON.parse(localStorage.getItem('niviTabChat') || '[]');
    // Backfill IndexedDB if localStorage has data
    if (local.length > 0) {
      await NiviDB.saveChat('default', local).catch(() => {});
    }
    return local.length > 0 ? local : null;
  } catch(e) { return null; }
}

async function archiveNiviChat(chatHistory) {
  if (!chatHistory || chatHistory.length === 0) return;
  try {
    const archiveKey = `nivi_chat_archives_default`;
    let archives = [];
    try { archives = JSON.parse(localStorage.getItem(archiveKey) || '[]'); } catch(e) {}
    archives.unshift({
      id: Date.now(),
      msgCount: chatHistory.length,
      chat: chatHistory,
      title: localStorage.getItem('nivi_current_title') || 'Chat'
    });
    if (archives.length > 30) archives = archives.slice(0, 30);
    localStorage.setItem(archiveKey, JSON.stringify(archives));
    // Also save to IDB meta for larger archive storage
    await NiviDB.saveMeta('chat_archives_default', archives).catch(() => {});
  } catch(e) { console.warn('archiveNiviChat error:', e); }
}

async function loadNiviChatArchives() {
  try {
    // Try IDB first (can store more)
    const idbArchives = await NiviDB.getMeta('chat_archives_default');
    if (idbArchives && idbArchives.length > 0) return idbArchives;
  } catch(e) {}
  try {
    return JSON.parse(localStorage.getItem('nivi_chat_archives_default') || '[]');
  } catch(e) { return []; }
}

// ── Sync (now just saves to IDB + localStorage) ──
async function syncNiviChat(chatHistory) {
  await saveNiviChat(chatHistory);
}

let _syncTimer = null;
function triggerChatSync(chatHistory) {
  _updateSyncUI('local');
  if (_syncTimer) clearTimeout(_syncTimer);
  _syncTimer = setTimeout(() => saveNiviChat(chatHistory), 1500);
}

// ── Old saveUserData compat ──
async function saveUserData(field = null) {
  if (field === 'history') {
    const history = JSON.parse(localStorage.getItem('niviTabChat') || '[]');
    if (history.length > 0) await saveNiviChat(history);
  }
}
function triggerAutoSync(field) { saveUserData(field); }

// ══════════════════════════════════════════════════════════
//  PROJECT CHATS — IndexedDB only
// ══════════════════════════════════════════════════════════

function _getProjectSessionId(projId) {
  const key = 'nivi_proj_session_' + projId;
  let sid = localStorage.getItem(key);
  if (!sid) { sid = 'psession_' + projId + '_' + Date.now(); localStorage.setItem(key, sid); }
  return sid;
}
function _newProjectSessionId(projId) {
  const sid = 'psession_' + projId + '_' + Date.now();
  localStorage.setItem('nivi_proj_session_' + projId, sid);
  return sid;
}

async function saveProjectChat(projId, chatHistory) {
  if (!projId || projId === 'default') return;
  if (!chatHistory) return;
  // Allow saving empty array — needed so deleted messages don't reappear
  try {
    await NiviDB.saveChat(projId, chatHistory);
    localStorage.setItem('nivi_proj_chat_' + projId, JSON.stringify(chatHistory));
    _updateSyncUI('connected');
  } catch(e) {
    console.warn('saveProjectChat error:', e);
    localStorage.setItem('nivi_proj_chat_' + projId, JSON.stringify(chatHistory));
  }
}

async function loadProjectChat(projId) {
  if (!projId || projId === 'default') return null;
  try {
    const idbChat = await NiviDB.getChat(projId);
    if (idbChat && idbChat.length > 0) return idbChat;
  } catch(e) {}
  try {
    const local = JSON.parse(localStorage.getItem('nivi_proj_chat_' + projId) || '[]');
    if (local.length > 0) { await NiviDB.saveChat(projId, local).catch(() => {}); }
    return local.length > 0 ? local : null;
  } catch(e) { return null; }
}

async function archiveProjectChat(projId, chatHistory) {
  if (!projId || projId === 'default') return;
  if (!chatHistory || chatHistory.length === 0) return;
  const archiveKey = `nivi_chat_archives_${projId}`;
  let archives = [];
  try { archives = JSON.parse(localStorage.getItem(archiveKey) || '[]'); } catch(e) {}
  archives.unshift({ id: Date.now(), msgCount: chatHistory.length, chat: chatHistory, title: localStorage.getItem('nivi_current_title') || 'Chat' });
  if (archives.length > 20) archives = archives.slice(0, 20);
  localStorage.setItem(archiveKey, JSON.stringify(archives));
  await NiviDB.saveMeta('chat_archives_' + projId, archives).catch(() => {});
}

function clearProjectSession(projId) {
  _newProjectSessionId(projId);
  localStorage.setItem('nivi_proj_chat_' + projId, '[]');
  NiviDB.deleteChat(projId).catch(() => {});
}
function saveProjectChatLocal(projId, chatHistory) {
  if (!projId || projId === 'default') return;
  localStorage.setItem('nivi_proj_chat_' + projId, JSON.stringify(chatHistory));
}
function loadProjectChatLocal(projId) {
  if (!projId || projId === 'default') return [];
  try { return JSON.parse(localStorage.getItem('nivi_proj_chat_' + projId) || '[]'); } catch(e) { return []; }
}

// ══════════════════════════════════════════════════════════
//  STATUS UI — Shows "Local" instead of Firebase
// ══════════════════════════════════════════════════════════
function _updateSyncUI(state) {
  const el = document.getElementById('syncStatusUI');
  if (!el) return;
  if (state === 'connected' || state === 'local') {
    el.className = 'status-chip on';
    el.innerHTML = '<span class="sdot"></span>Local IDB';
  } else if (state === 'syncing') {
    el.className = 'status-chip';
    el.style.cssText = 'color:var(--amber);border-color:rgba(251,191,36,.2);background:rgba(251,191,36,.08);';
    el.innerHTML = '<span class="sdot" style="background:var(--amber)"></span>Saving…';
  }
}

// ══════════════════════════════════════════════════════════
//  EXPORTS
// ══════════════════════════════════════════════════════════
window.saveUserData           = saveUserData;
window.triggerAutoSync        = triggerAutoSync;
window.saveNiviChat           = saveNiviChat;
window.loadNiviChat           = loadNiviChat;
window.archiveNiviChat        = archiveNiviChat;
window.loadNiviChatArchives   = loadNiviChatArchives;
window.syncNiviChat           = syncNiviChat;
window.triggerChatSync        = triggerChatSync;
window.fetchCloudWorkspaces   = fetchCloudWorkspaces;
window.createCloudWorkspace   = createCloudWorkspace;
window.deleteCloudWorkspace   = deleteCloudWorkspace;
window.saveFileToCloudWorkspace = saveFileToCloudWorkspace;
window.syncWorkspaceFiles     = syncWorkspaceFiles;
window.saveProjectChat        = saveProjectChat;
window.loadProjectChat        = loadProjectChat;
window.archiveProjectChat     = archiveProjectChat;
window.clearProjectSession    = clearProjectSession;
window.saveProjectChatLocal   = saveProjectChatLocal;
window.loadProjectChatLocal   = loadProjectChatLocal;

// Init: show local status on load
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => _updateSyncUI('connected'), 500);
});

console.log('✅ Nivi Local-First Storage v3.0 loaded — Firebase removed, IndexedDB only');
