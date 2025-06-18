import '../error-capture.js';
import { initTheme, initNavigation } from '../theme.js';
import { initSearch } from '../search.js';
import { NotificationSystem, initNotificationToggle } from '../notifications.js';
import { initDashboard } from './core.js';
import { initScrollOrb } from '../scroll-orb.js';

function setupChart() {
  const ctx = document.getElementById('networkChart');
  if (!ctx || !window.Chart) return null;
  return new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Success', 'Failed'],
      datasets: [{ data: [0, 0], backgroundColor: ['#22c55e', '#ef4444'] }],
    },
    options: { responsive: true, maintainAspectRatio: false },
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  const navMenu = initNavigation();
  initScrollOrb();
  initSearch(navMenu);

  const notifications = new NotificationSystem();
  initNotificationToggle(notifications);

  const chart = setupChart();
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
