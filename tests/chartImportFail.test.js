import { jest } from '@jest/globals';

jest.unstable_mockModule('../search.js', () => ({ initSearch: () => {} }));
jest.unstable_mockModule('chart.js/auto', () => {
  throw new Error('missing');
});

const loadDashboard = () => import('../dashboard/index.js');

test('dashboard falls back to bundled Chart.js', async () => {
  document.body.innerHTML = `
    <canvas id="networkChart"></canvas>
    <ul id="dashboardLogs"></ul>
    <ul id="fetchLogs"></ul>
    <span id="errorsCount"></span>
    <span id="warningsCount"></span>
    <span id="requestsCount"></span>
    <span id="successCount"></span>
    <span id="failuresCount"></span>
  `;
  localStorage.clear();
  const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  await loadDashboard();
  document.dispatchEvent(new Event('DOMContentLoaded'));
  await new Promise((r) => setTimeout(r, 0));
  expect(errorSpy).not.toHaveBeenCalled();
  errorSpy.mockRestore();
});
