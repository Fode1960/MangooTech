import type { LatLng } from '../utils/geo'
import type { Order } from '../components/courier/OrdersPanel'

async function readJsonSafe(res: Response): Promise<any> {
  const text = await res.text().catch(() => '')
  if (!text || !text.trim()) {
    throw new Error(`Réponse vide (HTTP ${res.status})`)
  }
  try {
    return JSON.parse(text)
  } catch {
    throw new Error(`Réponse invalide (HTTP ${res.status})`)
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

async function fetchJsonWithRetry(url: string, init?: RequestInit, attempts: number = 2): Promise<{ res: Response; data: any }> {
  let lastErr: any = null
  for (let i = 0; i < attempts; i += 1) {
    try {
      const res = await fetch(url, init)
      const data = await readJsonSafe(res)
      return { res, data }
    } catch (e: any) {
      lastErr = e
      if (i < attempts - 1) await sleep(450)
    }
  }
  throw lastErr
}

export type RouteGeometry = {
  line: LatLng[]
  steps: any[]
  distance_m?: number | null
  duration_s?: number | null
  region_label?: string | null
  source?: string | null
  fallback?: boolean
}

export async function fetchOrders(params?: {
  userId?: string
  assignedToUserId?: string
  status?: string
  region?: 'cm' | 'ci' | 'sn'
  unassigned?: boolean
}): Promise<Order[]> {
  const qs = new URLSearchParams()
  if (params?.userId) qs.set('userId', params.userId)
  if (params?.assignedToUserId) qs.set('assignedToUserId', params.assignedToUserId)
  if (params?.status) qs.set('status', params.status)
  if (params?.region) qs.set('region', params.region)
  if (params?.unassigned) qs.set('unassigned', '1')

  const url = `/api/orders${qs.toString() ? `?${qs.toString()}` : ''}`
  const { res, data } = await fetchJsonWithRetry(url)
  if (!res.ok || !data?.success) throw new Error(data?.error || 'Erreur chargement commandes')
  return Array.isArray(data.orders) ? data.orders : []
}

export async function patchOrder(id: string, body: any): Promise<Order> {
  const url = `/api/orders/${encodeURIComponent(id)}`
  const { res, data } = await fetchJsonWithRetry(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok || !data?.success) throw new Error(data?.error || 'Erreur mise à jour commande')
  return data.order
}

export async function fetchRoute(from: LatLng, to: LatLng, wantSteps: boolean): Promise<RouteGeometry> {
  const overview = wantSteps ? 'full' : 'simplified'
  const steps = wantSteps ? '1' : '0'
  const url = `/api/routing/route?from=${encodeURIComponent(from.lat + ',' + from.lng)}&to=${encodeURIComponent(to.lat + ',' + to.lng)}&overview=${overview}&steps=${steps}`
  const { res, data } = await fetchJsonWithRetry(url)
  if (!res.ok || !data?.success || !data?.geometry) throw new Error(data?.error || 'Erreur itinéraire')
  const coords = Array.isArray(data.geometry?.coordinates) ? data.geometry.coordinates : []
  const line: LatLng[] = coords
    .map((c: any) => ({ lat: Number(c[1]), lng: Number(c[0]) }))
    .filter((p: any) => Number.isFinite(p.lat) && Number.isFinite(p.lng))
  const legs = Array.isArray(data.legs) ? data.legs : []
  const stepsAll = legs.flatMap((l: any) => (Array.isArray(l?.steps) ? l.steps : []))
  return {
    line,
    steps: stepsAll,
    distance_m: data.distance_m ?? null,
    duration_s: data.duration_s ?? null,
    region_label: data.region_label ?? null,
    source: data.source || data.requested_source || null,
    fallback: Boolean(data.fallback),
  }
}
