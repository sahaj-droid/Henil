// ═══════════════════════════════════════════════════
//  ARTIFACT ENGINE (artifact.js)
// ═══════════════════════════════════════════════════
const ART={cur:null,tab:'code',isMob:()=>window.innerWidth<600};

// ── Inject CM viewer styles once ──
(function(){
  if(document.getElementById('artCmStyles'))return;
  const s=document.createElement('style');
  s.id='artCmStyles';
  s.textContent=`
    #viewCode { flex-direction:column;overflow:auto; }
    #viewCode .cm-viewer-pre { margin:0;padding:0;border:none!important;border-radius:0!important;background:#282a36;min-height:100%;width:100%; }
    #viewCode .cm-line-table { border-collapse:collapse;width:100%;table-layout:fixed; }
    #viewCode .cm-line-cell { padding:0 0 0 12px;white-space:pre;line-height:1.6;font-family:'JetBrains Mono',monospace;font-size:12px;word-break:break-all; user-select: text; -webkit-user-select: text; }
    #viewCode .cm-line-table tr:hover { background:rgba(255,255,255,.03); }
    #viewCode mark.art-search-mark { border-radius:2px;padding:0 1px; }
    #artTabBar::-webkit-scrollbar { height:3px; }
    #artTabBar::-webkit-scrollbar-thumb { background:rgba(255,255,255,.08);border-radius:10px; }
    #artSearchBar input::placeholder { color:var(--text-muted); }
    #artSearchBar button:hover { background:var(--bg-hover)!important;color:var(--text)!important; }
    #viewEditor .CodeMirror,
    #viewEditor .CodeMirror-scroll { user-select: text; -webkit-user-select: text;}
    /* CodeMirror ના કસ્ટમ સિલેક્શન લેયર (div) માટે હાઇલાઇટ કલર */
    #viewEditor div.CodeMirror-selected { background: rgba(135, 175, 255, 0.4) !important; z-index: 1 !important;}
    /* જો બ્રાઉઝર કોઈ રીતે નેટિવ સિલેક્શન ટ્રિગર કરે તો એના માટેના સેફ્ટી રૂલ્સ */
    #viewEditor .CodeMirror-line::selection,
    #viewEditor .CodeMirror-line > span::selection,
    #viewEditor .CodeMirror-line > span > span::selection { background: rgba(135, 175, 255, 0.4) !important; color: inherit !important;}
    #viewEditor .CodeMirror-line::-moz-selection,
    #viewEditor .CodeMirror-line > span::-moz-selection,
    #viewEditor .CodeMirror-line > span > span::-moz-selection { background: rgba(135, 175, 255, 0.4) !important; color: inherit !important;}
    #viewEditor .CodeMirror { height: 100% !important; flex: 1 !important; font-family: 'JetBrains Mono', monospace !important;}
    /* આને artCmStyles ની અંદર છેલ્લે ઉમેરો */
    .CodeMirror-activeline-background,
    .CodeMirror-activeline .CodeMirror-line {background: rgba(255, 255, 255, 0.08) !important;}
    .CodeMirror-foldgutter { width: .7em;}
    .CodeMirror-foldgutter-open, .CodeMirror-foldgutter-folded { cursor: pointer; color: #6272a4;}
    `;
    document.head.appendChild(s);
})();
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
  _tabAdd(ART.cur);
  _openPanelRender();
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
    // Use CodeMirror if available, fallback to hljs
    if(typeof CodeMirror!=='undefined'){
      _initCmViewer(txt, ext);
    } else {
      document.getElementById('viewCode').innerHTML='<pre style="margin:0;border-radius:0;border:none;min-height:100%;font-size:12px;line-height:1.6;"><code id="codeEl"></code></pre>';
      const el=document.getElementById('codeEl');
      el.textContent=txt; el.className=`language-${cfg.hl||'plaintext'}`;
      if(typeof hljs!=='undefined')hljs.highlightElement(el);
    }
  }else if(t==='preview'){
    _destroyCmViewer();
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

// ── કોડ બ્લોકમાં બટન ઉમેરવાનું સહિયારું ફંક્શન (UPDATED: Copy + View) ──
function addArtifactButtons(el) {
  el.querySelectorAll('pre').forEach((pre, idx) => {
    const codeEl = pre.querySelector('code');
    if(codeEl && typeof hljs !== 'undefined') hljs.highlightElement(codeEl);
    
    // જો બટન્સ પહેલાથી ના હોય તો જ ઉમેરો
    if(!pre.querySelector('.code-actions') && codeEl) {
      const langMatch = codeEl.className.match(/language-(\w+)/);
      let ext = langMatch ? langMatch[1] : 'txt';
      if(ext === 'javascript') ext = 'js'; if(ext === 'python') ext = 'py';
      
      // એક્શન બટન્સ માટે કન્ટેનર બનાવો
      const actionDiv = document.createElement('div');
      actionDiv.className = 'code-actions';

      // 1. COPY BUTTON (Primary)
      const copyBtn = document.createElement('button');
      copyBtn.className = 'tbtn copy-code-btn';
      copyBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copy';
      copyBtn.onclick = () => {
        // innerText ની જગ્યાએ textContent વાપરવું બેસ્ટ છે (ફોર્મેટિંગ બગડે નહિ)
        navigator.clipboard.writeText(codeEl.textContent).then(() => {
          const origHTML = copyBtn.innerHTML;
          copyBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> Copied';
          copyBtn.style.color = 'var(--green)';
          copyBtn.style.borderColor = 'rgba(52,211,153,.4)';
          setTimeout(() => {
            copyBtn.innerHTML = origHTML;
            copyBtn.style.color = '';
            copyBtn.style.borderColor = '';
          }, 2000);
        });
      };
      actionDiv.appendChild(copyBtn);

      // 2. ARTIFACT VIEW BUTTON (Secondary)
      const runBtn = document.createElement('button');
      runBtn.className = 'tbtn prim run-art-btn';
      runBtn.innerHTML = 'Artifact ↗';
      runBtn.title = 'Open in Artifact Panel';
      runBtn.onclick = () => {
        const codeTxt = codeEl.textContent;
        const b64 = artEncodeB64Text(codeTxt);
        openArt({name: `Nivi_Code_${idx+1}.${ext}`, type: 'text/plain'}, b64);
      };
      actionDiv.appendChild(runBtn);

      pre.appendChild(actionDiv);
    }
  });
}
// ── MANUAL ARTIFACT — Custom Modal ──
let _manLang = 'js';
window.setManLang = function(lang) {
  _manLang = lang;
  ['js','html','py','css','txt'].forEach(l => {
    const btn = document.getElementById('manArtLang' + l.charAt(0).toUpperCase() + l.slice(1));
    if (btn) btn.style.borderColor = '';
  });
  const activeBtn = document.getElementById('manArtLang' + lang.charAt(0).toUpperCase() + lang.slice(1));
  if (activeBtn) activeBtn.style.borderColor = 'var(--accent)';
};

window.openManualArt = function() {
  const ta = document.getElementById('manualArtInput');
  if (ta) ta.value = '';
  _manLang = 'js';
  ['js','html','py','css','txt'].forEach(l => {
    const btn = document.getElementById('manArtLang' + l.charAt(0).toUpperCase() + l.slice(1));
    if (btn) btn.style.borderColor = l === 'js' ? 'rgba(251,191,36,.4)' : '';
  });
  document.getElementById('manualArtModal').classList.add('open');
  setTimeout(() => ta && ta.focus(), 150);
};

window.submitManualArt = function() {
  const code = document.getElementById('manualArtInput')?.value?.trim();
  if (!code) return;
  closeModal('manualArtModal');
  const b64 = artEncodeB64Text(code);
  const nameMap = { js:'manual_fix.js', html:'manual_fix.html', py:'manual_fix.py', css:'manual_fix.css', txt:'manual_fix.txt' };
  const mimeMap = { js:'text/javascript', html:'text/html', py:'text/plain', css:'text/css', txt:'text/plain' };
  openArt({ name: nameMap[_manLang] || 'manual_fix.js', type: mimeMap[_manLang] || 'text/plain' }, b64);
};
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
  if(window.AppState) AppState._abortController = new AbortController();
  const resId = 'nivi-' + Date.now();
  appendMsg('nivi', `<div class="thinking"><span></span><span></span><span></span></div>`, resId);
  try {
    const hist = window.AppState ? AppState._tabChatHistory.slice(0,-1).map(m=>({role:m.role==='nivi'?'model':'user', parts:[{text:m.text}]})) : [];
    if(typeof directGeminiCallStreamMultiTurn === 'function') {
      await directGeminiCallStreamMultiTurn(hist, apiPrompt, (chunk) => {
        if(!AppState?._abortController?.signal.aborted) updateMsg(resId, chunk);
      });
    }
  } catch(err) {
    if(!AppState?._abortController?.signal.aborted) updateMsg(resId, 'Error: ' + err.message);
  } finally {
    toggleGen(false);
    const _wasAborted = AppState?._abortController?.signal.aborted;
    if(window.AppState) AppState._abortController = null;
    if(!_wasAborted) {
      if(window.AppState) {
       // Use dataset or innerText only as last resort — prefer structured data
          const bubble = document.getElementById(resId);
          let rawText = '';
          if (bubble) {
            const attr = bubble.getAttribute('data-raw');
            if (attr) {
              rawText = attr.replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
            } else {
              rawText = bubble.innerText || '';
            }
          }
        AppState._tabChatHistory.push({role:'nivi', text: rawText});
        localStorage.setItem('niviTabChat', JSON.stringify(AppState._tabChatHistory));

        // Auto-save corrected code to IDB — extract code block from response
        if (ART.cur?.name && rawText && typeof saveFileToMemory === 'function') {
          const codeMatch = rawText.match(/```(?:\w+)?\n([\s\S]*?)```/);
          if (codeMatch && codeMatch[1]) {
            const correctedCode = codeMatch[1].trim();
            const b64 = artEncodeB64Text(correctedCode);
            saveFileToMemory(ART.cur.name, b64, ART.cur.mime || 'text/plain');
            // Update ART.cur so panel shows latest
            ART.cur.txt = correctedCode;
            ART.cur.b64 = b64;
          }
        }
      }
    }
    if(typeof saveUserData === 'function') saveUserData('history');
    renderSidebarData();
  }
}
// ═══════════════════════════════════════════════════
//  IDE VIEWER — CodeMirror read-only with line numbers
// ═══════════════════════════════════════════════════

// Single CM viewer instance — destroyed before each new file
// ═══════════════════════════════════════════════════
//  IDE VIEWER — hljs with line numbers (read-only, fully selectable)
//  CM is only used for edit mode (_cmInstance)
// ═══════════════════════════════════════════════════

let _cmViewer = null; // kept as null — no read-only CM viewer

const CM_MODE_MAP = {
  js: 'javascript', html: 'htmlmixed',
  css: 'css', py: 'python', json: 'javascript',
  md: 'markdown', txt: 'plaintext', csv: 'plaintext'
};

function _destroyCmViewer() {
  // No CM viewer instance to destroy — placeholder kept for compatibility
  _cmViewer = null;
}

function _initCmViewer(txt, ext) {
  _destroyCmViewer();
  const wrap = document.getElementById('viewCode');
  const cfg = ART.cur?.cfg || {};
  const hl = cfg.hl || 'plaintext';

  // Build line-numbered table
  const lines = txt.split('\n');
  const totalLines = lines.length;
  const padLen = String(totalLines).length;

  // Syntax highlight the whole block first
  let highlighted = txt;
  if (typeof hljs !== 'undefined') {
    try {
      const lang = hljs.getLanguage(hl) ? hl : 'plaintext';
      highlighted = hljs.highlight(txt, { language: lang, ignoreIllegals: true }).value;
    } catch(e) {
      highlighted = txt.replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
    }
  } else {
    highlighted = txt.replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
  }

  // Split highlighted HTML by newlines carefully
  const hlLines = highlighted.split('\n');

  let tableHTML = '<table class="cm-line-table" style="border-collapse:collapse;width:100%;table-layout:fixed;">';
  hlLines.forEach((line, i) => {
    const lineNum = i + 1;
    tableHTML += `<tr>
      <td class="cm-gutter" style="width:${padLen*8+16}px;min-width:${padLen*8+16}px;text-align:right;padding:0 10px 0 6px;color:#4a4a6a;font-size:11px;font-family:'JetBrains Mono',monospace;user-select:none;-webkit-user-select:none;border-right:1px solid rgba(255,255,255,.07);background:#1e1f2a;vertical-align:top;line-height:1.6;">${lineNum}</td>
      <td class="cm-line-cell" style="padding:0 0 0 12px;white-space:pre;line-height:1.6;font-family:'JetBrains Mono',monospace;font-size:12px;">${line || ' '}</td>
    </tr>`;
  });
  tableHTML += '</table>';

  wrap.innerHTML = `<pre class="cm-viewer-pre" style="margin:0;padding:0;border:none;border-radius:0;background:#282a36;overflow:auto;min-height:100%;width:100%;"><code class="hljs language-${hl}" style="padding:0;background:transparent;font-size:12px;">${tableHTML}</code></pre>`;

  // Store for search
  _cmViewer = { _txt: txt, _wrap: wrap, _searchPositions: null, _searchQuery: null };
}

// ═══════════════════════════════════════════════════
//  FILE TABS
// ═══════════════════════════════════════════════════
// Tab store: [{name, ext, b64, mime, objUrl, cfg, txt}]
const ART_TABS = { list: [], active: -1 };

function _tabsRender() {
  let bar = document.getElementById('artTabBar');
  if (!bar) {
    // Inject tab bar above artTabs (code/preview tab row)
    bar = document.createElement('div');
    bar.id = 'artTabBar';
    bar.style.cssText = 'display:flex;align-items:center;overflow-x:auto;background:var(--bg);border-bottom:1px solid var(--border);padding:0 4px;flex-shrink:0;min-height:36px;scrollbar-width:none;';
    const artHdr = document.getElementById('artTabs');
    artHdr.parentNode.insertBefore(bar, artHdr);
  }
  bar.innerHTML = '';
  ART_TABS.list.forEach((t, i) => {
    const tab = document.createElement('div');
    const isActive = i === ART_TABS.active;
    tab.style.cssText = `display:flex;align-items:center;gap:6px;padding:5px 10px;cursor:pointer;font-family:var(--mono);font-size:11px;white-space:nowrap;flex-shrink:0;border-bottom:2px solid ${isActive ? 'var(--accent)' : 'transparent'};color:${isActive ? 'var(--accent-text)' : 'var(--text-sub)'};background:${isActive ? 'var(--accent-dim)' : 'transparent'};transition:all .15s;`;
    const cfg = t.cfg;
    tab.innerHTML = `<span class="ftbdg ${cfg.cls}" style="font-size:9px;padding:1px 5px;">${cfg.badge}</span><span>${t.name}</span><span data-tabclose="${i}" style="opacity:.5;font-size:13px;line-height:1;padding:0 2px;border-radius:3px;margin-left:2px;" onmouseover="this.style.opacity=1;this.style.background='rgba(255,255,255,.08)'" onmouseout="this.style.opacity=.5;this.style.background='transparent'">×</span>`;
    tab.addEventListener('click', (e) => {
      if (e.target.dataset.tabclose !== undefined) {
        _tabClose(parseInt(e.target.dataset.tabclose));
      } else {
        _tabSwitch(i);
      }
    });
    bar.appendChild(tab);
  });
  // Show/hide tab bar
  bar.style.display = ART_TABS.list.length > 0 ? 'flex' : 'none';
}

function _tabAdd(fileObj) {
  // Avoid duplicates — but update content if same file re-opened
  const existing = ART_TABS.list.findIndex(t => t.name === fileObj.name);
  if (existing !== -1) {
    ART_TABS.list[existing] = { ...fileObj }; // update with latest content
    ART_TABS.active = existing;
    _tabsRender();
    return;
  }
  ART_TABS.list.push({ ...fileObj });
  ART_TABS.active = ART_TABS.list.length - 1;
  _tabsRender();
}

function _tabSwitch(i) {
  if (i < 0 || i >= ART_TABS.list.length) return;
  ART_TABS.active = i;
  const t = ART_TABS.list[i];
  ART.cur = t;
  _tabsRender();
  _openPanelRender();
}

function _tabClose(i) {
  ART_TABS.list.splice(i, 1);
  if (ART_TABS.list.length === 0) {
    ART_TABS.active = -1;
    _tabsRender();
    // Call full closeArt to clean up CM, search, panel
    closeArt();
    return;
  }
  // Switch to previous or first
  ART_TABS.active = Math.max(0, i - 1);
  ART.cur = ART_TABS.list[ART_TABS.active];
  _tabsRender();
  _openPanelRender();
}

// ═══════════════════════════════════════════════════
//  SEARCH UI
// ═══════════════════════════════════════════════════
let _artSearchActive = false;
let _artSearchLastQuery = '';

function _artSearchInject() {
  if (document.getElementById('artSearchBar')) return;
  const bar = document.createElement('div');
  bar.id = 'artSearchBar';
  bar.style.cssText = 'display:none;align-items:center;gap:8px;padding:6px 10px;background:var(--bg-panel);border-bottom:1px solid var(--border-a);flex-shrink:0;';
  bar.innerHTML = `
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--accent-text)" stroke-width="2" style="flex-shrink:0;"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
    <input id="artSearchInput" placeholder="Search in file…" style="flex:1;background:transparent;border:none;outline:none;color:var(--text);font-family:var(--mono);font-size:12px;min-width:0;" autocomplete="off" spellcheck="false">
    <span id="artSearchCount" style="font-family:var(--mono);font-size:10px;color:var(--text-muted);flex-shrink:0;"></span>
    <button id="artSearchPrev" title="Previous (Shift+Enter)" style="background:transparent;border:1px solid var(--border);color:var(--text-sub);border-radius:5px;padding:3px 7px;cursor:pointer;font-size:11px;">▲</button>
    <button id="artSearchNext" title="Next (Enter)" style="background:transparent;border:1px solid var(--border);color:var(--text-sub);border-radius:5px;padding:3px 7px;cursor:pointer;font-size:11px;">▼</button>
    <button id="artSearchClose" title="Close (Esc)" style="background:transparent;border:none;color:var(--text-sub);cursor:pointer;font-size:16px;line-height:1;padding:0 4px;">×</button>
  `;
  // Insert after artTabBar (or before artTabs if no tab bar yet)
  const ref = document.getElementById('artTabs');
  ref.parentNode.insertBefore(bar, ref);

  // Wire events
  const inp = document.getElementById('artSearchInput');
  inp.addEventListener('input', () => _artSearchRun(inp.value, 0));
  inp.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); e.shiftKey ? _artSearchStep(-1) : _artSearchStep(1); }
    if (e.key === 'Escape') { e.preventDefault(); _artSearchClose(); }
  });
  document.getElementById('artSearchClose').addEventListener('click', _artSearchClose);
  document.getElementById('artSearchNext').addEventListener('click', () => _artSearchStep(1));
  document.getElementById('artSearchPrev').addEventListener('click', () => _artSearchStep(-1));
}

let _artSearchCursor = null;
let _artSearchMatches = [];
let _artSearchMatchIdx = 0;

function _artSearchOpen() {
  _artSearchInject();
  const bar = document.getElementById('artSearchBar');
  bar.style.display = 'flex';
  _artSearchActive = true;
  const inp = document.getElementById('artSearchInput');
  inp.focus();
  inp.select();
  if (_artSearchLastQuery) _artSearchRun(_artSearchLastQuery, 0);
}

function _artSearchClose() {
  const bar = document.getElementById('artSearchBar');
  if (bar) bar.style.display = 'none';
  _artSearchActive = false;
  _artSearchClearMarks();
  if (document.getElementById('artSearchCount')) document.getElementById('artSearchCount').textContent = '';
}

function _artSearchClearMarks() {
  const wrap = document.getElementById('viewCode');
  if (!wrap) return;
  // Re-render all marked lines back to clean state
  if (!ART.cur?.txt) return;
  const txt = ART.cur.txt;
  const cfg = ART.cur.cfg || {};
  const hl = cfg.hl || 'plaintext';
  const lines = txt.split('\n');
  const lineCells = wrap.querySelectorAll('.cm-line-cell');
  lineCells.forEach((cell, i) => {
    if (cell.querySelector('mark.art-search-mark')) {
      // Re-highlight just this line
      cell.innerHTML = _hlLine(lines[i] || '', hl);
    }
  });
  _artSearchMatches = [];
}

function _hlLine(lineText, lang) {
  if (!lineText) return ' ';
  if (typeof hljs === 'undefined') {
    return lineText.replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
  }
  try {
    // highlight single line — wrap in context to avoid partial token issues
    return hljs.highlight(lineText, { language: hljs.getLanguage(lang) ? lang : 'plaintext', ignoreIllegals: true }).value || '&nbsp;';
  } catch(e) {
    return lineText.replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
  }
}

function _artSearchRun(query, startIdx) {
  _artSearchClearMarks();
  if (!query || !ART.cur?.txt) {
    if (document.getElementById('artSearchCount')) document.getElementById('artSearchCount').textContent = '';
    return;
  }
  _artSearchLastQuery = query;
  _artSearchMatchIdx = startIdx || 0;

  const txt = ART.cur.txt;
  const cfg = ART.cur.cfg || {};
  const hl = cfg.hl || 'plaintext';
  const lines = txt.split('\n');
  const q = query.toLowerCase();

  // Find ALL matches: {lineIdx, colStart, colEnd}
  const allMatches = [];
  lines.forEach((line, lineIdx) => {
    let col = 0;
    const lower = line.toLowerCase();
    while (true) {
      const idx = lower.indexOf(q, col);
      if (idx === -1) break;
      allMatches.push({ lineIdx, colStart: idx, colEnd: idx + query.length });
      col = idx + 1;
    }
  });

  if (allMatches.length === 0) {
    if (document.getElementById('artSearchCount')) document.getElementById('artSearchCount').textContent = 'No results';
    return;
  }

  // Clamp index
  _artSearchMatchIdx = ((_artSearchMatchIdx % allMatches.length) + allMatches.length) % allMatches.length;

  // Group matches by line, render each affected line with <mark>s
  const byLine = {};
  allMatches.forEach((m, globalIdx) => {
    if (!byLine[m.lineIdx]) byLine[m.lineIdx] = [];
    byLine[m.lineIdx].push({ ...m, globalIdx });
  });

  const lineCells = document.querySelectorAll('#viewCode .cm-line-cell');

  Object.entries(byLine).forEach(([lineIdxStr, matches]) => {
    const lineIdx = parseInt(lineIdxStr);
    const cell = lineCells[lineIdx];
    if (!cell) return;
    const rawLine = lines[lineIdx] || '';

    // Build marked HTML by inserting <mark> into RAW text, then escaping + re-highlighting per segment
    // Approach: split raw line at match boundaries, escape each segment, wrap matches
    const boundaries = [];
    matches.forEach(m => { boundaries.push({ pos: m.colStart, open: true, active: m.globalIdx === _artSearchMatchIdx });
                           boundaries.push({ pos: m.colEnd,   open: false }); });
    boundaries.sort((a, b) => a.pos - b.pos || (a.open ? -1 : 1));

    let result = '';
    let cur = 0;
    let depth = 0;
    let isActive = false;
    boundaries.forEach(b => {
      if (b.pos > cur) {
        const seg = rawLine.slice(cur, b.pos).replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
        result += seg;
      }
      cur = b.pos;
      if (b.open) {
        depth++;
        isActive = b.active;
        const bg = b.active ? 'rgba(109,40,217,.8)' : 'rgba(109,40,217,.35)';
        const col = b.active ? '#fff' : 'inherit';
        result += `<mark class="art-search-mark" style="background:${bg};color:${col};border-radius:2px;padding:0 1px;">`;
      } else {
        depth--;
        result += '</mark>';
      }
    });
    if (cur < rawLine.length) {
      result += rawLine.slice(cur).replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
    }
    cell.innerHTML = result || '&nbsp;';
  });

  // Scroll active match into view
  const activeMatch = allMatches[_artSearchMatchIdx];
  if (activeMatch) {
    const cell = lineCells[activeMatch.lineIdx];
    if (cell) {
      const mark = cell.querySelector('mark.art-search-mark[style*="rgba(109,40,217,.8)"]');
      (mark || cell).scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }

  const countEl = document.getElementById('artSearchCount');
  if (countEl) countEl.textContent = `${_artSearchMatchIdx + 1}/${allMatches.length}`;

  // Store for step nav
  _cmViewer = _cmViewer || {};
  _cmViewer._allMatches = allMatches;
  _cmViewer._searchQuery = query;
  _cmViewer._searchPositions = allMatches; // compat
}

function _highlightInCell() {} // no-op — kept for compat

function _artSearchStep(dir) {
  const matches = _cmViewer?._allMatches;
  if (!matches?.length) return;
  const query = _cmViewer._searchQuery || _artSearchLastQuery;
  _artSearchMatchIdx = (_artSearchMatchIdx + dir + matches.length) % matches.length;
  _artSearchRun(query, _artSearchMatchIdx);
  const inp = document.getElementById('artSearchInput');
  if (inp) inp.value = query;
}

// ═══════════════════════════════════════════════════
//  SEARCH BUTTON — inject into art-toolbar
// ═══════════════════════════════════════════════════
function _injectSearchBtn() {
  if (document.getElementById('artSearchBtn')) return;
  const toolbar = document.querySelector('.art-toolbar');
  if (!toolbar) return;
  const btn = document.createElement('button');
  btn.id = 'artSearchBtn';
  btn.className = 'tbtn';
  btn.title = 'Search in file (Ctrl+F)';
  btn.innerHTML = `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>Search`;
  btn.onclick = _artSearchOpen;
  // Insert at beginning of toolbar before first button
  toolbar.insertBefore(btn, toolbar.firstChild);
  // Separator after it
  const sep = document.createElement('span');
  sep.style.cssText = 'width:1px;height:14px;background:var(--border);margin:0 2px;';
  toolbar.insertBefore(sep, btn.nextSibling);
}

// ═══════════════════════════════════════════════════
//  CTRL+F global intercept when panel is open
// ═══════════════════════════════════════════════════
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
    const panel = document.getElementById('artPanel');
    if (panel && panel.classList.contains('open')) {
      e.preventDefault();
      _artSearchOpen();
    }
  }
}, true);

// ═══════════════════════════════════════════════════
//  PANEL RENDER — extracted so tabs can reuse it
// ═══════════════════════════════════════════════════
function _openPanelRender() {
  const { name, ext, txt, objUrl, cfg } = ART.cur;
  document.getElementById('artBadge').innerHTML = `<span class="ftbdg ${cfg.cls}">${cfg.badge}</span>`;
  document.getElementById('artTitle').textContent = name;
  document.getElementById('tabPreview').style.display = cfg.canPrev ? 'flex' : 'none';
  document.getElementById('openTabBtn').style.display = ext === 'html' ? 'flex' : 'none';
  if (txt) {
    const l = txt.split('\n').length, c = txt.length;
    document.getElementById('artMeta').textContent = `${l} lines · ${(c / 1024).toFixed(1)}kb`;
  } else document.getElementById('artMeta').textContent = '';
  switchTab(cfg.isImg || cfg.isPdf ? 'preview' : 'code');
  document.getElementById('artPanel').classList.add('open');
  _injectSearchBtn();
  _artSearchClose(); // reset search on file switch
}

// ── CODEMIRROR EDITOR ──
let _cmInstance = null;

function toggleArtEdit() {
    if (!ART.cur || !ART.cur.txt) return;
    const viewCode = document.getElementById('viewCode');
    const viewEditor = document.getElementById('viewEditor');
    const editBtn = document.getElementById('editArtBtn');
    const saveBtn = document.getElementById('saveArtBtn');

    viewCode.style.display = 'none';
    viewEditor.style.display = 'flex';
    editBtn.style.display = 'none';
    saveBtn.style.display = 'flex';

    const modeMap = {js: 'javascript', html: 'htmlmixed', css: 'css', py: 'python', json: 'javascript' };
    const mode = modeMap[ART.cur.ext] || 'plaintext';

    if (_cmInstance) _cmInstance.toTextArea();
    // --- આ સેટિંગ્સ અપડેટ કર્યા છે ---
    _cmInstance = CodeMirror.fromTextArea(document.getElementById('cmEditor'), {
        value: ART.cur.txt,
        mode: mode,
        theme: 'dracula',
        lineNumbers: true,
        lineWrapping: true,
        indentUnit: 2,
        tabSize: 2,
        autofocus: true,
        styleActiveLine: true, // આ લાઈન હાઈલાઈટ કરશે
        foldGutter: true,      // આ ફોલ્ડિંગ એરો બતાવશે
        gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"] // બંને વસ્તુઓ બતાવવા માટે
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
    if (typeof CodeMirror !== 'undefined' && document.querySelector('.cm-line-table')) {
    // જો કસ્ટમ ટેબલ વ્યુઅર એક્ટિવ હોય તો તેને રિફ્રેશ કરો
    _initCmViewer(newCode, ART.cur.ext);
    } else {
    // જો સાદો વ્યુઅર એક્ટિવ હોય તો તેને અપડેટ કરો
    const el = document.getElementById('codeEl');
    if (el) { el.textContent = newCode;
        el.className = `language-${ART.cur.cfg.hl || 'plaintext'}`;
        if (typeof hljs !== 'undefined') hljs.highlightElement(el);
    }
}

  // Success feedback
  const sb = document.getElementById('saveArtBtn');
  if (sb) { sb.textContent = 'Saved'; setTimeout(() => { sb.innerHTML = '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>Save'; }, 2000); }
}

// ── CLOSE ART — editor pan reset karo ──
const _origCloseArt = closeArt;
closeArt = function() {
  _destroyCmViewer();
  _artSearchClose();
  // Reset tab bar
  ART_TABS.list = []; ART_TABS.active = -1;
  const bar = document.getElementById('artTabBar');
  if (bar) bar.style.display = 'none';
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

// ═══════════════════════════════════════════════════
//  PATCH ENGINE — Apply Nivi FILE/FIND/REPLACE diffs
// ═══════════════════════════════════════════════════

// ── Parse all patch blocks from chat history ──
function _parsePatchBlocks() {
  const history = window.AppState?._tabChatHistory || [];
  const patches = [];

  // Collect all nivi messages
  const niviMsgs = history.filter(m => m.role === 'nivi');

  for (const msg of niviMsgs) {
    const text = msg.text || '';
    // Match FILE / FIND / REPLACE blocks — flexible spacing/newlines
    const blockRe = /FILE:\s*([^\n]+)\s*\n(?:LINE:[^\n]*\n)?FIND:\s*\n?```(?:\w+)?\n([\s\S]*?)```\s*\nREPLACE:\s*\n?```(?:\w+)?\n([\s\S]*?)```/gi;
    let match;
    while ((match = blockRe.exec(text)) !== null) {
      const file = match[1].trim().replace(/\s*\(.*?\)/, ''); // remove "(approximate)" notes
      const find = match[2];
      const replace = match[3];
      if (file && find !== undefined && replace !== undefined) {
        patches.push({ file, find, replace });
      }
    }
  }
  return patches;
}

// ── Apply patches to file content ──
function _applyPatches(originalContent, patches, targetFilename) {
  let content = originalContent;
  const results = [];

  // Filter patches relevant to this file
  const relevant = patches.filter(p => {
    const pFile = p.file.toLowerCase().trim();
    const tFile = targetFilename.toLowerCase().trim();
    return tFile.endsWith(pFile) || pFile.endsWith(tFile) || pFile === tFile;
  });

  if (relevant.length === 0) {
    return { content, results: [{ ok: false, msg: `No patches found for "${targetFilename}" in chat history.` }] };
  }

for (const patch of relevant) {

  const normalize = t => (t || '')
    .replace(/\r\n/g, '\n')
    .trim();

  const findText = patch.find;

  const normalizedContent = normalize(content);
  const normalizedFind = normalize(findText);

  if (normalizedContent.includes(normalizedFind)) {

    content = content.split(findText).join(patch.replace);

    results.push({
      ok: true,
      msg: `✅ Applied: ${findText.trim().slice(0, 60)}...`
    });

  } else {

    // Fallback trimmed match
    const findTrimmed = findText.trim();

    if (content.includes(findTrimmed)) {

      content = content.split(findTrimmed).join(
        patch.replace.trim()
      );

      results.push({
        ok: true,
        msg: `✅ Applied (trimmed): ${findTrimmed.slice(0, 60)}...`
      });

    } else {

      results.push({
        ok: false,
        msg: `❌ Not found: ${findText.trim().slice(0, 60)}...`
      });

    }
  }
}
  return { content, results };
}

// ── Show patch result toast ──
function _showPatchToast(results, filename) {
  const ok = results.filter(r => r.ok).length;
  const fail = results.filter(r => !r.ok).length;
  const msg = `Patch "${filename}": ${ok} applied${fail > 0 ? `, ${fail} not found` : ' ✅'}`;

  // Simple toast
  const toast = document.createElement('div');
  toast.style.cssText = `position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:${fail>0?'#7c3aed':'#1D9E75'};color:#fff;padding:8px 16px;border-radius:8px;font-size:12px;font-family:var(--mono);z-index:9999;pointer-events:none;`;
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

// ── Trigger file picker ──
window.triggerPatchUpload = function() {
  const history = window.AppState?._tabChatHistory || [];
  if (history.length === 0) {
    _showPatchToast([{ ok: false, msg: 'Chat history empty. Ask Nivi to fix your code first!' }], '');
    return;
  }
  const patches = _parsePatchBlocks();
  if (patches.length === 0) {
    // Show toast instead of blocking alert
    _showPatchToast([{ ok: false, msg: 'No FILE/FIND/REPLACE patch blocks in chat. Ask Nivi using patch format.' }], '');
    return;
  }
  document.getElementById('patchFileInp').click();
};

// ── Main: read file → apply patches → open in artifact ──
window.applyPatchFromFile = async function(input) {
  if (!input.files || !input.files[0]) return;
  const file = input.files[0];
  input.value = ''; // reset so same file can be re-selected

  try {
    // Read file as text
    const originalContent = await new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result);
      r.onerror = () => rej(new Error('File read failed'));
      r.readAsText(file, 'utf-8');
    });

    // Parse patches from chat
    const patches = _parsePatchBlocks();

    // Apply
    const { content: patchedContent, results } = _applyPatches(originalContent, patches, file.name);

    // Show result toast
    _showPatchToast(results, file.name);

    // Open patched file in artifact panel
    const b64 = artEncodeB64Text(patchedContent);
    const patchedFile = { name: file.name, type: file.type || 'text/plain' };
    openArt(patchedFile, b64);

    // Auto-save to IDB
    if (typeof saveFileToMemory === 'function') {
      saveFileToMemory(file.name, b64, file.type || 'text/plain');
    }

  } catch(e) {
    alert('Patch failed: ' + e.message);
  }
};
