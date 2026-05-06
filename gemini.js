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
  
  // URL: item.url > localStorage override > default
  let urls = {};
  try { urls = JSON.parse(localStorage.getItem('nivi_provider_urls') || '{}'); } catch(e) {}
  
  const resolvedUrl = item.url || urls[item.provider] || def.url || '';
  const format = def.format;
  
  // Key: item.key > localStorage per-provider key
  const lsKeyName = `nivi_key_${item.provider}`;
  const resolvedKey = item.key || localStorage.getItem(lsKeyName) || '';
  
  // Model: item.model > localStorage per-provider default model
  const lsModelName = `nivi_model_${item.provider}`;
  const resolvedModel = item.model || localStorage.getItem(lsModelName) || '';

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
async function _openaiCall(cfg, messages, onChunk) {
  const response = await fetch(cfg.url, {
    method: 'POST',
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
      if (window.AppState?._abortController) break;
      const { value, done } = await reader.read();
      if (done) break;
      const chunk = new TextDecoder().decode(value);
      const lines = chunk.split('\n').filter(l => l.startsWith('data: ') && l !== 'data: [DONE]');
      for (const line of lines) {
        try {
          const data = JSON.parse(line.replace('data: ', ''));
          const delta = data.choices?.[0]?.delta?.content || '';
          if (delta) { fullText += delta; onChunk(fullText); }
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
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [...history, { role: 'user', parts: [{ text: prompt }] }]
    })
  });

  if (!response.ok) throw new Error(`Gemini ${response.status}`);

  const reader = response.body.getReader();
  let fullText = '';
  while (true) {
    if (window.AppState?._abortController) break;
    const { value, done } = await reader.read();
    if (done) break;
    const chunk = new TextDecoder().decode(value);
    const lines = chunk.split('\n').filter(l => l.startsWith('data: '));
    for (const line of lines) {
      try {
        const data = JSON.parse(line.replace('data: ', ''));
        if (data.candidates?.[0]?.content) {
          fullText += data.candidates[0].content.parts[0].text;
          onChunk(fullText);
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
  if (chain.length === 0) { onChunk('⚠️ No models configured. Open Settings to add a model.'); return; }

  let lastError = '';
  for (const rawItem of chain) {
    if (window.AppState?._abortController) break;
    const cfg = _resolveProvider(rawItem);

    if (!cfg.key) { lastError = `No API key for ${cfg.provider}`; continue; }
    if (!cfg.model) { lastError = `No model set for ${cfg.provider}`; continue; }

    try {
      if (cfg.format === 'gemini') {
        await _geminiStreamCall(cfg, priorHistory, currentPrompt, onChunk);
      } else {
        // Convert Gemini history format → OpenAI format
        const messages = priorHistory.map(m => ({
          role: m.role === 'model' ? 'assistant' : 'user',
          content: m.parts[0].text
        })).concat({ role: 'user', content: currentPrompt });
        await _openaiCall(cfg, messages, onChunk);
      }
      return { ok: true };
    } catch(e) {
      lastError = e.message;
      console.warn(`[Nivi] ${cfg.provider}/${cfg.model} failed: ${e.message}. Trying next...`);
    }
  }

  onChunk(`⚠️ All models failed. Last error: ${lastError}`);
  return { ok: false };
};

// ═══════════════════════════════════════════════════════════
//  FILE ANALYSIS — Gemini primary, OpenAI-compatible fallback
// ═══════════════════════════════════════════════════════════
window.directGeminiCallWithFile = async function(prompt, fileBase64, mimeType) {
  const chain = window.getModelChain();

  // Gemini first — only provider that supports inline file data natively
  const geminiRaw = chain.find(c => c.provider === 'gemini');
  if (geminiRaw) {
    const cfg = _resolveProvider(geminiRaw);
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
          const textContent = atob(fileBase64).slice(0, 10000);
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

  return { ok: false, answer: '⚠️ File analysis failed. Ensure Gemini is configured with a valid API key.' };
};

console.log('✅ Nivi AI Engine v2.0 loaded — Universal provider support');
// ═══════════════════════════════════════════════════════════
//  MEDIA GENERATION ENGINE (Veo Video & Lyria Audio)
// ═══════════════════════════════════════════════════════════

// Helper: Long Running Operations માટે Polling (કારણ કે વિડીયો બનતા સમય લાગે)
async function _pollOperation(operationName, apiKey, onProgress) {
  const url = `https://generativelanguage.googleapis.com/v1beta/${operationName}?key=${apiKey}`;
  let isDone = false;
  let result = null;

  while (!isDone) {
    if (window.AppState?._abortController) throw new Error('Operation cancelled by user.');

    const response = await fetch(url);
    const data = await response.json();

    if (data.error) throw new Error(data.error.message || 'Polling failed');

    if (data.done) {
      isDone = true;
      result = data.response; 
    } else {
      if (onProgress) onProgress('⏳ Generating media... Please wait (Polling API)');
      await new Promise(r => setTimeout(r, 5000)); // દર 5 સેકન્ડે ચેક કરશે
    }
  }
  return result;
}

// Main Media Call Function
window.directGeminiMediaCall = async function(prompt, mediaType, onProgress) {
  const chain = window.getModelChain();
  const cfg = chain.find(c => c.provider === 'gemini');

  if (!cfg || !cfg.key) {
    return { ok: false, error: 'Gemini API Key is missing. Please check settings.' };
  }

  try {
    if (mediaType === 'video') {
      // ── VEO 3.1 (Video) - Long Running Operation ──
      const model = 'veo-3.1-generate-preview';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:predictLongRunning?key=${cfg.key}`;

      if(onProgress) onProgress('🎬 Initiating Veo 3.1 Video generation...');

      const req = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instances: [{ prompt: prompt }] })
      });

      const data = await req.json();
      if (data.error) throw new Error(data.error.message);
      if (!data.name) throw new Error('No operation ID returned from Veo.');

      // Polling ચાલુ કરો જ્યાં સુધી વિડીયો રેડી ના થાય
      const finalResponse = await _pollOperation(data.name, cfg.key, onProgress);
      return { ok: true, data: finalResponse, type: 'video' };

    } else if (mediaType === 'audio') {
      // ── LYRIA 3 (Audio) - Standard Generation ──
      const model = 'lyria-3-pro-preview';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${cfg.key}`;

      if(onProgress) onProgress('🎵 Composing track with Lyria 3...');

      const req = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }]
        })
      });

      const data = await req.json();
      if (data.error) throw new Error(data.error.message);
      return { ok: true, data: data.candidates[0].content.parts[0], type: 'audio' };
    }
  } catch (e) {
    return { ok: false, error: e.message };
  }
};
