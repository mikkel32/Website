import '../error-capture.js';
import { initTheme, initNavigation } from '../theme.js';
import { initSearch } from '../search.js';
import { NotificationSystem, initNotificationToggle } from '../notifications.js';
import { initDashboard } from './core.js';
import { initScrollOrb } from '../scroll-orb.js';

let chartModulePromise = null;

async function setupChart() {
  if (chartModulePromise) return chartModulePromise;

  const ctx = document.getElementById('networkChart');
  if (!ctx) {
    chartModulePromise = Promise.resolve(null);
    return null;
  }

  const loadChart = async () => {
    try {
      const { default: Chart } = await import('chart.js/auto');
      return Chart;
    } catch {
      try {
        const { default: Chart } = await import('https://esm.sh/chart.js@4.5.0?bundle');
        return Chart;
      } catch {
        console.error(
          'Failed to load Chart.js. Ensure dependencies are installed or network access is available.'
        );
        return null;
      }
    }
  };

  chartModulePromise = loadChart().then((Chart) => {
    return Chart
      ? new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: ['Success', 'Failed'],
            datasets: [{ data: [0, 0], backgroundColor: ['#22c55e', '#ef4444'] }],
          },
          options: { responsive: true, maintainAspectRatio: false },
        })
      : null;
  });

  return chartModulePromise;
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
