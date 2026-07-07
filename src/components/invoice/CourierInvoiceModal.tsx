import React, { useMemo } from 'react'
import { X } from 'lucide-react'
import { useThemeStore } from '../../stores/themeStore'

type Props = {
  open: boolean
  onClose: () => void
  order: {
    id: string
    createdAt: string
    userId: string
    status: string
    note?: string | null
    delivery: { position: { latitude: number; longitude: number } }
  } | null
}

function formatFcfa(n: number): string {
  const v = Number(n)
  if (!Number.isFinite(v)) return '0 FCFA'
  return `${Math.round(v).toLocaleString('fr-FR')} FCFA`
}

function parseFcfaFromNote(note: string | null | undefined, label: string): number | null {
  const t = String(note || '')
  const re = new RegExp(`${label}\\s*:\\s*([0-9][0-9\\s]*)`, 'i')
  const m = t.match(re)
  if (!m?.[1]) return null
  const n = Number(String(m[1]).replace(/[^0-9]/g, ''))
  return Number.isFinite(n) ? n : null
}

function parseVatRateFromNote(note: string | null | undefined): number | null {
  const t = String(note || '')
  const m = t.match(/TVA\s*\((\d{1,2})%\)/i)
  if (!m?.[1]) return null
  const p = Number(m[1])
  if (!Number.isFinite(p) || p <= 0) return null
  return p / 100
}

export default function CourierInvoiceModal({ open, onClose, order }: Props) {
  const { isDark } = useThemeStore()

  const feeFcfa = useMemo(() => parseFcfaFromNote(order?.note, 'Frais livraison') || 0, [order?.note])
  const vatRate = useMemo(() => parseVatRateFromNote(order?.note) || 0.18, [order?.note])
  const feeHtFcfa = useMemo(() => (feeFcfa > 0 ? Math.round(feeFcfa / (1 + vatRate)) : 0), [feeFcfa, vatRate])
  const vatFcfa = useMemo(() => parseFcfaFromNote(order?.note, 'TVA') || Math.max(0, feeFcfa - feeHtFcfa), [feeFcfa, feeHtFcfa, order?.note])

  const commissionRate = 0.2
  const commissionHtFcfa = useMemo(() => Math.round(feeHtFcfa * commissionRate), [feeHtFcfa])
  const payoutHtFcfa = useMemo(() => Math.max(0, feeHtFcfa - commissionHtFcfa), [commissionHtFcfa, feeHtFcfa])

  const addressLine = useMemo(() => {
    const t = String(order?.note || '')
    const m = t.match(/Adresse\s*:\s*([^\n]+)/i)
    return m?.[1] ? String(m[1]).trim() : ''
  }, [order?.note])

  if (!open || !order) return null

  return (
    <div className="fixed inset-0 z-[1000] bg-black/60 p-4 overflow-y-auto">
      <div className="min-h-[calc(100vh-2rem)] flex items-start justify-center">
        <div className={`w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden max-h-[calc(100vh-2rem)] flex flex-col ${isDark ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'}`}>
          <div className={`px-5 py-4 border-b flex items-center justify-between shrink-0 ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
            <div>
              <div className="text-lg font-black">Fiche livreur</div>
              <div className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Livraison: {order.id} • {new Date(order.createdAt).toLocaleString('fr-FR')}</div>
            </div>
            <button type="button" onClick={onClose} className={`p-2 rounded-xl ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`} title="Fermer">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-5 space-y-4 overflow-y-auto">
          <div className={`rounded-2xl border p-4 ${isDark ? 'border-gray-800 bg-gray-950/20' : 'border-gray-200 bg-gray-50'}`}>
            <div className="text-xs font-black">Destination</div>
            <div className="mt-1 text-sm font-black">{order.delivery.position.latitude.toFixed(6)}, {order.delivery.position.longitude.toFixed(6)}</div>
            {addressLine ? <div className={`mt-1 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Adresse: {addressLine}</div> : null}
          </div>

          <div className={`rounded-2xl border p-4 ${isDark ? 'border-gray-800 bg-gray-950/20' : 'border-gray-200 bg-gray-50'}`}>
            <div className="text-xs font-black">Rémunération</div>
            <div className="mt-2 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <div className={`${isDark ? 'text-gray-300' : 'text-gray-700'} font-semibold`}>Frais livraison (TTC)</div>
                <div className="font-black">{formatFcfa(feeFcfa)}</div>
              </div>
              <div className="flex items-center justify-between">
                <div className={`${isDark ? 'text-gray-300' : 'text-gray-700'} font-semibold`}>Livraison (HT)</div>
                <div className="font-black">{formatFcfa(feeHtFcfa)}</div>
              </div>
              <div className="flex items-center justify-between">
                <div className={`${isDark ? 'text-gray-300' : 'text-gray-700'} font-semibold`}>TVA incluse ({Math.round(vatRate * 100)}%)</div>
                <div className="font-black">{formatFcfa(vatFcfa)}</div>
              </div>
              <div className="flex items-center justify-between">
                <div className={`${isDark ? 'text-gray-300' : 'text-gray-700'} font-semibold`}>Commission Mangoo (20% HT)</div>
                <div className="font-black">{formatFcfa(commissionHtFcfa)}</div>
              </div>
              <div className="flex items-center justify-between text-base">
                <div className="font-black">Net à payer au livreur</div>
                <div className="font-black text-[#66bb6a]">{formatFcfa(payoutHtFcfa)}</div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
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
