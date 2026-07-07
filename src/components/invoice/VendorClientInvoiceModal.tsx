import React, { useEffect, useMemo, useState } from 'react'
import { X } from 'lucide-react'
import mangooLogoUrl from '../../assets/mangoo-logo.svg'

type CountryKey = 'sn' | 'ci' | 'cm'

type VendorOrderItem = {
  name: string
  quantity: number
  price: number
  total: number
}

export type VendorOrder = {
  id: string
  customerName: string
  customerPhone: string
  customerAddress: string
  items: VendorOrderItem[]
  totalAmount: number
  status: string
  orderDate: string
  paymentMethod: string
  notes?: string
}

type Props = {
  open: boolean
  onClose: () => void
  isDark: boolean
  vendorLabel: string
  order: VendorOrder | null
}

function vatRateForCountry(country: CountryKey): number {
  if (country === 'cm') return 0.1925
  return 0.18
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

function readPreferredCountry(): CountryKey {
  try {
    const raw = localStorage.getItem('mangoo-country')
    const v = String(raw || '').toLowerCase()
    if (v === 'sn' || v === 'ci' || v === 'cm') return v
  } catch {
  }
  return 'ci'
}

function savePreferredCountry(country: CountryKey) {
  try {
    localStorage.setItem('mangoo-country', country)
  } catch {
  }
}

export default function VendorClientInvoiceModal({ open, onClose, isDark, vendorLabel, order }: Props) {
  const [country, setCountry] = useState<CountryKey>(() => readPreferredCountry())
  const [mode, setMode] = useState<'invoice' | 'delivery_note'>('invoice')

  useEffect(() => {
    if (!open) return
    setMode('invoice')
  }, [open])

  useEffect(() => {
    savePreferredCountry(country)
  }, [country])

  const vatRate = useMemo(() => vatRateForCountry(country), [country])
  const itemsTtc = useMemo(() => {
    if (!order) return 0
    const sum = Array.isArray(order.items) ? order.items.reduce((s, it) => s + (Number(it.total) || 0), 0) : 0
    const fallback = Number(order.totalAmount) || 0
    return sum > 0 ? sum : fallback
  }, [order])
  const vat = useMemo(() => calcVatIncluded(itemsTtc, vatRate), [itemsTtc, vatRate])
  const ht = useMemo(() => Math.max(0, itemsTtc - vat), [itemsTtc, vat])

  if (!open || !order) return null

  return (
    <div className="fixed inset-0 z-[1000] bg-black/60 p-4 overflow-y-auto">
      <div className="min-h-[calc(100vh-2rem)] flex items-start justify-center">
        <div className={`w-full max-w-3xl rounded-2xl border shadow-2xl overflow-hidden max-h-[calc(100vh-2rem)] flex flex-col ${isDark ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'}`}>
          <div className={`px-5 py-4 border-b flex items-center justify-between shrink-0 ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
            <div>
              <div className="text-lg font-black">{mode === 'invoice' ? 'Facture vendeur' : 'Bon de livraison'}</div>
              <div className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Commande: {order.id} • {new Date(order.orderDate).toLocaleDateString('fr-FR')}</div>
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
                  <div className={`mt-1 text-xs ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Pour le compte de: <span className="font-black">{vendorLabel}</span>
                  </div>
                </div>
                <div className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  <div>
                    <span className="font-black">N° document:</span> {mode === 'invoice' ? `inv_${order.id}` : `bl_${order.id}`}
                  </div>
                  <div>
                    <span className="font-black">Date:</span> {new Date(order.orderDate).toLocaleDateString('fr-FR')}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className={`text-sm ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                <span className="font-black">Vendeur:</span> {vendorLabel}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMode('invoice')}
                  className={`${mode === 'invoice' ? 'bg-[#1b5e20] text-white' : isDark ? 'bg-white/5 border border-white/10 text-white hover:bg-white/10' : 'bg-white border border-gray-200 text-gray-800 hover:bg-gray-50'} px-3 py-2 rounded-xl font-black text-sm transition-colors`}
                >
                  Facture
                </button>
                <button
                  type="button"
                  onClick={() => setMode('delivery_note')}
                  className={`${mode === 'delivery_note' ? 'bg-[#1b5e20] text-white' : isDark ? 'bg-white/5 border border-white/10 text-white hover:bg-white/10' : 'bg-white border border-gray-200 text-gray-800 hover:bg-gray-50'} px-3 py-2 rounded-xl font-black text-sm transition-colors`}
                >
                  Bon livreur
                </button>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value as CountryKey)}
                  className={`${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'} px-3 py-2 rounded-xl border text-sm font-black`}
                  title="Pays TVA"
                >
                  <option value="sn">SN</option>
                  <option value="ci">CI</option>
                  <option value="cm">CM</option>
                </select>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={`rounded-2xl border p-4 ${isDark ? 'border-gray-800 bg-gray-950/20' : 'border-gray-200 bg-gray-50'}`}>
                <div className="text-xs font-black">Client</div>
                <div className="mt-1 text-sm font-black">{order.customerName}</div>
                <div className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{order.customerPhone}</div>
                <div className={`mt-1 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Adresse: {order.customerAddress}</div>
              </div>
              <div className={`rounded-2xl border p-4 ${isDark ? 'border-gray-800 bg-gray-950/20' : 'border-gray-200 bg-gray-50'}`}>
                <div className="text-xs font-black">Paiement</div>
                <div className={`mt-1 text-sm font-black ${String(order.status) === 'delivered' ? 'text-[#66bb6a]' : ''}`}>{String(order.status)}</div>
                <div className={`mt-2 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Méthode: {order.paymentMethod}</div>
              </div>
            </div>

            <div className={`mt-4 rounded-2xl border overflow-hidden ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
              <div className={`px-4 py-3 text-xs font-black ${isDark ? 'bg-gray-950/30' : 'bg-gray-50'}`}>Détails</div>
              <div className="p-4 space-y-2">
                {(order.items || []).map((it, idx) => (
                  <div key={`${order.id}-${idx}`} className="flex items-start justify-between gap-3 text-sm">
                    <div className="min-w-0">
                      <div className="font-semibold truncate">{it.quantity}× {it.name}</div>
                      {mode === 'invoice' && (
                        <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>PU: {formatFcfa(it.price)}</div>
                      )}
                    </div>
                    {mode === 'invoice' && (
                      <div className="font-black whitespace-nowrap">{formatFcfa(it.total)}</div>
                    )}
                  </div>
                ))}

                {mode === 'invoice' && (
                  <div className={`pt-3 mt-3 border-t ${isDark ? 'border-gray-800' : 'border-gray-200'} space-y-2`}>
                    <div className="flex items-center justify-between text-sm">
                      <div className={`font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Sous-total (TTC)</div>
                      <div className="font-black">{formatFcfa(itemsTtc)}</div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className={`font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>TVA incluse ({Math.round(vatRate * 100)}%)</div>
                      <div className="font-black">{formatFcfa(vat)}</div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className={`font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Total HT</div>
                      <div className="font-black">{formatFcfa(ht)}</div>
                    </div>
                    <div className="flex items-center justify-between text-base">
                      <div className="font-black">Total TTC</div>
                      <div className="font-black text-[#66bb6a]">{formatFcfa(itemsTtc)}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {order.notes ? (
              <div className={`mt-4 rounded-2xl border p-4 text-sm ${isDark ? 'border-gray-800 bg-gray-950/20 text-gray-200' : 'border-gray-200 bg-gray-50 text-gray-800'}`}>
                <div className="text-xs font-black">Notes</div>
                <div className="mt-1">{order.notes}</div>
              </div>
            ) : null}

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
