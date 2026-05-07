// ═══════════════════════════════════════════════════
//  ARTIFACT ENGINE (artifact.js)
// ═══════════════════════════════════════════════════
const ART={cur:null,tab:'code',isMob:()=>window.innerWidth<=768};
function artEscapeHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));
}
function artDecodeB64Text(b64) {
  try {
    const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    return new TextDecoder('utf-8').decode(bytes);
  } catch(e) {
    try { return atob(b64); } catch(_) { return ''; }
  }
}
function artEncodeB64Text(text) {
  const bytes = new TextEncoder().encode(text);
  let bin = '';
  bytes.forEach(b => bin += String.fromCharCode(b));
  return btoa(bin);
}

const FT_CFG={
  html:{badge:'HTML',cls:'b-html',icon:'HTML',canPrev:true,hl:'html'},
  js:  {badge:'JS',  cls:'b-js',  icon:'JS',canPrev:false,hl:'javascript'},
  css: {badge:'CSS', cls:'b-css', icon:'CSS',canPrev:false,hl:'css'},
  json:{badge:'JSON',cls:'b-json',icon:'{}',canPrev:false,hl:'json'},
  py:  {badge:'PY',  cls:'b-py',  icon:'PY',canPrev:false,hl:'python'},
  txt: {badge:'TXT', cls:'b-txt', icon:'FILE',canPrev:false,hl:'plaintext'},
  md:  {badge:'MD',  cls:'b-txt', icon:'MD',canPrev:false,hl:'markdown'},
  csv: {badge:'CSV', cls:'b-txt', icon:'CSV',canPrev:false,hl:'csv'},
  png: {badge:'IMG', cls:'b-img', icon:'IMG',canPrev:true, isImg:true},
  jpg: {badge:'IMG', cls:'b-img', icon:'IMG',canPrev:true, isImg:true},
  jpeg:{badge:'IMG', cls:'b-img', icon:'IMG',canPrev:true, isImg:true},
  webp:{badge:'IMG', cls:'b-img', icon:'IMG',canPrev:true, isImg:true},
  gif: {badge:'GIF', cls:'b-img', icon:'GIF',canPrev:true, isImg:true},
  pdf: {badge:'PDF', cls:'b-pdf', icon:'PDF',canPrev:true, isPdf:true},
};
function ftCfg(ext){return FT_CFG[ext]||{badge:ext.toUpperCase(),cls:'b-txt',icon:'📄',canPrev:false,hl:'plaintext'};}

function openArt(file,b64){
  const ext=file.name.split('.').pop().toLowerCase();
  const cfg=ftCfg(ext);
  if(ART.cur?.objUrl)URL.revokeObjectURL(ART.cur.objUrl);
  let objUrl=null;
  if(cfg.isImg||cfg.isPdf){
    const mime=cfg.isImg?file.type:'application/pdf';
    const ba=Uint8Array.from(atob(b64),c=>c.charCodeAt(0));
    const blob=new Blob([ba],{type:mime});
    objUrl=URL.createObjectURL(blob);
  }
  let txt=null;
  if(!cfg.isImg&&!cfg.isPdf){txt=artDecodeB64Text(b64);}
  ART.cur={name:file.name,ext,b64,mime:file.type,objUrl,cfg,txt};
  if(ART.isMob())_openSheet();else _openPanel();
}

function _openPanel(){
  const{name,ext,txt,objUrl,cfg}=ART.cur;
  document.getElementById('artBadge').innerHTML=`<span class="ftbdg ${cfg.cls}">${cfg.badge}</span>`;
  document.getElementById('artTitle').textContent=name;
  document.getElementById('tabPreview').style.display=cfg.canPrev?'flex':'none';
  document.getElementById('openTabBtn').style.display=ext==='html'?'flex':'none';
  if(txt){const l=txt.split('\n').length,c=txt.length;document.getElementById('artMeta').textContent=`${l} lines · ${(c/1024).toFixed(1)}kb`;}
  else document.getElementById('artMeta').textContent='';
  switchTab(cfg.isImg||cfg.isPdf?'preview':'code');
  document.getElementById('artPanel').classList.add('open');
}

function switchTab(t){
  ART.tab=t;
  if(!ART.cur)return;
  const{ext,txt,objUrl,cfg}=ART.cur;
  document.getElementById('tabCode').classList.toggle('active',t==='code');
  document.getElementById('tabPreview').classList.toggle('active',t==='preview');
  ['viewCode','viewPreview','viewImg','viewPdf'].forEach(id=>document.getElementById(id).style.display='none');
  if(t==='code'&&txt!==null){
    document.getElementById('viewCode').style.display='flex';
    const el=document.getElementById('codeEl');
    el.textContent=txt;el.className=`language-${cfg.hl||'plaintext'}`;
    if(typeof hljs!=='undefined')hljs.highlightElement(el);
  }else if(t==='preview'){
    if(cfg.isImg){document.getElementById('viewImg').style.display='flex';document.getElementById('imgEl').src=objUrl;}
    else if(cfg.isPdf){document.getElementById('viewPdf').style.display='flex';document.getElementById('pdfEl').setAttribute('src',objUrl);}
    else if(ext==='html'){document.getElementById('viewPreview').style.display='flex';document.getElementById('previewIframe').srcdoc=txt;}
  }
}

function closeArt(){document.getElementById('artPanel').classList.remove('open');}

function _openSheet(){
  const{name,cfg}=ART.cur;
  document.getElementById('shBadge').innerHTML=`<span class="ftbdg ${cfg.cls}">${cfg.badge}</span>`;
  document.getElementById('shTitle').textContent=name;
  document.getElementById('shTabPreview').style.display=cfg.canPrev?'flex':'none';
  _renderSheet('code');
  document.getElementById('artOverlay').classList.add('open');
  document.getElementById('artSheet').classList.add('open');
}

function _renderSheet(t){
  const{ext,txt,objUrl,cfg}=ART.cur;
  const c=document.getElementById('shContent');c.innerHTML='';
  document.getElementById('shTabCode').classList.toggle('active',t==='code');
  document.getElementById('shTabPreview').classList.toggle('active',t==='preview');
  if(t==='code'&&txt!==null){
    const pre=document.createElement('pre');
    pre.style.cssText='margin:0;border-radius:0;border:none;min-height:200px;font-size:12px;line-height:1.6;';
    const code=document.createElement('code');
    code.className=`language-${cfg.hl||'plaintext'}`;code.textContent=txt;
    pre.appendChild(code);c.appendChild(pre);
    if(typeof hljs!=='undefined')hljs.highlightElement(code);
  }else if(t==='preview'){
    if(cfg.isImg){const w=document.createElement('div');w.style.cssText='display:flex;align-items:center;justify-content:center;padding:16px;background:#111;min-height:200px;';const img=document.createElement('img');img.src=objUrl;img.style.cssText='max-width:100%;border-radius:8px;';w.appendChild(img);c.appendChild(w);}
    else if(cfg.isPdf){const em=document.createElement('embed');em.src=objUrl;em.type='application/pdf';em.style.cssText='width:100%;height:60vh;border:none;';c.appendChild(em);}
    else if(ext==='html'){const ifr=document.createElement('iframe');ifr.style.cssText='width:100%;height:60vh;border:none;background:#fff;';ifr.setAttribute('sandbox','allow-scripts allow-same-origin');ifr.srcdoc=txt;c.appendChild(ifr);}
  }
}

function switchSheetTab(t){_renderSheet(t);}
function closeSheet(){document.getElementById('artOverlay').classList.remove('open');document.getElementById('artSheet').classList.remove('open');}

function copyArt(){
  if(!ART.cur)return;
  const t=ART.cur.txt||'';
  navigator.clipboard.writeText(t).then(()=>{
    const b=document.getElementById('copyArtBtn');
    if(b){const o=b.innerHTML;b.textContent='Copied';setTimeout(()=>b.innerHTML=o,2000);}
  });
}

function dlArt(){
  if(!ART.cur)return;
  const{name,objUrl,txt,mime}=ART.cur;
  const url=objUrl||URL.createObjectURL(new Blob([txt],{type:mime||'text/plain'}));
  const a=document.createElement('a');a.href=url;a.download=name;a.click();
  if(!objUrl)URL.revokeObjectURL(url);
}

function openArtTab(){
  if(!ART.cur?.txt)return;
  const blob=new Blob([ART.cur.txt],{type:'text/html'});
  window.open(URL.createObjectURL(blob),'_blank');
}

function makeArtCard(name,ext,b64,fileMeta){
  const cfg=ftCfg(ext);
  const card=document.createElement('div');
  card.className='art-card';
  const icon=document.createElement('div');
  icon.className='art-card-icon';
  icon.textContent=cfg.icon;
  const info=document.createElement('div');
  info.className='art-card-info';
  const title=document.createElement('div');
  title.className='art-card-name';
  title.textContent=name;
  const meta=document.createElement('div');
  meta.className='art-card-meta';
  meta.innerHTML=`<span class="ftbdg ${cfg.cls}" style="font-size:9px;padding:1px 5px;">${cfg.badge}</span> · Click to view`;
  info.appendChild(title); info.appendChild(meta);
  const arrow=document.createElement('span');
  arrow.style.cssText='color:var(--text-muted);flex-shrink:0;font-size:18px;line-height:1;';
  arrow.textContent='>';
  card.appendChild(icon); card.appendChild(info); card.appendChild(arrow);
  card.onclick=()=>openArt(fileMeta,b64);
  return card;
}

// ── કોડ બ્લોકમાં બટન ઉમેરવાનું સહિયારું ફંક્શન ──
function addArtifactButtons(el) {
  el.querySelectorAll('pre').forEach((pre, idx) => {
    const codeEl = pre.querySelector('code');
    if(codeEl && typeof hljs!=='undefined') hljs.highlightElement(codeEl);
    if(!pre.querySelector('.run-art-btn') && codeEl){
      const langMatch = codeEl.className.match(/language-(\w+)/);
      let ext = langMatch ? langMatch[1] : 'txt';
      if(ext==='javascript') ext='js'; if(ext==='python') ext='py';
      const btn = document.createElement('button');
      btn.className = 'tbtn prim run-art-btn';
      btn.textContent = 'Run / View';
      btn.onclick = () => {
        const codeTxt = codeEl.innerText;
        const b64 = artEncodeB64Text(codeTxt);
        openArt({name: `Nivi_Code_${idx+1}.${ext}`, type: 'text/plain'}, b64);
      };
      pre.appendChild(btn);
    }
  });
}
// ── MANUAL ARTIFACT (Fix Code) ──
window.openManualArt = function() {
    const code = prompt("Paste your code for review / Fix / Optimize:");
    if (code && code.trim() !== "") {
    const b64 = artEncodeB64Text(code);
    openArt({ name: 'manual_fix.js', type: 'text/plain' }, b64);
    // setTimeout(() => { artAction('fix'); }, 500);
    }
}
// ── PROMPT-TO-ACTION SHORTCUTS (MAGIC MASK FIX) ──
async function artAction(action) {
  if (!ART.cur || !ART.cur.txt) return;
  const code = ART.cur.txt;
  const lang = ART.cur.cfg.hl || 'code';
  let apiPrompt = "";
  if(action === 'explain') {
    apiPrompt = `Please explain this ${lang} code.\n<nivi-hidden>\nPlease explain how this code works step-by-step in Gujarati:\n\n\`\`\`${lang}\n${code}\n\`\`\`\n</nivi-hidden>`;
  } else if(action === 'fix') {
    apiPrompt = `Please find and fix bugs in this ${lang} code.\n<nivi-hidden>\nPlease review this code for any bugs or errors, and provide the fixed version:\n\n\`\`\`${lang}\n${code}\n\`\`\`\n</nivi-hidden>`;
  } else if(action === 'optimize') {
    apiPrompt = `Please optimize this ${lang} code.\n<nivi-hidden>\nPlease optimize this code for better performance and readability:\n\n\`\`\`${lang}\n${code}\n\`\`\`\n</nivi-hidden>`;
  }
  closeArt();
  closeSheet();

  appendMsg('user', apiPrompt);
  if(window.AppState) {
    AppState._tabChatHistory.push({role:'user', text: apiPrompt});
    localStorage.setItem('niviTabChat', JSON.stringify(AppState._tabChatHistory));
  }
  setTimeout(() => {
    const wrap = document.getElementById('chatWrap');
    if(wrap) wrap.scrollTop = wrap.scrollHeight;
  }, 50);

  // ૪. API કોલ ચાલુ કરો
  toggleGen(true);
  if(window.AppState) AppState._abortController = false;
  const resId = 'nivi-' + Date.now();
  appendMsg('nivi', `<div class="thinking"><span></span><span></span><span></span></div>`, resId);
  try {
    const hist = window.AppState ? AppState._tabChatHistory.slice(0,-1).map(m=>({role:m.role==='nivi'?'model':'user', parts:[{text:m.text}]})) : [];
    if(typeof directGeminiCallStreamMultiTurn === 'function') {
      await directGeminiCallStreamMultiTurn(hist, apiPrompt, (chunk) => {
        if(!window.AppState || !AppState._abortController) updateMsg(resId, chunk);
      });
    }
  } catch(err) {
    if(!window.AppState || !AppState._abortController) updateMsg(resId, 'Error: ' + err.message);
  } finally {
    toggleGen(false);
    if(!window.AppState || !AppState._abortController) {
      if(window.AppState) {
        const el = document.getElementById(resId);
        let rawText = el?.getAttribute('data-raw')?.replace(/&#39;/g, "'").replace(/&quot;/g, '"') || el?.innerText || '';
        AppState._tabChatHistory.push({role:'nivi', text: rawText});
        localStorage.setItem('niviTabChat', JSON.stringify(AppState._tabChatHistory));
      }
    }
    if(typeof saveUserData === 'function') saveUserData('history');
    renderSidebarData();
  }
}
// ── CODEMIRROR EDITOR ──
let _cmInstance = null;

function toggleArtEdit() {
  if (!ART.cur || !ART.cur.txt) return;
  const viewCode = document.getElementById('viewCode');
  const viewEditor = document.getElementById('viewEditor');
  const editBtn = document.getElementById('editArtBtn');
  const saveBtn = document.getElementById('saveArtBtn');

  // Editor open karo
  viewCode.style.display = 'none';
  viewEditor.style.display = 'flex';
  editBtn.style.display = 'none';
  saveBtn.style.display = 'flex';

  // CodeMirror mode detect karo
  const modeMap = {
    js: 'javascript', html: 'htmlmixed',
    css: 'css', py: 'python', json: 'javascript'
  };
  const mode = modeMap[ART.cur.ext] || 'plaintext';

  // CodeMirror init
  if (_cmInstance) _cmInstance.toTextArea();
  _cmInstance = CodeMirror.fromTextArea(document.getElementById('cmEditor'), {
    value: ART.cur.txt,
    mode: mode,
    theme: 'dracula',
    lineNumbers: true,
    lineWrapping: true,
    indentUnit: 2,
    tabSize: 2,
    autofocus: true
  });
  _cmInstance.setValue(ART.cur.txt);
  _cmInstance.refresh();
}

function saveArtEdit() {
  if (!_cmInstance || !ART.cur) return;
  const newCode = _cmInstance.getValue();

  // ART.cur update karo
  ART.cur.txt = newCode;
  const b64 = artEncodeB64Text(newCode);
  ART.cur.b64 = b64;

  // Firebase ma save karo
  const proj = document.getElementById('activeProjectSelect')?.value || 'default';
  if (proj !== 'default' && typeof saveFileToCloudWorkspace === 'function') {
    saveFileToCloudWorkspace(proj, ART.cur.name, ART.cur.mime || 'text/plain', b64);
  }

  // localStorage memory update
  if (typeof saveFileToMemory === 'function') {
    saveFileToMemory(ART.cur.name, b64, ART.cur.mime || 'text/plain');
  }

  // Editor band karo — code view ma dikhaao
  const viewCode = document.getElementById('viewCode');
  const viewEditor = document.getElementById('viewEditor');
  const editBtn = document.getElementById('editArtBtn');
  const saveBtn = document.getElementById('saveArtBtn');

  viewEditor.style.display = 'none';
  viewCode.style.display = 'flex';
  editBtn.style.display = 'flex';
  saveBtn.style.display = 'none';

  // Highlight updated code
  const el = document.getElementById('codeEl');
  el.textContent = newCode;
  el.className = `language-${ART.cur.cfg.hl || 'plaintext'}`;
  if (typeof hljs !== 'undefined') hljs.highlightElement(el);

  // Success feedback
  const sb = document.getElementById('saveArtBtn');
  if (sb) { sb.textContent = 'Saved'; setTimeout(() => { sb.innerHTML = '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>Save'; }, 2000); }
}

// ── CLOSE ART — editor pan reset karo ──
const _origCloseArt = closeArt;
closeArt = function() {
  if (_cmInstance) { _cmInstance.toTextArea(); _cmInstance = null; }
  const editBtn = document.getElementById('editArtBtn');
  const saveBtn = document.getElementById('saveArtBtn');
  const viewCode = document.getElementById('viewCode');
  const viewEditor = document.getElementById('viewEditor');
  if (editBtn) editBtn.style.display = 'flex';
  if (saveBtn) saveBtn.style.display = 'none';
  if (viewCode) viewCode.style.display = 'flex';
  if (viewEditor) viewEditor.style.display = 'none';
  _origCloseArt();
};
