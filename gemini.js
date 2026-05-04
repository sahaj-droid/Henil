window.getModelChain = function() {
    return JSON.parse(localStorage.getItem('nivi_model_chain') || '[]');
};

window.readFileAsBase64 = function (file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = () => reject(new Error('File read failed'));
        reader.readAsDataURL(file);
    });
};

window.getFileMimeType = function (filename) {
    const ext = filename.split('.').pop().toLowerCase();
    const map = {
        'pdf':'application/pdf', 'js':'text/javascript', 'html':'text/html', 'css':'text/css',
        'txt':'text/plain', 'json':'application/json', 'csv':'text/csv',
        'png':'image/png', 'jpg':'image/jpeg', 'jpeg':'image/jpeg', 'webp':'image/webp'
    };
    return map[ext] || 'text/plain';
};

// MULTI-TURN TEXT STREAMING WITH FALLBACKS
window.directGeminiCallStreamMultiTurn = async function(priorHistory, currentPrompt, onChunk) {
    const chain = window.getModelChain();
    if (chain.length === 0) { onChunk("⚠️ No models configured in settings."); return; }

    for (const item of chain) {
        if (window.AppState._abortController) break;
        try {
            if (item.provider === 'gemini') {
                const url = `https://generativelanguage.googleapis.com/v1beta/models/${item.model || 'gemini-1.5-flash'}:streamGenerateContent?alt=sse&key=${item.key}`;
                const response = await fetch(url, {
                    method: 'POST',
                    body: JSON.stringify({ contents: [...priorHistory, { role: 'user', parts: [{ text: currentPrompt }] }] })
                });
                if (!response.ok) continue;
                
                const reader = response.body.getReader();
                let fullText = "";
                while (true) {
                    if (window.AppState._abortController) break;
                    const { value, done } = await reader.read();
                    if (done) break;
                    const chunk = new TextDecoder().decode(value);
                    const lines = chunk.split('\n').filter(l => l.startsWith('data: '));
                    for (const line of lines) {
                        try {
                            const data = JSON.parse(line.replace('data: ', ''));
                            if(data.candidates && data.candidates[0].content) {
                                fullText += data.candidates[0].content.parts[0].text;
                                onChunk(fullText);
                            }
                        } catch(e) {}
                    }
                }
                return { ok: true };
            } else {
                // OPENROUTER / GROQ FALLBACK (Non-Streaming)
                const apiEndpoint = item.provider === 'groq' ? 'https://api.groq.com/openai/v1/chat/completions' : (item.url || 'https://openrouter.ai/api/v1/chat/completions');
                const messages = priorHistory.map(m => ({ role: m.role==='model'?'assistant':'user', content: m.parts[0].text })).concat({role:'user', content:currentPrompt});
                const response = await fetch(apiEndpoint, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${item.key}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ model: item.model, messages: messages })
                });
                const data = await response.json();
                if (data.choices && data.choices[0]) {
                    onChunk(data.choices[0].message.content);
                    return { ok: true };
                }
            }
        } catch(e) { console.warn(`Model ${item.model} failed. Switching...`); }
    }
    onChunk("⚠️ All configured models failed to respond.");
    return { ok: false };
};

// FILE READING WITH DYNAMIC KEY FETCH
window.directGeminiCallWithFile = async function(prompt, fileBase64, mimeType) {
    const chain = window.getModelChain();
    const geminiConfig = chain.find(c => c.provider === 'gemini');
    if (!geminiConfig || !geminiConfig.key) return { ok: false, answer: '⚠️ Gemini API Key is missing for file upload.' };

    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${geminiConfig.model || 'gemini-1.5-flash'}:generateContent?key=${geminiConfig.key}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ inline_data: { mime_type: mimeType, data: fileBase64 } }, { text: prompt }] }]
            })
        });

        const data = await response.json();
        if (response.ok && data.candidates) {
            return { ok: true, answer: data.candidates[0].content.parts[0].text };
        }
    } catch (err) { console.error('File call error:', err.message); }

    // Text File Fallback Logic
    if (['text/javascript', 'text/html', 'text/plain', 'text/css'].includes(mimeType)) {
        try {
            const fallbackModel = chain.find(c => c.provider !== 'gemini');
            if(fallbackModel && fallbackModel.key) {
                 const textContent = atob(fileBase64);
                 const apiEndpoint = fallbackModel.provider === 'groq' ? 'https://api.groq.com/openai/v1/chat/completions' : (fallbackModel.url || 'https://openrouter.ai/api/v1/chat/completions');
                 const res = await fetch(apiEndpoint, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${fallbackModel.key}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ model: fallbackModel.model, messages: [{role:'user', content:`File Content:\n\`\`\`\n${textContent.slice(0, 8000)}\n\`\`\`\n\nUser Query: ${prompt}`}] })
                });
                const data = await res.json();
                if(data.choices) return { ok: true, answer: data.choices[0].message.content };
            }
        } catch(e) {}
    }
    return { ok: false, answer: '⚠️ File read failed. Ensure Gemini is configured as primary.' };
};
