import React, { useMemo, useState } from 'react'
import { MapPin, Play, CheckCircle2, RefreshCw } from 'lucide-react'

export type Order = {
  id: string
  createdAt: string
  updatedAt?: string
  userId: string
  assignedToUserId?: string | null
  status: 'created' | 'assigned' | 'picked_up' | 'delivered' | 'cancelled'
  delivery: {
    source: 'profile' | 'current' | 'manual'
    capturedAt: string
    position: { latitude: number; longitude: number }
  }
  note?: string | null
}

function statusLabel(status: Order['status']): string {
  if (status === 'created') return 'À faire'
  if (status === 'assigned') return 'En cours'
  if (status === 'picked_up') return 'Pris'
  if (status === 'delivered') return 'Livré'
  return 'Annulé'
}

function statusClass(status: Order['status']): string {
  if (status === 'created') return 'bg-sky-500/15 text-sky-200 border border-sky-500/20'
  if (status === 'assigned') return 'bg-amber-500/15 text-amber-200 border border-amber-500/20'
  if (status === 'picked_up') return 'bg-orange-500/15 text-orange-200 border border-orange-500/20'
  if (status === 'delivered') return 'bg-emerald-500/15 text-emerald-200 border border-emerald-500/20'
  return 'bg-rose-500/15 text-rose-200 border border-rose-500/20'
}

type Props = {
  poolOrders: Order[]
  myOrders: Order[]
  historyOrders: Order[]
  selectedId: string | null
  onSelect: (id: string) => void
  onRefresh: () => void
  onStart: (id: string) => void
  onDelivered: (id: string) => void
}

export default function OrdersPanel({ poolOrders, myOrders, historyOrders, selectedId, onSelect, onRefresh, onStart, onDelivered }: Props) {
  const [tab, setTab] = useState<'pool' | 'mine'>('pool')

  const pool = useMemo(() => poolOrders.filter((o) => o.status === 'created' && !o.assignedToUserId), [poolOrders])
  const mine = useMemo(() => myOrders.filter((o) => o.status === 'assigned' || o.status === 'picked_up'), [myOrders])
  const history = useMemo(() => historyOrders.filter((o) => o.status === 'delivered'), [historyOrders])

  const renderOrder = (o: Order) => {
    const isSelected = selectedId === o.id
    return (
      <button
        key={o.id}
        type="button"
        onClick={() => onSelect(o.id)}
        className={`w-full text-left rounded-2xl px-4 py-3 transition-colors border ${
          isSelected
            ? 'bg-white/10 border-white/20'
            : 'bg-white/5 border-white/10 hover:bg-white/10'
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-black truncate">{o.id}</div>
            <div className="mt-1 text-xs text-zinc-300 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span className="truncate">
                {o.delivery.position.latitude.toFixed(6)},{o.delivery.position.longitude.toFixed(6)}
              </span>
            </div>
            {o.note && <div className="mt-1 text-xs text-zinc-400 truncate">{o.note}</div>}
          </div>
          <div className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-black ${statusClass(o.status)}`}> {statusLabel(o.status)} </div>
        </div>

        <div className="mt-3 flex items-center gap-2">
          {(o.status === 'created') && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onStart(o.id)
              }}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500 text-emerald-950 font-black text-xs hover:bg-emerald-400"
            >
              <Play className="w-4 h-4" />
              Démarrer
            </button>
          )}
          {(o.status === 'assigned' || o.status === 'picked_up') && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onDelivered(o.id)
              }}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-sky-500 text-sky-950 font-black text-xs hover:bg-sky-400"
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
    <div className="h-full flex flex-col rounded-2xl border border-white/10 bg-zinc-950/40 overflow-hidden">
      <div className="px-4 py-4 border-b border-white/10 flex items-center justify-between gap-3">
        <div>
          <div className="text-base font-black">Livraisons</div>
          <div className="text-xs text-zinc-300">À prendre: {pool.length} • Mes livraisons: {mine.length} • Historique: {history.length}</div>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-black"
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
              : 'bg-white/5 border-white/10 hover:bg-white/10'
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
              : 'bg-white/5 border-white/10 hover:bg-white/10'
          }`}
        >
          Mes livraisons ({mine.length})
        </button>
      </div>

      <div className="flex-1 overflow-auto p-3 space-y-3">
        {pool.length === 0 && mine.length === 0 && history.length === 0 && (
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-sm text-zinc-300">Aucune commande.</div>
        )}
        {tab === 'pool' && pool.map(renderOrder)}
        {tab === 'mine' && mine.map(renderOrder)}
        {tab === 'mine' && history.length > 0 && (
          <div className="pt-2">
            <div className="px-2 py-1 text-xs font-black text-zinc-300">Historique</div>
            <div className="space-y-3">{history.slice(0, 20).map(renderOrder)}</div>
          </div>
        )}
      </div>
    </div>
  )
}
