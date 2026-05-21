// ══════════════════════════════════════════════════════════
//  NIVI CORE — Storage, Chat Engine, UI
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

  // FIX 14: await the async cloud backup
  if (projId !== 'default' && typeof saveFileToCloudWorkspace === 'function') {
    await saveFileToCloudWorkspace(projId, filename, mimeType, base64Data);
  }

  if (typeof renderSidebarData === 'function') renderSidebarData();
}

// ── GLOBAL APP STATE ──
window.AppState = window.AppState || {
  _tabChatHistory:  [],
  _pendingFiles:    [],
  _isGenerating:    false,
  _abortController: null,
};

function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[ch]));
}

function safeAttr(value) {
  return encodeURIComponent(String(value ?? ''));
}

function decodeB64Text(b64) {
  try {
    const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    return new TextDecoder('utf-8').decode(bytes);
  } catch(e) {
    try { return atob(b64); } catch(_) { return ''; }
  }
}

function sanitizeHTML(html) {
  const tpl = document.createElement('template');
  tpl.innerHTML = html;
  const allowedTags  = new Set(['P','BR','STRONG','B','EM','I','U','S','CODE','PRE','BLOCKQUOTE','UL','OL','LI','A','IMG','DIV','SPAN','TABLE','THEAD','TBODY','TR','TH','TD','HR','H1','H2','H3','H4']);
  const allowedAttrs = new Set(['href','src','alt','title','class','target','rel']);
  tpl.content.querySelectorAll('*').forEach(node => {
    if (!allowedTags.has(node.tagName)) {
      node.replaceWith(document.createTextNode(node.textContent || ''));
      return;
    }
    [...node.attributes].forEach(attr => {
      const name  = attr.name.toLowerCase();
      const value = attr.value || '';
      if (!allowedAttrs.has(name) || name.startsWith('on')) node.removeAttribute(attr.name);
      if ((name === 'href' || name === 'src') && /^(javascript|data):/i.test(value)) node.removeAttribute(attr.name);
    });
    if (node.tagName === 'A') {
      node.setAttribute('target', '_blank');
      node.setAttribute('rel',    'noopener noreferrer');
    }
    if (node.tagName === 'IMG') {
      const src = node.getAttribute('src') || '';
      if (!/^https:\/\/image\.pollinations\.ai\//i.test(src) && !src.startsWith('blob:')) node.remove();
    }
  });
  return tpl.innerHTML;
}

// ── FILE ATTACHMENT HANDLER ──
function handleFileSelectNew(inp) {
  if (!inp.files || !inp.files.length) return;
  const existing = window.AppState?._pendingFiles || [];
  const merged   = [...existing];
  for (const f of Array.from(inp.files)) {
    if (merged.length >= 3) break;
    if (!merged.find(e => e.name === f.name && e.size === f.size)) merged.push(f);
  }
  if (window.AppState) window.AppState._pendingFiles = merged;
  _renderFilePreviews(merged);
  document.getElementById('filePreview').classList.add('show');
  inp.value = ''; inp.type = 'text'; inp.type = 'file';
  document.getElementById('mainInput').focus();
}

function _renderFilePreviews(files) {
  document.getElementById('filePreviewName').innerHTML = files.map((f, i) =>
    `<span class="file-chip">
      ${escapeHTML(f.name)}
      <span onclick="_removeFile(${i})" class="file-chip-rm">×</span>
    </span>`
  ).join('');
}

window._removeFile = function(i) {
  if (!window.AppState) return;
  AppState._pendingFiles = AppState._pendingFiles.filter((_, idx) => idx !== i);
  if (AppState._pendingFiles.length === 0) { clearFile(); return; }
  _renderFilePreviews(AppState._pendingFiles);
};

function clearFile() {
  if (window.AppState) AppState._pendingFiles = [];
  const inp = document.getElementById('fileInp');
  inp.value = ''; inp.type = 'text'; inp.type = 'file';
  document.getElementById('filePreviewName').innerHTML = '';
  document.getElementById('filePreview').classList.remove('show');
}

// ── INITIALISATION ──
window.onload = async () => {
  if (!localStorage.getItem('nivi_current_session_id')) {
    localStorage.setItem('nivi_current_session_id', 'session_' + Date.now());
  }

  window._activeProjectId = document.getElementById('activeProjectSelect')?.value || 'default';
  const _initProj = window._activeProjectId;

  renderProjectsUI();
  updateActiveModelUI();

  // 1. FILE RESTORE — IndexedDB first (all projects)
  if (window.NiviDB) {
    try {
      const idbFiles = await NiviDB.getProjectFiles(_initProj);
      if (idbFiles && idbFiles.length > 0) {
        const existing = JSON.parse(localStorage.getItem(`nivi_file_memory_${_initProj}`) || '[]');
        const merged   = idbFiles.map(f => {
          const ex = existing.find(e => e.name === f.name);
          return ex ? { ...f, idbOnly: ex.idbOnly } : f;
        });
        localStorage.setItem(`nivi_file_memory_${_initProj}`, JSON.stringify(merged));
      } else if (_initProj !== 'default') {
        if (typeof syncWorkspaceFiles === 'function') syncWorkspaceFiles(_initProj);
      }
    } catch(e) {
      console.warn('IDB file restore failed:', e);
      if (_initProj !== 'default' && typeof syncWorkspaceFiles === 'function') syncWorkspaceFiles(_initProj);
    }
  } else if (_initProj !== 'default' && typeof syncWorkspaceFiles === 'function') {
    syncWorkspaceFiles(_initProj);
  }

  renderSidebarData();

  // PASTE-AS-ATTACHMENT — Ctrl+V image support
  document.addEventListener('paste', function(e) {
    const items     = e.clipboardData?.items;
    if (!items) return;
    const imageItem = Array.from(items).find(i => i.type.startsWith('image/'));
    if (!imageItem) return;
    const file = imageItem.getAsFile();
    if (!file) return;
    const ext      = file.type.split('/')[1] || 'png';
    const namedFile = new File([file], `pasted_image_${Date.now()}.${ext}`, { type: file.type });
    const current  = window.AppState?._pendingFiles || [];
    if (current.length >= 3) return;
    const updated  = [...current, namedFile].slice(0, 3);
    if (window.AppState) window.AppState._pendingFiles = updated;
    _renderFilePreviews(updated);
    document.getElementById('filePreview').classList.add('show');
    document.getElementById('mainInput').focus();
  });

  // 2. CHAT RESTORE
  if (_initProj !== 'default') {
    try {
      const projChat = typeof loadProjectChat === 'function'
        ? await loadProjectChat(_initProj)
        : loadProjectChatLocal(_initProj);
      if (projChat && projChat.length > 0) {
        if (window.AppState) AppState._tabChatHistory = projChat;
        localStorage.setItem('niviTabChat', JSON.stringify(projChat));
        projChat.forEach(msg => appendMsg(msg.role, msg.text));
      }
    } catch(e) { console.warn('Project chat restore failed:', e); }
  } else {
    try {
      const localHistory = typeof loadNiviChat === 'function'
        ? await loadNiviChat()
        : JSON.parse(localStorage.getItem('niviTabChat') || '[]');
      if (localHistory && localHistory.length > 0) {
        if (window.AppState) AppState._tabChatHistory = localHistory;
        localStorage.setItem('niviTabChat', JSON.stringify(localHistory));
        document.getElementById('chatWindow').innerHTML = HERO_HTML;
        localHistory.forEach(msg => appendMsg(msg.role, msg.text));
      } else {
        if (window.AppState) AppState._tabChatHistory = [];
      }
    } catch(e) {
      console.warn('Default chat restore failed:', e);
      if (window.AppState) AppState._tabChatHistory = [];
    }
  }
};

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

// FIX 14: await the async cloud calls
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
const HERO_HTML = `<div id="heroSection"><div class="hero-icon">N</div><h1 class="hero-title">Nivi Workspace</h1><p class="hero-sub">Multi-model AI - Live file preview - Local workspace</p><div class="hero-chips"><div class="hchip" onclick="qp('Explain my codebase structure')">Analyze codebase</div><div class="hchip" onclick="qp('Summarize the active file')">Summarize file</div><div class="hchip" onclick="qp('Debug this error')">Debug code</div><div class="hchip" onclick="qp('/image futuristic city at night, neon lights')">Generate image</div></div></div>`;

// ── CLEAR CHAT ──
function clearChat() {
  // Stop any in-progress generation
  if (window.AppState?._abortController) {
    window.AppState._abortController.abort();
    window.AppState._abortController = null;
    if (typeof toggleGen === 'function') toggleGen(false);
  }
  const history    = window.AppState?._tabChatHistory || [];
  const activeProj = window._activeProjectId || document.getElementById('activeProjectSelect')?.value || 'default';
  if (history.length > 0) {
    if (activeProj !== 'default') {
      if (typeof archiveProjectChat  === 'function') archiveProjectChat(activeProj, history);
      if (typeof clearProjectSession === 'function') clearProjectSession(activeProj);
    } else {
      if (typeof archiveNiviChat === 'function') archiveNiviChat(history);
      const _archKey = `nivi_chat_archives_default`;
      let a = JSON.parse(localStorage.getItem(_archKey) || '[]');
      a.unshift({ id: Date.now(), msgCount: history.length, chat: history, title: localStorage.getItem('nivi_current_title') || 'New Chat' });
      if (a.length > 20) a = a.slice(0, 20);
      localStorage.setItem(_archKey, JSON.stringify(a));
    }
  }
  if (window.AppState) AppState._tabChatHistory = [];
  localStorage.setItem('niviTabChat', '[]');
  localStorage.removeItem('nivi_current_title');
  localStorage.setItem('nivi_current_session_id', 'session_' + Date.now());
  if (typeof closeArt   === 'function') closeArt();
  if (typeof closeSheet === 'function') closeSheet();
  document.getElementById('chatWindow').innerHTML = HERO_HTML;
  renderSidebarData();
  if (typeof syncNiviChat === 'function') { syncNiviChat([]); }
  else if (typeof saveNiviChat === 'function') { saveNiviChat([]); }
  if (typeof saveUserData === 'function') saveUserData('history');
}

// ── MARKDOWN / FORMAT ──
function _fmt(text) {
  if (!text) return '';
  if (text.includes('<img') && text.includes('pollinations')) return text;
  if (text.includes('class="thinking"')) return text;
  let cleanText = text.replace(/~?\d+\s*tokens/g, '').replace(/<div class="tbdg".*?<\/div>/g, '');
  if (typeof marked !== 'undefined') {
    const renderer = new marked.Renderer();
    renderer.html = function(token) {
      const raw = typeof token === 'string' ? token : (token.raw || token.text || '');
      return escapeHTML(raw);
    };
    // ── LIVE CODE RUNNER: inject ▶ Run button into JS code blocks ──
    renderer.code = function(token) {
      const code = typeof token === 'string' ? token : (token.text || token.raw || '');
      const lang = (typeof token === 'object' ? (token.lang || '') : '').toLowerCase().trim();
      const escaped = escapeHTML(code);
      const isJS = lang === 'javascript' || lang === 'js';
      const isPY = lang === 'python' || lang === 'py';
      const runId = 'run-' + Math.random().toString(36).substr(2, 8);
      let runBtn = '';
      if (isJS) {
        runBtn = `<button class="code-run-btn" onclick="runJSCode('${runId}')" title="Run JavaScript">▶ Run JS</button>`;
      } else if (isPY) {
        runBtn = `<button class="code-run-btn" onclick="runPYCode('${runId}')" title="Run Python (Pyodide)" style="color:#4ade80;">▶ Run PY</button>`;
      }
      const langBadge = lang ? `<span class="code-lang">${lang}</span>` : '';
      const copyBtn   = `<button class="code-copy-btn" onclick="copyCode('${runId}')" title="Copy code">⧉</button>`;
      return `<div class="code-block-wrap" id="${runId}-wrap">
        <div class="code-block-header">${langBadge}${copyBtn}${runBtn}</div>
        <pre><code id="${runId}-src" class="language-${lang || 'plaintext'}">${escaped}</code></pre>
        <div id="${runId}-out" class="code-output" style="display:none;"></div>
      </div>`;
    };
    marked.setOptions({ breaks: true, renderer });
    const h = marked.parse(cleanText);
    const w = cleanText.trim().split(/\s+/).length;
    return sanitizeHTML(h) + `<div class="tbdg" style="margin-top:10px;">~${Math.ceil(w * 1.3)} tokens</div>`;
  }
  return escapeHTML(cleanText).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
}

// ── LIVE JS CODE RUNNER ──
window.runJSCode = function(runId) {
  const srcEl  = document.getElementById(runId + '-src');
  const outEl  = document.getElementById(runId + '-out');
  if (!srcEl || !outEl) return;
  const code   = srcEl.innerText || srcEl.textContent || '';
  outEl.style.display = 'block';
  outEl.innerHTML     = '<span style="opacity:.5;font-size:11px;">Running…</span>';

  // Capture console.log output
  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  document.body.appendChild(iframe);
  const logs = [];
  try {
    iframe.contentWindow.console = {
      log:   (...a) => logs.push(a.map(x => typeof x === 'object' ? JSON.stringify(x, null, 2) : String(x)).join(' ')),
      error: (...a) => logs.push('❌ ' + a.join(' ')),
      warn:  (...a) => logs.push('⚠️ ' + a.join(' ')),
      info:  (...a) => logs.push('ℹ️ ' + a.join(' ')),
    };
    iframe.contentWindow.eval(code);
    const output = logs.length ? logs.join('\n') : '✅ Ran (no output)';
    outEl.innerHTML = `<pre style="margin:0;white-space:pre-wrap;">${escapeHTML(output)}</pre>`;
  } catch(e) {
    outEl.innerHTML = `<pre style="margin:0;color:var(--red);">❌ ${escapeHTML(e.toString())}</pre>`;
  } finally {
    document.body.removeChild(iframe);
  }
};

// ── PYTHON RUNNER (Pyodide lazy-loaded) ──
window.runPYCode = async function(runId) {
  const srcEl = document.getElementById(runId + '-src');
  const outEl = document.getElementById(runId + '-out');
  if (!srcEl || !outEl) return;
  const code  = srcEl.innerText || srcEl.textContent || '';
  outEl.style.display = 'block';
  outEl.innerHTML = '<span style="opacity:.5;font-size:11px;">Loading Python runtime…</span>';
  try {
    if (!window._pyodide) {
      if (!document.getElementById('pyodide-script')) {
        await new Promise((res, rej) => {
          const s = document.createElement('script');
          s.id  = 'pyodide-script';
          s.src = 'https://cdn.jsdelivr.net/pyodide/v0.25.1/full/pyodide.js';
          s.onload = res; s.onerror = rej;
          document.head.appendChild(s);
        });
      }
      outEl.innerHTML = '<span style="opacity:.5;font-size:11px;">Initializing Pyodide…</span>';
      window._pyodide = await loadPyodide();
    }
    let out = '';
    window._pyodide.setStdout({ batched: (s) => { out += s + '\n'; } });
    window._pyodide.setStderr({ batched: (s) => { out += '❌ ' + s + '\n'; } });
    await window._pyodide.runPythonAsync(code);
    outEl.innerHTML = `<pre style="margin:0;white-space:pre-wrap;">${escapeHTML(out.trim() || '✅ Ran (no output)')}</pre>`;
  } catch(e) {
    outEl.innerHTML = `<pre style="margin:0;color:var(--red);">❌ ${escapeHTML(String(e))}</pre>`;
  }
};

window.copyCode = function(runId) {
  const srcEl = document.getElementById(runId + '-src');
  if (srcEl) navigator.clipboard.writeText(srcEl.innerText || srcEl.textContent || '');
};



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
  // FIX 14: await the async cloud cleanup
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

// ════════════════════════════════════════════════════
//  SEND MESSAGE — FIX 4: split into focused helpers
// ════════════════════════════════════════════════════

// ── POLLINATIONS.AI IMAGE GENERATION (Primary — no API key needed) ──
const POLL_MODELS = [
  { id: 'flux',         label: '✦ Flux',       desc: 'Best quality' },
  { id: 'flux-realism', label: '📷 Realism',   desc: 'Photorealistic' },
  { id: 'flux-anime',   label: '🎌 Anime',     desc: 'Anime style' },
  { id: 'flux-3d',      label: '🧊 3D',        desc: '3D render' },
  { id: 'turbo',        label: '⚡ Turbo',     desc: 'Ultra fast' },
];

const POLL_RATIOS = [
  { id: 'square',    label: '⬛ 1:1',   w: 1024, h: 1024 },
  { id: 'landscape', label: '▬ 16:9', w: 1360, h: 768  },
  { id: 'portrait',  label: '▮ 9:16', w: 768,  h: 1360 },
  { id: 'wide',      label: '◻ 4:3',  w: 1024, h: 768  },
];

window._pollImgModel  = window._pollImgModel  || 'flux';
window._pollImgRatio  = window._pollImgRatio  || 'square';
window._pollImgEnhance = window._pollImgEnhance !== false;

function _buildPollinationsUrl(prompt, model, ratio, enhance, seed) {
  const r   = POLL_RATIOS.find(x => x.id === ratio) || POLL_RATIOS[0];
  const s   = seed || Math.floor(Math.random() * 9999999);
  const enc = encodeURIComponent(prompt);
  return `https://image.pollinations.ai/prompt/${enc}?model=${model}&width=${r.w}&height=${r.h}&seed=${s}&nologo=true${enhance ? '&enhance=true' : ''}`;
}

function _buildImgUI(prompt, model, ratio, enhance, seed, resId) {
  const url      = _buildPollinationsUrl(prompt, model, ratio, enhance, seed);
  const modelOpts = POLL_MODELS.map(m =>
    `<option value="${m.id}" ${model === m.id ? 'selected' : ''}>${m.label} — ${m.desc}</option>`
  ).join('');
  const ratioOpts = POLL_RATIOS.map(r =>
    `<option value="${r.id}" ${ratio === r.id ? 'selected' : ''}>${r.label}</option>`
  ).join('');

  return `<div class="img-result" id="imgblock-${resId}">
    <div class="img-controls" style="display:flex;align-items:center;gap:7px;flex-wrap:wrap;margin-bottom:10px;">
      <select class="img-sel" onchange="window._pollImgModel=this.value;_regenImg('${resId}','${escapeHTML(prompt)}',this.value,document.getElementById('ratio-${resId}').value,window._pollImgEnhance)" style="font-size:11px;padding:4px 8px;border-radius:7px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);color:#e2e2e2;cursor:pointer;font-family:var(--mono);">${modelOpts}</select>
      <select id="ratio-${resId}" class="img-sel" onchange="window._pollImgRatio=this.value;_regenImg('${resId}','${escapeHTML(prompt)}',document.querySelector('#imgblock-${resId} .img-sel').value,this.value,window._pollImgEnhance)" style="font-size:11px;padding:4px 8px;border-radius:7px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);color:#e2e2e2;cursor:pointer;font-family:var(--mono);">${ratioOpts}</select>
      <label style="display:flex;align-items:center;gap:5px;font-size:11px;color:var(--text-sub);cursor:pointer;user-select:none;">
        <input type="checkbox" ${enhance ? 'checked' : ''} onchange="window._pollImgEnhance=this.checked;_regenImg('${resId}','${escapeHTML(prompt)}',document.querySelector('#imgblock-${resId} .img-sel').value,document.getElementById('ratio-${resId}').value,this.checked)" style="accent-color:var(--accent);">
        Enhance
      </label>
      <button onclick="_regenImg('${resId}','${escapeHTML(prompt)}',document.querySelector('#imgblock-${resId} .img-sel').value,document.getElementById('ratio-${resId}').value,window._pollImgEnhance)" class="tbtn" style="font-size:11px;padding:4px 10px;">🔄 Regen</button>
    </div>
    <div id="img-wrap-${resId}" style="position:relative;border-radius:12px;overflow:hidden;background:rgba(255,255,255,.04);min-height:120px;display:flex;align-items:center;justify-content:center;">
      <div id="img-loading-${resId}" style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;color:var(--text-sub);font-size:12px;z-index:2;">
        <div class="tm-spinner"></div><span>Generating…</span>
      </div>
      <img src="${url}"
        style="max-width:100%;border-radius:12px;display:block;opacity:0;transition:opacity .4s;"
        onload="this.style.opacity='1';document.getElementById('img-loading-${resId}')?.remove();document.getElementById('chatWrap').scrollTop=99999;"
        onerror="document.getElementById('img-loading-${resId}').innerHTML='<span style=color:var(--red)>⚠️ Generation failed. Try again or change model.</span>';"
        alt="AI Generated: ${escapeHTML(prompt)}"
      >
    </div>
    <div class="img-actions" style="display:flex;gap:8px;margin-top:10px;align-items:center;flex-wrap:wrap;">
      <a href="${url}" target="_blank" download="nivi-image.png" class="tbtn prim img-dl">⬇ Download</a>
      <a href="${url}" target="_blank" class="tbtn">🔗 Open</a>
      <button class="tbtn" onclick="document.getElementById('i2i-inp-${resId}').click()" title="Use this result as reference image">🖼️ Img2Img</button>
      <input type="file" id="i2i-inp-${resId}" style="display:none" accept="image/*" onchange="_handleImg2ImgUpload(this,'${resId}','${escapeHTML(prompt)}',' '+ '${model}',' '+'${ratio}')">
      <span style="margin-left:auto;font-size:10px;font-family:var(--mono);color:var(--text-muted);opacity:.6;">pollinations.ai • ${model}</span>
    </div>
  </div>`;
}

// Regenerate image with new settings — replaces existing img block
window._regenImg = function(resId, prompt, model, ratio, enhance) {
  const block = document.getElementById('imgblock-' + resId);
  if (!block) return;
  window._pollImgModel  = model;
  window._pollImgRatio  = ratio;
  window._pollImgEnhance = enhance;
  const seed = Math.floor(Math.random() * 9999999);
  const newHtml = _buildImgUI(prompt, model, ratio, enhance, seed, resId);
  const bubble  = block.closest('.bubble');
  if (bubble) {
    bubble.innerHTML = newHtml;
    bubble.setAttribute('data-raw', `[Image: ${prompt}]`);
  }
};

// ── IMAGE-TO-IMAGE — Upload reference, regenerate with style transfer ──
window._handleImg2ImgUpload = async function(inputEl, resId, prompt, model, ratio) {
  const file = inputEl.files[0];
  if (!file) return;
  model = (model || '').trim() || window._pollImgModel || 'flux';
  ratio = (ratio || '').trim() || window._pollImgRatio || 'square';

  // Read as base64
  const b64 = await new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = e => res(e.target.result); // full dataURL
    r.onerror = rej;
    r.readAsDataURL(file);
  });

  // Show img2img panel in same bubble
  const block = document.getElementById('imgblock-' + resId);
  if (!block) return;
  const bubble = block.closest('.bubble');
  if (!bubble) return;

  const i2iId  = resId + '-i2i';
  const strength = 0.65;
  const seed     = Math.floor(Math.random() * 9999999);
  // Pollinations img2img via ?image= param (base64 dataURL encoded)
  const r = POLL_RATIOS.find(x => x.id === ratio) || POLL_RATIOS[0];
  const imgParam = encodeURIComponent(b64);
  const genUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?model=${model}&width=${r.w}&height=${r.h}&seed=${seed}&nologo=true&enhance=true&image=${imgParam}&strength=${strength}`;

  bubble.innerHTML = `
  <div class="img-result" id="imgblock-${i2iId}">
    <div style="display:flex;gap:10px;align-items:flex-start;margin-bottom:10px;">
      <div style="flex-shrink:0;">
        <div style="font-size:10px;font-family:var(--mono);color:var(--text-muted);margin-bottom:4px;">REFERENCE</div>
        <img src="${b64}" style="width:80px;height:80px;object-fit:cover;border-radius:8px;border:1px solid rgba(255,255,255,.1);">
      </div>
      <div style="flex:1;">
        <div style="font-size:11px;color:var(--text-sub);font-family:var(--mono);margin-bottom:6px;">🖼️ Image-to-Image · <strong>${model}</strong> · strength ${strength}</div>
        <div id="i2i-controls-${i2iId}" style="display:flex;gap:6px;flex-wrap:wrap;">
          <button class="tbtn prim" onclick="_applyI2iStrength('${i2iId}','${escapeHTML(prompt)}','${model}','${ratio}','${b64.substring(0,30)}...',0.4)">Subtle 0.4</button>
          <button class="tbtn prim" onclick="_applyI2iStrength('${i2iId}','${escapeHTML(prompt)}','${model}','${ratio}','${b64.substring(0,30)}...',0.65)">Medium 0.65</button>
          <button class="tbtn prim" onclick="_applyI2iStrength('${i2iId}','${escapeHTML(prompt)}','${model}','${ratio}','${b64.substring(0,30)}...',0.9)">Strong 0.9</button>
        </div>
      </div>
    </div>
    <div style="position:relative;border-radius:12px;overflow:hidden;background:rgba(255,255,255,.04);min-height:120px;display:flex;align-items:center;justify-content:center;">
      <div id="img-loading-${i2iId}" style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;color:var(--text-sub);font-size:12px;z-index:2;">
        <div class="tm-spinner"></div><span>Processing img2img…</span>
      </div>
      <img src="${genUrl}"
        style="max-width:100%;border-radius:12px;display:block;opacity:0;transition:opacity .4s;"
        onload="this.style.opacity='1';document.getElementById('img-loading-${i2iId}')?.remove();"
        onerror="document.getElementById('img-loading-${i2iId}').innerHTML='<span style=color:var(--red)>⚠️ Img2Img failed. Try a different model or strength.</span>';"
        alt="Img2Img result"
      >
    </div>
    <div class="img-actions" style="display:flex;gap:8px;margin-top:10px;">
      <a href="${genUrl}" target="_blank" download="nivi-i2i.png" class="tbtn prim img-dl">⬇ Download</a>
      <a href="${genUrl}" target="_blank" class="tbtn">🔗 Open</a>
      <button class="tbtn" onclick="_regenImg('${resId}','${escapeHTML(prompt)}','${model}','${ratio}',true)">← Back to normal</button>
    </div>
  </div>`;
  bubble.setAttribute('data-raw', `[Img2Img: ${prompt}]`);
};

// ── Img2Img strength variants (regenerate with different blend) ──
window._applyI2iStrength = function(i2iId, prompt, model, ratio, _b64hint, strength) {
  const loadEl = document.getElementById('img-loading-' + i2iId);
  const imgEl  = document.querySelector(`#imgblock-${i2iId} img[alt="Img2Img result"]`);
  if (!loadEl || !imgEl) return;
  // Note: actual re-generation needs the full b64 — this shows a notice
  loadEl.style.display = 'flex';
  loadEl.innerHTML = '<div class="tm-spinner"></div><span>Applying strength ' + strength + '…</span>';
  imgEl.style.opacity = '0';
  const newSeed = Math.floor(Math.random() * 9999999);
  // Rebuild URL with same base but new seed/strength (b64 param is already encoded in src)
  const src = imgEl.src.replace(/seed=\d+/, 'seed=' + newSeed).replace(/strength=[\d.]+/, 'strength=' + strength);
  imgEl.src = src;
  imgEl.onload  = () => { imgEl.style.opacity = '1'; loadEl.style.display = 'none'; };
  imgEl.onerror = () => { loadEl.innerHTML = '<span style=color:var(--red)>⚠️ Failed</span>'; };
};

// Handles /image command OR natural image request — returns true so caller can bail out
async function _handleImageCommand(text, inp) {
  // Extract prompt — strip command prefix if present
  let prompt = text;
  if (text.toLowerCase().startsWith('/image ')) prompt = text.substring(7).trim();
  else if (text.toLowerCase().startsWith('generate image ')) prompt = text.substring(15).trim();
  else if (text.toLowerCase().startsWith('generate an image ')) prompt = text.substring(18).trim();
  else if (text.toLowerCase().startsWith('create image ')) prompt = text.substring(13).trim();
  else if (text.toLowerCase().startsWith('create an image ')) prompt = text.substring(16).trim();
  prompt = prompt.trim();

  appendMsg('user', text);
  if (window.AppState) {
    AppState._tabChatHistory.push({ role: 'user', text });
    localStorage.setItem('niviTabChat', JSON.stringify(AppState._tabChatHistory));
  }
  inp.value = ''; inp.style.height = 'auto';
  const resId = 'nivi-' + Date.now();

  // Show loading bubble immediately
  appendMsg('nivi', `<div class="img-generating"><span class="tm-spinner" style="display:inline-block;margin-right:8px;"></span>Generating image: <em>${escapeHTML(prompt)}</em>…</div>`, resId);
  scrollToBottom();

  // Small delay so loading bubble renders, then swap in full UI
  await new Promise(r => setTimeout(r, 50));

  const imgHtml = _buildImgUI(
    prompt,
    window._pollImgModel  || 'flux',
    window._pollImgRatio  || 'square',
    window._pollImgEnhance !== false,
    null,
    resId
  );
  updateMsg(resId, imgHtml);

  if (window.AppState) {
    AppState._tabChatHistory.push({ role: 'nivi', text: `[Image generated for: ${prompt}]` });
    localStorage.setItem('niviTabChat', JSON.stringify(AppState._tabChatHistory));
  }

  renderSidebarData();
  return true;
}




// Reads all pending files, saves them, returns combined AI answer
async function _handleFilesMessage(text, pendingFiles, resId) {
  const proj          = document.getElementById('activeProjectSelect').value;
  let combinedAnswer  = '';
  for (const f of pendingFiles) {
    if (AppState?._abortController?.signal.aborted) break;
    const fileB64   = await window.readFileAsBase64(f);
    const fileMime  = window.getFileMimeType ? window.getFileMimeType(f.name) : f.type;
    if (typeof saveFileToMemory          === 'function') saveFileToMemory(f.name, fileB64, fileMime);
    if (typeof saveFileToCloudWorkspace  === 'function') saveFileToCloudWorkspace(proj, f.name, fileMime, fileB64);
    const r      = await directGeminiCallWithFile(text || 'Analyze this file.', fileB64, fileMime);
    const prefix = pendingFiles.length > 1 ? `**${f.name}:**\n` : '';
    combinedAnswer += prefix + (r.answer || 'No answer received.') + '\n\n';
    if (!AppState?._abortController?.signal.aborted) {
      updateMsg(resId, combinedAnswer.trim());
      const el = document.getElementById(resId);
      if (el && typeof makeArtCard === 'function') {
        el.parentElement.appendChild(makeArtCard(f.name, f.name.split('.').pop().toLowerCase(), fileB64, f));
      }
    }
  }
  // Open first file in artifact panel
  if (!AppState?._abortController?.signal.aborted && pendingFiles.length > 0 && typeof openArt === 'function') {
    const firstB64 = await window.readFileAsBase64(pendingFiles[0]);
    openArt(pendingFiles[0], firstB64);
  }
  if (window.AppState) AppState._pendingFiles = [];
  document.getElementById('fileInp').value = '';
}

// Builds history + file context, streams text response
async function _handleTextMessage(text, resId) {
  let apiText = text;
  if (text.toLowerCase().startsWith('/song ')) {
    apiText = `You are a professional lyricist. Write a beautiful song about: "${text.substring(6).trim()}". Include Verse, Chorus and Bridge. Make it emotional and modern.`;
  }

  // Strip old file context noise from history, keep last 15 turns
  const _rawHist  = window.AppState ? AppState._tabChatHistory.slice(0, -1) : [];
  const _trimHist = _rawHist.slice(-15);
  const hist      = _trimHist.map(m => {
    const cleanText = (m.text || '').replace(/\n\n---\n(?:\[Project:[^\]]+\] )?\[Files in Nivi Memory\][\s\S]*$/m, '').trim();
    return { role: m.role === 'nivi' ? 'model' : 'user', parts: [{ text: cleanText }] };
  });

  // ── Build workspace-aware system directive ──
  const _ctxProj    = window._activeProjectId || document.getElementById('activeProjectSelect')?.value || 'default';
  let memFiles      = [];
  if (window.NiviDB) {
    try { memFiles = await NiviDB.getProjectFiles(_ctxProj); }
    catch(e) { memFiles = JSON.parse(localStorage.getItem(`nivi_file_memory_${_ctxProj}`) || '[]'); }
  } else {
    memFiles = JSON.parse(localStorage.getItem(`nivi_file_memory_${_ctxProj}`) || '[]');
  }
  const TEXT_MIMES  = ['text/javascript','text/html','text/css','text/plain','application/json','text/csv'];
  const textFiles   = memFiles.filter(f => TEXT_MIMES.includes(f.mimeType));

  // FSAgent local folder status
  const _fsStatus   = window.FSAgent ? FSAgent.getStatus() : { status: 'idle', folder: '', files: [] };
  const _fsGranted  = _fsStatus.status === 'granted';
  const _fsDirFiles = _fsGranted ? (_fsStatus.files || []).filter(f => f.kind === 'file') : [];

  const uploadedList  = textFiles.length > 0 ? textFiles.map(f => f.name).join(', ') : 'None';
  const localList     = _fsDirFiles.length > 0 ? _fsDirFiles.slice(0, 20).map(f => `${f.name} (${(f.size/1024).toFixed(1)}KB)`).join(', ') : 'None';

  const niviDirective = `SYSTEM DIRECTIVE: You are Nivi — a smart, friendly, and versatile personal AI assistant built into the user's local workspace.

Your personality:
- Warm, clear, and direct — no unnecessary disclaimers
- Match the user's language: Gujarati → Gujarati, Hindi → Hindi, English → English
- Help with ANYTHING: coding, writing, math, advice, creative, casual conversation

WORKSPACE STATUS (use this when user asks about files or project):
- Active Project: "${_ctxProj}"
- Uploaded project files: ${uploadedList}
- Local folder: ${_fsGranted ? `"${_fsStatus.folder}" — ${_fsDirFiles.length} files: ${localList}` : 'Not connected (user can click Local Folder in sidebar to grant)'}

BACKGROUND TASKS:
- User can run any task in background by prefixing with /bg
- Example: /bg summarize all files in this project

When giving code edits:
FILE: filename.ext
FIND:
\`\`\`
(old code)
\`\`\`
REPLACE:
\`\`\`
(new code)
\`\`\`

IMPORTANT: Only bring up files/code if user explicitly asks. For casual/general questions just answer directly.`;

  if (!hist.find(h => (h.parts[0]?.text || '').includes('SYSTEM DIRECTIVE:'))) {
    hist.unshift(
      { role: 'user',  parts: [{ text: niviDirective }] },
      { role: 'model', parts: [{ text: `Understood! I'm Nivi — your workspace assistant for project "${_ctxProj}".${_fsGranted ? ` Local folder "${_fsStatus.folder}" connected with ${_fsDirFiles.length} files.` : ''} How can I help?` }] }
    );
  }


  // Attach workspace file context (uploaded text files)
  let fileContext = '';
  if (textFiles.length > 0) {
    const fileLimit = _ctxProj === 'default' ? 3 : 6;
    const charLimit = 1500;
    const projLabel = _ctxProj !== 'default' ? `[Project: ${_ctxProj}]` : '[Default Workspace]';
    fileContext = `\n\n---\n[WORKSPACE FILE CONTENTS — use only when user asks about code/files]\n${projLabel} — ${textFiles.length} uploaded file(s):\n` +
      textFiles.slice(0, fileLimit).map(f => {
        const content = decodeB64Text(f.data).slice(0, charLimit);
        return `File: ${f.name}\n\`\`\`\n${content}\n\`\`\``;
      }).join('\n\n');
  }

  const finalPrompt = fileContext ? apiText + fileContext : apiText;
  const _result     = await directGeminiCallStreamMultiTurn(hist, finalPrompt, (chunk) => {
    if (!AppState?._abortController?.signal.aborted) updateMsg(resId, chunk);
  });
  if (_result?.model && typeof updateActiveModelUI === 'function') updateActiveModelUI(_result.model);
}

// Extracts final response text, saves to history, syncs
async function _saveAndSync(resId, wasAborted) {
  if (wasAborted || !window.AppState) return;
  const el = document.getElementById(resId);
  let rawText = '';
  if (el && el.getAttribute('data-raw')) {
    rawText = el.getAttribute('data-raw')
      .replace(/&#39;/g, "'").replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
  } else if (el) {
    rawText = el.innerText || '';
  }
  const isErrorMsg = rawText.includes('Connection Error') || rawText.includes('All models failed');
  if (rawText.trim() && !isErrorMsg) {
    // Fire event for FSAgent auto-patch detection
    document.dispatchEvent(new CustomEvent('nivi-message-final', { detail: { text: rawText } }));
    AppState._tabChatHistory.push({ role: 'nivi', text: rawText });
    if (AppState._tabChatHistory.length === 2) {
      const title = await generateChatTitle(AppState._tabChatHistory[0].text) || 'New Chat';
      localStorage.setItem('nivi_current_title', title);
    }
    localStorage.setItem('niviTabChat', JSON.stringify(AppState._tabChatHistory));
  }
  if (typeof syncNiviChat === 'function') {
    await syncNiviChat(window.AppState._tabChatHistory);
  } else {
    const _activeProj = window._activeProjectId || document.getElementById('activeProjectSelect')?.value || 'default';
    if (_activeProj !== 'default') {
      if (typeof saveProjectChat      === 'function') await saveProjectChat(_activeProj, AppState._tabChatHistory);
      if (typeof saveProjectChatLocal === 'function') saveProjectChatLocal(_activeProj, AppState._tabChatHistory);
    } else {
      if (typeof saveUserData === 'function') await saveUserData('history');
    }
  }
}

// ── 4x IMAGE VARIATIONS ──
async function _handle4xImages(prompt, inp) {
  if (!prompt) return;
  appendMsg('user', `/imagine ${prompt}`);
  if (window.AppState) {
    AppState._tabChatHistory.push({ role: 'user', text: `/imagine ${prompt}` });
    localStorage.setItem('niviTabChat', JSON.stringify(AppState._tabChatHistory));
  }
  inp.value = ''; inp.style.height = 'auto';
  const resId  = 'nivi-' + Date.now();
  const model  = window._pollImgModel  || 'flux';
  const ratio  = window._pollImgRatio  || 'square';
  const enhance = window._pollImgEnhance !== false;
  const seeds  = Array.from({ length: 4 }, () => Math.floor(Math.random() * 9999999));

  appendMsg('nivi', `<div class="img-generating"><span class="tm-spinner" style="display:inline-block;margin-right:8px;"></span>Generating 4 variations of: <em>${escapeHTML(prompt)}</em>…</div>`, resId);
  scrollToBottom();
  await new Promise(r => setTimeout(r, 50));

  const gridHtml = `<div style="margin-bottom:10px;font-size:11px;color:var(--text-sub);font-family:var(--mono);">
    4 variations · <strong>${model}</strong> · ${ratio}
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
    ${seeds.map((seed, i) => {
      const url = _buildPollinationsUrl(prompt, model, ratio, enhance, seed);
      const vid = resId + '-v' + i;
      return `<div style="position:relative;border-radius:10px;overflow:hidden;background:rgba(255,255,255,.04);aspect-ratio:1;display:flex;align-items:center;justify-content:center;">
        <div id="${vid}-ld" style="position:absolute;display:flex;flex-direction:column;align-items:center;gap:6px;color:var(--text-sub);font-size:11px;z-index:2;">
          <div class="tm-spinner"></div><span>${i+1}</span>
        </div>
        <img src="${url}" style="width:100%;height:100%;object-fit:cover;opacity:0;transition:opacity .4s;"
          onload="this.style.opacity='1';document.getElementById('${vid}-ld')?.remove();"
          onerror="document.getElementById('${vid}-ld').innerHTML='<span style=color:var(--red)>⚠️ Failed</span>';"
        >
        <div style="position:absolute;bottom:6px;right:6px;display:flex;gap:5px;">
          <a href="${url}" download="nivi-var-${i+1}.png" class="tbtn prim" style="padding:3px 8px;font-size:10px;">⬇</a>
          <a href="${url}" target="_blank" class="tbtn" style="padding:3px 8px;font-size:10px;">🔗</a>
        </div>
      </div>`;
    }).join('')}
  </div>
  <div style="margin-top:10px;font-size:10px;font-family:var(--mono);color:var(--text-muted);opacity:.6;">pollinations.ai · Use /image for single with controls</div>`;

  updateMsg(resId, gridHtml);
  if (window.AppState) {
    AppState._tabChatHistory.push({ role: 'nivi', text: `[4 variations generated for: ${prompt}]` });
    localStorage.setItem('niviTabChat', JSON.stringify(AppState._tabChatHistory));
  }
  renderSidebarData();
}

// ── MAIN ENTRY POINT ──
async function handleSend() {
  if (window.AppState && AppState._isGenerating) return;
  const inp          = document.getElementById('mainInput');
  const text         = inp.value.trim();
  const pendingFiles = window.AppState?._pendingFiles || [];
  if (!text && !pendingFiles.length) return;

  // Image command — /image or natural language triggers
  const _txtLow = text.toLowerCase();
  const _isImgCmd = _txtLow.startsWith('/image ') ||
    _txtLow.startsWith('generate image ') || _txtLow.startsWith('generate an image ') ||
    _txtLow.startsWith('create image ')   || _txtLow.startsWith('create an image ')  ||
    _txtLow.startsWith('make image ')     || _txtLow.startsWith('make an image ');
  if (_isImgCmd) {
    await _handleImageCommand(text, inp);
    return;
  }

  // /imagine — 4 variations at once
  if (_txtLow.startsWith('/imagine ')) {
    await _handle4xImages(text.substring(9).trim(), inp);
    return;
  }

  // /summarize — summarize uploaded files or last reply
  if (_txtLow === '/summarize' || _txtLow.startsWith('/summarize ')) {
    const _sumExtra = text.substring(10).trim();
    inp.value = `Summarize all the uploaded files and key points from our conversation so far. ${_sumExtra}`.trim();
    // fall through to normal send
  }

  // /translate — translate text to any language
  if (_txtLow.startsWith('/translate ')) {
    _handleTranslate(text.substring(11).trim(), inp);
    return;
  }

  // /export — export chat as Markdown
  if (_txtLow === '/export' || _txtLow === '/export md' || _txtLow === '/export markdown') {
    _exportChat('md');
    inp.value = ''; inp.style.height = 'auto';
    return;
  }
  if (_txtLow === '/export pdf') {
    _exportChat('pdf');
    inp.value = ''; inp.style.height = 'auto';
    return;
  }

  // /search — search chat history
  if (_txtLow.startsWith('/search ')) {
    openChatSearch(text.substring(8).trim());
    inp.value = ''; inp.style.height = 'auto';
    return;
  }

  // Commit user message to UI + history
  const userText = pendingFiles.length > 0
    ? `📎 ${pendingFiles.map(f => f.name).join(', ')}\n${text}`
    : text;
  appendMsg('user', userText);
  if (window.AppState) {
    AppState._tabChatHistory.push({ role: 'user', text: userText });
    localStorage.setItem('niviTabChat', JSON.stringify(AppState._tabChatHistory));
  }
  inp.value = ''; inp.style.height = 'auto';
  clearFile();
  toggleGen(true);
  if (window.AppState) AppState._abortController = new AbortController();

  const resId = 'nivi-' + Date.now();
  appendMsg('nivi', `<div class="thinking"><span></span><span></span><span></span></div>`, resId);

  let _wasAborted = false;
  try {
    if (pendingFiles.length > 0 && typeof directGeminiCallWithFile === 'function') {
      await _handleFilesMessage(text, pendingFiles, resId);
    } else if (typeof directGeminiCallStreamMultiTurn === 'function') {
      await _handleTextMessage(text, resId);
    }
  } catch(err) {
    if (!AppState?._abortController?.signal.aborted) {
      updateMsg(resId, 'Connection Error: ' + err.message);
    }
  } finally {
    _wasAborted = AppState?._abortController?.signal.aborted ?? false;
    toggleGen(false);
    if (window.AppState) AppState._abortController = null;
    // Show error if model never replied (thinking bubble stuck)
    const el = document.getElementById(resId);
    if (el && (el.getAttribute('data-raw') || '').includes('class="thinking"')) {
      updateMsg(resId, `<div class="msg-error">
        <strong>Request Failed or Timed Out</strong>
        <div>Check the <b>Model Name</b> in Settings, or type <b>"continue"</b> if the file was too large.</div>
      </div>`);
    }
  }

  await _saveAndSync(resId, _wasAborted);
  renderSidebarData();
}

// ── SETTINGS MODAL ──
window.openSettings = function() {
  const c = document.getElementById('modelChainContainer');
  if (!c) return;
  c.innerHTML = '';
  let chain = [];
  try { chain = JSON.parse(localStorage.getItem('nivi_model_chain') || '[]'); } catch(e) {}
  if (!chain.length) addModelRow({ model: '', key: '', url: '' });
  else chain.forEach(cfg => addModelRow(cfg));
  document.getElementById('settingsModal').classList.add('open');
};

window.addModelRow = function(config = { model: '', key: '', url: '' }) {
  const c = document.getElementById('modelChainContainer');
  if (!c) return;
  const row = document.createElement('div');
  row.className = 'mrow';
  row.innerHTML = `
    <button class="mrow-rm" onclick="this.closest('.mrow').remove()" title="Delete">x</button>
    <div class="mrow-grid">
      <div>
        <label class="flbl">Model Name</label>
        <input type="text" class="finput conf-model" placeholder="e.g. gemini-2.5-flash" value="${config.model || ''}" style="margin-bottom:0;">
      </div>
      <div>
        <label class="flbl">API Key</label>
        <input type="password" class="finput conf-key" placeholder="Paste API key..." value="${config.key || ''}" style="margin-bottom:0;">
      </div>
    </div>
    <div style="margin-top:8px;">
      <label class="flbl">API URL <span style="opacity:.5;">(optional - leave blank for Gemini)</span></label>
      <input type="text" class="finput conf-url" placeholder="https://..." value="${config.url || ''}" style="margin-bottom:0;">
    </div>
  `;
  c.appendChild(row);
};

window.switchActiveModel = function(idx) {
  let chain = [];
  try { chain = JSON.parse(localStorage.getItem('nivi_model_chain') || '[]'); } catch(e) {}
  const i = parseInt(idx);
  if (isNaN(i) || i < 0 || i >= chain.length || i === 0) return;
  const selected = chain.splice(i, 1)[0];
  chain.unshift(selected);
  localStorage.setItem('nivi_model_chain', JSON.stringify(chain));
  updateActiveModelUI();
  renderSidebarData();
  const sm = document.getElementById('settingsModal');
  if (sm && sm.classList.contains('open')) openSettings();
};

// FIX 10: validate that each row has at least a model name AND an API key before saving
window.saveSettings = function() {
  const rows  = document.querySelectorAll('.mrow');
  const chain = [];
  const errors = [];
  rows.forEach((row, idx) => {
    const model = row.querySelector('.conf-model').value.trim();
    const key   = row.querySelector('.conf-key').value.trim();
    const url   = row.querySelector('.conf-url').value.trim();
    if (!model && !key && !url) return; // empty row — skip silently
    if (!model) { errors.push(`Row ${idx + 1}: Model name is required.`); return; }
    if (!key)   { errors.push(`Row ${idx + 1}: API key is required.`);    return; }
    // Auto-detect provider from model name so Gemini models get the correct format
    const modelLower = model.toLowerCase();
    let provider = 'custom';
    if (modelLower.startsWith('gemini-') || modelLower.startsWith('gemma-') || modelLower.startsWith('learnlm-')) {
      provider = 'gemini';
    } else if (url.includes('openrouter.ai')) {
      provider = 'openrouter';
    } else if (url.includes('nvidia.com') || url.includes('api.nvidia')) {
      provider = 'nvidia';
    }
    chain.push({ provider, model, key, url });
  });
  if (errors.length) { alert(errors.join('\n')); return; }
  localStorage.setItem('nivi_model_chain', JSON.stringify(chain));
  closeModal('settingsModal');
  if (typeof updateActiveModelUI === 'function') updateActiveModelUI();
  if (typeof renderSidebarData   === 'function') renderSidebarData();
};

// ── AUTO-SCROLL ──
window.scrollToBottom = function() {
  const chatWrap = document.querySelector('.chat-wrap');
  if (chatWrap) {
    setTimeout(() => { chatWrap.scrollTo({ top: chatWrap.scrollHeight, behavior: 'smooth' }); }, 100);
  }
};

// ══════════════════════════════════════════════════
//  🎤 VOICE INPUT — Web Speech API (no API key)
// ══════════════════════════════════════════════════
let _voiceRecog = null;
let _voiceActive = false;

window.toggleVoiceInput = function() {
  if (_voiceActive) {
    _stopVoice();
  } else {
    _startVoice();
  }
};

function _startVoice() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    alert('Voice input not supported in this browser. Use Chrome or Edge.');
    return;
  }
  _voiceRecog = new SR();
  _voiceRecog.continuous      = true;
  _voiceRecog.interimResults  = true;
  _voiceRecog.lang            = 'en-IN'; // supports Hinglish/Gujarati accent well
  _voiceRecog.maxAlternatives = 1;

  const inp     = document.getElementById('mainInput');
  const micBtn  = document.getElementById('micBtn');
  const baseVal = inp.value;

  _voiceRecog.onstart = () => {
    _voiceActive = true;
    micBtn.classList.add('mic-active');
    micBtn.title = 'Recording… (click to stop)';
  };

  _voiceRecog.onresult = (e) => {
    let interim = '', final = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const t = e.results[i][0].transcript;
      if (e.results[i].isFinal) final += t;
      else interim += t;
    }
    inp.value = baseVal + (baseVal ? ' ' : '') + (final || interim);
    inp.style.height = 'auto';
    inp.style.height = Math.min(inp.scrollHeight, 170) + 'px';
  };

  _voiceRecog.onerror = (e) => {
    console.warn('Voice error:', e.error);
    _stopVoice();
  };

  _voiceRecog.onend = () => {
    _stopVoice();
  };

  _voiceRecog.start();
}

function _stopVoice() {
  _voiceActive = false;
  const micBtn = document.getElementById('micBtn');
  if (micBtn) { micBtn.classList.remove('mic-active'); micBtn.title = 'Voice Input'; }
  if (_voiceRecog) { try { _voiceRecog.stop(); } catch(e) {} _voiceRecog = null; }
}

// ══════════════════════════════════════════════════
//  🌐 TRANSLATE COMMAND
//  Usage: /translate to Gujarati: Hello world
//         /translate Spanish: What is AI?
// ══════════════════════════════════════════════════
async function _handleTranslate(raw, inp) {
  let lang = 'English', textToTrans = raw;
  const m = raw.match(/^(?:to\s+)?([\w\s]+?):\s*(.+)$/is);
  if (m) { lang = m[1].trim(); textToTrans = m[2].trim(); }

  const displayText = `/translate ${raw}`;
  appendMsg('user', displayText);
  if (window.AppState) {
    AppState._tabChatHistory.push({ role: 'user', text: displayText });
    localStorage.setItem('niviTabChat', JSON.stringify(AppState._tabChatHistory));
  }
  inp.value = ''; inp.style.height = 'auto';
  toggleGen(true);
  if (window.AppState) AppState._abortController = new AbortController();

  const resId = 'nivi-' + Date.now();
  appendMsg('nivi', `<div class="thinking"><span></span><span></span><span></span></div>`, resId);

  try {
    const prompt = `Translate the following text to ${lang}.\nReturn ONLY the translated text, no explanations.\n\nText: ${textToTrans}`;
    if (typeof directGeminiCallStreamMultiTurn === 'function') {
      await directGeminiCallStreamMultiTurn([], prompt, (chunk) => {
        if (!AppState?._abortController?.signal.aborted) updateMsg(resId, chunk);
      });
    } else {
      updateMsg(resId, `❌ Translation requires Gemini API key. Add it in ⚙️ Settings.`);
    }
  } catch(e) {
    updateMsg(resId, `❌ Translation failed: ${e.message}`);
  } finally {
    toggleGen(false);
    if (window.AppState) AppState._abortController = null;
    const el = document.getElementById(resId);
    const translated = el ? (el.getAttribute('data-raw') || el.innerText || '') : '';
    if (translated.trim() && window.AppState) {
      AppState._tabChatHistory.push({ role: 'nivi', text: translated });
      localStorage.setItem('niviTabChat', JSON.stringify(AppState._tabChatHistory));
    }
  }
}

// ══════════════════════════════════════════════════
//  📤 EXPORT CHAT (Markdown / PDF)
//  /export       → Markdown .md download
//  /export pdf   → Print dialog (save as PDF)
// ══════════════════════════════════════════════════
window._exportChat = function(format = 'md') {
  const history = window.AppState?._tabChatHistory || [];
  if (!history.length) { alert('No chat history to export.'); return; }

  const title = localStorage.getItem('nivi_current_title') || 'Nivi Chat';
  const date  = new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });

  if (format === 'md') {
    const md = `# ${title}\n_Exported from Nivi AI • ${date}_\n\n---\n\n` +
      history.map(m => {
        const role = m.role === 'user' ? '👤 **You**' : '🤖 **Nivi**';
        return `${role}\n\n${(m.text || '').trim()}\n\n---`;
      }).join('\n');

    const blob = new Blob([md], { type: 'text/markdown' });
    const a    = document.createElement('a');
    a.href     = URL.createObjectURL(blob);
    a.download = `nivi-chat-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(a.href);
    appendMsg('nivi', `✅ Chat exported as **${a.download}**\n\n_${history.length} messages saved._`);

  } else if (format === 'pdf') {
    const printWin = window.open('', '_blank');
    const rows = history.map(m => {
      const isUser = m.role === 'user';
      const txt    = (m.text || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
      return `<div class="${isUser ? 'usr' : 'ai'}">
        <b>${isUser ? '👤 You' : '🤖 Nivi'}</b>
        <p>${txt}</p>
      </div>`;
    }).join('');
    printWin.document.write(`<!DOCTYPE html><html><head><title>${title}</title>
    <style>
      body{font-family:system-ui;max-width:780px;margin:0 auto;padding:28px;background:#fff;color:#111;}
      h1{font-size:22px;color:#7c3aed;border-bottom:2px solid #ede9fe;padding-bottom:8px;}
      .meta{color:#888;font-size:12px;margin-bottom:24px;}
      .usr,.ai{margin:12px 0;padding:12px 16px;border-radius:8px;}
      .usr{background:#f5f3ff;border-left:3px solid #7c3aed;}
      .ai{background:#f0fdf4;border-left:3px solid #22c55e;}
      b{font-size:11px;text-transform:uppercase;letter-spacing:.05em;opacity:.7;}
      p{margin:6px 0 0;white-space:pre-wrap;font-size:14px;line-height:1.6;}
      @media print{body{padding:0;}}
    </style></head>
    <body><h1>${title}</h1><p class="meta">Nivi AI · ${date} · ${history.length} messages</p>${rows}</body></html>`);
    printWin.document.close();
    printWin.focus();
    setTimeout(() => printWin.print(), 400);
  }
};

// ══════════════════════════════════════════════════
//  📥 DRAG & DROP FILE UPLOAD
// ══════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', function _initDragDrop() {
  const chatWin = document.querySelector('.chat-wrap') || document.getElementById('chatWrap');
  if (!chatWin) return;

  let _dc = 0;

  chatWin.addEventListener('dragenter', (e) => {
    e.preventDefault();
    if (!e.dataTransfer.types.includes('Files')) return;
    _dc++;
    chatWin.classList.add('drag-over');
  });
  chatWin.addEventListener('dragleave', () => {
    _dc--;
    if (_dc <= 0) { _dc = 0; chatWin.classList.remove('drag-over'); }
  });
  chatWin.addEventListener('dragover', (e) => { e.preventDefault(); });
  chatWin.addEventListener('drop', (e) => {
    e.preventDefault();
    _dc = 0;
    chatWin.classList.remove('drag-over');
    const files = Array.from(e.dataTransfer.files);
    if (!files.length) return;
    if (window.AppState) AppState._pendingFiles = (AppState._pendingFiles || []).concat(files);
    const names = files.map(f => f.name).join(', ');
    const prev  = document.getElementById('filePreview');
    const nameEl = document.getElementById('filePreviewName');
    if (prev && nameEl) { nameEl.textContent = `📁 ${names}`; prev.classList.add('show'); }
    document.getElementById('mainInput')?.focus();
  });
});

// ══════════════════════════════════════════════════
//  🔍 CHAT SEARCH  (Ctrl+F or /search query)
// ══════════════════════════════════════════════════
let _searchMatches = [], _searchIdx = 0;

window.openChatSearch = function(prefill = '') {
  let bar = document.getElementById('chatSearchBar');
  if (!bar) {
    bar = document.createElement('div');
    bar.id        = 'chatSearchBar';
    bar.className = 'chat-search-bar';
    bar.innerHTML = `
      <input id="chatSearchInput" type="text" placeholder="🔍 Search messages..." autocomplete="off" spellcheck="false">
      <span id="chatSearchCount" class="cs-count"></span>
      <button class="cs-nav" onclick="window._searchNav(-1)" title="Previous (Shift+Enter)">↑</button>
      <button class="cs-nav" onclick="window._searchNav(1)"  title="Next (Enter)">↓</button>
      <button class="cs-close" onclick="closeChatSearch()" title="Close (Esc)">×</button>`;
    document.querySelector('.main')?.prepend(bar);
    const sinp = document.getElementById('chatSearchInput');
    sinp.addEventListener('input', _doSearch);
    sinp.addEventListener('keydown', e => {
      if (e.key === 'Enter')  { e.preventDefault(); window._searchNav(e.shiftKey ? -1 : 1); }
      if (e.key === 'Escape') closeChatSearch();
    });
  }
  bar.classList.add('open');
  const sinp = document.getElementById('chatSearchInput');
  sinp.value = prefill;
  sinp.focus();
  if (prefill) _doSearch();
};

window.closeChatSearch = function() {
  document.getElementById('chatSearchBar')?.classList.remove('open');
  document.querySelectorAll('mark.cs-hl').forEach(m => {
    const t = document.createTextNode(m.textContent);
    m.parentNode.replaceChild(t, m);
  });
  _searchMatches = []; _searchIdx = 0;
};

function _doSearch() {
  // Clear old highlights
  document.querySelectorAll('mark.cs-hl').forEach(m => {
    const t = document.createTextNode(m.textContent);
    m.parentNode.replaceChild(t, m);
  });
  _searchMatches = []; _searchIdx = 0;

  const q = (document.getElementById('chatSearchInput')?.value || '').trim();
  const cnt = document.getElementById('chatSearchCount');
  if (!q) { if (cnt) cnt.textContent = ''; return; }

  const esc   = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(esc, 'gi');

  document.querySelectorAll('.bubble').forEach(bubble => {
    const walker = document.createTreeWalker(bubble, NodeFilter.SHOW_TEXT);
    const nodes  = [];
    let n;
    while ((n = walker.nextNode())) nodes.push(n);
    nodes.forEach(node => {
      if (!regex.test(node.textContent)) return;
      regex.lastIndex = 0;
      const frag = document.createDocumentFragment();
      let last = 0, match;
      regex.lastIndex = 0;
      while ((match = regex.exec(node.textContent)) !== null) {
        frag.appendChild(document.createTextNode(node.textContent.slice(last, match.index)));
        const mark = document.createElement('mark');
        mark.className = 'cs-hl';
        mark.textContent = match[0];
        frag.appendChild(mark);
        last = match.index + match[0].length;
      }
      frag.appendChild(document.createTextNode(node.textContent.slice(last)));
      node.parentNode.replaceChild(frag, node);
    });
  });

  _searchMatches = Array.from(document.querySelectorAll('mark.cs-hl'));
  if (cnt) cnt.textContent = _searchMatches.length ? `1 / ${_searchMatches.length}` : 'No results';
  if (_searchMatches.length) _scrollToMatch(0);
}

window._searchNav = function(dir) {
  if (!_searchMatches.length) return;
  _searchIdx = (_searchIdx + dir + _searchMatches.length) % _searchMatches.length;
  const cnt = document.getElementById('chatSearchCount');
  if (cnt) cnt.textContent = `${_searchIdx + 1} / ${_searchMatches.length}`;
  _scrollToMatch(_searchIdx);
};

function _scrollToMatch(idx) {
  _searchMatches.forEach((m, i) => m.classList.toggle('cs-hl-active', i === idx));
  _searchMatches[idx]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// Ctrl+F → open search
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
    if (['TEXTAREA','INPUT'].includes(document.activeElement?.tagName)) return;
    e.preventDefault();
    openChatSearch();
  }
});


