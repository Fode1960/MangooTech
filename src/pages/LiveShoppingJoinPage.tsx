import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Phone,
  PhoneOff,
  ShoppingBag,
  Play,
  Square,
  Eye,
  X,
  Minus,
  Maximize2,
  MessageCircle,
  Send,
  Store,
  Package,
  Search,
  Mic,
} from 'lucide-react'
import { io, type Socket } from 'socket.io-client'
import mangooLogoUrl from '../assets/mangoo-logo.svg'
import LiveShoppingManager from '../components/LiveShoppingManager'
import WebRTCManagerConnectPlus from '../components/WebRTCManagerConnectPlus'
import { getHttpUrl } from '../utils/realtimeUrls'
import { mobileMoneyApi } from '../config/api'

type Role = 'vendor' | 'client'
type UI = 'full' | 'simple'

type LiveProduct = {
  id: string
  title: string
  priceCfa: number
  imageUrl?: string
  emoji?: string
}

type LiveOrder = {
  id: string
  roomId: string
  productId: string
  qty: number
  buyerName?: string
  buyerId?: string
  createdAt: string
}

type LiveChatMessage = {
  id: string
  roomId: string
  fromRole: 'vendor' | 'client'
  fromUserId: string
  fromName: string
  text: string
  createdAt: string
}

type PricingFeePolicy = {
  rate?: number
  fixedCfa?: number
}

type PricingPolicyConfig = {
  version?: number
  commissionRateByCountry?: Record<string, number>
  feeByCountryMethod?: Record<string, Record<string, PricingFeePolicy | number>>
}

const DEFAULT_PRICING_POLICY_CONFIG: PricingPolicyConfig = {
  version: 1,
  commissionRateByCountry: { sn: 0.05, cm: 0.05, ci: 0.05, default: 0.05 },
  feeByCountryMethod: {
    sn: {
      wave: { rate: 0.01, fixedCfa: 0 },
      orange_money: { rate: 0.015, fixedCfa: 0 },
      mtn_momo: { rate: 0.015, fixedCfa: 0 },
      moov_money: { rate: 0.015, fixedCfa: 0 },
      free_mobile: { rate: 0.015, fixedCfa: 0 },
      _default: { rate: 0.015, fixedCfa: 0 },
    },
    cm: {
      mtn_momo: { rate: 0.015, fixedCfa: 0 },
      orange_money: { rate: 0.015, fixedCfa: 0 },
      wave: { rate: 0.015, fixedCfa: 0 },
      moov_money: { rate: 0.015, fixedCfa: 0 },
      free_mobile: { rate: 0.015, fixedCfa: 0 },
      _default: { rate: 0.015, fixedCfa: 0 },
    },
    ci: {
      orange_money: { rate: 0.015, fixedCfa: 0 },
      moov_money: { rate: 0.015, fixedCfa: 0 },
      mtn_momo: { rate: 0.015, fixedCfa: 0 },
      wave: { rate: 0.015, fixedCfa: 0 },
      free_mobile: { rate: 0.015, fixedCfa: 0 },
      _default: { rate: 0.015, fixedCfa: 0 },
    },
    default: {
      orange_money: { rate: 0.015, fixedCfa: 0 },
      mtn_momo: { rate: 0.015, fixedCfa: 0 },
      wave: { rate: 0.015, fixedCfa: 0 },
      moov_money: { rate: 0.015, fixedCfa: 0 },
      free_mobile: { rate: 0.015, fixedCfa: 0 },
      _default: { rate: 0.015, fixedCfa: 0 },
    },
  },
}

function useVoiceFeedback() {
  const audioCtxRef = useRef<AudioContext | null>(null)

  const beep = (frequency = 660, ms = 90) => {
    try {
      const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext
      if (!Ctx) return
      const ctx: AudioContext = audioCtxRef.current || new Ctx()
      audioCtxRef.current = ctx
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      gain.gain.value = 0.02
      osc.type = 'sine'
      osc.frequency.value = frequency
      osc.connect(gain)
      gain.connect(ctx.destination)
      const now = ctx.currentTime
      osc.start(now)
      osc.stop(now + ms / 1000)
    } catch {
    }
  }

  const speak = (text: string) => {
    const t = String(text || '').trim()
    if (!t) return
    try {
      if (typeof window === 'undefined') return
      const synth = window.speechSynthesis
      if (!synth) return
      try {
        synth.cancel()
      } catch {
      }
      const u = new SpeechSynthesisUtterance(t)
      u.lang = 'fr-FR'
      u.rate = 1.0
      u.pitch = 1.0
      synth.speak(u)
    } catch {
    }
  }

  useEffect(() => {
    return () => {
      try {
        audioCtxRef.current?.close()
      } catch {
      }
      audioCtxRef.current = null
    }
  }, [])

  return { beep, speak }
}

function useLiveShoppingRealtime(params: { roomId: string; role: Role; userId: string; userName: string }) {
  const { roomId, role, userId, userName } = params
  const socketRef = useRef<Socket | null>(null)
  const [connected, setConnected] = useState(false)
  const [live, setLiveState] = useState(false)
  const [products, setProducts] = useState<LiveProduct[]>([])
  const [catalogProducts, setCatalogProducts] = useState<LiveProduct[]>([])
  const [featuredProductId, setFeaturedProductId] = useState<string | null>(null)
  const [ordersCount, setOrdersCount] = useState(0)
  const [lastPurchase, setLastPurchase] = useState<LiveOrder | null>(null)
  const [messages, setMessages] = useState<LiveChatMessage[]>([])

  useEffect(() => {
    const rid = String(roomId || '').trim()
    if (!rid) return
    const baseUrl = getHttpUrl(0)
    const s = io(baseUrl, { path: '/socket.io', transports: ['websocket', 'polling'] })
    socketRef.current = s

    const onConnect = () => {
      setConnected(true)
      s.emit('live-shopping:join', { roomId: rid, role, userId, userName })
    }
    const onDisconnect = () => setConnected(false)

    s.on('connect', onConnect)
    s.on('disconnect', onDisconnect)

    s.on('live-shopping:state', (data: any) => {
      if (!data) return
      setLiveState(!!data.live)
      setProducts(Array.isArray(data.products) ? data.products : [])
      setCatalogProducts(Array.isArray(data.catalogProducts) ? data.catalogProducts : Array.isArray(data.products) ? data.products : [])
      setFeaturedProductId(data.featuredProductId ? String(data.featuredProductId) : null)
      setOrdersCount(Number.isFinite(data.ordersCount) ? Number(data.ordersCount) : 0)
      setMessages(Array.isArray(data.messages) ? data.messages : [])
    })

    s.on('live-shopping:live', (data: any) => {
      if (!data) return
      setLiveState(!!data.live)
    })

    s.on('live-shopping:product', (data: any) => {
      if (!data) return
      setFeaturedProductId(data.featuredProductId ? String(data.featuredProductId) : null)
    })

    s.on('live-shopping:purchase', (data: any) => {
      if (!data) return
      if (Number.isFinite(data.ordersCount)) setOrdersCount(Number(data.ordersCount))
      if (data.order && typeof data.order === 'object') setLastPurchase(data.order as LiveOrder)
    })

    s.on('live-shopping:chat', (data: any) => {
      if (!data || !data.message) return
      setMessages((prev) => {
        const msg = data.message as LiveChatMessage
        if (!msg?.id) return prev
        if (prev.some((m) => m.id === msg.id)) return prev
        const next = [msg, ...prev]
        return next.slice(0, 50)
      })
    })

    return () => {
      try {
        s.disconnect()
      } catch {
      }
      socketRef.current = null
    }
  }, [roomId, role, userId, userName])

  const setLive = (next: boolean) => {
    const rid = String(roomId || '').trim()
    if (!rid) return
    if (role !== 'vendor') return
    setLiveState(!!next)
    socketRef.current?.emit('live-shopping:set-live', { roomId: rid, live: !!next })
  }

  const setFeaturedProduct = (productId: string) => {
    const rid = String(roomId || '').trim()
    const pid = String(productId || '').trim()
    if (!rid || !pid) return
    if (role !== 'vendor') return
    socketRef.current?.emit('live-shopping:set-product', { roomId: rid, productId: pid })
  }

  const setProductsSelection = async (input: { productIds?: string[]; products?: LiveProduct[] }) => {
    const rid = String(roomId || '').trim()
    if (!rid) return { ok: false as const }
    if (role !== 'vendor') return { ok: false as const }
    const ids = (Array.isArray(input?.productIds) ? input.productIds : []).map((x) => String(x || '').trim()).filter(Boolean)
    const products = Array.isArray(input?.products) ? input.products : []
    const res = await new Promise<{ ok: boolean }>((resolve) => {
      let settled = false
      const timeout = window.setTimeout(() => {
        if (settled) return
        settled = true
        resolve({ ok: false })
      }, 1500)
      try {
        socketRef.current?.emit('live-shopping:set-products', { roomId: rid, productIds: ids, products }, (ack: any) => {
          if (settled) return
          settled = true
          window.clearTimeout(timeout)
          resolve({ ok: !!ack?.ok })
        })
      } catch {
        if (!settled) {
          settled = true
          window.clearTimeout(timeout)
          resolve({ ok: false })
        }
      }
    })
    return res.ok ? ({ ok: true as const } as const) : ({ ok: false as const } as const)
  }

  const purchase = async (productId: string, qty = 1) => {
    const rid = String(roomId || '').trim()
    const pid = String(productId || '').trim()
    if (!rid || !pid) return { ok: false as const }
    const res = await new Promise<{ ok: boolean; orderId?: string }>((resolve) => {
      try {
        socketRef.current?.emit(
          'live-shopping:purchase',
          { roomId: rid, productId: pid, qty, buyerName: userName, buyerId: userId },
          (ack: any) => resolve({ ok: !!ack?.ok, orderId: ack?.orderId ? String(ack.orderId) : undefined }),
        )
      } catch {
        resolve({ ok: false })
      }
    })
    return res.ok ? ({ ok: true as const, orderId: res.orderId } as const) : ({ ok: false as const } as const)
  }

  const sendChat = async (text: string) => {
    const rid = String(roomId || '').trim()
    const t = String(text || '').trim()
    if (!rid || !t) return { ok: false as const }
    const res = await new Promise<{ ok: boolean; messageId?: string }>((resolve) => {
      try {
        socketRef.current?.emit('live-shopping:chat', { roomId: rid, text: t }, (ack: any) =>
          resolve({ ok: !!ack?.ok, messageId: ack?.messageId ? String(ack.messageId) : undefined }),
        )
      } catch {
        resolve({ ok: false })
      }
    })
    return res.ok ? ({ ok: true as const, messageId: res.messageId } as const) : ({ ok: false as const } as const)
  }

  return {
    connected,
    live,
    products,
    catalogProducts,
    featuredProductId,
    ordersCount,
    lastPurchase,
    messages,
    setLive,
    setFeaturedProduct,
    setProductsSelection,
    purchase,
    sendChat,
  }
}

const LiveShoppingUltraSimple: React.FC<{
  role: Role
  roomId: string
  userId: string
  userName: string
  shopSlug?: string
  onPickShopSlug?: (slug: string) => void
}> = ({ role, roomId, userId, userName, shopSlug, onPickShopSlug }) => {
  const [showProduct, setShowProduct] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [showCallDock, setShowCallDock] = useState(false)
  const [callDockMinimized, setCallDockMinimized] = useState(false)
  const [callHangupSignal, setCallHangupSignal] = useState(0)
  const [callStartSignal, setCallStartSignal] = useState(0)
  const [selectedProductId, setSelectedProductId] = useState<string>('')
  const [clientManualProduct, setClientManualProduct] = useState(false)
  const [productTab, setProductTab] = useState<'present' | 'range'>('present')
  const [draftProductIds, setDraftProductIds] = useState<string[]>([])
  const [rangeApplyStatus, setRangeApplyStatus] = useState<'idle' | 'applying'>('idle')
  const [showShopPicker, setShowShopPicker] = useState(false)
  const [showRangeSheet, setShowRangeSheet] = useState(false)
  const [shopsLoading, setShopsLoading] = useState(false)
  const [shopsList, setShopsList] = useState<Array<{ id?: string; name?: string; slug?: string; logo_url?: string; city?: string; country?: string }>>([])
  const [shopProductCounts, setShopProductCounts] = useState<Record<string, number | null>>({})
  const [shopSearch, setShopSearch] = useState('')
  const [shopOnlyWithProducts, setShopOnlyWithProducts] = useState(true)
  const [shopVoiceListening, setShopVoiceListening] = useState(false)
  const [shopListLimit, setShopListLimit] = useState(25)
  const shopProductCountsRef = useRef<Record<string, number | null>>({})
  const shopCountsInFlightRef = useRef<Set<string>>(new Set())
  const [lastAppliedShopSlug, setLastAppliedShopSlug] = useState(() => {
    try {
      return String(sessionStorage.getItem('mangoo_live_last_applied_shop_slug_v1') || '').trim() || ''
    } catch {
      return ''
    }
  })
  const [shopCatalogLoading, setShopCatalogLoading] = useState(false)
  const [shopCatalogProducts, setShopCatalogProducts] = useState<LiveProduct[]>([])
  const [chatText, setChatText] = useState('')
  const { beep, speak } = useVoiceFeedback()
  const didIntroRef = useRef(false)
  const shopPickGuardRef = useRef(0)
  const [vendorPresentedOnce, setVendorPresentedOnce] = useState(false)
  const [showCartSheet, setShowCartSheet] = useState(false)
  const [cartProductId, setCartProductId] = useState<string>('')
  const [cartQty, setCartQty] = useState(1)
  const [cartOrderId, setCartOrderId] = useState<string>('')
  const [cartPhoneNumber, setCartPhoneNumber] = useState('')
  const [cartPaymentMethod, setCartPaymentMethod] = useState<string>('')
  const [showCartMethodPicker, setShowCartMethodPicker] = useState(false)
  const [cartPayStatus, setCartPayStatus] = useState<'idle' | 'creating' | 'paying' | 'paid' | 'error'>('idle')
  const [cartError, setCartError] = useState<string>('')
  const [showOrdersSheet, setShowOrdersSheet] = useState(false)
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [ordersError, setOrdersError] = useState('')
  const [roomOrders, setRoomOrders] = useState<any[]>([])
  const [showMyOrdersSheet, setShowMyOrdersSheet] = useState(false)
  const [myOrdersLoading, setMyOrdersLoading] = useState(false)
  const [myOrdersError, setMyOrdersError] = useState('')
  const [myOrders, setMyOrders] = useState<any[]>([])
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const {
    connected,
    live,
    products,
    catalogProducts,
    featuredProductId,
    ordersCount,
    lastPurchase,
    messages,
    setLive,
    setFeaturedProduct,
    setProductsSelection,
    purchase,
    sendChat,
  } = useLiveShoppingRealtime({ roomId, role, userId, userName })

  const stepVoice = useMemo(() => {
    return {
      shop: '1 boutique',
      range: '2 gamme',
      present: '3 présenter',
      go: '4 go',
      call: '5 appel',
    } as const
  }, [])

  const vendorNextStep = useMemo(() => {
    if (role !== 'vendor') return null as null | 'shop' | 'range' | 'present' | 'go' | 'call'
    if (!String(shopSlug || '').trim()) return 'shop'
    if (String(shopSlug || '').trim() && String(shopSlug || '').trim() !== String(lastAppliedShopSlug || '').trim()) return 'range'
    if (!Array.isArray(products) || products.length === 0) return 'range'
    if (!vendorPresentedOnce) return 'present'
    if (!live) return 'go'
    return 'call'
  }, [role, shopSlug, products, vendorPresentedOnce, live, lastAppliedShopSlug])

  useEffect(() => {
    if (didIntroRef.current) return
    didIntroRef.current = true
    if (role !== 'vendor') return
    const next = vendorNextStep || 'shop'
    speak(stepVoice[next])
  }, [role, vendorNextStep, speak, stepVoice])

  const productsKey = useMemo(() => (Array.isArray(products) ? products.map((p) => p.id).join('|') : ''), [products])

  useEffect(() => {
    if (role !== 'vendor') return
    setVendorPresentedOnce(false)
  }, [role, productsKey])

  const featuredProduct = useMemo(() => {
    const list = Array.isArray(products) ? products : []
    const pid = String(featuredProductId || '').trim()
    return list.find((p) => p.id === pid) || list[0] || null
  }, [products, featuredProductId])

  const selectedProduct = useMemo(() => {
    const list = Array.isArray(products) ? products : []
    const pid = String(selectedProductId || '').trim()
    return list.find((p) => p.id === pid) || featuredProduct || null
  }, [products, selectedProductId, featuredProduct])

  useEffect(() => {
    if (!selectedProductId && featuredProduct?.id) setSelectedProductId(featuredProduct.id)
  }, [selectedProductId, featuredProduct?.id])

  useEffect(() => {
    const pid = String(featuredProductId || '').trim()
    if (!pid) return
    if (role === 'client') {
      if (!clientManualProduct) setSelectedProductId(pid)
      return
    }
    if (!showProduct) setSelectedProductId(pid)
  }, [featuredProductId, showProduct, role, clientManualProduct])

  const callRoomId = useMemo(() => `${String(roomId || '').trim()}__private`, [roomId])

  useEffect(() => {
    if (role !== 'vendor') return
    if (live) {
      setShowCallDock(true)
      setCallDockMinimized(true)
    }
  }, [role, live])

  useEffect(() => {
    if (role !== 'vendor') return
    if (!connected) return
    setShowCallDock(true)
    setCallDockMinimized(true)
  }, [role, connected])

  useEffect(() => {
    if (role !== 'client') return
    if (!connected) return
    setShowCallDock(true)
    setCallDockMinimized(true)
  }, [role, connected])

  const toggleLive = () => {
    beep()
    if (role === 'vendor') {
      if (!connected) {
        speak('Non connecté')
        return
      }
      if (!Array.isArray(products) || products.length === 0) {
        speak(stepVoice.range)
        setProductTab('range')
        setDraftProductIds([])
        setShowProduct(true)
        if (!String(shopSlug || '').trim()) setShowShopPicker(true)
        return
      }
      const next = !live
      setLive(next)
      speak(next ? stepVoice.call : 'Live arrêté')
      if (next) {
        const isLocalhost =
          typeof window !== 'undefined' &&
          (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        if (typeof window !== 'undefined' && !window.isSecureContext && !isLocalhost) {
          speak('HTTPS requis pour la caméra')
          return
        }
        if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== 'function') {
          speak('Caméra indisponible')
          return
        }
        navigator.mediaDevices
          .getUserMedia({ video: true, audio: false })
          .then((stream) => {
            localStreamRef.current = stream
            if (videoRef.current) {
              videoRef.current.srcObject = stream
              videoRef.current.muted = true
              videoRef.current.play().catch(() => {})
            }
          })
          .catch(() => {
            speak('Caméra refusée')
          })
      } else {
        const s = localStreamRef.current
        localStreamRef.current = null
        if (s) {
          try {
            s.getTracks().forEach((t) => t.stop())
          } catch {
          }
        }
        if (videoRef.current) videoRef.current.srcObject = null
      }
      return
    }
    speak('Regarder')
  }

  const openProduct = () => {
    beep(880, 70)
    const pid = featuredProduct?.id || (Array.isArray(products) ? products[0]?.id : '') || ''
    if (pid) setSelectedProductId(pid)
    if (role === 'client') setClientManualProduct(false)
    setProductTab('present')
    setDraftProductIds((Array.isArray(products) ? products : []).map((p) => p.id))
    setShowProduct(true)
    speak(role === 'vendor' ? stepVoice.present : 'Produit')
  }

  const openRange = () => {
    beep(880, 70)
    if (role !== 'vendor') return
    setDraftProductIds((Array.isArray(products) ? products : []).map((p) => p.id))
    setProductTab('range')
    setShowRangeSheet(true)
    if (!String(shopSlug || '').trim()) {
      setShowShopPicker(true)
      speak(stepVoice.shop)
      return
    }
    speak(stepVoice.range)
  }

  const startShopVoiceSearch = () => {
    try {
      if (shopVoiceListening) return
      const Ctor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (!Ctor) {
        speak('Micro indisponible')
        return
      }
      const rec = new Ctor()
      rec.lang = 'fr-FR'
      rec.interimResults = false
      rec.maxAlternatives = 1
      setShopVoiceListening(true)
      speak('Dites le nom')
      rec.onresult = (e: any) => {
        try {
          const t = String(e?.results?.[0]?.[0]?.transcript || '').trim()
          if (t) setShopSearch(t)
        } catch {
        }
      }
      rec.onerror = () => {
        setShopVoiceListening(false)
      }
      rec.onend = () => {
        setShopVoiceListening(false)
      }
      rec.start()
    } catch {
      setShopVoiceListening(false)
    }
  }

  const filteredShops = useMemo(() => {
    const q = String(shopSearch || '').trim().toLowerCase()
    const base = Array.isArray(shopsList) ? shopsList : []
    const mapped = base
      .map((s) => {
        const slug = String((s as any)?.slug || '').trim()
        const name = String((s as any)?.name || slug || 'Boutique').trim()
        const logo = String((s as any)?.logo_url || '').trim()
        const count = slug ? (shopProductCounts as any)?.[slug] : undefined
        return { slug, name, logo, count }
      })
      .filter((s) => !!s.slug)
      .filter((s) => {
        if (!q) return true
        return s.slug.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
      })
      .filter((s) => {
        if (!shopOnlyWithProducts) return true
        if (s.count === 0) return false
        return true
      })
      .sort((a, b) => {
        if (shopOnlyWithProducts) {
          const ac = typeof (a as any).count === 'number' ? Number((a as any).count) : -1
          const bc = typeof (b as any).count === 'number' ? Number((b as any).count) : -1
          if (ac !== bc) return bc - ac
        }
        return a.name.localeCompare(b.name)
      })
    return mapped
  }, [shopsList, shopSearch, shopOnlyWithProducts, shopProductCounts])

  const visibleFilteredShops = useMemo(() => filteredShops.slice(0, Math.max(5, shopListLimit)), [filteredShops, shopListLimit])

  useEffect(() => {
    shopProductCountsRef.current = shopProductCounts as any
  }, [shopProductCounts])

  useEffect(() => {
    if (!showShopPicker) return
    if (shopsList.length) return
    try {
      const raw = sessionStorage.getItem('mangoo_live_shops_cache_v1')
      const parsed = raw ? JSON.parse(raw) : null
      if (Array.isArray(parsed) && parsed.length) setShopsList(parsed)
    } catch {
    }
    const ac = new AbortController()
    setShopsLoading(true)
    fetch('/api/shops/list', { signal: ac.signal })
      .then((r) => r.json().catch(() => ({})))
      .then((data) => {
        if (ac.signal.aborted) return
        const list = Array.isArray(data?.shops) ? data.shops : []
        setShopsList(list)
        try {
          sessionStorage.setItem('mangoo_live_shops_cache_v1', JSON.stringify(list.slice(0, 200)))
        } catch {
        }
      })
      .catch(() => {
        if (!ac.signal.aborted) setShopsList([])
      })
      .finally(() => setShopsLoading(false))
    return () => {
      try {
        ac.abort()
      } catch {
      }
    }
  }, [showShopPicker])

  useEffect(() => {
    if (!showShopPicker) return
    if (!shopsList.length) return

    try {
      const raw = sessionStorage.getItem('mangoo_live_shop_counts_v1')
      const parsed = raw ? JSON.parse(raw) : null
      if (parsed && typeof parsed === 'object') {
        setShopProductCounts((prev) => ({ ...(parsed as any), ...(prev || {}) }))
      }
    } catch {
    }

    const slugs = visibleFilteredShops
      .map((s) => String((s as any)?.slug || '').trim())
      .filter(Boolean)
      .slice(0, shopOnlyWithProducts ? 25 : 60)

    const current = shopProductCountsRef.current || {}
    const missing = slugs.filter((slug) => current[slug] === undefined && !shopCountsInFlightRef.current.has(slug))
    if (!missing.length) return

    let cancelled = false
    const ac = new AbortController()
    missing.forEach((slug) => shopCountsInFlightRef.current.add(slug))

    const run = async () => {
      const out: Record<string, number> = {}
      try {
        await Promise.all(
          missing.map(async (slug) => {
            if (cancelled || ac.signal.aborted) return
            try {
              const r = await fetch(`/api/shops/slug/${encodeURIComponent(slug)}/products`, { signal: ac.signal })
              const data = await r.json().catch(() => ({}))
              const count = Array.isArray((data as any)?.products) ? Number((data as any).products.length) : 0
              if (Number.isFinite(count)) out[slug] = count
            } catch {
            }
          }),
        )
      } catch {
      }
      missing.forEach((slug) => shopCountsInFlightRef.current.delete(slug))
      if (cancelled || ac.signal.aborted) return
      const keys = Object.keys(out)
      if (!keys.length) return
      setShopProductCounts((prev) => {
        const next = { ...(prev || {}), ...out }
        try {
          sessionStorage.setItem('mangoo_live_shop_counts_v1', JSON.stringify(next))
        } catch {
        }
        return next
      })
    }

    const w = window as any
    if (typeof w.requestIdleCallback === 'function') {
      const id = w.requestIdleCallback(() => void run(), { timeout: 1500 })
      return () => {
        cancelled = true
        missing.forEach((slug) => shopCountsInFlightRef.current.delete(slug))
        try {
          w.cancelIdleCallback?.(id)
        } catch {
        }
        try {
          ac.abort()
        } catch {
        }
      }
    }

    void run()
    return () => {
      cancelled = true
      missing.forEach((slug) => shopCountsInFlightRef.current.delete(slug))
      try {
        ac.abort()
      } catch {
      }
    }
  }, [showShopPicker, shopsList, visibleFilteredShops, shopOnlyWithProducts])

  useEffect(() => {
    if (role !== 'vendor') return
    const shouldLoadCatalog = showRangeSheet || (showProduct && productTab === 'range')
    if (!shouldLoadCatalog) return
    const slug = String(shopSlug || '').trim()
    if (!slug) {
      setShopCatalogProducts([])
      setShopCatalogLoading(false)
      return
    }
    const ac = new AbortController()
    setShopCatalogLoading(true)
    fetch(`/api/shops/slug/${encodeURIComponent(slug)}/products`, { signal: ac.signal })
      .then((r) => r.json().catch(() => ({})))
      .then((data) => {
        if (ac.signal.aborted) return
        const raw = Array.isArray(data?.products) ? data.products : []
        const mapped: LiveProduct[] = raw
          .map((p: any) => {
            const id = String(p?.id || '').trim()
            const title = String(p?.name || '').trim()
            const priceCfa = Number(p?.price)
            const img = Array.isArray(p?.images) && p.images.length ? String(p.images[0]?.url || '').trim() : ''
            if (!id || !title || !Number.isFinite(priceCfa)) return null
            return { id, title, priceCfa, imageUrl: img || undefined, emoji: '🧺' }
          })
          .filter(Boolean) as LiveProduct[]
        setShopCatalogProducts(mapped)
        setDraftProductIds((prev) => {
          const selected = new Set(Array.isArray(prev) && prev.length ? prev : (Array.isArray(products) ? products : []).map((x) => x.id))
          const allowed = new Set(mapped.map((x) => x.id))
          const next = Array.from(selected).filter((id) => allowed.has(id))
          return next.length ? next : mapped.slice(0, 6).map((x) => x.id)
        })
      })
      .catch(() => {
        if (!ac.signal.aborted) setShopCatalogProducts([])
      })
      .finally(() => setShopCatalogLoading(false))
    return () => {
      try {
        ac.abort()
      } catch {
      }
    }
  }, [role, showProduct, showRangeSheet, productTab, shopSlug, products])

  const openView = () => {
    beep(520, 70)
    setShowChat(true)
    speak('Commentaires')
  }

  const closeProduct = () => {
    beep(440, 70)
    setShowProduct(false)
  }

  const closeChat = () => {
    beep(440, 70)
    setShowChat(false)
  }

  const currentShop = useMemo(() => {
    const slug = String(shopSlug || '').trim()
    if (!slug) return null
    return shopsList.find((s) => String(s?.slug || '').trim() === slug) || null
  }, [shopSlug, shopsList])

  const [pricingPolicyConfig, setPricingPolicyConfig] = useState<PricingPolicyConfig | null>(null)

  const loadPricingPolicyConfig = useCallback(async () => {
    try {
      const data = await fetch('/api/pricing-policy')
        .then((r) => r.json().catch(() => null))
        .catch(() => null)
      const cfg = (data as any)?.data
      if (!cfg || typeof cfg !== 'object') return
      setPricingPolicyConfig(cfg as any)
    } catch {
    }
  }, [])

  useEffect(() => {
    void loadPricingPolicyConfig()
  }, [loadPricingPolicyConfig])

  const defaultMobileMoneyMethod = useMemo(() => {
    const raw = String((currentShop as any)?.country || '').trim().toLowerCase()
    if (!raw) return 'orange_money'
    if (raw.includes('senegal') || raw.includes('sénégal')) return 'wave'
    if (raw.includes('cameroun') || raw.includes('cameroon')) return 'mtn_momo'
    if (raw.includes('cote') || raw.includes("côte") || raw.includes('ivoire')) return 'orange_money'
    return 'orange_money'
  }, [currentShop])

  const cartEffectiveMethod = useMemo(() => {
    const m = String(cartPaymentMethod || defaultMobileMoneyMethod || 'orange_money').trim()
    return m || 'orange_money'
  }, [cartPaymentMethod, defaultMobileMoneyMethod])

  const pricingPolicy = useMemo(() => {
    const rawCountry = String((currentShop as any)?.country || '').trim().toLowerCase()
    const country =
      rawCountry.includes('senegal') || rawCountry.includes('sénégal')
        ? 'sn'
        : rawCountry.includes('cameroun') || rawCountry.includes('cameroon')
          ? 'cm'
          : rawCountry.includes('cote') || rawCountry.includes("côte") || rawCountry.includes('ivoire')
            ? 'ci'
            : 'default'

    const method = String(cartEffectiveMethod || 'orange_money').trim()

    const safeRate = (v: any, fallback: number) => {
      const n = Number(v)
      if (!Number.isFinite(n) || n < 0) return fallback
      return n
    }

    const safeMoney = (v: any, fallback: number) => {
      const n = Math.round(Number(v))
      if (!Number.isFinite(n) || n < 0) return fallback
      return n
    }

    const cfg = pricingPolicyConfig || DEFAULT_PRICING_POLICY_CONFIG
    const commissionRate = safeRate(cfg?.commissionRateByCountry?.[country] ?? cfg?.commissionRateByCountry?.default, 0.05)

    const feeRow =
      (cfg?.feeByCountryMethod?.[country] as any) || (cfg?.feeByCountryMethod?.default as any) || (DEFAULT_PRICING_POLICY_CONFIG.feeByCountryMethod?.default as any) || {}
    const feeEntry = feeRow?.[method] ?? feeRow?._default ?? (cfg?.feeByCountryMethod?.default as any)?.[method] ?? (cfg?.feeByCountryMethod?.default as any)?._default
    const feeRate = typeof feeEntry === 'number' ? safeRate(feeEntry, 0.015) : safeRate((feeEntry as any)?.rate, 0.015)
    const feeFixedCfa = typeof feeEntry === 'number' ? 0 : safeMoney((feeEntry as any)?.fixedCfa, 0)

    const methodLabel =
      method === 'wave'
        ? 'Wave'
        : method === 'mtn_momo'
          ? 'MTN MoMo'
          : method === 'moov_money'
            ? 'Moov Money'
            : method === 'free_mobile'
              ? 'Free Money'
              : 'Orange Money'

    return { country, method, methodLabel, commissionRate, feeRate, feeFixedCfa }
  }, [currentShop, cartEffectiveMethod, pricingPolicyConfig])

  useEffect(() => {
    if (!showCartSheet) return
    if (cartPaymentMethod) return
    setCartPaymentMethod(defaultMobileMoneyMethod)
  }, [showCartSheet, cartPaymentMethod, defaultMobileMoneyMethod])

  const cartProduct = useMemo(() => {
    const pid = String(cartProductId || '').trim()
    if (!pid) return null
    const list = Array.isArray(products) ? products : []
    return list.find((p) => String(p?.id || '').trim() === pid) || null
  }, [cartProductId, products])

  const cartTotals = useMemo(() => {
    const unit = Math.round(Number(cartProduct?.priceCfa) || 0)
    const qty = Math.max(1, Math.round(Number(cartQty) || 1))
    const subtotal = Math.max(0, unit * qty)
    const commission = Math.round(subtotal * Math.max(0, Number(pricingPolicy?.commissionRate) || 0))
    const feeRate = Math.max(0, Number(pricingPolicy?.feeRate) || 0)
    const feeFixed = Math.max(0, Math.round(Number(pricingPolicy?.feeFixedCfa) || 0))
    const fee = Math.round((subtotal + commission) * feeRate) + feeFixed
    const total = Math.max(0, subtotal)
    return { unit, qty, subtotal, commission, fee, total }
  }, [cartProduct?.priceCfa, cartQty, pricingPolicy?.commissionRate, pricingPolicy?.feeRate, pricingPolicy?.feeFixedCfa])

  const openCart = (productId: string) => {
    const pid = String(productId || '').trim()
    if (!pid) return
    setCartProductId(pid)
    setCartQty(1)
    setCartOrderId('')
    setCartPaymentMethod('')
    setShowCartMethodPicker(false)
    setCartPayStatus('idle')
    setCartError('')
    setShowCartSheet(true)
    beep(740, 80)
    speak('Panier')
  }

  const createAndPayCart = async () => {
    try {
      if (!connected) {
        speak('Non connecté')
        return
      }
      if (!live) {
        speak('Live hors ligne')
        return
      }
      if (!cartProduct?.id) return
      const phone = String(cartPhoneNumber || '').trim()
      if (!phone) {
        speak('Numéro')
        setCartPayStatus('error')
        setCartError('Numéro requis')
        return
      }

      setCartPayStatus('creating')
      setCartError('')

      const pricing = {
        currency: 'XOF',
        unitPriceCfa: cartTotals.unit,
        qty: cartTotals.qty,
        subtotalCfa: cartTotals.subtotal,
        mangooCommissionCfa: cartTotals.commission,
        mobileMoneyFeeCfa: cartTotals.fee,
        totalCfa: cartTotals.total,
        shopCountry: String((currentShop as any)?.country || '').trim() || undefined,
        method: String(cartEffectiveMethod || '').trim() || undefined,
        mangooCommissionRateBps: Math.round(Number(pricingPolicy?.commissionRate || 0) * 10000),
        mobileMoneyFeeRateBps: Math.round(Number(pricingPolicy?.feeRate || 0) * 10000),
        mobileMoneyFeeFixedCfa: Math.max(0, Math.round(Number(pricingPolicy?.feeFixedCfa) || 0)),
      }

      const createRes = await fetch('/api/live-orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId,
          shopSlug: String(shopSlug || '').trim() || undefined,
          shopName: String((currentShop as any)?.name || '').trim() || undefined,
          shopCountry: String((currentShop as any)?.country || '').trim() || undefined,
          product: { id: cartProduct.id, title: cartProduct.title, priceCfa: cartProduct.priceCfa, imageUrl: cartProduct.imageUrl },
          qty: cartQty,
          pricing,
          buyerId: String(userId || '').trim() || undefined,
          buyerName: String(userName || '').trim() || undefined,
        }),
      }).then((r) => r.json().catch(() => ({})))

      if (!createRes?.success || !createRes?.order?.id) {
        setCartPayStatus('error')
        setCartError('Commande impossible')
        speak('Erreur')
        return
      }

      const orderId = String(createRes.order.id || '').trim()
      setCartOrderId(orderId)

      setCartPayStatus('paying')
      const usedMethod = String(cartEffectiveMethod || 'orange_money').trim() || 'orange_money'
      const amount = Math.max(1, Math.round(Number(cartTotals.subtotal) || 0))
      const paymentUserId = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(userId || '').trim())
        ? String(userId || '').trim()
        : 'anonymous'

      const mm = await mobileMoneyApi.createPayment({
        user_id: paymentUserId,
        amount,
        currency: 'XOF',
        method: usedMethod,
        phone_number: phone,
        description: `Live order ${orderId}`,
      })

      const paymentId = String(mm?.paymentId || '').trim()
      const transactionId = String(mm?.transactionId || '').trim()
      if (!paymentId || !transactionId) {
        setCartPayStatus('error')
        setCartError('Paiement impossible')
        speak('Erreur')
        return
      }

      const confirm = await mobileMoneyApi.confirmPayment({ paymentId, transactionId, outcome: 'succeeded' })
      const status = String(confirm?.status || '').trim() || 'failed'

      await fetch(`/api/live-orders/${encodeURIComponent(orderId)}/set-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'mobile_money',
          method: usedMethod,
          status,
          paymentId,
          transactionId,
          currency: 'XOF',
          amount,
          paidAt: new Date().toISOString(),
        }),
      }).then((r) => r.json().catch(() => ({})))

      if (status !== 'succeeded') {
        setCartPayStatus('error')
        setCartError('Paiement échoué')
        speak('Échec')
        return
      }

      try {
        await purchase(cartProduct.id, cartQty)
      } catch {
      }

      setCartPayStatus('paid')
      beep(990, 90)
      speak('Payé')
    } catch {
      setCartPayStatus('error')
      setCartError('Erreur paiement')
      speak('Erreur')
    }
  }

  const confirmReceived = async () => {
    try {
      const orderId = String(cartOrderId || '').trim()
      if (!orderId) return
      const res = await fetch(`/api/live-orders/${encodeURIComponent(orderId)}/confirm-received`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ buyerId: String(userId || '').trim() || undefined }),
      }).then((r) => r.json().catch(() => ({})))
      if (res?.success) {
        beep(990, 90)
        speak('Merci')
        setShowCartSheet(false)
      } else {
        speak('Erreur')
      }
    } catch {
      speak('Erreur')
    }
  }

  const fetchRoomOrders = useCallback(async () => {
    try {
      const rid = String(roomId || '').trim()
      if (!rid) return
      setOrdersLoading(true)
      setOrdersError('')
      const data = await fetch(`/api/live-orders/by-room/${encodeURIComponent(rid)}`)
        .then((r) => r.json().catch(() => ({})))
      if (!data?.success) {
        setOrdersError('Erreur')
        setRoomOrders([])
        return
      }
      setRoomOrders(Array.isArray(data?.orders) ? data.orders : [])
    } catch {
      setOrdersError('Erreur')
      setRoomOrders([])
    } finally {
      setOrdersLoading(false)
    }
  }, [roomId])

  useEffect(() => {
    if (!showOrdersSheet) return
    if (role !== 'vendor') return
    ;(async () => {
      await fetchRoomOrders()
    })()
  }, [showOrdersSheet, role, roomId, fetchRoomOrders])

  const markDelivered = async (id: string) => {
    const oid = String(id || '').trim()
    if (!oid) return
    try {
      const res = await fetch(`/api/live-orders/${encodeURIComponent(oid)}/mark-delivered`, { method: 'POST' })
        .then((r) => r.json().catch(() => ({})))
      if (!res?.success) {
        beep(440, 70)
        speak('Erreur')
        return
      }
      beep(990, 90)
      speak('Livré')
      fetchRoomOrders()
    } catch {
      beep(440, 70)
      speak('Erreur')
    }
  }

  const fetchMyOrders = useCallback(async () => {
    try {
      const rid = String(roomId || '').trim()
      if (!rid) return
      setMyOrdersLoading(true)
      setMyOrdersError('')
      const data = await fetch(`/api/live-orders/by-room/${encodeURIComponent(rid)}`)
        .then((r) => r.json().catch(() => ({})))
      if (!data?.success) {
        setMyOrdersError('Erreur')
        setMyOrders([])
        return
      }
      const all = Array.isArray(data?.orders) ? data.orders : []
      const uid = String(userId || '').trim()
      setMyOrders(all.filter((o: any) => String(o?.buyerId || '').trim() === uid))
    } catch {
      setMyOrdersError('Erreur')
      setMyOrders([])
    } finally {
      setMyOrdersLoading(false)
    }
  }, [roomId, userId])

  useEffect(() => {
    if (!showMyOrdersSheet) return
    if (role !== 'client') return
    ;(async () => {
      await fetchMyOrders()
    })()
  }, [showMyOrdersSheet, role, fetchMyOrders])

  const confirmReceivedById = async (id: string) => {
    try {
      const orderId = String(id || '').trim()
      if (!orderId) return
      const res = await fetch(`/api/live-orders/${encodeURIComponent(orderId)}/confirm-received`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ buyerId: String(userId || '').trim() || undefined }),
      }).then((r) => r.json().catch(() => ({})))
      if (res?.success) {
        beep(990, 90)
        speak('Merci')
        fetchMyOrders()
      } else {
        speak('Erreur')
      }
    } catch {
      speak('Erreur')
    }
  }

  return (
    <div className="min-h-full w-full flex flex-col items-center justify-start px-6 py-6 text-white text-center">
      <img src={mangooLogoUrl} alt="Mangoo Tech" className="w-12 h-12 opacity-95" />
      <div className="mt-3 text-xs font-semibold tracking-wide uppercase text-gray-300">Mangoo Live Shopping</div>

      <div className="mt-6 w-full max-w-md rounded-2xl border border-white/10 bg-black/30 backdrop-blur p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 text-left">
            <div className="text-lg font-semibold truncate">{role === 'vendor' ? 'Vendeur' : 'Client'}</div>
            <div className="text-xs text-gray-300 truncate">{userName || (role === 'vendor' ? 'Vendeur' : 'Client')}</div>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
            <div className={`px-3 py-2 rounded-xl text-xs font-semibold ${live ? 'bg-green-600/30 text-green-200' : 'bg-white/10 text-gray-200'}`}>
              {live ? 'Live: ON' : 'Live: OFF'}
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-2xl bg-gradient-to-br from-orange-500/20 to-green-700/20 border border-white/10 h-44 flex items-center justify-center overflow-hidden">
          {role === 'vendor' && live ? (
            <video ref={videoRef as any} autoPlay playsInline muted className="w-full h-full object-cover" />
          ) : (
            <div className="text-6xl">🎥</div>
          )}
        </div>

        {role === 'vendor' ? (
          <div className="mt-3 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                beep(740, 80)
                speak(stepVoice.shop)
                setShowShopPicker(true)
              }}
              className={`rounded-2xl bg-white/10 hover:bg-white/15 px-4 py-5 flex flex-col items-center justify-center gap-2 font-semibold ${
                vendorNextStep === 'shop' ? 'ring-4 ring-orange-400/60' : ''
              }`}
            >
              <Store className="w-8 h-8" />
              <span className="text-sm">1 Boutique</span>
            </button>

            <button
              type="button"
              onClick={openRange}
              className={`rounded-2xl bg-white/10 hover:bg-white/15 px-4 py-5 flex flex-col items-center justify-center gap-2 font-semibold ${
                vendorNextStep === 'range' ? 'ring-4 ring-orange-400/60' : ''
              }`}
            >
              <Package className="w-8 h-8" />
              <span className="text-sm">2 Gamme</span>
            </button>

            <button
              type="button"
              onClick={openProduct}
              className={`rounded-2xl bg-white/10 hover:bg-white/15 px-4 py-5 flex flex-col items-center justify-center gap-2 font-semibold ${
                vendorNextStep === 'present' ? 'ring-4 ring-orange-400/60' : ''
              }`}
            >
              <ShoppingBag className="w-8 h-8" />
              <span className="text-sm">3 Présenter</span>
            </button>

            <button
              type="button"
              onClick={toggleLive}
              disabled={!connected}
              className={`rounded-2xl px-4 py-5 flex flex-col items-center justify-center gap-2 font-semibold ${
                !connected
                  ? 'bg-white/10 opacity-50 cursor-not-allowed'
                  : `bg-gradient-to-r from-orange-500 to-green-600 hover:from-orange-600 hover:to-green-700 ${
                      vendorNextStep === 'go' ? 'ring-4 ring-orange-400/60' : ''
                    }`
              }`}
            >
              {live ? <Square className="w-8 h-8" /> : <Play className="w-8 h-8" />}
              <span className="text-sm">{live ? '4 Stop' : '4 Go'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                beep(520, 70)
                openView()
              }}
              className="rounded-2xl bg-white/10 hover:bg-white/15 px-4 py-5 flex flex-col items-center justify-center gap-2 font-semibold"
            >
              <MessageCircle className="w-8 h-8" />
              <span className="text-sm">Voir</span>
            </button>

            <button
              type="button"
              onClick={() => {
                beep(740, 80)
                speak(stepVoice.call)
                setShowCallDock(true)
                setCallDockMinimized(false)
                setCallStartSignal((v) => v + 1)
              }}
              className={`rounded-2xl bg-white/10 hover:bg-white/15 px-4 py-5 flex flex-col items-center justify-center gap-2 font-semibold ${
                vendorNextStep === 'call' ? 'ring-4 ring-orange-400/60' : ''
              }`}
            >
              <Phone className="w-8 h-8" />
              <span className="text-sm">5 Appeler</span>
            </button>

            <button
              type="button"
              onClick={() => {
                beep(520, 70)
                speak('Commandes')
                setShowOrdersSheet(true)
              }}
              className="col-span-2 rounded-2xl bg-white/10 hover:bg-white/15 px-4 py-5 flex flex-col items-center justify-center gap-2 font-semibold"
            >
              <Package className="w-8 h-8" />
              <span className="text-sm">Commandes</span>
            </button>
          </div>
        ) : (
          <div className="mt-3 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                beep(520, 70)
                openView()
              }}
              className="rounded-2xl bg-gradient-to-r from-orange-500 to-green-600 hover:from-orange-600 hover:to-green-700 px-4 py-5 flex flex-col items-center justify-center gap-2 font-semibold"
            >
              <Play className="w-8 h-8" />
              <span className="text-sm">Voir</span>
            </button>

            <button
              type="button"
              onClick={() => {
                beep(740, 80)
                setShowCallDock(true)
                setCallDockMinimized(false)
                setCallStartSignal((v) => v + 1)
              }}
              className="rounded-2xl bg-white/10 hover:bg-white/15 px-4 py-5 flex flex-col items-center justify-center gap-2 font-semibold"
            >
              <Phone className="w-8 h-8" />
              <span className="text-sm">Appeler</span>
            </button>

            <button
              type="button"
              onClick={openProduct}
              className="rounded-2xl bg-white/10 hover:bg-white/15 px-4 py-5 flex flex-col items-center justify-center gap-2 font-semibold"
            >
              <ShoppingBag className="w-8 h-8" />
              <span className="text-sm">Produit</span>
            </button>

            <button
              type="button"
              onClick={() => {
                beep(520, 60)
                speak('Achats')
                setShowMyOrdersSheet(true)
              }}
              className="rounded-2xl bg-white/10 hover:bg-white/15 px-4 py-5 flex flex-col items-center justify-center gap-2 font-semibold"
            >
              <Package className="w-8 h-8" />
              <span className="text-sm">Achats</span>
            </button>
          </div>
        )}

        <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
          <div className="break-all">Room: {roomId}</div>
          <div>
            {role === 'vendor'
              ? (ordersCount ? `Commandes: ${ordersCount}` : '')
              : (ordersCount ? `Achats: ${ordersCount}` : '')}
          </div>
        </div>
      </div>

      {showProduct && (
        <div className={`fixed inset-0 ${role === 'client' ? 'z-[95]' : 'z-[60]'} bg-black/80 flex items-center justify-center p-4`}>
          <div className="w-full max-w-md max-h-[85vh] overflow-y-auto rounded-2xl border border-white/10 bg-gray-900/70 backdrop-blur p-5 text-left">
            <div className="flex items-center justify-between">
              <div className="font-semibold">Produit du live</div>
              <button type="button" onClick={closeProduct} className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 font-semibold">
                Fermer
              </button>
            </div>

            {role === 'vendor' && (
                <div className="mt-3 grid grid-cols-1 gap-2">
                <button
                  type="button"
                  onClick={() => setProductTab('present')}
                  className={`px-3 py-2 rounded-xl text-sm font-semibold ${
                    productTab === 'present' ? 'bg-white/15' : 'bg-white/10 hover:bg-white/15'
                  }`}
                >
                  Présenter
                </button>
              </div>
            )}

            <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-4 flex flex-col sm:flex-row gap-4">
              <div className="min-w-0 flex-1">
                <div className="font-semibold truncate">{selectedProduct?.title || 'Produit'}</div>
                <div className="text-sm text-gray-300 truncate">{(selectedProduct?.priceCfa || 0).toLocaleString()} FCFA</div>
              </div>
              <div className="w-full sm:w-40 h-40 rounded-2xl bg-gradient-to-br from-orange-500/30 to-green-700/30 flex items-center justify-center overflow-hidden border border-white/10">
                {selectedProduct?.imageUrl ? (
                  <img
                    src={selectedProduct.imageUrl}
                    alt={selectedProduct.title || 'Produit'}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-5xl">{(selectedProduct?.emoji || '🧺') as any}</div>
                )}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-2">
              {role === 'vendor' && productTab === 'present' ? (
                <button
                  type="button"
                  onClick={() => {
                    if (!connected) {
                      speak('Non connecté')
                      return
                    }
                    if (selectedProduct?.id) setFeaturedProduct(selectedProduct.id)
                    setVendorPresentedOnce(true)
                    setShowProduct(false)
                    beep(990, 90)
                    speak(stepVoice.go)
                  }}
                  className={`w-full rounded-2xl bg-gradient-to-r from-orange-500 to-green-600 hover:from-orange-600 hover:to-green-700 px-4 py-4 font-semibold ${
                    role === 'vendor' && vendorNextStep === 'present' ? 'ring-4 ring-orange-400/60' : ''
                  }`}
                >
                  Présenter
                </button>
              ) : (
                <button
                  type="button"
                  onClick={async () => {
                    if (!connected) {
                      speak('Non connecté')
                      return
                    }
                    if (!live) {
                      speak('Live hors ligne')
                      return
                    }
                    if (!selectedProduct?.id) return
                    openCart(selectedProduct.id)
                  }}
                  className="w-full rounded-2xl bg-gradient-to-r from-orange-500 to-green-600 hover:from-orange-600 hover:to-green-700 px-4 py-4 font-semibold"
                >
                  Acheter
                </button>
              )}
            </div>

            <div className="mt-4">
              <div className="text-xs text-gray-300 mb-2">
                {role === 'vendor' ? (productTab === 'range' ? 'Sélectionner les produits du live' : 'Choisir un produit') : 'Produits'}
              </div>
              <div className="max-h-[38vh] overflow-y-auto pr-1">
                <div className="grid grid-cols-2 gap-2">
                  {(role === 'vendor' && productTab === 'range'
                    ? (String(shopSlug || '').trim() ? shopCatalogProducts || [] : catalogProducts || [])
                    : products || []
                  ).map((p) => {
                    const checked = role === 'vendor' && productTab === 'range' ? draftProductIds.includes(p.id) : false
                    return role === 'vendor' && productTab === 'range' ? (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          beep(740, 60)
                          setDraftProductIds((prev) => {
                            const list = Array.isArray(prev) ? prev : []
                            if (list.includes(p.id)) return list.filter((x) => x !== p.id)
                            return [...list, p.id]
                          })
                        }}
                        className={`rounded-xl border border-white/10 px-3 py-3 text-left bg-white/5 hover:bg-white/10 ${
                          checked ? 'ring-2 ring-orange-400/60' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input type="checkbox" readOnly checked={checked} className="w-4 h-4 accent-orange-500" />
                          <div className="w-10 h-10 rounded-lg bg-black/30 border border-white/10 overflow-hidden flex items-center justify-center">
                            {p.imageUrl ? (
                              <img src={p.imageUrl} alt={p.title} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                            ) : (
                              <div className="text-xl">{(p.emoji || '🧺') as any}</div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-semibold truncate">{p.title}</div>
                            <div className="text-xs text-gray-300 truncate">{p.priceCfa.toLocaleString()} FCFA</div>
                          </div>
                        </div>
                      </button>
                    ) : (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          beep(740, 70)
                          setSelectedProductId(p.id)
                          if (role === 'vendor') {
                            setFeaturedProduct(p.id)
                            speak('Présenté')
                          } else {
                            setClientManualProduct(true)
                            speak('Produit')
                          }
                        }}
                        className={`rounded-xl border border-white/10 px-3 py-3 text-left bg-white/5 hover:bg-white/10 ${
                          selectedProductId === p.id ? 'ring-2 ring-orange-400/60' : featuredProductId === p.id ? 'ring-2 ring-white/20' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 rounded-lg bg-black/30 border border-white/10 overflow-hidden flex items-center justify-center">
                            {p.imageUrl ? (
                              <img src={p.imageUrl} alt={p.title} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                            ) : (
                              <div className="text-xl">{(p.emoji || '🧺') as any}</div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-semibold truncate">{p.title}</div>
                            <div className="text-xs text-gray-300 truncate">{p.priceCfa.toLocaleString()} FCFA</div>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showRangeSheet && role === 'vendor' && (
        <div className="fixed inset-0 z-[70] pointer-events-none">
          <div
            className="absolute inset-0 bg-black/40 pointer-events-auto"
            onPointerDown={() => {
              setShowRangeSheet(false)
              beep(440, 60)
            }}
          />
          <div className="absolute left-0 right-0 bottom-0 pointer-events-auto">
            <div className="mx-auto w-full max-w-md rounded-t-3xl border border-white/10 bg-gray-900/90 backdrop-blur p-4 shadow-2xl">
              <div className="flex items-center justify-between gap-3">
                <div className="font-semibold">2 Gamme</div>
                <button
                  type="button"
                  onClick={() => {
                    setShowRangeSheet(false)
                    beep(440, 60)
                  }}
                  className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 font-semibold"
                >
                  Fermer
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowShopPicker(true)
                  beep(740, 60)
                  speak(stepVoice.shop)
                }}
                className="mt-3 w-full rounded-2xl bg-white/10 hover:bg-white/15 px-4 py-3 font-semibold text-left"
              >
                <div className="text-xs text-gray-300">Boutique</div>
                <div className="truncate">{shopSlug ? shopSlug : 'Choisir…'}</div>
              </button>

              {shopCatalogLoading ? (
                <div className="mt-3 text-sm text-gray-300 text-center py-6">Chargement des produits…</div>
              ) : (String(shopSlug || '').trim() ? shopCatalogProducts || [] : catalogProducts || []).length === 0 ? (
                <div className="mt-3 rounded-2xl border border-white/10 bg-black/20 p-4 text-left">
                  <div className="font-semibold">Aucun produit</div>
                  <div className="mt-1 text-sm text-gray-300">Cette boutique n’a pas encore de produits.</div>
                  <button
                    type="button"
                    onClick={() => {
                      beep(740, 60)
                      setShowShopPicker(true)
                      speak(stepVoice.shop)
                    }}
                    className="mt-3 w-full rounded-2xl bg-white/10 hover:bg-white/15 px-4 py-3 font-semibold"
                  >
                    Changer de boutique
                  </button>
                </div>
              ) : (
                <div className="mt-3 max-h-[42vh] overflow-y-auto pr-1">
                  <div className="grid grid-cols-1 gap-2">
                    {(String(shopSlug || '').trim() ? shopCatalogProducts || [] : catalogProducts || []).map((p) => {
                      const checked = draftProductIds.includes(p.id)
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            beep(740, 60)
                            setDraftProductIds((prev) => {
                              const list = Array.isArray(prev) ? prev : []
                              if (list.includes(p.id)) return list.filter((x) => x !== p.id)
                              return [...list, p.id]
                            })
                          }}
                          className={`rounded-2xl border border-white/10 px-3 py-3 text-left bg-white/5 hover:bg-white/10 ${
                            checked ? 'ring-2 ring-orange-400/60' : ''
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input type="checkbox" readOnly checked={checked} className="w-5 h-5 accent-orange-500" />
                            <div className="w-12 h-12 rounded-xl bg-black/30 border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
                              {p.imageUrl ? (
                                <img
                                  src={p.imageUrl}
                                  alt={p.title}
                                  loading="lazy"
                                  decoding="async"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="text-2xl">{(p.emoji || '🧺') as any}</div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold truncate">{p.title}</div>
                              <div className="text-sm text-gray-300 truncate">{p.priceCfa.toLocaleString()} FCFA</div>
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    if (rangeApplyStatus === 'applying') return
                    if (!connected) {
                      speak('Non connecté')
                      return
                    }
                    const ids = (Array.isArray(draftProductIds) ? draftProductIds : []).map((x) => String(x || '').trim()).filter(Boolean)
                    if (!ids.length) {
                      speak('Choisir au moins un produit')
                      return
                    }
                    setRangeApplyStatus('applying')
                    const hasShopCatalog = !!String(shopSlug || '').trim() && Array.isArray(shopCatalogProducts) && shopCatalogProducts.length
                    const byId = hasShopCatalog ? new Map(shopCatalogProducts.map((p) => [p.id, p])) : null
                    const chosenProducts = hasShopCatalog ? ids.map((id) => byId?.get(id)).filter(Boolean) : []
                    const res = await setProductsSelection(
                      hasShopCatalog ? { products: chosenProducts as LiveProduct[] } : { productIds: ids },
                    ).catch(() => ({ ok: false as const }))
                    setRangeApplyStatus('idle')
                    beep(990, 90)
                    speak(res.ok ? stepVoice.present : 'Erreur')
                    if (res.ok) {
                      setVendorPresentedOnce(false)
                      if (hasShopCatalog) {
                        const slug = String(shopSlug || '').trim()
                        setLastAppliedShopSlug(slug)
                        try {
                          sessionStorage.setItem('mangoo_live_last_applied_shop_slug_v1', slug)
                        } catch {
                        }
                      }
                      setShowRangeSheet(false)
                    }
                  }}
                  className="rounded-2xl bg-gradient-to-r from-orange-500 to-green-600 hover:from-orange-600 hover:to-green-700 px-4 py-4 font-semibold"
                >
                  {rangeApplyStatus === 'applying' ? 'Application…' : 'Appliquer'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowRangeSheet(false)
                    beep(440, 60)
                  }}
                  className="rounded-2xl bg-white/10 hover:bg-white/15 px-4 py-4 font-semibold"
                >
                  Plus tard
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showOrdersSheet && role === 'vendor' && (
        <div className="fixed inset-0 z-[85] pointer-events-none">
          <div
            className="absolute inset-0 bg-black/40 pointer-events-auto"
            onPointerDown={() => {
              setShowOrdersSheet(false)
              beep(440, 60)
            }}
          />
          <div className="absolute left-0 right-0 bottom-0 pointer-events-auto">
            <div className="mx-auto w-full max-w-md rounded-t-3xl border border-white/10 bg-gray-900/90 backdrop-blur p-4 shadow-2xl">
              <div className="flex items-center justify-between gap-2">
                <div className="font-semibold">Commandes</div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      beep(520, 60)
                      fetchRoomOrders()
                    }}
                    className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 font-semibold"
                  >
                    Actualiser
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowOrdersSheet(false)
                      beep(440, 60)
                    }}
                    className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 font-semibold"
                  >
                    Fermer
                  </button>
                </div>
              </div>

              {ordersError ? <div className="mt-2 text-sm text-orange-200">{ordersError}</div> : null}

              <div className="mt-3 max-h-[58vh] overflow-y-auto pr-1">
                {ordersLoading ? (
                  <div className="text-sm text-gray-300 text-center py-10">Chargement…</div>
                ) : roomOrders.length === 0 ? (
                  <div className="text-sm text-gray-300 text-center py-10">Aucune commande</div>
                ) : (
                  <div className="grid grid-cols-1 gap-2">
                    {roomOrders.map((o: any) => {
                      const id = String(o?.id || '').trim()
                      const title = String(o?.product?.title || 'Produit').trim()
                      const qty = Number(o?.qty || 1) || 1
                      const status = String(o?.status || '').trim()
                      const paid = String(o?.payment?.status || '').trim() === 'succeeded'
                      const released = Boolean(o?.escrow?.released)
                      const canMarkDelivered = paid && status !== 'escrow_released' && status !== 'cancelled'
                      const alreadyDelivered = status === 'delivered' || status === 'received' || status === 'escrow_released'
                      return (
                        <div key={id || title} className="rounded-2xl border border-white/10 bg-black/20 p-3">
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0 text-left">
                              <div className="font-semibold truncate">
                                {qty}× {title}
                              </div>
                              <div className="text-xs text-gray-300 truncate">
                                {paid ? 'Payé (escrow)' : 'Non payé'}{released ? ' • Libéré' : ''}
                              </div>
                            </div>
                            <div className="text-xs font-semibold px-2 py-1 rounded-lg bg-white/10">
                              {status || '—'}
                            </div>
                          </div>
                          <div className="mt-2 grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              disabled={!id || !canMarkDelivered || alreadyDelivered}
                              onClick={() => markDelivered(id)}
                              className={`rounded-2xl px-3 py-3 font-semibold ${
                                !id || !canMarkDelivered || alreadyDelivered
                                  ? 'bg-white/10 opacity-60 cursor-not-allowed'
                                  : 'bg-gradient-to-r from-orange-500 to-green-600 hover:from-orange-600 hover:to-green-700'
                              }`}
                            >
                              Livré
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                beep(520, 60)
                                fetchRoomOrders()
                              }}
                              className="rounded-2xl px-3 py-3 font-semibold bg-white/10 hover:bg-white/15"
                            >
                              Voir
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showMyOrdersSheet && role === 'client' && (
        <div className="fixed inset-0 z-[85] pointer-events-none">
          <div
            className="absolute inset-0 bg-black/40 pointer-events-auto"
            onPointerDown={() => {
              setShowMyOrdersSheet(false)
              beep(440, 60)
            }}
          />
          <div className="absolute left-0 right-0 bottom-0 pointer-events-auto">
            <div className="mx-auto w-full max-w-md rounded-t-3xl border border-white/10 bg-gray-900/90 backdrop-blur p-4 shadow-2xl">
              <div className="flex items-center justify-between gap-2">
                <div className="font-semibold">Mes achats</div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      beep(520, 60)
                      fetchMyOrders()
                    }}
                    className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 font-semibold"
                  >
                    Actualiser
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowMyOrdersSheet(false)
                      beep(440, 60)
                    }}
                    className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 font-semibold"
                  >
                    Fermer
                  </button>
                </div>
              </div>

              {myOrdersError ? <div className="mt-2 text-sm text-orange-200">{myOrdersError}</div> : null}

              <div className="mt-3 max-h-[58vh] overflow-y-auto pr-1">
                {myOrdersLoading ? (
                  <div className="text-sm text-gray-300 text-center py-10">Chargement…</div>
                ) : myOrders.length === 0 ? (
                  <div className="text-sm text-gray-300 text-center py-10">Aucun achat</div>
                ) : (
                  <div className="grid grid-cols-1 gap-2">
                    {myOrders.map((o: any) => {
                      const id = String(o?.id || '').trim()
                      const title = String(o?.product?.title || 'Produit').trim()
                      const qty = Number(o?.qty || 1) || 1
                      const status = String(o?.status || '').trim()
                      const paid = String(o?.payment?.status || '').trim() === 'succeeded'
                      const released = Boolean(o?.escrow?.released)
                      const canConfirm = paid && status === 'delivered' && !released
                      return (
                        <div key={id || title} className="rounded-2xl border border-white/10 bg-black/20 p-3">
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0 text-left">
                              <div className="font-semibold truncate">
                                {qty}× {title}
                              </div>
                              <div className="text-xs text-gray-300 truncate">
                                {paid ? 'Payé (escrow)' : 'Non payé'}{released ? ' • Libéré' : ''}
                              </div>
                            </div>
                            <div className="text-xs font-semibold px-2 py-1 rounded-lg bg-white/10">
                              {status || '—'}
                            </div>
                          </div>
                          <div className="mt-2 grid grid-cols-1 gap-2">
                            <button
                              type="button"
                              disabled={!id || !canConfirm}
                              onClick={() => confirmReceivedById(id)}
                              className={`rounded-2xl px-3 py-3 font-semibold ${
                                !id || !canConfirm
                                  ? 'bg-white/10 opacity-60 cursor-not-allowed'
                                  : 'bg-gradient-to-r from-orange-500 to-green-600 hover:from-orange-600 hover:to-green-700'
                              }`}
                            >
                              J'ai reçu
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showCartSheet && role === 'client' && (
        <div className="fixed inset-0 z-[96] pointer-events-none">
          <div
            className="absolute inset-0 bg-black/40 pointer-events-auto"
            onPointerDown={() => {
              setShowCartSheet(false)
              setShowCartMethodPicker(false)
              beep(440, 60)
            }}
          />
          <div className="absolute left-0 right-0 bottom-0 pointer-events-auto">
            <div className="mx-auto w-full max-w-md rounded-t-3xl border border-white/10 bg-gray-900/90 backdrop-blur p-4 shadow-2xl">
              <div className="flex items-center justify-between gap-3">
                <div className="font-semibold">Panier</div>
                <button
                  type="button"
                  onClick={() => {
                    setShowCartSheet(false)
                    setShowCartMethodPicker(false)
                    beep(440, 60)
                  }}
                  className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 font-semibold"
                >
                  Fermer
                </button>
              </div>

              <div className="mt-3 rounded-2xl border border-white/10 bg-black/20 p-3 text-left">
                <div className="text-xs text-gray-300">Produit</div>
                <div className="mt-1 font-semibold truncate">{cartProduct?.title || 'Produit'}</div>
                <div className="text-sm text-gray-300 truncate">
                  {cartProduct?.priceCfa ? `${cartProduct.priceCfa.toLocaleString()} FCFA` : ''}
                </div>
              </div>

              {cartPayStatus !== 'paid' ? (
                <>
                  <div className="mt-3 rounded-2xl border border-white/10 bg-black/20 p-3 text-left">
                    <div className="text-xs text-gray-300">Téléphone</div>
                    <input
                      value={cartPhoneNumber}
                      onChange={(e) => setCartPhoneNumber(String(e.target.value || ''))}
                      inputMode="tel"
                      placeholder="Ex: 77…"
                      className="mt-2 w-full bg-black/30 border border-white/10 rounded-xl px-3 py-3 outline-none focus:border-white/20 text-white text-lg"
                    />
                  </div>

                  <div className="mt-3 rounded-2xl border border-white/10 bg-black/20 p-3 text-left">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="text-xs text-gray-300">Paiement</div>
                        <div className="mt-1 font-semibold">
                          {cartPaymentMethod === 'wave'
                            ? 'Wave'
                            : cartPaymentMethod === 'mtn_momo'
                              ? 'MTN MoMo'
                              : cartPaymentMethod === 'moov_money'
                                ? 'Moov Money'
                                : cartPaymentMethod === 'free_mobile'
                                  ? 'Free Money'
                                  : 'Orange Money'}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          beep(520, 60)
                          setShowCartMethodPicker((v) => !v)
                        }}
                        className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 font-semibold"
                      >
                        Changer
                      </button>
                    </div>

                    {showCartMethodPicker && (
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        {(
                          defaultMobileMoneyMethod === 'wave'
                            ? ['wave', 'orange_money', 'mtn_momo', 'moov_money']
                            : defaultMobileMoneyMethod === 'mtn_momo'
                              ? ['mtn_momo', 'orange_money', 'wave', 'moov_money']
                              : ['orange_money', 'mtn_momo', 'wave', 'moov_money']
                        ).map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => {
                              beep(740, 60)
                              setCartPaymentMethod(m)
                              setShowCartMethodPicker(false)
                            }}
                            className={`px-3 py-3 rounded-2xl font-semibold ${
                              cartPaymentMethod === m ? 'bg-white/15 ring-2 ring-orange-400/60' : 'bg-white/10 hover:bg-white/15'
                            }`}
                          >
                            {m === 'wave'
                              ? 'Wave'
                              : m === 'mtn_momo'
                                ? 'MTN MoMo'
                                : m === 'moov_money'
                                  ? 'Moov'
                                  : m === 'free_mobile'
                                    ? 'Free'
                                    : 'Orange'}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-3 rounded-2xl border border-white/10 bg-black/20 p-3 text-left">
                    <div className="text-xs text-gray-300">Total</div>
                    <div className="mt-2 space-y-1 text-sm text-gray-200">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-gray-300">Sous-total</div>
                        <div className="font-semibold">{cartTotals.subtotal.toLocaleString()} FCFA</div>
                      </div>
                      <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between gap-3">
                        <div className="font-semibold">À payer</div>
                        <div className="text-lg font-bold">{cartTotals.total.toLocaleString()} FCFA</div>
                      </div>
                      <div className="mt-1 text-xs text-gray-400">
                        Frais Mobile Money pris en charge.
                      </div>
                    </div>
                  </div>

                  {cartError ? <div className="mt-2 text-sm text-orange-200">{cartError}</div> : null}

                  <div className="mt-3 grid grid-cols-1 gap-2">
                    <button
                      type="button"
                      disabled={cartPayStatus === 'creating' || cartPayStatus === 'paying'}
                      onClick={createAndPayCart}
                      className={`rounded-2xl px-4 py-4 font-semibold ${
                        cartPayStatus === 'creating' || cartPayStatus === 'paying'
                          ? 'bg-white/10 opacity-60 cursor-not-allowed'
                          : 'bg-gradient-to-r from-orange-500 to-green-600 hover:from-orange-600 hover:to-green-700'
                      }`}
                    >
                      {cartPayStatus === 'creating' ? 'Commande…' : cartPayStatus === 'paying' ? 'Paiement…' : 'Payer'}
                    </button>
                  </div>
                </>
              ) : (
                <div className="mt-3">
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-left">
                    <div className="text-lg font-semibold">Payé</div>
                    <div className="mt-1 text-sm text-gray-300">Le vendeur est payé après réception.</div>
                    {cartOrderId ? <div className="mt-2 text-xs text-gray-400 break-all">Commande: {cartOrderId}</div> : null}
                  </div>
                  <div className="mt-3 grid grid-cols-1 gap-2">
                    <button
                      type="button"
                      onClick={confirmReceived}
                      className="rounded-2xl bg-gradient-to-r from-orange-500 to-green-600 hover:from-orange-600 hover:to-green-700 px-4 py-4 font-semibold"
                    >
                      J'ai reçu
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showShopPicker && role === 'vendor' && (
        <div className="fixed inset-0 z-[90] bg-black/80 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-gray-900/80 backdrop-blur p-5 text-left">
            <div className="flex items-center justify-between">
              <div className="font-semibold">Choisir la boutique</div>
              <button
                type="button"
                onClick={() => setShowShopPicker(false)}
                className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 font-semibold"
              >
                Fermer
              </button>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                <input
                  value={shopSearch}
                  onChange={(e) => setShopSearch(String(e.target.value || ''))}
                  placeholder="Chercher…"
                  className="w-full bg-black/30 border border-white/10 rounded-xl pl-10 pr-3 py-2 outline-none focus:border-white/20 text-white"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  beep(740, 60)
                  startShopVoiceSearch()
                }}
                className={`px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 font-semibold ${shopVoiceListening ? 'ring-2 ring-orange-400/60 animate-pulse' : ''}`}
              >
                <Mic className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-2 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  beep(520, 60)
                  setShopOnlyWithProducts((v) => !v)
                }}
                className={`px-3 py-2 rounded-xl text-xs font-semibold ${shopOnlyWithProducts ? 'bg-white/15' : 'bg-white/10 hover:bg-white/15'}`}
              >
                {shopOnlyWithProducts ? 'Filtre: ON' : 'Filtre: OFF'}
              </button>
              <button
                type="button"
                onClick={() => {
                  beep(440, 60)
                  setShopSearch('')
                }}
                className="px-3 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15"
              >
                Effacer
              </button>
            </div>

            <div className="mt-2 text-[11px] text-gray-300">
              {shopOnlyWithProducts ? 'Affiche seulement les boutiques avec produits.' : 'Affiche toutes les boutiques (même vides).'}
            </div>

            <div className="mt-3 rounded-2xl border border-white/10 bg-black/20 p-3 max-h-[58vh] overflow-y-auto">
              {shopsLoading ? (
                <div className="text-sm text-gray-300 text-center py-10">Chargement…</div>
              ) : filteredShops.length === 0 ? (
                <div className="text-sm text-gray-300 text-center py-10">Aucune boutique</div>
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  {visibleFilteredShops.map((s) => {
                    const slug = String((s as any)?.slug || '').trim()
                    const name = String((s as any)?.name || slug || 'Boutique').trim()
                    const logo = String((s as any)?.logo || '').trim()
                    const active = !!slug && slug === String(shopSlug || '').trim()
                    const count = (s as any)?.count
                    return (
                      <button
                        key={slug || name}
                        type="button"
                        onPointerDown={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          if (!slug) return
                          const now = Date.now()
                          if (now - shopPickGuardRef.current < 600) return
                          shopPickGuardRef.current = now
                          onPickShopSlug?.(slug)
                          setProductTab('range')
                          beep(880, 70)
                          speak(stepVoice.range)
                          setShowShopPicker(false)
                          setShowRangeSheet(true)
                        }}
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                        }}
                        className={`w-full rounded-xl border border-white/10 px-3 py-3 text-left bg-white/5 hover:bg-white/10 ${
                          active ? 'ring-2 ring-orange-400/60' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-black/30 border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
                            {logo ? (
                              <img src={logo} alt={name} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                            ) : (
                              <div className="text-2xl">🏪</div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold truncate">{name}</div>
                            <div className="text-xs text-gray-300 truncate">{slug}</div>
                          </div>
                          <div className="ml-auto shrink-0 px-2 py-1 rounded-lg bg-white/10 text-xs font-semibold flex items-center gap-1">
                            <Package className="w-4 h-4" />
                            <span>
                              {typeof count === 'number' ? `Produits: ${String(count)}` : '…'}
                            </span>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {filteredShops.length > visibleFilteredShops.length && (
              <button
                type="button"
                onClick={() => {
                  beep(520, 60)
                  setShopListLimit((v) => Math.min(200, v + 25))
                }}
                className="mt-2 w-full rounded-2xl bg-white/10 hover:bg-white/15 px-4 py-3 font-semibold"
              >
                Plus
              </button>
            )}

          </div>
        </div>
      )}

      {showChat && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="w-full max-w-md max-h-[85vh] overflow-hidden rounded-2xl border border-white/10 bg-gray-900/70 backdrop-blur p-5 text-left flex flex-col min-h-0">
            <div className="flex items-center justify-between">
              <div className="font-semibold">Live</div>
              <button type="button" onClick={closeChat} className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 font-semibold">
                Fermer
              </button>
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs text-gray-300">Produit en vedette</div>
                <div className="font-semibold truncate">{featuredProduct?.title || '—'}</div>
              </div>
              <button
                type="button"
                onClick={openProduct}
                className="shrink-0 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 font-semibold"
              >
                Produit
              </button>
            </div>

            <div className="mt-4 flex-1 min-h-0 rounded-2xl border border-white/10 bg-black/20 overflow-y-auto p-3 space-y-2">
              {messages.length === 0 ? (
                <div className="text-sm text-gray-400 text-center py-10">Aucun commentaire</div>
              ) : (
                messages
                  .slice()
                  .reverse()
                  .map((m) => (
                    <div key={m.id} className="text-sm">
                      <span className={`font-semibold ${m.fromRole === 'vendor' ? 'text-orange-200' : 'text-green-200'}`}>
                        {m.fromName}:
                      </span>{' '}
                      <span className="text-gray-100">{m.text}</span>
                    </div>
                  ))
              )}
            </div>

            <div className="mt-3 flex gap-2">
              <input
                value={chatText}
                onChange={(e) => setChatText(e.target.value)}
                placeholder={role === 'vendor' ? 'Commenter…' : 'Question…'}
                className="flex-1 bg-black/30 border border-white/10 rounded-xl px-3 py-2 outline-none focus:border-white/20 text-white"
              />
              <button
                type="button"
                onClick={async () => {
                  if (!connected) {
                    speak('Non connecté')
                    return
                  }
                  const t = String(chatText || '').trim()
                  if (!t) return
                  setChatText('')
                  const res = await sendChat(t)
                  beep(740, 70)
                  speak(res.ok ? 'Envoyé' : 'Erreur')
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-green-600 hover:from-orange-600 hover:to-green-700 font-semibold"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {[
                role === 'vendor' ? 'Bienvenue' : 'Prix ?',
                role === 'vendor' ? 'Promo' : 'Disponible ?',
                role === 'vendor' ? 'Merci' : 'Je veux acheter',
              ].map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setChatText(q)}
                  className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {showCallDock && (
        <div
          style={{ zIndex: role === 'vendor' ? 80 : 50 }}
          className={`fixed bottom-4 right-4 rounded-2xl border border-white/10 bg-black/60 backdrop-blur overflow-hidden shadow-2xl ${
            callDockMinimized ? 'w-[360px] h-[260px]' : 'w-[92vw] h-[90vh] max-w-[980px] max-h-[860px]'
          } ${role === 'client' && (showProduct || showCartSheet) ? 'pointer-events-none' : ''}`}
        >
          <div className="px-3 py-2 flex items-center justify-between border-b border-white/10 bg-black/40">
            <div className="text-xs font-semibold text-white truncate">Appel privé</div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCallDockMinimized((v) => !v)}
                className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/15"
              >
                {callDockMinimized ? <Maximize2 className="w-4 h-4 text-white" /> : <Minus className="w-4 h-4 text-white" />}
              </button>
              <button
                type="button"
                onClick={() => {
                  setCallHangupSignal((v) => v + 1)
                  if (role === 'client') {
                    setShowCallDock(true)
                    setCallDockMinimized(true)
                    return
                  }
                  setShowCallDock(false)
                }}
                className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/15"
              >
                <PhoneOff className="w-4 h-4 text-white" />
              </button>
              <button
                type="button"
                onClick={() => {
                  if (role === 'client') {
                    setShowCallDock(true)
                    setCallDockMinimized(true)
                    return
                  }
                  setShowCallDock(false)
                }}
                className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/15"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
          <div className="h-[calc(100%-44px)]">
            <WebRTCManagerConnectPlus
              role={role}
              roomId={callRoomId}
              userId={userId}
              ui="full"
              fromLabel={userName}
              videoFit="contain"
              pipSize={callDockMinimized ? 'md' : 'xl'}
              hangupSignal={callHangupSignal}
              startCallSignal={callStartSignal}
              onIncomingCall={() => {
                setShowCallDock(true)
                setCallDockMinimized(false)
              }}
            />
          </div>
        </div>
      )}

      {role === 'vendor' && lastPurchase && (
        <div className="fixed bottom-4 left-4 z-40 rounded-xl border border-white/10 bg-black/60 backdrop-blur px-4 py-3 text-white text-sm">
          Achat: {lastPurchase.qty}× {products.find((p) => p.id === lastPurchase.productId)?.title || 'Produit'}
        </div>
      )}
    </div>
  )
}

const LiveShoppingJoinPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const roleParam = String(searchParams.get('role') || '').toLowerCase()
  const roomId = String(searchParams.get('roomId') || 'live-demo-123')
  const role: Role = roleParam === 'client' ? 'client' : 'vendor'
  const uiParam = String(searchParams.get('ui') || '').toLowerCase()
  const ui: UI = uiParam === 'simple' ? 'simple' : 'full'
  const instanceId = useMemo(() => Math.random().toString(36).slice(2, 10), [])
  const forcedUserId = String(searchParams.get('userId') || '').trim()
  const userId = forcedUserId || `${role}_${instanceId}`
  const userName = String(searchParams.get('name') || '').trim() || (role === 'vendor' ? 'Vendeur' : 'Client')
  const shopSlug = String(searchParams.get('shopSlug') || '').trim() || undefined

  const roomQs = encodeURIComponent(roomId)
  const shopQs = shopSlug ? `&shopSlug=${encodeURIComponent(shopSlug)}` : ''
  const vendorHref = `/live-shopping?role=vendor&roomId=${roomQs}${shopQs}`
  const clientHref = `/live-shopping?role=client&roomId=${roomQs}${shopQs}`
  const vendorHrefSimple = `${vendorHref}&ui=simple`
  const clientHrefSimple = `${clientHref}&ui=simple`

  return (
    <div className="h-dvh overflow-hidden bg-gradient-to-br from-gray-950 via-gray-950 to-green-950">
      <div className="max-w-6xl mx-auto h-full p-4 flex flex-col gap-4">
        <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <img src={mangooLogoUrl} alt="Mangoo Tech" className="w-10 h-10 shrink-0" />
            <div className="min-w-0">
              <div className="text-white font-semibold text-lg leading-tight">Mangoo Live Shopping</div>
              <div className="text-gray-300 text-xs sm:text-sm truncate">
                Room: {roomId} • {role === 'vendor' ? 'Vendeur' : 'Client'} • UI: {ui === 'simple' ? 'Simple' : 'Complète'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={ui === 'simple' ? vendorHrefSimple : vendorHref}
              className={`text-xs font-semibold px-3 py-2 rounded-xl transition-colors ${role === 'vendor' ? 'bg-gradient-to-r from-orange-500 to-green-600 text-white' : 'bg-white/10 hover:bg-white/15 text-white'}`}
            >
              Vendeur
            </a>
            <a
              href={ui === 'simple' ? clientHrefSimple : clientHref}
              className={`text-xs font-semibold px-3 py-2 rounded-xl transition-colors ${role === 'client' ? 'bg-gradient-to-r from-orange-500 to-green-600 text-white' : 'bg-white/10 hover:bg-white/15 text-white'}`}
            >
              Client
            </a>
            <a
              href="/"
              className="text-xs sm:text-sm font-semibold px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white transition-colors"
            >
              Retour
            </a>
          </div>
        </div>

        <div className="flex-1 min-h-0 rounded-2xl border border-white/10 bg-black/20 overflow-y-auto">
          {ui === 'simple' ? (
            <LiveShoppingUltraSimple
              role={role}
              roomId={roomId}
              userId={userId}
              userName={userName}
              shopSlug={shopSlug}
              onPickShopSlug={(slug) => {
                const next = new URLSearchParams(searchParams)
                next.set('shopSlug', slug)
                setSearchParams(next, { replace: true })
              }}
            />
          ) : (
            <div className="h-full w-full">
              <LiveShoppingManager
                mode={role === 'vendor' ? 'host' : 'viewer'}
                roomId={roomId}
                userId={userId}
                userName={userName}
                embedded
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default LiveShoppingJoinPage
