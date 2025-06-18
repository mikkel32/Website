import { jest } from '@jest/globals';

describe('initDashboard', () => {
  test('captures console errors', async () => {
    document.body.innerHTML = `
      <ul id="dashboardLogs" class="log-list"></ul>
      <ul id="fetchLogs" class="tree-list"></ul>
    `;
    localStorage.clear();
    const { initDashboard } = await import('../dashboard/core.js');
    initDashboard();
    console.error('boom');
    const li = document.querySelector('.log-error');
    expect(li).not.toBeNull();
    expect(li.textContent).toMatch('boom');
  });

  test('logs failed fetch attempts', async () => {
    document.body.innerHTML = `
      <ul id="dashboardLogs" class="log-list"></ul>
      <ul id="fetchLogs" class="tree-list"></ul>
    `;
    localStorage.clear();
    const { initDashboard } = await import('../dashboard/core.js');
    initDashboard();
    window.dispatchEvent(
      new CustomEvent('sg:fetch', { detail: { url: 'http://x', error: 'fail' } })
    );
    const list = document.querySelectorAll('.tree-list li');
    expect(list.length).toBeGreaterThan(0);
  });

  test('captures window errors and rejections', async () => {
    document.body.innerHTML = `
      <ul id="dashboardLogs" class="log-list"></ul>
      <ul id="fetchLogs" class="tree-list"></ul>
    `;
    localStorage.clear();
    let stats = null;
    const { initDashboard } = await import('../dashboard/core.js');
    initDashboard({ onStats: (s) => (stats = s) });

    window.dispatchEvent(new ErrorEvent('error', { message: 'kaboom' }));
    let logItems = document.querySelectorAll('.log-error');
    expect(logItems.length).toBe(1);
    expect(logItems[0].textContent).toMatch('kaboom');
    expect(stats.errors).toBe(1);

    const rej = new Event('unhandledrejection');
    rej.reason = new Error('oops');
    window.dispatchEvent(rej);

    logItems = document.querySelectorAll('.log-error');
    expect(logItems.length).toBe(2);
    expect(logItems[1].textContent).toMatch('oops');
    expect(stats.errors).toBe(2);
  });

  test('loads persisted logs from localStorage', async () => {
    localStorage.clear();
    await import('../error-capture.js');
    console.log('persisted message');
    document.body.innerHTML = `
      <ul id="dashboardLogs" class="log-list"></ul>
      <ul id="fetchLogs" class="tree-list"></ul>
    `;
    const { initDashboard } = await import('../dashboard/core.js');
    initDashboard();
    const item = document.querySelector('.log-info');
    expect(item).not.toBeNull();
    expect(item.textContent).toMatch('persisted message');
  });

  test('sanitizes log entries containing HTML', async () => {
    document.body.innerHTML = `
      <ul id="dashboardLogs" class="log-list"></ul>
      <ul id="fetchLogs" class="tree-list"></ul>
    `;
    localStorage.clear();
    const { initDashboard } = await import('../dashboard/core.js');
    initDashboard();
    console.log('<img src=x onerror="window.hacked=true">');
    const item = document.querySelector('.log-info');
    expect(item).not.toBeNull();
    expect(item.textContent).toMatch('<img src=x onerror="window.hacked=true">');
    expect(document.querySelector('img')).toBeNull();
  });
});
