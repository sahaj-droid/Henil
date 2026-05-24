// ══════════════════════════════════════════════════════════
//  NC-IMAGE — Image Generation, Img2Img, File & Text Handlers
// ══════════════════════════════════════════════════════════

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

  // Read as base64 dataURL
  const dataUrl = await new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = e => res(e.target.result);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
  // Pure base64 (strip prefix) for Gemini
  const b64only = dataUrl.split(',')[1];
  const mime    = file.type || 'image/jpeg';

  // Find bubble
  const block  = document.getElementById('imgblock-' + resId);
  if (!block) return;
  const bubble = block.closest('.bubble');
  if (!bubble) return;

  const i2iId = resId + '-i2i';

  // Step 1: Show reference + analyzing state
  bubble.innerHTML = `
  <div class="img-result" id="imgblock-${i2iId}">
    <div style="display:flex;gap:12px;align-items:flex-start;margin-bottom:12px;">
      <div style="flex-shrink:0;">
        <div style="font-size:10px;font-family:var(--mono);color:var(--text-muted);margin-bottom:4px;text-transform:uppercase;">Reference</div>
        <img src="${dataUrl}" style="width:80px;height:80px;object-fit:cover;border-radius:8px;border:1px solid rgba(255,255,255,.12);">
      </div>
      <div style="flex:1;">
        <div style="font-size:11px;color:var(--text-sub);font-family:var(--mono);margin-bottom:8px;">🖼️ Img2Img · <strong>${model}</strong></div>
        <div id="i2i-status-${i2iId}" style="display:flex;align-items:center;gap:8px;font-family:var(--mono);font-size:11px;color:var(--accent-lt);">
          <div class="tm-spinner"></div> Analyzing reference image with Gemini Vision…
        </div>
      </div>
    </div>
    <div id="i2i-result-${i2iId}" style="border-radius:12px;overflow:hidden;background:rgba(255,255,255,.04);min-height:100px;display:flex;align-items:center;justify-content:center;">
      <span style="font-size:12px;color:var(--text-muted);font-family:var(--mono);">Generating…</span>
    </div>
  </div>`;
  bubble.setAttribute('data-raw', `[Img2Img: ${prompt}]`);
  scrollToBottom();

  const statusEl = document.getElementById(`i2i-status-${i2iId}`);
  const resultEl = document.getElementById(`i2i-result-${i2iId}`);

  // Step 2: Use Gemini Vision to extract style description from reference image
  let styleDesc = '';
  try {
    if (typeof directGeminiCallWithFile === 'function') {
      const visionResult = await directGeminiCallWithFile(
        `Analyze this image and describe its visual style in detail for use as an image generation prompt. Include: art style, color palette, lighting, mood, texture, composition, and any notable visual characteristics. Be concise but specific. Do NOT describe the subject/content — focus ONLY on visual style.`,
        b64only,
        mime
      );
      styleDesc = visionResult?.answer || '';
    }
  } catch(e) {
    console.warn('Gemini Vision failed:', e);
  }

  // Step 3: Build enhanced prompt
  let enhancedPrompt;
  if (styleDesc) {
    enhancedPrompt = `${prompt}, in the style of: ${styleDesc}`;
    if (statusEl) statusEl.innerHTML = `✅ Style extracted · Generating image…`;
  } else {
    // Fallback: no Gemini key — add generic style transfer hint
    enhancedPrompt = `${prompt}, highly detailed, matching the style and color palette of the reference image, professional quality`;
    if (statusEl) statusEl.innerHTML = `⚠️ No Gemini key — using prompt-based style transfer`;
  }

  // Step 4: Generate with Pollinations using enhanced prompt
  const r    = POLL_RATIOS.find(x => x.id === ratio) || POLL_RATIOS[0];
  const seed = Math.floor(Math.random() * 9999999);
  const genUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(enhancedPrompt)}?model=${model}&width=${r.w}&height=${r.h}&seed=${seed}&nologo=true&enhance=true`;

  if (resultEl) {
    resultEl.innerHTML = `
      <div style="position:relative;width:100%;">
        <div id="i2i-ld-${i2iId}" style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;color:var(--text-sub);font-size:12px;z-index:2;">
          <div class="tm-spinner"></div><span>Generating img2img…</span>
        </div>
        <img src="${genUrl}"
          style="max-width:100%;border-radius:12px;display:block;opacity:0;transition:opacity .4s;"
          onload="this.style.opacity='1';document.getElementById('i2i-ld-${i2iId}')?.remove();"
          onerror="document.getElementById('i2i-ld-${i2iId}').innerHTML='<span style=color:var(--red)>⚠️ Generation failed. Try a different model.</span>';"
          alt="Img2Img result"
        >
      </div>
      <div class="img-actions" style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap;">
        <a href="${genUrl}" target="_blank" download="nivi-i2i.png" class="tbtn prim img-dl">⬇ Download</a>
        <a href="${genUrl}" target="_blank" class="tbtn">🔗 Open</a>
        <button class="tbtn" onclick="window._regenI2i('${i2iId}','${escapeHTML(enhancedPrompt)}','${model}','${ratio}')">🔄 Regen</button>
        <button class="tbtn" onclick="_regenImg('${resId}','${escapeHTML(prompt)}','${model}','${ratio}',true)">← Original</button>
      </div>
      <div style="margin-top:6px;font-size:10px;font-family:var(--mono);color:var(--text-muted);opacity:.6;">
        Style-transfer via Gemini Vision + Pollinations · ${model}
      </div>`;
  }
};

// Regen img2img with new seed
window._regenI2i = function(i2iId, enhancedPrompt, model, ratio) {
  const resultEl = document.getElementById('i2i-result-' + i2iId);
  if (!resultEl) return;
  const r    = POLL_RATIOS.find(x => x.id === ratio) || POLL_RATIOS[0];
  const seed = Math.floor(Math.random() * 9999999);
  const url  = `https://image.pollinations.ai/prompt/${encodeURIComponent(enhancedPrompt)}?model=${model}&width=${r.w}&height=${r.h}&seed=${seed}&nologo=true&enhance=true`;
  const imgEl = resultEl.querySelector('img[alt="Img2Img result"]');
  if (imgEl) {
    imgEl.style.opacity = '0';
    imgEl.src = url;
    imgEl.onload = () => imgEl.style.opacity = '1';
  }
};

// Handles /image command OR natural language triggers — returns true so caller can bail out
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
async function _handleTextMessage(text, resId, opts = {}) {
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

  const curDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const curTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const niviDirective = `SYSTEM DIRECTIVE: You are Nivi — a smart, friendly, and versatile personal AI assistant built into the user's local workspace.

CURRENT DATE & TIME:
- Today's date is: ${curDate}
- Current local time is: ${curTime}
- ALWAYS assume the current year is ${new Date().getFullYear()} (May 2026), and treat terms like "today", "yesterday", "tomorrow", or recent matches relative to this date!

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

REAL-TIME WEB SEARCH (GOOGLE SEARCH):
- Native Google Search grounding is enabled when the user prefixes their message with "/web".
- Example: "/web who won the cricket match yesterday?" or "/web current gold price"
- When "/web" is used, Google Search grounding is ACTIVE, and search results are automatically integrated. Use these search results to provide accurate, up-to-date answers! Do NOT claim you only have 2024 data when "/web" search is active.
- If the user asks about real-time events, current news, weather, or latest post-2024 info WITHOUT using "/web", do not just say you cannot do it. Gently and warmly remind them in their language to prefix their prompt with "/web" to fetch live data! (e.g., in Gujarati: "Dost, real-time/latest માહિતી મેળવવા માટે તમારા પ્રશ્નની આગળ \`/web\` લખો! જેમ કે: \`/web આજના સમાચાર\`")

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

  let searchContext = '';
  let activeOpts = { ...opts };
  if (opts.useWebSearch && typeof window.duckDuckGoSearch === 'function') {
    if (!AppState?._abortController?.signal.aborted) {
      updateMsg(resId, `<div class="thinking"><span></span><span></span><span></span></div><div style="font-size:12px;opacity:0.6;margin-top:6px;font-family:var(--sans);">🔍 Searching DuckDuckGo for "${escapeHTML(apiText)}"...</div>`);
    }

    try {
      const results = await window.duckDuckGoSearch(apiText);
      if (results && results.length > 0) {
        searchContext = `\n\n---\n[LIVE WEB SEARCH RESULTS — DUCKDUCKGO]\nQuery: "${apiText}"\n\n` +
          results.map((r, i) => `[Source ${i+1}]\nTitle: ${r.title}\nLink: ${r.link}\nSnippet: ${r.snippet}`).join('\n\n') +
          `\n\nInstructions: Use these real-time search results to provide a comprehensive, accurate, and up-to-date response in the user's language. Cite sources and provide absolute links when referencing findings. Do NOT claim your knowledge is limited to 2024.`;

        if (!AppState?._abortController?.signal.aborted) {
          updateMsg(resId, `<div class="thinking"><span></span><span></span><span></span></div><div style="font-size:12px;color:#4ade80;margin-top:6px;font-family:var(--sans);display:flex;align-items:center;gap:4px;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg> Found ${results.length} live search sources! Synthesizing...</div>`);
        }
      } else {
        searchContext = `\n\n---\n[LIVE WEB SEARCH RESULTS — DUCKDUCKGO]\nQuery: "${apiText}"\n\nNo search results found.`;
        if (!AppState?._abortController?.signal.aborted) {
          updateMsg(resId, `<div class="thinking"><span></span><span></span><span></span></div><div style="font-size:12px;opacity:0.5;margin-top:6px;font-family:var(--sans);">⚠️ No live sources found. Answering using default knowledge cutoff...</div>`);
        }
      }
    } catch(e) {
      console.error('DDG integration error:', e);
      searchContext = `\n\n---\n[LIVE WEB SEARCH RESULTS — DUCKDUCKGO]\nQuery: "${apiText}"\n\nSearch failed due to a network error.`;
    }
    activeOpts.useWebSearch = false;
  }

  const finalPrompt = (fileContext || searchContext)
    ? apiText + fileContext + searchContext
    : apiText;

  const _result     = await directGeminiCallStreamMultiTurn(hist, finalPrompt, (chunk) => {
    if (!AppState?._abortController?.signal.aborted) updateMsg(resId, chunk);
  }, activeOpts);
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
