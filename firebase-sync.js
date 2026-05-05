// ========================================
// FIREBASE SYNC MODULE — Nivi Pro v2.0
// Nivi-specific: No auth required, userId hardcoded from localStorage
// ========================================

// ── Nivi User ID — localStorage thi fetch, fallback fixed ID ──
function _getNiviUserId() {
  return localStorage.getItem('nivi_user_id') || 'user_1774995803095';
}

// ── NIVI CHAT SAVE TO FIREBASE (PRO FIX APPLIED 🛠️) ──
async function saveNiviChat(chatHistory) {
  const userId = _getNiviUserId();
  try {
    const chatId = 'session_' + new Date().toISOString().split('T')[0]; // daily session
    
    // 💥 અસલી Solution: જો ચેટ ખાલી હોય તો રિટર્ન થવાના બદલે ખાલી એરે સેવ કરો (જૂનો કચરો કાઢવા)
    const validChat = chatHistory ? chatHistory : [];

    await db.collection('users').doc(userId)
            .collection('niviChats').doc(chatId).set({
      messages: validChat,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      msgCount: validChat.length
    }, { merge: true });
    
    console.log('✅ Nivi chat saved to Firebase (Count: ' + validChat.length + ')');
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
    const chatId = 'session_' + new Date().toISOString().split('T')[0];
    const doc = await db.collection('users').doc(userId)
                        .collection('niviChats').doc(chatId).get();
    if (doc.exists && doc.data().messages) {
      return doc.data().messages;
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
    fetchCloudWorkspaces();
  } catch(e) { console.error('createCloudWorkspace error:', e); }
}

async function saveFileToCloudWorkspace(projId, fileName, mimeType, base64Data) {
  if (projId === 'default') return;
  const userId = _getNiviUserId();
  _updateSyncUI('syncing');
  try {
    const fileId = 'file_' + Date.now();
    await db.collection('users').doc(userId)
            .collection('workspaces').doc(projId)
            .collection('files').doc(fileId).set({
      name: fileName, mimeType, data: base64Data,
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
    triggerChatSync(history);
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
window.saveFileToCloudWorkspace = saveFileToCloudWorkspace;
window.syncWorkspaceFiles    = syncWorkspaceFiles;

console.log('✅ firebase-sync.js v2.0 loaded — Nivi Pro chat sync ready');
