import http from 'node:http'
import httpProxy from 'http-proxy'
import fs from 'node:fs'
import path from 'node:path'

const PORT = 3015
const DIST = path.resolve('dist')

// Proxy API → 3045
const apiProxy = httpProxy.createProxyServer({ target: 'http://127.0.0.1:3045', changeOrigin: true })
apiProxy.on('error', (err) => console.error('[static-serve] API proxy error:', err.message))

// Proxy WebRTC WS → 3008
const wsProxy = httpProxy.createProxyServer({ target: 'ws://127.0.0.1:3008', ws: true, changeOrigin: true })
wsProxy.on('error', (err) => console.error('[static-serve] WS proxy error:', err.message))

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
}

const server = http.createServer((req, res) => {
  const url = req.url || '/'

  // Proxy API requests
  if (url.startsWith('/api/') || url.startsWith('/socket.io')) {
    apiProxy.web(req, res)
    return
  }

  // Serve static file
  let filePath = path.join(DIST, url.split('?')[0])
  if (!path.extname(filePath) && !filePath.endsWith('/')) {
    // SPA fallback: non-file URLs → index.html
    // But for mangoo-local.html, serve as-is
    filePath = path.join(DIST, 'index.html')
  } else if (filePath.endsWith('/')) {
    filePath = path.join(filePath, 'index.html')
  }

  try {
    const content = fs.readFileSync(filePath)
    const ext = path.extname(filePath).toLowerCase()
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' })
    res.end(content)
  } catch {
    // SPA fallback
    try {
      const content = fs.readFileSync(path.join(DIST, 'index.html'))
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
      res.end(content)
    } catch {
      res.writeHead(404)
      res.end('Not Found')
    }
  }
})

// WebSocket upgrade
server.on('upgrade', (req, socket, head) => {
  if (req.url && req.url.startsWith('/webrtc-ws')) {
    wsProxy.ws(req, socket, head)
  } else {
    socket.destroy()
  }
})

server.listen(PORT, () => {
  console.log(`[static-serve] Ready: http://localhost:${PORT}/`)
  console.log(`[static-serve] Serving: ${DIST}`)
  console.log(`[static-serve] API proxy → :3045, WS proxy → :3008`)
})
