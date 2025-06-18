const STORAGE_KEY = 'sgLogs';

function createEmpty() {
  return {
    version: 2,
    logs: { error: [], warning: [], info: [] },
    fetches: { success: [], failure: [] },
  };
}

function loadData() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (parsed && parsed.version === 2) return parsed;

    if (parsed && Array.isArray(parsed.logs)) {
      const migrated = createEmpty();
      parsed.logs.forEach((l) => {
        const arr = migrated.logs[l.type] || migrated.logs.info;
        arr.push(l);
      });
      (parsed.fetches || []).forEach((f) => {
        const target = f.ok && !f.error ? migrated.fetches.success : migrated.fetches.failure;
        target.push(f);
      });
      return migrated;
    }
  } catch {
    /* ignore */
  }
  return createEmpty();
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function dispatchEvent(name, detail) {
  const Ev = window.CustomEvent || CustomEvent;
  window.dispatchEvent(new Ev(name, { detail }));
}

function pushLog(entry) {
  const data = loadData();
  const bucket = data.logs[entry.type] || data.logs.info;
  const item = {
    message: entry.message,
    timestamp: entry.timestamp || new Date().toISOString(),
  };
  bucket.push(item);
  if (bucket.length > 100) bucket.shift();
  saveData(data);
  dispatchEvent('sg:log', { type: entry.type, ...item });
}

function pushFetch(entry) {
  const data = loadData();
  const bucket = entry.ok && !entry.error ? data.fetches.success : data.fetches.failure;
  const item = {
    url: entry.url,
    status: entry.status,
    ok: entry.ok,
    error: entry.error,
    timestamp: entry.timestamp || new Date().toISOString(),
  };
  bucket.push(item);
  if (bucket.length > 100) bucket.shift();
  saveData(data);
  dispatchEvent('sg:fetch', item);
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
  saveData(createEmpty());
  dispatchEvent('sg:clear');
}
