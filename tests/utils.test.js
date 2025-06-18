import { JSDOM } from 'jsdom';
import { validateForm, checkPasswordStrength } from '../utils.js';

describe('validateForm', () => {
  test('valid form returns true', () => {
    const dom = new JSDOM(`<!DOCTYPE html><form id="f">
      <input type="text" id="name" required value="John" />
      <input type="email" id="email" required value="john@example.com" />
      <textarea id="message" required>Hi</textarea>
    </form>`);
    const form = dom.window.document.getElementById('f');
    expect(validateForm(form)).toBe(true);
    expect(form.querySelectorAll('.error').length).toBe(0);
  });

  test('invalid form returns false and marks errors', () => {
    const dom = new JSDOM(`<!DOCTYPE html><form id="f">
      <input type="text" id="name" required value="" />
      <input type="email" id="email" required value="invalid" />
      <textarea id="message" required></textarea>
    </form>`);
    const form = dom.window.document.getElementById('f');
    expect(validateForm(form)).toBe(false);
    expect(form.querySelectorAll('.error').length).toBe(3);
  });
});

describe('checkPasswordStrength', () => {
  test('strong password', () => {
    const result = checkPasswordStrength('Aa1!aaaaaaaa');
    expect(result.score).toBe(5);
    expect(result.suggestions.length).toBe(0);
  });

  test('weak password', () => {
    const result = checkPasswordStrength('abc');
    expect(result.score).toBe(0);
    expect(result.suggestions.length).toBeGreaterThan(0);
  });
});
