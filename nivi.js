window.AppState = {
  _tabChatHistory: [],
  _pendingFile: null,
  _isGenerating: false,
  _abortController: false
};

function _formatNiviResponse(text) {
  if (!text) return '';
  let html = text;
  html = html.replace(/^\s*[\*\-]\s*$/gm, '');
  html = html.replace(/\*\*(.+?)\*\*/g, '<span style="font-weight:700;color:var(--accent,#4285f4);">$1</span>');
  html = html.replace(/^(\d+)[.)]\s+(.+)$/gm, '<div style="display:flex;gap:6px;margin:6px 0;"><span style="color:#4285f4;font-weight:700;flex-shrink:0;">$1.</span><span>$2</span></div>');
  html = html.replace(/^\s*[•\-\*]\s+(.+)$/gm, '<div style="display:flex;gap:6px;margin:4px 0;"><span style="color:#4285f4;flex-shrink:0;">●</span><span>$1</span></div>');
  html = html.replace(/\n{3,}/g, '\n\n'); 
  html = html.replace(/\n\n/g, '<div style="margin-top:10px;"></div>');
  html = html.replace(/\n/g, '<br>');
  return html;
}

function handleFileSelect(inp) {
  if (inp.files && inp.files[0]) {
    window.AppState._pendingFile = inp.files[0];
    const preview = document.getElementById('filePreview');
    preview.style.display = 'block';
    preview.innerText = `📎 Ready: ${inp.files[0].name}`;
    document.getElementById('mainInput').focus();
  }
}

function saveFileToMemory(filename) {
  let files = JSON.parse(localStorage.getItem('nivi_file_memory') || '[]');
  if (!files.find(f => f.name === filename)) {
    files.push({ name: filename, ts: Date.now() });
    localStorage.setItem('nivi_file_memory', JSON.stringify(files));
    if(typeof renderSidebarData === 'function') renderSidebarData();
  }
}

function appendMsg(role, text, id) {
  const win = document.getElementById('chatWindow');
  const hero = document.getElementById('heroSection');
  if (hero) hero.style.display = 'none';

  const row = document.createElement('div');
  row.className = `msg-row ${role === 'user' ? 'user-row' : 'nivi-row'}`;
  
  const avatarHtml = role === 'nivi' ? `<div class="avatar nivi-avatar">✦</div>` : '';
  const formattedText = role === 'nivi' ? _formatNiviResponse(text) : text.replace(/\n/g, '<br>');
  const content = `<div class="bubble" id="${id||''}">${formattedText}</div>`;
  
  row.innerHTML = avatarHtml + content;
  win.appendChild(row);
  win.scrollTop = win.scrollHeight;
  
  if(role === 'user') {
    AppState._tabChatHistory.push({ role:'user', text });
    localStorage.setItem('niviTabChat', JSON.stringify(AppState._tabChatHistory));
  }
}

function updateMsg(id, text) {
  const el = document.getElementById(id);
  if (el) {
    el.innerHTML = _formatNiviResponse(text);
    const win = document.getElementById('chatWindow');
    win.scrollTop = win.scrollHeight;
  }
}

async function handleSend() {
  if(window.AppState._isGenerating) return;
  
  const inp = document.getElementById('mainInput');
  const text = inp.value.trim();
  const file = AppState._pendingFile;

  if (!text && !file) return;

  const userText = file ? `📎 ${file.name}\n${text}` : text;
  appendMsg('user', userText);
  inp.value = '';
  document.getElementById('filePreview').style.display = 'none';
  
  toggleGenerating(true);
  window.AppState._abortController = false;

  const resId = 'nivi-' + Date.now();
  appendMsg('nivi', '<span style="color:var(--text-sub); font-size:13px;">Thinking...</span>', resId);

  try {
    if (file) {
      const base64 = await window.readFileAsBase64(file);
      const mime = window.getFileMimeType ? window.getFileMimeType(file.name) : file.type;
      const r = await window.directGeminiCallWithFile(text || "Analyze this file.", base64, mime);
      if(!window.AppState._abortController) {
          updateMsg(resId, r.answer || "⚠️ No answer received.");
          saveFileToMemory(file.name);
      }
      AppState._pendingFile = null;
      document.getElementById('fileInp').value = ''; 
    } else {
      const history = AppState._tabChatHistory.slice(0, -1).map(m => ({ role: m.role==='nivi'?'model':'user', parts:[{text:m.text}] }));
      await window.directGeminiCallStreamMultiTurn(history, text, (chunk) => {
         if(!window.AppState._abortController) updateMsg(resId, chunk);
      });
    }
  } catch (err) {
    if(!window.AppState._abortController) updateMsg(resId, "⚠️ Connection Error: " + err.message);
  }
  
  if(!window.AppState._abortController) {
      AppState._tabChatHistory.push({ role:'nivi', text: document.getElementById(resId).innerText });
      localStorage.setItem('niviTabChat', JSON.stringify(AppState._tabChatHistory));
  }
  toggleGenerating(false);
  renderSidebarData();
}

function restoreChat() {
  try {
    const saved = JSON.parse(localStorage.getItem('niviTabChat'));
    if(saved && saved.length > 0) {
      AppState._tabChatHistory = [];
      const hero = document.getElementById('heroSection');
      if (hero) hero.style.display = 'none';
      saved.forEach(msg => appendMsg(msg.role, msg.text));
    }
  } catch(e) {}
}

function renderSidebarData() {
  let models = [];
  try { models = JSON.parse(localStorage.getItem('nivi_model_chain') || '[]'); } catch(e) {}
  if(models.length === 0) models = [{provider: "System", model: "Configure via Settings"}];
  document.getElementById('modelList').innerHTML = models.map(m => `<div class="data-item">📦 ${m.provider}: ${m.model || 'Default'}</div>`).join('');
  
  const files = JSON.parse(localStorage.getItem('nivi_file_memory') || '[]');
  if(files.length > 0) {
    document.getElementById('fileList').innerHTML = files.map(f => `<div class="data-item" title="Saved to memory">📄 ${f.name}</div>`).join('');
  } else {
    document.getElementById('fileList').innerHTML = `<div class="data-item" style="opacity:0.5;">No files yet</div>`;
  }

  const history = JSON.parse(localStorage.getItem('niviTabChat') || '[]');
  if(history.length > 0) {
    document.getElementById('chatHistory').innerHTML = `<div class="data-item">💬 Last Chat (${history.length} msgs)</div>`;
  } else {
    document.getElementById('chatHistory').innerHTML = `<div class="data-item" style="opacity:0.5;">No recent chats</div>`;
  }
}
