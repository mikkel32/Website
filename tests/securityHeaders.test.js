import http from 'http';
import { spawn } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { jest } from '@jest/globals';

jest.setTimeout(20000);

const __dirname = dirname(fileURLToPath(import.meta.url));

function startServer(port) {
  return new Promise((resolve, reject) => {
    const proc = spawn('python3', [join(__dirname, '..', 'security.py')], {
      env: {
        ...process.env,
        NO_BROWSER: '1',
        PORT: String(port),
        MAX_REQUESTS: '2',
        RATE_WINDOW: '1',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    const start = Date.now();
    const tryConnect = () => {
      const req = http.request({ hostname: 'localhost', port }, () => {
        resolve(proc);
        req.destroy();
      });
      req.on('error', () => {
        if (Date.now() - start > 10000) {
          reject(new Error('Server failed to start'));
        } else {
          setTimeout(tryConnect, 200);
        }
      });
      req.end();
    };
    tryConnect();
  });
}

function makeRequest(port, path = '/') {
  return new Promise((resolve) => {
    http.get({ hostname: 'localhost', port, path }, (res) => {
      const { statusCode, headers } = res;
      res.resume();
      resolve({ statusCode, headers });
    }).on('error', () => resolve({ statusCode: null, headers: {} }));
  });
}

describe('security headers', () => {
  let server;
  const port = 8125;
  beforeAll(async () => {
    server = await startServer(port);
  });

  afterAll(() => {
    if (server) server.kill();
  });

  test('sets all expected headers', async () => {
    const res = await makeRequest(port);
    expect(res.statusCode).toBe(200);
    const h = res.headers;
    expect(h['content-security-policy']).toBeDefined();
    expect(h['x-content-type-options']).toBe('nosniff');
    expect(h['referrer-policy']).toBe('no-referrer');
    expect(h['x-frame-options']).toBe('DENY');
    expect(h['cross-origin-opener-policy']).toBe('same-origin');
    expect(h['cross-origin-embedder-policy']).toBe('require-corp');
    expect(h['strict-transport-security']).toMatch(/max-age/);
    expect(h['permissions-policy']).toContain('geolocation');
    expect(h['x-xss-protection']).toBe('1; mode=block');
  });

  test('rate limiter responds with 429', async () => {
    const codes = [];
    for (let i = 0; i < 4; i++) {
      const { statusCode } = await makeRequest(port);
      codes.push(statusCode);
    }
    expect(codes).toContain(429);
  });
});
