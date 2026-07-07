import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Search, RefreshCw, FileText, ArrowUpDown, Eye } from 'lucide-react'
import { useTheme } from '../hooks/useTheme'
import ClientInvoiceModal from '../components/invoice/ClientInvoiceModal'

type InvoiceRecord = {
  id: string
  createdAt: string
  orderId: string
  clientEmail?: string
  clientName?: string
  vendors?: { name: string; shopSlug?: string; country?: string }[]
  totalTtcFcfa?: number
  vatIncludedFcfa?: number
  order?: any
  client?: any
}

const STORAGE_KEY = 'mangoo-admin-invoices'

function readInvoices(): InvoiceRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function readClientOrdersMap(): Record<string, any[]> {
  try {
    const raw = localStorage.getItem('demo_client_orders')
    const data = raw ? JSON.parse(raw) : {}
    return data && typeof data === 'object' ? data : {}
  } catch {
    return {}
  }
}

function toNameFromEmail(email: string): string {
  const u = String(email || '').split('@')[0] || 'Client'
  return u.charAt(0).toUpperCase() + u.slice(1)
}

function calcVatIncluded(ttc: number, rate: number): number {
  if (!Number.isFinite(ttc) || ttc <= 0) return 0
  if (!Number.isFinite(rate) || rate <= 0) return 0
  return Math.round(ttc - ttc / (1 + rate))
}

function buildFromOrders(): InvoiceRecord[] {
  const map = readClientOrdersMap()
  const out: InvoiceRecord[] = []
  for (const [email, list] of Object.entries(map)) {
    const orders = Array.isArray(list) ? list : []
    for (const o of orders) {
      const orderId = String(o?.id || '').trim()
      if (!orderId) continue
      const createdAt = String(o?.createdAt || new Date().toISOString())
      const totalTtcFcfa = Math.round(Number(o?.totalCents || 0) / 100) || 0
      const vatIncludedFcfa = calcVatIncluded(totalTtcFcfa, 0.18)
      const vendorNames = Array.from(
        new Set(
          (Array.isArray(o?.items) ? o.items : [])
            .map((it: any) => String(it?.vendorName || it?.shopSlug || '').trim())
            .filter(Boolean),
        ),
      ) as string[]
      const vendors = vendorNames.map((name) => ({ name }))
      out.push({
        id: `inv_${orderId}`,
        createdAt,
        orderId,
        clientEmail: email,
        clientName: String(o?.customer?.name || '') || toNameFromEmail(email),
        vendors,
        totalTtcFcfa,
        vatIncludedFcfa,
        order: o,
        client: { name: String(o?.customer?.name || '') || toNameFromEmail(email), email },
      })
    }
  }
  return out
}

export default function AdminInvoices() {
  const { isDark } = useTheme()
  const [q, setQ] = useState('')
  const [items, setItems] = useState<InvoiceRecord[]>([])
  const [sortKey, setSortKey] = useState<'createdAt' | 'orderId' | 'client' | 'vendor' | 'total'>('createdAt')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [preview, setPreview] = useState<{ order: any; client: any } | null>(null)

  const refresh = useCallback(() => {
    const direct = readInvoices().filter((x) => x && x.id)
    const list = (direct.length ? direct : buildFromOrders())
      .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
    try {
      if (!direct.length && list.length) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, 500)))
      }
    } catch {
    }
    setItems(list)
  }, [])

  useEffect(() => {
    refresh()
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) refresh()
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [refresh])

  const filtered = useMemo(() => {
    const s = String(q || '').trim().toLowerCase()
    if (!s) return items
    return items.filter((it) => {
      const hay = `${it.id} ${it.orderId} ${it.clientEmail || ''} ${(it.vendors || []).map((v) => v.name).join(' ')}`.toLowerCase()
      return hay.includes(s)
    })
  }, [items, q])

  const sorted = useMemo(() => {
    const next = [...filtered]
    const dir = sortDir === 'asc' ? 1 : -1
    next.sort((a, b) => {
      if (sortKey === 'createdAt') return dir * String(a.createdAt || '').localeCompare(String(b.createdAt || ''))
      if (sortKey === 'orderId') return dir * String(a.orderId || '').localeCompare(String(b.orderId || ''))
      if (sortKey === 'client') return dir * String(a.clientEmail || '').localeCompare(String(b.clientEmail || ''))
      if (sortKey === 'vendor') return dir * String((a.vendors || []).map((v) => v.name).join(',') || '').localeCompare(String((b.vendors || []).map((v) => v.name).join(',') || ''))
      if (sortKey === 'total') return dir * ((Number(a.totalTtcFcfa || 0) || 0) - (Number(b.totalTtcFcfa || 0) || 0))
      return 0
    })
    return next
  }, [filtered, sortDir, sortKey])

  const toggleSort = useCallback((k: typeof sortKey) => {
    setSortKey((prev) => {
      if (prev !== k) {
        setSortDir('desc')
        return k
      }
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
      return prev
    })
  }, [])

  return (
    <div className={`${isDark ? 'bg-gray-900' : 'bg-gray-50'} min-h-full`}>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Factures</h1>
            <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} mt-1`}>Factures générées par MangooTech (pour le compte des vendeurs).</p>
          </div>
          <button
            type="button"
            onClick={refresh}
            className={`${isDark ? 'bg-gray-800 border-gray-700 text-gray-200 hover:bg-gray-700' : 'bg-white border-gray-200 text-gray-900 hover:bg-gray-50'} px-4 py-2 rounded-xl font-semibold border inline-flex items-center gap-2`}
          >
            <RefreshCw className="w-4 h-4" />
            Maj
          </button>
        </div>

        <div className={`border rounded-2xl overflow-hidden ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className={`p-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="relative">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-400'}`} />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Rechercher (invoice, commande, client, vendeur…)"
                className={`w-full pl-10 pr-3 py-2 rounded-lg border ${isDark ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-400' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'}`}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className={isDark ? 'bg-gray-900/50' : 'bg-gray-50'}>
                <tr className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                  <th className="text-left px-4 py-3 font-semibold">
                    <button type="button" onClick={() => toggleSort('createdAt')} className="inline-flex items-center gap-2">
                      Facture <ArrowUpDown className="w-4 h-4 opacity-70" />
                    </button>
                  </th>
                  <th className="text-left px-4 py-3 font-semibold">
                    <button type="button" onClick={() => toggleSort('orderId')} className="inline-flex items-center gap-2">
                      Commande <ArrowUpDown className="w-4 h-4 opacity-70" />
                    </button>
                  </th>
                  <th className="text-left px-4 py-3 font-semibold">
                    <button type="button" onClick={() => toggleSort('client')} className="inline-flex items-center gap-2">
                      Client <ArrowUpDown className="w-4 h-4 opacity-70" />
                    </button>
                  </th>
                  <th className="text-left px-4 py-3 font-semibold">
                    <button type="button" onClick={() => toggleSort('vendor')} className="inline-flex items-center gap-2">
                      Vendeur(s) <ArrowUpDown className="w-4 h-4 opacity-70" />
                    </button>
                  </th>
                  <th className="text-right px-4 py-3 font-semibold">
                    <button type="button" onClick={() => toggleSort('total')} className="inline-flex items-center gap-2">
                      Total <ArrowUpDown className="w-4 h-4 opacity-70" />
                    </button>
                  </th>
                  <th className="text-right px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sorted.length === 0 ? (
                  <tr>
                    <td colSpan={6} className={`px-4 py-10 text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Aucune facture.
                    </td>
                  </tr>
                ) : (
                  sorted.map((it) => (
                    <tr key={it.id} className={isDark ? 'border-t border-gray-700' : 'border-t border-gray-200'}>
                      <td className="px-4 py-3">
                        <div className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'} inline-flex items-center gap-2`}>
                          <FileText className="w-4 h-4" />
                          {it.id}
                        </div>
                        <div className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-xs`}>{new Date(it.createdAt).toLocaleString('fr-FR')}</div>
                      </td>
                      <td className={`px-4 py-3 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{it.orderId}</td>
                      <td className={`px-4 py-3 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                        <div className="font-semibold">{it.clientName || '—'}</div>
                        <div className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-xs break-all`}>{it.clientEmail || '—'}</div>
                      </td>
                      <td className={`px-4 py-3 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{(it.vendors || []).map((v) => v.name).join(', ') || '—'}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="font-bold text-[#1b5e20] dark:text-[#8ccf8c]">{Number(it.totalTtcFcfa || 0).toLocaleString('fr-FR')} FCFA</div>
                        <div className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-xs`}>TVA incluse: {Number(it.vatIncludedFcfa || 0).toLocaleString('fr-FR')} FCFA</div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            const order = it.order || null
                            const client = it.client || (it.clientEmail ? { email: it.clientEmail, name: it.clientName || toNameFromEmail(it.clientEmail) } : null)
                            if (!order || !client) return
                            setPreview({ order, client })
                          }}
                          className={`${isDark ? 'bg-gray-900 border border-gray-700 text-gray-200 hover:bg-gray-800' : 'bg-white border border-gray-200 text-gray-900 hover:bg-gray-50'} px-3 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-2`}
                          title="Prévisualiser"
                          disabled={!it.order}
                        >
                          <Eye className="w-4 h-4" />
                          Voir
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <ClientInvoiceModal
        open={Boolean(preview)}
        onClose={() => setPreview(null)}
        client={preview?.client || {}}
        order={preview?.order || null}
      />
    </div>
  )
}
