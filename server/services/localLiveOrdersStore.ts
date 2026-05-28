import fs from 'fs'
import path from 'path'

export type LiveOrderProduct = {
  id: string
  title: string
  priceCfa: number
  imageUrl?: string
}

export type LiveOrderPayment = {
  provider: 'mobile_money' | 'stripe' | 'paypal' | 'mangoo_balance'
  method?: string
  status: 'none' | 'pending' | 'succeeded' | 'failed'
  paymentId?: string
  transactionId?: string
  currency?: string
  amount?: number
  paidAt?: string
}

export type LiveOrderEscrow = {
  held: boolean
  released: boolean
  heldAt?: string
  releasedAt?: string
}

export type LiveOrderPricing = {
  currency: string
  unitPriceCfa: number
  qty: number
  subtotalCfa: number
  mangooCommissionCfa: number
  mobileMoneyFeeCfa: number
  totalCfa: number
  shopCountry?: string
  method?: string
  mangooCommissionRateBps?: number
  mobileMoneyFeeRateBps?: number
  mobileMoneyFeeFixedCfa?: number
}

export type LiveOrder = {
  id: string
  roomId: string
  shopSlug?: string
  shopName?: string
  shopCountry?: string
  product: LiveOrderProduct
  qty: number
  pricing?: LiveOrderPricing
  buyerId?: string
  buyerName?: string
  vendorDeliveredAt?: string
  buyerReceivedAt?: string
  status:
    | 'created'
    | 'payment_pending'
    | 'paid_escrow'
    | 'delivered'
    | 'received'
    | 'escrow_released'
    | 'cancelled'
  payment: LiveOrderPayment
  escrow: LiveOrderEscrow
  createdAt: string
  updatedAt: string
}

type StoreShape = {
  orders: Record<string, LiveOrder>
}

const DATA_DIR = path.resolve(process.cwd(), 'server', 'data')
const STORE_PATH = path.join(DATA_DIR, 'local-live-orders.json')

function ensureDir() {
  fs.mkdirSync(DATA_DIR, { recursive: true })
}

function readStore(): StoreShape {
  ensureDir()
  try {
    if (!fs.existsSync(STORE_PATH)) return { orders: {} }
    const raw = fs.readFileSync(STORE_PATH, 'utf8')
    const parsed = JSON.parse(raw || '{}') as Partial<StoreShape>
    const orders = parsed.orders && typeof parsed.orders === 'object' ? (parsed.orders as Record<string, LiveOrder>) : {}
    return { orders }
  } catch {
    return { orders: {} }
  }
}

function writeStore(next: StoreShape) {
  ensureDir()
  const tmp = `${STORE_PATH}.tmp`
  fs.writeFileSync(tmp, JSON.stringify(next, null, 2), 'utf8')
  fs.renameSync(tmp, STORE_PATH)
}

function safeString(v: any) {
  return String(v ?? '').trim()
}

function safeNumber(v: any) {
  const n = Number(String(v ?? '').replace(',', '.'))
  return Number.isFinite(n) ? n : 0
}

function newId() {
  return `lo_${Date.now()}_${Math.random().toString(16).slice(2)}`
}

export function createLiveOrder(input: {
  roomId: string
  shopSlug?: string
  shopName?: string
  shopCountry?: string
  product: LiveOrderProduct
  qty?: number
  pricing?: Partial<LiveOrderPricing>
  buyerId?: string
  buyerName?: string
}) {
  const rid = safeString(input?.roomId) || 'live-demo-123'
  const productId = safeString(input?.product?.id)
  const productTitle = safeString(input?.product?.title)
  const priceCfa = safeNumber((input?.product as any)?.priceCfa)
  const imageUrl = safeString((input?.product as any)?.imageUrl) || undefined
  const qty = Math.max(1, Math.round(safeNumber(input?.qty ?? 1)) || 1)

  if (!productId || !productTitle || !Number.isFinite(priceCfa) || priceCfa <= 0) return null

  const now = new Date().toISOString()
  const id = newId()

  const p = input?.pricing
  const unitPriceCfa = safeNumber((p as any)?.unitPriceCfa ?? priceCfa)
  const subtotalCfa = safeNumber((p as any)?.subtotalCfa ?? unitPriceCfa * qty)
  const mangooCommissionCfa = safeNumber((p as any)?.mangooCommissionCfa ?? 0)
  const mobileMoneyFeeCfa = safeNumber((p as any)?.mobileMoneyFeeCfa ?? 0)
  const totalCfa = safeNumber((p as any)?.totalCfa ?? subtotalCfa + mangooCommissionCfa + mobileMoneyFeeCfa)
  const currency = safeString((p as any)?.currency) || 'XOF'
  const pricing =
    Number.isFinite(unitPriceCfa) &&
    unitPriceCfa > 0 &&
    Number.isFinite(subtotalCfa) &&
    subtotalCfa >= 0 &&
    Number.isFinite(mangooCommissionCfa) &&
    mangooCommissionCfa >= 0 &&
    Number.isFinite(mobileMoneyFeeCfa) &&
    mobileMoneyFeeCfa >= 0 &&
    Number.isFinite(totalCfa) &&
    totalCfa >= 0
      ? {
          currency,
          unitPriceCfa,
          qty,
          subtotalCfa,
          mangooCommissionCfa,
          mobileMoneyFeeCfa,
          totalCfa,
        }
      : undefined

  const order: LiveOrder = {
    id,
    roomId: rid,
    shopSlug: safeString(input?.shopSlug) || undefined,
    shopName: safeString(input?.shopName) || undefined,
    shopCountry: safeString(input?.shopCountry) || undefined,
    product: { id: productId, title: productTitle, priceCfa, imageUrl },
    qty,
    pricing,
    buyerId: safeString(input?.buyerId) || undefined,
    buyerName: safeString(input?.buyerName) || undefined,
    status: 'created',
    payment: { provider: 'mobile_money', status: 'none' },
    escrow: { held: false, released: false },
    createdAt: now,
    updatedAt: now,
  }

  const store = readStore()
  store.orders[id] = order
  writeStore(store)
  return order
}

export function getLiveOrder(id: string) {
  const oid = safeString(id)
  if (!oid) return null
  const store = readStore()
  return store.orders[oid] || null
}

export function listLiveOrdersByRoom(roomId: string) {
  const rid = safeString(roomId)
  if (!rid) return []
  const store = readStore()
  const all = Object.values(store.orders || {})
  return all
    .filter((o) => safeString(o?.roomId) === rid)
    .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
}

export function setLiveOrderPayment(
  id: string,
  patch: Partial<Pick<LiveOrderPayment, 'provider' | 'method' | 'status' | 'paymentId' | 'transactionId' | 'currency' | 'amount'>>,
) {
  const oid = safeString(id)
  if (!oid) return null
  const store = readStore()
  const order = store.orders[oid]
  if (!order) return null

  const nextPayment: LiveOrderPayment = {
    ...order.payment,
    ...patch,
    provider: (patch?.provider || order.payment.provider || 'mobile_money') as any,
    status: (patch?.status || order.payment.status || 'none') as any,
    method: safeString(patch?.method ?? order.payment.method) || undefined,
    paymentId: safeString(patch?.paymentId ?? order.payment.paymentId) || undefined,
    transactionId: safeString(patch?.transactionId ?? order.payment.transactionId) || undefined,
    currency: safeString(patch?.currency ?? order.payment.currency) || undefined,
    amount: Number.isFinite(Number(patch?.amount)) ? Number(patch?.amount) : order.payment.amount,
  }

  const now = new Date().toISOString()
  const next: LiveOrder = {
    ...order,
    payment: nextPayment,
    status:
      nextPayment.status === 'succeeded'
        ? 'paid_escrow'
        : nextPayment.status === 'pending'
          ? 'payment_pending'
          : order.status,
    escrow:
      nextPayment.status === 'succeeded'
        ? {
            held: true,
            released: false,
            heldAt: order.escrow.heldAt || now,
            releasedAt: undefined,
          }
        : order.escrow,
    updatedAt: now,
  }

  store.orders[oid] = next
  writeStore(store)
  return next
}

export function markLiveOrderDelivered(id: string) {
  const oid = safeString(id)
  if (!oid) return null
  const store = readStore()
  const order = store.orders[oid]
  if (!order) return null
  if (order.status === 'cancelled') return null
  if (order.payment?.status !== 'succeeded') return null
  const now = new Date().toISOString()
  const next: LiveOrder = {
    ...order,
    status: order.status === 'escrow_released' ? 'escrow_released' : 'delivered',
    vendorDeliveredAt: order.vendorDeliveredAt || now,
    updatedAt: now,
  }
  store.orders[oid] = next
  writeStore(store)
  return next
}

export function confirmLiveOrderReceived(id: string) {
  const oid = safeString(id)
  if (!oid) return null
  const store = readStore()
  const order = store.orders[oid]
  if (!order) return null
  if (order.status === 'cancelled') return null
  if (order.payment?.status !== 'succeeded') return null
  if (order.status === 'escrow_released' && order.escrow?.released) return order
  const now = new Date().toISOString()

  const receivedAt = order.buyerReceivedAt || now
  const next: LiveOrder = {
    ...order,
    status: 'escrow_released',
    buyerReceivedAt: receivedAt,
    escrow: {
      held: true,
      released: true,
      heldAt: order.escrow.heldAt || order.payment.paidAt || now,
      releasedAt: order.escrow.releasedAt || now,
    },
    updatedAt: now,
  }
  store.orders[oid] = next
  writeStore(store)
  return next
}
