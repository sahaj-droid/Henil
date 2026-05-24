// ══════════════════════════════════════════════════════════
//  NC-SEND — 4x Image Variations + Main handleSend Entry
// ══════════════════════════════════════════════════════════

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

  // /video — Pollinations video generation
  if (_txtLow.startsWith('/video ') || _txtLow.startsWith('generate video ') || _txtLow.startsWith('create video ')) {
    let vPrompt = text;
    if (_txtLow.startsWith('/video '))          vPrompt = text.substring(7).trim();
    else if (_txtLow.startsWith('generate video ')) vPrompt = text.substring(15).trim();
    else if (_txtLow.startsWith('create video '))   vPrompt = text.substring(13).trim();
    await _handleVideoCommand(vPrompt, inp);
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

  // ── FILE AGENT COMMANDS ──
  // /ls  or  /files — list files in granted folder
  if (_txtLow === '/ls' || _txtLow === '/files') {
    _cmdLs(inp); return;
  }
  // /read filename.js — read file & send content to chat
  if (_txtLow.startsWith('/read ')) {
    _cmdRead(text.substring(6).trim(), inp); return;
  }
  // /newfile filename.js — create empty file
  if (_txtLow.startsWith('/newfile ')) {
    _cmdNewfile(text.substring(9).trim(), inp); return;
  }
  // /edit filename.js: instructions — AI edits file
  if (_txtLow.startsWith('/edit ')) {
    _cmdEdit(text.substring(6).trim(), inp); return;
  }
  // /run — run code in next code block or selected text
  if (_txtLow.startsWith('/run ')) {
    const codeToRun = text.substring(5).trim();
    inp.value = ''; inp.style.height = 'auto';
    _runInlineCode(codeToRun); return;
  }

  // /web — native Google Search grounding or global toggle
  let isWebSearch = window.AppState?.useSearch || false;
  let textToSend = text;
  if (_txtLow.startsWith('/web ') || _txtLow === '/web') {
    isWebSearch = true;
    textToSend = text.substring(4).trim();
    if (!textToSend) textToSend = "Search the web and give me the latest news.";
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
      await _handleFilesMessage(textToSend, pendingFiles, resId);
    } else if (typeof directGeminiCallStreamMultiTurn === 'function') {
      await _handleTextMessage(textToSend, resId, { useWebSearch: isWebSearch });
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
