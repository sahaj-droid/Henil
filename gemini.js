// ═══════════════════════════════════════════════════════════
//  NIVI PRO — Universal AI Engine v2.0
//  Providers: Gemini | OpenRouter | Nvidia (+ any OpenAI-compatible)
//  Config: localStorage only — no code change needed
// ═══════════════════════════════════════════════════════════

// Provider default URLs — override via localStorage 'nivi_provider_urls'
const PROVIDER_DEFAULTS = {
  gemini:      { url: null,  format: 'gemini' },   // special Gemini API format
  openrouter:  { url: 'https://openrouter.ai/api/v1/chat/completions', format: 'openai' },
  nvidia:      { url: 'https://integrate.api.nvidia.com/v1/chat/completions', format: 'openai' },
  custom:      { url: '',    format: 'openai' },    // user-defined endpoint
};

// ── Helper: get full config for a provider ──
function _resolveProvider(item) {
  const def = PROVIDER_DEFAULTS[item.provider] || PROVIDER_DEFAULTS.custom;
  
  let urls = {};
  try { urls = JSON.parse(localStorage.getItem('nivi_provider_urls') || '{}'); } catch(e) {}
  
  const resolvedUrl = item.url || urls[item.provider] || def.url || '';
  const resolvedKey = item.key || localStorage.getItem(`nivi_key_${item.provider}`) || '';
  const resolvedModel = item.model || localStorage.getItem(`nivi_model_${item.provider}`) || '';

  // Auto-detect format: gemini model name = gemini API format, regardless of provider field
  let format = def.format;
  if ((resolvedModel || '').toLowerCase().startsWith('gemini')) {
    format = 'gemini';
  }

  return { ...item, url: resolvedUrl, key: resolvedKey, model: resolvedModel, format };
}

// ── getModelChain ──
window.getModelChain = function() {
  return JSON.parse(localStorage.getItem('nivi_model_chain') || '[]');
};

// ── File utilities ──
window.readFileAsBase64 = function(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = () => reject(new Error('File read failed'));
    reader.readAsDataURL(file);
  });
};

window.getFileMimeType = function(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  const map = {
    'pdf':'application/pdf','js':'text/javascript','html':'text/html',
    'css':'text/css','txt':'text/plain','json':'application/json',
    'csv':'text/csv','md':'text/plain','py':'text/plain',
    'png':'image/png','jpg':'image/jpeg','jpeg':'image/jpeg',
    'webp':'image/webp','gif':'image/gif'
  };
  return map[ext] || 'text/plain';
};

// ── OpenAI-compatible call (OpenRouter, Nvidia, custom) ──
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
      model: cfg.model,
      messages,
      stream: !!onChunk,
      max_tokens: 4096
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`${response.status}: ${err.slice(0,200)}`);
  }

  // Streaming
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
          const data = JSON.parse(line.replace('data: ', ''));
          const delta = data.choices?.[0]?.delta?.content || '';
          if (delta) { fullText += delta; _emitChunk(onChunk, fullText); }
        } catch(e) {}
      }
    }
    return { ok: true, text: fullText };
  }

  // Non-streaming
  const data = await response.json();
  if (data.choices?.[0]) return { ok: true, text: data.choices[0].message.content };
  throw new Error('No choices in response');
}

// ── Gemini streaming call ──
async function _geminiStreamCall(cfg, history, prompt, onChunk) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${cfg.model}:streamGenerateContent?alt=sse&key=${cfg.key}`;
  const response = await fetch(url, {
    method: 'POST',
    signal: window.AppState?._abortController?.signal,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [...history, { role: 'user', parts: [{ text: prompt }] }]
    })
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

// ── Gemini file call ──
async function _geminiFileCall(cfg, prompt, fileBase64, mimeType) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${cfg.model}:generateContent?key=${cfg.key}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [
        { inline_data: { mime_type: mimeType, data: fileBase64 } },
        { text: prompt }
      ]}]
    })
  });
  const data = await response.json();
  if (response.ok && data.candidates) return { ok: true, answer: data.candidates[0].content.parts[0].text };
  throw new Error(data.error?.message || 'Gemini file call failed');
}

// ═══════════════════════════════════════════════════════════
//  MAIN: Multi-turn streaming with automatic fallback chain
// ═══════════════════════════════════════════════════════════
window.directGeminiCallStreamMultiTurn = async function(priorHistory, currentPrompt, onChunk) {
  const chain = window.getModelChain();
  if (chain.length === 0) { _emitChunk(onChunk, 'No models configured. Open Settings to add a model.'); return { ok: false }; }

  let lastError = '';
  for (const rawItem of chain) {
    if (window.AppState?._abortController?.signal.aborted) break;
    const cfg = _resolveProvider(rawItem);

    if (!cfg.key) { lastError = `No API key for ${cfg.provider}`; continue; }
    if (!cfg.model) { lastError = `No model set for ${cfg.provider}`; continue; }

    try {
      if (cfg.format === 'gemini') {
        await _geminiStreamCall(cfg, priorHistory, currentPrompt, onChunk);
      } else {
        const messages = priorHistory.map(m => ({
          role: m.role === 'model' ? 'assistant' : 'user',
          content: m.parts[0].text
        })).concat({ role: 'user', content: currentPrompt });
        await _openaiCall(cfg, messages, onChunk);
      }
      return { ok: true, model: cfg.model };
    } catch(e) {
      if (e.name === 'AbortError') return { ok: false, aborted: true };
      lastError = e.message;
      console.warn(`[Nivi] ${cfg.provider}/${cfg.model} failed: ${e.message}. Trying next...`);
    }
  }

  if (window.AppState?._abortController?.signal.aborted) return { ok: false, aborted: true };
  _emitChunk(onChunk, `All models failed. Last error: ${lastError}`);
  return { ok: false };
};

// ═══════════════════════════════════════════════════════════
//  FILE ANALYSIS — Gemini primary, OpenAI-compatible fallback
// ═══════════════════════════════════════════════════════════
window.directGeminiCallWithFile = async function(prompt, fileBase64, mimeType) {
  const chain = window.getModelChain();

  // Gemini first — detect by provider field OR model name
  const geminiRaw = chain.find(c => 
    c.provider === 'gemini' || 
    (c.model || '').toLowerCase().startsWith('gemini')
  );
  if (geminiRaw) {
    const cfg = _resolveProvider(geminiRaw);
    // Force format to gemini for proper API call
    cfg.format = 'gemini';
    if (cfg.key) {
      try {
        return await _geminiFileCall(cfg, prompt, fileBase64, mimeType);
      } catch(e) {
        console.warn('[Nivi] Gemini file call failed:', e.message);
      }
    }
  }

  // Text file fallback — send content as text to any OpenAI-compatible provider
  const TEXT_MIMES = ['text/javascript','text/html','text/plain','text/css','application/json','text/csv'];
  if (TEXT_MIMES.includes(mimeType)) {
    const fallbackRaw = chain.find(c => c.provider !== 'gemini');
    if (fallbackRaw) {
      const cfg = _resolveProvider(fallbackRaw);
      if (cfg.key && cfg.url) {
        try {
          const textContent = new TextDecoder('utf-8').decode(Uint8Array.from(atob(fileBase64), c => c.charCodeAt(0))).slice(0, 10000);
          const messages = [{
            role: 'user',
            content: `File: ${mimeType}\n\`\`\`\n${textContent}\n\`\`\`\n\nQuery: ${prompt}`
          }];
          const r = await _openaiCall(cfg, messages, null);
          return { ok: true, answer: r.text };
        } catch(e) {
          console.warn('[Nivi] Fallback file call failed:', e.message);
        }
      }
    }
  }

  return { ok: false, answer: 'File analysis failed. Ensure Gemini is configured with a valid API key.' };
};
console.log('Nivi AI Engine v2.0 loaded - Universal provider support');
