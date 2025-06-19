import { NotificationSystem } from '../notifications.js';

describe('NotificationSystem accessibility', () => {
  test('container and notifications have ARIA roles', () => {
    const notifications = new NotificationSystem();
    const container = document.querySelector('.notification-container');
    expect(container).not.toBeNull();
    expect(container.getAttribute('aria-live')).toBe('polite');
    expect(container.getAttribute('role')).toBe('status');

    notifications.show('hello');
    const note = container.firstElementChild;
    expect(note).not.toBeNull();
    expect(note.getAttribute('role')).toBe('alert');
  });
});
