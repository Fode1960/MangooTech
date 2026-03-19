import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Navigation, Shield, Truck, WifiOff } from 'lucide-react'
import OrdersPanel, { type Order } from '../components/courier/OrdersPanel'
import CourierMap from '../components/courier/CourierMap'
import VoiceGuidance from '../components/courier/VoiceGuidance'
import { detectRegionKey, distanceToLineStringMeters, haversineMeters, type LatLng } from '../utils/geo'
import { useGeolocationWatch } from '../hooks/useGeolocationWatch'
import { fetchOrders, fetchRoute, patchOrder, type RouteGeometry } from '../services/courierApi'
function loadCurrentUser(): any {
  try {
    const raw = localStorage.getItem('mangoo-current-user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveCurrentUser(u: any) {
  try {
    localStorage.setItem('mangoo-current-user', JSON.stringify(u))
  } catch {
  }
}

function getId(u: any): string {
  return String(u?.id || u?.email || 'courier')
}

export default function CourierScreen() {
  const navigate = useNavigate()
  const [user, setUser] = useState<any>(() => loadCurrentUser())
  const roles = useMemo(() => (Array.isArray(user?.roles) ? user.roles : user?.role ? [user.role] : []), [user])
  const canAccess = roles.includes('livreur') || roles.includes('admin') || roles.includes('ops')
  const courierId = useMemo(() => getId(user), [user])

  const [poolOrders, setPoolOrders] = useState<Order[]>([])
  const [myOrders, setMyOrders] = useState<Order[]>([])
  const [historyOrders, setHistoryOrders] = useState<Order[]>([])
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [ordersError, setOrdersError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const orders = useMemo(() => {
    const map = new Map<string, Order>()
    for (const o of poolOrders) map.set(o.id, o)
    for (const o of myOrders) map.set(o.id, o)
    for (const o of historyOrders) map.set(o.id, o)
    return Array.from(map.values())
  }, [poolOrders, myOrders, historyOrders])

  const selectedOrder = useMemo(() => orders.find((o) => o.id === selectedId) || null, [orders, selectedId])

  const [activeOrderId, setActiveOrderId] = useState<string | null>(null)
  const activeOrder = useMemo(() => orders.find((o) => o.id === activeOrderId) || null, [orders, activeOrderId])

  const [route, setRoute] = useState<RouteGeometry | null>(null)
  const [routeError, setRouteError] = useState<string | null>(null)
  const [voiceEnabled, setVoiceEnabled] = useState(false)
  const [trackingEnabled, setTrackingEnabled] = useState(true)

  const routeErrorLabel = useMemo(() => {
    if (!routeError) return null
    if (routeError.includes("Failed to execute 'json' on 'Response'") || routeError.includes('Unexpected end of JSON input')) {
      return 'Connexion API instable: réponse incomplète. Réessayez.'
    }
    if (routeError.startsWith('Réponse vide')) {
      return 'Connexion API instable: réponse vide. Réessayez.'
    }
    if (routeError.startsWith('Réponse invalide')) {
      return 'Connexion API instable: réponse invalide. Réessayez.'
    }
    return routeError
  }, [routeError])

  const { position: courierPos, error: gpsError } = useGeolocationWatch(trackingEnabled)
  const lastRecalcRef = useRef<number>(0)
  const onlineRef = useRef<boolean>(true)
  const [isOnline, setIsOnline] = useState<boolean>(() => (typeof navigator !== 'undefined' ? navigator.onLine : true))
  const routeInFlightRef = useRef<boolean>(false)
  const lastRouteFromRef = useRef<LatLng | null>(null)
  const lastRouteAtRef = useRef<number>(0)

  const mapCenter: LatLng = useMemo(() => {
    if (courierPos) return { lat: courierPos.lat, lng: courierPos.lng }
    if (selectedOrder) return { lat: selectedOrder.delivery.position.latitude, lng: selectedOrder.delivery.position.longitude }
    return { lat: 4.051056, lng: 9.767869 }
  }, [courierPos, selectedOrder])

  const destination: LatLng | null = useMemo(() => {
    const o = activeOrder || selectedOrder
    if (!o) return null
    return { lat: o.delivery.position.latitude, lng: o.delivery.position.longitude }
  }, [activeOrder, selectedOrder])

  const loadOrders = useCallback(async () => {
    try {
      setLoadingOrders(true)
      setOrdersError(null)

      const region = courierPos ? detectRegionKey({ lat: courierPos.lat, lng: courierPos.lng }) : null
      const [pool, mine, history] = await Promise.all([
        fetchOrders({ status: 'created', unassigned: true, region: region || undefined }),
        fetchOrders({ assignedToUserId: courierId, status: 'assigned,picked_up', region: region || undefined }),
        fetchOrders({ assignedToUserId: courierId, status: 'delivered', region: region || undefined }),
      ])

      setPoolOrders(pool)
      setMyOrders(mine)
      setHistoryOrders(history)

      if (!selectedId) {
        const next = pool[0]?.id || mine[0]?.id || history[0]?.id || null
        if (next) setSelectedId(next)
      }
    } catch (e: any) {
      setOrdersError(String(e?.message || e))
    } finally {
      setLoadingOrders(false)
    }
  }, [selectedId, courierId, courierPos])

  useEffect(() => {
    if (!canAccess) return
    loadOrders()
    const t = window.setInterval(() => loadOrders(), 15000)
    return () => window.clearInterval(t)
  }, [canAccess, loadOrders])

  useEffect(() => {
    const onOnline = () => {
      onlineRef.current = true
      setIsOnline(true)
    }
    const onOffline = () => {
      onlineRef.current = false
      setIsOnline(false)
    }
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  const routeCacheKey = useCallback((orderId: string, to: LatLng, wantSteps: boolean) => {
    return `mangoo-route|${courierId}|${orderId}|${to.lat.toFixed(6)},${to.lng.toFixed(6)}|steps=${wantSteps ? 1 : 0}`
  }, [courierId])

  const saveRouteToLocal = useCallback((orderId: string, to: LatLng, wantSteps: boolean, r: RouteGeometry) => {
    try {
      const key = 'mangoo-courier-route-cache-v1'
      const raw = localStorage.getItem(key)
      const store = raw ? JSON.parse(raw) : {}
      const k = routeCacheKey(orderId, to, wantSteps)
      store[k] = { savedAt: Date.now(), route: r }
      const entries = Object.entries(store)
      entries.sort((a: any, b: any) => (b?.[1]?.savedAt || 0) - (a?.[1]?.savedAt || 0))
      const trimmed: any = {}
      for (const [ek, ev] of entries.slice(0, 30)) trimmed[ek] = ev
      localStorage.setItem(key, JSON.stringify(trimmed))
    } catch {
    }
  }, [routeCacheKey])

  const loadRouteFromLocal = useCallback((orderId: string, to: LatLng, wantSteps: boolean): RouteGeometry | null => {
    try {
      const raw = localStorage.getItem('mangoo-courier-route-cache-v1')
      if (!raw) return null
      const store = JSON.parse(raw)
      const k = routeCacheKey(orderId, to, wantSteps)
      const entry = store?.[k]
      const r = entry?.route
      if (!r || !Array.isArray(r?.line) || r.line.length < 2) return null
      if (wantSteps && (!Array.isArray(r?.steps) || r.steps.length === 0)) return null
      return r as RouteGeometry
    } catch {
      return null
    }
  }, [routeCacheKey])

  const startDelivery = useCallback(async (id: string) => {
    try {
      const updated = await patchOrder(id, { action: 'start', courierId })
      setPoolOrders((prev) => prev.filter((o) => o.id !== updated.id))
      setMyOrders((prev) => {
        const exists = prev.some((o) => o.id === updated.id)
        return exists ? prev.map((o) => (o.id === updated.id ? updated : o)) : [updated, ...prev]
      })
      setActiveOrderId(updated.id)
      setSelectedId(updated.id)
      setRoute(null)
      setRouteError(null)
    } catch (e: any) {
      setRouteError(String(e?.message || e))
    }
  }, [courierId])

  const markDelivered = useCallback(async (id: string) => {
    try {
      const updated = await patchOrder(id, { action: 'delivered' })
      setMyOrders((prev) => prev.filter((o) => o.id !== updated.id))
      setHistoryOrders((prev) => {
        const exists = prev.some((o) => o.id === updated.id)
        return exists ? prev.map((o) => (o.id === updated.id ? updated : o)) : [updated, ...prev]
      })
      if (activeOrderId === id) {
        setActiveOrderId(null)
        setRoute(null)
      }
    } catch (e: any) {
      setRouteError(String(e?.message || e))
    }
  }, [activeOrderId])

  const computeRoute = useCallback(async (from: LatLng, to: LatLng, wantSteps: boolean, orderId: string) => {
    try {
      if (routeInFlightRef.current) return
      const now = Date.now()
      const lastFrom = lastRouteFromRef.current
      if (lastFrom) {
        const moved = haversineMeters(from, lastFrom)
        if (moved < 15 && now - lastRouteAtRef.current < 8000) return
      }

      routeInFlightRef.current = true
      setRouteError(null)
      const r = await fetchRoute(from, to, wantSteps)
      setRoute(r)
      saveRouteToLocal(orderId, to, wantSteps, r)
      lastRouteFromRef.current = from
      lastRouteAtRef.current = Date.now()
    } catch (e: any) {
      const cached = loadRouteFromLocal(orderId, to, wantSteps)
      if (cached) {
        setRoute(cached)
        setRouteError('Mode hors-ligne: itinéraire en cache')
      } else {
        setRouteError(String(e?.message || e))
      }
    } finally {
      routeInFlightRef.current = false
    }
  }, [loadRouteFromLocal, saveRouteToLocal])

  const retryRoute = useCallback(() => {
    if (!destination) return
    if (!courierPos) return
    const id = activeOrderId || selectedId
    if (!id) return
    computeRoute({ lat: courierPos.lat, lng: courierPos.lng }, destination, voiceEnabled, id)
  }, [courierPos, destination, computeRoute, voiceEnabled, activeOrderId, selectedId])

  useEffect(() => {
    if (!destination) return
    if (!courierPos) return
    if (!activeOrderId) return

    const needsInitial = !route || !route.line || route.line.length < 2
    const needsSteps = voiceEnabled && (!route || !route.steps || route.steps.length === 0)
    if (!needsInitial && !needsSteps) return

    computeRoute({ lat: courierPos.lat, lng: courierPos.lng }, destination, voiceEnabled, activeOrderId)
  }, [activeOrderId, courierPos, destination, computeRoute, voiceEnabled, route])

  useEffect(() => {
    if (!activeOrderId) return
    if (!courierPos) return
    if (!destination) return
    if (!route?.line || route.line.length < 2) return

    const now = Date.now()
    const lastFrom = lastRouteFromRef.current
    if (lastFrom) {
      const moved = haversineMeters({ lat: courierPos.lat, lng: courierPos.lng }, lastFrom)
      if (moved < 25) return
    }
    const d = distanceToLineStringMeters({ lat: courierPos.lat, lng: courierPos.lng }, route.line)
    if (d < 60) return
    if (now - lastRecalcRef.current < 20000) return
    if (!onlineRef.current) return

    lastRecalcRef.current = now
    computeRoute({ lat: courierPos.lat, lng: courierPos.lng }, destination, voiceEnabled, activeOrderId)
  }, [activeOrderId, courierPos, destination, route, voiceEnabled, computeRoute])

  if (!user) {
    return <Navigate to="/connexion" replace />
  }

  if (!canAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-zinc-950 text-white">
        <div className="max-w-3xl mx-auto px-4 py-10">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-amber-300" />
              <div className="text-lg font-black">Accès refusé</div>
            </div>
            <div className="mt-2 text-sm text-zinc-300">Votre compte n’a pas le rôle livreur/ops/admin.</div>
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => {
                  const next = { ...user, role: 'livreur', roles: Array.from(new Set([...(roles || []), 'livreur'])) }
                  saveCurrentUser(next)
                  setUser(next)
                }}
                className="px-4 py-2 rounded-xl bg-emerald-500 text-emerald-950 font-black hover:bg-emerald-400"
              >
                Activer mode livreur (démo)
              </button>
              <button
                type="button"
                onClick={() => navigate('/connexion')}
                className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 font-black hover:bg-white/10"
              >
                Retour
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-zinc-950 text-white">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
              <Truck className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <div className="text-xl font-black">Écran Livreur</div>
              <div className="text-xs text-zinc-300">Compte: {String(user?.email || user?.name || courierId)}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isOnline && (
              <div className="px-3 py-2 rounded-xl bg-rose-500/15 text-rose-200 border border-rose-500/20 text-xs font-black inline-flex items-center gap-2">
                <WifiOff className="w-4 h-4" />
                Hors ligne
              </div>
            )}
            <button
              type="button"
              onClick={() => navigate('/connexion')}
              className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 font-black hover:bg-white/10"
            >
              Retour
            </button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-4" style={{ height: 'calc(100vh - 140px)' }}>
          <div className="h-full flex flex-col gap-4">
            {ordersError && <div className="px-4 py-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-200 text-sm">{ordersError}</div>}
            {gpsError && <div className="px-4 py-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-sm">GPS: {gpsError}</div>}
            {routeErrorLabel && (
              <div className="px-4 py-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-200 text-sm flex items-center justify-between gap-3">
                <div className="min-w-0">Itinéraire: {routeErrorLabel}</div>
                <button
                  type="button"
                  onClick={retryRoute}
                  className="shrink-0 px-3 py-2 rounded-xl bg-white/5 border border-white/10 font-black hover:bg-white/10 text-xs"
                >
                  Réessayer
                </button>
              </div>
            )}

            <OrdersPanel
              poolOrders={poolOrders}
              myOrders={myOrders}
              historyOrders={historyOrders}
              selectedId={selectedId}
              onSelect={(id) => setSelectedId(id)}
              onRefresh={loadOrders}
              onStart={startDelivery}
              onDelivered={markDelivered}
            />

            <VoiceGuidance
              enabled={voiceEnabled}
              onToggle={(v) => setVoiceEnabled(v)}
              courier={courierPos ? { lat: courierPos.lat, lng: courierPos.lng } : null}
              steps={route?.steps || []}
            />
          </div>

          <div className="h-full rounded-2xl border border-white/10 bg-white/5 overflow-hidden relative">
            <div className="absolute top-4 left-4 z-[500] flex flex-wrap items-center gap-2">
              <div className="px-3 py-2 rounded-xl bg-black/40 backdrop-blur border border-white/10 text-xs font-black inline-flex items-center gap-2">
                <Navigation className="w-4 h-4 text-sky-300" />
                {activeOrderId ? 'Livraison active' : 'Sélectionnez une commande'}
              </div>
              <button
                type="button"
                onClick={() => setTrackingEnabled((v) => !v)}
                className="px-3 py-2 rounded-xl bg-black/40 backdrop-blur border border-white/10 text-xs font-black hover:bg-black/50"
              >
                GPS: {trackingEnabled ? 'ON' : 'OFF'}
              </button>
              {route?.distance_m && route?.duration_s && (
                <div className="px-3 py-2 rounded-xl bg-black/40 backdrop-blur border border-white/10 text-xs font-black">
                  {(route.distance_m / 1000).toFixed(2)} km • ~{Math.round(route.duration_s / 60)} min
                </div>
              )}
              {route?.source && (
                <div className="px-3 py-2 rounded-xl bg-black/40 backdrop-blur border border-white/10 text-[11px] font-black text-zinc-200">
                  {route.region_label ? route.region_label + ' • ' : ''}{route.source}{route.fallback ? ' (fallback)' : ''}
                </div>
              )}
            </div>

            <div className="absolute inset-3">
              <CourierMap
                center={mapCenter}
                courier={courierPos ? { lat: courierPos.lat, lng: courierPos.lng } : null}
                destination={destination}
                route={route?.line || null}
              />
            </div>
          </div>
        </div>

        {loadingOrders && <div className="mt-3 text-xs text-zinc-400">Chargement…</div>}
      </div>
    </div>
  )
}
