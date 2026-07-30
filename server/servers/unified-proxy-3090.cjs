/**
 * Proxy unifié sur le port 3090
 * - HTTP → Vite (3015)
 * - WebSocket (/webrtc-ws) → serveur WebSocket (3008)
 * 
 * Un seul tunnel Cloudflare suffit, compatible WebSocket.
 */
const http = require('http');
const httpProxy = require('http-proxy');
const url = require('url');

const VITE_PORT = 3015;
const WS_PORT = 3008;
const PROXY_PORT = 3090;

// Proxy pour Vite
const viteProxy = httpProxy.createProxyServer({
  target: `http://127.0.0.1:${VITE_PORT}`,
  ws: false,
  changeOrigin: true,
});

// Proxy pour WebSocket
const wsProxy = httpProxy.createProxyServer({
  target: `http://127.0.0.1:${WS_PORT}`,
  ws: true,
  changeOrigin: true,
});

// Gérer les erreurs
viteProxy.on('error', (err, req, res) => {
  console.error('[Proxy3090] Vite proxy error:', err.message);
  if (res && !res.headersSent) {
    res.writeHead(502);
    res.end('Bad Gateway');
  }
});

wsProxy.on('error', (err, req, res) => {
  console.error('[Proxy3090] WS proxy error:', err.message);
  if (res && !res.headersSent) {
    res.writeHead(502);
    res.end('Bad Gateway');
  }
});

// Serveur HTTP principal
const server = http.createServer((req, res) => {
  const pathname = url.parse(req.url).pathname;

  if (pathname === '/webrtc-ws' || pathname.startsWith('/webrtc-ws')) {
    // Pas de gestion ici car les WS passent par l'événement 'upgrade'
    // Si c'est une requête HTTP normale sur /webrtc-ws, proxy vers le serveur WS
    wsProxy.web(req, res);
  } else {
    // Tout le reste → Vite
    viteProxy.web(req, res);
  }
});

// Gérer l'upgrade WebSocket
server.on('upgrade', (req, socket, head) => {
  const pathname = url.parse(req.url).pathname;

  if (pathname === '/webrtc-ws' || pathname.startsWith('/webrtc-ws')) {
    console.log('[Proxy3090] WebSocket upgrade:', pathname);
    wsProxy.ws(req, socket, head);
  } else {
    // Vite utilise aussi des WebSockets pour HMR
    viteProxy.ws(req, socket, head);
  }
});

server.listen(PROXY_PORT, () => {
  console.log(`[Proxy3090] Proxy unifié démarré sur le port ${PROXY_PORT}`);
  console.log(`[Proxy3090]   HTTP → http://127.0.0.1:${VITE_PORT}`);
  console.log(`[Proxy3090]   WS   → http://127.0.0.1:${WS_PORT} (chemin /webrtc-ws)`);
});
