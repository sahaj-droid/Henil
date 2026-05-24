      return escapeHTML(raw);
    };
    // ── LIVE CODE RUNNER: inject ▶ Run button into JS code blocks ──
    renderer.code = function(token) {
      const code = typeof token === 'string' ? token : (token.text || token.raw || '');
      const lang = (typeof token === 'object' ? (token.lang || '') : '').toLowerCase().trim();
      const escaped = escapeHTML(code);
      const isJS = lang === 'javascript' || lang === 'js';
      const isPY = lang === 'python' || lang === 'py';
      const runId = 'run-' + Math.random().toString(36).substr(2, 8);
      let runBtn = '';
      if (isJS) {
        runBtn = `<button class="code-run-btn" data-run-js-id="${runId}" title="Run JavaScript">Run JS</button>`;
      } else if (isPY) {
        runBtn = `<button class="code-run-btn" data-run-py-id="${runId}" title="Run Python (Pyodide)" style="color:#4ade80;">Run PY</button>`;
      }
      const langBadge = lang ? `<span class="code-lang">${lang}</span>` : '';
      const copyBtn   = `<button class="code-copy-btn" data-copy-id="${runId}" title="Copy code"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copy</button>`;
      return `<div class="code-block-wrap" id="${runId}-wrap"><div class="code-block-header">${langBadge}${copyBtn}${runBtn}</div><pre><code id="${runId}-src" class="language-${lang || 'plaintext'}">${escaped}</code></pre><div id="${runId}-out" class="code-output" style="display:none;"></div></div>`;
    };

    marked.setOptions({ breaks: true, renderer });
    const h = marked.parse(cleanText);
    const w = cleanText.trim().split(/\s+/).length;
    return sanitizeHTML(h) + `<div class="tbdg" style="margin-top:10px;">~${Math.ceil(w * 1.3)} tokens</div>`;
  }
  return escapeHTML(cleanText).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
}

// ── LIVE JS CODE RUNNER ──
window.runJSCode = function(runId) {
  const srcEl  = document.getElementById(runId + '-src');
  const outEl  = document.getElementById(runId + '-out');
  if (!srcEl || !outEl) return;
  const code   = srcEl.innerText || srcEl.textContent || '';
  outEl.style.display = 'block';
  outEl.innerHTML     = '<span style="opacity:.5;font-size:11px;">Running...</span>';

  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  document.body.appendChild(iframe);
  const logs = [];
  try {
    iframe.contentWindow.console = {
      log:   (...a) => logs.push(a.map(x => typeof x === 'object' ? JSON.stringify(x, null, 2) : String(x)).join(' ')),
      error: (...a) => logs.push('❌ ' + a.join(' ')),
      warn:  (...a) => logs.push('⚠️ ' + a.join(' ')),
      info:  (...a) => logs.push('ℹ️ ' + a.join(' ')),
    };
    iframe.contentWindow.eval(code);
    const output = logs.length ? logs.join('\n') : '✅ Ran (no output)';
    outEl.innerHTML = `<pre style="margin:0;white-space:pre-wrap;">${escapeHTML(output)}</pre>`;
  } catch(e) {
    const errStr = escapeHTML(e.toString());
    const encCode = encodeURIComponent(code);
    const encErr  = encodeURIComponent(e.toString());
    outEl.innerHTML = `
      <pre style="margin:0;color:var(--red);">❌ ${errStr}</pre>
      <button class="code-fix-btn" onclick="_codeAgentFix('${runId}','js',decodeURIComponent('${encCode}'),decodeURIComponent('${encErr}'))">
        🤖 Fix with AI
      </button>`;
  } finally {
    document.body.removeChild(iframe);
  }
};

// ── PYTHON RUNNER (Pyodide lazy-loaded) ──
window.runPYCode = async function(runId) {
  const srcEl = document.getElementById(runId + '-src');
  const outEl = document.getElementById(runId + '-out');
  if (!srcEl || !outEl) return;
  const code  = srcEl.innerText || srcEl.textContent || '';
  outEl.style.display = 'block';
  outEl.innerHTML = '<span style="opacity:.5;font-size:11px;">Loading Python runtime…</span>';
  try {
    if (!window._pyodide) {
      if (!document.getElementById('pyodide-script')) {
        await new Promise((res, rej) => {
          const s = document.createElement('script');
          s.id  = 'pyodide-script';
          s.src = 'https://cdn.jsdelivr.net/pyodide/v0.25.1/full/pyodide.js';
          s.onload = res; s.onerror = rej;
          document.head.appendChild(s);
        });
      }
      outEl.innerHTML = '<span style="opacity:.5;font-size:11px;">Initializing Pyodide...</span>';
      window._pyodide = await loadPyodide();
    }
    let out = '';
    window._pyodide.setStdout({ batched: (s) => { out += s + '\n'; } });
    window._pyodide.setStderr({ batched: (s) => { out += '❌ ' + s + '\n'; } });
    await window._pyodide.runPythonAsync(code);
    outEl.innerHTML = `<pre style="margin:0;white-space:pre-wrap;">${escapeHTML(out.trim() || '✅ Ran (no output)')}</pre>`;
  } catch(e) {
    const errStr = escapeHTML(String(e));
    const encCode = encodeURIComponent(code);
    const encErr  = encodeURIComponent(String(e));
    outEl.innerHTML = `
      <pre style="margin:0;color:var(--red);">❌ ${errStr}</pre>
      <button class="code-fix-btn" onclick="_codeAgentFix('${runId}','python',decodeURIComponent('${encCode}'),decodeURIComponent('${encErr}'))">
        🤖 Fix with AI
      </button>`;
  }
};

window.copyCode = function(runId) {
  const srcEl = document.getElementById(runId + '-src');
  if (srcEl) {
    const codeText = srcEl.innerText || srcEl.textContent || '';
    navigator.clipboard.writeText(codeText);

    const buttons = document.querySelectorAll(`[data-copy-id="${runId}"], button[onclick*="${runId}"]`);
    buttons.forEach(btn => {
      const origText = btn.innerHTML;
      if (origText.includes('svg')) {
        btn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4ade80" stroke-width="3" style="color:#4ade80;"><polyline points="20 6 9 17 4 12"></polyline></svg> Copied!`;
      } else {
        btn.innerHTML = '✓ Copied!';
      }
      setTimeout(() => { btn.innerHTML = origText; }, 1500);
    });
  }
};

// ── CODE BLOCK CLICK DELEGATION ──
document.addEventListener('click', function(e) {
  const copyBtn = e.target.closest('.code-copy-btn');
  if (copyBtn) {
    const runId = copyBtn.getAttribute('data-copy-id');
    if (runId) {
      e.preventDefault();
      window.copyCode(runId);
    }
  }
  const runJSBtn = e.target.closest('[data-run-js-id]');
  if (runJSBtn) {
    const runId = runJSBtn.getAttribute('data-run-js-id');
    if (runId) {
      e.preventDefault();
      window.runJSCode(runId);
    }
  }
  const runPYBtn = e.target.closest('[data-run-py-id]');
  if (runPYBtn) {
    const runId = runPYBtn.getAttribute('data-run-py-id');
    if (runId) {
      e.preventDefault();
      window.runPYCode(runId);
    }
  }
});
