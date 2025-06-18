import { getStoredLogs, clearStoredLogs } from "../error-capture.js";
export function initDashboard(options = {}) {
  const logList = document.getElementById('dashboardLogs');
  const fetchTree = document.getElementById('fetchLogs');
  const logsEmpty = document.getElementById('logsEmpty');
  const fetchEmpty = document.getElementById('fetchEmpty');
  if (!logList || !fetchTree) return;

  let errors = 0;
  let warnings = 0;
  let requests = 0;
  let successes = 0;
  let failures = 0;

  const autoScrollBox =
    document.querySelector(options.autoScrollEl || '#autoScroll');
  const clearButton = document.querySelector(options.clearBtnEl || '#clearLogs');
  const pauseButton = document.querySelector(options.pauseBtnEl || '#pauseLogs');
  const exportButton = document.querySelector(options.exportBtnEl || '#exportLogs');
  const filterSelect = document.querySelector(options.filterSelectEl || '#logFilter');
  const searchInput = document.querySelector(options.searchInputEl || '#logSearch');
  const panelToggles = document.querySelectorAll(options.panelToggleSel || '.panel-toggle');

  const collapseAllBtn = document.querySelector(options.collapseAllBtnEl || "#collapseAll");
  const expandAllBtn = document.querySelector(options.expandAllBtnEl || "#expandAll");
  const updateEmptyStates = () => {
    if (logsEmpty) logsEmpty.style.display = logList.children.length ? 'none' : 'block';
    if (fetchEmpty) fetchEmpty.style.display = fetchTree.children.length ? 'none' : 'block';
  };

  updateEmptyStates();

  let logFilter = filterSelect ? filterSelect.value : 'all';

  let autoScroll = !autoScrollBox || autoScrollBox.checked;
  let recording = true;
  const logHistory = [];
  const fetchHistory = [];
  if (autoScrollBox) {
    autoScrollBox.addEventListener('change', () => {
      autoScroll = autoScrollBox.checked;
    });
  }

  if (pauseButton) {
    pauseButton.addEventListener('click', () => {
      recording = !recording;
      pauseButton.textContent = recording ? 'Pause' : 'Resume';
    });
  }

  if (exportButton) {
    exportButton.addEventListener('click', () => {
      const data = { logs: logHistory, fetches: fetchHistory };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'dashboard_logs.json';
      a.click();
      URL.revokeObjectURL(a.href);
    });
  }

  if (filterSelect) {
    filterSelect.addEventListener('change', () => {
      logFilter = filterSelect.value;
      updateVisibility();
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', updateVisibility);
  }

  panelToggles.forEach((btn) => {
    const panel = btn.closest('.dashboard-panel');
    if (!panel) return;
    const id = panel.id;
    if (id && localStorage.getItem(`panel-${id}`) === 'collapsed') {
      panel.classList.add('collapsed');
      btn.textContent = 'Expand';
    }
    btn.addEventListener('click', () => {
      const collapsed = panel.classList.toggle('collapsed');
      btn.textContent = collapsed ? 'Expand' : 'Collapse';
      if (id) {
        localStorage.setItem(`panel-${id}`, collapsed ? 'collapsed' : 'open');
      }
    });
  });

  if (collapseAllBtn) {
    collapseAllBtn.addEventListener("click", () => {
      panelToggles.forEach((btn) => {
        const panel = btn.closest(".dashboard-panel");
        if (panel && !panel.classList.contains("collapsed")) {
          panel.classList.add("collapsed");
          btn.textContent = "Expand";
          const id = panel.id;
          if (id) localStorage.setItem(`panel-${id}`, "collapsed");
        }
      });
    });
  }
  if (expandAllBtn) {
    expandAllBtn.addEventListener("click", () => {
      panelToggles.forEach((btn) => {
        const panel = btn.closest(".dashboard-panel");
        if (panel && panel.classList.contains("collapsed")) {
          panel.classList.remove("collapsed");
          btn.textContent = "Collapse";
          const id = panel.id;
          if (id) localStorage.setItem(`panel-${id}`, "open");
        }
      });
    });
  }
  const report = () => {
    if (typeof options.onStats === 'function') {
      options.onStats({ errors, warnings, requests, successes, failures });
    }
  };

  function updateVisibility() {
    const query = searchInput ? searchInput.value.toLowerCase() : '';
    Array.from(logList.children).forEach((li) => {
      let visible = logFilter === 'all' || li.dataset.type === logFilter;
      if (visible && query) {
        visible = li.textContent.toLowerCase().includes(query);
      }
      li.style.display = visible ? '' : 'none';
    });
  };

  if (clearButton) {
    clearButton.addEventListener('click', () => {
      logList.innerHTML = '';
      fetchTree.innerHTML = '';
      errors = 0;
      warnings = 0;
      requests = 0;
      successes = 0;
      failures = 0;
      logHistory.length = 0;
      fetchHistory.length = 0;
      clearStoredLogs();
      report();
      updateEmptyStates();
    });
  }

  const appendLog = (type, message) => {
    if (!recording) return;
    const li = document.createElement('li');
    li.className = `log-${type}`;
    li.dataset.type = type;
    const timestamp = new Date().toLocaleTimeString();
    li.innerHTML = `<span class="log-timestamp">${timestamp}</span> ${message}`;
    li.style.display = 'none';
    logList.appendChild(li);
    logHistory.push({ type, message, timestamp });
    updateVisibility();
    updateEmptyStates();
    if (autoScroll) {
      logList.scrollTop = logList.scrollHeight;
    }
  };

  const addFetchEntry = (entry) => {
    const node = document.createElement('li');
    node.innerHTML = `<span class="fetch-url">${entry.url}</span>`;
    const children = document.createElement('ul');
    node.appendChild(children);
    fetchTree.appendChild(node);
    requests += 1;
    if ('status' in entry) {
      const statusItem = document.createElement('li');
      statusItem.textContent = `Status: ${entry.status}`;
      statusItem.className = entry.ok ? 'log-success' : 'log-error';
      children.appendChild(statusItem);
      if (entry.ok) {
        successes += 1;
      } else {
        failures += 1;
      }
    }
    if (entry.error) {
      const errItem = document.createElement('li');
      errItem.textContent = entry.error;
      errItem.className = 'log-error';
      children.appendChild(errItem);
      failures += 1;
    }
    fetchHistory.push(entry);
    updateEmptyStates();
  };

  const stored = getStoredLogs();
  if (stored) {
    ['error', 'warning', 'info'].forEach((t) => {
      (stored.logs[t] || []).forEach((l) => {
        appendLog(t, l.message);
        if (t === 'error') errors += 1;
        else if (t === 'warning') warnings += 1;
      });
    });
    ['success', 'failure'].forEach((t) => {
      (stored.fetches[t] || []).forEach((f) => addFetchEntry(f));
    });
    updateEmptyStates();
  }
  if (stored) {
    report();
  }

  window.addEventListener('sg:log', (e) => {
    if (!recording) return;
    const { type, message, timestamp } = e.detail;
    appendLog(type, message, timestamp);
    if (type === 'error') {
      errors += 1;
    } else if (type === 'warning') {
      warnings += 1;
    }
    report();
  });

  window.addEventListener('sg:fetch', (e) => {
    const entry = e.detail;
    addFetchEntry(entry);
    report();
  });

  window.addEventListener('sg:clear', () => {
    logList.innerHTML = '';
    fetchTree.innerHTML = '';
    errors = 0;
    warnings = 0;
    requests = 0;
    successes = 0;
    failures = 0;
    logHistory.length = 0;
    fetchHistory.length = 0;
    updateEmptyStates();
    report();
  });
}
