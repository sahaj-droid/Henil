// ══════════════════════════════════════════════════════════
//  NC-SETTINGS — Settings Modal, Model Chain, scrollToBottom
// ══════════════════════════════════════════════════════════

// ── SETTINGS MODAL ──
window.openSettings = function() {
  if (typeof window.closeMobSidebar === 'function') window.closeMobSidebar();
  const c = document.getElementById('modelChainContainer');
  if (c) {
    c.innerHTML = '';
    let chain = [];
    try { chain = JSON.parse(localStorage.getItem('nivi_model_chain') || '[]'); } catch(e) {}
    if (!chain.length) window.addModelRow({ model: '', key: '', url: '' });
    else chain.forEach(cfg => window.addModelRow(cfg));
  }
  const sc = document.getElementById('searchChainContainer');
  if (sc) {
    sc.innerHTML = '';
    let sChain = [];
    try { sChain = JSON.parse(localStorage.getItem('nivi_search_model_chain') || '[]'); } catch(e) {}
    if (!sChain.length) window.addSearchModelRow({ model: '', key: '', url: '' });
    else sChain.forEach(cfg => window.addSearchModelRow(cfg));
  }
  document.getElementById('settingsModal').classList.add('open');
};

window.addModelRow = function(config) {
  const cfg = config || {};
  const c = document.getElementById('modelChainContainer');
  if (!c) return;
  const row = document.createElement('div');
  row.className = 'mrow';
  row.innerHTML = `
    <button class="mrow-rm" onclick="this.closest('.mrow').remove()" title="Delete">x</button>
    <div class="mrow-grid">
      <div>
        <label class="flbl">Model Name</label>
        <input type="text" class="finput conf-model" placeholder="e.g. gemini-2.5-flash" value="${cfg.model || ''}" style="margin-bottom:0;">
      </div>
      <div>
        <label class="flbl">API Key</label>
        <input type="password" class="finput conf-key" placeholder="Paste API key..." value="${cfg.key || ''}" style="margin-bottom:0;">
      </div>
    </div>
    <div style="margin-top:8px;">
      <label class="flbl">API URL <span style="opacity:.5;">(optional - leave blank for Gemini)</span></label>
      <input type="text" class="finput conf-url" placeholder="https://..." value="${cfg.url || ''}" style="margin-bottom:0;">
    </div>
  `;
  c.appendChild(row);
};

window.addSearchModelRow = function(config) {
  const cfg = config || {};
  const c = document.getElementById('searchChainContainer');
  if (!c) return;
  const row = document.createElement('div');
  row.className = 'mrow search-mrow';
  row.innerHTML = `
    <button class="mrow-rm" onclick="this.closest('.mrow').remove()" title="Delete">x</button>
    <div class="mrow-grid">
      <div>
        <label class="flbl">Model Name</label>
        <input type="text" class="finput conf-model" placeholder="e.g. gemini-2.5-pro" value="${cfg.model || ''}" style="margin-bottom:0;">
      </div>
      <div>
        <label class="flbl">API Key</label>
        <input type="password" class="finput conf-key" placeholder="Paste API key..." value="${cfg.key || ''}" style="margin-bottom:0;">
      </div>
    </div>
    <div style="margin-top:8px;">
      <label class="flbl">API URL <span style="opacity:.5;">(optional)</span></label>
      <input type="text" class="finput conf-url" placeholder="https://..." value="${cfg.url || ''}" style="margin-bottom:0;">
    </div>
  `;
  c.appendChild(row);
};

window.switchActiveModel = function(idx) {
  let chain = [];
  try { chain = JSON.parse(localStorage.getItem('nivi_model_chain') || '[]'); } catch(e) {}
  const i = parseInt(idx);
  if (isNaN(i) || i < 0 || i >= chain.length || i === 0) return;
  const selected = chain.splice(i, 1)[0];
  chain.unshift(selected);
  localStorage.setItem('nivi_model_chain', JSON.stringify(chain));
  updateActiveModelUI();
  if (typeof window.renderSidebarData === 'function') window.renderSidebarData();
  const sm = document.getElementById('settingsModal');
  if (sm && sm.classList.contains('open')) window.openSettings();
};

// FIX 10: validate that each row has at least a model name AND an API key before saving
window.saveSettings = function() {
  const errors = [];
  const extractChain = (containerId, prefix) => {
    const c = document.getElementById(containerId);
    if (!c) return [];
    const rows = c.querySelectorAll('.mrow');
    const ch = [];
    rows.forEach((row, idx) => {
      const model = row.querySelector('.conf-model').value.trim();
      const key   = row.querySelector('.conf-key').value.trim();
      const url   = row.querySelector('.conf-url').value.trim();
      if (!model && !key && !url) return;
      if (!model) { errors.push(`${prefix} Row ${idx + 1}: Model name is required.`); return; }
      if (!key)   { errors.push(`${prefix} Row ${idx + 1}: API key is required.`);    return; }
      const modelLower = model.toLowerCase();
      let provider = 'custom';
      // Detect Gemini: handles both 'gemini-2.0-flash' and shorthand '2.0-flash', '2.5-pro', '1.5-flash-lite'
      const isGeminiModel = modelLower.startsWith('gemini-')
        || modelLower.startsWith('gemma-')
        || modelLower.startsWith('learnlm-')
        || /^\d+\.\d+/.test(modelLower); // e.g. '2.0-flash', '3.1-flash-lite'
      if (isGeminiModel && !url) provider = 'gemini';  // Only auto-detect Gemini if no custom URL
      else if (url.includes('openrouter.ai')) provider = 'openrouter';
      else if (url.includes('nvidia.com') || url.includes('api.nvidia')) provider = 'nvidia';
      ch.push({ provider, model, key, url });
    });
    return ch;
  };

  const mainChain = extractChain('modelChainContainer', 'Main');
  const searchChain = extractChain('searchChainContainer', 'Search');
  
  if (errors.length) { alert(errors.join('\n')); return; }
  
  localStorage.setItem('nivi_model_chain', JSON.stringify(mainChain));
  localStorage.setItem('nivi_search_model_chain', JSON.stringify(searchChain));
  
  closeModal('settingsModal');
  if (typeof updateActiveModelUI === 'function') updateActiveModelUI();
  if (typeof window.renderSidebarData === 'function') window.renderSidebarData();
};

// ── AUTO-SCROLL ──
window.scrollToBottom = function() {
  const chatWrap = document.querySelector('.chat-wrap');
  if (chatWrap) {
    setTimeout(() => { chatWrap.scrollTo({ top: chatWrap.scrollHeight, behavior: 'smooth' }); }, 100);
  }
};

// ── SETTINGS EXPORT / IMPORT (cross-device sync) ──
window.exportNiviSettings = function() {
  const data = {
    v: 1,
    chain:  JSON.parse(localStorage.getItem('nivi_model_chain')        || '[]'),
    search: JSON.parse(localStorage.getItem('nivi_search_model_chain') || '[]'),
  };
  const json = JSON.stringify(data, null, 2);
  navigator.clipboard.writeText(json).then(() => {
    // Flash the button
    const btn = document.querySelector('[onclick="exportNiviSettings()"]');
    if (btn) { const o = btn.innerHTML; btn.innerHTML = '✅ Copied!'; setTimeout(() => { btn.innerHTML = o; }, 2000); }
  }).catch(() => {
    // Fallback: prompt with text so user can manually copy
    prompt('Copy this settings JSON and paste on your other device:', json);
  });
};

window.importNiviSettings = function() {
  const json = prompt('Paste the settings JSON from your other device:');
  if (!json) return;
  try {
    const data = JSON.parse(json.trim());
    if (!data.chain || !Array.isArray(data.chain)) throw new Error('Invalid format');
    localStorage.setItem('nivi_model_chain', JSON.stringify(data.chain));
    if (data.search) localStorage.setItem('nivi_search_model_chain', JSON.stringify(data.search));
    // Reload settings UI
    window.openSettings();
    if (typeof updateActiveModelUI === 'function') updateActiveModelUI();
    if (typeof window.renderSidebarData === 'function') window.renderSidebarData();
    const btn = document.querySelector('[onclick="importNiviSettings()"]');
    if (btn) { const o = btn.innerHTML; btn.innerHTML = '✅ Imported!'; setTimeout(() => { btn.innerHTML = o; }, 2000); }
  } catch(e) {
    alert('❌ Invalid settings JSON. Make sure you copied the full text from "📋 Copy Settings" on your other device.');
  }
};
