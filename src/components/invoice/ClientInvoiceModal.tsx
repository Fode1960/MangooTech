import React, { useMemo } from 'react'
import { X } from 'lucide-react'
import { useThemeStore } from '../../stores/themeStore'
import mangooLogoUrl from '../../assets/mangoo-logo.svg'

type Client = {
  name?: string
  email?: string
  phone?: string
  address?: string
}

type OrderItem = {
  name: string
  qty: number
  unitPriceCents: number
  currency?: string
  shopSlug?: string | null
  vendorName?: string | null
  vendorCountry?: string | null
}

type ClientOrder = {
  id: string
  createdAt: string
  status: string
  currency: string
  totalCents: number
  items: OrderItem[]
}

type DeliveryInfo = {
  commerceOrderId: string
  courierOrderId: string
  feeFcfa: number
  vatRate: number
  vatFcfa: number
  address?: string | null
  createdAt?: string
}

type VendorInfo = {
  shopSlug: string
  name: string
  country: 'sn' | 'ci' | 'cm'
  legalName?: string | null
  registrationId?: string | null
  taxId?: string | null
  address?: string | null
  phone?: string | null
}

type Props = {
  open: boolean
  onClose: () => void
  client: Client
  order: ClientOrder | null
}

function calcVatIncluded(ttc: number, rate: number): number {
  if (!Number.isFinite(ttc) || ttc <= 0) return 0
  if (!Number.isFinite(rate) || rate <= 0) return 0
  return Math.round(ttc - ttc / (1 + rate))
}

function formatFcfa(n: number): string {
  const v = Number(n)
  if (!Number.isFinite(v)) return '0 FCFA'
  return `${Math.round(v).toLocaleString('fr-FR')} FCFA`
}

function readDeliveryInfo(orderId: string): DeliveryInfo | null {
  try {
    const raw = localStorage.getItem('mangoo-delivery-by-order')
    const data = raw ? JSON.parse(raw) : null
    const entry = data && typeof data === 'object' ? (data as any)[String(orderId)] : null
    if (!entry) return null
    if (!entry.courierOrderId) return null
    return {
      commerceOrderId: String(entry.commerceOrderId || orderId),
      courierOrderId: String(entry.courierOrderId),
      feeFcfa: Number(entry.feeFcfa || 0) || 0,
      vatRate: Number(entry.vatRate || 0) || 0,
      vatFcfa: Number(entry.vatFcfa || 0) || 0,
      address: entry.address ? String(entry.address) : null,
      createdAt: entry.createdAt ? String(entry.createdAt) : undefined,
    }
  } catch {
    return null
  }
}

function readShops(): any[] {
  try {
    const raw = localStorage.getItem('demo_shops')
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function pickCountry(value: any): 'sn' | 'ci' | 'cm' {
  const v = String(value || '').toLowerCase()
  if (v === 'sn' || v === 'ci' || v === 'cm') return v
  return 'ci'
}

function vatRateForCountry(country: 'sn' | 'ci' | 'cm'): number {
  if (country === 'cm') return 0.1925
  return 0.18
}

export default function ClientInvoiceModal({ open, onClose, client, order }: Props) {
  const { isDark } = useThemeStore()

  const delivery = useMemo(() => {
    if (!order?.id) return null
    return readDeliveryInfo(order.id)
  }, [order?.id])

  const vendors = useMemo<VendorInfo[]>(() => {
    if (!order?.items?.length) return []
    const shops = readShops()
    const map = new Map<string, VendorInfo>()
    for (const it of order.items as any[]) {
      const slug = String(it?.shopSlug || '').trim()
      const fallbackName = String(it?.vendorName || '').trim()
      if (!slug && !fallbackName) continue
      if (slug && map.has(slug)) continue
      if (slug) {
        const s = shops.find((x) => String(x?.slug || '') === slug) || null
        map.set(slug, {
          shopSlug: slug,
          name: String(s?.name || fallbackName || slug),
          country: pickCountry(s?.billingCountry || it?.vendorCountry),
          legalName: s?.billingLegalName ? String(s.billingLegalName) : null,
          registrationId: s?.billingRegistrationId ? String(s.billingRegistrationId) : null,
          taxId: s?.billingTaxId ? String(s.billingTaxId) : null,
          address: s?.billingAddress ? String(s.billingAddress) : null,
          phone: s?.billingPhone ? String(s.billingPhone) : null,
        })
        continue
      }
      const key = `vendor:${fallbackName}`
      if (map.has(key)) continue
      map.set(key, {
        shopSlug: '',
        name: fallbackName,
        country: pickCountry(it?.vendorCountry),
        legalName: null,
        registrationId: null,
        taxId: null,
        address: null,
        phone: null,
      })
    }
    return Array.from(map.values())
  }, [order?.items])

  const vatRate = useMemo(() => {
    if (delivery?.vatRate) return delivery.vatRate
    const first = vendors[0]
    if (first?.country) return vatRateForCountry(first.country)
    return 0.18
  }, [delivery?.vatRate, vendors])

  const itemsTtc = useMemo(() => {
    if (!order) return 0
    const fromItems = Array.isArray(order.items)
      ? order.items.reduce((sum, it) => sum + Math.round(((it.unitPriceCents || 0) * (it.qty || 0)) / 100), 0)
      : 0
    const fallback = Math.round((order.totalCents || 0) / 100)
    return fromItems > 0 ? fromItems : fallback
  }, [order])

  const deliveryTtc = useMemo(() => (delivery?.feeFcfa || 0), [delivery?.feeFcfa])

  const vatItems = useMemo(() => calcVatIncluded(itemsTtc, vatRate), [itemsTtc, vatRate])
  const vatDelivery = useMemo(() => (delivery?.vatFcfa ? Number(delivery.vatFcfa) : calcVatIncluded(deliveryTtc, vatRate)), [delivery?.vatFcfa, deliveryTtc, vatRate])

  const totalTtc = useMemo(() => itemsTtc + deliveryTtc, [itemsTtc, deliveryTtc])
  const totalVat = useMemo(() => vatItems + vatDelivery, [vatItems, vatDelivery])
  const totalHt = useMemo(() => Math.max(0, totalTtc - totalVat), [totalTtc, totalVat])

  if (!open || !order) return null

  return (
    <div className="fixed inset-0 z-[1000] bg-black/60 p-4 overflow-y-auto">
      <div className="min-h-[calc(100vh-2rem)] flex items-start justify-center">
        <div className={`w-full max-w-3xl rounded-2xl border shadow-2xl overflow-hidden max-h-[calc(100vh-2rem)] flex flex-col ${isDark ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'}`}>
          <div className={`px-5 py-4 border-b flex items-center justify-between shrink-0 ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
            <div>
              <div className="text-lg font-black">Facture client</div>
              <div className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Commande: {order.id} • {new Date(order.createdAt).toLocaleString('fr-FR')}</div>
              {vendors.length > 0 && (
                <div className={`mt-1 text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  Facture émise par <span className="font-black">MangooTech</span> pour le compte de{' '}
                  <span className="font-black">{vendors.map((v) => v.name).join(', ')}</span>
                </div>
              )}
            </div>
            <button type="button" onClick={onClose} className={`p-2 rounded-xl ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`} title="Fermer">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-5 overflow-y-auto">
            <div className={`rounded-2xl border p-4 ${isDark ? 'border-gray-800 bg-gray-950/20' : 'border-gray-200 bg-gray-50'}`}>
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                <div>
                  <div className="flex items-center gap-3">
                    <img src={mangooLogoUrl} alt="MangooTech" className="w-9 h-9 rounded-full" />
                    <div className="text-xl font-black">MangooTech</div>
                  </div>
                  <div className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Plateforme • Mandat de facturation</div>
                  {vendors.length > 0 ? (
                    <div className={`mt-1 text-xs ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Pour le compte de: <span className="font-black">{vendors.map((v) => v.legalName || v.name).join(', ')}</span>
                    </div>
                  ) : null}
                </div>
                <div className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  <div>
                    <span className="font-black">N° facture:</span> inv_{order.id}
                  </div>
                  <div>
                    <span className="font-black">Date:</span> {new Date(order.createdAt).toLocaleDateString('fr-FR')}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className={`rounded-2xl border p-4 ${isDark ? 'border-gray-800 bg-gray-950/20' : 'border-gray-200 bg-gray-50'}`}>
              <div className="text-xs font-black">Client</div>
              <div className="mt-1 text-sm font-black">{String(client?.name || 'Client')}</div>
              <div className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{String(client?.email || '')}</div>
              {client?.phone ? <div className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{String(client.phone)}</div> : null}
              {client?.address ? <div className={`mt-1 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Adresse: {String(client.address)}</div> : null}
            </div>

            <div className={`rounded-2xl border p-4 ${isDark ? 'border-gray-800 bg-gray-950/20' : 'border-gray-200 bg-gray-50'}`}>
              <div className="text-xs font-black">Paiement</div>
              <div className={`mt-1 text-sm font-black ${String(order.status) === 'paid' ? 'text-emerald-400' : ''}`}>{String(order.status)}</div>
              {delivery?.courierOrderId ? (
                <div className={`mt-2 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Livraison: {delivery.courierOrderId}</div>
              ) : (
                <div className={`mt-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Livraison: non demandée</div>
              )}
            </div>
          </div>

          {vendors.length > 0 && (
            <div className={`mt-4 rounded-2xl border p-4 ${isDark ? 'border-gray-800 bg-gray-950/20' : 'border-gray-200 bg-gray-50'}`}>
              <div className="text-xs font-black">Vendeur(s)</div>
              <div className="mt-2 space-y-3">
                {vendors.map((v) => (
                  <div key={v.shopSlug || v.name} className={`rounded-xl border p-3 ${isDark ? 'border-gray-800 bg-black/10' : 'border-gray-200 bg-white'}`}>
                    <div className="font-black text-sm">{v.legalName || v.name}</div>
                    <div className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Pays: {v.country.toUpperCase()} • TVA: {Math.round(vatRateForCountry(v.country) * 100)}%</div>
                    {v.registrationId ? <div className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{v.registrationId}</div> : null}
                    {v.taxId ? <div className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{v.taxId}</div> : null}
                    {v.address ? <div className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{v.address}</div> : null}
                    {v.phone ? <div className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{v.phone}</div> : null}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className={`mt-4 rounded-2xl border overflow-hidden ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
            <div className={`px-4 py-3 text-xs font-black ${isDark ? 'bg-gray-950/30' : 'bg-gray-50'}`}>Détails</div>
            <div className="p-4 space-y-2">
              {(order.items || []).map((it, idx) => (
                <div key={`${order.id}-${idx}`} className="flex items-start justify-between gap-3 text-sm">
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{String(it.name)}</div>
                    <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Qté: {Number(it.qty || 0)}</div>
                  </div>
                  <div className="font-black whitespace-nowrap">{formatFcfa(Math.round(((it.unitPriceCents || 0) * (it.qty || 0)) / 100))}</div>
                </div>
              ))}

              <div className={`pt-3 mt-3 border-t ${isDark ? 'border-gray-800' : 'border-gray-200'} space-y-2`}>
                <div className="flex items-center justify-between text-sm">
                  <div className={`font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Sous-total articles (TTC)</div>
                  <div className="font-black">{formatFcfa(itemsTtc)}</div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className={`font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Livraison (TTC)</div>
                  <div className="font-black">{formatFcfa(deliveryTtc)}</div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className={`font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>TVA incluse ({Math.round(vatRate * 100)}%)</div>
                  <div className="font-black">{formatFcfa(totalVat)}</div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className={`font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Total HT</div>
                  <div className="font-black">{formatFcfa(totalHt)}</div>
                </div>
                <div className="flex items-center justify-between text-base">
                  <div className="font-black">Total TTC</div>
                  <div className="font-black text-emerald-400">{formatFcfa(totalTtc)}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className={`px-4 py-2 rounded-xl font-black transition-colors ${isDark ? 'bg-white/5 border border-white/10 hover:bg-white/10' : 'bg-gray-900 text-white hover:bg-gray-800'}`}
            >
              Imprimer
            </button>
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-xl font-black transition-colors ${isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'}`}
            >
              Fermer
            </button>
          </div>
          </div>
        </div>
      </div>
    </div>
  )
}
