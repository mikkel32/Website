/** @jest-environment node */
import { securityFeatures } from '../security-demo.js';

describe('securityFeatures', () => {
  beforeAll(async () => {
    await securityFeatures.init();
  });

  test('encrypts and decrypts text', async () => {
    const text = 'Hello world';
    const encrypted = await securityFeatures.encrypt(text);
    const decrypted = await securityFeatures.decrypt(encrypted);
    expect(decrypted).toBe(text);
  });

  test('hashes text with SHA-256', async () => {
    const digest = await securityFeatures.hash('hello');
    expect(digest).toMatch(/^[a-f0-9]{64}$/);
  });

  test('detects malicious input', () => {
    expect(securityFeatures.scanInput('<script>alert(1)</script>')).toBe(true);
    expect(
      securityFeatures.scanInput("SELECT * FROM users WHERE name='a' OR '1'='1'")
    ).toBe(true);
    expect(securityFeatures.scanInput('javascript:alert(1)')).toBe(true);
  });

  test('ignores safe input', () => {
    expect(securityFeatures.scanInput('Hello world')).toBe(false);
  });
});
