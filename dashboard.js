export function initDashboard(options = {}) {
  const logList = document.getElementById('dashboardLogs');
  const fetchTree = document.getElementById('fetchLogs');
  if (!logList || !fetchTree) return;

  let errors = 0;
  let warnings = 0;
  let requests = 0;
  let successes = 0;
  let failures = 0;

  const report = () => {
    if (typeof options.onStats === 'function') {
      options.onStats({ errors, warnings, requests, successes, failures });
    }
  };

  const appendLog = (type, message) => {
    const li = document.createElement('li');
    li.className = `log-${type}`;
    li.textContent = message;
    logList.appendChild(li);
  };

  const origError = console.error;
  console.error = (...args) => {
    appendLog('error', args.join(' '));
    errors += 1;
    report();
    origError.apply(console, args);
  };

  const origWarn = console.warn;
  console.warn = (...args) => {
    appendLog('warning', args.join(' '));
    warnings += 1;
    report();
    origWarn.apply(console, args);
  };

  const origFetch = window.fetch;
  window.fetch = async (...args) => {
    const url = args[0];
    requests += 1;
    const node = document.createElement('li');
    node.innerHTML = `<span class="fetch-url">${url}</span>`;
    const children = document.createElement('ul');
    node.appendChild(children);
    fetchTree.appendChild(node);
    try {
      const res = await origFetch(...args);
      const statusItem = document.createElement('li');
      statusItem.textContent = `Status: ${res.status}`;
      statusItem.className = res.ok ? 'log-success' : 'log-error';
      children.appendChild(statusItem);
      if (!res.ok) {
        failures += 1;
        appendLog('error', `Fetch to ${url} failed with status ${res.status}`);
      } else {
        successes += 1;
      }
      report();
      return res;
    } catch (err) {
      const errItem = document.createElement('li');
      errItem.textContent = err.toString();
      errItem.className = 'log-error';
      children.appendChild(errItem);
      appendLog('error', `Fetch to ${url} failed: ${err.message}`);
      failures += 1;
      report();
      throw err;
    }
  };
}
