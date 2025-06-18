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
  };

  initDashboard({
    onStats({ errors, warnings, requests, successes, failures }) {
      if (stats.errorsEl) stats.errorsEl.textContent = errors;
      if (stats.warningsEl) stats.warningsEl.textContent = warnings;
      if (stats.requestsEl) stats.requestsEl.textContent = requests;
      if (chart) {
        chart.data.datasets[0].data = [successes, failures];
        chart.update();
      }
    },
  });
});
