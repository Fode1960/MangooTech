const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3015;
const DIR = path.join(__dirname, 'dist');

const MIME = {
  '.html':'text/html;charset=utf-8','.js':'text/javascript;charset=utf-8',
  '.tsx':'text/javascript;charset=utf-8','.ts':'text/javascript;charset=utf-8',
  '.css':'text/css;charset=utf-8','.svg':'image/svg+xml',
  '.png':'image/png','.jpg':'image/jpeg','.ico':'image/x-icon',
  '.json':'application/json','.woff2':'font/woff2','.mp3':'audio/mpeg'
};

const srv = http.createServer((req, res) => {
  const url = req.url.split('?')[0];
  
  // Proxy /api, /socket.io → 3045
  if (url.startsWith('/api/') || url.startsWith('/socket.io')) {
    const opts = { hostname:'127.0.0.1', port:3045, path:req.url, method:req.method, headers:req.headers };
    const pr = http.request(opts, prRes => { res.writeHead(prRes.statusCode, prRes.headers); prRes.pipe(res); });
    pr.on('error', () => { res.writeHead(502); res.end('API down'); });
    if (req.method !== 'GET' && req.method !== 'HEAD') { req.pipe(pr); }
    else { req.resume(); pr.end(); }
    return;
  }

  // Page principale = mangoo-local.html (Local+ avec badge Live, dashboard, etc.)
  let fp = url === '/' ? path.join(DIR, 'mangoo-local.html') : path.join(DIR, url);
  
  // Fallback: SPA routing → mangoo-local.html
  if (!fs.existsSync(fp) && !path.extname(fp)) {
    fp = path.join(DIR, 'mangoo-local.html');
  } else if (!fs.existsSync(fp)) {
    res.writeHead(404); res.end('Not found'); return;
  }

  try {
    const st = fs.statSync(fp);
    const ext = path.extname(fp).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext]||'application/octet-stream', 'Content-Length': st.size, 'Cache-Control':'no-cache' });
    fs.createReadStream(fp).pipe(res);
  } catch(e) { res.writeHead(404); res.end('Not found'); }
});

// WebSocket proxy /webrtc-ws → 3008 (forward complet de l'upgrade HTTP)
srv.on('upgrade', (req, sock, head) => {
  if (!req.url.startsWith('/webrtc-ws')) { sock.destroy(); return; }
  
  const opts = {
    hostname: '127.0.0.1', port: 3008,
    path: req.url, method: req.method,
    headers: { ...req.headers, host: '127.0.0.1:3008' },
  };
  
  const proxyReq = http.request(opts);
  proxyReq.on('upgrade', (proxyRes, proxySocket, proxyHead) => {
    // Forward the 101 response from the real server back to the client
    sock.write(
      'HTTP/1.1 101 Switching Protocols\r\n' +
      Object.keys(proxyRes.headers).map(k => k + ': ' + proxyRes.headers[k]).join('\r\n') +
      '\r\n\r\n'
    );
    if (proxyHead && proxyHead.length) sock.write(proxyHead);
    sock.pipe(proxySocket);
    proxySocket.pipe(sock);
  });
  proxyReq.on('error', () => sock.end());
  proxyReq.end();
});

srv.listen(PORT, '0.0.0.0', () => console.log(`[dist] http://0.0.0.0:${PORT}`));
