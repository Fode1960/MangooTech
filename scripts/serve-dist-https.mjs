import fs from 'node:fs'
import path from 'node:path'
import https from 'node:https'
import { fileURLToPath } from 'node:url'

import express from 'express'

const safeInt = (v, fallback) => {
  const n = Number.parseInt(String(v ?? ''), 10)
  return Number.isFinite(n) && n > 0 ? n : fallback
}

const argvValue = (name) => {
  const i = process.argv.indexOf(name)
  if (i < 0) return ''
  const next = process.argv[i + 1]
  if (!next || next.startsWith('--')) return ''
  return String(next)
}

const PORT = safeInt(argvValue('--port') || process.env.PORT, 3015)
const BACKEND_PORT = safeInt(argvValue('--backend-port') || process.env.BACKEND_PORT, 3045)

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..')
const distDir = path.join(repoRoot, 'dist')
const indexHtml = path.join(distDir, 'index.html')
const devCertPublic = String(process.env.DEV_HTTPS_CER || '').trim()

const readHttpsOptions = () => {
  const devHttps = String(process.env.DEV_HTTPS || '').trim()
  if (devHttps !== '1') return null

  const pfxPath = String(process.env.DEV_HTTPS_PFX || '').trim()
  const pfxPassphrase = String(process.env.DEV_HTTPS_PFX_PASS || '').trim()
  if (pfxPath && fs.existsSync(pfxPath)) {
    return {
      pfx: fs.readFileSync(pfxPath),
      passphrase: pfxPassphrase || undefined,
    }
  }

  const certPath = String(process.env.DEV_HTTPS_CERT || '').trim()
  const keyPath = String(process.env.DEV_HTTPS_KEY || '').trim()
  if (certPath && keyPath && fs.existsSync(certPath) && fs.existsSync(keyPath)) {
    return {
      cert: fs.readFileSync(certPath),
      key: fs.readFileSync(keyPath),
    }
  }
  return null
}

const app = express()

app.use((req, res, next) => {
  try {
    const p = String(req.path || '').toLowerCase()
    if (p.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate')
      res.setHeader('Pragma', 'no-cache')
      res.setHeader('Expires', '0')
    }
  } catch {
  }
  next()
})

app.use('/api', express.raw({ type: '*/*', limit: '20mb' }))

app.get('/mangoo-local-dev.cer', (req, res) => {
  try {
    if (!devCertPublic || !fs.existsSync(devCertPublic)) {
      res.status(404).send('Certificat introuvable')
      return
    }
    res.setHeader('Cache-Control', 'no-store')
    res.setHeader('Content-Type', 'application/x-x509-ca-cert')
    res.setHeader('Content-Disposition', 'inline; filename="mangoo-local-dev.cer"')
    res.sendFile(devCertPublic)
  } catch {
    res.status(500).send('Erreur certificat')
  }
})

app.use('/api', async (req, res) => {
  try {
    const targetUrl = `http://127.0.0.1:${BACKEND_PORT}${req.originalUrl}`
    const headers = { ...req.headers }
    delete headers.host
    delete headers.connection

    const method = String(req.method || 'GET').toUpperCase()
    const hasBody = method !== 'GET' && method !== 'HEAD'

    const r = await fetch(targetUrl, {
      method,
      headers,
      body: hasBody ? req.body : undefined,
    })

    res.status(r.status)
    r.headers.forEach((value, key) => {
      const k = String(key || '').toLowerCase()
      if (k === 'transfer-encoding' || k === 'connection') return
      res.setHeader(key, value)
    })

    const buf = Buffer.from(await r.arrayBuffer())
    res.send(buf)
  } catch {
    res.status(502).json({ success: false, error: 'Backend unreachable' })
  }
})

app.use(express.static(distDir, { index: false, etag: false, maxAge: 0 }))

app.get('*', (req, res) => {
  try {
    if (!fs.existsSync(indexHtml)) {
      res.status(500).send('dist/index.html introuvable. Lancez npm run build.')
      return
    }
    res.setHeader('Cache-Control', 'no-store')
    res.sendFile(indexHtml)
  } catch {
    res.status(500).send('Erreur serveur')
  }
})

const httpsOptions = readHttpsOptions()
if (!httpsOptions) {
  throw new Error('HTTPS options missing. Set DEV_HTTPS=1 and DEV_HTTPS_PFX (or DEV_HTTPS_CERT/DEV_HTTPS_KEY).')
}

https.createServer(httpsOptions, app).listen(PORT, '0.0.0.0', () => {
  console.log(`HTTPS static (dist) ready: https://localhost:${PORT}/`)
  console.log(`Network: https://0.0.0.0:${PORT}/`)
  console.log(`API proxy: /api -> http://127.0.0.1:${BACKEND_PORT}/api`)
})
