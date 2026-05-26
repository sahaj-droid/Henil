// ══════════════════════════════════════════════════════════
//  NC-UI — UI Helpers, Sidebar, Workspace / Projects
// ══════════════════════════════════════════════════════════

// ── UI HELPERS ──
window.handleKey = function(e) {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); document.getElementById('sendBtn').click(); }
};

function qp(t) {
  document.getElementById('mainInput').value = t;
  document.getElementById('mainInput').focus();
}

window.toggleGen = function(g) {
  const stopBtn = document.getElementById('stopBtn');
  const sendBtn = document.getElementById('sendBtn');
  if (stopBtn) stopBtn.style.display = g ? 'flex' : 'none';
  if (sendBtn) sendBtn.style.display = g ? 'none' : 'flex';
  if (window.AppState) window.AppState._isGenerating = g;
};

window.toggleSearchGrounding = function() {
  if (!window.AppState) window.AppState = {};
  window.AppState.useSearch = !window.AppState.useSearch;
  const btn = document.getElementById('searchToggleBtn');
  if (btn) {
    if (window.AppState.useSearch) {
      btn.classList.add('search-active');
    } else {
      btn.classList.remove('search-active');
    }
  }
};

window.stopGeneration = function() {
  window.toggleGen(false);
  if (window.AppState?._abortController) {
    window.AppState._abortController.abort();
  }
  if (window.AppState) window.AppState._abortController = null;
  // Remove any stuck "Thinking" animations immediately
  document.querySelectorAll('.thinking').forEach(el => {
    const msgId = el.closest('.bubble')?.id;
    if (msgId) updateMsg(msgId, '<span class="msg-stopped">[Stopped by user]</span>');
  });
};

function toggleSidebar() {
  const s = document.getElementById('sidebar');
  if (window.innerWidth <= 768) {
    const isOpen = s.classList.toggle('mob-open');
    document.getElementById('mobOverlay')?.classList.toggle('open', isOpen);
  } else {
    s.classList.toggle('collapsed');
  }
}

window.closeMobSidebar = function() {
  document.getElementById('sidebar')?.classList.remove('mob-open');
  document.getElementById('mobOverlay')?.classList.remove('open');
};

function openProjectModal() {
  document.getElementById('projectModal').classList.add('open');
  setTimeout(() => document.getElementById('newProjectName').focus(), 100);
}

function closeModal(id) {
  document.getElementById(id).classList.remove('open');
}

function updateActiveModelUI(respondingModel) {
  let models = [];
  try { models = JSON.parse(localStorage.getItem('nivi_model_chain') || '[]'); } catch(e) {}
  const btn = document.getElementById('modelPickerBtn');
  const lbl = document.getElementById('modelPickerLabel');
  if (!lbl) return;
  if (!models.length) { lbl.textContent = 'No model'; return; }
  const active = respondingModel
    ? models.find(m => (m.model || m.provider) === respondingModel)
    : models[0];
  const name  = active ? (active.model || active.provider || '') : '';
  const short = name.replace('gemini-', '').replace('-preview', '').replace('-latest', '');
  lbl.textContent = short || 'No model';
  if (btn) btn.style.borderColor = respondingModel ? 'rgba(109,40,217,.5)' : 'rgba(255,255,255,.12)';
}

window.cycleModel = function() {
  let chain = [];
  try { chain = JSON.parse(localStorage.getItem('nivi_model_chain') || '[]'); } catch(e) {}
  if (chain.length <= 1) return;
  chain.push(chain.shift());
  localStorage.setItem('nivi_model_chain', JSON.stringify(chain));
  updateActiveModelUI();
  renderSidebarData();
};

document.querySelectorAll('.modal').forEach(m =>
  m.addEventListener('click', function(e) { if (e.target === this) this.classList.remove('open'); })
);

// ── WORKSPACE / PROJECTS ──
function renderProjectsUI() {
  const projs = JSON.parse(localStorage.getItem('nivi_projects') || '[]');
  const sb    = document.getElementById('projectList');
  const dd    = document.getElementById('activeProjectSelect');
  const aId   = dd ? dd.value : 'default';
  if (sb) {
    sb.innerHTML =
      `<div class="si ${aId === 'default' ? 'active' : ''}" onclick="setProj('default')"><span style="flex:1;">/default</span></div>` +
      projs.map(p => `
        <div class="si ${aId === p.id ? 'active' : ''}" onclick="setProj(decodeURIComponent('${safeAttr(p.id)}'))" title="${escapeHTML(p.name)}" style="position:relative;" onmouseenter="this.querySelector('.pdel').style.opacity='1'" onmouseleave="this.querySelector('.pdel').style.opacity='0'">
          <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;">/${escapeHTML(p.name)}</span>
          <button class="pdel" onclick="event.stopPropagation();deleteProject(decodeURIComponent('${safeAttr(p.id)}'), decodeURIComponent('${safeAttr(p.name)}'))" title="Delete Workspace">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      `).join('');
  }
  if (dd) {
    dd.innerHTML = `<option value="default">default</option>` +
      projs.map(p => `<option value="${escapeHTML(p.id)}">${escapeHTML(p.name)}</option>`).join('');
  }
}

function setProj(id) {
  document.getElementById('activeProjectSelect').value = id;
  changeActiveProject();
  renderProjectsUI();
}

async function changeActiveProject() {
  const newProj  = document.getElementById('activeProjectSelect').value;
  const prevProj = window._activeProjectId || 'default';

  // Save current chat before switching
  const currentHistory = window.AppState?._tabChatHistory || [];
  if (currentHistory.length > 0) {
    if (prevProj === 'default') {
      if (typeof archiveNiviChat === 'function') await archiveNiviChat(currentHistory);
    } else {
      if (typeof saveProjectChat === 'function') await saveProjectChat(prevProj, currentHistory);
    }
  }

  // Clear screen
  if (window.AppState) AppState._tabChatHistory = [];
  localStorage.setItem('niviTabChat', '[]');
  document.getElementById('chatWindow').innerHTML = HERO_HTML;
  if (typeof closeArt   === 'function') closeArt();
  if (typeof closeSheet === 'function') closeSheet();

  window._activeProjectId = newProj;

  // Sync workspace files — IndexedDB first, Firebase fallback
  if (newProj !== 'default' && window.NiviDB) {
    try {
      const idbFiles = await NiviDB.getProjectFiles(newProj);
      if (idbFiles && idbFiles.length > 0) {
        await NiviDB.syncToLocalMemory(newProj);
      } else {
        if (typeof syncWorkspaceFiles === 'function') await syncWorkspaceFiles(newProj);
        const fbFiles = JSON.parse(localStorage.getItem(`nivi_file_memory_${newProj}`) || '[]');
        for (const f of fbFiles) {
          if (f.data) {
            try { await NiviDB.saveFile(newProj, f.name, f.mimeType, f.data); } catch(e) {}
          }
        }
      }
    } catch(e) {
      if (typeof syncWorkspaceFiles === 'function') syncWorkspaceFiles(newProj);
    }
  } else {
    if (typeof syncWorkspaceFiles === 'function') syncWorkspaceFiles(newProj);
  }

  // Load project chat
  if (newProj !== 'default') {
    try {
      const projChat = typeof loadProjectChat === 'function'
        ? await loadProjectChat(newProj)
        : loadProjectChatLocal(newProj);
      if (projChat && projChat.length > 0) {
        if (window.AppState) AppState._tabChatHistory = projChat;
        localStorage.setItem('niviTabChat', JSON.stringify(projChat));
        projChat.forEach(msg => appendMsg(msg.role, msg.text));
      }
    } catch(e) { console.warn('Project chat load failed:', e); }
  } else {
    try {
      const defChat = typeof loadNiviChat === 'function'
        ? await loadNiviChat()
        : JSON.parse(localStorage.getItem('niviTabChat') || '[]');
      if (defChat && defChat.length > 0) {
        if (window.AppState) AppState._tabChatHistory = defChat;
        localStorage.setItem('niviTabChat', JSON.stringify(defChat));
        defChat.forEach(msg => appendMsg(msg.role, msg.text));
      }
    } catch(e) { console.warn('Default chat load failed:', e); }
  }
}

// Await the async cloud calls
async function createNewProject() {
  const n = document.getElementById('newProjectName').value.trim();
  if (!n) return;
  const id = 'proj_' + Date.now();
  if (typeof createCloudWorkspace === 'function') {
    await createCloudWorkspace(id, n);
  } else {
    let p = JSON.parse(localStorage.getItem('nivi_projects') || '[]');
    p.push({ id, name: n });
    localStorage.setItem('nivi_projects', JSON.stringify(p));
  }
  closeModal('projectModal');
  document.getElementById('newProjectName').value = '';
  renderProjectsUI();
}

// ── CHAT CONSTANTS ──
const HERO_HTML = `<div id="heroSection"><div class="hero-icon">N</div><h1 class="hero-title">Nivi Workspace</h1><p class="hero-sub">Model chain - Files - Voice - Local workspace</p><div class="hero-chips"><div class="hchip" onclick="qp('Explain my codebase structure')">Analyze codebase</div><div class="hchip" onclick="qp('Summarize the active file')">Summarize file</div><div class="hchip" onclick="qp('Debug this error')">Debug code</div><div class="hchip" onclick="qp('/image futuristic city at night, neon lights')">Generate image</div></div></div>`;
