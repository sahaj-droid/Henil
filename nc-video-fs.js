// ══════════════════════════════════════════════════════════
//  NC-VIDEO-FS — Video Gen, Code Agent Fix, FS Commands
// ══════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════
//  🎬 VIDEO GENERATION — Pollinations.ai
//  /video a futuristic cityscape timelapse
// ══════════════════════════════════════════════════

const VIDEO_MODELS = [
  { id: 'turbo',  label: '⚡ Turbo',  desc: 'Fast ~10s' },
  { id: 'stable', label: '✦ Stable', desc: 'Quality ~30s' },
];
const VIDEO_RATIOS = [
  { id: '16:9', label: '▬ 16:9', w: 1280, h: 720  },
  { id: '9:16', label: '▮ 9:16', w: 720,  h: 1280 },
  { id: '1:1',  label: '⬛ 1:1', w: 720,  h: 720  },
];

window._vidModel = window._vidModel || 'turbo';
window._vidRatio = window._vidRatio || '16:9';

function _buildVideoUrl(prompt, model, ratio) {
  const r   = VIDEO_RATIOS.find(x => x.id === ratio) || VIDEO_RATIOS[0];
  const enc = encodeURIComponent(prompt);
  return `https://video.pollinations.ai/prompt/${enc}?model=${model}&width=${r.w}&height=${r.h}&nologo=true`;
}

function _buildVideoUI(prompt, model, ratio, resId) {
  const url       = _buildVideoUrl(prompt, model, ratio);
  const modelOpts = VIDEO_MODELS.map(m =>
    `<option value="${m.id}" ${model === m.id ? 'selected' : ''}>${m.label} — ${m.desc}</option>`
  ).join('');
  const ratioOpts = VIDEO_RATIOS.map(r =>
    `<option value="${r.id}" ${ratio === r.id ? 'selected' : ''}>${r.label}</option>`
  ).join('');
  const eta = model === 'turbo' ? '~10 seconds' : '~30 seconds';

  return `<div class="vid-result" id="vidblock-${resId}">
    <div class="img-controls" style="display:flex;align-items:center;gap:7px;flex-wrap:wrap;margin-bottom:10px;">
      <select class="img-sel vid-model-sel" onchange="window._vidModel=this.value;_regenVideo('${resId}','${escapeHTML(prompt)}',this.value,document.getElementById('vrat-${resId}').value)"
        style="font-size:11px;padding:4px 8px;border-radius:7px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);color:#e2e2e2;cursor:pointer;font-family:var(--mono);">${modelOpts}</select>
      <select id="vrat-${resId}" class="img-sel" onchange="window._vidRatio=this.value;_regenVideo('${resId}','${escapeHTML(prompt)}',document.querySelector('#vidblock-${resId} .vid-model-sel').value,this.value)"
        style="font-size:11px;padding:4px 8px;border-radius:7px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);color:#e2e2e2;cursor:pointer;font-family:var(--mono);">${ratioOpts}</select>
      <button onclick="_regenVideo('${resId}','${escapeHTML(prompt)}',document.querySelector('#vidblock-${resId} .vid-model-sel').value,document.getElementById('vrat-${resId}').value)" class="tbtn" style="font-size:11px;padding:4px 10px;">🔄 Regen</button>
    </div>
    <div class="vid-wrap" id="vid-wrap-${resId}">
      <div id="vid-loading-${resId}" class="vid-loading">
        <div class="vid-loading-inner">
          <span style="font-size:32px;animation:vidReel 1s linear infinite;display:inline-block;">🎬</span>
          <div class="tm-spinner" style="width:28px;height:28px;border-width:3px;"></div>
          <div style="font-size:12px;color:var(--text-sub);font-family:var(--mono);">Generating video…</div>
          <div style="font-size:10px;color:var(--text-muted);font-family:var(--mono);">${eta}</div>
        </div>
      </div>
      <video id="vid-el-${resId}" src="${url}"
        style="max-width:100%;border-radius:12px;display:block;opacity:0;transition:opacity .4s;"
        controls loop playsinline
        onloadeddata="this.style.opacity='1';document.getElementById('vid-loading-${resId}')?.remove();"
        onerror="document.getElementById('vid-loading-${resId}').innerHTML='<div class=vid-loading-inner><span style=font-size:28px>⚠️</span><p style=color:var(--red);font-family:var(--mono);font-size:11px;margin:4px 0;text-align:center>Video API failed.<br>Pollinations video is beta — try Turbo model.</p><button class=tbtn onclick=\"_regenVideo(\\'${resId}\\',\\'${escapeHTML(prompt)}\\',\\'turbo\\',\\'16:9\\')\" style=margin-top:6px>↺ Retry Turbo</button></div>';"
      ></video>
    </div>
    <div class="img-actions" style="display:flex;gap:8px;margin-top:10px;align-items:center;flex-wrap:wrap;">
      <a href="${url}" download="nivi-video.mp4" class="tbtn prim img-dl">⬇ Download</a>
      <a href="${url}" target="_blank" class="tbtn">🔗 Open</a>
      <span style="margin-left:auto;font-size:10px;font-family:var(--mono);color:var(--text-muted);opacity:.6;">pollinations.ai • ${model}</span>
    </div>
  </div>`;
}

window._regenVideo = function(resId, prompt, model, ratio) {
  window._vidModel = model; window._vidRatio = ratio;
  const bubble = document.getElementById('vidblock-' + resId)?.closest('.bubble');
  if (bubble) { bubble.innerHTML = _buildVideoUI(prompt, model, ratio, resId); bubble.setAttribute('data-raw', `[Video: ${prompt}]`); }
};

async function _handleVideoCommand(prompt, inp) {
  if (!prompt) return;
  appendMsg('user', `/video ${prompt}`);
  if (window.AppState) {
    AppState._tabChatHistory.push({ role: 'user', text: `/video ${prompt}` });
    localStorage.setItem('niviTabChat', JSON.stringify(AppState._tabChatHistory));
  }
  inp.value = ''; inp.style.height = 'auto';
  const resId = 'nivi-' + Date.now();
  appendMsg('nivi', `<div class="img-generating"><span class="tm-spinner" style="display:inline-block;margin-right:8px;"></span>Generating video: <em>${escapeHTML(prompt)}</em>…</div>`, resId);
  scrollToBottom();
  await new Promise(r => setTimeout(r, 50));
  updateMsg(resId, _buildVideoUI(prompt, window._vidModel || 'turbo', window._vidRatio || '16:9', resId));
  if (window.AppState) {
    AppState._tabChatHistory.push({ role: 'nivi', text: `[Video generated for: ${prompt}]` });
    localStorage.setItem('niviTabChat', JSON.stringify(AppState._tabChatHistory));
  }
  renderSidebarData();
}

// ══════════════════════════════════════════════════
//  🤖 CODE AGENT — Run → Error → AI Fix → Re-run
// ══════════════════════════════════════════════════

window._codeAgentFix = async function(runId, lang, code, errorMsg) {
  const outEl = document.getElementById(runId + '-out');
  if (!outEl) return;

  outEl.innerHTML = `<div style="display:flex;align-items:center;gap:8px;font-family:var(--mono);font-size:11px;color:var(--accent-lt);padding:4px 0;">
    <div class="tm-spinner" style="width:14px;height:14px;border-width:2px;"></div>
    🤖 Code Agent fixing error…
  </div>`;

  try {
    if (typeof directGeminiCallStreamMultiTurn !== 'function') {
      outEl.innerHTML = '<p style="color:var(--red);font-family:var(--mono);font-size:11px;">❌ Gemini API key required. Add in ⚙️ Settings.</p>';
      return;
    }

    const fixPrompt = `You are a ${lang} debugging expert. Fix this code that has an error.

ERROR: ${errorMsg}

BROKEN CODE:
\`\`\`${lang}
${code}
\`\`\`

Return ONLY the fixed code inside a single \`\`\`${lang} ... \`\`\` block. No explanation.`;

    let fixedResponse = '';
    await directGeminiCallStreamMultiTurn([], fixPrompt, (chunk) => { fixedResponse = chunk; });

    const codeMatch = fixedResponse.match(/```(?:[\w]*)\n?([\s\S]*?)```/);
    const fixedCode = codeMatch ? codeMatch[1].trim() : fixedResponse.trim();

    if (!fixedCode) {
      outEl.innerHTML = '<pre style="color:var(--red);font-family:var(--mono);font-size:11px;">❌ AI could not fix this code.</pre>';
      return;
    }

    const fixId = 'fix-' + Math.random().toString(36).substr(2, 8);
    const runFn = lang === 'python' ? `runPYCode('${fixId}')` : `runJSCode('${fixId}')`;
    const runLabel = lang === 'python' ? '▶ Re-run PY' : '▶ Re-run JS';

    outEl.innerHTML = `
      <div class="code-agent-fix-block">
        <div class="code-agent-fix-header">
          <span>✅ Fixed by AI</span>
          <button class="code-copy-btn" onclick="copyCode('${fixId}')">⧉ Copy</button>
        </div>
        <div class="code-block-wrap" id="${fixId}-wrap" style="margin:0;border-radius:0 0 8px 8px;border-top:none;">
          <div class="code-block-header">
            <span class="code-lang">${lang}</span>
            <button class="code-run-btn" onclick="${runFn}" style="background:rgba(34,197,94,.15);border-color:rgba(34,197,94,.3);color:#86efac;">${runLabel}</button>
          </div>
          <pre><code id="${fixId}-src" class="language-${lang}">${escapeHTML(fixedCode)}</code></pre>
          <div id="${fixId}-out" class="code-output" style="display:none;"></div>
        </div>
      </div>`;

  } catch(e) {
    outEl.innerHTML = `<pre style="color:var(--red);font-family:var(--mono);font-size:11px;">❌ Fix failed: ${escapeHTML(e.message)}</pre>`;
  }
};

// /run js\n code  OR  /run python\n code — run inline code from chat
window._runInlineCode = function(raw) {
  const m    = raw.match(/^(js|javascript|python|py)[\s\n]+([\s\S]+)/i);
  const lang = m ? m[1].toLowerCase() : 'js';
  const code = m ? m[2].trim() : raw.trim();
  const norm = (lang === 'python' || lang === 'py') ? 'python' : 'javascript';
  const rid  = 'inline-' + Math.random().toString(36).substr(2, 8);
  const runFn = norm === 'python' ? `runPYCode('${rid}')` : `runJSCode('${rid}')`;
  const label = norm === 'python' ? '▶ Run PY' : '▶ Run JS';

  const html = `<div class="code-block-wrap" id="${rid}-wrap"><div class="code-block-header"><span class="code-lang">${norm}</span><button class="code-copy-btn" onclick="copyCode('${rid}')" data-copy-id="${rid}">⧉ Copy</button><button class="code-run-btn" onclick="${runFn}" data-run-${norm === 'python' ? 'py' : 'js'}-id="${rid}">${label}</button></div><pre><code id="${rid}-src" class="language-${norm}">${escapeHTML(code)}</code></pre><div id="${rid}-out" class="code-output" style="display:none;"></div></div>`;
  appendMsg('user', `/run ${norm}`);
  appendMsg('nivi', html);
  scrollToBottom();
  setTimeout(() => norm === 'python' ? runPYCode(rid) : runJSCode(rid), 150);
};

// ══════════════════════════════════════════════════
//  📁 FILE AGENT COMMANDS
//  /ls          — list files in granted folder
//  /read file   — read file into chat as context
//  /newfile f   — create new file
//  /edit file: instructions — AI edits + auto-saves
// ══════════════════════════════════════════════════

function _fsCheck() {
  if (!window.FSAgent) return '❌ FSAgent not loaded.';
  const s = FSAgent.getStatus();
  if (s.status !== 'granted') return '❌ No folder access. Click **Grant Folder Access** in the sidebar first.';
  return null;
}

async function _cmdLs(inp) {
  inp.value = ''; inp.style.height = 'auto';
  appendMsg('user', '/ls');
  const err = _fsCheck();
  if (err) { appendMsg('nivi', err); return; }
  const { files, folder } = FSAgent.getStatus();
  if (!files.length) { appendMsg('nivi', `📂 **${folder}** is empty.`); return; }
  const dirs = files.filter(f => f.kind === 'directory');
  const fls  = files.filter(f => f.kind === 'file');
  const lines = [
    `📂 **${folder}** — ${fls.length} files, ${dirs.length} dirs\n`,
    ...dirs.map(d => `📁 ${d.name}/`),
    ...fls.map(f => {
      const sz = f.size < 1024 ? f.size + ' B' : (f.size / 1024).toFixed(1) + ' KB';
      return `📄 ${f.name}  \`${sz}\``;
    }),
  ].join('\n');
  appendMsg('nivi', lines);
  scrollToBottom();
}

async function _cmdRead(filename, inp) {
  inp.value = ''; inp.style.height = 'auto';
  appendMsg('user', `/read ${filename}`);
  const err = _fsCheck();
  if (err) { appendMsg('nivi', err); return; }
  const resId = 'nivi-' + Date.now();
  appendMsg('nivi', `<div class="img-generating"><span class="tm-spinner" style="display:inline-block;margin-right:8px;"></span>Reading <code>${escapeHTML(filename)}</code>…</div>`, resId);
  const content = await FSAgent.readFile(filename);
  if (content === null) {
    updateMsg(resId, `❌ Could not read **${escapeHTML(filename)}**. Not found in granted folder.`);
    return;
  }
  const ext   = filename.split('.').pop().toLowerCase();
  const lines = content.split('\n').length;
  const preview = content.slice(0, 8000) + (content.length > 8000 ? '\n\n// ... [truncated at 8000 chars]' : '');
  updateMsg(resId, `📄 **${escapeHTML(filename)}** — ${lines} lines\n\n\`\`\`${ext}\n${preview}\n\`\`\`\n\n_File loaded into context. Ask me to explain, edit, debug, or improve it._`);
  scrollToBottom();
}

async function _cmdNewfile(raw, inp) {
  const colonIdx   = raw.indexOf(':');
  const filename   = (colonIdx > -1 ? raw.substring(0, colonIdx) : raw).trim();
  const initContent = colonIdx > -1 ? raw.substring(colonIdx + 1).trim() : '';
  inp.value = ''; inp.style.height = 'auto';
  appendMsg('user', `/newfile ${raw}`);
  const err = _fsCheck();
  if (err) { appendMsg('nivi', err); return; }
  const ok = await FSAgent.writeFile(filename, initContent);
  appendMsg('nivi', ok
    ? `✅ Created **${escapeHTML(filename)}**${initContent ? ' with initial content.' : ' (empty file).'}\n\nUse \`/edit ${filename}: your instructions\` to fill it in.`
    : `❌ Failed to create **${escapeHTML(filename)}**.`);
  scrollToBottom();
}

async function _cmdEdit(raw, inp) {
  const colonIdx = raw.indexOf(':');
  if (colonIdx === -1) {
    inp.value = ''; inp.style.height = 'auto';
    appendMsg('user', `/edit ${raw}`);
    appendMsg('nivi', '⚠️ Usage: `/edit filename.js: your instructions here`');
    return;
  }
  const filename     = raw.substring(0, colonIdx).trim();
  const instructions = raw.substring(colonIdx + 1).trim();
  inp.value = ''; inp.style.height = 'auto';
  appendMsg('user', `/edit ${raw}`);

  const err = _fsCheck();
  if (err) { appendMsg('nivi', err); return; }

  const resId = 'nivi-' + Date.now();
  appendMsg('nivi', `<div class="img-generating"><span class="tm-spinner" style="display:inline-block;margin-right:8px;"></span>Reading <strong>${escapeHTML(filename)}</strong>…</div>`, resId);

  const content = await FSAgent.readFile(filename);
  if (content === null) {
    updateMsg(resId, `❌ File not found: **${escapeHTML(filename)}**. Use \`/ls\` to see available files.`);
    return;
  }

  toggleGen(true);
  if (window.AppState) AppState._abortController = new AbortController();

  try {
    const ext = filename.split('.').pop().toLowerCase();
    updateMsg(resId, `<div class="img-generating"><span class="tm-spinner" style="display:inline-block;margin-right:8px;"></span>🤖 AI editing <strong>${escapeHTML(filename)}</strong>…</div>`);

    const editPrompt = `You are an expert code editor. Edit this ${ext} file according to the instructions.

FILE: ${filename}
INSTRUCTIONS: ${instructions}

CURRENT CONTENT:
\`\`\`${ext}
${content}
\`\`\`

Return the COMPLETE updated file in this EXACT format (no other text):
FILE: ${filename}
FULL:
\`\`\`${ext}
(complete updated file here)
\`\`\``;

    let aiResponse = '';
    await directGeminiCallStreamMultiTurn([], editPrompt, (chunk) => { aiResponse = chunk; });
    await FSAgent.applyPatchFromText(aiResponse);
    updateMsg(resId, `✅ **${escapeHTML(filename)}** edited and saved to disk!\n\n💡 *Applied: ${escapeHTML(instructions)}*\n\nUse \`/read ${filename}\` to verify changes.`);

  } catch(e) {
    updateMsg(resId, `❌ Edit failed: ${escapeHTML(e.message)}`);
  } finally {
    toggleGen(false);
    if (window.AppState) AppState._abortController = null;
    scrollToBottom();
  }
}
