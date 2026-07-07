import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CircleCheck, Clock, Loader2, RefreshCw } from 'lucide-react'
import { fetchOrderById } from '../services/courierApi'
import { buildPremiumDeliveryTrackingUrl } from '../utils/deliveryTracking'

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
  if (t === 'ok') return 'bg-[#eef6ea] border-[#cfe0c8] text-[#1b5e20]'
  if (t === 'warn') return 'bg-amber-50 border-amber-200 text-amber-800'
  return 'bg-gray-50 border-gray-200 text-gray-800'
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

  const premiumTrackingUrl = useMemo(
    () => buildPremiumDeliveryTrackingUrl(order?.deliveryJobId),
    [order?.deliveryJobId]
  )

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
    navigate('/checkout/livraison')
  }, [navigate])

  const openPremiumTracking = useCallback(() => {
    if (!premiumTrackingUrl) return
    window.location.href = premiumTrackingUrl
  }, [premiumTrackingUrl])

  return (
    <div className="min-h-screen bg-[#f6faf3] text-gray-900">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white border border-orange-100 shadow-sm flex items-center justify-center">
              <Clock className="w-6 h-6 text-[#1b5e20]" />
            </div>
            <div>
              <div className="text-2xl font-black">Suivi livraison</div>
              <div className="text-sm text-gray-600">ID: {id || '—'}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={goBack}
              className="px-3 py-2 rounded-xl bg-white border border-gray-200 font-black hover:bg-gray-50 text-xs inline-flex items-center gap-2 shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour
            </button>
            <button
              type="button"
              onClick={load}
              className="px-3 py-2 rounded-xl bg-white border border-gray-200 font-black hover:bg-gray-50 text-xs inline-flex items-center gap-2 shadow-sm"
              disabled={loading}
            >
              <RefreshCw className="w-4 h-4" />
              Maj
            </button>
            <button
              type="button"
              onClick={() => navigate('/checkout/livraison')}
              className="px-3 py-2 rounded-xl bg-[#1b5e20] text-white font-black hover:bg-[#16381a] text-xs shadow-sm"
            >
              Nouvelle livraison
            </button>
            {premiumTrackingUrl && (
              <button
                type="button"
                onClick={openPremiumTracking}
                className="px-3 py-2 rounded-xl bg-[#1b5e20] text-white font-black hover:bg-[#16381a] text-xs shadow-sm"
                title="Ouvrir le suivi premium Mangoo"
              >
                Suivi premium
              </button>
            )}
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-xl">
          {loading && (
            <div className="flex items-center gap-2 text-gray-600">
              <Loader2 className="w-5 h-5 animate-spin" />
              Chargement...
            </div>
          )}
          {error && <div className="px-4 py-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">{error}</div>}

          {order && (
            <>
              <div className={`mt-2 px-4 py-3 rounded-2xl border text-sm ${toneClasses(meta.tone)}`}>
                <div className="font-black">{meta.label}</div>
                <div className="text-xs opacity-90">Status technique: {String(order.status)}</div>
              </div>

              <div className={`mt-4 px-4 py-3 rounded-2xl border text-sm ${
                premiumTrackingUrl
                  ? 'bg-orange-50 border-orange-200 text-orange-800'
                  : 'bg-gray-50 border-gray-200 text-gray-700'
              }`}>
                <div className="font-black">
                  {premiumTrackingUrl ? 'Mode de suivi: Premium' : 'Mode de suivi: Standard'}
                </div>
                <div className="mt-1 text-xs opacity-90">
                  {premiumTrackingUrl
                    ? 'Cette livraison dispose du suivi riche Mangoo avec carte live, partage et jalons avancés.'
                    : 'Cette demande rapide n a pas encore de point de retrait. Le suivi premium n est donc pas disponible sur ce cas.'}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <div className="text-xs text-gray-600 font-black">Destination</div>
                  <div className="mt-1 text-sm font-black">
                    {Number(order?.delivery?.position?.latitude).toFixed(6)}, {Number(order?.delivery?.position?.longitude).toFixed(6)}
                  </div>
                  <div className="mt-2 text-xs text-gray-600">Region: {String(order?.region ?? 'auto')}</div>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <div className="text-xs text-gray-600 font-black">Affectation</div>
                  <div className="mt-1 text-sm font-black">{order?.assignedToUserId ? `Livreur: ${String(order.assignedToUserId)}` : 'Aucun livreur pour le moment'}</div>
                  <div className="mt-2 text-xs text-gray-600">Créée: {String(order.createdAt || order.created_at || '')}</div>
                </div>
              </div>

              {order?.note && (
                <div className="mt-4 rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <div className="text-xs text-gray-600 font-black">Note</div>
                  <div className="mt-1 text-sm text-gray-900">{String(order.note)}</div>
                </div>
              )}

              <div className="mt-5 flex flex-wrap gap-3">
                <div className="px-4 py-2 rounded-xl bg-[#eef6ea] border border-[#cfe0c8] text-[#1b5e20] font-black inline-flex items-center gap-2">
                  <CircleCheck className="w-4 h-4 text-[#1b5e20]" />
                  Apparition temps réel activée
                </div>
                {premiumTrackingUrl && (
                  <button
                    type="button"
                    onClick={openPremiumTracking}
                    className="px-4 py-2 rounded-xl bg-white border border-orange-200 text-gray-900 font-black hover:bg-orange-50 inline-flex items-center gap-2 shadow-sm"
                  >
                    Ouvrir la carte live Mangoo
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
