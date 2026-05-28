import fs from 'fs'
import path from 'path'

export type LiveProduct = {
  id: string
  title: string
  priceCfa: number
  imageUrl?: string
  emoji?: string
}

export type LiveOrder = {
  id: string
  roomId: string
  productId: string
  qty: number
  buyerName?: string
  buyerId?: string
  createdAt: string
}

export type LiveChatMessage = {
  id: string
  roomId: string
  fromRole: 'vendor' | 'client'
  fromUserId: string
  fromName: string
  text: string
  createdAt: string
}

export type LiveRoom = {
  roomId: string
  live: boolean
  products: LiveProduct[]
  featuredProductId: string | null
  orders: LiveOrder[]
  messages: LiveChatMessage[]
  updatedAt: string
}

type StoreShape = {
  rooms: Record<string, LiveRoom>
}

const DATA_DIR = path.resolve(process.cwd(), 'server', 'data')
const STORE_PATH = path.join(DATA_DIR, 'local-live-shopping.json')

const DEFAULT_CATALOG_PRODUCTS: LiveProduct[] = [
  { id: 'p1', title: 'Robe Wax', priceCfa: 25000, emoji: '👗', imageUrl: '/demo-products/robe-wax.svg' },
  { id: 'p2', title: 'Collier Perles', priceCfa: 15000, emoji: '💎', imageUrl: '/demo-products/collier-perles.svg' },
  { id: 'p3', title: 'Sac Artisanal', priceCfa: 20000, emoji: '👜', imageUrl: '/demo-products/sac-artisanal.svg' },
  { id: 'p4', title: 'Tissu Wax', priceCfa: 12000, emoji: '🧵', imageUrl: '/demo-products/tissu-wax.svg' },
  { id: 'p5', title: 'Chaussures', priceCfa: 18000, emoji: '👟', imageUrl: '/demo-products/chaussures.svg' },
  { id: 'p6', title: 'Parfum', priceCfa: 10000, emoji: '🧴', imageUrl: '/demo-products/parfum.svg' },
]

export function getCatalogProducts() {
  return DEFAULT_CATALOG_PRODUCTS
}

export function getRoom(roomId: string) {
  const rid = String(roomId || '').trim()
  if (!rid) return null
  const store = readStore()
  return store.rooms[rid] || null
}

export function listActiveRooms() {
  const store = readStore()
  const rooms = Object.values(store.rooms || {})
  return rooms
    .filter((r) => Boolean(r?.live))
    .sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')))
}

function ensureDir() {
  fs.mkdirSync(DATA_DIR, { recursive: true })
}

function readStore(): StoreShape {
  ensureDir()
  try {
    if (!fs.existsSync(STORE_PATH)) return { rooms: {} }
    const raw = fs.readFileSync(STORE_PATH, 'utf8')
    const parsed = JSON.parse(raw || '{}') as Partial<StoreShape>
    const rooms = parsed.rooms && typeof parsed.rooms === 'object' ? (parsed.rooms as Record<string, LiveRoom>) : {}
    return { rooms }
  } catch {
    return { rooms: {} }
  }
}

function writeStore(next: StoreShape) {
  ensureDir()
  const tmp = `${STORE_PATH}.tmp`
  fs.writeFileSync(tmp, JSON.stringify(next, null, 2), 'utf8')
  fs.renameSync(tmp, STORE_PATH)
}

function newId() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`
}

export function getOrCreateRoom(roomId: string, defaults?: Partial<Pick<LiveRoom, 'products'>>) {
  const rid = String(roomId || '').trim() || 'live-demo-123'
  const store = readStore()
  const existing = store.rooms[rid]
  const defaultProducts: LiveProduct[] =
    (defaults?.products && Array.isArray(defaults.products) ? defaults.products : null) || DEFAULT_CATALOG_PRODUCTS

  if (existing && Array.isArray(existing.products)) {
    const byId = new Map(defaultProducts.map((p) => [p.id, p]))
    let changed = false
    const upgradedProducts = existing.products.map((p) => {
      const current = p as LiveProduct
      if (current.imageUrl) return current
      const fallback = byId.get(String(current.id || '').trim())
      if (!fallback?.imageUrl) return current
      changed = true
      return { ...current, imageUrl: fallback.imageUrl }
    })
    if (!changed) return existing
    const next: LiveRoom = { ...existing, products: upgradedProducts, updatedAt: new Date().toISOString() }
    store.rooms[rid] = next
    writeStore(store)
    return next
  }

  const products: LiveProduct[] = defaultProducts

  const now = new Date().toISOString()
  const room: LiveRoom = {
    roomId: rid,
    live: false,
    products,
    featuredProductId: products[0]?.id || null,
    orders: [],
    messages: [],
    updatedAt: now,
  }
  store.rooms[rid] = room
  writeStore(store)
  return room
}

export function setRoomLive(roomId: string, live: boolean) {
  const rid = String(roomId || '').trim()
  if (!rid) return null
  const store = readStore()
  const room = store.rooms[rid] || getOrCreateRoom(rid)
  const next: LiveRoom = { ...room, live: !!live, updatedAt: new Date().toISOString() }
  store.rooms[rid] = next
  writeStore(store)
  return next
}

export function setRoomFeaturedProduct(roomId: string, productId: string) {
  const rid = String(roomId || '').trim()
  if (!rid) return null
  const pid = String(productId || '').trim()
  const store = readStore()
  const room = store.rooms[rid] || getOrCreateRoom(rid)
  if (!pid || !room.products.some((p) => p.id === pid)) return room
  const next: LiveRoom = { ...room, featuredProductId: pid, updatedAt: new Date().toISOString() }
  store.rooms[rid] = next
  writeStore(store)
  return next
}

export function setRoomProductsByIds(roomId: string, productIds: string[]) {
  const rid = String(roomId || '').trim()
  if (!rid) return null
  const store = readStore()
  const room = store.rooms[rid] || getOrCreateRoom(rid)

  const ids = (Array.isArray(productIds) ? productIds : [])
    .map((x) => String(x || '').trim())
    .filter(Boolean)
  const uniqueIds: string[] = Array.from(new Set(ids))
  if (!uniqueIds.length) return room

  const source = [...(Array.isArray(room.products) ? room.products : []), ...DEFAULT_CATALOG_PRODUCTS]
  const byId = new Map(source.map((p) => [String(p.id || '').trim(), p]))
  const nextProducts = uniqueIds.map((id) => byId.get(id)).filter(Boolean) as LiveProduct[]
  if (!nextProducts.length) return room

  const featured =
    room.featuredProductId && nextProducts.some((p) => p.id === room.featuredProductId) ? room.featuredProductId : nextProducts[0]?.id || null
  const next: LiveRoom = { ...room, products: nextProducts, featuredProductId: featured, updatedAt: new Date().toISOString() }
  store.rooms[rid] = next
  writeStore(store)
  return next
}

export function setRoomProducts(roomId: string, products: LiveProduct[]) {
  const rid = String(roomId || '').trim()
  if (!rid) return null
  const list = (Array.isArray(products) ? products : [])
    .map((p) => ({
      id: String(p?.id || '').trim(),
      title: String((p as any)?.title || '').trim(),
      priceCfa: Number((p as any)?.priceCfa),
      imageUrl: String((p as any)?.imageUrl || '').trim() || undefined,
      emoji: String((p as any)?.emoji || '').trim() || undefined,
    }))
    .filter((p) => p.id && p.title && Number.isFinite(p.priceCfa))

  const uniqueById = new Map<string, LiveProduct>()
  list.forEach((p) => uniqueById.set(p.id, p))
  const nextProducts = Array.from(uniqueById.values())
  if (!nextProducts.length) return null

  const store = readStore()
  const room = store.rooms[rid] || getOrCreateRoom(rid)
  const featured =
    room.featuredProductId && nextProducts.some((p) => p.id === room.featuredProductId) ? room.featuredProductId : nextProducts[0]?.id || null
  const next: LiveRoom = { ...room, products: nextProducts, featuredProductId: featured, updatedAt: new Date().toISOString() }
  store.rooms[rid] = next
  writeStore(store)
  return next
}

export function addRoomOrder(input: { roomId: string; productId: string; qty: number; buyerName?: string; buyerId?: string }) {
  const rid = String(input.roomId || '').trim()
  const pid = String(input.productId || '').trim()
  const qty = Number.isFinite(input.qty) ? Math.max(1, Math.floor(input.qty)) : 1
  if (!rid || !pid) return null
  const store = readStore()
  const room = store.rooms[rid] || getOrCreateRoom(rid)
  if (!room.products.some((p) => p.id === pid)) return null
  const order: LiveOrder = {
    id: newId(),
    roomId: rid,
    productId: pid,
    qty,
    buyerName: String(input.buyerName || '').trim() || undefined,
    buyerId: String(input.buyerId || '').trim() || undefined,
    createdAt: new Date().toISOString(),
  }
  const next: LiveRoom = { ...room, orders: [order, ...(Array.isArray(room.orders) ? room.orders : [])], updatedAt: new Date().toISOString() }
  store.rooms[rid] = next
  writeStore(store)
  return { room: next, order }
}

export function addRoomMessage(input: {
  roomId: string
  fromRole: 'vendor' | 'client'
  fromUserId: string
  fromName: string
  text: string
}) {
  const rid = String(input.roomId || '').trim()
  const fromUserId = String(input.fromUserId || '').trim()
  const fromName = String(input.fromName || '').trim()
  const text = String(input.text || '').trim()
  const fromRole = input.fromRole === 'vendor' ? 'vendor' : 'client'
  if (!rid || !fromUserId || !fromName || !text) return null

  const store = readStore()
  const room = store.rooms[rid] || getOrCreateRoom(rid)
  const msg: LiveChatMessage = {
    id: newId(),
    roomId: rid,
    fromRole,
    fromUserId,
    fromName,
    text,
    createdAt: new Date().toISOString(),
  }
  const prev = Array.isArray(room.messages) ? room.messages : []
  const nextMessages = [msg, ...prev].slice(0, 50)
  const next: LiveRoom = { ...room, messages: nextMessages, updatedAt: new Date().toISOString() }
  store.rooms[rid] = next
  writeStore(store)
  return { room: next, message: msg }
}
