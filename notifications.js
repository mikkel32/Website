export class NotificationSystem {
  constructor() {
    this.container = document.createElement('div');
    this.container.className = 'notification-container';
    this.container.setAttribute('aria-live', 'polite');
    this.container.setAttribute('role', 'status');
    document.body.appendChild(this.container);
    this.enabled = localStorage.getItem('notifications') !== 'off';
    this.maxVisible = 3;
  }

  toggle() {
    this.enabled = !this.enabled;
    localStorage.setItem('notifications', this.enabled ? 'on' : 'off');
    return this.enabled;
  }

  show(message, type = 'info') {
    if (!this.enabled) return;
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.setAttribute('role', 'alert');
    notification.innerHTML = `
      <i class="fas fa-${this.getIcon(type)}"></i>
      <span>${message}</span>
      <button class="notification-close">&times;</button>
    `;

    if (this.container.children.length >= this.maxVisible) {
      this.container.firstElementChild.remove();
    }
    this.container.appendChild(notification);

    setTimeout(() => {
      notification.classList.add('fade-out');
      setTimeout(() => notification.remove(), 300);
    }, 5000);

    notification.querySelector('.notification-close').addEventListener('click', () => {
      notification.classList.add('fade-out');
      setTimeout(() => notification.remove(), 300);
    });
  }

  getIcon(type) {
    const icons = {
      info: 'info-circle',
      success: 'check-circle',
      warning: 'exclamation-triangle',
      error: 'times-circle',
    };
    return icons[type] || icons.info;
  }
}

export function initNotificationToggle(notifications) {
  const notificationToggle = document.querySelector('.notification-toggle');
  if (!notificationToggle) return;
  const notifIcon = notificationToggle.querySelector('i');
  notificationToggle.setAttribute('aria-pressed', notifications.enabled);
  if (!notifications.enabled) {
    notifIcon.classList.replace('fa-bell', 'fa-bell-slash');
  }
  notificationToggle.addEventListener('click', () => {
    if (notifications.enabled) {
      notifications.show('Notifications disabled', 'warning');
    }
    const enabled = notifications.toggle();
    notifIcon.classList.toggle('fa-bell', enabled);
    notifIcon.classList.toggle('fa-bell-slash', !enabled);
    notificationToggle.setAttribute('aria-pressed', enabled);
    if (enabled) {
      notifications.show('Notifications enabled', 'success');
    }
  });
}
