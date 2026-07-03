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

function isActiveDeliveryJob(job: Record<string, unknown> | null | undefined): boolean {
  const status = String(job?.status || '').trim().toLowerCase()
  const phase = String(job?.phase || '').trim().toLowerCase()
  const id = String(job?.id || '').trim()
  const updatedAt =
    normalizeNumber(job?.remoteUpdatedAt) ||
    normalizeNumber((job as any)?.phaseUpdatedAt) ||
    normalizeNumber(job?.assignedAt) ||
    normalizeNumber(job?.createdAt) ||
    0
  if (!id) return false
  if (status === 'done' || status === 'delivered' || status === 'cancelled') return false
  if (phase === 'delivered') return false
  if (updatedAt > 0) {
    const ageMs = Date.now() - updatedAt
    const maxAgeMs = phase === 'proof'
      ? 45 * 60 * 1000
      : (status === 'open' ? 30 * 60 * 1000 : 2 * 60 * 60 * 1000)
    if (ageMs > maxAgeMs) return false
  }
  return true
}

function jobsShareShopScope(a: Record<string, unknown> | null | undefined, b: Record<string, unknown> | null | undefined): boolean {
  const aShopSlug = String(a?.shopSlug || '').trim()
  const bShopSlug = String(b?.shopSlug || '').trim()
  if (aShopSlug && bShopSlug && aShopSlug === bShopSlug) return true
  const aRoomId = String(a?.roomId || '').trim()
  const bRoomId = String(b?.roomId || '').trim()
  if (aRoomId && bRoomId && aRoomId === bRoomId) return true
  const aVendorId = String((a?.pickup as any)?.vendorId || '').trim()
  const bVendorId = String((b?.pickup as any)?.vendorId || '').trim()
  if (aVendorId && bVendorId && aVendorId === bVendorId) return true
  return false
}

async function reportDebugEvent(hypothesisId: string, location: string, msg: string, data: Record<string, unknown>) {
  try {
    await fetch('http://127.0.0.1:7777/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: 'driver-job-missing',
        runId: 'pre-fix',
        hypothesisId,
        location,
        msg,
        data,
        ts: Date.now(),
      }),
    })
  } catch {
  }
}

const router = Router()

router.get('/jobs/recent', async (req, res) => {
  const all = await readAllJobs()
  const now = Date.now()
  const statusFilterRaw = String(req.query.status || '').trim().toLowerCase()
  const statusFilter = statusFilterRaw
    ? statusFilterRaw.split(',').map((item) => String(item || '').trim()).filter(Boolean)
    : []
  const maxAgeMs = Math.max(60 * 60 * 1000, normalizeNumber(req.query.maxAgeMs) || 12 * 60 * 60 * 1000)

  const jobs = Object.values(all)
    .filter((job) => {
      const id = String(job?.id || '').trim()
      const status = String(job?.status || '').trim().toLowerCase()
      const ts = normalizeNumber(job?.remoteUpdatedAt) || normalizeNumber(job?.assignedAt) || normalizeNumber(job?.createdAt) || 0
      if (!id || !ts) return false
      if ((now - ts) > maxAgeMs) return false
      if (statusFilter.length && !statusFilter.includes(status)) return false
      return true
    })
    .sort((a, b) => {
      const aTs = normalizeNumber(a?.remoteUpdatedAt) || normalizeNumber(a?.assignedAt) || normalizeNumber(a?.createdAt) || 0
      const bTs = normalizeNumber(b?.remoteUpdatedAt) || normalizeNumber(b?.assignedAt) || normalizeNumber(b?.createdAt) || 0
      return bTs - aTs
    })

  // #region debug-point E:jobs-recent-response
  void reportDebugEvent(
    'E',
    'delivery-tracking.ts:GET /jobs/recent',
    '[DEBUG] jobs/recent response built',
    {
      totalStoredJobs: Object.keys(all || {}).length,
      returnedJobs: jobs.length,
      statusFilter,
      sample: jobs.slice(0, 5).map((job) => ({
        id: String(job?.id || ''),
        status: String(job?.status || ''),
        phase: String(job?.phase || ''),
        roomId: String(job?.roomId || ''),
        shopSlug: String(job?.shopSlug || ''),
        remoteUpdatedAt: normalizeNumber(job?.remoteUpdatedAt) || 0,
      })),
    },
  )
  // #endregion

  return res.status(200).json({ success: true, jobs })
})

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

  const allBefore = await readAllJobs()
  const blockingJob = Object.values(allBefore).find((job) => {
    const currentId = String(job?.id || '').trim()
    if (!currentId || currentId === jobId) return false
    if (!isActiveDeliveryJob(job)) return false
    if (!isActiveDeliveryJob(next)) return false
    return jobsShareShopScope(job, next)
  }) || null
  if (blockingJob) {
    void reportDebugEvent(
      'G',
      'delivery-tracking.ts:POST /job/:jobId conflict',
      '[DEBUG] delivery job rejected because another active shop mission exists',
      {
        jobId,
        shopSlug: String(next?.shopSlug || ''),
        roomId: String(next?.roomId || ''),
        blockingJobId: String(blockingJob?.id || ''),
        blockingOrderId: String((blockingJob as any)?.sourceOrderId || ''),
      },
    )
    return res.status(409).json({
      success: false,
      error: 'active_shop_delivery_exists',
      blockingJobId: String(blockingJob?.id || '').trim(),
      blockingOrderId: String((blockingJob as any)?.sourceOrderId || '').trim(),
    })
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

  // #region debug-point F:job-write
  void reportDebugEvent(
    'F',
    'delivery-tracking.ts:POST /job/:jobId',
    '[DEBUG] delivery job persisted remotely',
    {
      jobId,
      status: String(next?.status || ''),
      phase: String(next?.phase || ''),
      roomId: String(next?.roomId || ''),
      shopSlug: String(next?.shopSlug || ''),
      remoteUpdatedAt: normalizeNumber(next?.remoteUpdatedAt) || 0,
      assignedAt: normalizeNumber(next?.assignedAt) || 0,
    },
  )
  // #endregion

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
