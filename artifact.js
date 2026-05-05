// ═══════════════════════════════════════════════════
//  ARTIFACT ENGINE (artifact.js)
// ═══════════════════════════════════════════════════
const ART={cur:null,tab:'code',isMob:()=>window.innerWidth<=768};

const FT_CFG={
  html:{badge:'HTML',cls:'b-html',icon:'🌐',canPrev:true,hl:'html'},
  js:  {badge:'JS',  cls:'b-js',  icon:'⚡',canPrev:false,hl:'javascript'},
  css: {badge:'CSS', cls:'b-css', icon:'🎨',canPrev:false,hl:'css'},
  json:{badge:'JSON',cls:'b-json',icon:'{}',canPrev:false,hl:'json'},
  py:  {badge:'PY',  cls:'b-py',  icon:'🐍',canPrev:false,hl:'python'},
  txt: {badge:'TXT', cls:'b-txt', icon:'📄',canPrev:false,hl:'plaintext'},
  md:  {badge:'MD',  cls:'b-txt', icon:'📝',canPrev:false,hl:'markdown'},
  csv: {badge:'CSV', cls:'b-txt', icon:'📊',canPrev:false,hl:'csv'},
  png: {badge:'IMG', cls:'b-img', icon:'🖼',canPrev:true, isImg:true},
  jpg: {badge:'IMG', cls:'b-img', icon:'🖼',canPrev:true, isImg:true},
  jpeg:{badge:'IMG', cls:'b-img', icon:'🖼',canPrev:true, isImg:true},
  webp:{badge:'IMG', cls:'b-img', icon:'🖼',canPrev:true, isImg:true},
  gif: {badge:'GIF', cls:'b-img', icon:'🎞',canPrev:true, isImg:true},
  pdf: {badge:'PDF', cls:'b-pdf', icon:'📕',canPrev:true, isPdf:true},
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
  if(!cfg.isImg&&!cfg.isPdf){try{txt=atob(b64);}catch(e){txt='';}}
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
    if(b){const o=b.innerHTML;b.textContent='✓ Copied!';setTimeout(()=>b.innerHTML=o,2000);}
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
  card.innerHTML=`<div class="art-card-icon">${cfg.icon}</div><div class="art-card-info"><div class="art-card-name">${name}</div><div class="art-card-meta"><span class="ftbdg ${cfg.cls}" style="font-size:9px;padding:1px 5px;">${cfg.badge}</span> · Click to view</div></div><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--text-muted);flex-shrink:0;"><polyline points="9 18 15 12 9 6"/></svg>`;
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
      btn.innerHTML = '⚡ Run / View';
      btn.onclick = () => {
        const codeTxt = codeEl.innerText;
        const b64 = btoa(unescape(encodeURIComponent(codeTxt)));
        openArt({name: `Nivi_Code_${idx+1}.${ext}`, type: 'text/plain'}, b64);
      };
      pre.appendChild(btn);
    }
  });
}

// ── PROMPT-TO-ACTION SHORTCUTS (MAGIC MASK FIX) ──
async function artAction(action) {
  if (!ART.cur || !ART.cur.txt) return;
  const code = ART.cur.txt;
  const lang = ART.cur.cfg.hl || 'code';
  let apiPrompt = "";
  if(action === 'explain') {
    apiPrompt = `💡 Please explain this ${lang} code.\n<nivi-hidden>\nPlease explain how this code works step-by-step in Gujarati:\n\n\`\`\`${lang}\n${code}\n\`\`\`\n</nivi-hidden>`;
  } else if(action === 'fix') {
    apiPrompt = `🐛 Please find and fix bugs in this ${lang} code.\n<nivi-hidden>\nPlease review this code for any bugs or errors, and provide the fixed version:\n\n\`\`\`${lang}\n${code}\n\`\`\`\n</nivi-hidden>`;
  } else if(action === 'optimize') {
    apiPrompt = `⚡ Please optimize this ${lang} code.\n<nivi-hidden>\nPlease optimize this code for better performance and readability:\n\n\`\`\`${lang}\n${code}\n\`\`\`\n</nivi-hidden>`;
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
    if(!window.AppState || !AppState._abortController) updateMsg(resId, '⚠ Error: ' + err.message);
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
