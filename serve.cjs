const http = require('http')
const fs = require('fs')
const path = require('path')

const DIST = path.join(__dirname, 'dist')
const PORT = 3015
const API_HOST = '127.0.0.1'
const API_PORT = 3045

const mime = {
  '.html': 'text/html', '.js': 'application/javascript', '.mjs': 'application/javascript',
  '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon', '.json': 'application/json', '.woff2': 'font/woff2'
}

const srv = http.createServer((req, res) => {
  const u = new URL(req.url, 'http://localhost')
  
  // Proxy API
  if (u.pathname.startsWith('/api/') || u.pathname.startsWith('/socket.io')) {
    const opts = { hostname: API_HOST, port: API_PORT, path: req.url, method: req.method, headers: req.headers }
    const proxy = http.request(opts, (pr) => { res.writeHead(pr.statusCode, pr.headers); pr.pipe(res) })
    proxy.on('error', () => { res.writeHead(502); res.end('API down') })
    req.pipe(proxy)
    return
  }

  let p = u.pathname === '/' ? '/index.html' : u.pathname
  let fp = path.join(DIST, p)
  if (!fs.existsSync(fp) || fs.statSync(fp).isDirectory()) fp = path.join(DIST, 'index.html')
  const ext = path.extname(fp)
  res.writeHead(200, { 'Content-Type': mime[ext] || 'application/octet-stream' })
  fs.createReadStream(fp).pipe(res)
})

// Proxy WebSocket /webrtc-ws → API server (qui relaie vers 3008)
srv.on('upgrade', (req, socket, head) => {
  if (!req.url || !req.url.startsWith('/webrtc-ws')) { socket.destroy(); return }

  const proxyReq = http.request({
    hostname: API_HOST, port: API_PORT,
    path: req.url, headers: req.headers
  })

  proxyReq.on('upgrade', (proxyRes, proxySocket, proxyHead) => {
    proxySocket.write(head)
    socket.write('HTTP/1.1 101 Switching Protocols\r\n' +
      Object.keys(proxyRes.headers).map(k => k + ': ' + proxyRes.headers[k]).join('\r\n') +
      '\r\n\r\n')
    proxySocket.pipe(socket).pipe(proxySocket)
  })

  proxyReq.on('error', () => { try { socket.destroy() } catch {} })
  socket.on('error', () => { try { proxyReq.destroy() } catch {} })
  proxyReq.end()
})

srv.listen(PORT, () => console.log('[serve] http://localhost:' + PORT + ' -> API http://' + API_HOST + ':' + API_PORT))
