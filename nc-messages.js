// ══════════════════════════════════════════════════════════
//  NC-MESSAGES — Messages, Sidebar, Archive, File Ops
// ══════════════════════════════════════════════════════════

// ── APPEND MESSAGE ──
function appendMsg(role, text, id) {
  const win   = document.getElementById('chatWindow');
  const hero  = document.getElementById('heroSection');
  if (hero) hero.style.display = 'none';
  const msgId = id || 'msg-' + Date.now() + Math.random().toString(36).substr(2, 5);
  const row   = document.createElement('div');
  row.className = `msg-row ${role === 'user' ? 'ur' : 'nr'}`;
  row.id = 'row-' + msgId;
  const av       = role === 'nivi' ? `<div class="avatar nav">N</div>` : '';
  const uiText   = text.replace(/<nivi-hidden>[\s\S]*?<\/nivi-hidden>/g, '').trim();
  const fmt      = role === 'nivi' ? _fmt(uiText) : escapeHTML(uiText).replace(/\n/g, '<br>');
  const esc      = escapeHTML(text);
  const acts     = `<div class="msg-actions">
    <div class="abt" onclick="cpMsg('${msgId}')" title="Copy"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg></div>
    <div class="abt del" onclick="delMsg('${msgId}')" title="Delete"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></div>
  </div>`;
  const align = role === 'user' ? 'flex-end' : 'flex-start';
  const mw    = role === 'user' ? 'max-width:80%;' : 'width:100%;';
  const isLongUserMsg = role === 'user' && uiText.length > 300;
  const bubbleClass   = isLongUserMsg ? 'bubble collapsed' : 'bubble';
  const expandBtn     = isLongUserMsg
    ? `<div class="bubble-expand-btn" onclick="
        const b=this.previousElementSibling;
        const isCol=b.classList.contains('collapsed');
        b.classList.toggle('collapsed',!isCol);
        this.textContent=isCol?'Show less':'Show more';
      ">Show more</div>`
    : '';
  row.innerHTML = `${av}<div style="display:flex;flex-direction:column;align-items:${align};${mw}"><div class="${bubbleClass}" id="${msgId}" data-raw="${esc}">${fmt}</div>${expandBtn}${acts}</div>`;
  win.appendChild(row);
  if (role === 'nivi' && typeof addArtifactButtons === 'function') addArtifactButtons(row);
  const wrap = document.getElementById('chatWrap');
  if (wrap.scrollHeight - wrap.scrollTop - wrap.clientHeight < 200) wrap.scrollTop = wrap.scrollHeight;
}

// ── UPDATE MESSAGE ──
function updateMsg(id, text) {
  const el = document.getElementById(id);
  if (!el) return;
  el.setAttribute('data-raw', text.replace(/'/g, "&#39;").replace(/"/g, "&quot;"));
  const uiText = text.replace(/<nivi-hidden>[\s\S]*?<\/nivi-hidden>/g, '').trim();
  clearTimeout(window['renderTimer_' + id]);
  window['renderTimer_' + id] = setTimeout(() => {
    el.innerHTML = _fmt(uiText);
    if (typeof addArtifactButtons === 'function') addArtifactButtons(el);
    const wrap = document.getElementById('chatWrap');
    if (wrap.scrollHeight - wrap.scrollTop - wrap.clientHeight < 200) wrap.scrollTop = wrap.scrollHeight;
  }, 50);
}

function restoreChat() {
  try {
    const saved = JSON.parse(localStorage.getItem('niviTabChat') || '[]');
    if (saved.length > 0) {
      if (window.AppState) AppState._tabChatHistory = [];
      document.getElementById('heroSection').style.display = 'none';
      saved.forEach(msg => { appendMsg(msg.role, msg.text); if (window.AppState) AppState._tabChatHistory.push(msg); });
    }
  } catch(e) {}
}

function cpMsg(id) {
  const el = document.getElementById(id);
  if (!el) return;
  navigator.clipboard.writeText(el.getAttribute('data-raw').replace(/&#39;/g, "'").replace(/&quot;/g, '"'));
}

// Delete a single message — text-match based to avoid DOM index drift
async function delMsg(id) {
  if (!confirm('Delete this message?')) return;
  const row    = document.getElementById('row-' + id);
  const bubble = document.getElementById(id);
  if (!row) return;
  const rawAttr   = bubble ? bubble.getAttribute('data-raw') || '' : '';
  const decodedRaw = rawAttr
    .replace(/&#39;/g, "'").replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
  row.remove();
  if (window.AppState?._tabChatHistory) {
    let matchIdx = AppState._tabChatHistory.findIndex(m => (m.text || '') === decodedRaw);
    if (matchIdx === -1 && decodedRaw.length > 0) {
      const shortKey = decodedRaw.slice(0, 120);
      matchIdx = AppState._tabChatHistory.findIndex(m => (m.text || '').startsWith(shortKey));
    }
    if (matchIdx > -1) AppState._tabChatHistory.splice(matchIdx, 1);
    localStorage.setItem('niviTabChat', JSON.stringify(AppState._tabChatHistory));
    const activeProj = window._activeProjectId || document.getElementById('activeProjectSelect')?.value || 'default';
    if (activeProj !== 'default') {
      if (typeof saveProjectChat      === 'function') await saveProjectChat(activeProj, AppState._tabChatHistory);
      if (typeof saveProjectChatLocal === 'function') saveProjectChatLocal(activeProj, AppState._tabChatHistory);
    } else {
      if (typeof syncNiviChat  === 'function') await syncNiviChat(AppState._tabChatHistory);
      else if (typeof saveUserData === 'function') await saveUserData('history');
    }
  }
  renderSidebarData();
}

function loadArchivedChat(id) {
  const _activeProj = window._activeProjectId || document.getElementById('activeProjectSelect')?.value || 'default';
  const _archKey    = `nivi_chat_archives_${_activeProj}`;
  let archives      = JSON.parse(localStorage.getItem(_archKey) || '[]');
  const archive     = archives.find(a => String(a.id) === String(id));
  if (!archive) return;
  if (!archive.chat || archive.chat.length === 0) { alert('No data in this chat'); return; }
  archives = archives.filter(a => String(a.id) !== String(id));
  localStorage.setItem(_archKey, JSON.stringify(archives));
  if (window.AppState) AppState._tabChatHistory = JSON.parse(JSON.stringify(archive.chat));
  localStorage.setItem('niviTabChat', JSON.stringify(archive.chat));
  localStorage.setItem('nivi_current_title', archive.title || 'Archived Chat');
  const win = document.getElementById('chatWindow');
  win.querySelectorAll('.msg-row').forEach(b => b.remove());
  const hero = document.getElementById('heroSection');
  if (hero) hero.style.display = 'none';
  archive.chat.forEach(msg => appendMsg(msg.role, msg.text));
  renderSidebarData();
}

async function deleteProject(id, name) {
  if (!confirm(`Delete workspace "${name}"? This removes its local files and chat backup.`)) return;
  let projs = JSON.parse(localStorage.getItem('nivi_projects') || '[]');
  projs = projs.filter(p => p.id !== id);
  localStorage.setItem('nivi_projects', JSON.stringify(projs));
  localStorage.removeItem('nivi_proj_chat_' + id);
  localStorage.removeItem('nivi_proj_session_' + id);
  if (window.NiviDB) { try { await NiviDB.deleteProjectFiles(id); } catch(e) {} }
  // Await the async cloud cleanup
  if (typeof deleteCloudWorkspace === 'function') { try { await deleteCloudWorkspace(id); } catch(e) {} }
  if (document.getElementById('activeProjectSelect').value === id) setProj('default');
  else renderProjectsUI();
}

async function deleteCurrentChat() {
  if (!confirm('Delete current chat?')) return;
  if (window.AppState?._abortController) {
    window.AppState._abortController.abort();
    window.AppState._abortController = null;
    if (typeof toggleGen === 'function') toggleGen(false);
  }
  if (window.AppState) AppState._tabChatHistory = [];
  localStorage.setItem('niviTabChat', '[]');
  localStorage.removeItem('nivi_current_title');
  if (window.NiviDB) {
    const _delProj = window._activeProjectId || document.getElementById('activeProjectSelect')?.value || 'default';
    try { await NiviDB.saveChat(_delProj, []); } catch(e) {}
  }
  if (typeof closeArt   === 'function') closeArt();
  if (typeof closeSheet === 'function') closeSheet();
  document.getElementById('chatWindow').innerHTML = HERO_HTML;
  if      (typeof syncNiviChat  === 'function') await syncNiviChat([]);
  else if (typeof saveNiviChat  === 'function') saveNiviChat([]);
  if (typeof saveUserData === 'function') saveUserData('history');
  renderSidebarData();
}

function deleteArchivedChat(id) {
  if (!confirm('Delete this archived chat?')) return;
  const _activeProj = window._activeProjectId || document.getElementById('activeProjectSelect')?.value || 'default';
  const _archKey    = `nivi_chat_archives_${_activeProj}`;
  let archives      = JSON.parse(localStorage.getItem(_archKey) || '[]');
  archives          = archives.filter(a => a.id !== id);
  localStorage.setItem(_archKey, JSON.stringify(archives));
  renderSidebarData();
}

// ── SIDEBAR RENDERER ──
let _sidebarRenderTimer = null;
const _renderSidebarNow = function() {
  let models = [];
  try { models = JSON.parse(localStorage.getItem('nivi_model_chain') || '[]'); } catch(e) {}
  const ml = document.getElementById('modelList');
  if (ml) {
    if (!models.length) models = [{ provider: '-', model: 'Not Configured' }];
    const clr = { gemini: 'var(--accent)', openrouter: 'var(--purple)', nvidia: 'var(--amber)', custom: 'var(--green)' };
    ml.innerHTML = models.map((m, i) =>
      `<div class="si" title="${escapeHTML(m.provider)}: ${escapeHTML(m.model)}">
        <span style="color:${clr[m.provider] || 'var(--text-sub)'};font-size:9px;font-weight:700;flex-shrink:0;">${i + 1}</span>
        <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHTML(m.model || m.provider)}</span>
        ${i === 0 ? '<span class="bdg" style="background:var(--accent-dim);color:var(--accent);">active</span>' : ''}
      </div>`
    ).join('');
  }
  const _fileProjId = window._activeProjectId || document.getElementById('activeProjectSelect')?.value || 'default';
  const files       = JSON.parse(localStorage.getItem(`nivi_file_memory_${_fileProjId}`) || '[]');
  const fl          = document.getElementById('fileList');
  if (fl) {
    if (files.length) {
      fl.innerHTML = files.map(f => {
        const sn = encodeURIComponent(f.name);
        return `<div class="si" style="position:relative;" onmouseenter="this.querySelector('.fdel').style.opacity='1'" onmouseleave="this.querySelector('.fdel').style.opacity='0'">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0;color:var(--accent);cursor:pointer;" onclick="openSavedFile(decodeURIComponent('${sn}'))"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;cursor:pointer;" onclick="openSavedFile(decodeURIComponent('${sn}'))">${f.name}</span>
          <button class="fdel" onclick="event.stopPropagation();deleteFile(decodeURIComponent('${sn}'))" title="Delete file"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
        </div>`;
      }).join('');
    } else {
      fl.innerHTML = `<div class="si" style="opacity:.4;cursor:default;font-size:10px;">No files yet</div>`;
    }
  }
  const ch = document.getElementById('chatHistory');
  if (ch) {
    const _activeProj = window._activeProjectId || document.getElementById('activeProjectSelect')?.value || 'default';
    const _archKey    = `nivi_chat_archives_${_activeProj}`;
    const history     = JSON.parse(localStorage.getItem('niviTabChat') || '[]');
    const archives    = JSON.parse(localStorage.getItem(_archKey)     || '[]');
    let html = '';
    if (history.length) {
      let curTitle = localStorage.getItem('nivi_current_title');
      if (!curTitle) curTitle = (history[0]?.text?.split(' ').slice(0, 4).join(' ') + '...') || 'New Chat';
      const pairCount = Math.ceil(history.length / 2);
      html += `<div class="si active" style="display:flex;align-items:center;gap:4px;">
        <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHTML(curTitle)}</span>
        <span class="bdg">${pairCount}</span>
        <button onclick="event.stopPropagation();deleteCurrentChat()" title="Delete" style="opacity:0.6;background:none;border:none;color:var(--red);cursor:pointer;padding:0;display:flex;align-items:center;flex-shrink:0;">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        </button>
      </div>`;
    }
    if (archives.length) {
      html += archives.map(a => {
        const aCount = Math.ceil((a.msgCount || a.chat?.length || 0) / 2);
        return `<div class="si" onclick="loadArchivedChat(${a.id})" style="display:flex;align-items:center;gap:4px;">
          <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHTML(a.title || new Date(a.id).toLocaleDateString())}</span>
          <span class="bdg">${aCount}</span>
          <button onclick="event.stopPropagation();deleteArchivedChat(${a.id})" style="opacity:0.6;background:none;border:none;color:var(--red);cursor:pointer;padding:0;display:flex;align-items:center;flex-shrink:0;"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
        </div>`;
      }).join('');
    }
    ch.innerHTML = html || `<div class="si" style="opacity:.4;">Empty</div>`;
  }
};

window.renderSidebarData = function() {
  if (_sidebarRenderTimer) clearTimeout(_sidebarRenderTimer);
  _sidebarRenderTimer = setTimeout(_renderSidebarNow, 150);
};

function openSavedFile(name) {
  const _pId  = window._activeProjectId || document.getElementById('activeProjectSelect')?.value || 'default';
  const files = JSON.parse(localStorage.getItem(`nivi_file_memory_${_pId}`) || '[]');
  const f     = files.find(x => x.name === name);
  if (!f) { alert('File not found.'); return; }
  if (f.idbOnly && window.NiviDB) {
    NiviDB.getProjectFiles(_pId).then(idbFiles => {
      const idbFile = idbFiles.find(x => x.name === name);
      if (idbFile?.data && typeof openArt === 'function') {
        openArt({ name: idbFile.name, type: idbFile.mimeType || 'text/plain' }, idbFile.data);
      } else {
        alert('File data not found. Please re-attach the file.');
      }
    }).catch(() => alert('Could not read file. Please re-attach.'));
    return;
  }
  if (f?.data && typeof openArt === 'function') openArt({ name: f.name, type: f.mimeType || 'text/plain' }, f.data);
  else alert('File data not found. Re-attach the file.');
}

async function deleteFile(name) {
  if (!confirm(`Delete "${name}"?`)) return;
  const projId = window._activeProjectId || document.getElementById('activeProjectSelect')?.value || 'default';
  if (window.NiviDB) { try { await NiviDB.deleteFile(projId, name); } catch(e) {} }
  const _delKey = `nivi_file_memory_${projId}`;
  let files = JSON.parse(localStorage.getItem(_delKey) || '[]');
  files = files.filter(f => f.name !== name);
  localStorage.setItem(_delKey, JSON.stringify(files));
  if (typeof ART !== 'undefined' && ART.cur?.name === name) {
    if (typeof closeArt   === 'function') closeArt();
    if (typeof closeSheet === 'function') closeSheet();
  }
  renderSidebarData();
}

// ── CHAT TITLE — local heuristic (no API call) ──
function generateChatTitle(firstMessage) {
  try {
    let clean = firstMessage
      .replace(/^📎[^\n]+\n/, '')
      .replace(/^\/\w+\s*/, '')
      .replace(/[`*#_~>\[\]()]/g, '')
      .replace(/https?:\/\/\S+/g, '')
      .trim();
    const words = clean.split(/\s+/).filter(w => w.length > 1);
    const title  = words.slice(0, 5).join(' ').slice(0, 32);
    return Promise.resolve(title || 'New Chat');
  } catch(e) {
    return Promise.resolve('New Chat');
  }
}
