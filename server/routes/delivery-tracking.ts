import { Router } from 'express'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DATA_DIR = path.resolve(__dirname, '../data')
const TRACKS_FILE = path.resolve(DATA_DIR, 'delivery-tracks.json')
const JOBS_FILE = path.resolve(DATA_DIR, 'delivery-jobs.json')

type StoredTrack = {
  jobId: string
  lat: number
  lng: number
  updatedAt: number
  accuracy?: number | null
  driverId?: string
  phase?: string
  source?: string
}

type StoredJob = Record<string, unknown> & {
  id: string
  status?: string
  phase?: string
  createdAt?: number
  assignedAt?: number
  remoteUpdatedAt?: number
}

let writeQueue: Promise<void> = Promise.resolve()

async function ensureDataFile(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true })
  try {
    await fs.access(TRACKS_FILE)
  } catch {
    await fs.writeFile(TRACKS_FILE, JSON.stringify({}), 'utf-8')
  }
}

async function ensureJobsFile(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true })
  try {
    await fs.access(JOBS_FILE)
  } catch {
    await fs.writeFile(JOBS_FILE, JSON.stringify({}), 'utf-8')
  }
}

async function readAll(): Promise<Record<string, StoredTrack>> {
  await ensureDataFile()
  const raw = await fs.readFile(TRACKS_FILE, 'utf-8')
  try {
    const data = JSON.parse(raw)
    if (data && typeof data === 'object') return data as Record<string, StoredTrack>
  } catch {
  }
  return {}
}

async function writeAll(next: Record<string, StoredTrack>): Promise<void> {
  await ensureDataFile()
  await fs.writeFile(TRACKS_FILE, JSON.stringify(next, null, 2), 'utf-8')
}

async function readAllJobs(): Promise<Record<string, StoredJob>> {
  await ensureJobsFile()
  const raw = await fs.readFile(JOBS_FILE, 'utf-8')
  try {
    const data = JSON.parse(raw)
    if (data && typeof data === 'object') return data as Record<string, StoredJob>
  } catch {
  }
  return {}
}

async function writeAllJobs(next: Record<string, StoredJob>): Promise<void> {
  await ensureJobsFile()
  await fs.writeFile(JOBS_FILE, JSON.stringify(next, null, 2), 'utf-8')
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

router.get('/latest-active', async (_req, res) => {
  const all = await readAllJobs()
  const now = Date.now()
  const latest = Object.values(all)
    .filter((job) => {
      const assignedAt = normalizeNumber(job?.assignedAt) || 0
      const status = String(job?.status || '').trim()
      return !!job?.id && assignedAt > 0 && status && status !== 'open' && (now - assignedAt) < 12 * 60 * 60 * 1000
    })
    .sort((a, b) => {
      const aTs = normalizeNumber(a?.remoteUpdatedAt) || normalizeNumber(a?.assignedAt) || normalizeNumber(a?.createdAt) || 0
      const bTs = normalizeNumber(b?.remoteUpdatedAt) || normalizeNumber(b?.assignedAt) || normalizeNumber(b?.createdAt) || 0
      return bTs - aTs
    })[0] || null

  return res.status(200).json({ success: true, job: latest })
})

router.get('/job/:jobId', async (req, res) => {
  const jobId = String(req.params.jobId || '').trim()
  if (!jobId) {
    return res.status(400).json({ success: false, error: 'jobId requis' })
  }

  const all = await readAllJobs()
  const job = all[jobId] || null
  return res.status(200).json({ success: true, job })
})

router.post('/job/:jobId', async (req, res) => {
  const jobId = String(req.params.jobId || '').trim()
  const body = req.body || {}
  const rawJob = body.job

  if (!jobId) {
    return res.status(400).json({ success: false, error: 'jobId requis' })
  }
  if (!rawJob || typeof rawJob !== 'object') {
    return res.status(400).json({ success: false, error: 'job requis' })
  }

  const next: StoredJob = {
    ...(rawJob as Record<string, unknown>),
    id: jobId,
    remoteUpdatedAt: normalizeNumber((rawJob as Record<string, unknown>).remoteUpdatedAt) || Date.now(),
  }

  await queueWrite(async () => {
    const all = await readAllJobs()
    const prev = all[jobId]
    const prevTs = normalizeNumber(prev?.remoteUpdatedAt) || normalizeNumber(prev?.assignedAt) || normalizeNumber(prev?.createdAt) || 0
    const nextTs = normalizeNumber(next.remoteUpdatedAt) || normalizeNumber(next.assignedAt) || normalizeNumber(next.createdAt) || 0
    if (prev && prevTs > nextTs) return
    all[jobId] = next
    await writeAllJobs(all)
  })

  return res.status(200).json({ success: true, job: next })
})

router.get('/:jobId', async (req, res) => {
  const jobId = String(req.params.jobId || '').trim()
  if (!jobId) {
    return res.status(400).json({ success: false, error: 'jobId requis' })
  }

  const all = await readAll()
  const track = all[jobId] || null
  return res.status(200).json({ success: true, track })
})

router.post('/:jobId', async (req, res) => {
  const jobId = String(req.params.jobId || '').trim()
  const body = req.body || {}
  const lat = normalizeNumber(body.lat)
  const lng = normalizeNumber(body.lng)
  const updatedAt = normalizeNumber(body.updatedAt) || Date.now()
  const accuracy = normalizeNumber(body.accuracy)
  const driverId = String(body.driverId || '').trim()
  const phase = String(body.phase || '').trim()
  const source = String(body.source || 'device').trim()

  if (!jobId) {
    return res.status(400).json({ success: false, error: 'jobId requis' })
  }
  if (lat === null || lng === null) {
    return res.status(400).json({ success: false, error: 'lat/lng requis' })
  }

  const next: StoredTrack = {
    jobId,
    lat,
    lng,
    updatedAt,
    ...(accuracy === null ? {} : { accuracy }),
    ...(driverId ? { driverId } : {}),
    ...(phase ? { phase } : {}),
    ...(source ? { source } : {}),
  }

  await queueWrite(async () => {
    const all = await readAll()
    const prev = all[jobId]
    if (prev && Number(prev.updatedAt || 0) > Number(next.updatedAt || 0)) return
    all[jobId] = next
    await writeAll(all)
  })

  return res.status(200).json({ success: true, track: next })
})

export default router
