import fs from 'fs'
import path from 'path'

type Row = {
  user_email: string
  pin: string
  is_active: boolean
  created_at: string
  updated_at: string
}

type StoreShape = {
  rows: Row[]
}

const DATA_DIR = path.resolve(process.cwd(), 'server', 'data')
const STORE_PATH = path.join(DATA_DIR, 'local-connect-plus-user-identities.json')

function ensureDir() {
  fs.mkdirSync(DATA_DIR, { recursive: true })
}

function readStore(): StoreShape {
  ensureDir()
  try {
    if (!fs.existsSync(STORE_PATH)) return { rows: [] }
    const raw = fs.readFileSync(STORE_PATH, 'utf8')
    const parsed = JSON.parse(raw || '{}') as Partial<StoreShape>
    const rows = Array.isArray(parsed.rows) ? (parsed.rows as Row[]) : []
    return { rows }
  } catch {
    return { rows: [] }
  }
}

function writeStore(next: StoreShape) {
  ensureDir()
  const tmp = `${STORE_PATH}.tmp`
  fs.writeFileSync(tmp, JSON.stringify(next, null, 2), 'utf8')
  fs.renameSync(tmp, STORE_PATH)
}

const safeLower = (v: any) => String(v || '').trim().toLowerCase()
const normalizePin = (v: any) => String(v || '').replace(/[^\d]/g, '').slice(0, 6)

export function findActiveByEmail(email: string) {
  const e = safeLower(email)
  if (!e) return null
  const store = readStore()
  const hit = store.rows.find((r) => r.is_active && safeLower(r.user_email) === e) || null
  return hit
}

export function findActiveByPin(pin: string) {
  const p = normalizePin(pin)
  if (!p) return null
  const store = readStore()
  const hit = store.rows.find((r) => r.is_active && String(r.pin) === p) || null
  return hit
}

export function upsertActive(email: string, pin: string) {
  const e = safeLower(email)
  const p = normalizePin(pin)
  if (!e || !p) return null
  const now = new Date().toISOString()
  const store = readStore()
  const rows = store.rows.slice()
  const idx = rows.findIndex((r) => r.is_active && safeLower(r.user_email) === e)
  const nextRow: Row = idx >= 0
    ? { ...rows[idx], user_email: e, pin: p, updated_at: now, is_active: true }
    : { user_email: e, pin: p, is_active: true, created_at: now, updated_at: now }
  if (idx >= 0) rows[idx] = nextRow
  else rows.unshift(nextRow)
  writeStore({ rows })
  return nextRow
}

