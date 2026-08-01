// Serveur de production pour MangooTech
// Sert les fichiers buildés (dist/) + proxy API / WebSocket vers les backends
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import httpProxy from 'http-proxy';

const PORT = parseInt(process.env.PORT || '3015', 10);
const DIST = path.join(process.cwd(), 'dist');

// Proxy API -> localhost:3045
const apiProxy = httpProxy.createProxyServer({
  target: 'http://localhost:3045',
  changeOrigin: true,
  secure: false,
});

apiProxy.on('proxyReq', (proxyReq) => {
  proxyReq.setHeader('Connection', 'close');
});

apiProxy.on('error', (err, req, res) => {
  console.error('[prod-server] API proxy error:', err.message);
  if (res && !res.headersSent) {
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'API indisponible' }));
  }
});

// Proxy WebSocket /socket.io -> localhost:3045
const socketProxy = httpProxy.createProxyServer({
  target: 'http://localhost:3045',
  ws: true,
  changeOrigin: true,
  secure: false,
});

socketProxy.on('error', (err) => {
  console.error('[prod-server] Socket.IO proxy error:', err.message);
});

// Proxy WebSocket /webrtc-ws -> localhost:3008
const webrtcProxy = httpProxy.createProxyServer({
  target: 'http://localhost:3008',
  ws: true,
  changeOrigin: true,
  secure: false,
});

webrtcProxy.on('error', (err) => {
  console.error('[prod-server] WebRTC WS proxy error:', err.message);
});

// MIME types
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.wasm': 'application/wasm',
  '.map': 'application/json',
};

function serveStatic(req, res) {
  let urlPath = req.url.split('?')[0];
  if (urlPath === '/' || urlPath.endsWith('/')) urlPath += 'index.html';

  const filePath = path.join(DIST, urlPath);
  // Sécurité : éviter directory traversal
  if (!filePath.startsWith(DIST)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      // Fallback SPA : renvoyer index.html pour les routes React
      if (err.code === 'ENOENT' && !ext) {
        fs.readFile(path.join(DIST, 'index.html'), (err2, data2) => {
          if (err2) {
            res.writeHead(404);
            res.end('Not Found');
            return;
          }
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(data2);
        });
        return;
      }
      res.writeHead(404);
      res.end('Not Found');
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType, 'Cache-Control': 'public, max-age=3600' });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  const url = req.url || '';

  // API proxy
  if (url.startsWith('/api/')) {
    apiProxy.web(req, res);
    return;
  }

  // Socket.IO polling (HTTP)
  if (url.startsWith('/socket.io/')) {
    socketProxy.web(req, res);
    return;
  }

  // Static files
  serveStatic(req, res);
});

// WebSocket upgrade
server.on('upgrade', (req, socket, head) => {
  const url = req.url || '';

  if (url.startsWith('/socket.io/')) {
    socketProxy.ws(req, socket, head);
  } else if (url.startsWith('/webrtc-ws')) {
    webrtcProxy.ws(req, socket, head);
  } else {
    socket.destroy();
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[prod-server] MangooTech prêt sur http://localhost:${PORT}/ (fichiers: dist/)`);
  console.log(`[prod-server] Proxy /api/* -> http://localhost:3045`);
  console.log(`[prod-server] Proxy /socket.io/* -> ws://localhost:3045`);
  console.log(`[prod-server] Proxy /webrtc-ws -> ws://localhost:3008`);
});
