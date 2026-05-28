import { Router, type Request, type Response } from 'express'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { supabaseAdmin } from '../config/supabase'
import { AccessToken } from 'livekit-server-sdk'

const router = Router()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const safeString = (v: any) => String(v ?? '').trim()

const isProd = () => safeString(process.env.NODE_ENV).toLowerCase() === 'production'

const getLiveKitConfig = () => {
  const livekitUrl = safeString(process.env.LIVEKIT_URL)
  const apiKey = safeString(process.env.LIVEKIT_API_KEY)
  const apiSecret = safeString(process.env.LIVEKIT_API_SECRET)
  const configured = Boolean(livekitUrl && apiKey && apiSecret)
  return { livekitUrl, apiKey, apiSecret, configured }
}

const isEnabled = (req: Request) => {
  const flag = safeString(process.env.INTERNAL_MEET_ENABLED).toLowerCase()
  if (flag === '1' || flag === 'true' || flag === 'yes') return true
  if (isProd()) return false
  return true
}

const readBearerToken = (req: Request): string | null => {
  const raw = safeString(req.headers.authorization)
  if (!raw) return null
  const m = raw.match(/^Bearer\s+(.+)$/i)
  return m ? m[1].trim() : null
}

const parseAllowlist = (): Set<string> => {
  const raw = safeString(process.env.INTERNAL_TEAM_EMAILS)
  const parts = raw
    .split(/[,\s;]+/g)
    .map((x) => safeString(x).toLowerCase())
    .filter(Boolean)
  return new Set(parts)
}

const allowDevNoAuth = () => !isProd()

const requireInternalUser = async (req: Request, res: Response): Promise<{ email: string } | null> => {
  if (!isEnabled(req)) {
    res.status(404).json({ success: false, error: 'Not found' })
    return null
  }

  const token = readBearerToken(req)
  let email = ''

  if (token) {
    const { data, error } = await supabaseAdmin.auth.getUser(token)
    if (error || !data?.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' })
      return null
    }
    email = safeString(data.user.email).toLowerCase()
  } else if (allowDevNoAuth()) {
    email = safeString(req.query.email || '').toLowerCase()
  } else {
    res.status(401).json({ success: false, error: 'Unauthorized' })
    return null
  }

  if (!email) {
    res.status(400).json({ success: false, error: 'Missing email' })
    return null
  }

  const allowlist = parseAllowlist()
  if (allowlist.size > 0) {
    if (!allowlist.has(email)) {
      res.status(403).json({ success: false, error: 'Forbidden' })
      return null
    }
  } else if (isProd()) {
    res.status(403).json({ success: false, error: 'Forbidden' })
    return null
  }

  return { email }
}

router.get('/status', async (req: Request, res: Response): Promise<void> => {
  if (!isEnabled(req)) {
    res.status(404).json({ success: false, error: 'Not found' })
    return
  }
  const lk = getLiveKitConfig()
  const allowlist = parseAllowlist()
  res.status(200).json({
    success: true,
    enabled: true,
    allowlistConfigured: allowlist.size > 0,
    ...(isProd()
      ? {}
      : {
          allowlistCount: allowlist.size,
          allowlistEmails: Array.from(allowlist).slice(0, 50),
        }),
    livekitUrl: lk.livekitUrl,
    livekitConfigured: lk.configured,
  })
})

router.post('/token', async (req: Request, res: Response): Promise<void> => {
  const user = await requireInternalUser(req, res)
  if (!user) return

  const meetingId = safeString(req.body?.meetingId || '').slice(0, 80)
  const displayName = safeString(req.body?.name || '') || user.email
  if (!meetingId) {
    res.status(400).json({ success: false, error: 'meetingId requis' })
    return
  }

  const lk = getLiveKitConfig()
  if (!lk.configured) {
    res.status(500).json({ success: false, error: 'LiveKit non configuré (LIVEKIT_URL / LIVEKIT_API_KEY / LIVEKIT_API_SECRET)' })
    return
  }

  const at = new AccessToken(lk.apiKey, lk.apiSecret, {
    identity: user.email,
    name: displayName,
  })
  at.addGrant({
    roomJoin: true,
    room: meetingId,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
  })

  const token = await at.toJwt()

  res.status(200).json({ success: true, token, livekitUrl: lk.livekitUrl, meetingId, identity: user.email, name: displayName })
})

const uploadsDir = path.join(__dirname, '..', 'data', 'internal-meet-uploads')

const ensureUploadsDir = () => {
  try {
    fs.mkdirSync(uploadsDir, { recursive: true })
  } catch {
  }
}

const parseDataUrl = (dataUrl: string): { mime: string; buffer: Buffer } | null => {
  const raw = safeString(dataUrl)
  const m = raw.match(/^data:([^;]+);base64,([a-z0-9+/=]+)$/i)
  if (!m?.[1] || !m?.[2]) return null
  const mime = safeString(m[1]).toLowerCase()
  const buffer = Buffer.from(m[2], 'base64')
  if (!buffer?.length) return null
  return { mime, buffer }
}

const safeExt = (mime: string) => {
  const m = safeString(mime).toLowerCase()
  if (m.includes('png')) return 'png'
  if (m.includes('webp')) return 'webp'
  if (m.includes('jpeg') || m.includes('jpg')) return 'jpg'
  if (m.includes('pdf')) return 'pdf'
  if (m.includes('mp3')) return 'mp3'
  if (m.includes('wav')) return 'wav'
  if (m.includes('mp4')) return 'mp4'
  return 'bin'
}

router.post('/upload', async (req: Request, res: Response): Promise<void> => {
  const user = await requireInternalUser(req, res)
  if (!user) return

  const meetingId = safeString(req.body?.meetingId || '').slice(0, 80)
  const filename = safeString(req.body?.filename || '').slice(0, 160) || 'fichier'
  const dataUrl = safeString(req.body?.dataUrl || '')
  const parsed = parseDataUrl(dataUrl)
  if (!meetingId) {
    res.status(400).json({ success: false, error: 'meetingId requis' })
    return
  }
  if (!parsed) {
    res.status(400).json({ success: false, error: 'dataUrl invalide' })
    return
  }

  ensureUploadsDir()
  const id = `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
  const ext = safeExt(parsed.mime)
  const base = `${id}.${ext}`
  const abs = path.join(uploadsDir, base)

  try {
    fs.writeFileSync(abs, parsed.buffer)
  } catch {
    res.status(500).json({ success: false, error: 'Upload failed' })
    return
  }

  res.status(200).json({
    success: true,
    attachment: {
      id,
      meetingId,
      filename,
      mime: parsed.mime,
      url: `/api/internal/meet/uploads/${encodeURIComponent(base)}`,
      uploadedBy: user.email,
    },
  })
})

router.get('/uploads/:file', async (req: Request, res: Response): Promise<void> => {
  if (!isEnabled(req)) {
    res.status(404).json({ success: false, error: 'Not found' })
    return
  }
  if (isProd()) {
    const user = await requireInternalUser(req, res)
    if (!user) return
  }

  const file = safeString(req.params.file || '')
  if (!file || file.includes('..') || file.includes('/') || file.includes('\\')) {
    res.status(400).json({ success: false, error: 'Invalid file' })
    return
  }
  const abs = path.join(uploadsDir, file)
  try {
    if (!fs.existsSync(abs)) {
      res.status(404).json({ success: false, error: 'Not found' })
      return
    }
    res.sendFile(abs)
  } catch {
    res.status(500).json({ success: false, error: 'Server internal error' })
  }
})

export default router
