// ── INDEXEDDB ──
async function saveFileToMemory(filename, base64Data, mimeType) {
const projId = document.getElementById('activeProjectSelect')?.value || 
               window._activeProjectId || 'default';
  // IndexedDB ma save (primary - WITH full base64 data)
  if (window.NiviDB) {
    try {
      await NiviDB.saveFile(projId, filename, mimeType, base64Data);
      console.log(`✅ File saved to IndexedDB: ${filename} [${projId}]`);
    } catch(e) {
      console.warn('IndexedDB save failed, localStorage fallback:', e);
    }
  }
// localStorage ma update (Nivi context mate fast read) — project-aware key
  const _fileKey = `nivi_file_memory_${projId}`;
  let files = JSON.parse(localStorage.getItem(_fileKey) || '[]');
  const idx = files.findIndex(f => f.name === filename);
  // ✅ FIX: Large files (>500KB) — data IDB-only rakho, localStorage ma null
  const isLarge = base64Data && base64Data.length > 500000;
  const entry = {
    name: filename, ts: Date.now(),
    data: isLarge ? null : base64Data,   // Large file = IDB-only, no localStorage bloat
    mimeType: mimeType || 'text/plain', projId,
    idbOnly: isLarge
  };
  if (idx >= 0) files[idx] = entry;
  else files.push(entry);
  try {
    localStorage.setItem(_fileKey, JSON.stringify(files));
  } catch(e) {
    // localStorage full — emergency: strip all data fields, keep only metadata
    console.warn('localStorage full, stripping file data to metadata only:', e);
    files = files.map(f => ({ ...f, data: null, idbOnly: true }));
    try { localStorage.setItem(_fileKey, JSON.stringify(files)); } catch(_) {}
  }
  // Firebase cloud backup (project only — default project = IDB sufficient)
  if (projId !== 'default' && typeof saveFileToCloudWorkspace === 'function') {
    saveFileToCloudWorkspace(projId, filename, mimeType, base64Data);
  }
  if(typeof renderSidebarData === 'function') renderSidebarData();
}
// ── GLOBAL APP STATE ──
window.AppState = window.AppState || {
  _tabChatHistory: [],
  _pendingFiles: [],
  _isGenerating: false,
  _abortController: null  // real AbortController instance (null = idle)
};
function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));
}
function safeAttr(value) {
  return encodeURIComponent(String(value ?? ''));
}
function decodeB64Text(b64) {
  try {
    const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    return new TextDecoder('utf-8').decode(bytes);
  } catch(e) {
    try { return atob(b64); } catch(_) { return ''; }
  }
}
function sanitizeHTML(html) {
  const tpl = document.createElement('template');
  tpl.innerHTML = html;
  const allowedTags = new Set(['P','BR','STRONG','B','EM','I','U','S','CODE','PRE','BLOCKQUOTE','UL','OL','LI','A','IMG','DIV','SPAN','TABLE','THEAD','TBODY','TR','TH','TD','HR','H1','H2','H3','H4']);
  const allowedAttrs = new Set(['href','src','alt','title','class','target','rel']);
  tpl.content.querySelectorAll('*').forEach(node => {
    if (!allowedTags.has(node.tagName)) {
      node.replaceWith(document.createTextNode(node.textContent || ''));
      return;
    }
    [...node.attributes].forEach(attr => {
      const name = attr.name.toLowerCase();
      const value = attr.value || '';
      if (!allowedAttrs.has(name) || name.startsWith('on')) node.removeAttribute(attr.name);
      if ((name === 'href' || name === 'src') && /^(javascript|data):/i.test(value)) node.removeAttribute(attr.name);
    });
    if (node.tagName === 'A') {
      node.setAttribute('target', '_blank');
      node.setAttribute('rel', 'noopener noreferrer');
    }
    if (node.tagName === 'IMG') {
      const src = node.getAttribute('src') || '';
      if (!/^https:\/\/image\.pollinations\.ai\//i.test(src) && !src.startsWith('blob:')) node.remove();
    }
  });
  return tpl.innerHTML;
}
// ═══════════════════════════════════════════════════
//  CORE LOGIC (nivi-core.js)
// ═══════════════════════════════════════════════════
// ── FILE HANDLER ──
function handleFileSelectNew(inp){
  if(!inp.files||!inp.files.length)return;
  const existing=window.AppState?._pendingFiles||[];
  const newFiles=Array.from(inp.files);
  // Existing + new, duplicates skip, max 3
  const merged=[...existing];
  for(const f of newFiles){
    if(merged.length>=3)break;
    if(!merged.find(e=>e.name===f.name&&e.size===f.size))merged.push(f);
  }
  if(window.AppState)window.AppState._pendingFiles=merged;
  _renderFilePreviews(merged);
  document.getElementById('filePreview').classList.add('show');
  // Input reset — same file re-select support
  inp.value='';inp.type='text';inp.type='file';
  document.getElementById('mainInput').focus();
}
function _renderFilePreviews(files){
  document.getElementById('filePreviewName').innerHTML=files.map((f,i)=>
    `<span style="background:var(--bg);border:1px solid var(--border-a);border-radius:5px;padding:1px 7px;font-size:10px;white-space:nowrap;display:inline-flex;align-items:center;gap:4px;">
      ${escapeHTML(f.name)}
      <span onclick="_removeFile(${i})" style="cursor:pointer;opacity:.6;font-size:11px;line-height:1;">×</span>
    </span>`
  ).join('');
}
window._removeFile=function(i){
  if(!window.AppState)return;
  AppState._pendingFiles=AppState._pendingFiles.filter((_,idx)=>idx!==i);
  if(AppState._pendingFiles.length===0){clearFile();return;}
  _renderFilePreviews(AppState._pendingFiles);
};
function clearFile(){
  if(window.AppState)AppState._pendingFiles=[];
  const inp=document.getElementById('fileInp');
  inp.value='';inp.type='text';inp.type='file';
  document.getElementById('filePreviewName').innerHTML='';
  document.getElementById('filePreview').classList.remove('show');
}

// ── INITIALIZATION
window.onload = async () => {
  if(!localStorage.getItem('nivi_current_session_id')){
    localStorage.setItem('nivi_current_session_id', 'session_' + Date.now());
  }
  
  // Init active project tracker
  window._activeProjectId = document.getElementById('activeProjectSelect')?.value || 'default';
  const _initProj = window._activeProjectId;
  
  renderProjectsUI();
  updateActiveModelUI();

  // 1. FILES RESTORE (IndexedDB First — ALL projects including default)
  if (window.NiviDB) {
    try {
      const idbFiles = await NiviDB.getProjectFiles(_initProj);
      if (idbFiles && idbFiles.length > 0) {
        // ✅ FIX: Merge IDB files with existing localStorage metadata (preserve idbOnly flags)
        const existing = JSON.parse(localStorage.getItem(`nivi_file_memory_${_initProj}`) || '[]');
        const merged = idbFiles.map(f => {
          const ex = existing.find(e => e.name === f.name);
          return ex ? { ...f, idbOnly: ex.idbOnly } : f;
        });
        localStorage.setItem(`nivi_file_memory_${_initProj}`, JSON.stringify(merged));
        console.log(`✅ Files restored from IndexedDB on load: ${idbFiles.length} [${_initProj}]`);
      } else if (_initProj !== 'default') {
        // Non-default project: Firebase fallback
        if (typeof syncWorkspaceFiles === 'function') syncWorkspaceFiles(_initProj);
      }
    } catch(e) {
      console.warn('IDB file restore failed:', e);
      if (_initProj !== 'default' && typeof syncWorkspaceFiles === 'function') syncWorkspaceFiles(_initProj);
    }
  } else if (_initProj !== 'default' && typeof syncWorkspaceFiles === 'function') {
    syncWorkspaceFiles(_initProj);
  }
renderSidebarData();

  // PASTE AS ATTACHMENT — Ctrl+V image support
  document.addEventListener('paste', function(e) {
    const items = e.clipboardData?.items;
    if (!items) return;
    const imageItem = Array.from(items).find(i => i.type.startsWith('image/'));
    if (!imageItem) return;
    const file = imageItem.getAsFile();
    if (!file) return;
    // File object banavo with name
    const ext = file.type.split('/')[1] || 'png';
    const namedFile = new File([file], `pasted_image_${Date.now()}.${ext}`, {type: file.type});
    const current = window.AppState?._pendingFiles || [];
    if (current.length >= 3) { console.warn('Max 3 files'); return; }
    const updated = [...current, namedFile].slice(0, 3);
    if (window.AppState) window.AppState._pendingFiles = updated;
    document.getElementById('filePreviewName').innerHTML = updated.map(f =>
      `<span style="background:var(--bg);border:1px solid var(--border-a);border-radius:5px;padding:1px 7px;font-size:10px;white-space:nowrap;">${escapeHTML(f.name)}</span>`
    ).join('');
    document.getElementById('filePreview').classList.add('show');
    document.getElementById('mainInput').focus();
  });

// 2. CHAT RESTORE
if (_initProj !== 'default') {
    try {
        let projChat = typeof loadProjectChat === 'function' ? await loadProjectChat(_initProj) : loadProjectChatLocal(_initProj);
        if (projChat && projChat.length > 0) {
            if(window.AppState) AppState._tabChatHistory = projChat;
            localStorage.setItem('niviTabChat', JSON.stringify(projChat));
            projChat.forEach(msg => appendMsg(msg.role, msg.text));
        }
    } catch(e) { console.warn('Project chat init failed:', e); }
} else {
    try {
        let localHistory = typeof loadNiviChat === 'function' ? await loadNiviChat() : JSON.parse(localStorage.getItem('niviTabChat') || '[]');
        if (localHistory && localHistory.length > 0) {
            if(window.AppState) AppState._tabChatHistory = localHistory;
            localStorage.setItem('niviTabChat', JSON.stringify(localHistory));
            // ✅ FIX: chatWindow clear karo pehla — duplicate append rokvo
            document.getElementById('chatWindow').innerHTML = HERO_HTML;
            localHistory.forEach(msg => appendMsg(msg.role, msg.text));
            console.log('✅ Chat restored from IDB/Firebase');
        } else {
            if(window.AppState) AppState._tabChatHistory = [];
        }
    } catch(e){
        console.warn('Chat init failed, fallback:', e);
        // ✅ FIX: restoreChat() call NAHI — duplicate thase
        if(window.AppState) AppState._tabChatHistory = [];
    }
}
};

// ── UI HELPERS ──
window.handleKey = function(e) {if (e.key === 'Enter' && !e.shiftKey) {e.preventDefault(); document.getElementById('sendBtn').click();}};
function qp(t){document.getElementById('mainInput').value=t;document.getElementById('mainInput').focus();}
window.toggleGen = function(g) {
  const stopBtn = document.getElementById('stopBtn');
  const sendBtn = document.getElementById('sendBtn');
  if(stopBtn) stopBtn.style.display = g ? 'flex' : 'none';
  if(sendBtn) sendBtn.style.display = g ? 'none' : 'flex';
  if(window.AppState) window.AppState._isGenerating = g;
};
window.stopGeneration = function() {
    window.toggleGen(false);
    if(window.AppState?._abortController) {
      window.AppState._abortController.abort();
    }
    if(window.AppState) window.AppState._abortController = null;
    // ✅ FIX: ચોંટી ગયેલા 'Thinking' એનિમેશનને તરત કાઢી નાખો
    const thinkingBubbles = document.querySelectorAll('.thinking');
    thinkingBubbles.forEach(el => {
        const msgId = el.closest('.bubble')?.id;
        if (msgId) {
            updateMsg(msgId, '<span style="color:var(--text-muted); font-style:italic;">[Stopped by user]</span>');
        }
    });
};
function toggleSidebar(){
  const s=document.getElementById('sidebar');
  if(window.innerWidth<=768){
    const isOpen=s.classList.toggle('mob-open');
    document.getElementById('mobOverlay')?.classList.toggle('open',isOpen);
  } else {
    s.classList.toggle('collapsed');
  }
}
window.closeMobSidebar=function(){
  document.getElementById('sidebar')?.classList.remove('mob-open');
  document.getElementById('mobOverlay')?.classList.remove('open');
};
function openProjectModal(){document.getElementById('projectModal').classList.add('open');setTimeout(()=>document.getElementById('newProjectName').focus(),100);}
function closeModal(id){document.getElementById(id).classList.remove('open');}
function updateActiveModelUI(respondingModel) {
    let models = [];
    try { models = JSON.parse(localStorage.getItem('nivi_model_chain') || '[]'); } catch(e) {}
    const btn = document.getElementById('modelPickerBtn');
    const lbl = document.getElementById('modelPickerLabel');
    if (!lbl) return;
    if (!models.length) { lbl.textContent = 'No model'; return; }
    const active = respondingModel
        ? models.find(m => (m.model || m.provider) === respondingModel)
        : models[0];
    const name = active ? (active.model || active.provider || '') : '';
    const short = name.replace('gemini-','').replace('-preview','').replace('-latest','');
    lbl.textContent = short || 'No model';
    if (btn) btn.style.borderColor = respondingModel ? 'rgba(109,40,217,.5)' : 'rgba(255,255,255,.12)';
}
window.cycleModel = function() {
    let chain = [];
    try { chain = JSON.parse(localStorage.getItem('nivi_model_chain') || '[]'); } catch(e) {}
    if (chain.length <= 1) return;
    chain.push(chain.shift());
    localStorage.setItem('nivi_model_chain', JSON.stringify(chain));
    updateActiveModelUI();
    renderSidebarData();
}
document.querySelectorAll('.modal').forEach(m=>m.addEventListener('click',function(e){if(e.target===this)this.classList.remove('open');}));
// ── WORKSPACE (PROJECTS) ──
function renderProjectsUI(){
  const projs=JSON.parse(localStorage.getItem('nivi_projects')||'[]');
  const sb=document.getElementById('projectList'),dd=document.getElementById('activeProjectSelect'),aId=dd?dd.value:'default';
  if(sb){sb.innerHTML=`<div class="si ${aId==='default'?'active':''}" onclick="setProj('default')"><span style="flex:1;">/default</span></div>` + 
    projs.map(p=>`
      <div class="si ${aId===p.id?'active':''}" onclick="setProj(decodeURIComponent('${safeAttr(p.id)}'))" title="${escapeHTML(p.name)}" style="position:relative;" onmouseenter="this.querySelector('.pdel').style.opacity='1'" onmouseleave="this.querySelector('.pdel').style.opacity='0'">
        <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;">/${escapeHTML(p.name)}</span>
        <button class="pdel" onclick="event.stopPropagation();deleteProject(decodeURIComponent('${safeAttr(p.id)}'), decodeURIComponent('${safeAttr(p.name)}'))" title="Delete Workspace" style="opacity:0;width:18px;height:18px;border-radius:4px;background:transparent;border:none;color:var(--red);cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:opacity .2s;padding:0;">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        </button>
      </div>
    `).join('');
  }
  if(dd){dd.innerHTML=`<option value="default">default</option>`+projs.map(p=>`<option value="${escapeHTML(p.id)}">${escapeHTML(p.name)}</option>`).join('');}
}
function setProj(id){document.getElementById('activeProjectSelect').value=id;changeActiveProject();renderProjectsUI();}
async function changeActiveProject(){
  const newProj = document.getElementById('activeProjectSelect').value;
  const prevProj = window._activeProjectId || 'default';

  // Step 1: Current chat save & clear
  const currentHistory = window.AppState?._tabChatHistory || [];
  if (currentHistory.length > 0) {
    if (prevProj === 'default') {
      if (typeof archiveNiviChat === 'function') await archiveNiviChat(currentHistory);
    } else {
      if (typeof saveProjectChat === 'function') await saveProjectChat(prevProj, currentHistory);
    }
  }

  // Step 2: Screen clear
  if (window.AppState) AppState._tabChatHistory = [];
  localStorage.setItem('niviTabChat', '[]');
  document.getElementById('chatWindow').innerHTML = HERO_HTML;
  if (typeof closeArt === 'function') closeArt();
  if (typeof closeSheet === 'function') closeSheet();

  // Step 3: Track new active project
  window._activeProjectId = newProj;

    // Step 4: Sync workspace files — IndexedDB first, Firebase fallback
  if (newProj !== 'default' && window.NiviDB) {
    try {
      const idbFiles = await NiviDB.getProjectFiles(newProj);
      if (idbFiles && idbFiles.length > 0) {
        await NiviDB.syncToLocalMemory(newProj);
      } else {
        // IndexedDB empty — Firebase thi load karo (cross-device / fresh browser)
        console.log('IndexedDB empty for project, falling back to Firebase...');
        if (typeof syncWorkspaceFiles === 'function') await syncWorkspaceFiles(newProj);
        // Firebase files ne IndexedDB ma pan mirror karo
        const fbFiles = JSON.parse(localStorage.getItem(`nivi_file_memory_${newProj}`) || '[]');
        for (const f of fbFiles) {
          if (f.data) {
            try { await NiviDB.saveFile(newProj, f.name, f.mimeType, f.data); } catch(e) {}
          }
        }
      }
    } catch(e) {
      if (typeof syncWorkspaceFiles === 'function') syncWorkspaceFiles(newProj);
    }
  } else {
    if (typeof syncWorkspaceFiles === 'function') syncWorkspaceFiles(newProj);
  }

  // Step 5: Load project chat
  if (newProj !== 'default') {
    try {
      // Try IDB/Firebase via loadProjectChat
      const projChat = typeof loadProjectChat === 'function' ? await loadProjectChat(newProj) : loadProjectChatLocal(newProj);
      if (projChat && projChat.length > 0) {
        if(window.AppState) AppState._tabChatHistory = projChat;
        localStorage.setItem('niviTabChat', JSON.stringify(projChat));
        projChat.forEach(msg => appendMsg(msg.role, msg.text));
        console.log('✅ Project chat restored:', newProj);
      }
    } catch(e) {
      console.warn('Project chat load failed:', e);
    }
  } else {
    try {
      const defChat = typeof loadNiviChat === 'function' ? await loadNiviChat() : JSON.parse(localStorage.getItem('niviTabChat') || '[]');
      if (defChat && defChat.length > 0) {
        if(window.AppState) AppState._tabChatHistory = defChat;
        localStorage.setItem('niviTabChat', JSON.stringify(defChat));
        defChat.forEach(msg => appendMsg(msg.role, msg.text));
        console.log('✅ Default chat restored');
      }
    } catch(e) {
      console.warn('Default chat load failed:', e);
    }
  }
}
function createNewProject(){
  const n=document.getElementById('newProjectName').value.trim();if(!n)return;
  const id='proj_'+Date.now();
  if(typeof createCloudWorkspace==='function')createCloudWorkspace(id,n);
  else{let p=JSON.parse(localStorage.getItem('nivi_projects')||'[]');p.push({id,name:n});localStorage.setItem('nivi_projects',JSON.stringify(p));}
  closeModal('projectModal');document.getElementById('newProjectName').value='';renderProjectsUI();
}

// ── CHAT ENGINE ──
const HERO_HTML=`<div id="heroSection"><div class="hero-icon">N</div><h1 class="hero-title">Nivi Workspace</h1><p class="hero-sub">Multi-model AI · Live file preview · Firebase sync</p><div class="hero-chips"><div class="hchip" onclick="qp('Explain my codebase structure')">Analyze codebase</div><div class="hchip" onclick="qp('Summarize the uploaded document')">Summarize doc</div><div class="hchip" onclick="qp('Debug this error and suggest fixes')">Debug code</div><div class="hchip" onclick="qp('/image futuristic city at night, neon lights')">Generate image</div></div></div>`;

// ✅ FIX 3: New Chat દબાવતી વખતે જૂનું બધું રોકી દો
function clearChat(){
  // બેકગ્રાઉન્ડ પ્રોસેસ રોકો
  if(window.AppState?._abortController) {
    window.AppState._abortController.abort();
    window.AppState._abortController = null;
    if(typeof toggleGen === 'function') toggleGen(false);
  }

  const history = window.AppState?._tabChatHistory || [];
  const activeProj = window._activeProjectId || document.getElementById('activeProjectSelect')?.value || 'default';
  
  if(history.length > 0){
    if (activeProj !== 'default') {
      if(typeof archiveProjectChat === 'function') archiveProjectChat(activeProj, history);
      if(typeof clearProjectSession === 'function') clearProjectSession(activeProj);
    } else {
      if(typeof archiveNiviChat === 'function') archiveNiviChat(history);
      const _archKey = `nivi_chat_archives_default`;
      let a=JSON.parse(localStorage.getItem(_archKey)||'[]');
      a.unshift({id:Date.now(), msgCount: history.length, chat: history, title: localStorage.getItem('nivi_current_title') || 'New Chat'});
      if(a.length > 20) a = a.slice(0,20);
      localStorage.setItem(_archKey, JSON.stringify(a));
    }
  }
  if(window.AppState) AppState._tabChatHistory=[];
  localStorage.setItem('niviTabChat','[]');
  localStorage.removeItem('nivi_current_title');
  localStorage.setItem('nivi_current_session_id', 'session_' + Date.now()); 
  if(typeof closeArt === 'function') closeArt(); 
  if(typeof closeSheet === 'function') closeSheet();
  document.getElementById('chatWindow').innerHTML=HERO_HTML;
  renderSidebarData();
  // Firebase ક્લીનઅપ
  if(typeof syncNiviChat === 'function') {
      syncNiviChat([]);
  } else if(typeof saveNiviChat === 'function') {
      saveNiviChat([]);
  }
  if(typeof saveUserData === 'function') saveUserData('history');
}
function _fmt(text) {
  if(!text) return '';
    if(text.includes('<img') && text.includes('pollinations')) return text;
    if(text.includes('class="thinking"')) return text; // thinking animation — as-is
    let cleanText = text.replace(/~?\d+\s*tokens/g, '').replace(/<div class="tbdg".*?<\/div>/g, '');
    if(typeof marked !== 'undefined') {
    const renderer = new marked.Renderer();
    renderer.html = function(token) {
      const raw = typeof token === 'string' ? token : (token.raw || token.text || '');
      return escapeHTML(raw);
    };
    marked.setOptions({ 
        breaks: true,
        renderer: renderer
    });
    const h = marked.parse(cleanText);
    const w = cleanText.trim().split(/\s+/).length;
    return sanitizeHTML(h) + `<div class="tbdg" style="margin-top:10px;">~${Math.ceil(w*1.3)} tokens</div>`;
  }
  return escapeHTML(cleanText).replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/\n/g,'<br>');
}
function appendMsg(role,text,id){
  const win=document.getElementById('chatWindow');
  const hero=document.getElementById('heroSection');if(hero)hero.style.display='none';
  const msgId=id||'msg-'+Date.now()+Math.random().toString(36).substr(2,5);
  const row=document.createElement('div');
  row.className=`msg-row ${role==='user'?'ur':'nr'}`;row.id='row-'+msgId;
  const av=role==='nivi'?`<div class="avatar nav">N</div>`:'';
  const uiText = text.replace(/<nivi-hidden>[\s\S]*?<\/nivi-hidden>/g, '').trim();
  const safeUserText = escapeHTML(uiText);
  const fmt = role==='nivi' ? _fmt(uiText) : safeUserText.replace(/\n/g,'<br>');
  const esc=escapeHTML(text);
  const acts=`<div class="msg-actions"><div class="abt" onclick="cpMsg('${msgId}')" title="Copy"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg></div><div class="abt del" onclick="delMsg('${msgId}')" title="Delete"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></div></div>`;
  const align=role==='user'?'flex-end':'flex-start';const mw=role==='user'?'max-width:80%;':'width:100%;';
  // ✅ FIX: User bubble khub motu hoy to collapse karo + Show more button
  const isLongUserMsg = role === 'user' && uiText.length > 300;
  const bubbleClass = isLongUserMsg ? 'bubble collapsed' : 'bubble';
  const expandBtn = isLongUserMsg
    ? `<div class="bubble-expand-btn" onclick="
        const b=this.previousElementSibling;
        const isCol=b.classList.contains('collapsed');
        b.classList.toggle('collapsed',!isCol);
        this.textContent=isCol?'▲ Show less':'▼ Show more';
      ">▼ Show more</div>`
    : '';
  row.innerHTML=`${av}<div style="display:flex;flex-direction:column;align-items:${align};${mw}"><div class="${bubbleClass}" id="${msgId}" data-raw="${esc}">${fmt}</div>${expandBtn}${acts}</div>`;
  win.appendChild(row);
  if(role==='nivi' && typeof addArtifactButtons === 'function') addArtifactButtons(row);
  const wrap=document.getElementById('chatWrap');if(wrap.scrollHeight-wrap.scrollTop-wrap.clientHeight<200)wrap.scrollTop=wrap.scrollHeight;
}
function updateMsg(id,text){
  const el=document.getElementById(id);if(!el)return;
  el.setAttribute('data-raw',text.replace(/'/g,"&#39;").replace(/"/g,"&quot;"));
  const uiText = text.replace(/<nivi-hidden>[\s\S]*?<\/nivi-hidden>/g, '').trim();
  clearTimeout(window['renderTimer_'+id]);
  window['renderTimer_'+id] = setTimeout(() => {
    el.innerHTML=_fmt(uiText);
    if(typeof addArtifactButtons === 'function') addArtifactButtons(el); 
    const wrap=document.getElementById('chatWrap');if(wrap.scrollHeight-wrap.scrollTop-wrap.clientHeight<200)wrap.scrollTop=wrap.scrollHeight;
  }, 50);
}
function restoreChat(){
  try{
    const saved=JSON.parse(localStorage.getItem('niviTabChat')||'[]');
    if(saved.length>0){
      if(window.AppState)AppState._tabChatHistory=[];
      document.getElementById('heroSection').style.display='none';
      saved.forEach(msg=>{appendMsg(msg.role,msg.text);if(window.AppState)AppState._tabChatHistory.push(msg);});
    }
  }catch(e){}
}
function cpMsg(id){const el=document.getElementById(id);if(!el)return;navigator.clipboard.writeText(el.getAttribute('data-raw').replace(/&#39;/g,"'").replace(/&quot;/g,'"'));}
// ✅ BULLETPROOF DELETE — text-match based (DOM index drift fix)
async function delMsg(id) {
  if(!confirm('Delete this message?')) return;
  const row = document.getElementById('row-'+id);
  const bubble = document.getElementById(id);
  if(!row) return;

  // 1. data-raw thi exact text extract karo
  const rawAttr = bubble ? bubble.getAttribute('data-raw') || '' : '';
  const decodedRaw = rawAttr
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');

  // 2. UI thi remove karo
  row.remove();

  if (window.AppState?._tabChatHistory) {
    // 3. ✅ Text-match thi exact entry shodo — DOM index nahi (drift-proof)
    let matchIdx = AppState._tabChatHistory.findIndex(m => (m.text || '') === decodedRaw);
    // Fallback: partial match (first 120 chars) for very long messages
    if (matchIdx === -1 && decodedRaw.length > 0) {
      const shortKey = decodedRaw.slice(0, 120);
      matchIdx = AppState._tabChatHistory.findIndex(m => (m.text || '').startsWith(shortKey));
    }
    if (matchIdx > -1) {
      AppState._tabChatHistory.splice(matchIdx, 1);
      console.log('✅ Matched at index:', matchIdx, '| Remaining:', AppState._tabChatHistory.length);
    } else {
      console.warn('❌ NO MATCH — decodedRaw preview:', decodedRaw.slice(0, 80));
      console.warn('❌ History texts:', AppState._tabChatHistory.map(m => m.text?.slice(0,40)));
    }

    // 4. localStorage + Firebase / IDB sync
    localStorage.setItem('niviTabChat', JSON.stringify(AppState._tabChatHistory));
    const activeProj = window._activeProjectId || document.getElementById('activeProjectSelect')?.value || 'default';
    // ✅ IDB pan update karo — nahi to restart par deleted message wapas aave
    if (window.NiviDB) {
      try { await NiviDB.saveChat(activeProj, AppState._tabChatHistory); } catch(e) {}
    }
    if (activeProj !== 'default') {
      if (typeof saveProjectChatLocal === 'function') saveProjectChatLocal(activeProj, AppState._tabChatHistory);
      if (typeof saveProjectChat === 'function') await saveProjectChat(activeProj, AppState._tabChatHistory);
    } else {
      if (typeof syncNiviChat === 'function') await syncNiviChat(AppState._tabChatHistory);
      else if (typeof saveNiviChat === 'function') await saveNiviChat(AppState._tabChatHistory);
    }
    console.log('✅ Message deleted & synced. History length:', AppState._tabChatHistory.length);
  }
}
function loadArchivedChat(id){
    const _activeProj = window._activeProjectId || document.getElementById('activeProjectSelect')?.value || 'default';
    const _archKey = `nivi_chat_archives_${_activeProj}`;
    let archives = JSON.parse(localStorage.getItem(_archKey)||'[]');
    const archive = archives.find(a => String(a.id) === String(id));
    if(!archive) { console.log("Archive not found!"); return; }
    if(!archive.chat || archive.chat.length === 0) { alert("No data in this chat"); return; }
    // ✅ FIX: ચેટ એક્ટિવ થઈ ગઈ, એટલે તેને આર્કાઇવમાંથી કાઢી નાખો (Duplicate ન થાય તે માટે)
    archives = archives.filter(a => String(a.id) !== String(id));
    localStorage.setItem(_archKey, JSON.stringify(archives));
    if(window.AppState) AppState._tabChatHistory = JSON.parse(JSON.stringify(archive.chat));
    localStorage.setItem('niviTabChat', JSON.stringify(archive.chat));
    localStorage.setItem('nivi_current_title', archive.title || 'Archived Chat');
    const win = document.getElementById('chatWindow');
    const bubbles = win.querySelectorAll('.msg-row');
    bubbles.forEach(b => b.remove());
    const hero = document.getElementById('heroSection');
    if(hero) hero.style.display = 'none';
    archive.chat.forEach(msg => {
        appendMsg(msg.role, msg.text);
    });
    renderSidebarData();
}
async function deleteProject(id, name){
  if(!confirm(`Delete workspace "${name}"? This removes its local files and chat backup.`)) return;
  let projs = JSON.parse(localStorage.getItem('nivi_projects')||'[]');
  projs = projs.filter(p => p.id !== id);
  localStorage.setItem('nivi_projects', JSON.stringify(projs));
  localStorage.removeItem('nivi_proj_chat_' + id);
  localStorage.removeItem('nivi_proj_session_' + id);
  if (window.NiviDB) { try { await NiviDB.deleteProjectFiles(id); } catch(e) { console.warn('Project file cleanup failed:', e); } }
  if (typeof deleteCloudWorkspace === 'function') { try { await deleteCloudWorkspace(id); } catch(e) { console.warn('Cloud workspace cleanup failed:', e); } }
  if(document.getElementById('activeProjectSelect').value === id){ setProj('default'); } 
  else { renderProjectsUI(); }
}
// ✅ FIX 1: સંપૂર્ણ ડીલીટ અને એબોર્ટ (Abort) સિસ્ટમ
async function deleteCurrentChat() {
  if(!confirm('Delete current chat?')) return;
  // 1. બેકગ્રાઉન્ડમાં ચાલતી પ્રોસેસ તરત રોકી દો
  if(window.AppState?._abortController) {
    window.AppState._abortController.abort();
    window.AppState._abortController = null;
    if(typeof toggleGen === 'function') toggleGen(false);
  }
  // 2. લોકલ UI અને ડેટા સાફ કરો
  if(window.AppState) AppState._tabChatHistory = [];
  localStorage.setItem('niviTabChat', '[]');
  localStorage.removeItem('nivi_current_title');
  // ✅ FIX: IDB ma pan chat clear karo — nahi to restart par wapas aave
  if (window.NiviDB) {
    const _delProj = window._activeProjectId || document.getElementById('activeProjectSelect')?.value || 'default';
    try { await NiviDB.saveChat(_delProj, []); } catch(e) {}
  }
  if(typeof closeArt === 'function') closeArt(); 
  if(typeof closeSheet === 'function') closeSheet();
  document.getElementById('chatWindow').innerHTML = HERO_HTML;
  // 3. Firebase માં પ્રોપર Sync ફંક્શન વાપરો
  if(typeof syncNiviChat === 'function') {
      await syncNiviChat([]);
  } else if(typeof saveNiviChat === 'function') {
      saveNiviChat([]);
  }
  if(typeof saveUserData === 'function') saveUserData('history');
  renderSidebarData();
}
function deleteArchivedChat(id){
  if(!confirm('Delete this archived chat?')) return;
  const _activeProj = window._activeProjectId || document.getElementById('activeProjectSelect')?.value || 'default';
  const _archKey = `nivi_chat_archives_${_activeProj}`;
  let archives = JSON.parse(localStorage.getItem(_archKey)||'[]');
  archives = archives.filter(a => a.id !== id);
  localStorage.setItem(_archKey, JSON.stringify(archives));
  renderSidebarData();
}
// ── SIDEBAR DATA RENDERER ──
let _sidebarRenderTimer = null;
const _renderSidebarNow = function() {
  let models = []; 
  try { models = JSON.parse(localStorage.getItem('nivi_model_chain') || '[]'); } catch(e) {}
  const ml = document.getElementById('modelList');
  if (ml) {
    if (!models.length) models = [{provider: '-', model: 'Not Configured'}];
    const clr = {gemini: 'var(--accent)', openrouter: 'var(--purple)', nvidia: 'var(--amber)', custom: 'var(--green)'};
    ml.innerHTML = models.map((m, i) => `<div class="si" title="${escapeHTML(m.provider)}: ${escapeHTML(m.model)}"><span style="color:${clr[m.provider] || 'var(--text-sub)'};font-size:9px;font-weight:700;flex-shrink:0;">${i+1}</span><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHTML(m.model || m.provider)}</span>${i === 0 ? '<span class="bdg" style="background:var(--accent-dim);color:var(--accent);">active</span>' : ''}</div>`).join('');
  }
  const _fileProjId = window._activeProjectId || document.getElementById('activeProjectSelect')?.value || 'default';
  const files = JSON.parse(localStorage.getItem(`nivi_file_memory_${_fileProjId}`) || '[]');
  const fl = document.getElementById('fileList');
  if (fl) {
    if (files.length) {
      fl.innerHTML = files.map(f => {
        const sn = encodeURIComponent(f.name);
        return `<div class="si" style="position:relative;" onmouseenter="this.querySelector('.fdel').style.opacity='1'" onmouseleave="this.querySelector('.fdel').style.opacity='0'">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0;color:var(--accent);cursor:pointer;" onclick="openSavedFile(decodeURIComponent('${sn}'))"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;cursor:pointer;" onclick="openSavedFile(decodeURIComponent('${sn}'))">${f.name}</span>
          <button class="fdel" onclick="event.stopPropagation();deleteFile(decodeURIComponent('${sn}'))" title="Delete file" style="opacity:0;width:18px;height:18px;border-radius:4px;background:transparent;border:none;color:var(--red);cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:opacity .2s;padding:0;"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
        </div>`;
      }).join('');
    } else {
      fl.innerHTML = `<div class="si" style="opacity:.4;cursor:default;font-size:10px;">No files yet</div>`;
    }
  }
const ch = document.getElementById('chatHistory');
if (ch) {
    const _activeProj = window._activeProjectId || document.getElementById('activeProjectSelect')?.value || 'default';
    const _archKey = `nivi_chat_archives_${_activeProj}`;
    const history = JSON.parse(localStorage.getItem('niviTabChat') || '[]');
    const archives = JSON.parse(localStorage.getItem(_archKey) || '[]');
    let html = '';

    if (history.length) {
        // ✅ FIX: જો ટાઈટલ ના હોય તો ચેટ પરથી જાતે બનાવી લો
        let curTitle = localStorage.getItem('nivi_current_title');
        if (!curTitle) curTitle = history[0]?.text?.split(' ').slice(0,4).join(' ') + '...' || 'New Chat';
        const pairCount = Math.ceil(history.length / 2); // ✅ માત્ર સવાલો ગણશે
        html += `<div class="si active" style="display:flex;align-items:center;gap:4px;">
            <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHTML(curTitle)}</span>
            <span class="bdg">${pairCount}</span>
            <button onclick="event.stopPropagation();deleteCurrentChat()" title="Delete" style="opacity:0.6;background:none;border:none;color:var(--red);cursor:pointer;padding:0;display:flex;align-items:center;flex-shrink:0;">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
        </div>`;
    }
    if (archives.length) {
        html += archives.map(a => {
            const aCount = Math.ceil((a.msgCount || a.chat?.length || 0) / 2); // ✅ આર્કાઇવ માટે પણ સાચું કાઉન્ટ
            return `<div class="si" onclick="loadArchivedChat(${a.id})" style="display:flex;align-items:center;gap:4px;"><span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHTML(a.title || new Date(a.id).toLocaleDateString())}</span><span class="bdg">${aCount}</span><button onclick="event.stopPropagation();deleteArchivedChat(${a.id})" style="opacity:0.6;background:none;border:none;color:var(--red);cursor:pointer;padding:0;display:flex;align-items:center;flex-shrink:0;"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button></div>`
        }).join('');
    }
    ch.innerHTML = html || `<div class="si" style="opacity:.4;">Empty</div>`;
}
};
// Debounced public API — max once per 150ms (prevents jank on rapid calls)
window.renderSidebarData = function() {
  if (_sidebarRenderTimer) clearTimeout(_sidebarRenderTimer);
  _sidebarRenderTimer = setTimeout(_renderSidebarNow, 150);
};
function openSavedFile(name){
  const _pId = window._activeProjectId || document.getElementById('activeProjectSelect')?.value || 'default';
  const files=JSON.parse(localStorage.getItem(`nivi_file_memory_${_pId}`)||'[]');
  const f=files.find(x=>x.name===name);
  if(!f) { alert('File not found.'); return; }
  // ✅ FIX: idbOnly files — IDB thi data fetch karo (localStorage ma null hoy)
  if(f.idbOnly && window.NiviDB) {
    NiviDB.getProjectFiles(_pId).then(idbFiles => {
      const idbFile = idbFiles.find(x => x.name === name);
      if(idbFile?.data && typeof openArt === 'function') {
        openArt({name: idbFile.name, type: idbFile.mimeType || 'text/plain'}, idbFile.data);
      } else {
        alert('File data not found in storage. Please re-attach the file.');
      }
    }).catch(() => alert('Could not read file from storage. Please re-attach.'));
    return;
  }
  if(f?.data && typeof openArt === 'function') openArt({name:f.name,type:f.mimeType||'text/plain'},f.data);
  else alert('File data not found. Re-attach the file.');
}
async function deleteFile(name){
  if(!confirm(`Delete "${name}"?`))return;
  const projId = window._activeProjectId ||
                 document.getElementById('activeProjectSelect')?.value || 'default';
  // IndexedDB thi delete
  if (window.NiviDB) {
    try { await NiviDB.deleteFile(projId, name); } catch(e) {}
  }
 // Firebase thi pan delete karo (cloud sync)
  if (projId !== 'default' && typeof db !== 'undefined') {
    try {
      const userId = typeof _getNiviUserId === 'function' ? 
        (localStorage.getItem('nivi_user_id') || 'user_1774995803095') : 'user_1774995803095';
      const snap = await db.collection('users').doc(userId)
        .collection('workspaces').doc(projId)
        .collection('files').where('name', '==', name).get();
      snap.forEach(doc => doc.ref.delete());
      console.log('✅ File deleted from Firebase:', name);
    } catch(e) { console.warn('Firebase file delete failed:', e); }
  }
// ✅ FIX: project-aware key thi delete karo
  const _delProjId = window._activeProjectId || document.getElementById('activeProjectSelect')?.value || 'default';
  const _delKey = `nivi_file_memory_${_delProjId}`;
  let files=JSON.parse(localStorage.getItem(_delKey)||'[]');
  files=files.filter(f=>f.name!==name);
  localStorage.setItem(_delKey, JSON.stringify(files));
  if(typeof ART !== 'undefined' && ART.cur?.name===name){
    if(typeof closeArt === 'function') closeArt();
    if(typeof closeSheet === 'function') closeSheet();
  }
  renderSidebarData();
}
// ── AUTO TITLE GENERATION — local heuristic (no API call) ──
function generateChatTitle(firstMessage) {
  try {
    // Strip markdown, slash commands, file prefixes
    let clean = firstMessage
      .replace(/^📎[^\n]+\n/, '')         // remove file attachment prefix
      .replace(/^\/\w+\s*/, '')            // remove slash commands
      .replace(/[`*#_~>\[\]()]/g, '')      // strip markdown chars
      .replace(/https?:\/\/\S+/g, '')      // strip URLs
      .trim();
    // Take first 4-5 meaningful words
    const words = clean.split(/\s+/).filter(w => w.length > 1);
    const title = words.slice(0, 5).join(' ').slice(0, 32);
    return Promise.resolve(title || 'New Chat');
  } catch(e) {
    return Promise.resolve('New Chat');
  }
}
// ── SEND MESSAGE LOGIC ──
async function handleSend(){
  if(window.AppState&&AppState._isGenerating)return;
  const inp=document.getElementById('mainInput');
  const text=inp.value.trim();
  const pendingFiles=window.AppState?._pendingFiles||[];
  const file=pendingFiles[0]||null;
  if(!text&&!pendingFiles.length)return;
  if(text.toLowerCase().startsWith('/image ')){
    const prompt=text.substring(7).trim();
    appendMsg('user',text);
    if(window.AppState){AppState._tabChatHistory.push({role:'user',text});localStorage.setItem('niviTabChat',JSON.stringify(AppState._tabChatHistory));}
    inp.value='';inp.style.height='auto';
    const resId='nivi-'+Date.now();
    const url=`https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&nologo=true`;
    const imgHtml=`<div style="margin-top:7px;"><img src="${url}" style="max-width:100%;border-radius:10px;border:1px solid var(--border);" onload="document.getElementById('chatWrap').scrollTop=99999;"><div style="margin-top:6px;display:flex;gap:7px;"><a href="${url}" target="_blank" download class="tbtn prim" style="text-decoration:none;display:inline-flex;">⬇ Download</a></div></div>`;
    appendMsg('nivi',imgHtml,resId);
    if(window.AppState){AppState._tabChatHistory.push({role:'nivi',text:imgHtml});localStorage.setItem('niviTabChat',JSON.stringify(AppState._tabChatHistory));}
    renderSidebarData();return;
  }
  const userText=pendingFiles.length>0?`📎 ${pendingFiles.map(f=>f.name).join(', ')}\n${text}`:text;
  appendMsg('user',userText);
  if(window.AppState){AppState._tabChatHistory.push({role:'user',text:userText});localStorage.setItem('niviTabChat',JSON.stringify(AppState._tabChatHistory));}
  inp.value='';inp.style.height='auto';clearFile();
  toggleGen(true);
  if(window.AppState){
    AppState._abortController = new AbortController();
  }
  const resId='nivi-'+Date.now();
  appendMsg('nivi',`<div class="thinking"><span></span><span></span><span></span></div>`,resId);
  try{
    if(pendingFiles.length > 0 && typeof directGeminiCallWithFile==='function'){
      // Analyze all pending files (one by one, streaming each result)
      const proj = document.getElementById('activeProjectSelect').value;
      let combinedAnswer = '';
      for (const f of pendingFiles) {
        const fileB64 = await window.readFileAsBase64(f);
        const fileMime = window.getFileMimeType ? window.getFileMimeType(f.name) : f.type;
        // Save to memory & cloud
        if (typeof saveFileToMemory === 'function') saveFileToMemory(f.name, fileB64, fileMime);
        if (typeof saveFileToCloudWorkspace === 'function') saveFileToCloudWorkspace(proj, f.name, fileMime, fileB64);
        // Analyze
        const r = await directGeminiCallWithFile(text || 'Analyze this file.', fileB64, fileMime);
        if (!AppState?._abortController?.signal.aborted) {
          const prefix = pendingFiles.length > 1 ? `**${f.name}:**\n` : '';
          combinedAnswer += prefix + (r.answer || 'No answer received.') + '\n\n';
          updateMsg(resId, combinedAnswer.trim());
          // Art card per file
          const el = document.getElementById(resId);
          if (el && typeof makeArtCard === 'function') {
            const ext = f.name.split('.').pop().toLowerCase();
            el.parentElement.appendChild(makeArtCard(f.name, ext, fileB64, f));
          }
        }
      }
      // Open first file in artifact panel
      if (!AppState?._abortController?.signal.aborted && pendingFiles.length > 0 && typeof openArt === 'function') {
        const firstB64 = await window.readFileAsBase64(pendingFiles[0]);
        openArt(pendingFiles[0], firstB64);
      }
      if(window.AppState) AppState._pendingFiles=[];
      document.getElementById('fileInp').value='';
    }else if(typeof directGeminiCallStreamMultiTurn==='function'){
      let apiText=text;
      if(text.toLowerCase().startsWith('/song ')){
        apiText=`You are a professional lyricist. Write a beautiful song about: "${text.substring(6).trim()}". Include Verse, Chorus and Bridge. Make it emotional and modern.`;
      }
          // ✅ FIX: હિસ્ટ્રીમાંથી જૂની ફાઈલોનો કચરો સાફ કરો અને પર્સના લોક કરો
          const _rawHist = window.AppState ? AppState._tabChatHistory.slice(0, -1) : [];
          const _trimHist = _rawHist.slice(-15); // છેલ્લી ૧૫ વાતચીત યાદ રાખશે
          const hist = _trimHist.map(m => {
          // યુઝર અને નિવી બંનેના મેસેજમાંથી જૂની ફાઈલનો કોન્ટેક્સ્ટ કાઢી નાખો
          const cleanText = (m.text || '').replace(/\n\n---\n(?:\[Project:[^\]]+\] )?\[Files in Nivi Memory\][\s\S]*$/m, '').trim();
          return { role: m.role === 'nivi' ? 'model' : 'user', parts: [{ text: cleanText }] };
          });
        // ✅ FIX: પર્સના હંમેશા ટોપ પર રાખવા માટે (ગમે તેટલી લાંબી ચેટ હોય)
        const niviDirective = `SYSTEM DIRECTIVE: You are Nivi AI. ALWAYS output code replacements using strict markdown blocks like:
FILE: filename.ext
FIND:
\`\`\`
(old code)
\`\`\`
REPLACE:
\`\`\`
(new code)
\`\`\``;
        // જો હિસ્ટ્રીમાં પહેલેથી SYSTEM DIRECTIVE ના હોય, તો તેને શરૂઆતમાં જ ઉમેરો (દર વખતે)
        if (!hist.find(h => (h.parts[0].text || '').includes("SYSTEM DIRECTIVE:"))) {
            hist.unshift(
                { role: 'user', parts: [{ text: niviDirective }] },
                { role: 'model', parts: [{ text: 'Understood. I am Nivi AI. I will always provide exact, targeted code replacements with line numbers and file names in the exact format requested.' }] }
            );
        }
      // Active project files — IndexedDB first, localStorage fallback
      let memFiles = [];
    const TEXT_MIMES = ['text/javascript','text/html','text/css','text/plain','application/json','text/csv'];
    const textFiles = memFiles.filter(f => TEXT_MIMES.includes(f.mimeType));
    if (textFiles.length > 0) {
        const isDefault = _ctxProj === 'default';
        const projLabel = !isDefault ? `[Project: ${_ctxProj}] ` : '';
        const fileLimit = isDefault ? 3 : 5;
        const charLimit = isDefault ? 1000 : 1500;
        // ✅ SOLID FIX: લંબાઈ ચેક કરવાને બદલે મોડેલને જ સીધી અને કડક સૂચના આપી દો
        const strictInstruction = `\n\n---\n[WORKSPACE CONTEXT: The following files are currently open. IMPORTANT: DO NOT review, analyze, or mention these files unless the user's message explicitly asks about code, errors, or file content. If the user is just greeting (e.g., "Hi", "How are you") or chatting naturally, completely IGNORE these files and reply to them normally.]\n${projLabel}\n`;
        fileContext = strictInstruction + textFiles.slice(0, fileLimit).map(f => {
            const content = decodeB64Text(f.data).slice(0, charLimit);
            return `File: ${f.name}\n\`\`\`\n${content}\n\`\`\``;
        }).join('\n\n');
    }
    const finalPrompt = fileContext ? apiText + fileContext : apiText;
    const _result = await directGeminiCallStreamMultiTurn(hist, finalPrompt, (chunk) => {
        if(!AppState?._abortController?.signal.aborted) updateMsg(resId, chunk);
    });
    if (_result?.model && typeof updateActiveModelUI === 'function') updateActiveModelUI(_result.model);
      }
    } catch(err) {
      if(!AppState?._abortController?.signal.aborted) updateMsg(resId,'⚠ Connection Error: '+err.message);
    } finally {
    toggleGen(false);
    // Artifact panel open hoy to close na karvo
    const _artOpen = document.getElementById('artPanel')?.style.width !== '0px' && document.getElementById('artPanel')?.style.width !== '';
    const _wasAborted = AppState?._abortController?.signal.aborted;
    if(window.AppState) AppState._abortController = null;  // clear after each call
// ✅ FIX: જો મોડલ જવાબ ના આપે અને થિંકિંગ ચોંટી જાય, તો સ્માર્ટ એરર મેસેજ બતાવો
const el = document.getElementById(resId);
if (el && (el.getAttribute('data-raw') || '').includes('class="thinking"')) {
    const errorHTML = `
        <div style="background: rgba(239, 68, 68, 0.1); border-left: 3px solid var(--red); padding: 10px 12px; border-radius: 4px; margin-top: 5px;">
            <strong style="color:var(--red); font-size:13px;">⚠ Request Failed or Timed Out</strong>
            <div style="color:var(--text-sub); font-size:11.5px; margin-top:4px; line-height:1.4;">
                Nivi didn't receive a valid response. Please check if the <b>Model Name</b> is correct, or try typing <b>"continue"</b> if the file was too large.
            </div>
        </div>
    `;
    updateMsg(resId, errorHTML);
}
    }
    let chatTitle = "Current Session"; 
    if(!_wasAborted) {
      if(window.AppState) {
      const el = document.getElementById(resId);
        let rawText = '';
        if (el && el.getAttribute('data-raw')) {
          rawText = el.getAttribute('data-raw')
            .replace(/&#39;/g, "'")
            .replace(/&quot;/g, '"')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>');
        } else if (el) {
          rawText = el.innerText || '';
        }
        // 🛑 FIX: Error text history ma save na thavo joiye
        const isErrorMsg = rawText.includes('⚠ Connection Error') || rawText.includes('All models failed');
        
        if (rawText.trim() && !isErrorMsg) {
          AppState._tabChatHistory.push({ role: 'nivi', text: rawText });
          if (AppState._tabChatHistory.length === 2) {
            chatTitle = await generateChatTitle(AppState._tabChatHistory[0].text) || "Current Session";
            localStorage.setItem('nivi_current_title', chatTitle); 
          }
          localStorage.setItem('niviTabChat', JSON.stringify(AppState._tabChatHistory));
        }
      }
    }
    
    // Unified Sync Call 
    if (typeof syncNiviChat === 'function') {
        await syncNiviChat(window.AppState._tabChatHistory);
    } else {
        const _activeProj = window._activeProjectId || document.getElementById('activeProjectSelect')?.value || 'default';
        if (_activeProj !== 'default') {
          if (typeof saveProjectChat === 'function') await saveProjectChat(_activeProj, AppState._tabChatHistory);
          if (typeof saveProjectChatLocal === 'function') saveProjectChatLocal(_activeProj, AppState._tabChatHistory);
        } else {
          if(typeof saveUserData === 'function') await saveUserData('history');
        }
    }
    renderSidebarData();
  }

// ── SETTINGS MODAL ──
window.openSettings = function() {
  const c = document.getElementById('modelChainContainer');
  if(!c) return;
  c.innerHTML = '';
  let chain = [];
  try { chain = JSON.parse(localStorage.getItem('nivi_model_chain') || '[]'); } catch(e) {}
  if(!chain.length) {
    addModelRow({ model: '', key: '', url: '' }); // Pehli vaar khali row aapse
  } else {
    chain.forEach(cfg => addModelRow(cfg));
  }
  document.getElementById('settingsModal').classList.add('open');
}
window.addModelRow = function(config = { model: '', key: '', url: '' }) {
  const c = document.getElementById('modelChainContainer');
  if(!c) return;
  const row = document.createElement('div');
  row.className = 'mrow'; // Tamaro modal row no class
  row.innerHTML = `
    <button class="mrow-rm" onclick="this.closest('.mrow').remove()" title="Delete">x</button>
    <div class="mrow-grid">
      <div>
        <label class="flbl">Model Name</label>
        <input type="text" class="finput conf-model" placeholder="e.g. gemini-2.5-flash" value="${config.model || ''}" style="margin-bottom:0;">
      </div>
      <div>
        <label class="flbl">API Key</label>
        <input type="password" class="finput conf-key" placeholder="Paste API key..." value="${config.key || ''}" style="margin-bottom:0;">
      </div>
    </div>
    <div style="margin-top: 8px;">
      <label class="flbl">API URL (Optional)</label>
      <input type="text" class="finput conf-url" placeholder="https://..." value="${config.url || ''}" style="margin-bottom:0;">
    </div>
  `;
  c.appendChild(row);
}
window.switchActiveModel = function(idx) {
    let chain = [];
    try { chain = JSON.parse(localStorage.getItem('nivi_model_chain') || '[]'); } catch(e) {}
    const i = parseInt(idx);
    if (isNaN(i) || i < 0 || i >= chain.length || i === 0) return;
    // Selected model ne top par muko
    const selected = chain.splice(i, 1)[0];
    chain.unshift(selected);
    localStorage.setItem('nivi_model_chain', JSON.stringify(chain));
    updateActiveModelUI();
    renderSidebarData();
    // Settings modal open hoy to re-render karo
    const sm = document.getElementById('settingsModal');
    if (sm && sm.classList.contains('open')) openSettings();
}
window.saveSettings = function() {
  const rows = document.querySelectorAll('.mrow');
  const chain = [];
  rows.forEach(row => {
    const model = row.querySelector('.conf-model').value.trim();
    const key   = row.querySelector('.conf-key').value.trim();
    const url   = row.querySelector('.conf-url').value.trim();
    
    // Jo trane mathi ek pan field bharelu hoy toh save kari levu
    if(model || key || url) {
      chain.push({ provider: 'custom', model, key, url }); 
    }
  });
  localStorage.setItem('nivi_model_chain', JSON.stringify(chain));
  // Modal bandh karo ane UI update karo
  closeModal('settingsModal');
  if(typeof updateActiveModelUI === 'function') updateActiveModelUI();
  if(typeof renderSidebarData === 'function') renderSidebarData();
}
// ── AUTO-SCROLL HELPER ──
window.scrollToBottom = function() {
  const chatWrap = document.querySelector('.chat-wrap');
  if (chatWrap) {
    // 100ms નો delay આપવો જેથી DOM માં કન્ટેન્ટ રેન્ડર થઈ જાય
    setTimeout(() => {
      chatWrap.scrollTo({
        top: chatWrap.scrollHeight,
        behavior: 'smooth'
      });
    }, 100);
  }
};
