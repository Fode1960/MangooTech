import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Navigation, Shield, Truck, WifiOff } from 'lucide-react'
import { toast } from 'sonner'
import OrdersPanel, { type Order } from '../components/courier/OrdersPanel'
import CourierMap from '../components/courier/CourierMap'
import VoiceGuidance from '../components/courier/VoiceGuidance'
import CourierLayout from '../components/courier/CourierLayout'
import CourierInvoiceModal from '../components/invoice/CourierInvoiceModal'
import { detectRegionKey, distanceToLineStringMeters, haversineMeters, type LatLng } from '../utils/geo'
import { useGeolocationWatch } from '../hooks/useGeolocationWatch'
import { fetchOrders, fetchRoute, patchOrder, type RouteGeometry } from '../services/courierApi'
import { useThemeStore } from '../stores/themeStore'
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

function getPreferredRegion(u: any): 'cm' | 'ci' | 'sn' | null {
  const r = String(u?.region || '').toLowerCase()
  if (r === 'cm' || r === 'ci' || r === 'sn') return r
  return null
}

export default function CourierScreen() {
  const navigate = useNavigate()
  const { isDark } = useThemeStore()
  const [user, setUser] = useState<any>(() => loadCurrentUser())
  const roles = useMemo(() => (Array.isArray(user?.roles) ? user.roles : user?.role ? [user.role] : []), [user])
  const canAccess = roles.includes('livreur') || roles.includes('admin') || roles.includes('ops')
  const courierId = useMemo(() => getId(user), [user])
  const preferredRegion = useMemo(() => getPreferredRegion(user), [user])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    if (params.get('demo') !== '1') return
    if (!user) return
    if (canAccess) return
    const nextRoles = Array.from(new Set([...(Array.isArray(roles) ? roles : []), 'livreur']))
    const nextUser = { ...user, role: 'livreur', roles: nextRoles }
    saveCurrentUser(nextUser)
    setUser(nextUser)
  }, [canAccess, roles, user])

  const [notificationPermission, setNotificationPermission] = useState<'default' | 'denied' | 'granted'>(() => {
    if (typeof window === 'undefined') return 'default'
    if (!('Notification' in window)) return 'denied'
    return (Notification as any).permission || 'default'
  })

  const [poolOrders, setPoolOrders] = useState<Order[]>([])
  const [myOrders, setMyOrders] = useState<Order[]>([])
  const [historyOrders, setHistoryOrders] = useState<Order[]>([])
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [ordersError, setOrdersError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const prevPoolIdsRef = useRef<Set<string> | null>(null)
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

  const [invoiceOpen, setInvoiceOpen] = useState(false)

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

  const effectiveRegion = useMemo(() => {
    if (courierPos) {
      return detectRegionKey({ lat: courierPos.lat, lng: courierPos.lng })
    }
    return preferredRegion
  }, [courierPos, preferredRegion])

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

      const region = effectiveRegion
      const [pool, mine, history] = await Promise.all([
        fetchOrders({ status: 'created', unassigned: true, region: region || undefined }),
        fetchOrders({ assignedToUserId: courierId, status: 'assigned,picked_up', region: region || undefined }),
        fetchOrders({ assignedToUserId: courierId, status: 'delivered', region: region || undefined }),
      ])

      try {
        const nextIds = new Set(pool.map((o) => String(o.id)))
        const prev = prevPoolIdsRef.current
        if (prev) {
          for (const id of nextIds) {
            if (!prev.has(id)) {
              toast.success('Nouvelle livraison à prendre', { description: String(id) })
              break
            }
          }
        }
        prevPoolIdsRef.current = nextIds
      } catch {
      }

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
  }, [selectedId, courierId, effectiveRegion])

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

  const requestBrowserNotifications = useCallback(async () => {
    try {
      if (!('Notification' in window)) {
        toast.error('Notifications non supportées sur ce navigateur')
        return
      }
      const p = await Notification.requestPermission()
      setNotificationPermission(p)
      if (p === 'granted') toast.success('Notifications activées')
      else toast.message('Notifications non activées')
    } catch {
      toast.error('Impossible d’activer les notifications')
    }
  }, [])

  const testBrowserNotification = useCallback(() => {
    toast.success('Test notification', { description: 'Si autorisé, une notification système apparaît.' })
    if (!('Notification' in window)) return
    if (notificationPermission !== 'granted') return
    try {
      const n = new Notification('Mangoo Livreur', { body: 'Test: nouvelle commande' })
      window.setTimeout(() => n.close(), 3500)
    } catch {
    }
  }, [notificationPermission])

  useEffect(() => {
    if (!canAccess) return
    let es: EventSource | null = null
    let retryTimer: number | null = null
    let closed = false

    const region = effectiveRegion
    const url = `/api/orders/stream${region ? `?region=${encodeURIComponent(region)}` : ''}`

    const connect = () => {
      if (closed) return
      try {
        es = new EventSource(url)
      } catch {
        es = null
      }
      if (!es) {
        retryTimer = window.setTimeout(connect, 2000)
        return
      }

      es.addEventListener('order_created', (evt: any) => {
        try {
          const payload = JSON.parse(String(evt?.data || '{}'))
          const next = payload?.order
          if (!next?.id) return
          if (next.status !== 'created') return
          if (next.assignedToUserId) return

          setPoolOrders((prev) => {
            if (prev.some((o) => o.id === next.id)) return prev
            return [next, ...prev]
          })

          toast.success('Nouvelle livraison à prendre', { description: String(next.id) })

          if ('Notification' in window && notificationPermission === 'granted') {
            const n = new Notification('Nouvelle livraison à prendre', { body: `Livraison ${String(next.id)}` })
            n.onclick = () => {
              try {
                window.focus()
              } catch {
              }
              setSelectedId(String(next.id))
              n.close()
            }
          }
        } catch {
        }
      })

      es.onerror = () => {
        try {
          es?.close()
        } catch {
        }
        es = null
        if (closed) return
        retryTimer = window.setTimeout(connect, 2000)
      }
    }

    connect()

    return () => {
      closed = true
      if (retryTimer) window.clearTimeout(retryTimer)
      try {
        es?.close()
      } catch {
      }
    }
  }, [canAccess, effectiveRegion, notificationPermission])

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
    return (
      <CourierLayout title="Espace livreur" subtitle="Créez votre profil ou connectez-vous.">
        <div className="max-w-3xl mx-auto">
          <div className={`rounded-2xl border p-6 ${isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-white shadow-xl'}`}>
            <div className="flex items-center gap-3">
              <Truck className={`w-7 h-7 ${isDark ? 'text-emerald-300' : 'text-emerald-600'}`} />
              <div>
                <div className="text-lg font-black">Bienvenue</div>
                <div className={`text-sm ${isDark ? 'text-zinc-300' : 'text-gray-600'}`}>Inscrivez-vous puis ouvrez votre espace Livrer.</div>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => navigate('/livreur/inscription')}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-emerald-500 text-white font-black hover:from-orange-600 hover:to-emerald-600"
              >
                Créer mon compte livreur
              </button>
              <button
                type="button"
                onClick={() => navigate('/connexion')}
                className={`px-4 py-2 rounded-xl font-black transition-colors ${isDark ? 'bg-white/5 border border-white/10 hover:bg-white/10 text-white' : 'bg-white border border-gray-200 hover:bg-gray-50 text-gray-900'}`}
              >
                Se connecter
              </button>
            </div>
          </div>
        </div>
      </CourierLayout>
    )
  }

  if (!canAccess) {
    return (
      <CourierLayout title="Accès refusé" subtitle="Votre compte n’a pas le rôle livreur/ops/admin.">
        <div className="max-w-3xl mx-auto">
          <div className={`rounded-2xl border p-6 ${isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-white shadow-xl'}`}>
            <div className="flex items-center gap-3">
              <Shield className={`w-6 h-6 ${isDark ? 'text-amber-300' : 'text-amber-600'}`} />
              <div className="text-lg font-black">Accès refusé</div>
            </div>
            <div className={`mt-2 text-sm ${isDark ? 'text-zinc-300' : 'text-gray-600'}`}>Activez le rôle livreur ou créez un compte livreur.</div>
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => navigate('/livreur/inscription')}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-emerald-500 text-white font-black hover:from-orange-600 hover:to-emerald-600"
              >
                Créer un compte livreur
              </button>
              <button
                type="button"
                onClick={() => {
                  const next = { ...user, role: 'livreur', roles: Array.from(new Set([...(roles || []), 'livreur'])) }
                  saveCurrentUser(next)
                  setUser(next)
                }}
                className={`px-4 py-2 rounded-xl font-black transition-colors ${isDark ? 'bg-emerald-500 text-emerald-950 hover:bg-emerald-400' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
              >
                Activer mode livreur (démo)
              </button>
              <button
                type="button"
                onClick={() => navigate('/connexion')}
                className={`px-4 py-2 rounded-xl font-black transition-colors ${isDark ? 'bg-white/5 border border-white/10 hover:bg-white/10 text-white' : 'bg-white border border-gray-200 hover:bg-gray-50 text-gray-900'}`}
              >
                Retour
              </button>
            </div>
          </div>
        </div>
      </CourierLayout>
    )
  }

  return (
    <CourierLayout title="Espace livreur" subtitle={`Compte: ${String(user?.email || user?.name || courierId)}`}>
      {!isOnline && (
        <div className={`mb-4 px-4 py-3 rounded-2xl border text-sm font-black inline-flex items-center gap-2 ${isDark ? 'bg-rose-500/15 text-rose-200 border-rose-500/20' : 'bg-rose-50 text-rose-800 border-rose-200'}`}>
          <WifiOff className="w-4 h-4" />
          Hors ligne
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-4" style={{ minHeight: 'calc(100vh - 160px)' }}>
          <div className="h-full flex flex-col gap-4">
            {notificationPermission !== 'granted' ? (
              <div className={`px-4 py-3 rounded-2xl border text-sm flex items-center justify-between gap-3 ${isDark ? 'bg-sky-500/10 border-sky-500/20 text-sky-100' : 'bg-sky-50 border-sky-200 text-sky-900'}`}>
                <div className="min-w-0">Notifications: activez pour être alerté quand une commande arrive.</div>
                <button
                  type="button"
                  onClick={requestBrowserNotifications}
                  className={`shrink-0 px-3 py-2 rounded-xl font-black text-xs transition-colors ${isDark ? 'bg-white/5 border border-white/10 hover:bg-white/10' : 'bg-white border border-sky-200 hover:bg-sky-100'}`}
                >
                  Activer
                </button>
              </div>
            ) : (
              <div className={`px-4 py-3 rounded-2xl border text-sm flex items-center justify-between gap-3 ${isDark ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-100' : 'bg-emerald-50 border-emerald-200 text-emerald-900'}`}>
                <div className="min-w-0">Notifications: activées.</div>
                <button
                  type="button"
                  onClick={testBrowserNotification}
                  className={`shrink-0 px-3 py-2 rounded-xl font-black text-xs transition-colors ${isDark ? 'bg-white/5 border border-white/10 hover:bg-white/10' : 'bg-white border border-emerald-200 hover:bg-emerald-100'}`}
                >
                  Tester
                </button>
              </div>
            )}
            {ordersError && (
              <div className={`px-4 py-3 rounded-2xl border text-sm ${isDark ? 'bg-rose-500/10 border-rose-500/20 text-rose-200' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>{ordersError}</div>
            )}
            {gpsError && (
              <div className={`px-4 py-3 rounded-2xl border text-sm ${isDark ? 'bg-amber-500/10 border-amber-500/20 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>GPS: {gpsError}</div>
            )}
            {routeErrorLabel && (
              <div className={`px-4 py-3 rounded-2xl border text-sm flex items-center justify-between gap-3 ${isDark ? 'bg-rose-500/10 border-rose-500/20 text-rose-200' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
                <div className="min-w-0">Itinéraire: {routeErrorLabel}</div>
                <button
                  type="button"
                  onClick={retryRoute}
                  className={`shrink-0 px-3 py-2 rounded-xl font-black text-xs transition-colors ${isDark ? 'bg-white/5 border border-white/10 hover:bg-white/10' : 'bg-white border border-rose-200 hover:bg-rose-100'}`}
                >
                  Réessayer
                </button>
              </div>
            )}

            {(selectedOrder || activeOrder) && (
              <button
                type="button"
                onClick={() => setInvoiceOpen(true)}
                className={`w-full px-4 py-3 rounded-2xl font-black transition-colors ${isDark ? 'bg-white/5 border border-white/10 hover:bg-white/10 text-white' : 'bg-white border border-gray-200 hover:bg-gray-50 text-gray-900'}`}
                title="Voir la fiche livreur"
              >
                🧾 Fiche livreur
              </button>
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

            <CourierInvoiceModal
              open={invoiceOpen}
              onClose={() => setInvoiceOpen(false)}
              order={(activeOrder || selectedOrder) as any}
            />
          </div>

          <div className={`h-full rounded-2xl border overflow-hidden relative ${isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-white shadow-xl'}`}>
            <div className="absolute top-4 left-4 z-[500] flex flex-wrap items-center gap-2">
              <div className={`px-3 py-2 rounded-xl backdrop-blur border text-xs font-black inline-flex items-center gap-2 ${isDark ? 'bg-black/40 border-white/10 text-white' : 'bg-white/70 border-gray-200 text-gray-900'}`}>
                <Navigation className={`w-4 h-4 ${isDark ? 'text-sky-300' : 'text-sky-600'}`} />
                {activeOrderId ? 'Livraison active' : 'Sélectionnez une commande'}
              </div>
              <button
                type="button"
                onClick={() => setTrackingEnabled((v) => !v)}
                className={`px-3 py-2 rounded-xl backdrop-blur border text-xs font-black transition-colors ${isDark ? 'bg-black/40 border-white/10 hover:bg-black/50 text-white' : 'bg-white/70 border-gray-200 hover:bg-white text-gray-900'}`}
              >
                GPS: {trackingEnabled ? 'ON' : 'OFF'}
              </button>
              {route?.distance_m && route?.duration_s && (
                <div className={`px-3 py-2 rounded-xl backdrop-blur border text-xs font-black ${isDark ? 'bg-black/40 border-white/10 text-white' : 'bg-white/70 border-gray-200 text-gray-900'}`}>
                  {(route.distance_m / 1000).toFixed(2)} km • ~{Math.round(route.duration_s / 60)} min
                </div>
              )}
              {route?.source && (
                <div className={`px-3 py-2 rounded-xl backdrop-blur border text-[11px] font-black ${isDark ? 'bg-black/40 border-white/10 text-zinc-200' : 'bg-white/70 border-gray-200 text-gray-800'}`}>
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

        {loadingOrders && <div className={`mt-3 text-xs ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>Chargement…</div>}
    </CourierLayout>
  )
}
