// ========================================
// FIREBASE SYNC MODULE — Nivi Pro v2.0
// Nivi-specific: No auth required, userId hardcoded from localStorage
// ========================================

// ── Nivi User ID — localStorage thi fetch, fallback fixed ID ──
function _getNiviUserId() {
  const saved = localStorage.getItem('nivi_user_id');
  if (saved && !/^user_\d+_[a-z0-9]{6}$/i.test(saved)) return saved;
  localStorage.setItem('nivi_user_id', 'user_1774995803095');
  return 'user_1774995803095';
}

// ── NIVI CHAT SAVE TO FIREBASE (PRO FIX APPLIED 🛠️) ──
async function saveNiviChat(chatHistory) {
  const userId = _getNiviUserId();
  try {
    let chatId = localStorage.getItem('nivi_current_session_id');
    if (!chatId) {
      chatId = 'session_' + Date.now();
      localStorage.setItem('nivi_current_session_id', chatId);
    }
    
// Empty array Firebase par save na karo — accidental overwrite rokvo
if (chatHistory.length === 0) {
  // Empty = Firebase par delete karo, skip nahi
  if (window.NiviDB) {
    try { await NiviDB.saveChat('default', chatHistory); } catch(e) { console.warn('IDB chat save failed', e); }
  }
  await db.collection('users').doc(userId)
          .collection('niviChats').doc(chatId).delete();
  console.log('✅ Chat cleared from Firebase');
  return;
}

    // Save to IndexedDB first
    if (window.NiviDB) {
      try { await NiviDB.saveChat('default', chatHistory); } catch(e) { console.warn('IDB chat save failed', e); }
    }

    await db.collection('users').doc(userId)
            .collection('niviChats').doc(chatId).set({
      messages: chatHistory,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      msgCount: chatHistory.length
    });
    
    console.log('✅ Nivi chat saved to Firebase (Count: ' + chatHistory.length + ')');
    _updateSyncUI('connected');
  } catch(e) {
    console.error('saveNiviChat error:', e);
    _updateSyncUI('error');
  }
}

// ── NIVI CHAT LOAD FROM FIREBASE ──
async function loadNiviChat() {
  const userId = _getNiviUserId();
  try {
    const chatId = localStorage.getItem('nivi_current_session_id');
    if (!chatId) return null; // koi session nahi — hero show thase

    // Try IndexedDB first
    if (window.NiviDB) {
      const localChat = await NiviDB.getChat('default');
      if (localChat && localChat.length > 0) {
        return localChat;
      }
    }

    const doc = await db.collection('users').doc(userId)
                        .collection('niviChats').doc(chatId).get();
    if (doc.exists && doc.data().messages) {
      const msgs = doc.data().messages;
      if (window.NiviDB && msgs && msgs.length > 0) {
        await NiviDB.saveChat('default', msgs); // sync back
      }
      return msgs;
    }
  } catch(e) {
    console.error('loadNiviChat error:', e);
  }
  return null;
}

// ── CHAT ARCHIVE SAVE (jyare New Chat click thay) ──
async function archiveNiviChat(chatHistory) {
  if (!chatHistory || chatHistory.length === 0) return;
  const userId = _getNiviUserId();
  try {
    const archiveId = 'archive_' + Date.now();
    await db.collection('users').doc(userId)
            .collection('niviChats').doc(archiveId).set({
      messages: chatHistory,
      archivedAt: firebase.firestore.FieldValue.serverTimestamp(),
      msgCount: chatHistory.length,
      type: 'archive'
    });
    console.log('✅ Chat archived to Firebase:', archiveId);
  } catch(e) {
    console.error('archiveNiviChat error:', e);
  }
}

// ── LOAD CHAT ARCHIVES LIST (sidebar history mate) ──
async function loadNiviChatArchives() {
  const userId = _getNiviUserId();
  try {
    const snap = await db.collection('users').doc(userId)
                         .collection('niviChats')
                         .where('type', '==', 'archive')
                         .orderBy('archivedAt', 'desc')
                         .limit(10).get();
    const archives = [];
    snap.forEach(doc => archives.push({ id: doc.id, ...doc.data() }));
    return archives;
  } catch(e) {
    console.error('loadNiviChatArchives error:', e);
    return [];
  }
}

// ── SYNC STATUS UI ──
function _updateSyncUI(state) {
  const el = document.getElementById('syncStatusUI');
  if (!el) return;
  if (state === 'connected') {
    el.className = 'status-chip on';
    el.innerHTML = '<span class="sdot"></span>Firebase';
  } else if (state === 'syncing') {
    el.className = 'status-chip';
    el.style.cssText = 'color:var(--amber);border-color:rgba(251,191,36,.2);background:rgba(251,191,36,.08);';
    el.innerHTML = '<span class="sdot" style="background:var(--amber)"></span>Syncing...';
  } else if (state === 'error') {
    el.className = 'status-chip';
    el.style.cssText = 'color:var(--red);border-color:rgba(248,113,113,.2);background:rgba(248,113,113,.08);';
    el.innerHTML = '<span class="sdot" style="background:var(--red)"></span>Sync Error';
  }
}

// ── AUTO SYNC — debounced (chat update thay tyare call thay) ──
let _syncTimer = null;
function triggerChatSync(chatHistory) {
  _updateSyncUI('syncing');
  if (_syncTimer) clearTimeout(_syncTimer);
  _syncTimer = setTimeout(() => saveNiviChat(chatHistory), 2500);
}

// ========================================
// WORKSPACE MODULE (existing — unchanged)
// ========================================
async function fetchCloudWorkspaces() {
  const userId = _getNiviUserId();
  try {
    const snap = await db.collection('users').doc(userId).collection('workspaces').get();
    let projs = [];
    snap.forEach(doc => { projs.push({ id: doc.id, ...doc.data() }); });
    localStorage.setItem('nivi_projects', JSON.stringify(projs));
    if (typeof renderProjectsUI === 'function') renderProjectsUI();
  } catch(e) { console.error('fetchCloudWorkspaces error:', e); }
}

async function createCloudWorkspace(projId, projName) {
  const userId = _getNiviUserId();
  try {
    await db.collection('users').doc(userId).collection('workspaces').doc(projId).set({
      name: projName,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    await fetchCloudWorkspaces();
  } catch(e) { console.error('createCloudWorkspace error:', e); }
}

async function deleteCloudWorkspace(projId) {
  if (!projId || projId === 'default') return;
  const userId = _getNiviUserId();
  try {
    const files = await db.collection('users').doc(userId)
      .collection('workspaces').doc(projId)
      .collection('files').get();
    const batch = db.batch();
    files.forEach(doc => batch.delete(doc.ref));
    batch.delete(db.collection('users').doc(userId).collection('workspaces').doc(projId));
    await batch.commit();
    await fetchCloudWorkspaces();
  } catch(e) { console.error('deleteCloudWorkspace error:', e); }
}

async function saveFileToCloudWorkspace(projId, fileName, mimeType, base64Data) {
  if (projId === 'default') return;
  const userId = _getNiviUserId();
  _updateSyncUI('syncing');
  try {
    const fileId = 'file_' + btoa(fileName).replace(/[^a-zA-Z0-9]/g, '_').slice(0, 40);
    await db.collection('users').doc(userId)
            .collection('workspaces').doc(projId)
            .collection('files').doc(fileId).set({
      name: fileName, mimeType,
      uploadedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    _updateSyncUI('connected');
    syncWorkspaceFiles(projId);
  } catch(e) {
    console.error('saveFileToCloudWorkspace error:', e);
    _updateSyncUI('error');
  }
}

async function syncWorkspaceFiles(projId) {
  if (projId === 'default') {
    localStorage.setItem('nivi_file_memory', '[]');
    if (typeof renderSidebarData === 'function') renderSidebarData();
    return;
  }
  const userId = _getNiviUserId();
  try {
    const snap = await db.collection('users').doc(userId)
                         .collection('workspaces').doc(projId)
                         .collection('files').get();
    let files = [];
    snap.forEach(doc => files.push({ id: doc.id, ...doc.data() }));
    localStorage.setItem('nivi_file_memory', JSON.stringify(files));
    if (typeof renderSidebarData === 'function') renderSidebarData();
    _updateSyncUI('connected');
  } catch(e) {
    console.error('syncWorkspaceFiles error:', e);
    _updateSyncUI('error');
  }
}

// ── OLD saveUserData — RTP compatibility ──
async function saveUserData(field = null) {
  if (field === 'history') {
    const history = JSON.parse(localStorage.getItem('niviTabChat') || '[]');
    // Debounce nahi — direct save karo (chat lose na thay)
    if (history.length > 0) {
      await saveNiviChat(history);
    }
  }
}
function triggerAutoSync(field) { saveUserData(field); }

// ── EXPORTS ──
window.saveUserData          = saveUserData;
window.triggerAutoSync       = triggerAutoSync;
window.saveNiviChat          = saveNiviChat;
window.loadNiviChat          = loadNiviChat;
window.archiveNiviChat       = archiveNiviChat;
window.loadNiviChatArchives  = loadNiviChatArchives;
window.triggerChatSync       = triggerChatSync;
window.fetchCloudWorkspaces  = fetchCloudWorkspaces;
window.createCloudWorkspace  = createCloudWorkspace;
window.deleteCloudWorkspace  = deleteCloudWorkspace;
window.saveFileToCloudWorkspace = saveFileToCloudWorkspace;
window.syncWorkspaceFiles    = syncWorkspaceFiles;

console.log('firebase-sync.js v2.0 loaded - Nivi Pro chat sync ready');

// ========================================
// PROJECT CHAT MODULE — Nivi Pro v2.1
// Isolated chat per project workspace
// ========================================

// ── Project-specific session ID ──
function _getProjectSessionId(projId) {
  const key = 'nivi_proj_session_' + projId;
  let sid = localStorage.getItem(key);
  if (!sid) {
    sid = 'psession_' + projId + '_' + Date.now();
    localStorage.setItem(key, sid);
  }
  return sid;
}

function _newProjectSessionId(projId) {
  const sid = 'psession_' + projId + '_' + Date.now();
  localStorage.setItem('nivi_proj_session_' + projId, sid);
  return sid;
}

// ── Save project chat ──
async function saveProjectChat(projId, chatHistory) {
  if (!projId || projId === 'default') return;
  if (!chatHistory || chatHistory.length === 0) return;
  const userId = _getNiviUserId();
  const sessionId = _getProjectSessionId(projId);
  try {
    _updateSyncUI('syncing');
    
    // Save to IndexedDB first
    if (window.NiviDB) {
      try { await NiviDB.saveChat(projId, chatHistory); } catch(e) { console.warn('IDB chat save failed', e); }
    }

    await db.collection('projectChats').doc(projId)
            .collection('sessions').doc(sessionId).set({
      userId,
      messages: chatHistory,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      msgCount: chatHistory.length
    });
    _updateSyncUI('connected');
    console.log('✅ Project chat saved:', projId, '|', sessionId);
  } catch(e) {
    console.error('saveProjectChat error:', e);
    _updateSyncUI('error');
  }
}

// ── Load project chat (latest session) ──
async function loadProjectChat(projId) {
  if (!projId || projId === 'default') return null;
  const userId = _getNiviUserId();
  const sessionId = _getProjectSessionId(projId);
  try {
    // Try IndexedDB first
    if (window.NiviDB) {
      const localChat = await NiviDB.getChat(projId);
      if (localChat && localChat.length > 0) {
        console.log('✅ Project chat loaded from IDB:', projId);
        return localChat;
      }
    }

    const doc = await db.collection('projectChats').doc(projId)
                        .collection('sessions').doc(sessionId).get();
    if (doc.exists && doc.data().messages && doc.data().messages.length > 0) {
      console.log('✅ Project chat loaded from Firebase:', projId);
      const msgs = doc.data().messages;
      if (window.NiviDB) await NiviDB.saveChat(projId, msgs); // sync back
      return msgs;
    }
  } catch(e) {
    console.error('loadProjectChat error:', e);
  }
  return null;
}

// ── Archive project chat (before new chat in project) ──
async function archiveProjectChat(projId, chatHistory) {
  if (!projId || projId === 'default') return;
  if (!chatHistory || chatHistory.length === 0) return;
  const userId = _getNiviUserId();
  const archiveId = 'parc_' + projId + '_' + Date.now();
  try {
    await db.collection('projectChats').doc(projId)
            .collection('sessions').doc(archiveId).set({
      userId,
      messages: chatHistory,
      archivedAt: firebase.firestore.FieldValue.serverTimestamp(),
      msgCount: chatHistory.length,
      type: 'archive'
    });
    console.log('✅ Project chat archived:', archiveId);
  } catch(e) {
    console.error('archiveProjectChat error:', e);
  }
}

// ── Clear project session (New Chat inside project) ──
function clearProjectSession(projId) {
  _newProjectSessionId(projId);
  localStorage.setItem('nivi_proj_chat_' + projId, '[]');
}

// ── Save project chat to localStorage (fast local backup) ──
function saveProjectChatLocal(projId, chatHistory) {
  if (!projId || projId === 'default') return;
  localStorage.setItem('nivi_proj_chat_' + projId, JSON.stringify(chatHistory));
}

function loadProjectChatLocal(projId) {
  if (!projId || projId === 'default') return [];
  try {
    return JSON.parse(localStorage.getItem('nivi_proj_chat_' + projId) || '[]');
  } catch(e) { return []; }
}

// ── Exports ──
window.saveProjectChat      = saveProjectChat;
window.loadProjectChat      = loadProjectChat;
window.archiveProjectChat   = archiveProjectChat;
window.clearProjectSession  = clearProjectSession;
window.saveProjectChatLocal = saveProjectChatLocal;
window.loadProjectChatLocal = loadProjectChatLocal;

console.log('Project Chat Module v2.1 loaded');

// ========================================
// INDEXEDDB MODULE — Nivi Pro v2.2
// File storage — no 5MB limit, fast local
// ========================================

const NiviDB = {
  _db: null,
  DB_NAME: 'NiviProDB',
  DB_VERSION: 2,
  STORE_FILES: 'projectFiles',
  STORE_CHATS: 'projectChats',

  // ── Open / Init DB ──
  async open() {
    if (this._db) return this._db;
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(this.DB_NAME, this.DB_VERSION);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(this.STORE_FILES)) {
          const store = db.createObjectStore(this.STORE_FILES, { keyPath: 'id' });
          store.createIndex('byProject', 'projId', { unique: false });
        }
        if (!db.objectStoreNames.contains(this.STORE_CHATS)) {
          db.createObjectStore(this.STORE_CHATS, { keyPath: 'projId' });
        }
      };
      req.onsuccess = (e) => { this._db = e.target.result; resolve(this._db); };
      req.onerror  = (e) => reject(e.target.error);
    });
  },

  // ── Save file to IndexedDB ──
  async saveFile(projId, fileName, mimeType, base64Data) {
    const db = await this.open();
    const id = projId + '::' + fileName; // unique per project+filename
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.STORE_FILES, 'readwrite');
      tx.objectStore(this.STORE_FILES).put({
        id, projId, name: fileName, mimeType,
        data: base64Data, savedAt: Date.now()
      });
      tx.oncomplete = () => resolve(true);
      tx.onerror    = (e) => reject(e.target.error);
    });
  },

  // ── Get all files for a project ──
  async getProjectFiles(projId) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.STORE_FILES, 'readonly');
      const idx = tx.objectStore(this.STORE_FILES).index('byProject');
      const req = idx.getAll(projId);
      req.onsuccess = () => resolve(req.result || []);
      req.onerror   = (e) => reject(e.target.error);
    });
  },

  // ── Delete one file ──
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

  // ── Delete all files for a project ──
  async deleteProjectFiles(projId) {
    const files = await this.getProjectFiles(projId);
    for (const f of files) await this.deleteFile(projId, f.name);
  },

  // ── Load project files into localStorage (Nivi context mate) ──
async syncToLocalMemory(projId) {
    try {
      const files = await this.getProjectFiles(projId);
      // ✅ FIX: project-aware key use karo — sidebar same key read kare che
      localStorage.setItem(`nivi_file_memory_${projId}`, JSON.stringify(files));
      if (typeof renderSidebarData === 'function') renderSidebarData();
      console.log(`✅ IndexedDB → LocalMemory synced: ${files.length} files for ${projId}`);
      return files;
    } catch(e) {
      console.error('syncToLocalMemory error:', e);
      return [];
    }
  },

  // ── Save chat to IndexedDB ──
  async saveChat(projId, messages) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.STORE_CHATS, 'readwrite');
      tx.objectStore(this.STORE_CHATS).put({
        projId,
        messages,
        savedAt: Date.now()
      });
      tx.oncomplete = () => resolve(true);
      tx.onerror    = (e) => reject(e.target.error);
    });
  },

  // ── Load chat from IndexedDB ──
  async getChat(projId) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.STORE_CHATS, 'readonly');
      const req = tx.objectStore(this.STORE_CHATS).get(projId);
      req.onsuccess = () => resolve(req.result ? req.result.messages : null);
      req.onerror   = (e) => reject(e.target.error);
    });
  },
// ── Delete chat from IndexedDB ──
async deleteChat(projId) {
  const db = await this.open();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(this.STORE_CHATS, 'readwrite');
    tx.objectStore(this.STORE_CHATS).delete(projId);
    tx.oncomplete = () => resolve(true);
    tx.onerror    = (e) => reject(e.target.error);
  });
}   // ← last method — comma નહીં
};  // ← NiviDB object બંધ

// ── Export ──
window.NiviDB = NiviDB;
console.log('NiviDB IndexedDB module loaded');
