// ======================================
// 🧠 NIVI CORE LOGIC & FORMATTING
// ======================================
window.NIVI_FORCE_MODE = null;

// ગ્લોબલ AppState ડિકલેર કરો 
window.AppState = {
  _tabChatHistory: [],
  _pendingFile: null,
  wl: [],
  cache: {}
};

// ======================================
// ✨ FORMAT NIVI RESPONSE (FIXED SYNTAX)
// ======================================
function _formatNiviResponse(text) {
  if (!text) return '';
  let html = text;

  // ૧. ક્યારેક AI ખાલી લાઈનમાં એકલો '*' આપી દે છે, તેને હટાવવા:
  html = html.replace(/^\s*[\*\-]\s*$/gm, '');
  
  // ૨. Bold (**text**) ને Inline (span) બનાવ્યું
  html = html.replace(/\*\*(.+?)\*\*/g, '<span style="font-weight:700;color:var(--accent,#4285f4);letter-spacing:0.3px;">$1</span>');
  
  // ૩. Numbered list: "1. " or "1) "
  html = html.replace(/^(\d+)[.)]\s+(.+)$/gm, '<div style="display:flex;gap:6px;margin-top:6px;margin-bottom:6px;"><span style="color:#4285f4;font-weight:700;font-size:11px;flex-shrink:0;">$1.</span><span style="font-size:14px;color:var(--text-primary,#e3e3e3);line-height:1.6;">$2</span></div>');
  
  // ૪. Bullet points: "- " or "* " or "• " 
  html = html.replace(/^\s*[•\-\*]\s+(.+)$/gm, '<div style="display:flex;gap:6px;margin-top:4px;margin-bottom:4px;"><span style="color:var(--accent,#4285f4);flex-shrink:0;font-size:10px;margin-top:3px;">●</span><span style="font-size:14px;color:var(--text-primary,#e3e3e3);line-height:1.6;">$1</span></div>');
  
  // ૫. વધારાની ખાલી જગ્યાઓ ક્લિયર કરવા
  html = html.replace(/\n{3,}/g, '\n\n'); 
  html = html.replace(/\n\n/g, '<div style="margin-top:8px;"></div>');
  html = html.replace(/\n/g, '<br>');
  
  return html; // ✅ અહી હવે કોઈ એરર નહિ આવે
}

console.log('✅ nivi.js loaded cleanly without syntax errors.');
