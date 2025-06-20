import { jest } from '@jest/globals';

const sanitize = jest.fn((s) => s);

jest.unstable_mockModule('dompurify', () => ({ default: { sanitize } }));

const loadModule = async () => {
  const mod = await import('../security-demo.js');
  return mod;
};

test('security-demo imports DOMPurify via import map', async () => {
  document.body.innerHTML = '<footer></footer>';
  const { setupSecurityDemo, securityFeatures } = await loadModule();
  // Stub out crypto-dependent functions so the demo can run in tests
  securityFeatures.init = jest.fn();
  securityFeatures.encrypt = jest.fn(async (t) => `enc:${t}`);
  securityFeatures.decrypt = jest.fn(async (t) => t.replace('enc:', ''));
  await setupSecurityDemo({ show: () => {} });
  const input = document.getElementById('encryptInput');
  const button = document.getElementById('encryptButton');
  input.value = 'hello';
  button.click();
  await new Promise((r) => setTimeout(r, 0));
  expect(sanitize).toHaveBeenCalledWith('hello');
});
