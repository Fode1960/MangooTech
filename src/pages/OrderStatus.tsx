import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { CircleCheck, Clock, Loader2, RefreshCw } from 'lucide-react'
import { fetchOrderById } from '../services/courierApi'

type Order = any

function statusLabel(s: string): { label: string; tone: 'neutral' | 'ok' | 'warn' } {
  const v = String(s || '')
  if (v === 'created') return { label: 'En attente de livreur', tone: 'warn' }
  if (v === 'assigned') return { label: 'Livreur assigné', tone: 'ok' }
  if (v === 'picked_up') return { label: 'En cours de livraison', tone: 'ok' }
  if (v === 'delivered') return { label: 'Livrée', tone: 'ok' }
  if (v === 'cancelled') return { label: 'Annulée', tone: 'neutral' }
  return { label: v || 'Inconnue', tone: 'neutral' }
}

function toneClasses(t: 'neutral' | 'ok' | 'warn') {
  if (t === 'ok') return 'bg-emerald-500/15 border-emerald-500/25 text-emerald-100'
  if (t === 'warn') return 'bg-amber-500/15 border-amber-500/25 text-amber-100'
  return 'bg-white/5 border-white/10 text-zinc-100'
}

export default function OrderStatus() {
  const navigate = useNavigate()
  const { orderId } = useParams()
  const id = String(orderId || '').trim()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!id) return
    setError(null)
    try {
      const o = await fetchOrderById(id)
      setOrder(o)
    } catch (e: any) {
      setError(String(e?.message || e))
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    setLoading(true)
    load()
  }, [load])

  useEffect(() => {
    if (!id) return
    const t = window.setInterval(() => load(), 5000)
    return () => window.clearInterval(t)
  }, [id, load])

  const meta = useMemo(() => {
    const s = statusLabel(order?.status)
    return s
  }, [order?.status])

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-zinc-950 text-white">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
              <Clock className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <div className="text-2xl font-black">Suivi livraison</div>
              <div className="text-sm text-zinc-300">ID: {id || '—'}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={load}
              className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 font-black hover:bg-white/10 text-xs inline-flex items-center gap-2"
              disabled={loading}
            >
              <RefreshCw className="w-4 h-4" />
              Maj
            </button>
            <button
              type="button"
              onClick={() => navigate('/checkout/livraison')}
              className="px-3 py-2 rounded-xl bg-emerald-500 text-slate-950 font-black hover:bg-emerald-400 text-xs"
            >
              Nouvelle livraison
            </button>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5">
          {loading && (
            <div className="flex items-center gap-2 text-zinc-300">
              <Loader2 className="w-5 h-5 animate-spin" />
              Chargement…
            </div>
          )}
          {error && <div className="px-4 py-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-200 text-sm">{error}</div>}

          {order && (
            <>
              <div className={`mt-2 px-4 py-3 rounded-2xl border text-sm ${toneClasses(meta.tone)}`}>
                <div className="font-black">{meta.label}</div>
                <div className="text-xs opacity-90">Status technique: {String(order.status)}</div>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="text-xs text-zinc-300 font-black">Destination</div>
                  <div className="mt-1 text-sm font-black">
                    {Number(order?.delivery?.position?.latitude).toFixed(6)}, {Number(order?.delivery?.position?.longitude).toFixed(6)}
                  </div>
                  <div className="mt-2 text-xs text-zinc-300">Region: {String(order?.region ?? 'auto')}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="text-xs text-zinc-300 font-black">Affectation</div>
                  <div className="mt-1 text-sm font-black">{order?.assignedToUserId ? `Livreur: ${String(order.assignedToUserId)}` : 'Aucun livreur pour le moment'}</div>
                  <div className="mt-2 text-xs text-zinc-300">Créée: {String(order.createdAt || order.created_at || '')}</div>
                </div>
              </div>

              {order?.note && (
                <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="text-xs text-zinc-300 font-black">Note</div>
                  <div className="mt-1 text-sm text-zinc-100">{String(order.note)}</div>
                </div>
              )}

              <div className="mt-5 flex flex-wrap gap-3">
                <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-zinc-200 font-black inline-flex items-center gap-2">
                  <CircleCheck className="w-4 h-4 text-emerald-300" />
                  Apparition temps réel activée
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
