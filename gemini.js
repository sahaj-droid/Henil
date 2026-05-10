// ═══════════════════════════════════════════════════════════
//  NIVI PRO — Universal AI Engine v2.0 (DUCKDUCKGO SEARCH ENABLED)
//  Providers: Gemini | OpenRouter | Nvidia (+ any OpenAI-compatible)
//  Config: localStorage only — no code change needed
// ═══════════════════════════════════════════════════════════

const PROVIDER_DEFAULTS = {
  gemini:      { url: null,  format: 'gemini' },
  openrouter:  { url: 'https://openrouter.ai/api/v1/chat/completions', format: 'openai' },
  nvidia:      { url: 'https://integrate.api.nvidia.com/v1/chat/completions', format: 'openai' },
  custom:      { url: '',    format: 'openai' },
};

function _resolveProvider(item) {
  const def = PROVIDER_DEFAULTS[item.provider] || PROVIDER_DEFAULTS.custom;
  
  let urls = {};
  try { 
    urls = JSON.parse(localStorage.getItem('nivi_provider_urls') || '{}'); 
  } catch(e) {}
  
  const resolvedUrl = item.url || urls[item.provider] || def.url || '';
  const resolvedKey = item.key || localStorage.getItem(`nivi_key_${item.provider}`) || '';
  const resolvedModel = item.model || localStorage.getItem(`nivi_model_${item.provider}`) || '';

  let format = def.format;
  if ((resolvedModel || '').toLowerCase().startsWith('gemini')) {
    format = 'gemini';
  }

  return { ...item, url: resolvedUrl, key: resolvedKey, model: resolvedModel, format };
}

window.getModelChain = function() {
  return JSON.parse(localStorage.getItem('nivi_model_chain') || '[]');
};

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
    'pdf': 'application/pdf', 'js': 'text/javascript', 'html': 'text/html',
    'css': 'text/css', 'txt': 'text/plain', 'json': 'application/json',
    'csv': 'text/csv', 'md': 'text/plain', 'py': 'text/plain',
    'png': 'image/png', 'jpg': 'image/jpeg', 'jpeg': 'image/jpeg',
    'webp': 'image/webp', 'gif': 'image/gif'
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
      ...(cfg.provider === 'openrouter' ? { 'HTTP-Referer': window.location.origin, 'X-Title': 'Nivi Pro' } : {})
    },
    body: JSON.stringify({ model: cfg.model, messages, stream: !!onChunk, max_tokens: 4096 })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`${response.status}: ${err.slice(0,200)}`);
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
          const data = JSON.parse(line.replace('data: ', ''));
          const delta = data.choices?.[0]?.delta?.content || '';
          if (delta) { fullText += delta; _emitChunk(onChunk, fullText); window.scrollToBottom?.(); }
        } catch(e) {}
      }
    }
    return { ok: true, text: fullText };
  }

  const data = await response.json();
  if (data.choices?.[0]) return { ok: true, text: data.choices[0].message.content };
  throw new Error('No choices in response');
}

// ── Search Engine (DuckDuckGo ONLY) ──
async function executeDuckDuckGoSearch(query) {
  try {
    const res = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json`);
    const data = await res.json();
    if (data.AbstractText) return data.AbstractText;
    if (data.RelatedTopics && data.RelatedTopics.length > 0) return data.RelatedTopics.slice(0, 3).map(t => t.Text).join('\n');
    return "No general results found.";
  } catch (e) { return "General search failed."; }
}

const niviSearchTools = [{
  functionDeclarations: [
    { 
      name: "search_general_web", 
      description: "Use for general facts, news, and web searches.", 
      parameters: { type: "OBJECT", properties: { query: { type: "STRING" } }, required: ["query"] } 
    }
  ]
}];

// ── Recursive Stream Sequence with Signature Fix ──
async function _runGeminiStreamSequence(cfg, contents, onChunk, existingText) {
  const currentDate = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${cfg.model}:streamGenerateContent?alt=sse&key=${cfg.key}`;
  
  const payload = {
    systemInstruction: { 
      parts: [{ 
        text: `You are Nivi, an advanced AI Assistant. Today's date is ${currentDate}. Answer user queries accurately. If you need information from the web, use the search_general_web tool.` 
      }] 
    },
    contents: contents,
    tools: niviSearchTools
  };

  const response = await fetch(url, {
    method: 'POST',
    signal: window.AppState?._abortController?.signal,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini ${response.status}: ${errText}`);
  }

  const reader = response.body.getReader();
  let fullText = existingText;
  let modelParts = [];
  let funcCallPart = null;

  while (true) {
    if (window.AppState?._abortController?.signal.aborted) break;
    const { value, done } = await reader.read();
    if (done) break;
    const chunk = new TextDecoder().decode(value);
    const lines = chunk.split('\n').filter(l => l.startsWith('data: '));
    for (const line of lines) {
      try {
        const data = JSON.parse(line.replace('data: ', ''));
        if (data.candidates?.[0]?.content?.parts) {
          for (const part of data.candidates[0].content.parts) {
            modelParts.push(part);
            if (part.text) { 
              fullText += part.text; 
              _emitChunk(onChunk, fullText); 
              window.scrollToBottom?.(); 
            } else if (part.functionCall) { 
              funcCallPart = part; 
            }
          }
        }
      } catch(e) {}
    }
  }

  if (funcCallPart) {
    const fName = funcCallPart.functionCall.name;
    const fArgs = funcCallPart.functionCall.args;
    
    // DuckDuckGo UI Indicator
    _emitChunk(onChunk, fullText + `\n\n> 🦆 **DuckDuckGo:** *"${fArgs.query}"*...\n\n`);
    
    let result = "";
    if (fName === 'search_general_web') {
      result = await executeDuckDuckGoSearch(fArgs.query);
    }

    const followUpContents = [
      ...contents,
      { role: 'model', parts: modelParts },
      { role: 'function', parts: [{ functionResponse: { name: fName, response: { result: result } } }] }
    ];
    return await _runGeminiStreamSequence(cfg, followUpContents, onChunk, fullText);
  }
  return { ok: true, text: fullText };
}

async function _geminiStreamCall(cfg, history, prompt, onChunk) {
  const contents = [...history, { role: 'user', parts: [{ text: prompt }] }];
  return await _runGeminiStreamSequence(cfg, contents, onChunk, '');
}

async function _geminiFileCall(cfg, prompt, fileBase64, mimeType) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${cfg.model}:generateContent?key=${cfg.key}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ role: 'user', parts: [{ inline_data: { mime_type: mimeType, data: fileBase64 } }, { text: prompt }] }] })
  });
  const data = await response.json();
  if (response.ok && data.candidates) return { ok: true, answer: data.candidates[0].content.parts[0].text };
  throw new Error(data.error?.message || 'File call failed');
}

window.directGeminiCallStreamMultiTurn = async function(priorHistory, currentPrompt, onChunk) {
  const chain = window.getModelChain();
  if (chain.length === 0) return { ok: false };
  let lastError = '';
  for (const rawItem of chain) {
    if (window.AppState?._abortController?.signal.aborted) break;
    const cfg = _resolveProvider(rawItem);
    try {
      if (cfg.format === 'gemini') await _geminiStreamCall(cfg, priorHistory, currentPrompt, onChunk);
      else {
        const msgs = priorHistory.map(m => ({ role: m.role === 'model' ? 'assistant' : 'user', content: m.parts[0].text })).concat({ role: 'user', content: currentPrompt });
        await _openaiCall(cfg, msgs, onChunk);
      }
      return { ok: true, model: cfg.model };
    } catch(e) { lastError = e.message; }
  }
  return { ok: false };
};

window.directGeminiCallWithFile = async function(prompt, fileBase64, mimeType) {
  const chain = window.getModelChain();
  const geminiRaw = chain.find(c => c.provider === 'gemini' || (c.model || '').toLowerCase().startsWith('gemini'));
  if (geminiRaw) {
    const cfg = _resolveProvider(geminiRaw);
    cfg.format = 'gemini';
    try { return await _geminiFileCall(cfg, prompt, fileBase64, mimeType); } catch(e) {}
  }
  return { ok: false, answer: 'File analysis failed.' };
};

console.log('Nivi AI Engine v2.0 loaded - DuckDuckGo Search Active 🦆');
