import { Router } from 'express'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DATA_DIR = path.resolve(__dirname, '../data')
const ORDERS_FILE = path.resolve(DATA_DIR, 'orders.json')

type LatLng = {
  latitude: number
  longitude: number
  accuracy?: number
}

type DeliveryLocation = {
  source: 'profile' | 'current' | 'manual'
  capturedAt: string
  position: LatLng
}

type Order = {
  id: string
  createdAt: string
  updatedAt: string
  userId: string
  vendorId?: string | null
  assignedToUserId?: string | null
  region?: 'cm' | 'ci' | 'sn' | null
  status: 'created' | 'assigned' | 'picked_up' | 'delivered' | 'cancelled'
  delivery: DeliveryLocation
  note?: string | null
}

type StreamClient = {
  id: string
  region: RegionKey | null
  res: any
}

const clients = new Map<string, StreamClient>()

function sseWrite(res: any, event: string, data: any, id?: string) {
  try {
    if (id) res.write(`id: ${id}\n`)
    res.write(`event: ${event}\n`)
    res.write(`data: ${JSON.stringify(data)}\n\n`)
  } catch {
  }
}

function broadcastOrderCreated(order: Order) {
  const id = `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  for (const c of clients.values()) {
    if (c.region && order.region && c.region !== order.region) continue
    sseWrite(c.res, 'order_created', { order }, id)
  }
}

let writeQueue: Promise<void> = Promise.resolve()

async function ensureDataFile(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true })
  try {
    await fs.access(ORDERS_FILE)
  } catch {
    await fs.writeFile(ORDERS_FILE, JSON.stringify([]), 'utf-8')
  }
}

async function readAll(): Promise<Order[]> {
  await ensureDataFile()
  const raw = await fs.readFile(ORDERS_FILE, 'utf-8')
  try {
    const data = JSON.parse(raw)
    if (Array.isArray(data)) return data as Order[]
  } catch {
  }
  return []
}

async function writeAll(next: Order[]): Promise<void> {
  await ensureDataFile()
  await fs.writeFile(ORDERS_FILE, JSON.stringify(next, null, 2), 'utf-8')
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

function newId(): string {
  return `ord_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

type RegionKey = 'cm' | 'ci' | 'sn'
type Region = {
  key: RegionKey
  minLat: number
  maxLat: number
  minLng: number
  maxLng: number
}

const REGIONS: Region[] = [
  { key: 'cm', minLat: 1.6, maxLat: 13.1, minLng: 8.4, maxLng: 16.2 },
  { key: 'ci', minLat: 4.3, maxLat: 10.8, minLng: -8.6, maxLng: -2.5 },
  { key: 'sn', minLat: 12.3, maxLat: 16.7, minLng: -17.6, maxLng: -11.3 },
]

function detectRegion(lat: number, lng: number): RegionKey | null {
  for (const r of REGIONS) {
    if (lat >= r.minLat && lat <= r.maxLat && lng >= r.minLng && lng <= r.maxLng) return r.key
  }
  return null
}

const router = Router()

router.get('/stream', async (req, res) => {
  const regionRaw = req.query.region ? String(req.query.region) : null
  const region = (regionRaw === 'cm' || regionRaw === 'ci' || regionRaw === 'sn') ? regionRaw : null
  const id = `sse_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`

  res.status(200)
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')
  if (typeof (res as any).flushHeaders === 'function') (res as any).flushHeaders()
  try {
    if (req.socket && typeof (req.socket as any).setTimeout === 'function') (req.socket as any).setTimeout(0)
  } catch {
  }

  const client: StreamClient = { id, region, res }
  clients.set(id, client)
  res.write(': connected\n\n')
  sseWrite(res, 'hello', { ok: true, region, now: new Date().toISOString() })

  const ping = setInterval(() => {
    try {
      res.write(`: ping ${Date.now()}\n\n`)
    } catch {
    }
  }, 25000)

  req.on('close', () => {
    clearInterval(ping)
    clients.delete(id)
  })
})

router.post('/', async (req, res) => {
  const body = req.body || {}
  const userId = String(body.userId || '').trim()
  const vendorId = body.vendorId ? String(body.vendorId) : null
  const sourceRaw = String(body?.delivery?.source || 'current')
  const source: DeliveryLocation['source'] =
    sourceRaw === 'profile' || sourceRaw === 'manual' ? sourceRaw : 'current'

  const capturedAt = String(body?.delivery?.capturedAt || new Date().toISOString())
  const positionIn = body?.delivery?.position || body?.delivery?.location || body?.delivery || null
  const latitude = normalizeNumber(positionIn?.latitude)
  const longitude = normalizeNumber(positionIn?.longitude)
  const accuracy = normalizeNumber(positionIn?.accuracy)

  if (!userId) {
    return res.status(400).json({ success: false, error: 'userId requis' })
  }
  if (latitude === null || longitude === null) {
    return res.status(400).json({ success: false, error: 'delivery.position.latitude/longitude requis' })
  }

  const order: Order = {
    id: newId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    userId,
    vendorId,
    assignedToUserId: null,
    region: detectRegion(latitude as number, longitude as number),
    status: 'created',
    delivery: {
      source,
      capturedAt,
      position: {
        latitude: latitude as number,
        longitude: longitude as number,
        ...(accuracy === null ? {} : { accuracy }),
      },
    },
    note: body?.note ? String(body.note) : null,
  }

  await queueWrite(async () => {
    const all = await readAll()
    all.unshift(order)
    await writeAll(all)
  })

  broadcastOrderCreated(order)

  return res.status(200).json({ success: true, order })
})

router.get('/', async (req, res) => {
  const userId = req.query.userId ? String(req.query.userId) : null
  const assignedToUserId = req.query.assignedToUserId ? String(req.query.assignedToUserId) : null
  const statusRaw = req.query.status ? String(req.query.status) : null
  const regionRaw = req.query.region ? String(req.query.region) : null
  const unassigned = String(req.query.unassigned || '0') === '1'
  const statuses = statusRaw
    ? statusRaw.split(',').map((s) => s.trim()).filter(Boolean)
    : null

  const region = (regionRaw === 'cm' || regionRaw === 'ci' || regionRaw === 'sn') ? regionRaw : null
  const all = await readAll()
  const list = all
    .filter((o) => (userId ? String(o.userId) === String(userId) : true))
    .filter((o) => (assignedToUserId ? String(o.assignedToUserId || '') === String(assignedToUserId) : true))
    .filter((o) => (unassigned ? !o.assignedToUserId : true))
    .filter((o) => (statuses ? statuses.includes(String(o.status)) : true))
    .filter((o) => {
      if (!region) return true
      const existing = (o.region === 'cm' || o.region === 'ci' || o.region === 'sn') ? o.region : null
      if (existing) return existing === region
      const lat = Number(o?.delivery?.position?.latitude)
      const lng = Number(o?.delivery?.position?.longitude)
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false
      return detectRegion(lat, lng) === region
    })
  return res.status(200).json({ success: true, count: list.length, orders: list })
})

router.get('/:id', async (req, res) => {
  const id = String(req.params.id || '').trim()
  if (!id) return res.status(400).json({ success: false, error: 'id requis' })
  const all = await readAll()
  const order = all.find((o) => String(o.id) === id) || null
  if (!order) return res.status(404).json({ success: false, error: 'Commande introuvable' })
  return res.status(200).json({ success: true, order })
})

router.patch('/:id', async (req, res) => {
  const id = String(req.params.id || '').trim()
  if (!id) return res.status(400).json({ success: false, error: 'id requis' })

  const body = req.body || {}
  const action = String(body.action || '').trim()
  const courierId = body.courierId ? String(body.courierId) : null
  const nextStatusRaw = body.status ? String(body.status) : null

  const allowedStatuses: Order['status'][] = ['created', 'assigned', 'picked_up', 'delivered', 'cancelled']
  const nextStatus = nextStatusRaw && allowedStatuses.includes(nextStatusRaw as Order['status'])
    ? (nextStatusRaw as Order['status'])
    : null

  let updated: Order | null = null
  let conflict: { status: number; message: string } | null = null

  await queueWrite(async () => {
    const all = await readAll()
    const idx = all.findIndex((o) => String(o.id) === id)
    if (idx === -1) return

    const current = all[idx]
    let patch: Partial<Order> = {}

    if (action === 'start') {
      if (!courierId) {
        conflict = { status: 400, message: 'courierId requis pour start' }
        return
      }
      if (current.status === 'created' && !current.assignedToUserId) {
        patch = {
          status: 'assigned',
          assignedToUserId: courierId,
        }
      } else if (String(current.assignedToUserId || '') === String(courierId) && (current.status === 'assigned' || current.status === 'picked_up')) {
        patch = {}
      } else {
        conflict = { status: 409, message: 'Commande déjà prise par un autre livreur' }
        return
      }
    } else if (action === 'picked_up') {
      patch = { status: 'picked_up' }
    } else if (action === 'delivered') {
      patch = { status: 'delivered' }
    } else if (action === 'cancelled') {
      patch = { status: 'cancelled' }
    } else if (nextStatus) {
      patch = { status: nextStatus }
    }

    const next: Order = { ...current, ...patch, updatedAt: new Date().toISOString() }
    all[idx] = next
    updated = next
    await writeAll(all)
  })

  if (conflict) return res.status(conflict.status).json({ success: false, error: conflict.message })

  if (!updated) return res.status(404).json({ success: false, error: 'Commande introuvable' })
  return res.status(200).json({ success: true, order: updated })
})

export default router
