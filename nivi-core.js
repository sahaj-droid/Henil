// ── INDEXEDDB ──
async function saveFileToMemory(filename, base64Data, mimeType) {
  const projId = window._activeProjectId || 
                 document.getElementById('activeProjectSelect')?.value || 'default';
  const entry = { name: filename, ts: Date.now(), data: base64Data || null, 
                  mimeType: mimeType || 'text/plain', projId };
  // IndexedDB ma save (primary)
  if (window.NiviDB) {
    try {
      await NiviDB.saveFile(projId, filename, mimeType, base64Data);
      console.log(`✅ File saved to IndexedDB: ${filename} [${projId}]`);
    } catch(e) {
      console.warn('IndexedDB save failed, localStorage fallback:', e);
    }
  }
  // localStorage ma pan update (Nivi context mate fast read)
  let files = JSON.parse(localStorage.getItem('nivi_file_memory') || '[]');
  const idx = files.findIndex(f => f.name === filename);
  if (idx >= 0) files[idx] = entry;
  else files.push(entry);
  localStorage.setItem('nivi_file_memory', JSON.stringify(files));
  // Firebase cloud backup (project only)
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
  _abortController: false
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
  const files=Array.from(inp.files).slice(0,3);
  if(window.AppState)window.AppState._pendingFiles=files;
  document.getElementById('filePreviewName').textContent=files.map(f=>f.name).join(', ');
  document.getElementById('filePreview').classList.add('show');
  document.getElementById('mainInput').focus();
}
function clearFile(){
  if(window.AppState)AppState._pendingFiles=[];
  document.getElementById('fileInp').value='';
  document.getElementById('filePreview').classList.remove('show');
}

// ── INITIALIZATION ──
window.onload=async()=>{
  if(!localStorage.getItem('nivi_current_session_id')){
    localStorage.setItem('nivi_current_session_id', 'session_' + Date.now());
  }
  // Init active project tracker
  window._activeProjectId = document.getElementById('activeProjectSelect')?.value || 'default';
  renderProjectsUI();
  renderSidebarData();
  updateActiveModelUI();
  const _initProj = window._activeProjectId;
  if (_initProj !== 'default' && window.NiviDB) {
    try {
      const idbFiles = await NiviDB.getProjectFiles(_initProj);
      if (idbFiles && idbFiles.length > 0) {
        localStorage.setItem('nivi_file_memory', JSON.stringify(idbFiles));
        renderSidebarData();
        console.log(`✅ Files restored from IndexedDB on load: ${idbFiles.length}`);
      } else {
        // IndexedDB empty — Firebase fallback
        if (typeof syncWorkspaceFiles === 'function') syncWorkspaceFiles(_initProj);
      }
    } catch(e) {
      if (typeof syncWorkspaceFiles === 'function') syncWorkspaceFiles(_initProj);
    }
  }
  if(typeof loadNiviChat === 'function'){
    try {
      const fbChat = await loadNiviChat();
      if(fbChat && fbChat.length > 0){
        // Firebase master — localStorage overwrite karo
        localStorage.setItem('niviTabChat', JSON.stringify(fbChat));
        if(window.AppState) AppState._tabChatHistory = fbChat;
        fbChat.forEach(msg => appendMsg(msg.role, msg.text));
        console.log('✅ Chat restored from Firebase');
      } else {
        // Firebase empty — localStorage pan clear karo
        localStorage.setItem('niviTabChat', '[]');
        if(window.AppState) AppState._tabChatHistory = [];
        console.log('✅ Firebase empty — fresh start');
      }
    } catch(e){
      // Firebase fail — localStorage fallback
      console.warn('Firebase failed, localStorage fallback');
      restoreChat();
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
    if(window.AppState) window.AppState._abortController = true;
};
function toggleSidebar(){const s=document.getElementById('sidebar');if(window.innerWidth<=768)s.classList.toggle('mob-open');else s.classList.toggle('collapsed');}
function openProjectModal(){document.getElementById('projectModal').classList.add('open');setTimeout(()=>document.getElementById('newProjectName').focus(),100);}
function closeModal(id){document.getElementById(id).classList.remove('open');}
function updateActiveModelUI() {
    let models = JSON.parse(localStorage.getItem('nivi_model_chain') || '[]');
    const el = document.getElementById('activeModelDisplay');
    if (el) {
        if (models.length > 0) {
            el.textContent = `Active: ${models[0].model || models[0].provider}`;
        } else {
            el.textContent = "No Model Configured";
        }
    }
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
        const fbFiles = JSON.parse(localStorage.getItem('nivi_file_memory') || '[]');
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
      let projChat = await loadProjectChat(newProj);
      if (!projChat || projChat.length === 0) {
        projChat = loadProjectChatLocal(newProj);
      }
      if (projChat && projChat.length > 0) {
        AppState._tabChatHistory = projChat;
        localStorage.setItem('niviTabChat', JSON.stringify(projChat));
        projChat.forEach(msg => appendMsg(msg.role, msg.text));
        console.log('✅ Project chat restored:', newProj);
      }
    } catch(e) {
      console.warn('Project chat load failed:', e);
    }
  } else {
    // Default: load default Nivi chat
    try {
      const fbChat = await loadNiviChat();
      if (fbChat && fbChat.length > 0) {
        AppState._tabChatHistory = fbChat;
        localStorage.setItem('niviTabChat', JSON.stringify(fbChat));
        fbChat.forEach(msg => appendMsg(msg.role, msg.text));
      }
    } catch(e) {}
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

function clearChat(){
  const history = window.AppState?._tabChatHistory || [];
  const activeProj = window._activeProjectId || document.getElementById('activeProjectSelect')?.value || 'default';

  if(history.length > 0){
    if (activeProj !== 'default') {
      // Project chat archive
      if(typeof archiveProjectChat === 'function') archiveProjectChat(activeProj, history);
      if(typeof clearProjectSession === 'function') clearProjectSession(activeProj);
    } else {
      // Default chat archive (existing logic)
      if(typeof archiveNiviChat === 'function') archiveNiviChat(history);
      let a=JSON.parse(localStorage.getItem('nivi_chat_archives')||'[]');
      a.unshift({id:Date.now(), msgCount: history.length, chat: history});
      if(a.length > 20) a = a.slice(0,20);
      localStorage.setItem('nivi_chat_archives', JSON.stringify(a));
    }
  }
  if(window.AppState) AppState._tabChatHistory=[];
  localStorage.setItem('niviTabChat','[]');
  localStorage.setItem('nivi_current_session_id', 'session_' + Date.now()); // navi ID
  if(typeof closeArt === 'function') closeArt(); 
  if(typeof closeSheet === 'function') closeSheet();
  document.getElementById('chatWindow').innerHTML=HERO_HTML;
  
  renderSidebarData();
  if(typeof saveNiviChat === 'function') saveNiviChat([]);
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
  row.innerHTML=`${av}<div style="display:flex;flex-direction:column;align-items:${align};${mw}"><div class="bubble" id="${msgId}" data-raw="${esc}">${fmt}</div>${acts}</div>`;
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
function delMsg(id){
  if(!confirm('Delete this message?'))return;
  const row=document.getElementById('row-'+id),el=document.getElementById(id);if(!el)return;
  const raw=el.getAttribute('data-raw').replace(/&#39;/g,"'").replace(/&quot;/g,'"');
  if(row)row.remove();
  if(window.AppState?._tabChatHistory){
    AppState._tabChatHistory=AppState._tabChatHistory.filter(m=>m.text!==raw);
    localStorage.setItem('niviTabChat',JSON.stringify(AppState._tabChatHistory));
    if(typeof saveUserData==='function') saveUserData('history'); 
  }
}

function loadArchivedChat(id){
  const archives = JSON.parse(localStorage.getItem('nivi_chat_archives')||'[]');
  const archive = archives.find(a => String(a.id) === String(id));
  if(!archive) { console.log("Archive not found!"); return; }
  if(!archive.chat || archive.chat.length === 0) { alert("No data in this chat"); return; }
  if(window.AppState) AppState._tabChatHistory = JSON.parse(JSON.stringify(archive.chat));
  localStorage.setItem('niviTabChat', JSON.stringify(archive.chat));
  const win = document.getElementById('chatWindow');
  const bubbles = win.querySelectorAll('.msg-row');
  bubbles.forEach(b => b.remove());
  const hero = document.getElementById('heroSection');
  if(hero) hero.style.display = 'none';
  archive.chat.forEach(msg => { appendMsg(msg.role, msg.text); });
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

function deleteCurrentChat(){
  if(!confirm('Delete current chat?')) return;
  if(window.AppState) AppState._tabChatHistory = [];
  localStorage.setItem('niviTabChat', '[]');
  if(typeof closeArt === 'function') closeArt(); 
  if(typeof closeSheet === 'function') closeSheet();
  document.getElementById('chatWindow').innerHTML = HERO_HTML;
  renderSidebarData();
  if(typeof saveNiviChat === 'function') saveNiviChat([]);
  if(typeof saveUserData === 'function') saveUserData('history');
}

function deleteArchivedChat(id){
  if(!confirm('Delete this archived chat?')) return;
  let archives = JSON.parse(localStorage.getItem('nivi_chat_archives')||'[]');
  archives = archives.filter(a => a.id !== id);
  localStorage.setItem('nivi_chat_archives', JSON.stringify(archives));
  renderSidebarData();
}
// ── SIDEBAR DATA RENDERER ──
window.renderSidebarData = function() {
  let models = []; 
  try { models = JSON.parse(localStorage.getItem('nivi_model_chain') || '[]'); } catch(e) {}
  const ml = document.getElementById('modelList');
  if (ml) {
    if (!models.length) models = [{provider: '-', model: 'Not Configured'}];
    const clr = {gemini: 'var(--accent)', openrouter: 'var(--purple)', nvidia: 'var(--amber)', custom: 'var(--green)'};
    ml.innerHTML = models.map((m, i) => `<div class="si" title="${escapeHTML(m.provider)}: ${escapeHTML(m.model)}"><span style="color:${clr[m.provider] || 'var(--text-sub)'};font-size:9px;font-weight:700;flex-shrink:0;">${i+1}</span><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHTML(m.model || m.provider)}</span>${i === 0 ? '<span class="bdg" style="background:var(--accent-dim);color:var(--accent);">active</span>' : ''}</div>`).join('');
  }
  const files = JSON.parse(localStorage.getItem('nivi_file_memory') || '[]');
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
    const history = JSON.parse(localStorage.getItem('niviTabChat') || '[]');
    const archives = JSON.parse(localStorage.getItem('nivi_chat_archives') || '[]');
    let html = '';
    if (history.length) {
      html += `<div class="si active">Current Session <span class="bdg">${history.length}</span></div>`;
    }
    if (archives.length) {
      html += archives.map(a => `<div class="si" onclick="loadArchivedChat(${a.id})">${new Date(a.id).toLocaleDateString()} <span class="bdg">${a.msgCount}</span></div>`).join('');
    }
    ch.innerHTML = html || `<div class="si" style="opacity:.4;">Empty</div>`;
  }
};

function openSavedFile(name){
  const files=JSON.parse(localStorage.getItem('nivi_file_memory')||'[]');
  const f=files.find(x=>x.name===name);
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
  // localStorage thi delete
  let files=JSON.parse(localStorage.getItem('nivi_file_memory')||'[]');
  files=files.filter(f=>f.name!==name);
  localStorage.setItem('nivi_file_memory',JSON.stringify(files));
  if(typeof ART !== 'undefined' && ART.cur?.name===name){
    if(typeof closeArt === 'function') closeArt();
    if(typeof closeSheet === 'function') closeSheet();
  }
  renderSidebarData();
}

// ── AUTO TITLE GENERATION ──
async function generateChatTitle(firstMessage) {
    const history = window.AppState ? AppState._tabChatHistory : [];
    if (history.length > 2) return null;
    const prompt = `Give a very short 2-3 word title for this chat. No quotes, no punctuation, just the title words. Text: "${firstMessage.slice(0, 200)}"`;
    try {
        // directGeminiCallWithFile nahi — streamMultiTurn use karo
        let title = '';
        await directGeminiCallStreamMultiTurn([], prompt, (chunk) => {
            title = chunk;
        });
        title = title.trim().replace(/[\"'`*#\n]/g, '').slice(0, 30);
        return title || 'New Chat';
    } catch (e) {
        console.error("Title Gen Failed:", e);
    }
    return "New Chat";
}
// ── SEND MESSAGE LOGIC ──
async function handleSend(){
  if(window.AppState&&AppState._isGenerating)return;
  const inp=document.getElementById('mainInput');
  const text=inp.value.trim();
  const files=window.AppState?._pendingFiles||[];
  const file=files[0]||null;
  if(!text&&!files.length)return;

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

  const userText=files.length>0?`📎 ${files.map(f=>f.name).join(', ')}\n${text}`:text;
  appendMsg('user',userText);
  if(window.AppState){AppState._tabChatHistory.push({role:'user',text:userText});localStorage.setItem('niviTabChat',JSON.stringify(AppState._tabChatHistory));}
  inp.value='';inp.style.height='auto';clearFile();
  toggleGen(true);if(window.AppState)AppState._abortController=false;
  const resId='nivi-'+Date.now();
  appendMsg('nivi',`<div class="thinking"><span></span><span></span><span></span></div>`,resId);

  try{
    if(file&&typeof directGeminiCallWithFile==='function'){
      const b64=await window.readFileAsBase64(file);
      const mime=window.getFileMimeType?window.getFileMimeType(file.name):file.type;
      const r=await directGeminiCallWithFile(text||'Analyze this file.',b64,mime);
      if(!window.AppState||!AppState._abortController){
        updateMsg(resId,r.answer||'No answer received.');
        const el = document.getElementById(resId);
        const proj = document.getElementById('activeProjectSelect').value;
        for (const f of files) {
          const fileB64 = await window.readFileAsBase64(f);
          const fileMime = window.getFileMimeType ? window.getFileMimeType(f.name) : f.type;
          if (typeof saveFileToMemory === 'function') {
            saveFileToMemory(f.name, fileB64, fileMime);
          }
          if (typeof saveFileToCloudWorkspace === 'function') {
            saveFileToCloudWorkspace(proj, f.name, fileMime, fileB64);
          }
          if (el && typeof makeArtCard === 'function') {
            const ext = f.name.split('.').pop().toLowerCase();
            el.parentElement.appendChild(makeArtCard(f.name, ext, fileB64, f));
          }
        }
        if (typeof openArt === 'function') openArt(file, b64);
      }
      if(window.AppState)AppState._pendingFiles=[];document.getElementById('fileInp').value='';
    }else if(typeof directGeminiCallStreamMultiTurn==='function'){
      let apiText=text;
      if(text.toLowerCase().startsWith('/song ')){
        apiText=`You are a professional lyricist. Write a beautiful song about: "${text.substring(6).trim()}". Include Verse, Chorus and Bridge. Make it emotional and modern.`;
      }
      const hist=window.AppState?AppState._tabChatHistory.slice(0,-1).map(m=>({role:m.role==='nivi'?'model':'user',parts:[{text:m.text}]})):[];
      
      // Active project files — Nivi context ma aapvo
// Active project files — IndexedDB first, localStorage fallback
      let files = [];
      const _ctxProj = window._activeProjectId ||
                       document.getElementById('activeProjectSelect')?.value || 'default';
      if (_ctxProj !== 'default' && window.NiviDB) {
        try {
          files = await NiviDB.getProjectFiles(_ctxProj);
        } catch(e) {
          files = JSON.parse(localStorage.getItem('nivi_file_memory') || '[]');
        }
      } else {
        files = JSON.parse(localStorage.getItem('nivi_file_memory') || '[]');
      }
      let fileContext = '';
      if (files.length > 0) {
        const TEXT_MIMES = ['text/javascript','text/html','text/css','text/plain','application/json','text/csv'];
        const textFiles = files.filter(f => f.data && TEXT_MIMES.includes(f.mimeType));
        if (textFiles.length > 0) {
          const projLabel = _ctxProj !== 'default' ? `[Project: ${_ctxProj}] ` : '';
          fileContext = `\n\n---\n${projLabel}[Files in Nivi Memory]\n` +
            textFiles.slice(0, 5).map(f => {
              const content = decodeB64Text(f.data).slice(0, 2000);
              return `File: ${f.name}\n\`\`\`\n${content}\n\`\`\``;
            }).join('\n\n');
        }
      }
      const finalPrompt = fileContext ? apiText + fileContext : apiText;
      
      await directGeminiCallStreamMultiTurn(hist, finalPrompt, (chunk)=>{if(!window.AppState||!AppState._abortController)updateMsg(resId,chunk);});
    }
  }catch(err){
    if(!window.AppState||!AppState._abortController)updateMsg(resId,'⚠ Connection Error: '+err.message);
} finally {
    toggleGen(false);
    let chatTitle = "Current Session"; // ડિફોલ્ટ ટાઇટલ
    if(!window.AppState || !AppState._abortController) {
      if(window.AppState) {
      const el = document.getElementById(resId);
        let rawText = '';
        if (el && el.getAttribute('data-raw')) {
          rawText = el.getAttribute('data-raw').replace(/&#39;/g, "'").replace(/&quot;/g, '"');
        } else if (el) {
          rawText = el.innerText || '';
        }
        // rawText empty hoy to save na karo — streaming incomplete
        if (rawText.trim()) {
          AppState._tabChatHistory.push({ role: 'nivi', text: rawText });
          if (AppState._tabChatHistory.length === 2) {
            chatTitle = await generateChatTitle(AppState._tabChatHistory[0].text) || "Current Session";
            localStorage.setItem('nivi_current_title', chatTitle); 
          }
          localStorage.setItem('niviTabChat', JSON.stringify(AppState._tabChatHistory));
        }
      }
    }
// Firebase sync — project-aware
    const _activeProj = window._activeProjectId || document.getElementById('activeProjectSelect')?.value || 'default';
    if (_activeProj !== 'default') {
      if (typeof saveProjectChat === 'function') await saveProjectChat(_activeProj, AppState._tabChatHistory);
      if (typeof saveProjectChatLocal === 'function') saveProjectChatLocal(_activeProj, AppState._tabChatHistory);
    } else {
      if(typeof saveUserData === 'function') await saveUserData('history');
    }
    renderSidebarData();
  }
}
// ── SETTINGS MODAL ──
window.openSettings = function() {
  const c=document.getElementById('modelChainContainer');if(!c)return;
  c.innerHTML='';let chain=[];try{chain=JSON.parse(localStorage.getItem('nivi_model_chain')||'[]');}catch(e){}
  if(!chain.length)addModelRow({provider:'gemini',model:'',key:'',url:''});
  else chain.forEach(cfg=>addModelRow(cfg));
  document.getElementById('settingsModal').classList.add('open');
}
function _providerDefaults(provider) {
  const defs = {
    gemini:     { url: '',  modelHint: 'gemini-2.0-flash', keyLS: 'nivi_key_gemini',     urlLS: '' },
    openrouter: { url: 'https://openrouter.ai/api/v1/chat/completions',            modelHint: 'openai/gpt-4o-mini',              keyLS: 'nivi_key_openrouter', urlLS: 'nivi_url_openrouter' },
    nvidia:     { url: 'https://integrate.api.nvidia.com/v1/chat/completions',    modelHint: 'nvidia/llama-3.1-nemotron-70b-instruct', keyLS: 'nivi_key_nvidia', urlLS: 'nivi_url_nvidia' },
    custom:     { url: '',  modelHint: '',                       keyLS: '',                    urlLS: '' },
  };
  return defs[provider] || defs.custom;
}
function addModelRow(config={provider:'gemini',model:'',key:'',url:''}){
  const c=document.getElementById('modelChainContainer');if(!c)return;
  const def = _providerDefaults(config.provider);
  const resolvedKey   = config.key   || localStorage.getItem(def.keyLS) || '';
  const resolvedUrl   = config.url   || (def.urlLS ? localStorage.getItem(def.urlLS) : '') || def.url || '';
  const resolvedModel = config.model || localStorage.getItem(`nivi_model_${config.provider}`) || def.modelHint || '';
  const row=document.createElement('div');row.className='mrow';
  row.innerHTML=`
    <button class="mrow-rm" onclick="this.closest('.mrow').remove()">x</button>
    <div style="margin-bottom:10px;">
      <div style="font-family:var(--mono);font-size:9px;color:var(--text-muted);margin-bottom:5px;text-transform:uppercase;letter-spacing:.08em;">Provider</div>
      <div style="display:flex;gap:6px;">
        ${['gemini','openrouter','nvidia','custom'].map(p=>`
          <button onclick="switchProviderInRow(this,'${p}')"
            style="flex:1;padding:6px 4px;border-radius:6px;font-family:var(--mono);font-size:10px;cursor:pointer;transition:all .15s;border:1px solid ${config.provider===p?'var(--border-a)':'var(--border)'};background:${config.provider===p?'var(--accent-dim)':'transparent'};color:${config.provider===p?'var(--accent)':'var(--text-sub)'};"
            data-provider="${p}">
            ${{gemini:'Gemini',openrouter:'OpenRouter',nvidia:'Nvidia',custom:'Custom'}[p]}
          </button>`).join('')}
      </div>
      <input type="hidden" class="conf-provider" value="${config.provider}">
    </div>
    <div class="mrow-grid" style="margin-bottom:8px;">
      <div>
        <div style="font-family:var(--mono);font-size:9px;color:var(--text-muted);margin-bottom:4px;text-transform:uppercase;letter-spacing:.08em;">Model</div>
        <input type="text" class="conf-model fsel" placeholder="${def.modelHint||'model name'}" value="${resolvedModel}" style="width:100%;">
      </div>
      <div>
        <div style="font-family:var(--mono);font-size:9px;color:var(--text-muted);margin-bottom:4px;text-transform:uppercase;letter-spacing:.08em;">API Key</div>
        <input type="password" class="conf-key fsel" placeholder="Paste API key..." value="${resolvedKey}" style="width:100%;">
      </div>
    </div>
    <div id="urlRow_${Date.now()}" style="${config.provider==='gemini'?'display:none;':''}">
      <div style="font-family:var(--mono);font-size:9px;color:var(--text-muted);margin-bottom:4px;text-transform:uppercase;letter-spacing:.08em;">API URL <span style="opacity:.5;">(auto-filled, override if needed)</span></div>
      <input type="text" class="conf-url fsel" value="${resolvedUrl}" placeholder="https://..." style="width:100%;font-size:10px;color:var(--text-sub);">
    </div>
  `;
  c.appendChild(row);
}
function switchProviderInRow(btn, provider) {
  const row = btn.closest('.mrow');
  row.querySelector('.conf-provider').value = provider;
  row.querySelectorAll('[data-provider]').forEach(b => {
    const active = b.dataset.provider === provider;
    b.style.borderColor = active ? 'var(--border-a)' : 'var(--border)';
    b.style.background  = active ? 'var(--accent-dim)' : 'transparent';
    b.style.color       = active ? 'var(--accent)' : 'var(--text-sub)';
  });
  const def = _providerDefaults(provider);
  const keyField   = row.querySelector('.conf-key');
  const modelField = row.querySelector('.conf-model');
  const urlField   = row.querySelector('.conf-url');
  const urlRow     = row.querySelector('[id^="urlRow_"]');
  // Provider switch = fields ALWAYS clear & refill from localStorage
  keyField.value   = localStorage.getItem(def.keyLS) || '';
  modelField.value = localStorage.getItem(`nivi_model_${provider}`) || '';
  modelField.placeholder = def.modelHint || 'model name';
  if (urlField) {
    urlField.value = (def.urlLS ? localStorage.getItem(def.urlLS) : '') || def.url || '';
  }
  if (urlRow) urlRow.style.display = provider === 'gemini' ? 'none' : '';
}
function saveSettings(){
  const rows=document.querySelectorAll('.mrow'),chain=[];
  // Track which providers are PRESENT in current rows
  const presentProviders = new Set();
  rows.forEach(row=>{
    const provider = row.querySelector('.conf-provider').value;
    const model    = row.querySelector('.conf-model').value.trim();
    const key      = row.querySelector('.conf-key').value.trim();
    const url      = row.querySelector('.conf-url')?.value.trim() || '';
    presentProviders.add(provider);
    if(!model && !key) return;
    const def = _providerDefaults(provider);
    if(key    && def.keyLS) localStorage.setItem(def.keyLS, key);
    if(url    && def.urlLS) localStorage.setItem(def.urlLS, url);
    if(model) localStorage.setItem(`nivi_model_${provider}`, model);
    chain.push({provider, model, key, url});
  });
  // Deleted providers — localStorage clear karo
  ['gemini','openrouter','nvidia','custom'].forEach(p => {
    if(!presentProviders.has(p)){
      const def = _providerDefaults(p);
      if(def.keyLS)   localStorage.removeItem(def.keyLS);
      if(def.urlLS)   localStorage.removeItem(def.urlLS);
      localStorage.removeItem(`nivi_model_${p}`);
    }
  });
  localStorage.setItem('nivi_model_chain', JSON.stringify(chain));
  closeModal('settingsModal');
  updateActiveModelUI();
  renderSidebarData();
}
