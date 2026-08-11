import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

export type LocalBoostOrder = {
  id: string
  vendor_id: string
  vendor_kind: 'shop' | 'provider'
  boost_kind: 'sponsored' | 'promo' | 'new'
  duration_hours: number
  amount_xof: number
  currency: string
  status: 'active' | 'paid' | 'cancelled'
  expires_at: string | null
  created_at: string
}

type LocalOrdersDb = {
  orders: LocalBoostOrder[]
}

const DATA_DIR = path.resolve(process.cwd(), 'server', 'data')
const DB_PATH = path.resolve(DATA_DIR, 'local-boost-orders.json')

const ensureDir = () => {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  } catch {
  }
}

const nowIso = () => new Date().toISOString()

const safeRead = (): LocalOrdersDb => {
  ensureDir()
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf8')
    const parsed = raw ? JSON.parse(raw) : null
    const db = parsed && typeof parsed === 'object' ? parsed : null
    return { orders: Array.isArray(db?.orders) ? db.orders : [] }
  } catch {
    return { orders: [] }
  }
}

const safeWrite = (db: LocalOrdersDb) => {
  ensureDir()
  const tmp = `${DB_PATH}.tmp`
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2), 'utf8')
  fs.renameSync(tmp, DB_PATH)
}

const normalizeKind = (value: any): 'shop' | 'provider' => {
  const k = String(value || '').trim().toLowerCase()
  return k === 'provider' ? 'provider' : 'shop'
}

export const localBoostOrdersStore = {
  create: (input: Omit<LocalBoostOrder, 'id' | 'created_at'>) => {
    const vendorId = String(input.vendor_id || '').trim()
    if (!vendorId) throw new Error('vendor_id manquant')
    const vendorKind = normalizeKind(input.vendor_kind)
    const boostKind = String(input.boost_kind || '').trim().toLowerCase() as any
    if (boostKind !== 'sponsored' && boostKind !== 'promo' && boostKind !== 'new') throw new Error('boost_kind invalide')
    const durationHours = Math.floor(Number(input.duration_hours))
    const amountXof = Math.floor(Number(input.amount_xof))
    if (!Number.isFinite(durationHours) || durationHours <= 0) throw new Error('duration_hours invalide')
    if (!Number.isFinite(amountXof) || amountXof < 0) throw new Error('amount_xof invalide')
    const currency = String(input.currency || 'XOF').trim().toUpperCase() || 'XOF'
    const status = (String(input.status || 'active') as any) || 'active'
    const expiresAt = input.expires_at ? String(input.expires_at) : null

    const db = safeRead()
    const order: LocalBoostOrder = {
      id: `bo_${crypto.randomBytes(12).toString('hex')}`,
      vendor_id: vendorId,
      vendor_kind: vendorKind,
      boost_kind: boostKind,
      duration_hours: durationHours,
      amount_xof: amountXof,
      currency,
      status,
      expires_at: expiresAt,
      created_at: nowIso(),
    }
    db.orders.push(order)
    safeWrite(db)
    return order
  },

  importMany: (orders: LocalBoostOrder[]) => {
    const list = Array.isArray(orders) ? orders : []
    if (!list.length) return { imported: 0 }
    const db = safeRead()
    const existing = new Set((db.orders || []).map((o) => String(o?.id || '')).filter(Boolean))
    let imported = 0
    for (const raw of list) {
      const id = String((raw as any)?.id || '').trim()
      if (!id || existing.has(id)) continue
      const vendorId = String((raw as any)?.vendor_id || '').trim()
      if (!vendorId) continue
      const vendorKind = normalizeKind((raw as any)?.vendor_kind)
      const boostKind = String((raw as any)?.boost_kind || '').trim().toLowerCase() as any
      if (boostKind !== 'sponsored' && boostKind !== 'promo' && boostKind !== 'new') continue
      const durationHours = Math.floor(Number((raw as any)?.duration_hours))
      const amountXof = Math.floor(Number((raw as any)?.amount_xof))
      if (!Number.isFinite(durationHours) || durationHours <= 0) continue
      if (!Number.isFinite(amountXof) || amountXof < 0) continue
      const currency = String((raw as any)?.currency || 'XOF').trim().toUpperCase() || 'XOF'
      const status = (String((raw as any)?.status || 'active') as any) || 'active'
      const expiresAt = (raw as any)?.expires_at ? String((raw as any).expires_at) : null
      const createdAt = (raw as any)?.created_at ? String((raw as any).created_at) : nowIso()

      db.orders.push({
        id,
        vendor_id: vendorId,
        vendor_kind: vendorKind,
        boost_kind: boostKind,
        duration_hours: durationHours,
        amount_xof: amountXof,
        currency,
        status,
        expires_at: expiresAt,
        created_at: createdAt,
      })
      existing.add(id)
      imported++
    }
    if (imported) safeWrite(db)
    return { imported }
  },

  listByVendor: (vendorId: string, vendorKind: string, limit: number) => {
    const id = String(vendorId || '').trim()
    const kind = normalizeKind(vendorKind)
    const lim = Math.max(1, Math.min(100, Math.floor(Number(limit || 30))))
    const db = safeRead()
    const list = (db.orders || []).filter((o) => String(o.vendor_id) === id && String(o.vendor_kind) === kind)
    list.sort((a, b) => Date.parse(String(b.created_at)) - Date.parse(String(a.created_at)))
    return list.slice(0, lim)
  },

  listAll: (limit: number) => {
    const lim = Math.max(1, Math.min(200, Math.floor(Number(limit || 50))))
    const db = safeRead()
    const list = [...(db.orders || [])]
    list.sort((a, b) => Date.parse(String(b.created_at)) - Date.parse(String(a.created_at)))
    return list.slice(0, lim)
  },

  listByVendors: (vendorIds: string[], vendorKind: string, limit: number) => {
    const ids = new Set((Array.isArray(vendorIds) ? vendorIds : []).map((x) => String(x || '').trim()).filter(Boolean))
    const kind = normalizeKind(vendorKind)
    const lim = Math.max(1, Math.min(100, Math.floor(Number(limit || 30))))
    if (!ids.size) return []
    const db = safeRead()
    const list = (db.orders || []).filter((o) => ids.has(String(o.vendor_id)) && String(o.vendor_kind) === kind)
    list.sort((a, b) => Date.parse(String(b.created_at)) - Date.parse(String(a.created_at)))
    return list.slice(0, lim)
  },
}
