/* eslint-disable no-console */
import { jest } from '@jest/globals';

test('error capture not loaded in production', async () => {
  jest.resetModules();
  const prev = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  const orig = console.error;
  await import('../main.js');
  expect(console.error).toBe(orig);
  if (prev === undefined) {
    delete process.env.NODE_ENV;
  } else {
    process.env.NODE_ENV = prev;
  }
});
