import './error-capture.js';
import { initTheme, initNavigation } from './theme.js';
import { initSearch } from './search.js';
import { NotificationSystem, initNotificationToggle } from './notifications.js';
import { initDashboard } from './dashboard.js';

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

  function updateStat(el, value) {
    if (!el) return;
    if (el.textContent !== String(value)) {
      el.textContent = value;
      el.classList.remove('pulse');
      // force reflow for restart animation
      void el.offsetWidth;
      el.classList.add('pulse');
    }
  }

  initDashboard({
    searchInputEl: '#logSearch',
    panelToggleSel: '.panel-toggle',
    pauseBtnEl: '#pauseLogs',
    exportBtnEl: '#exportLogs',
    onStats({ errors, warnings, requests, successes, failures }) {
      updateStat(stats.errorsEl, errors);
      updateStat(stats.warningsEl, warnings);
      updateStat(stats.requestsEl, requests);
      updateStat(stats.successesEl, successes);
      updateStat(stats.failuresEl, failures);
      if (chart) {
        chart.data.datasets[0].data = [successes, failures];
        chart.update();
      }
    },
  });
});
