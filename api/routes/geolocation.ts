import { Router } from 'express'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DATA_DIR = path.resolve(__dirname, '../data')
const CONSENTS_FILE = path.resolve(DATA_DIR, 'geolocation-consents.json')

type StoredConsent = {
  userId: string
  consentGiven: boolean
  consentTimestamp: string
  locationData?: {
    latitude: number
    longitude: number
    accuracy?: number
    timestamp?: string
  } | null
}

let writeQueue: Promise<void> = Promise.resolve()

async function ensureDataFile(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true })
  try {
    await fs.access(CONSENTS_FILE)
  } catch {
    await fs.writeFile(CONSENTS_FILE, JSON.stringify({}), 'utf-8')
  }
}

async function readAll(): Promise<Record<string, StoredConsent>> {
  await ensureDataFile()
  const raw = await fs.readFile(CONSENTS_FILE, 'utf-8')
  try {
    const data = JSON.parse(raw)
    if (data && typeof data === 'object') return data as Record<string, StoredConsent>
  } catch {
  }
  return {}
}

async function writeAll(next: Record<string, StoredConsent>): Promise<void> {
  await ensureDataFile()
  await fs.writeFile(CONSENTS_FILE, JSON.stringify(next, null, 2), 'utf-8')
}

function queueWrite(fn: () => Promise<void>): Promise<void> {
  writeQueue = writeQueue.then(fn).catch(() => {})
  return writeQueue
}

function normalizeNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

const router = Router()

router.post('/consent', async (req, res) => {
  const body = req.body || {}
  const userId = String(body.userId || '').trim()
  const consentGiven = Boolean(body.consentGiven)
  const consentTimestamp = String(body.consentTimestamp || new Date().toISOString())

  const loc = body.locationData || null
  const latitude = loc ? normalizeNumber(loc.latitude) : null
  const longitude = loc ? normalizeNumber(loc.longitude) : null
  const accuracy = loc ? normalizeNumber(loc.accuracy) : null
  const timestamp = loc ? String(loc.timestamp || '') : ''

  if (!userId) {
    return res.status(400).json({ success: false, error: 'userId requis' })
  }

  if (consentGiven && (latitude === null || longitude === null)) {
    return res.status(400).json({ success: false, error: 'locationData.latitude/longitude requis si consentGiven=true' })
  }

  const stored: StoredConsent = {
    userId,
    consentGiven,
    consentTimestamp,
    locationData: consentGiven
      ? {
          latitude: latitude as number,
          longitude: longitude as number,
          ...(accuracy === null ? {} : { accuracy }),
          ...(timestamp ? { timestamp } : {}),
        }
      : null,
  }

  await queueWrite(async () => {
    const all = await readAll()
    all[userId] = stored
    await writeAll(all)
  })

  return res.status(200).json({ success: true, consent: stored })
})

router.get('/consent/:userId', async (req, res) => {
  const userId = String(req.params.userId || '').trim()
  if (!userId) {
    return res.status(400).json({ success: false, error: 'userId requis' })
  }

  const all = await readAll()
  const consent = all[userId] || null
  return res.status(200).json({ success: true, consent })
})

router.get('/consents', async (_req, res) => {
  const all = await readAll()
  const list = Object.values(all)
  return res.status(200).json({ success: true, count: list.length, consents: list })
})

export default router

