/* ══════════════════════════════════════════════════
   UI EDITOR — Dynamic Appearance Control
   Saves to localStorage, applies instantly via CSS
══════════════════════════════════════════════════ */

const UI_DEFAULTS = {
  fontSize:      14.5,
  lineHeight:    1.6,
  msgSpacing:    8,
  codeFont:      12.5,
  chatWidth:     840,
  sidebarWidth:  268,
};

const UI_STORAGE_KEY = 'nivi_ui_prefs';

// ── Apply styles to document via a <style> tag ──
function _injectUIStyle(prefs) {
  let tag = document.getElementById('nivi-ui-override');
  if (!tag) {
    tag = document.createElement('style');
    tag.id = 'nivi-ui-override';
    document.head.appendChild(tag);
  }
  tag.textContent = `
    :root {
      --sw: ${prefs.sidebarWidth}px !important;
    }
    .bubble {
      font-size: ${prefs.fontSize}px !important;
      line-height: ${prefs.lineHeight} !important;
    }
    .msg-row {
      margin-bottom: ${prefs.msgSpacing}px !important;
    }
    code, .code-block-wrap pre code {
      font-size: ${prefs.codeFont}px !important;
    }
    .chat-inner {
      max-width: ${prefs.chatWidth}px !important;
    }
    .input-wrap {
      max-width: ${prefs.chatWidth}px !important;
    }
  `;
}

// ── Read current slider values ──
function _readSliders() {
  return {
    fontSize:     parseFloat(document.getElementById('uiSliderFontSize').value),
    lineHeight:   parseFloat(document.getElementById('uiSliderLineHeight').value),
    msgSpacing:   parseFloat(document.getElementById('uiSliderMsgSpacing').value),
    codeFont:     parseFloat(document.getElementById('uiSliderCodeFont').value),
    chatWidth:    parseFloat(document.getElementById('uiSliderChatWidth').value),
    sidebarWidth: parseFloat(document.getElementById('uiSliderSidebarWidth').value),
  };
}

// ── Sync label text next to each slider ──
function _updateLabels(prefs) {
  document.getElementById('uiLblFontSize').textContent    = prefs.fontSize + 'px';
  document.getElementById('uiLblLineHeight').textContent  = prefs.lineHeight;
  document.getElementById('uiLblMsgSpacing').textContent  = prefs.msgSpacing + 'px';
  document.getElementById('uiLblCodeFont').textContent    = prefs.codeFont + 'px';
  document.getElementById('uiLblChatWidth').textContent   = prefs.chatWidth + 'px';
  document.getElementById('uiLblSidebarWidth').textContent = prefs.sidebarWidth + 'px';
}

// ── Set slider positions from prefs object ──
function _applySliders(prefs) {
  document.getElementById('uiSliderFontSize').value     = prefs.fontSize;
  document.getElementById('uiSliderLineHeight').value   = prefs.lineHeight;
  document.getElementById('uiSliderMsgSpacing').value   = prefs.msgSpacing;
  document.getElementById('uiSliderCodeFont').value     = prefs.codeFont;
  document.getElementById('uiSliderChatWidth').value    = prefs.chatWidth;
  document.getElementById('uiSliderSidebarWidth').value = prefs.sidebarWidth;
}

// ── Called on every slider change ──
window.applyUI = function() {
  const prefs = _readSliders();
  _updateLabels(prefs);
  _injectUIStyle(prefs);
  localStorage.setItem(UI_STORAGE_KEY, JSON.stringify(prefs));
};

// ── Reset to defaults ──
window.resetUI = function() {
  localStorage.removeItem(UI_STORAGE_KEY);
  _applySliders(UI_DEFAULTS);
  _updateLabels(UI_DEFAULTS);
  _injectUIStyle(UI_DEFAULTS);
};

// ── Open / Close panel ──
window.openUIEditor = function() {
  document.getElementById('uiEditorPanel').classList.add('open');
  document.getElementById('uiEditorOverlay').classList.add('open');
};

window.closeUIEditor = function() {
  document.getElementById('uiEditorPanel').classList.remove('open');
  document.getElementById('uiEditorOverlay').classList.remove('open');
};

// ── On page load: restore saved prefs ──
(function initUIEditor() {
  let prefs = UI_DEFAULTS;
  try {
    const saved = localStorage.getItem(UI_STORAGE_KEY);
    if (saved) prefs = { ...UI_DEFAULTS, ...JSON.parse(saved) };
  } catch(e) {}

  _applySliders(prefs);
  _updateLabels(prefs);
  _injectUIStyle(prefs);
})();
