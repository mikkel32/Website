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
});
