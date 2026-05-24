// ══════════════════════════════════════════════════════════
//  NC-EXPORT-SEARCH — Export Chat, Drag-Drop, Chat Search
// ══════════════════════════════════════════════════════════

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
