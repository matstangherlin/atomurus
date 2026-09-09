import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.E2E_PORT || 4174);

const PRETTY = {
  '/app': '/app.html',
  '/login': '/login.html',
  '/pricing': '/pricing.html',
  '/signup': '/login.html',
  '/forgot-password': '/login.html',
  '/reset-password': '/login.html',
  '/contact': '/contact.html',
  '/dev/ui': '/dev/ui.html'
};

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.map': 'application/json'
};

function safeFile(urlPath) {
  let pathname = decodeURIComponent(String(urlPath || '/').split('?')[0]);
  if (PRETTY[pathname]) pathname = PRETTY[pathname];
  if (pathname.endsWith('/')) pathname += 'index.html';
  const relative = pathname.replace(/^\/+/, '');
  const resolved = path.resolve(ROOT, relative);
  if (!resolved.startsWith(ROOT + path.sep) && resolved !== ROOT) return null;
  if (fs.existsSync(resolved) && fs.statSync(resolved).isFile()) return resolved;
  if (!path.extname(resolved) && fs.existsSync(`${resolved}.html`)) return `${resolved}.html`;
  return null;
}

function send(res, status, body, headers = {}) {
  res.writeHead(status, headers);
  res.end(body);
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url || '/', `http://127.0.0.1:${PORT}`);
  if (url.pathname.startsWith('/api/')) {
    const payload = JSON.stringify({
      ok: false,
      error: 'Sign in required',
      code: url.pathname === '/api/auth/me' ? 'session_expired' : 'not_found'
    });
    send(res, url.pathname === '/api/auth/me' ? 401 : 404, payload, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    });
    return;
  }

  const file = safeFile(url.pathname);
  if (!file) {
    send(res, 404, 'Not found', { 'Content-Type': 'text/plain; charset=utf-8' });
    return;
  }
  const ext = path.extname(file);
  fs.readFile(file, (err, data) => {
    if (err) {
      send(res, 500, 'Error', { 'Content-Type': 'text/plain; charset=utf-8' });
      return;
    }
    send(res, 200, data, {
      'Content-Type': TYPES[ext] || 'application/octet-stream',
      'Cache-Control': 'no-store'
    });
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`e2e static server http://127.0.0.1:${PORT}`);
});
