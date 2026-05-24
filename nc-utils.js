// ══════════════════════════════════════════════════════════
//  NC-UTILS — AppState, Helpers, File Attachments, Init
// ══════════════════════════════════════════════════════════

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
  const allowedTags  = new Set(['P','BR','STRONG','B','EM','I','U','S','CODE','PRE','BLOCKQUOTE','UL','OL','LI','A','IMG','DIV','SPAN','TABLE','THEAD','TBODY','TR','TH','TD','HR','H1','H2','H3','H4','BUTTON','SVG','RECT','PATH','POLYLINE','LINE']);
  const allowedAttrs = new Set(['href','src','alt','title','class','target','rel','style','width','height','viewbox','fill','stroke','stroke-width','d','x','y','rx','points','x1','y1','x2','y2','data-copy-id','data-run-js-id','data-run-py-id']);
  tpl.content.querySelectorAll('*').forEach(node => {
    if (!allowedTags.has(node.tagName.toUpperCase())) {
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
