import React, { useEffect, useMemo, useState } from 'react'
import { MapPin, Play, CheckCircle2, RefreshCw } from 'lucide-react'
import { useThemeStore } from '../../stores/themeStore'

export type Order = {
  id: string
  createdAt: string
  updatedAt?: string
  deliveryJobId?: string | null
  userId: string
  assignedToUserId?: string | null
  status: 'created' | 'assigned' | 'picked_up' | 'delivered' | 'cancelled'
  pickup?: {
    kind?: 'vendor' | 'client'
    vendorId?: string | null
    name?: string | null
    phone?: string | null
    lat?: number | null
    lng?: number | null
    address?: string | null
  } | null
  customer?: {
    kind?: 'vendor' | 'client'
    name?: string | null
    phone?: string | null
    lat?: number | null
    lng?: number | null
    address?: string | null
  } | null
  delivery: {
    source: 'profile' | 'current' | 'manual'
    capturedAt: string
    position: { latitude: number; longitude: number }
  }
  note?: string | null
}

function statusLabel(status: Order['status']): string {
  if (status === 'created') return 'À faire'
  if (status === 'assigned') return 'Vers retrait'
  if (status === 'picked_up') return 'Vers client'
  if (status === 'delivered') return 'Livré'
  return 'Annulé'
}

function statusClass(status: Order['status'], isDark: boolean): string {
  if (isDark) {
    if (status === 'created') return 'bg-sky-500/15 text-sky-200 border border-sky-500/20'
    if (status === 'assigned') return 'bg-amber-500/15 text-amber-200 border border-amber-500/20'
    if (status === 'picked_up') return 'bg-orange-500/15 text-orange-200 border border-orange-500/20'
    if (status === 'delivered') return 'bg-emerald-500/15 text-emerald-200 border border-emerald-500/20'
    return 'bg-rose-500/15 text-rose-200 border border-rose-500/20'
  }
  if (status === 'created') return 'bg-sky-50 text-sky-700 border border-sky-200'
  if (status === 'assigned') return 'bg-amber-50 text-amber-700 border border-amber-200'
  if (status === 'picked_up') return 'bg-orange-50 text-orange-700 border border-orange-200'
  if (status === 'delivered') return 'bg-emerald-50 text-emerald-700 border border-emerald-200'
  return 'bg-rose-50 text-rose-700 border border-rose-200'
}

function trackingModeClass(isPremium: boolean, isDark: boolean): string {
  if (isDark) {
    return isPremium
      ? 'bg-orange-500/15 text-orange-100 border border-orange-500/20'
      : 'bg-white/5 text-zinc-200 border border-white/10'
  }
  return isPremium
    ? 'bg-orange-50 text-orange-700 border border-orange-200'
    : 'bg-gray-50 text-gray-700 border border-gray-200'
}

type Props = {
  poolOrders: Order[]
  myOrders: Order[]
  historyOrders: Order[]
  selectedId: string | null
  canStartOrders?: boolean
  onSelect: (id: string) => void
  onRefresh: () => void
  onStart: (id: string) => void
  onPickedUp: (id: string) => void
  onDelivered: (id: string) => void
}

export default function OrdersPanel({ poolOrders, myOrders, historyOrders, selectedId, canStartOrders = true, onSelect, onRefresh, onStart, onPickedUp, onDelivered }: Props) {
  const { isDark } = useThemeStore()
  const [tab, setTab] = useState<'pool' | 'mine'>('pool')

  const pool = useMemo(() => poolOrders.filter((o) => o.status === 'created' && !o.assignedToUserId), [poolOrders])
  const mine = useMemo(() => myOrders.filter((o) => o.status === 'assigned' || o.status === 'picked_up'), [myOrders])
  const history = useMemo(() => historyOrders.filter((o) => o.status === 'delivered'), [historyOrders])

  useEffect(() => {
    if (!selectedId) return
    if (mine.some((o) => o.id === selectedId) || history.some((o) => o.id === selectedId)) {
      setTab('mine')
      return
    }
    if (pool.some((o) => o.id === selectedId)) {
      setTab('pool')
    }
  }, [history, mine, pool, selectedId])

  const renderOrder = (o: Order) => {
    const isSelected = selectedId === o.id
    const isPremium = Boolean(String(o.deliveryJobId || '').trim())
    const destinationLat = o.status === 'assigned'
      ? Number(o.pickup?.lat)
      : Number(o.customer?.lat ?? o.delivery.position.latitude)
    const destinationLng = o.status === 'assigned'
      ? Number(o.pickup?.lng)
      : Number(o.customer?.lng ?? o.delivery.position.longitude)
    const destinationLabel = o.status === 'assigned'
      ? o.pickup?.name || 'Point de retrait'
      : o.customer?.address || o.customer?.name || 'Destination client'

    return (
      <button
        key={o.id}
        type="button"
        onClick={() => onSelect(o.id)}
        className={`w-full text-left rounded-2xl px-4 py-3 transition-colors border ${
          isSelected
            ? (isDark ? 'bg-white/10 border-white/20' : 'bg-gradient-to-r from-orange-50 to-emerald-50 border-orange-200 shadow-sm')
            : (isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white border-gray-200 hover:border-emerald-200 hover:bg-emerald-50/40 shadow-sm')
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <div className="text-sm font-black truncate">{o.id}</div>
              <div className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-black ${trackingModeClass(isPremium, isDark)}`}>
                {isPremium ? 'Premium' : 'Standard'}
              </div>
            </div>
            <div className={`mt-1 text-xs flex items-center gap-2 ${isDark ? 'text-zinc-300' : 'text-gray-500'}`}>
              <MapPin className="w-4 h-4" />
              <span className="truncate">
                {Number.isFinite(destinationLat) && Number.isFinite(destinationLng)
                  ? `${destinationLat.toFixed(6)},${destinationLng.toFixed(6)}`
                  : `${o.delivery.position.latitude.toFixed(6)},${o.delivery.position.longitude.toFixed(6)}`}
              </span>
            </div>
            <div className={`mt-1 text-[11px] truncate ${isDark ? 'text-zinc-400' : 'text-gray-600'}`}>{destinationLabel}</div>
            <div className={`mt-1 text-[11px] truncate ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>
              {isPremium ? 'Suivi premium Mangoo disponible' : 'Suivi standard pour demande rapide'}
            </div>
            {o.note && <div className={`mt-1 text-xs truncate ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>{o.note}</div>}
          </div>
          <div className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-black ${statusClass(o.status, isDark)}`}> {statusLabel(o.status)} </div>
        </div>

        <div className="mt-3 flex items-center gap-2">
          {(o.status === 'created') && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onStart(o.id)
              }}
              disabled={!canStartOrders}
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl font-black text-xs transition-colors ${
                canStartOrders
                  ? 'bg-emerald-500 text-emerald-950 hover:bg-emerald-400'
                  : (isDark ? 'bg-zinc-300 text-zinc-600 cursor-not-allowed' : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed')
              }`}
              title={!canStartOrders ? 'Terminez votre livraison active avant d en prendre une nouvelle.' : 'Démarrer'}
            >
              <Play className="w-4 h-4" />
              Démarrer
            </button>
          )}
          {o.status === 'assigned' && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onPickedUp(o.id)
              }}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-orange-500 text-orange-950 font-black text-xs hover:bg-orange-400 shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4" />
              Retrait OK
            </button>
          )}
          {o.status === 'picked_up' && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onDelivered(o.id)
              }}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-sky-500 text-sky-950 font-black text-xs hover:bg-sky-400 shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4" />
              Livré
            </button>
          )}
        </div>
      </button>
    )
  }

  return (
    <div className={`h-full flex flex-col rounded-2xl overflow-hidden ${
      isDark ? 'border border-white/10 bg-zinc-950/40' : 'border border-gray-200 bg-white/95 shadow-xl'
    }`}>
      <div className={`px-4 py-4 flex items-center justify-between gap-3 ${
        isDark ? 'border-b border-white/10' : 'border-b border-orange-100 bg-gradient-to-r from-orange-50 to-emerald-50'
      }`}>
        <div>
          <div className="text-base font-black">Livraisons</div>
          <div className={`text-xs ${isDark ? 'text-zinc-300' : 'text-gray-600'}`}>À prendre: {pool.length} • Mes livraisons: {mine.length} • Historique: {history.length}</div>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-black transition-colors ${
            isDark ? 'bg-white/5 hover:bg-white/10 border border-white/10' : 'bg-white hover:bg-orange-50 border border-orange-200 shadow-sm'
          }`}
          title="Rafraîchir"
        >
          <RefreshCw className="w-4 h-4" />
          Maj
        </button>
      </div>

      <div className="px-3 pt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setTab('pool')}
          className={`px-3 py-2 rounded-xl border text-xs font-black transition-colors ${
            tab === 'pool'
              ? 'bg-emerald-500 text-emerald-950 border-emerald-400'
              : (isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white border-gray-200 hover:bg-emerald-50 hover:border-emerald-200')
          }`}
        >
          À prendre ({pool.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('mine')}
          className={`px-3 py-2 rounded-xl border text-xs font-black transition-colors ${
            tab === 'mine'
              ? 'bg-sky-500 text-sky-950 border-sky-400'
              : (isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white border-gray-200 hover:bg-sky-50 hover:border-sky-200')
          }`}
        >
          Mes livraisons ({mine.length})
        </button>
      </div>

      <div className="flex-1 overflow-auto p-3 space-y-3">
        {!canStartOrders && tab === 'pool' && pool.length > 0 && (
          <div className={`p-4 rounded-2xl text-sm ${
            isDark ? 'bg-amber-500/15 border border-amber-500/20 text-amber-100' : 'bg-amber-50 border border-amber-200 text-amber-800'
          }`}>
            Une livraison est deja en cours. Terminez-la avant d en prendre une nouvelle.
          </div>
        )}
        {pool.length === 0 && mine.length === 0 && history.length === 0 && (
          <div className={`p-4 rounded-2xl text-sm ${
            isDark ? 'bg-white/5 border border-white/10 text-zinc-300' : 'bg-gray-50 border border-gray-200 text-gray-600'
          }`}>Aucune commande.</div>
        )}
        {tab === 'pool' && pool.map(renderOrder)}
        {tab === 'mine' && mine.map(renderOrder)}
        {tab === 'mine' && history.length > 0 && (
          <div className="pt-2">
            <div className={`px-2 py-1 text-xs font-black ${isDark ? 'text-zinc-300' : 'text-gray-500'}`}>Historique</div>
            <div className="space-y-3">{history.slice(0, 20).map(renderOrder)}</div>
          </div>
        )}
      </div>
    </div>
  )
}
