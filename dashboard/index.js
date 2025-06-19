import '../error-capture.js';
import { initTheme, initNavigation } from '../theme.js';
import { initSearch } from '../search.js';
import { NotificationSystem, initNotificationToggle } from '../notifications.js';
import { initDashboard } from './core.js';
import { initScrollOrb } from '../scroll-orb.js';

async function setupChart() {
  const ctx = document.getElementById('networkChart');
  if (!ctx) return null;
  try {
    const { default: Chart } = await import('chart.js/auto');
    return new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Success', 'Failed'],
        datasets: [{ data: [0, 0], backgroundColor: ['#22c55e', '#ef4444'] }],
      },
      options: { responsive: true, maintainAspectRatio: false },
    });
  } catch (err) {
    console.error('Failed to load Chart.js', err);
    try {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src =
          'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.js';
        script.crossOrigin = 'anonymous';
        const fail = (msg) => {
          console.error('Failed to load Chart.js', msg);
          reject(new Error(msg));
        };
        script.onload = resolve;
        script.onerror = () => fail('script error');
        // In testing environments like JSDOM the load event will never fire, so
        // provide an immediate timeout to ensure the promise settles.
        setTimeout(() => fail('timeout'), 0);
        document.head.appendChild(script);
      });
      const Chart = window.Chart;
      if (!Chart) throw new Error('Chart not available');
      return new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Success', 'Failed'],
          datasets: [
            { data: [0, 0], backgroundColor: ['#22c55e', '#ef4444'] }
          ],
        },
        options: { responsive: true, maintainAspectRatio: false },
      });
    } catch (err2) {
      console.error('Failed to load Chart.js', err2);
      return null;
    }
  }
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
