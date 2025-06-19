import '../error-capture.js';
import { initTheme, initNavigation } from '../theme.js';
import { initSearch } from '../search.js';
import { NotificationSystem, initNotificationToggle } from '../notifications.js';
import { initDashboard } from './core.js';
import { initScrollOrb } from '../scroll-orb.js';

async function loadChartJs() {
  try {
    return await import('chart.js/auto');
  } catch (err) {
    console.warn('Failed to load local Chart.js, falling back to CDN:', err);
    return await import(
      'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.esm.js'
    );
  }
}

async function setupChart() {
  const ctx = document.getElementById('networkChart');
  if (!ctx) return null;
  const { default: Chart } = await loadChartJs();
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
