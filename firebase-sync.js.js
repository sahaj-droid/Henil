// ========================================
// FIREBASE SYNC MODULE — RealTradePro v3.0 & Nivi Pro
// Handles: Save/Load user data to/from Firebase, Auto-sync debouncing
// ========================================

// ======================================
// 1. SAVE USER DATA TO FIREBASE (RTP OLD LOGIC)
// ======================================
async function saveUserData(field = null) {
  if (!AppState.currentUser) return;
  if (AppState._syncInProgress) return;
  
  AppState._syncInProgress = true;
  
  try {
    const userRef = db.collection('users').doc(AppState.currentUser.userId);
    const data = {};
    
    if (field === null || field === 'watchlists') data.watchlists = AppState.watchlists;
    if (field === null || field === 'holdings') data.holdings = AppState.h;
    if (field === null || field === 'history') data.history = AppState.hist;
    if (field === null || field === 'alerts') data.alerts = AppState.alerts;
    if (field === null || field === 'settings') {
      data.settings = {
        apiUrl: localStorage.getItem('customAPI') || '',
        sheetId: localStorage.getItem('sheetId') || '',
        geminiKey: localStorage.getItem('geminiApiKey') ? '***' : '',
        refreshSec: parseInt(localStorage.getItem('refreshSec')) || 10
      };
    }
    
    data.lastUpdated = firebase.firestore.FieldValue.serverTimestamp();
    await userRef.set(data, { merge: true });
    
    AppState._lastSyncTime = Date.now();
    localStorage.setItem('lastCloudSync', AppState._lastSyncTime.toString());
  } catch (e) {
    console.error('saveUserData error:', e);
  } finally {
    AppState._syncInProgress = false;
  }
}

function triggerAutoSync(field) {
  if (AppState._syncDebounceTimer) clearTimeout(AppState._syncDebounceTimer);
  AppState._syncDebounceTimer = setTimeout(() => saveUserData(field), 2000);
}

// ... (તમારા જૂના pushToCloud અને pullFromCloud અહી એઝ-ઈટ-ઈઝ રહેશે) ...


// =======================================================
// 🚀 2. NIVI WORKSPACE MODULE (NEW)
// =======================================================

// A. પ્રોજેક્ટ ક્લાઉડમાંથી ખેંચો (Load Workspaces)
async function fetchCloudWorkspaces() {
  if (!AppState.currentUser) return;
  try {
    const snap = await db.collection('users').doc(AppState.currentUser.userId).collection('workspaces').get();
    let projs = [];
    snap.forEach(doc => { projs.push({ id: doc.id, ...doc.data() }); });
    
    localStorage.setItem('nivi_projects', JSON.stringify(projs));
    if (typeof renderProjectsUI === 'function') renderProjectsUI();
  } catch (e) { console.error("Error fetching workspaces:", e); }
}

// B. નવો પ્રોજેક્ટ બનાવો (Create Workspace)
async function createCloudWorkspace(projId, projName) {
  if (!AppState.currentUser) return;
  try {
    await db.collection('users').doc(AppState.currentUser.userId).collection('workspaces').doc(projId).set({
        name: projName,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    console.log("✅ Workspace initialized in Firebase.");
    // નવો પ્રોજેક્ટ બન્યા પછી તરત લિસ્ટ અપડેટ કરો
    fetchCloudWorkspaces(); 
  } catch (e) { console.error("Error creating workspace:", e); }
}

// C. ફાઈલ અપલોડ કરો (Save File to Active Project)
async function saveFileToCloudWorkspace(projId, fileName, mimeType, base64Data) {
  if (!AppState.currentUser || projId === 'default') {
      console.warn("No active project or user not logged in. Saving to local only.");
      return;
  }
  
  const syncUI = document.getElementById('syncStatusUI');
  if(syncUI) { syncUI.innerText = '⟳ Syncing...'; syncUI.style.color = '#f59e0b'; }

  try {
    // Note: Firestore has 1MB limit per document. Good for Code/Text files.
    const fileId = 'file_' + Date.now();
    await db.collection('users').doc(AppState.currentUser.userId)
            .collection('workspaces').doc(projId)
            .collection('files').doc(fileId).set({
        name: fileName,
        mimeType: mimeType,
        data: base64Data, 
        uploadedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    console.log("✅ File saved to Firebase.");
    if(syncUI) { syncUI.innerText = '● Firebase Connected'; syncUI.style.color = '#22c55e'; }
    
    // ફાઈલ અપલોડ થયા પછી સાઇડબાર અપડેટ કરો
    syncWorkspaceFiles(projId);
  } catch (e) {
    console.error("Error saving file to Firebase:", e);
    if(syncUI) { syncUI.innerText = '⚠ Sync Error'; syncUI.style.color = '#ef4444'; }
  }
}

// D. પ્રોજેક્ટ બદલતી વખતે ફાઈલો ખેંચો (Load Files on Switch)
async function syncWorkspaceFiles(projId) {
   if (!AppState.currentUser || projId === 'default') {
       localStorage.setItem('nivi_file_memory', '[]');
       if (typeof renderSidebarData === 'function') renderSidebarData();
       return;
   }

   const syncUI = document.getElementById('syncStatusUI');
   if(syncUI) { syncUI.innerText = '⟳ Loading Files...'; syncUI.style.color = '#f59e0b'; }

   try {
       const snap = await db.collection('users').doc(AppState.currentUser.userId)
            .collection('workspaces').doc(projId)
            .collection('files').get();
       
       let files = [];
       snap.forEach(doc => files.push({ id: doc.id, ...doc.data() }));
       
       // સાઇડબાર અને મેમરીમાં અપડેટ કરો 
       localStorage.setItem('nivi_file_memory', JSON.stringify(files));
       if (typeof renderSidebarData === 'function') renderSidebarData();
       
       if(syncUI) { syncUI.innerText = '● Firebase Connected'; syncUI.style.color = '#22c55e'; }
   } catch (e) {
       console.error("Error syncing workspace files:", e);
       if(syncUI) { syncUI.innerText = '⚠ Load Error'; syncUI.style.color = '#ef4444'; }
   }
}

// ======================================
// REGISTER FUNCTIONS TO WINDOW
// ======================================
window.saveUserData = saveUserData;
window.triggerAutoSync = triggerAutoSync;

// Nivi Exports
window.fetchCloudWorkspaces = fetchCloudWorkspaces;
window.createCloudWorkspace = createCloudWorkspace;
window.saveFileToCloudWorkspace = saveFileToCloudWorkspace;
window.syncWorkspaceFiles = syncWorkspaceFiles;

console.log('✅ firebase-sync.js loaded with Nivi Workspaces');