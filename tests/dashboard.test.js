import { jest } from '@jest/globals';
import { initDashboard } from '../dashboard.js';

describe('initDashboard', () => {
  test('captures console errors', () => {
    document.body.innerHTML = `
      <ul id="dashboardLogs" class="log-list"></ul>
      <ul id="fetchLogs" class="tree-list"></ul>
    `;
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    initDashboard();
    console.error('boom');
    errorSpy.mockRestore();
    const li = document.querySelector('.log-error');
    expect(li).not.toBeNull();
    expect(li.textContent).toMatch('boom');
  });

  test('logs failed fetch attempts', async () => {
    document.body.innerHTML = `
      <ul id="dashboardLogs" class="log-list"></ul>
      <ul id="fetchLogs" class="tree-list"></ul>
    `;
    global.fetch = jest.fn(() => Promise.reject(new Error('fail')));
    initDashboard();
    await expect(fetch('http://x')).rejects.toThrow('fail');
    const tree = document.querySelector('.tree-list li');
    expect(tree).not.toBeNull();
    const log = document.querySelector('.log-error');
    expect(log).not.toBeNull();
  });

  test('captures window errors and rejections', () => {
    document.body.innerHTML = `
      <ul id="dashboardLogs" class="log-list"></ul>
      <ul id="fetchLogs" class="tree-list"></ul>
    `;
    let stats = null;
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
    initDashboard();
    const item = document.querySelector('.log-info');
    expect(item).not.toBeNull();
    expect(item.textContent).toMatch('persisted message');
  });
});
