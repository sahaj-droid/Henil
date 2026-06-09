// ═══════════════════════════════════════════════════════════
//  NIVI PRO — Universal AI Engine v2.0
//  Providers: Gemini | OpenRouter | Nvidia (+ any OpenAI-compatible)
//  Config: localStorage only — no code change needed
// ═══════════════════════════════════════════════════════════

// Known Gemini model prefixes — extend as Google releases new families
const GEMINI_MODEL_PREFIXES = ['gemini-', 'gemma-', 'learnlm-'];

// Provider default URLs — override via localStorage 'nivi_provider_urls'
const PROVIDER_DEFAULTS = {
  gemini:      { url: null,  format: 'gemini' },
  openrouter:  { url: 'https://openrouter.ai/api/v1/chat/completions', format: 'openai' },
  nvidia:      { url: 'https://integrate.api.nvidia.com/v1/chat/completions', format: 'openai' },
  custom:      { url: '',    format: 'openai' },
};

// FIX 5: Robust format detection — provider field is authoritative.
// Model name prefix check is a fallback only when provider is 'custom'.
function _detectFormat(item, def) {
  // Provider field explicitly set to gemini — always use gemini format
  if (item.provider === 'gemini') return 'gemini';
  // Non-gemini explicit provider — use its default format
  if (item.provider !== 'custom') return def.format;
  // Custom provider: infer from model name as a best-effort fallback
  const modelLower = (item.model || '').toLowerCase();
  const isGeminiModel = GEMINI_MODEL_PREFIXES.some(prefix => modelLower.startsWith(prefix))
    || /^\d+\.\d+/.test(modelLower); // shorthand e.g. '2.0-flash', '3.1-flash-lite'
  return isGeminiModel ? 'gemini' : 'openai';
}

function _resolveProvider(item) {
  const def = PROVIDER_DEFAULTS[item.provider] || PROVIDER_DEFAULTS.custom;

  let urls = {};
  try { urls = JSON.parse(localStorage.getItem('nivi_provider_urls') || '{}'); } catch(e) {}

  const resolvedUrl   = item.url   || urls[item.provider] || def.url || '';
  const resolvedKey   = item.key   || localStorage.getItem(`nivi_key_${item.provider}`)   || '';
  const resolvedModel = item.model || localStorage.getItem(`nivi_model_${item.provider}`) || '';
  const format        = _detectFormat(item, def);

  return { ...item, url: resolvedUrl, key: resolvedKey, model: resolvedModel, format };
}

window.getModelChain = function() {
  return JSON.parse(localStorage.getItem('nivi_model_chain') || '[]');
};

window.readFileAsBase64 = function(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result.split(',')[1]);
    reader.onerror = () => reject(new Error('File read failed'));
    reader.readAsDataURL(file);
  });
};

window.getFileMimeType = function(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  const map = {
    // Documents
    pdf:  'application/pdf',
    // Web
    html: 'text/html',   htm:  'text/html',
    css:  'text/css',    scss: 'text/css',    sass: 'text/css',   less: 'text/css',
    // JavaScript / TypeScript
    js:   'text/javascript', mjs: 'text/javascript', cjs: 'text/javascript',
    jsx:  'text/javascript', ts:  'text/plain',       tsx: 'text/plain',
    // Frameworks
    vue:    'text/plain', svelte: 'text/plain',
    // Data / Config
    json:   'application/json', json5: 'application/json', jsonc: 'application/json',
    yaml:   'text/plain',  yml:  'text/plain',
    toml:   'text/plain',  ini:  'text/plain',
    env:    'text/plain',  conf: 'text/plain',  config: 'text/plain',
    csv:    'text/csv',    tsv:  'text/csv',
    xml:    'text/xml',    svg:  'image/svg+xml', plist: 'text/plain',
    graphql: 'text/plain', gql:  'text/plain',
    sql:    'text/plain',
    diff:   'text/plain',  patch: 'text/plain',
    // Docs / Text
    txt:  'text/plain',  md:   'text/plain',   mdx:  'text/plain',
    rst:  'text/plain',  log:  'text/plain',
    // Python
    py:  'text/plain', pyw: 'text/plain',
    // Systems / Low-level
    c:   'text/plain', cpp:   'text/plain', cc:   'text/plain',
    cxx: 'text/plain', h:     'text/plain', hpp:  'text/plain',
    cs:  'text/plain', go:    'text/plain', rs:   'text/plain',
    // JVM
    java:  'text/plain', kt:  'text/plain', kts:  'text/plain',
    scala: 'text/plain', groovy: 'text/plain', clj: 'text/plain',
    // Mobile / Other
    swift: 'text/plain', dart: 'text/plain',
    // Scripting
    rb:   'text/plain', php:  'text/plain', lua: 'text/plain',
    r:    'text/plain', m:    'text/plain',
    ex:   'text/plain', exs:  'text/plain',
    hs:   'text/plain',
    // Shell
    sh:   'text/plain', bash: 'text/plain', zsh: 'text/plain',
    fish: 'text/plain', bat:  'text/plain', cmd: 'text/plain', ps1: 'text/plain',
    // Images
    png:  'image/png',  jpg:  'image/jpeg', jpeg: 'image/jpeg',
    webp: 'image/webp', gif:  'image/gif',  bmp:  'image/bmp',
    ico:  'image/x-icon', tiff: 'image/tiff', avif: 'image/avif',
  };
  return map[ext] || 'text/plain';
};

function _isValidHttpUrl(url) {
  try { const u = new URL(url); return u.protocol === 'https:' || u.protocol === 'http:'; }
  catch(e) { return false; }
}

function _emitChunk(onChunk, text) {
  if (typeof onChunk === 'function') onChunk(text);
}

async function _openaiCall(cfg, messages, onChunk) {
  if (!_isValidHttpUrl(cfg.url)) throw new Error('Invalid API URL for ' + cfg.provider);

  const response = await fetch(cfg.url, {
    method: 'POST',
    signal: window.AppState?._abortController?.signal,
    headers: {
      'Authorization': `Bearer ${cfg.key}`,
      'Content-Type': 'application/json',
      ...(cfg.provider === 'openrouter' ? {
        'HTTP-Referer': window.location.origin,
        'X-Title': 'Nivi Pro'
      } : {})
    },
    body: JSON.stringify({
      model:      cfg.model,
      messages,
      stream:     !!onChunk,
      max_tokens: 4096,
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`${response.status}: ${err.slice(0, 200)}`);
  }

  if (onChunk) {
    const reader = response.body.getReader();
    let fullText = '';
    while (true) {
      if (window.AppState?._abortController?.signal.aborted) break;
      const { value, done } = await reader.read();
      if (done) break;
      const chunk = new TextDecoder().decode(value);
      const lines = chunk.split('\n').filter(l => l.startsWith('data: ') && l !== 'data: [DONE]');
      for (const line of lines) {
        try {
          const data  = JSON.parse(line.replace('data: ', ''));
          const delta = data.choices?.[0]?.delta?.content || '';
          if (delta) {
            fullText += delta;
            _emitChunk(onChunk, fullText);
            if (typeof window.scrollToBottom === 'function') window.scrollToBottom();
          }
        } catch(e) {}
      }
    }
    return { ok: true, text: fullText };
  }

  const data = await response.json();
  if (data.choices?.[0]) return { ok: true, text: data.choices[0].message.content };
  throw new Error('No choices in response');
}

async function _geminiStreamCall(cfg, history, prompt, onChunk, opts = {}) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${cfg.model}:streamGenerateContent?alt=sse&key=${cfg.key}`;
  
  const body = {
    contents: [...history, { role: 'user', parts: [{ text: prompt }] }]
  };
  if (opts.useWebSearch) {
    body.tools = [{ google_search: {} }];
  }

  const response = await fetch(url, {
    method: 'POST',
    signal: window.AppState?._abortController?.signal,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!response.ok) throw new Error(`Gemini ${response.status}`);

  const reader = response.body.getReader();
  let fullText = '';
  while (true) {
    if (window.AppState?._abortController?.signal.aborted) break;
    const { value, done } = await reader.read();
    if (done) break;
    const chunk = new TextDecoder().decode(value);
    const lines = chunk.split('\n').filter(l => l.startsWith('data: '));
    for (const line of lines) {
      try {
        const data = JSON.parse(line.replace('data: ', ''));
        if (data.candidates?.[0]?.content) {
          fullText += data.candidates[0].content.parts[0].text;
          _emitChunk(onChunk, fullText);
        }
      } catch(e) {}
    }
  }
  return { ok: true, text: fullText };
}

const FILE_TEXT_MIMES = new Set([
  'text/javascript', 'text/html', 'text/plain', 'text/css', 'text/csv', 'text/xml',
  'application/json', 'application/xml', 'image/svg+xml'
]);

function _isTextFileMime(mimeType) {
  const mt = (mimeType || '').split(';')[0].toLowerCase();
  return mt.startsWith('text/') || FILE_TEXT_MIMES.has(mt);
}

function _decodeFileBase64Text(fileBase64) {
  try {
    return new TextDecoder('utf-8')
      .decode(Uint8Array.from(atob(fileBase64), c => c.charCodeAt(0)));
  } catch(e) {
    try { return atob(fileBase64); } catch(_) { return ''; }
  }
}

async function _geminiTextFileCall(cfg, prompt, fileBase64, mimeType) {
  const textContent = _decodeFileBase64Text(fileBase64).slice(0, 60000);
  if (!textContent.trim()) throw new Error('Uploaded text file is empty or unreadable');

  const filePrompt = `Analyze this uploaded file.
MIME type: ${mimeType || 'text/plain'}

File content:
\`\`\`
${textContent}
\`\`\`

User request: ${prompt || 'Analyze this file.'}`;

  // Use non-streaming generateContent for reliability
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${cfg.model}:generateContent?key=${cfg.key}`;
  const response = await fetch(url, {
    method: 'POST',
    signal: window.AppState?._abortController?.signal,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: filePrompt }] }]
    })
  });
  const data = await response.json().catch(() => ({}));
  const answer = data.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('').trim();
  if (response.ok && answer) return { ok: true, answer };
  throw new Error(data.error?.message || `Gemini text file call failed (${response.status})`);
}

async function _geminiFileCall(cfg, prompt, fileBase64, mimeType) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${cfg.model}:generateContent?key=${cfg.key}`;
  const response = await fetch(url, {
    method: 'POST',
    signal: window.AppState?._abortController?.signal,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [
        { inline_data: { mime_type: mimeType || 'application/octet-stream', data: fileBase64 } },
        { text: prompt || 'Analyze this file.' }
      ]}]
    })
  });
  const data = await response.json().catch(() => ({}));
  const answer = data.candidates?.[0]?.content?.parts
    ?.map(p => p.text || '')
    .join('')
    .trim();
  if (response.ok && answer) return { ok: true, answer };
  // Surface the real API error message for better debugging
  const errMsg = data.error?.message || `Gemini file call failed (${response.status})`;
  throw new Error(errMsg);
}

// ═══════════════════════════════════════════════════════════
//  MAIN: Multi-turn streaming with automatic fallback chain
// ═══════════════════════════════════════════════════════════
window.directGeminiCallStreamMultiTurn = async function(priorHistory, currentPrompt, onChunk, opts = {}) {
  let chain = window.getModelChain();
  
  if (opts.useWebSearch) {
    try {
      const searchChain = JSON.parse(localStorage.getItem('nivi_search_model_chain') || '[]');
      if (searchChain.length > 0) chain = searchChain;
    } catch(e) {}
  }

  if (chain.length === 0) {
    _emitChunk(onChunk, 'No models configured. Open Settings to add a model.');
    return { ok: false };
  }

  let lastError = '';
  let searchFailed = false;

  for (const rawItem of chain) {
    if (window.AppState?._abortController?.signal.aborted) break;
    const cfg = _resolveProvider(rawItem);

    if (!cfg.key)   { lastError = `No API key for ${cfg.provider}`;   continue; }
    if (!cfg.model) { lastError = `No model set for ${cfg.provider}`; continue; }

    try {
      if (cfg.format === 'gemini') {
        await _geminiStreamCall(cfg, priorHistory, currentPrompt, onChunk, opts);
      } else {
        const messages = priorHistory
          .map(m => ({
            role:    m.role === 'model' ? 'assistant' : 'user',
            content: m.parts[0].text,
          }))
          .concat({ role: 'user', content: currentPrompt });
        await _openaiCall(cfg, messages, onChunk);
      }
      return { ok: true, model: cfg.model };
    } catch(e) {
      if (e.name === 'AbortError') return { ok: false, aborted: true };
      
      if (opts.useWebSearch && e.message.includes('429')) {
        searchFailed = true;
      }
      
      lastError = e.message;
      console.warn(`[Nivi] ${cfg.provider}/${cfg.model} failed: ${e.message}. Trying next…`);
    }
  }

  if (opts.useWebSearch && searchFailed && !window.AppState?._abortController?.signal.aborted) {
    const warningHTML = `<div style="background:rgba(234,179,8,.08);border:1px solid rgba(234,179,8,.2);padding:12px 14px;border-radius:10px;margin-bottom:12px;font-size:12.5px;line-height:1.5;color:var(--text-sub);">
      ⚠️ **Google Search Grounding failed (Gemini 429)**<br>
      Dost, enabling real-time Google Search grounding (using <code>/web</code>) requires a **Paid (Billing-enabled) API Key** on Google AI Studio. Free-tier API keys do not support Google Search grounding. <br><br>
      🔄 **Automatically falling back to DuckDuckGo search...**
    </div>
    <div class="thinking" style="margin-top:10px;"><span></span><span></span><span></span></div>`;
    
    _emitChunk(onChunk, warningHTML);
    
    let modifiedPrompt = currentPrompt;
    if (typeof window.duckDuckGoSearch === 'function') {
      try {
        const currentYear = new Date().getFullYear();
        let queryForDDG = currentPrompt.length > 60 ? currentPrompt.substring(0, 60) : currentPrompt;
        if (!queryForDDG.includes(currentYear.toString())) queryForDDG += ` ${currentYear} latest news`;
        
        const results = await window.duckDuckGoSearch(queryForDDG);
        if (results && results.length > 0) {
          const ddgContext = `\n\n---\n[LIVE WEB SEARCH RESULTS — DUCKDUCKGO]\nSearch Query Used: "${queryForDDG}"\n\n` +
            results.map((r, i) => `[Source ${i+1}]\nTitle: ${r.title}\nLink: ${r.link}\nSnippet: ${r.snippet}`).join('\n\n') +
            `\n\nInstructions: It is currently ${currentYear}. Use these real-time search results to answer the user. IF the search results only contain old data (like 2024) and the user is asking about the present/future, explicitly tell the user that the search engine returned old data and ask them to provide a clearer English keyword (e.g. "India next cricket match 2026"). Do NOT blindly present 2024 data as current.`;
          modifiedPrompt += ddgContext;
          _emitChunk(onChunk, `<div style="font-size:12px;color:#4ade80;margin-top:6px;font-family:var(--sans);margin-bottom:8px;">✅ Found ${results.length} live search sources from DuckDuckGo! Synthesizing...</div>`);
        } else {
          _emitChunk(onChunk, `<div style="font-size:12px;opacity:0.5;margin-top:6px;font-family:var(--sans);margin-bottom:8px;">⚠️ No live sources found via DuckDuckGo. Answering using default knowledge...</div>`);
        }
      } catch(e) {
        _emitChunk(onChunk, `<div style="font-size:12px;color:var(--red);margin-top:6px;font-family:var(--sans);margin-bottom:8px;">⚠️ DuckDuckGo fallback failed. Answering using default knowledge...</div>`);
      }
    }
    
    const fallbackOpts = { ...opts, useWebSearch: false };
    return await window.directGeminiCallStreamMultiTurn(priorHistory, modifiedPrompt, onChunk, fallbackOpts);
  }

  if (window.AppState?._abortController?.signal.aborted) return { ok: false, aborted: true };
  _emitChunk(onChunk, `All models failed. Last error: ${lastError}`);
  return { ok: false };
};

// ═══════════════════════════════════════════════════════════
//  FILE ANALYSIS — Gemini primary, OpenAI-compatible fallback
// ═══════════════════════════════════════════════════════════
window.directGeminiCallWithFile = async function(prompt, fileBase64, mimeType) {
  let chain = [];
  try { chain = window.getModelChain ? window.getModelChain() : []; } catch(e) {}
  const isTextFile = _isTextFileMime(mimeType);
  let lastError = '';

  // Gemini can analyze text/code files more reliably when sent as text instead of inline_data.
  const geminiRaw = chain.find(c => _resolveProvider(c).format === 'gemini');
  if (geminiRaw) {
    const cfg = _resolveProvider(geminiRaw);
    if (cfg.key && cfg.model) {
      try {
        return isTextFile
          ? await _geminiTextFileCall(cfg, prompt, fileBase64, mimeType)
          : await _geminiFileCall(cfg, prompt, fileBase64, mimeType);
      } catch(e) {
        lastError = e.message;
        console.warn('[Nivi] Gemini file call failed:', e.message);
      }
    }
  }

  // OpenAI-compatible fallback for text/code files.
  if (isTextFile) {
    const fallbackRaw = chain.find(c => _resolveProvider(c).format !== 'gemini');
    if (fallbackRaw) {
      const cfg = _resolveProvider(fallbackRaw);
      if (cfg.key && cfg.url) {
        try {
          const textContent = _decodeFileBase64Text(fileBase64).slice(0, 60000);
          const messages = [{
            role: 'user',
            content: `Analyze this uploaded file.
MIME type: ${mimeType || 'text/plain'}

File content:
\`\`\`
${textContent}
\`\`\`

User request: ${prompt || 'Analyze this file.'}`,
          }];
          const r = await _openaiCall(cfg, messages, null);
          return { ok: true, answer: r.text };
        } catch(e) {
          lastError = e.message;
          console.warn('[Nivi] Fallback file call failed:', e.message);
        }
      }
    }
  }

  // ── ULTIMATE FALLBACK: embed file content in prompt, use full streaming chain ──
  // This is exactly what happens when user types "hello" after upload — do it automatically.
  if (isTextFile) {
    try {
      const textContent = _decodeFileBase64Text(fileBase64).slice(0, 60000);
      if (textContent.trim()) {
        const embeddedPrompt = `Analyze this uploaded file.\nMIME type: ${mimeType || 'text/plain'}\n\nFile content:\n\`\`\`\n${textContent}\n\`\`\`\n\nUser request: ${prompt || 'Analyze this file.'}`;
        let collectedText = '';
        const result = await window.directGeminiCallStreamMultiTurn(
          [], embeddedPrompt,
          (chunk) => { collectedText = chunk; },
          {}
        );
        if (result?.ok && collectedText.trim()) return { ok: true, answer: collectedText.trim() };
        lastError = lastError || 'All models failed.';
      }
    } catch(e) {
      lastError = e.message;
      console.warn('[Nivi] Ultimate fallback file call failed:', e.message);
    }
  }

  const hint = isTextFile
    ? '⚠️ File analysis failed.'
    : '⚠️ Binary file analysis failed. Make sure you have a Gemini model configured (for PDFs/images).';
  const errDetail = lastError
    ? `\n\n**Error:** ${lastError}`
    : '\n\nCheck your API key, model name, and provider settings in ⚙️ Settings.';
  return { ok: false, answer: hint + errDetail };
};



// ══════════════════════════════════════════════════════════
//  IMAGE GENERATION — Imagen 3 via Gemini API
//  Uses the same Gemini API key already configured
// ══════════════════════════════════════════════════════════
window.generateImage = async function(prompt) {
  // Get Gemini key from model chain
  const chain = window.getModelChain ? window.getModelChain() : [];
  const geminiRaw = chain.find(c => c.provider === 'gemini' || (c.model || '').startsWith('gemini-'));
  const cfg = geminiRaw ? _resolveProvider(geminiRaw) : null;
  const apiKey = cfg?.key || localStorage.getItem('nivi_key_gemini') || '';

  if (!apiKey) {
    return { ok: false, error: 'No Gemini API key configured. Go to Settings & Models → add Gemini key.' };
  }

  try {
    // Imagen 3 endpoint
    const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`;
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instances: [{ prompt }],
        parameters: { sampleCount: 1, aspectRatio: '1:1', safetyFilterLevel: 'block_only_high' }
      })
    });

    if (!resp.ok) {
      // Fallback: try gemini-2.0-flash-preview-image-generation
      const url2 = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent?key=${apiKey}`;
      const resp2 = await fetch(url2, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseModalities: ['IMAGE', 'TEXT'] }
        })
      });
      if (!resp2.ok) {
        const errText = await resp2.text();
        return { ok: false, error: `Image generation failed: ${resp2.status} — ${errText.slice(0, 200)}` };
      }
      const data2 = await resp2.json();
      const parts  = data2.candidates?.[0]?.content?.parts || [];
      const imgPart = parts.find(p => p.inlineData);
      if (imgPart) {
        return { ok: true, b64: imgPart.inlineData.data, mimeType: imgPart.inlineData.mimeType || 'image/png' };
      }
      return { ok: false, error: 'No image returned from API.' };
    }

    const data = await resp.json();
    const pred  = data.predictions?.[0];
    if (pred?.bytesBase64Encoded) {
      return { ok: true, b64: pred.bytesBase64Encoded, mimeType: pred.mimeType || 'image/png' };
    }
    return { ok: false, error: 'No image in response.' };

  } catch(e) {
    return { ok: false, error: 'Network error: ' + e.message };
  }
};

// ── DUCKDUCKGO WEB SEARCH INTEGRATION ──
window.duckDuckGoSearch = async function(query) {
  const targetUrl = 'https://html.duckduckgo.com/html/?q=' + encodeURIComponent(query);
  const proxies = [
    'https://corsproxy.io/?',
    'https://api.allorigins.win/raw?url='
  ];
  
  let htmlText = null;
  let lastError = null;

  for (const proxy of proxies) {
    try {
      const url = proxy + encodeURIComponent(targetUrl);
      const resp = await fetch(url, {
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
      });
      if (resp.ok) {
        const text = await resp.text();
        if (text && text.includes('result__snippet')) {
          htmlText = text;
          console.log(`[Nivi DDG] Search succeeded using proxy: ${proxy}`);
          break;
        }
      }
    } catch(e) {
      lastError = e;
      console.warn(`[Nivi DDG] Proxy ${proxy} failed:`, e);
    }
  }

  if (!htmlText) {
    console.error('[Nivi DDG] All search proxies failed. Last error:', lastError);
    return null;
  }

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, 'text/html');
    const results = [];

    doc.querySelectorAll('.result').forEach(el => {
      const titleEl = el.querySelector('.result__a');
      const snippetEl = el.querySelector('.result__snippet');
      if (titleEl && snippetEl) {
        let title = (titleEl.innerText || titleEl.textContent || '').trim();
        let snippet = (snippetEl.innerText || snippetEl.textContent || '').trim();
        let href = titleEl.getAttribute('href') || '';
        
        title = title.replace(/\s+/g, ' ');
        snippet = snippet.replace(/\s+/g, ' ');

        if (href.includes('uddg=')) {
          try {
            const parts = href.split('uddg=');
            if (parts.length > 1) {
              const decoded = decodeURIComponent(parts[1].split('&')[0]);
              if (decoded.startsWith('http')) href = decoded;
            }
          } catch (_) {}
        } else if (href.startsWith('//')) {
          href = 'https:' + href;
        }

        results.push({ title, link: href, snippet });
      }
    });

    return results.slice(0, 5);
  } catch(e) {
    console.error('[Nivi DDG] Parsing failed:', e);
    return null;
  }
};
