// ══════════════════════════════════════════════════════════
//  NC-VOICE — Voice Input (EN/HI/GU) + Translate Command
// ══════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════
//  🎤 VOICE INPUT — Hindi / Gujarati / English
//  Click mic → record in selected language
//  Click language badge → cycle language
// ══════════════════════════════════════════════════

const VOICE_LANGS = [
  { code: 'en-IN', label: 'EN', flag: '🇬🇧', name: 'English' },
  { code: 'hi-IN', label: 'HI', flag: '🇮🇳', name: 'हिंदी' },
  { code: 'gu-IN', label: 'GU', flag: '🏵️', name: 'ગુજરાતી' },
];
let _voiceLangIdx  = 0; // default English
let _voiceRecog    = null;
let _voiceActive   = false;

// Inject lang badge next to mic button (runs once after DOM ready)
function _initVoiceLangUI() {
  const micBtn = document.getElementById('micBtn');
  if (!micBtn || document.getElementById('voiceLangBadge')) return;
  const badge = document.createElement('button');
  badge.id        = 'voiceLangBadge';
  badge.className = 'voice-lang-badge';
  badge.title     = 'Switch voice language (EN → HI → GU)';
  badge.onclick   = (e) => { e.stopPropagation(); _cycleVoiceLang(); };
  _updateLangBadge(badge);
  micBtn.parentNode.insertBefore(badge, micBtn.nextSibling);
}
document.addEventListener('DOMContentLoaded', _initVoiceLangUI);
setTimeout(_initVoiceLangUI, 800); // fallback

function _updateLangBadge(badge) {
  badge = badge || document.getElementById('voiceLangBadge');
  if (!badge) return;
  const lang = VOICE_LANGS[_voiceLangIdx];
  badge.textContent = lang.flag + ' ' + lang.label;
  badge.title = `Voice: ${lang.name} — click to switch`;
}

window._cycleVoiceLang = function() {
  if (_voiceActive) _stopVoice(); // stop if recording
  _voiceLangIdx = (_voiceLangIdx + 1) % VOICE_LANGS.length;
  _updateLangBadge();
  const lang = VOICE_LANGS[_voiceLangIdx];
  // Brief toast
  const t = document.createElement('div');
  t.className   = 'voice-lang-toast';
  t.textContent = `🎤 ${lang.flag} ${lang.name}`;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 1800);
};

window.toggleVoiceInput = function() {
  if (_voiceActive) { _stopVoice(); return; }
  _initVoiceLangUI();
  _startVoice();
};

function _startVoice() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    alert('Voice input not supported. Use Chrome or Edge.');
    return;
  }

  const langObj = VOICE_LANGS[_voiceLangIdx];
  _voiceRecog = new SR();
  _voiceRecog.continuous      = true;
  _voiceRecog.interimResults  = true;
  _voiceRecog.lang            = langObj.code;
  _voiceRecog.maxAlternatives = 1;

  const inp    = document.getElementById('mainInput');
  const micBtn = document.getElementById('micBtn');
  const badge  = document.getElementById('voiceLangBadge');
  const baseVal = inp.value;

  _voiceRecog.onstart = () => {
    _voiceActive = true;
    micBtn.classList.add('mic-active');
    micBtn.title = `Recording in ${langObj.name}… (click to stop)`;
    if (badge) badge.classList.add('lang-badge-active');
  };

  _voiceRecog.onresult = (e) => {
    let interim = '', final = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const t = e.results[i][0].transcript;
      if (e.results[i].isFinal) final += t;
      else interim += t;
    }
    inp.value = baseVal + (baseVal ? ' ' : '') + (final || interim);
    inp.style.height = 'auto';
    inp.style.height = Math.min(inp.scrollHeight, 170) + 'px';
  };

  _voiceRecog.onerror = (e) => {
    console.warn('[Voice] error:', e.error);
    if (e.error === 'language-not-supported') {
      alert(`Language "${langObj.name}" not supported. Switching to English.`);
      _voiceLangIdx = 0; _updateLangBadge();
    }
    _stopVoice();
  };

  _voiceRecog.onend = () => _stopVoice();
  _voiceRecog.start();
}

function _stopVoice() {
  _voiceActive = false;
  const micBtn = document.getElementById('micBtn');
  const badge  = document.getElementById('voiceLangBadge');
  if (micBtn) { micBtn.classList.remove('mic-active'); micBtn.title = 'Voice Input'; }
  if (badge)  badge.classList.remove('lang-badge-active');
  if (_voiceRecog) { try { _voiceRecog.stop(); } catch(e) {} _voiceRecog = null; }
}

// ══════════════════════════════════════════════════
//  🌐 TRANSLATE COMMAND
//  Usage: /translate to Gujarati: Hello world
//         /translate Spanish: What is AI?
// ══════════════════════════════════════════════════
async function _handleTranslate(raw, inp) {
  let lang = 'English', textToTrans = raw;
  const m = raw.match(/^(?:to\s+)?([\w\s]+?):\s*(.+)$/is);
  if (m) { lang = m[1].trim(); textToTrans = m[2].trim(); }

  const displayText = `/translate ${raw}`;
  appendMsg('user', displayText);
  if (window.AppState) {
    AppState._tabChatHistory.push({ role: 'user', text: displayText });
    localStorage.setItem('niviTabChat', JSON.stringify(AppState._tabChatHistory));
  }
  inp.value = ''; inp.style.height = 'auto';
  toggleGen(true);
  if (window.AppState) AppState._abortController = new AbortController();

  const resId = 'nivi-' + Date.now();
  appendMsg('nivi', `<div class="thinking"><span></span><span></span><span></span></div>`, resId);

  try {
    const prompt = `Translate the following text to ${lang}.\nReturn ONLY the translated text, no explanations.\n\nText: ${textToTrans}`;
    if (typeof directGeminiCallStreamMultiTurn === 'function') {
      await directGeminiCallStreamMultiTurn([], prompt, (chunk) => {
        if (!AppState?._abortController?.signal.aborted) updateMsg(resId, chunk);
      });
    } else {
      updateMsg(resId, `❌ Translation requires Gemini API key. Add it in ⚙️ Settings.`);
    }
  } catch(e) {
    updateMsg(resId, `❌ Translation failed: ${e.message}`);
  } finally {
    toggleGen(false);
    if (window.AppState) AppState._abortController = null;
    const el = document.getElementById(resId);
    const translated = el ? (el.getAttribute('data-raw') || el.innerText || '') : '';
    if (translated.trim() && window.AppState) {
      AppState._tabChatHistory.push({ role: 'nivi', text: translated });
      localStorage.setItem('niviTabChat', JSON.stringify(AppState._tabChatHistory));
    }
  }
}

// ══════════════════════════════════════════════════
//  🔊 VOICE OUTPUT (Text to Speech)
// ══════════════════════════════════════════════════
let _currentUtterance = null;
window.playVoiceMsg = function(msgId) {
  const el = document.getElementById(msgId);
  if (!el) {
    console.error("Voice output error: Message element not found");
    return;
  }
  const btn = document.getElementById('play-' + msgId);
  
  if (_currentUtterance && window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel();
    _currentUtterance = null;
    if (btn) btn.innerHTML = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>`;
    return;
  }
  
  let text = el.getAttribute('data-raw') || el.innerText || '';
  // basic cleanup for TTS
  text = text.replace(/[*_#~]/g, '').replace(/```[\s\S]*?```/g, 'Code block').replace(/`[^`]+`/g, 'Code snippet');
  if (!text.trim()) return;
  
  const langObj = VOICE_LANGS[_voiceLangIdx] || VOICE_LANGS[0];
  _currentUtterance = new SpeechSynthesisUtterance(text);
  _currentUtterance.lang = langObj.code;
  
  // Robust voice selection
  const voices = window.speechSynthesis.getVoices();
  if (voices.length > 0) {
    // Try to find exact match, then language match, then fallback to first available
    const voice = voices.find(v => v.lang === langObj.code) || 
                  voices.find(v => v.lang.startsWith(langObj.code.split('-')[0])) || 
                  voices[0];
    if (voice) {
      _currentUtterance.voice = voice;
    }
  }
  
  if (btn) {
    btn.innerHTML = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`;
  }
  
  _currentUtterance.onend = () => {
    _currentUtterance = null;
    if (btn) btn.innerHTML = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>`;
  };

  _currentUtterance.onerror = (e) => {
    console.warn("TTS Error: ", e);
    _currentUtterance = null;
    if (btn) btn.innerHTML = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>`;
    // Fallback if voice failed (e.g. Gujarati not installed on Windows)
    if (e.error === 'language-unavailable' || e.error === 'synthesis-failed') {
      alert(`Voice playback failed. Your device might not support the "${langObj.name}" voice. Please switch to English.`);
    }
  };
  
  window.speechSynthesis.speak(_currentUtterance);
};
