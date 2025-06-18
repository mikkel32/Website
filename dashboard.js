export function initDashboard() {
  const logList = document.getElementById('dashboardLogs');
  const fetchTree = document.getElementById('fetchLogs');
  if (!logList || !fetchTree) return;

  const appendLog = (type, message) => {
    const li = document.createElement('li');
    li.className = `log-${type}`;
    li.textContent = message;
    logList.appendChild(li);
  };

  const origError = console.error;
  console.error = (...args) => {
    appendLog('error', args.join(' '));
    origError.apply(console, args);
  };

  const origWarn = console.warn;
  console.warn = (...args) => {
    appendLog('warning', args.join(' '));
    origWarn.apply(console, args);
  };

  const origFetch = window.fetch;
  window.fetch = async (...args) => {
    const url = args[0];
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
        appendLog('error', `Fetch to ${url} failed with status ${res.status}`);
      }
      return res;
    } catch (err) {
      const errItem = document.createElement('li');
      errItem.textContent = err.toString();
      errItem.className = 'log-error';
      children.appendChild(errItem);
      appendLog('error', `Fetch to ${url} failed: ${err.message}`);
      throw err;
    }
  };
}
