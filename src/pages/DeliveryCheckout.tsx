import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, MapPin, Navigation, Package, Truck } from 'lucide-react'
import { createOrder } from '../services/courierApi'
import { detectRegionKey, haversineMeters, type LatLng } from '../utils/geo'

const PICKUP_POINTS: Record<'cm' | 'ci' | 'sn', LatLng> = {
  cm: { lat: 4.051056, lng: 9.767869 },
  ci: { lat: 5.32, lng: -4.03 },
  sn: { lat: 14.7167, lng: -17.4677 },
}

function vatRateForRegion(region: 'cm' | 'ci' | 'sn' | null): number {
  if (region === 'cm') return 0.1925
  if (region === 'ci') return 0.18
  if (region === 'sn') return 0.18
  return 0.18
}

function roundFcfa(n: number): number {
  if (!Number.isFinite(n)) return 0
  return Math.round(n / 100) * 100
}

function calcVatIncluded(ttc: number, rate: number): number {
  if (!Number.isFinite(ttc) || ttc <= 0) return 0
  if (!Number.isFinite(rate) || rate <= 0) return 0
  return Math.round(ttc - ttc / (1 + rate))
}

function readClientId(): string {
  try {
    const raw = localStorage.getItem('mangoo-current-user')
    const u = raw ? JSON.parse(raw) : null
    if (u && (u.role === 'client' || u.role === 'customer')) {
      return String(u.id || u.email || 'client')
    }
  } catch {
  }
  try {
    const raw = localStorage.getItem('mangoo-checkout-client')
    const u = raw ? JSON.parse(raw) : null
    if (u?.id) return String(u.id)
  } catch {
  }
  const id = `client_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
  try {
    localStorage.setItem('mangoo-checkout-client', JSON.stringify({ id, createdAt: new Date().toISOString() }))
  } catch {
  }
  return id
}

function parseLatLng(v: string): number | null {
  const t = String(v || '').trim().replace(',', '.')
  const n = Number(t)
  if (!Number.isFinite(n)) return null
  return n
}

type LocalStop = {
  kind: 'vendor' | 'client'
  vendorId?: string | null
  name?: string | null
  phone?: string | null
  lat?: number | null
  lng?: number | null
  address?: string | null
}

type DeliverySourceContext = {
  sourceOrder: any | null
  vendorId: string | null
  vendorKind: 'shop' | 'provider' | null
  vendorName: string | null
  shopSlug: string | null
  pickup: LocalStop | null
  customerId: string | null
  customerEmail: string | null
  customerName: string | null
  customerPhone: string | null
  customerAddress: string | null
}

function readJson(key: string): any {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function normalizeVendorId(value: unknown): string | null {
  const raw = String(value || '').trim()
  if (!raw) return null
  const cleaned = raw
    .replace(/^shop:/i, '')
    .replace(/^provider:/i, '')
    .replace(/^shop-/i, '')
    .trim()
  return cleaned || null
}

function normalizePhone(value: unknown): string | null {
  const v = String(value || '').trim()
  return v || null
}

function normalizeText(value: unknown): string | null {
  const v = String(value || '').trim()
  return v || null
}

function normalizeSlug(value: unknown): string | null {
  const v = String(value || '').trim().toLowerCase()
  return v || null
}

function readShopDirectory(): any[] {
  const demoShops = readJson('demo_shops')
  const cache = readJson('mangoo_shops_directory_cache_v1')
  const fromDemo = Array.isArray(demoShops) ? demoShops : []
  const fromCache = Array.isArray(cache?.shops) ? cache.shops : []
  return [...fromDemo, ...fromCache].filter((entry) => entry && typeof entry === 'object')
}

function readVendorDirectory(): any[] {
  const legacy = readJson('mangoo_vendors')
  const custom = readJson('mangoo_custom_vendors')
  const fromLegacy = Array.isArray(legacy) ? legacy : []
  const fromCustom = Array.isArray(custom) ? custom : []
  return [...fromLegacy, ...fromCustom].filter((entry) => entry && typeof entry === 'object')
}

function buildPickupFromEntry(entry: any, fallbackKind: 'shop' | 'provider' = 'shop'): LocalStop | null {
  if (!entry || typeof entry !== 'object') return null
  const lat = parseLatLng(String(entry?.lat ?? entry?.latitude ?? ''))
  const lng = parseLatLng(String(entry?.lng ?? entry?.longitude ?? ''))
  const vendorId = normalizeVendorId(entry?.sourceVendorId ?? entry?.source_vendor_id ?? entry?.vendorId ?? entry?.vendor_id ?? entry?.id)
  return {
    kind: 'vendor',
    vendorId,
    name: normalizeText(entry?.name ?? entry?.title ?? entry?.shopName) || 'Boutique',
    phone: normalizePhone(entry?.phone ?? entry?.phoneNumber ?? entry?.contact_phone),
    lat,
    lng,
    address: normalizeText(entry?.address ?? entry?.location ?? entry?.city),
    ...(fallbackKind === 'provider' ? {} : {}),
  }
}

function resolveDeliverySourceContext(sourcePayload: any): DeliverySourceContext {
  const order = sourcePayload?.order && typeof sourcePayload.order === 'object' ? sourcePayload.order : null
  const items = Array.isArray(order?.items) ? order.items : []
  const customerId = normalizeText(sourcePayload?.user?.id ?? order?.customerId ?? order?.customerEmail)
  const customerEmail = normalizeText(sourcePayload?.user?.email ?? order?.customerEmail)
  const customerName = normalizeText(sourcePayload?.user?.name)
    || normalizeText(order?.customerName)
  const customerPhone = normalizePhone(sourcePayload?.user?.phone)
    || normalizePhone(order?.customerPhone)
  const customerAddress = normalizeText(sourcePayload?.user?.address)
    || normalizeText(order?.customerAddress)

  const vendorIdCandidates = new Set<string>()
  const shopSlugCandidates = new Set<string>()
  const vendorNameCandidates = new Set<string>()

  const collectVendorId = (value: unknown) => {
    const next = normalizeVendorId(value)
    if (next) vendorIdCandidates.add(next)
  }
  const collectShopSlug = (value: unknown) => {
    const next = normalizeSlug(value)
    if (next) shopSlugCandidates.add(next)
  }
  const collectVendorName = (value: unknown) => {
    const next = normalizeText(value)?.toLowerCase()
    if (next) vendorNameCandidates.add(next)
  }

  collectVendorId(order?.vendorId)
  collectVendorId(order?.vendor_id)
  collectVendorId(order?.sourceVendorId)
  collectVendorId(order?.source_vendor_id)
  collectShopSlug(order?.shopSlug)
  collectShopSlug(order?.shop_slug)
  collectVendorName(order?.vendorName)
  collectVendorName(order?.vendor_name)

  items.forEach((item: any) => {
    collectVendorId(item?.vendorId)
    collectVendorId(item?.vendor_id)
    collectVendorId(item?.sourceVendorId)
    collectVendorId(item?.source_vendor_id)
    collectShopSlug(item?.shopSlug)
    collectShopSlug(item?.shop_slug)
    collectVendorName(item?.vendorName)
    collectVendorName(item?.vendor)
  })

  const shops = readShopDirectory()
  const vendors = readVendorDirectory()

  const matchedShop = shops.find((entry) => {
    const slug = normalizeSlug(entry?.slug)
    return Boolean(slug && shopSlugCandidates.has(slug))
  }) || null

  const matchedVendorById = vendors.find((entry) => {
    const id = normalizeVendorId(entry?.id ?? entry?.vendorId ?? entry?.vendor_id)
    return Boolean(id && vendorIdCandidates.has(id))
  }) || null

  const matchedVendorByName = vendors.find((entry) => {
    const name = normalizeText(entry?.name ?? entry?.title ?? entry?.trade)?.toLowerCase()
    return Boolean(name && vendorNameCandidates.has(name))
  }) || null

  const matchedVendor = matchedVendorById || matchedVendorByName || null

  const shopPickup = buildPickupFromEntry(matchedShop, 'shop')
  const vendorPickup = buildPickupFromEntry(matchedVendor, String(matchedVendor?.kind || '') === 'provider' ? 'provider' : 'shop')
  const pickup = shopPickup || vendorPickup

  const vendorId = normalizeVendorId(
    pickup?.vendorId
      || matchedShop?.sourceVendorId
      || matchedShop?.source_vendor_id
      || matchedShop?.vendorId
      || matchedShop?.vendor_id
      || matchedVendor?.id
      || order?.vendorId
      || order?.vendor_id
  )

  return {
    sourceOrder: order,
    vendorId,
    vendorKind: matchedVendor?.kind === 'provider' ? 'provider' : 'shop',
    vendorName: normalizeText(
      pickup?.name
      || matchedShop?.name
      || matchedVendor?.name
      || matchedVendor?.trade
      || order?.vendorName
    ),
    shopSlug: normalizeSlug(matchedShop?.slug || order?.shopSlug || order?.shop_slug),
    pickup: pickup ? { ...pickup, vendorId } : null,
    customerId,
    customerEmail,
    customerName,
    customerPhone,
    customerAddress,
  }
}

export default function DeliveryCheckout() {
  const navigate = useNavigate()
  const [lat, setLat] = useState('48.893546')
  const [lng, setLng] = useState('2.376986')
  const [note, setNote] = useState('')
  const [addressText, setAddressText] = useState('')
  const [sourceOrderId, setSourceOrderId] = useState<string | null>(null)
  const [sourcePayload, setSourcePayload] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    try {
      window.scrollTo(0, 0)
    } catch {
    }
    const params = new URLSearchParams(window.location.search)
    const orderId = params.get('orderId')
    if (orderId) setSourceOrderId(orderId)

    try {
      const raw = localStorage.getItem('mangoo-current-user')
      const u = raw ? JSON.parse(raw) : null
      const addr = String(u?.address || '').trim()
      if (addr) setAddressText(addr)
    } catch {
    }

    try {
      const raw = localStorage.getItem('mangoo-delivery-source-order')
      const data = raw ? JSON.parse(raw) : null
      const o = data?.order
      if (o?.id && String(o.id) === String(orderId || o.id)) {
        setSourcePayload(data)
        const deliveryAddress = String(data?.user?.address || o?.customerAddress || '').trim()
        if (deliveryAddress) setAddressText(deliveryAddress)
        const items = Array.isArray(o.items) ? o.items : []
        const firstNames = items.slice(0, 3).map((it: any) => `${String(it?.name || '').trim()}×${Number(it?.qty || 0) || 0}`).filter(Boolean)
        const summary = firstNames.length ? `Articles: ${firstNames.join(', ')}` : ''
        const base = `Commande: ${String(o.id)}`
        const nextNote = [base, summary].filter(Boolean).join('\n')
        if (nextNote && !note) setNote(nextNote)
      }
    } catch {
    }
  }, [note])

  const canSubmit = useMemo(() => {
    const la = parseLatLng(lat)
    const lo = parseLatLng(lng)
    return la !== null && lo !== null && Math.abs(la) <= 90 && Math.abs(lo) <= 180
  }, [lat, lng])

  const deliveryQuote = useMemo(() => {
    const la = parseLatLng(lat)
    const lo = parseLatLng(lng)
    if (la === null || lo === null) return null
    const dest: LatLng = { lat: la, lng: lo }
    const region = detectRegionKey(dest)
    const vatRate = vatRateForRegion(region)
    const baseFee = 2000
    const perKmFee = 500
    const minimumFee = 1500
    const maximumFee = 15000
    const distanceKm = region ? haversineMeters(PICKUP_POINTS[region], dest) / 1000 : 0
    const feeRaw = baseFee + distanceKm * perKmFee
    const feeFcfa = Math.max(minimumFee, Math.min(maximumFee, roundFcfa(feeRaw)))
    const vatFcfa = calcVatIncluded(feeFcfa, vatRate)
    return { region, distanceKm, feeFcfa, vatRate, vatFcfa }
  }, [lat, lng])

  const sourceContext = useMemo(() => resolveDeliverySourceContext(sourcePayload), [sourcePayload])

  const useMyPosition = useCallback(async () => {
    setError(null)
    if (!('geolocation' in navigator)) {
      setError('Géolocalisation indisponible sur ce navigateur')
      return
    }
    setLoading(true)
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 9000,
          maximumAge: 60000,
        })
      })
      setLat(String(pos.coords.latitude))
      setLng(String(pos.coords.longitude))
    } catch (e: any) {
      setError(String(e?.message || e))
    } finally {
      setLoading(false)
    }
  }, [])

  const submit = useCallback(async () => {
    setError(null)
    if (!canSubmit) return
    setLoading(true)
    try {
      const latitude = parseLatLng(lat) as number
      const longitude = parseLatLng(lng) as number
      const userId = sourceContext.customerId || sourceContext.customerEmail || readClientId()
      const feeLine = deliveryQuote ? `Frais livraison: ${deliveryQuote.feeFcfa.toLocaleString('fr-FR')} FCFA` : null
      const vatLine = deliveryQuote ? `TVA (${Math.round(deliveryQuote.vatRate * 100)}%): ${deliveryQuote.vatFcfa.toLocaleString('fr-FR')} FCFA` : null
      const parts = [
        note.trim() || null,
        sourceOrderId ? `Commande: ${sourceOrderId}` : null,
        sourceContext.vendorName ? `Vendeur: ${sourceContext.vendorName}` : null,
        addressText.trim() ? `Adresse: ${addressText.trim()}` : null,
        feeLine,
        vatLine,
      ].filter(Boolean)
      const fullNote = parts.join('\n')
      const order = await createOrder({
        userId,
        vendorId: sourceContext.vendorId,
        vendorKind: sourceContext.vendorKind,
        vendorName: sourceContext.vendorName,
        sourceOrderId,
        sourceOrder: sourceContext.sourceOrder,
        feeFcfa: deliveryQuote?.feeFcfa ?? null,
        note: fullNote || null,
        pickup: sourceContext.pickup,
        customer: {
          kind: 'client',
          name: sourceContext.customerName || 'Client',
          phone: sourceContext.customerPhone,
          lat: latitude,
          lng: longitude,
          address: String(addressText || '').trim() || sourceContext.customerAddress || null,
        },
        delivery: {
          source: 'manual',
          capturedAt: new Date().toISOString(),
          position: { latitude, longitude, accuracy: 20 },
        },
      })

      if (sourceOrderId && deliveryQuote) {
        try {
          const raw = localStorage.getItem('mangoo-delivery-by-order')
          const data = raw ? JSON.parse(raw) : {}
          const map = data && typeof data === 'object' ? data : {}
          map[String(sourceOrderId)] = {
            commerceOrderId: String(sourceOrderId),
            courierOrderId: String(order.id),
            feeFcfa: deliveryQuote.feeFcfa,
            vatRate: deliveryQuote.vatRate,
            vatFcfa: deliveryQuote.vatFcfa,
            address: String(addressText || '').trim() || null,
            destination: { latitude, longitude },
            createdAt: new Date().toISOString(),
          }
          localStorage.setItem('mangoo-delivery-by-order', JSON.stringify(map))
        } catch {
        }
      }
      navigate(`/commande/${encodeURIComponent(String(order.id))}`, { replace: true })
    } catch (e: any) {
      setError(String(e?.message || e))
    } finally {
      setLoading(false)
    }
  }, [addressText, canSubmit, deliveryQuote, lat, lng, navigate, note, sourceContext, sourceOrderId])

  const goBack = useCallback(() => {
    try {
      const referrer = typeof document !== 'undefined' ? String(document.referrer || '') : ''
      const sameOrigin = referrer.startsWith(window.location.origin)
      if (sameOrigin && window.history.length > 1) {
        navigate(-1)
        return
      }
    } catch {
    }
    navigate('/')
  }, [navigate])

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-emerald-50 text-gray-900">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white border border-orange-100 shadow-sm flex items-center justify-center">
              <Package className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <div className="text-2xl font-black">Demander une livraison</div>
              <div className="text-sm text-gray-600">Entrez la destination, puis appuyez sur Envoyer.</div>
            </div>
          </div>

          <button
            type="button"
            onClick={goBack}
            className="px-4 py-2 rounded-xl bg-white border border-gray-200 font-black hover:bg-gray-50 inline-flex items-center gap-2 shadow-sm"
            title="Retour"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </button>
        </div>

        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-xl">
          {error && <div className="px-4 py-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">{error}</div>}

          {sourceOrderId && (
            <div className="mt-4 px-4 py-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-black">
              Livraison pour la commande: {sourceOrderId}
            </div>
          )}

          {deliveryQuote && (
            <div className="mt-4 px-4 py-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="font-black">Frais livraison</div>
                <div className="font-black text-emerald-700">{deliveryQuote.feeFcfa.toLocaleString('fr-FR')} FCFA</div>
              </div>
              <div className="mt-1 text-xs text-gray-600">
                TVA incluse ({Math.round(deliveryQuote.vatRate * 100)}%): {deliveryQuote.vatFcfa.toLocaleString('fr-FR')} FCFA
                {deliveryQuote.region ? ` • Zone: ${deliveryQuote.region.toUpperCase()}` : ''}
              </div>
            </div>
          )}

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-xs font-black text-gray-600">Latitude destination</div>
              <div className="mt-2 flex items-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 px-3 py-3">
                <MapPin className="w-5 h-5 text-gray-400" />
                <input value={lat} onChange={(e) => setLat(e.target.value)} className="w-full bg-transparent outline-none text-sm text-gray-900 placeholder:text-gray-400" placeholder="48.893546" />
              </div>
            </div>
            <div>
              <div className="text-xs font-black text-gray-600">Longitude destination</div>
              <div className="mt-2 flex items-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 px-3 py-3">
                <Navigation className="w-5 h-5 text-gray-400" />
                <input value={lng} onChange={(e) => setLng(e.target.value)} className="w-full bg-transparent outline-none text-sm text-gray-900 placeholder:text-gray-400" placeholder="2.376986" />
              </div>
            </div>
          </div>

          <div className="mt-4">
            <div className="text-xs font-black text-gray-600">Note (optionnel)</div>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="mt-2 w-full min-h-[88px] px-3 py-3 rounded-2xl bg-gray-50 border border-gray-200 outline-none text-sm text-gray-900 placeholder:text-gray-400"
              placeholder="Ex: Laisser à la réception"
            />
          </div>

          <div className="mt-4">
            <div className="text-xs font-black text-gray-600">Adresse (optionnel)</div>
            <input
              value={addressText}
              onChange={(e) => setAddressText(e.target.value)}
              className="mt-2 w-full px-3 py-3 rounded-2xl bg-gray-50 border border-gray-200 outline-none text-sm text-gray-900 placeholder:text-gray-400"
              placeholder="Ex: Quartier, rue, repère (à côté de...)"
            />
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={useMyPosition}
              className="px-4 py-2 rounded-xl bg-white border border-gray-200 font-black hover:bg-gray-50 shadow-sm"
              disabled={loading}
            >
              Destination = ma position
            </button>
            <button
              type="button"
              onClick={submit}
              className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-black hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={!canSubmit || loading}
            >
              {loading ? 'Envoi…' : 'Envoyer la demande'}
            </button>
          </div>

          <div className="mt-5 rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center gap-2 text-sm font-black">
              <Truck className="w-5 h-5 text-emerald-600" />
              Alerte en temps réel
            </div>
            <div className="mt-1 text-xs text-gray-600">Une fois envoyée, la livraison apparaît immédiatement sur <span className="font-black text-gray-900">/livreur</span>.</div>
          </div>
        </div>
      </div>
    </div>
  )
}
