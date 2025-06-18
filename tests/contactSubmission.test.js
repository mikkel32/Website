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
      env: { ...process.env, NO_BROWSER: '1', PORT: String(port) },
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

function get(path, port) {
  return new Promise((resolve) => {
    http
      .get({ hostname: 'localhost', port, path }, (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => resolve({ statusCode: res.statusCode, body }));
      })
      .on('error', () => resolve({ statusCode: null, body: '' }));
  });
}

function post(path, data, port) {
  return new Promise((resolve) => {
    const json = JSON.stringify(data);
    const req = http.request(
      { hostname: 'localhost', port, path, method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(json) } },
      (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => resolve({ statusCode: res.statusCode, body }));
      },
    );
    req.on('error', () => resolve({ statusCode: null, body: '' }));
    req.write(json);
    req.end();
  });
}

describe('contact form submission', () => {
  let server;
  const port = 8124;
  beforeAll(async () => {
    server = await startServer(port);
  });

  afterAll(() => {
    if (server) server.kill();
  });

  test('submits form successfully', async () => {
    const tokRes = await get('/csrf-token', port);
    const token = JSON.parse(tokRes.body).token;
    const res = await post(
      '/contact',
      { name: 'Alice', email: 'a@example.com', message: 'Hi', csrf_token: token },
      port,
    );
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).status).toBe('ok');
    await new Promise((r) => setTimeout(r, 1100));
  });

  test('rejects invalid token', async () => {
    const res = await post(
      '/contact',
      { name: 'Bob', email: 'b@example.com', message: 'Test', csrf_token: 'bad' },
      port,
    );
    expect(res.statusCode).toBe(403);
    await new Promise((r) => setTimeout(r, 1100));
  });

  test('rejects malicious input', async () => {
    const tokRes = await get('/csrf-token', port);
    const token = JSON.parse(tokRes.body).token;
    const res = await post(
      '/contact',
      { name: 'Eve', email: 'eve@example.com', message: '<script>', csrf_token: token },
      port,
    );
    expect(res.statusCode).toBe(400);
  });
});
