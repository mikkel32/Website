import http from 'http';
import { spawn } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { jest } from '@jest/globals';

jest.setTimeout(20000);

const __dirname = dirname(fileURLToPath(import.meta.url));

function startServer(port, extraEnv = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn('python3', [join(__dirname, '..', 'security.py')], {
      env: {
        ...process.env,
        NO_BROWSER: '1',
        PORT: String(port),
        MAX_REQUESTS: '3',
        RATE_WINDOW: '1',
        ...extraEnv,
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

function startServerExpectExit(port) {
  return new Promise((resolve) => {
    const proc = spawn('python3', [join(__dirname, '..', 'security.py')], {
      env: {
        ...process.env,
        NO_BROWSER: '1',
        PORT: String(port),
        FORCE_SCSS_FAIL: '1',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    proc.on('exit', (code) => resolve(code));
  });
}

describe('security.py server', () => {
  let server;
  const port = 8123;
  beforeAll(async () => {
    server = await startServer(port);
  });

  afterAll(() => {
    if (server) server.kill();
  });

  async function makeRequest() {
    return new Promise((resolve) => {
      http.get({ hostname: 'localhost', port, path: '/' }, (res) => {
        const { statusCode, headers } = res;
        res.resume();
        resolve({ statusCode, headers });
      }).on('error', () => resolve({ statusCode: null, headers: {} }));
    });
  }

  test('serves with security headers and rate limiting', async () => {
    const first = await makeRequest();
    expect(first.headers['x-frame-options']).toBe('DENY');
    expect(first.headers['content-security-policy']).toBeDefined();
    const codes = [];
    for (let i = 0; i < 4; i++) {
      const res = await makeRequest();
      codes.push(res.statusCode);
    }
    expect(codes).toContain(429);
  });

  test('exits when CSS compilation fails', async () => {
    const exitCode = await startServerExpectExit(port + 1);
    expect(exitCode).not.toBe(0);
  });
});
