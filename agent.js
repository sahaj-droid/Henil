// ══════════════════════════════════════════════════════════
//  NIVI — TASK MANAGER (agent.js)
//  Background task queue + floating status panel
//  Multi-session: run parallel tasks while chatting
// ══════════════════════════════════════════════════════════

window.TaskManager = (() => {
  // ── Task State Machine ──
  // pending → running → done | failed | cancelled

  let _tasks     = [];   // { id, title, status, createdAt, finishedAt, result, error }
  let _listeners = [];

  function _genId() {
    return 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
  }

  function _notify() {
    _listeners.forEach(fn => { try { fn([..._tasks]); } catch(e) {} });
    _renderPanel();
  }

  // ══════════════════════════
  //  PUBLIC API
  // ══════════════════════════

  /**
   * Add and run a task in the background.
   * @param {string} title  - Human-readable task name shown in the panel
   * @param {Function} fn   - async function(taskCtx) to execute.
   *                          taskCtx: { setStatus(msg), signal: AbortSignal, id }
   * @param {object} opts   - { autoOpen: bool, metadata: any }
   * @returns {string} taskId
   */
  function addTask(title, fn, opts = {}) {
    const id  = _genId();
    const ctrl = new AbortController();
    const task = {
      id,
      title: title || 'Task',
      status:    'pending',
      statusMsg: 'Queued…',
      createdAt: Date.now(),
      finishedAt: null,
      result:    null,
      error:     null,
      _ctrl:     ctrl,
      metadata:  opts.metadata || null,
    };
    _tasks.unshift(task);
    _notify();
    _showPanel();

    // Execute async, non-blocking
    (async () => {
      task.status    = 'running';
      task.statusMsg = 'Running…';
      _notify();
      const ctx = {
        id,
        signal: ctrl.signal,
        setStatus: (msg) => {
          task.statusMsg = msg;
          _notify();
        },
      };
      try {
        task.result    = await fn(ctx);
        task.status    = 'done';
        task.statusMsg = 'Done';
      } catch(e) {
        if (e.name === 'AbortError') {
          task.status    = 'cancelled';
          task.statusMsg = 'Cancelled';
        } else {
          task.status    = 'failed';
          task.statusMsg = 'Failed: ' + (e.message || 'Unknown error');
          task.error     = e.message;
          console.warn('[TaskManager] Task failed:', title, e);
        }
      } finally {
        task.finishedAt = Date.now();
        _notify();
      }
    })();

    return id;
  }

  /** Cancel a running task */
  function cancelTask(id) {
    const t = _tasks.find(t => t.id === id);
    if (!t || t.status !== 'running') return;
    t._ctrl?.abort();
  }

  /** Remove a finished task from the list */
  function removeTask(id) {
    _tasks = _tasks.filter(t => t.id !== id);
    _notify();
  }

  /** Clear all done/failed/cancelled tasks */
  function clearFinished() {
    _tasks = _tasks.filter(t => t.status === 'running' || t.status === 'pending');
    _notify();
  }

  /** Get all tasks */
  function getTasks() { return [..._tasks]; }

  /** Subscribe to task list changes */
  function onChange(fn) { _listeners.push(fn); }

  // ══════════════════════════
  //  BUILT-IN TASK HELPERS
  // ══════════════════════════

  /**
   * Run a Nivi AI prompt as a background task.
   * Result is posted as a new chat message when done.
   * @param {string} prompt
   * @param {string} label   - Shown in task panel
   * @returns {string} taskId
   */
  function runPromptTask(prompt, label) {
    return addTask(label || prompt.slice(0, 40) + '…', async (ctx) => {
      ctx.setStatus('Calling AI…');
      if (!window.directGeminiCallStreamMultiTurn) throw new Error('AI not ready');

      const hist = (window.AppState?._tabChatHistory || []).slice(-6).map(m => ({
        role:  m.role === 'nivi' ? 'model' : 'user',
        parts: [{ text: m.text || '' }],
      }));

      let fullText = '';
      const result = await directGeminiCallStreamMultiTurn(hist, prompt, (chunk) => {
        if (ctx.signal.aborted) return;
        fullText = chunk;
        ctx.setStatus('Generating… ' + chunk.length + ' chars');
      });

      if (ctx.signal.aborted) return null;

      // Post result as a chat message
      if (typeof appendMsg === 'function') {
        appendMsg('nivi', '**[Background Task: ' + label + ']**\n\n' + fullText);
        if (window.AppState) {
          AppState._tabChatHistory.push({ role: 'nivi', text: fullText });
          localStorage.setItem('niviTabChat', JSON.stringify(AppState._tabChatHistory));
        }
        // Trigger FS auto-patch
        document.dispatchEvent(new CustomEvent('nivi-message-final', { detail: { text: fullText } }));
      }
      return fullText;
    });
  }

  /**
   * Run a local file read as a background task.
   * Injects content into chat on completion.
   * @param {string} filename
   * @param {string} question  - What to ask Nivi about this file
   */
  function analyzeFileTask(filename, question) {
    return addTask('Analyze: ' + filename, async (ctx) => {
      ctx.setStatus('Reading file…');
      const content = await FSAgent.readFile(filename);
      if (!content) throw new Error('File not found or unreadable: ' + filename);
      ctx.setStatus('Sending to AI…');
      const prompt = `${question || 'Analyze this file and summarize key points.'}\n\nFile: ${filename}\n\`\`\`\n${content.slice(0, 8000)}\n\`\`\``;
      return runPromptTask(prompt, 'Analyze ' + filename);
    });
  }

  // ══════════════════════════
  //  PANEL UI
  // ══════════════════════════

  function _showPanel() {
    const panel = document.getElementById('task-manager-panel');
    if (panel) panel.classList.add('open');
  }

  function _hidePanel() {
    const panel = document.getElementById('task-manager-panel');
    if (panel) panel.classList.remove('open');
  }

  function togglePanel() {
    const panel = document.getElementById('task-manager-panel');
    if (panel) panel.classList.toggle('open');
  }

  function _statusIcon(status) {
    switch(status) {
      case 'pending':   return `<span class="tm-dot pending"></span>`;
      case 'running':   return `<span class="tm-spinner"></span>`;
      case 'done':      return `<span class="tm-dot done"></span>`;
      case 'failed':    return `<span class="tm-dot failed"></span>`;
      case 'cancelled': return `<span class="tm-dot cancelled"></span>`;
      default:          return `<span class="tm-dot"></span>`;
    }
  }

  function _timeAgo(ts) {
    if (!ts) return '';
    const d = Date.now() - ts;
    if (d < 1000)   return 'just now';
    if (d < 60000)  return Math.floor(d / 1000) + 's ago';
    if (d < 3600000) return Math.floor(d / 60000) + 'm ago';
    return Math.floor(d / 3600000) + 'h ago';
  }

  function _renderPanel() {
    const body = document.getElementById('tm-task-list');
    if (!body) return;

    // Update badge
    const running = _tasks.filter(t => t.status === 'running' || t.status === 'pending').length;
    const badge   = document.getElementById('tm-badge');
    if (badge) {
      badge.textContent = running || _tasks.length;
      badge.style.background = running > 0 ? 'var(--accent-lt)' : 'rgba(255,255,255,.12)';
      badge.style.color      = running > 0 ? '#04130d' : 'var(--text-muted)';
    }

    // Update task fab dot
    const fab = document.getElementById('task-fab-dot');
    if (fab) fab.style.display = running > 0 ? 'block' : 'none';

    if (_tasks.length === 0) {
      body.innerHTML = `<div style="text-align:center;padding:22px 12px;color:var(--text-muted);font-size:12px;font-family:var(--mono);">No tasks yet.<br><span style="opacity:.5;">Ask Nivi to run something in background.</span></div>`;
      return;
    }

    body.innerHTML = _tasks.map(t => {
      const isActive = t.status === 'running' || t.status === 'pending';
      return `
        <div class="tm-task-row ${t.status}" data-id="${t.id}">
          <div class="tm-task-icon">${_statusIcon(t.status)}</div>
          <div class="tm-task-info">
            <div class="tm-task-title" title="${escapeHTML ? escapeHTML(t.title) : t.title}">${escapeHTML ? escapeHTML(t.title) : t.title}</div>
            <div class="tm-task-status">${escapeHTML ? escapeHTML(t.statusMsg) : t.statusMsg}</div>
          </div>
          <div class="tm-task-actions">
            ${isActive
              ? `<button class="tm-act-btn cancel" onclick="TaskManager.cancelTask('${t.id}')" title="Cancel">
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>
                </button>`
              : `<span style="font-size:9px;color:var(--text-muted);font-family:var(--mono);white-space:nowrap;">${_timeAgo(t.finishedAt)}</span>
                 <button class="tm-act-btn remove" onclick="TaskManager.removeTask('${t.id}')" title="Dismiss">×</button>`
            }
          </div>
        </div>`;
    }).join('');
  }

  // ── Command Parser ──
  // Lets user type `/bg <prompt>` to run a background task
  function _hookCommandParser() {
    const origHandleSend = window.handleSend;
    if (!origHandleSend) return;
    window.handleSend = async function() {
      const inp  = document.getElementById('mainInput');
      const text = inp?.value?.trim() || '';
      if (text.startsWith('/bg ')) {
        const prompt = text.slice(4).trim();
        if (!prompt) return;
        inp.value = ''; inp.style.height = 'auto';
        runPromptTask(prompt, prompt.slice(0, 36) + (prompt.length > 36 ? '…' : ''));
        if (typeof appendMsg === 'function') appendMsg('user', text);
        if (window.AppState) {
          AppState._tabChatHistory.push({ role: 'user', text });
          localStorage.setItem('niviTabChat', JSON.stringify(AppState._tabChatHistory));
        }
        // Show confirmation
        if (typeof appendMsg === 'function') {
          appendMsg('nivi', '⚙️ Running in background: **' + prompt.slice(0, 60) + '**\n\nI\'ll continue this task in the background and post the result when done. You can keep chatting!');
        }
        return;
      }
      return origHandleSend.apply(this, arguments);
    };
  }

  // ── Final message hook for FS auto-patch ──
  function _hookFinalMessage() {
    const origSaveAndSync = window._saveAndSync;
    // We patch via a custom event fired from nivi-core after generation
    // Listen to 'nivi-message-final' dispatched from nivi-core
  }

  // ══════════════════════════
  //  INIT
  // ══════════════════════════
  function init() {
    _hookCommandParser();
    _renderPanel();
    // Start periodic refresh of "time ago" for done tasks
    setInterval(() => {
      if (_tasks.some(t => t.status === 'done' || t.status === 'failed')) _renderPanel();
    }, 30000);
  }

  document.addEventListener('DOMContentLoaded', init);

  // Expose toggle for FAB button
  window._tmToggle = togglePanel;

  return {
    addTask,
    cancelTask,
    removeTask,
    clearFinished,
    getTasks,
    onChange,
    runPromptTask,
    analyzeFileTask,
    togglePanel,
  };
})();
