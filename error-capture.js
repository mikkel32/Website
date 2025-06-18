const STORAGE_KEY = 'sgLogs';

function loadData() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { logs: [], fetches: [] };
  } catch {
    return { logs: [], fetches: [] };
  }
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function pushLog(entry) {
  const data = loadData();
  data.logs.push({
    type: entry.type,
    message: entry.message,
    timestamp: entry.timestamp || new Date().toISOString(),
  });
  if (data.logs.length > 100) data.logs.shift();
  saveData(data);
}

function pushFetch(entry) {
  const data = loadData();
  data.fetches.push({
    url: entry.url,
    status: entry.status,
    ok: entry.ok,
    error: entry.error,
    timestamp: entry.timestamp || new Date().toISOString(),
  });
  if (data.fetches.length > 100) data.fetches.shift();
  saveData(data);
}

const origError = console.error;
console.error = (...args) => {
  pushLog({ type: 'error', message: args.join(' ') });
  origError.apply(console, args);
};

const origWarn = console.warn;
console.warn = (...args) => {
  pushLog({ type: 'warning', message: args.join(' ') });
  origWarn.apply(console, args);
};

const origLog = console.log;
console.log = (...args) => {
  pushLog({ type: 'info', message: args.join(' ') });
  origLog.apply(console, args);
};

window.addEventListener(
  'error',
  (e) => {
    if (e.target && (e.target.src || e.target.href)) {
      const url = e.target.src || e.target.href;
      pushLog({ type: 'error', message: `Resource failed to load: ${url}` });
      return;
    }
    const msg = e.message || (e.error && e.error.message) || 'Unknown error';
    pushLog({ type: 'error', message: msg });
  },
  true,
);

window.addEventListener('unhandledrejection', (e) => {
  const reason = e.reason && e.reason.message ? e.reason.message : e.reason;
  pushLog({ type: 'error', message: reason || 'Unhandled rejection' });
});

const origFetch = window.fetch;
window.fetch = async (...args) => {
  const url = args[0];
  try {
    const res = await origFetch(...args);
    pushFetch({ url, status: res.status, ok: res.ok });
    return res;
  } catch (err) {
    pushFetch({ url, error: err.message });
    throw err;
  }
};

export function getStoredLogs() {
  return loadData();
}

export function clearStoredLogs() {
  saveData({ logs: [], fetches: [] });
}
