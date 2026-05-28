import fs from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'

const args = process.argv.slice(2)
const getArg = (name, fallback) => {
  const idx = args.indexOf(`--${name}`)
  if (idx >= 0 && idx + 1 < args.length) return args[idx + 1]
  return fallback
}

const port = Number(getArg('port', '3015')) || 3015
const url = String(getArg('url', `http://localhost:${port}`)).trim()

const platform = process.platform
const arch = process.arch

const toolsDir = path.join(process.cwd(), 'tools', 'cloudflared')
const binName = platform === 'win32' ? 'cloudflared.exe' : 'cloudflared'
const binPath = path.join(toolsDir, binName)

const downloadUrl = (() => {
  if (platform === 'win32') {
    if (arch === 'x64') return 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe'
    if (arch === 'arm64') return 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-arm64.exe'
  }
  if (platform === 'darwin') {
    if (arch === 'arm64') return 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-darwin-arm64.tgz'
    if (arch === 'x64') return 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-darwin-amd64.tgz'
  }
  if (platform === 'linux') {
    if (arch === 'arm64') return 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64'
    if (arch === 'x64') return 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64'
  }
  return ''
})()

const ensureDir = (p) => {
  fs.mkdirSync(p, { recursive: true })
}

const ensureExecutable = async () => {
  if (fs.existsSync(binPath)) return
  if (!downloadUrl) {
    throw new Error(`Plateforme non supportée pour auto-download: ${platform} ${arch}`)
  }
  ensureDir(toolsDir)
  const res = await fetch(downloadUrl)
  if (!res.ok) throw new Error(`Download failed: ${res.status} ${res.statusText}`)
  const buf = Buffer.from(await res.arrayBuffer())
  fs.writeFileSync(binPath, buf)
  if (platform !== 'win32') {
    try {
      fs.chmodSync(binPath, 0o755)
    } catch {
    }
  }
}

const main = async () => {
  await ensureExecutable()

  const child = spawn(binPath, ['tunnel', '--protocol', 'http2', '--url', url, '--no-autoupdate'], {
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  let printed = false
  const onLine = (line) => {
    const s = String(line || '').trim()
    if (!s) return
    process.stdout.write(`${s}\n`)
    if (printed) return
    const m = s.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/i)
    if (m?.[0]) {
      printed = true
      process.stdout.write(`\nURL téléphone (HTTPS): ${m[0]}\n`)
      process.stdout.write(`Ouvre cette URL sur le téléphone, puis va sur /internal/meet?id=Mangoo-tech\n\n`)
    }
  }

  child.stdout.on('data', (chunk) => {
    String(chunk || '')
      .split(/\r?\n/)
      .forEach(onLine)
  })
  child.stderr.on('data', (chunk) => {
    String(chunk || '')
      .split(/\r?\n/)
      .forEach(onLine)
  })

  child.on('exit', (code) => {
    process.stdout.write(`\nTunnel arrêté (code ${code ?? 'unknown'})\n`)
    process.exit(code ?? 1)
  })
}

main().catch((e) => {
  process.stderr.write(String(e?.message || e) + '\n')
  process.exit(1)
})
