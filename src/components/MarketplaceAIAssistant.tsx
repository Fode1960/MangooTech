import React, { useMemo, useState } from 'react'
import { Brain, Search, X, ShoppingCart, Store } from 'lucide-react'

type ApiItem = {
  id: string
  name: string
  description?: string
  fullDescription?: string
  shortDescription?: string
  imageUrl?: string
  price?: number | null
  currency?: string
  shop?: { slug: string; name: string; logoUrl?: string }
}

export default function MarketplaceAIAssistant(props: {
  isDark?: boolean
  onAddToCart?: (item: any) => void
  onViewShop?: (shopSlug: string) => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
  hideLauncher?: boolean
  defaultOpen?: boolean
}) {
  const isDark = !!props.isDark
  const [internalOpen, setInternalOpen] = useState(!!props.defaultOpen)
  const open = props.open !== undefined ? !!props.open : internalOpen
  const setOpen = (v: boolean) => {
    if (props.onOpenChange) props.onOpenChange(v)
    else setInternalOpen(v)
  }
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [items, setItems] = useState<ApiItem[]>([])

  const canSearch = useMemo(() => String(q || '').trim().length >= 2, [q])

  const search = async () => {
    if (!canSearch) return
    setLoading(true)
    setError('')
    try {
      const qs = new URLSearchParams()
      qs.set('q', String(q || '').trim())
      qs.set('limit', '12')
      const res = await fetch(`/api/products/search?${qs.toString()}`)
      const json = await res.json().catch(() => null)
      if (!res.ok || !json?.success) throw new Error(String(json?.error || 'failed'))
      const list = Array.isArray(json?.items) ? (json.items as ApiItem[]) : []
      setItems(list)
      if (!list.length) setError('Aucun résultat. Essayez un autre mot.')
    } catch (e: any) {
      setError(String(e?.message || 'Erreur recherche'))
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (n: any) => {
    const v = typeof n === 'number' ? n : Number(n)
    if (!Number.isFinite(v)) return ''
    try {
      return `${Math.round(v).toLocaleString()} FCFA`
    } catch {
      return `${Math.round(v)} FCFA`
    }
  }

  const toCartItem = (p: ApiItem) => {
    const priceLabel = formatPrice(p.price)
    return {
      id: p.id,
      name: p.name,
      description: p.description || p.shortDescription || p.fullDescription || '',
      price: priceLabel || '0 FCFA',
      image: p.imageUrl || p.shop?.logoUrl || '',
      rating: 5,
      vendor: p.shop?.name || '',
      shopSlug: p.shop?.slug || '',
      vendorName: p.shop?.name || '',
    }
  }

  return (
    <>
      {!props.hideLauncher && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={`fixed bottom-6 right-6 z-40 rounded-2xl px-4 py-3 shadow-lg border ${
            isDark ? 'bg-gray-900/90 border-white/10 text-white' : 'bg-white border-gray-200 text-gray-900'
          }`}
        >
          <span className="inline-flex items-center gap-2 font-black">
            <Brain className="w-5 h-5" />
            Assistant
          </span>
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div
            className={`w-full max-w-2xl rounded-2xl border shadow-2xl ${
              isDark ? 'bg-gray-950 border-white/10 text-white' : 'bg-white border-gray-200 text-gray-900'
            }`}
          >
            <div className="p-4 flex items-center justify-between gap-3 border-b border-white/10">
              <div className="min-w-0">
                <div className="font-black text-lg">Mangoo AI Assistant</div>
                <div className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  Dites ce que vous cherchez. Je propose des produits et des boutiques.
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className={`p-2 rounded-xl ${isDark ? 'bg-white/10 hover:bg-white/15' : 'bg-gray-100 hover:bg-gray-200'}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4">
              <div className="flex gap-2">
                <div className={`flex-1 flex items-center gap-2 rounded-xl px-3 py-2 border ${isDark ? 'border-white/10 bg-black/30' : 'border-gray-200 bg-white'}`}>
                  <Search className={`w-5 h-5 ${isDark ? 'text-gray-300' : 'text-gray-500'}`} />
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Ex: riz, téléphone, robe, sauce..."
                    className={`w-full bg-transparent outline-none ${isDark ? 'text-white placeholder:text-gray-500' : 'text-gray-900 placeholder:text-gray-400'}`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') void search()
                    }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => void search()}
                  disabled={!canSearch || loading}
                  className={`px-4 py-2 rounded-xl font-black ${
                    !canSearch || loading
                      ? isDark
                        ? 'bg-white/10 opacity-60 cursor-not-allowed'
                        : 'bg-gray-100 opacity-60 cursor-not-allowed'
                      : 'bg-[#1b5e20] text-white hover:bg-[#16381a]'
                  }`}
                >
                  {loading ? 'Recherche…' : 'Chercher'}
                </button>
              </div>

              {error && (
                <div className={`mt-3 text-sm rounded-xl px-3 py-2 ${isDark ? 'bg-white/10 text-gray-200' : 'bg-gray-100 text-gray-700'}`}>
                  {error}
                </div>
              )}

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {items.map((p) => (
                  <div
                    key={p.id}
                    className={`rounded-2xl border p-4 ${isDark ? 'border-white/10 bg-black/20' : 'border-gray-200 bg-white'}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-14 h-14 rounded-2xl overflow-hidden border ${isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'}`}>
                        {(p.imageUrl || p.shop?.logoUrl) ? (
                          <img
                            src={String(p.imageUrl || p.shop?.logoUrl || '')}
                            alt={p.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className={`w-full h-full flex items-center justify-center text-xs font-black ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                            Mangoo
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-black truncate">{p.name}</div>
                        <div className={`text-sm mt-1 line-clamp-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                          {p.shortDescription || p.description || p.fullDescription || '—'}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <div className="font-black text-[#66bb6a]">{formatPrice(p.price) || '—'}</div>
                      <div className="text-xs font-semibold opacity-80 truncate">{p.shop?.name || ''}</div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      {p.shop?.slug && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            if (props.onViewShop) props.onViewShop(String(p.shop?.slug || '').trim())
                            setOpen(false)
                          }}
                          className={`flex-1 rounded-xl px-3 py-2 font-black text-sm ${
                            isDark ? 'bg-white/10 hover:bg-white/15' : 'bg-gray-100 hover:bg-gray-200'
                          }`}
                        >
                          <span className="inline-flex items-center justify-center gap-2">
                            <Store className="w-4 h-4" />
                            Boutique
                          </span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          if (props.onAddToCart) props.onAddToCart(toCartItem(p))
                          setOpen(false)
                        }}
                        className="flex-1 rounded-xl px-3 py-2 font-black text-sm bg-[#1b5e20] text-white hover:bg-[#16381a]"
                      >
                        <span className="inline-flex items-center justify-center gap-2">
                          <ShoppingCart className="w-4 h-4" />
                          Payer
                        </span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
