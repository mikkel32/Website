import '../error-capture.js';
import { initTheme, initNavigation } from '../theme.js';
import { initSearch } from '../search.js';
import { NotificationSystem, initNotificationToggle } from '../notifications.js';
import { initDashboard } from './core.js';
import { initScrollOrb } from '../scroll-orb.js';

let chartModule;

const CHART_CDN_URL =
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/auto/auto.js';
const CHART_CDN_HASH =
  '7e194dbe536e333cb441e2d47734e5bff1d37ac815886b7cc6cb2d76323e17ca';

async function loadChart() {
  if (chartModule) return;
  try {
    chartModule = await import('../node_modules/chart.js/auto/auto.js');
    return;
  } catch (err) {
    console.warn('Local Chart.js not found, loading from CDN...', err);
  }
  try {
    const res = await fetch(CHART_CDN_URL);
    const text = await res.text();
    if (crypto?.subtle) {
      const data = new TextEncoder().encode(text);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
      if (hashHex !== CHART_CDN_HASH) {
        console.warn('Chart.js CDN hash mismatch. Chart disabled.');
        chartModule = null;
        return;
      }
    }
    const blob = new Blob([text], { type: 'application/javascript' });
    const blobURL = URL.createObjectURL(blob);
    chartModule = await import(blobURL);
    URL.revokeObjectURL(blobURL);
  } catch (cdnErr) {
    console.error('Failed to load Chart.js from CDN', cdnErr);
    chartModule = null;
  }
}

async function setupChart() {
  const ctx = document.getElementById('networkChart');
  if (!ctx) return null;
  if (!chartModule) {
    await loadChart();
  }
  if (!chartModule) return null;
  const { default: Chart } = chartModule;
  return new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Success', 'Failed'],
      datasets: [{ data: [0, 0], backgroundColor: ['#22c55e', '#ef4444'] }],
    },
    options: { responsive: true, maintainAspectRatio: false },
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  initTheme();
  const navMenu = initNavigation();
  initScrollOrb();
  initSearch(navMenu);

  const notifications = new NotificationSystem();
  initNotificationToggle(notifications);

  const chart = await setupChart();
  const stats = {
    errorsEl: document.getElementById('errorsCount'),
    warningsEl: document.getElementById('warningsCount'),
    requestsEl: document.getElementById('requestsCount'),
    successesEl: document.getElementById('successCount'),
    failuresEl: document.getElementById('failuresCount'),
  };

  initDashboard({
    searchInputEl: '#logSearch',
    panelToggleSel: '.panel-toggle',
    clearBtnEl: "#clearLogs",
    collapseAllBtnEl: "#collapseAll",
    expandAllBtnEl: "#expandAll",
    pauseBtnEl: '#pauseLogs',
    exportBtnEl: '#exportLogs',
    onStats({ errors, warnings, requests, successes, failures }) {
      if (stats.errorsEl) stats.errorsEl.textContent = errors;
      if (stats.warningsEl) stats.warningsEl.textContent = warnings;
      if (stats.requestsEl) stats.requestsEl.textContent = requests;
      if (stats.successesEl) stats.successesEl.textContent = successes;
      if (stats.failuresEl) stats.failuresEl.textContent = failures;
      if (chart) {
        chart.data.datasets[0].data = [successes, failures];
        chart.update();
      }
    },
  });
});
