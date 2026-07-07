import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { toast } from 'sonner';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Store, MapPin, Star, Package, Calendar, Shield, Truck, Heart, Share2, Users, ShoppingCart, Clock, Phone, X } from 'lucide-react';
import VendorProductManager from '../../components/VendorProductManager';
import { isLocalSyncEnabled, localSync } from '../../utils/localSyncClient';
import { supabase, supabaseConfig } from '../../config/supabase';
import Footer from '../../components/layout/Footer';

const normalizeText = (value) => {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

const parseHHMM = (value) => {
  const s = String(value || '').trim()
  const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(s)
  if (!m) return null
  return (Number(m[1]) * 60) + Number(m[2])
}

const getNowMinutesInTimezone = (timeZone, nowMs) => {
  const tz = String(timeZone || '').trim()
  const baseDate = Number.isFinite(Number(nowMs)) ? new Date(Number(nowMs)) : new Date()

  const tryTz = (candidateTz) => {
    const ctz = String(candidateTz || '').trim()
    if (!ctz) return null
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: ctz,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(baseDate)
    const h = Number(parts.find((p) => p.type === 'hour')?.value || '')
    const min = Number(parts.find((p) => p.type === 'minute')?.value || '')
    if (!Number.isFinite(h) || !Number.isFinite(min)) return null
    return (h * 60) + min
  }

  try {
    const direct = tryTz(tz)
    if (direct !== null) return direct
    const alias = (() => {
      if (tz === 'Africa/Douala') return 'Africa/Lagos'
      if (tz === 'UTC') return 'Etc/UTC'
      return ''
    })()
    const fallbackTz = tryTz(alias)
    if (fallbackTz !== null) return fallbackTz
    return (baseDate.getHours() * 60) + baseDate.getMinutes()
  } catch {
    return (baseDate.getHours() * 60) + baseDate.getMinutes()
  }
}

const computeOpenMeta = (shop, nowMs) => {
  const countryNorm = normalizeText(shop?.address?.country || shop?.country || '')
  const countryIsCM = countryNorm === 'cm' || countryNorm.includes('cameroun') || countryNorm.includes('cameroon')
  const countryIsSN = countryNorm === 'sn' || countryNorm.includes('senegal') || countryNorm.includes('sene')
  const countryIsCI = countryNorm === 'ci'
    || countryNorm.includes("cote d'ivoire")
    || countryNorm.includes('cote divoire')
    || countryNorm.includes('ivoire')
    || countryNorm.includes('civ')
  const defaultSchedule = (() => {
    if (countryIsCM) return { open: '08:00', close: '22:00' }
    if (countryIsSN) return { open: '08:00', close: '22:00' }
    if (countryIsCI) {
      return { open: '08:00', close: '22:00' }
    }
    return { open: '08:00', close: '22:00' }
  })()

  const openRaw0 = String(shop?.openTime || shop?.open_time || '').trim()
  const closeRaw0 = String(shop?.closeTime || shop?.close_time || '').trim()
  const openRaw = openRaw0 || defaultSchedule.open
  const closeRaw = closeRaw0 || defaultSchedule.close
  const open = parseHHMM(openRaw)
  const close = parseHHMM(closeRaw)
  const isDefault = !openRaw0 || !closeRaw0 || open === null || close === null
  if (open === null || close === null) {
    const open2 = parseHHMM(defaultSchedule.open)
    const close2 = parseHHMM(defaultSchedule.close)
    if (open2 === null || close2 === null) return { hasSchedule: false }
    const inferredTz2 = (() => {
      const tz = String(shop?.timezone || '').trim()
      if (tz) return tz
      if (import.meta?.env?.DEV) {
        try {
          const browserTz = String(Intl.DateTimeFormat().resolvedOptions().timeZone || '').trim()
          if (browserTz) return browserTz
        } catch {
        }
      }
      if (countryIsCM) return 'Africa/Douala'
      if (countryIsSN) return 'Africa/Dakar'
      if (countryIsCI) return 'Africa/Abidjan'
      return 'Africa/Abidjan'
    })()
    const nowMinutes2 = getNowMinutesInTimezone(inferredTz2, nowMs)
    const overnight2 = close2 <= open2
    const isOpen2 = overnight2 ? (nowMinutes2 >= open2 || nowMinutes2 < close2) : (nowMinutes2 >= open2 && nowMinutes2 < close2)
    return { hasSchedule: true, isOpen: isOpen2, openRaw: defaultSchedule.open, closeRaw: defaultSchedule.close, timezone: inferredTz2, isDefault: true }
  }

  const inferredTz = (() => {
    const tz = String(shop?.timezone || '').trim()
    if (tz) return tz
    if (import.meta?.env?.DEV) {
      try {
        const browserTz = String(Intl.DateTimeFormat().resolvedOptions().timeZone || '').trim()
        if (browserTz) return browserTz
      } catch {
      }
    }
    if (countryIsCM) return 'Africa/Douala'
    if (countryIsSN) return 'Africa/Dakar'
    if (countryIsCI) return 'Africa/Abidjan'
    return 'Africa/Abidjan'
  })()

  const nowMinutes = getNowMinutesInTimezone(inferredTz, nowMs)
  const overnight = close <= open
  const isOpen = overnight ? (nowMinutes >= open || nowMinutes < close) : (nowMinutes >= open && nowMinutes < close)
  return { hasSchedule: true, isOpen, openRaw, closeRaw, timezone: inferredTz, isDefault }
}

const readLocalScheduleForSlug = (slug) => {
  const s = String(slug || '').trim()
  if (!s) return null
  try {
    const raw = localStorage.getItem('demo_shops')
    const parsed = raw ? JSON.parse(raw) : []
    const list = Array.isArray(parsed) ? parsed : []
    const hit = list.find((x) => String(x?.slug || '').trim() === s) || null
    if (!hit) return null
    return {
      openTime: String(hit?.openTime || hit?.open_time || '').trim(),
      closeTime: String(hit?.closeTime || hit?.close_time || '').trim(),
      timezone: String(hit?.timezone || hit?.timeZone || '').trim(),
    }
  } catch {
    return null
  }
}

const readLocalContactsForSlug = (slug) => {
  const s = String(slug || '').trim()
  if (!s) return null
  try {
    const raw = localStorage.getItem('demo_shops')
    const parsed = raw ? JSON.parse(raw) : []
    const list = Array.isArray(parsed) ? parsed : []
    const hit = list.find((x) => String(x?.slug || '').trim() === s) || null
    if (!hit) return null
    return {
      phone: String(hit?.phone || hit?.contact_phone || '').trim(),
      email: String(hit?.contact_email || hit?.email || hit?.ownerEmail || hit?.owner_email || '').trim(),
    }
  } catch {
    return null
  }
}

const ShopPage = () => {
  const { shopSlug } = useParams();
  const navigate = useNavigate();
  const forceClientView = (() => {
    try {
      const qs = new URLSearchParams(window.location.search)
      const v = String(qs.get('view') || qs.get('mode') || qs.get('as') || '').trim().toLowerCase()
      return v === 'client' || v === 'user' || v === 'buyer'
    } catch {
      return false
    }
  })()
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('products');
  const [isFollowing, setIsFollowing] = useState(false);
  const [canManageProducts, setCanManageProducts] = useState(false);
  const [showVendorManager, setShowVendorManager] = useState(false);
  const [shopOwnerEmail, setShopOwnerEmail] = useState('');
  const [showVendorMode, setShowVendorMode] = useState(false);
  const [vendorEmail, setVendorEmail] = useState('');
  const [pendingMismatch, setPendingMismatch] = useState(false);
  const [boostStatus, setBoostStatus] = useState({ sponsored: false, promo: false, neu: false });
  const [nowMs, setNowMs] = useState(() => Date.now())
  const [liveRoom, setLiveRoom] = useState({ live: false, updatedAt: '' })
  const [showHoursModal, setShowHoursModal] = useState(false)
  const [hoursOpen, setHoursOpen] = useState('')
  const [hoursClose, setHoursClose] = useState('')
  const [hoursTimezone, setHoursTimezone] = useState('')
  const [hoursSaving, setHoursSaving] = useState(false)
  const shopOpenTime = String(shop?.openTime || shop?.open_time || '').trim()
  const shopCloseTime = String(shop?.closeTime || shop?.close_time || '').trim()
  const shopTimezone = String(shop?.timezone || '').trim()

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 30000)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    const slug = String(shopSlug || '').trim()
    if (!slug) return
    let alive = true
    const fetchRoom = async (roomId) => {
      try {
        const res = await fetch(`/api/live-shopping/room/${encodeURIComponent(roomId)}`)
        const json = await res.json().catch(() => null)
        if (!alive) return
        if (res.ok && json?.success) {
          const r = json?.room
          if (r && typeof r === 'object') {
            return { live: Boolean(r?.live), updatedAt: String(r?.updatedAt || '') }
          }
        }
      } catch {
      }
      return null
    }
    const fetchOnce = async () => {
      const candidates = [`shop:${slug}`, `live:${slug}`, slug]
      for (const roomId of candidates) {
        const r = await fetchRoom(roomId)
        if (r) {
          if (alive) setLiveRoom(r)
          return
        }
      }
      if (alive) setLiveRoom({ live: false, updatedAt: '' })
    }
    void fetchOnce()
    const poll = window.setInterval(fetchOnce, 6000)
    return () => {
      alive = false
      window.clearInterval(poll)
    }
  }, [shopSlug])

  useEffect(() => {
    if (!showVendorMode) return
    try {
      const key = `mangoo_vendor_email:${String(shopSlug || '')}`
      const stored = String(localStorage.getItem(key) || '').trim()
      if (stored) setVendorEmail(stored)
    } catch {
    }
  }, [shopSlug, showVendorMode])

  useEffect(() => {
    if (!forceClientView) return
    setCanManageProducts(false)
    setShowVendorManager(false)
    setShowVendorMode(false)
    setVendorEmail('')
    setPendingMismatch(false)
  }, [forceClientView, shopSlug])

  useEffect(() => {
    if (!shop?.slug) return
    setHoursOpen(shopOpenTime)
    setHoursClose(shopCloseTime)
    setHoursTimezone(shopTimezone)
  }, [shop?.slug, shopCloseTime, shopOpenTime, shopTimezone])

  const openConnectPlusCall = (role) => {
    const slug = String(shopSlug || '').trim()
    if (!slug) return
    const roomId = `shop:${slug}`
    const label = String(shop?.name || 'Boutique')
    const isOpenNow = role === 'client'
      ? (openMeta?.hasSchedule ? openMeta?.isOpen === true : true)
      : true
    const forceOffline = role === 'client' && !isOpenNow
    navigate(
      `/webrtc?role=${encodeURIComponent(role)}&roomId=${encodeURIComponent(roomId)}&ui=simple&label=${encodeURIComponent(label)}${forceOffline ? '&forceOffline=1' : ''}`,
    )
  }

  const saveHours = async () => {
    const slug = String(shopSlug || '').trim()
    if (!slug) return
    const open = String(hoursOpen || '').trim()
    const close = String(hoursClose || '').trim()
    if (!parseHHMM(open) || !parseHHMM(close)) {
      toast.error('Heures invalides (HH:MM)')
      return
    }
    const tz = String(hoursTimezone || '').trim()
    setHoursSaving(true)
    try {
      let token = ''
      try {
        const s = await supabase.auth.getSession()
        token = String(s?.data?.session?.access_token || '')
      } catch {
      }
      const res = await fetch('/api/shops/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          slug,
          open_time: open,
          close_time: close,
          ...(tz ? { timezone: tz } : {}),
        }),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok || !json?.success) {
        toast.error(String(json?.error || 'Erreur enregistrement horaires'))
        return
      }
      if (json?.shop) {
        setShop((s) => (s ? { ...s, ...json.shop } : json.shop))
      } else {
        setShop((s) => (s ? { ...s, open_time: open, close_time: close, timezone: tz || s?.timezone } : s))
      }
      toast.success('Horaires enregistrés')
      setShowHoursModal(false)
    } catch {
      toast.error('Erreur enregistrement horaires')
    } finally {
      setHoursSaving(false)
    }
  }

  const openVendorDashboard = (nextTab, opts) => {
    const edit = Boolean(opts?.edit)
    const tab = String(nextTab || (edit ? 'settings' : '')).trim()
    const params = new URLSearchParams()
    params.set('lp_view', 'account')
    params.set('lp_role', 'vendor')
    if (tab) params.set('lp_vendor_tab', tab)
    if (edit) params.set('lp_vendor_edit_shop', String(shopSlug || ''))
    try {
      const current = new URLSearchParams(window.location.search)
      const keep = ['ff_api', 'ff_force_api', 'ff_boost_vitrine', 'ff_boost_promo']
      keep.forEach((k) => {
        const v = current.get(k)
        if (v !== null && v !== undefined && String(v).trim() !== '') params.set(k, String(v))
      })
    } catch {
    }
    try {
      if (tab) localStorage.setItem('mangoo-vendor-active-tab', tab)
    } catch {
    }
    if (edit) {
      try {
        localStorage.setItem('mangoo-vendor-edit-shop-slug', String(shopSlug || ''))
      } catch {
      }
    }
    navigate(`/?${params.toString()}`)
  }

  const openBoost = () => {
    const idRaw = shop?.sourceVendorId ?? shop?.sourceVendorID ?? shop?.source_vendor_id ?? shop?.source_vendorId
    const shopId = String(shop?.id || '')
    const vendorId = idRaw !== undefined && idRaw !== null
      ? String(idRaw)
      : (shopId.startsWith('shop-') ? shopId.slice(5) : (shopId || String(shopSlug || '')))
    try {
      localStorage.setItem('mangoo-vendor-active-tab', 'boosts')
      localStorage.setItem('mangoo-vendor-edit-shop-slug', String(shopSlug || ''))
      localStorage.setItem('mangoo_boost_target', JSON.stringify({ vendorId, vendorKind: 'shop' }))
    } catch {
    }
    const returnTo = `${window.location.pathname}${window.location.search}${window.location.hash}`
    const boostsUrl = `/boosts?vendorId=${encodeURIComponent(vendorId)}&vendorKind=shop&return=${encodeURIComponent(returnTo)}`
    navigate(`/connexion?return=${encodeURIComponent(boostsUrl)}`)
  }

  const maskEmail = (value) => {
    const email = String(value || '').trim();
    const [local, domain] = email.split('@');
    if (!local || !domain) return '';
    if (local.length <= 2) return `${local[0] || '*'}*@${domain}`;
    return `${local[0]}${'*'.repeat(Math.min(6, local.length - 2))}${local[local.length - 1]}@${domain}`;
  };

  // Valeurs de secours pour garder la page lisible si aucune donnée n'est disponible
  const demoShop = useMemo(() => ({
    id: '1',
    name: 'Boutique Mangoo',
    slug: 'boutique-demo',
    description: 'Bienvenue ! Découvrez nos produits.',
    business_type: 'individual',
    status: 'approved',
    contact_email: 'contact@mangoo.tech',
    address: { city: 'Paris', country: 'France' },
    openTime: '',
    closeTime: '',
    timezone: '',
    commission_rate: 5.00,
    review_count: 42,
    followers_count: 156,
    total_sales: 234,
    total_revenue: 12580.50,
    created_at: '2024-01-01T00:00:00Z',
    policies: {
      shipping: 'Livraison gratuite en France métropolitaine',
      returns: 'Retours acceptés sous 30 jours',
      warranty: 'Garantie 2 ans sur tous les produits'
    }
  }), []);

  // Produits de secours
  const demoProducts = useMemo(() => ([
    {
      id: '1',
      name: 'Smartphone Premium',
      slug: 'smartphone-premium',
      description: 'Un smartphone haut de gamme avec toutes les dernières fonctionnalités',
      short_description: 'Smartphone haut de gamme',
      price: 599.99,
      status: 'active',
      featured: true,
      images: [{ url: 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=400', alt_text: 'Smartphone Premium' }],
      category: { name: 'Électronique', slug: 'electronique' },
      average_rating: 4.5,
      review_count: 12,
      sales_count: 45,
      variants: [{ inventory_quantity: 15 }]
    },
    {
      id: '2',
      name: 'T-shirt en Coton Bio',
      slug: 't-shirt-coton-bio',
      description: 'T-shirt confortable en coton biologique',
      short_description: 'T-shirt écologique',
      price: 29.99,
      status: 'active',
      featured: false,
      images: [{ url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400', alt_text: 'T-shirt Bio' }],
      category: { name: 'Mode', slug: 'mode' },
      average_rating: 4.2,
      review_count: 8,
      sales_count: 67,
      variants: [{ inventory_quantity: 50 }]
    },
    {
      id: '3',
      name: 'Lampe Design LED',
      slug: 'lampe-design-led',
      description: 'Lampe moderne avec technologie LED',
      short_description: 'Éclairage moderne',
      price: 89.99,
      status: 'active',
      featured: true,
      images: [{ url: 'https://images.unsplash.com/photo-1565636192335-f2e4b8f9c0a0?w=400', alt_text: 'Lampe LED' }],
      category: { name: 'Maison', slug: 'maison' },
      average_rating: 4.7,
      review_count: 15,
      sales_count: 23,
      variants: [{ inventory_quantity: 8 }]
    },
    {
      id: '4',
      name: 'Chaussures de Running',
      slug: 'chaussures-running',
      description: 'Chaussures de course professionnelles',
      short_description: 'Chaussures sport',
      price: 129.99,
      status: 'active',
      featured: false,
      images: [{ url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400', alt_text: 'Chaussures Running' }],
      category: { name: 'Sport', slug: 'sport' },
      average_rating: 4.3,
      review_count: 20,
      sales_count: 89,
      variants: [{ inventory_quantity: 25 }]
    }
  ]), []);

  const loadBoostStatus = useCallback(async (shopId, email) => {
    try {
      const controller = new AbortController()
      const t = window.setTimeout(() => controller.abort(), 6500)
      const fallbackId = email ? `local-${String(email).trim().toLowerCase()}` : ''
      const targetVendorId = String(shopId || '').trim() || fallbackId
      const res = await fetch(
        `/api/boosts/vendor-boosts?vendorKind=shop&vendorId=${encodeURIComponent(targetVendorId)}`,
        { method: 'GET', signal: controller.signal }
      )
      const json = await res.json().catch(() => null)
      window.clearTimeout(t)
      const parseMs = (v) => {
        const x = v ? Date.parse(String(v)) : NaN
        return Number.isFinite(x) ? x : 0
      }
      const now = Date.now()
      const row = json?.row && typeof json.row === 'object' ? json.row : null
      const sponsoredUntil = parseMs(row?.sponsored_until)
      const promoUntil = parseMs(row?.promo_until)
      const newUntil = parseMs(row?.new_until)
      setBoostStatus({
        sponsored: sponsoredUntil > now,
        promo: promoUntil > now,
        neu: newUntil > now,
      })
    } catch {
      setBoostStatus({ sponsored: false, promo: false, neu: false })
    }
  }, [])

  useEffect(() => {
    const onUpdated = () => {
      if (shop?.id && shopOwnerEmail) void loadBoostStatus(String(shop.id), String(shopOwnerEmail))
    }
    window.addEventListener('mangoo-boosts-updated', onUpdated)
    return () => window.removeEventListener('mangoo-boosts-updated', onUpdated)
  }, [loadBoostStatus, shop?.id, shopOwnerEmail])

  useEffect(() => {
    try {
      const raw = localStorage.getItem('followed_shops');
      const followed = raw ? JSON.parse(raw) : [];
      if (Array.isArray(followed)) {
        setIsFollowing(followed.includes(shopSlug));
      }
    } catch {
      setIsFollowing(false);
    }
  }, [shopSlug]);

  const loadShopData = useCallback(async () => {
    try {
      setLoading(true);

      const currentUser = (() => {
        if (forceClientView) return null
        try {
          const raw = localStorage.getItem('mangoo-current-user');
          return raw ? JSON.parse(raw) : null;
        } catch {
          return null;
        }
      })();
      
      // Si le shopSlug est une route ShopApp, ne pas traiter comme une boutique
      if (['create', 'products', 'dashboard'].includes(shopSlug)) {
        setError('Cette page n\'est pas une boutique');
        setLoading(false);
        return;
      }

      try {
        const controller = new AbortController()
        const t = window.setTimeout(() => controller.abort(), 7000)
        const res = await fetch(`/api/shops/slug/${encodeURIComponent(String(shopSlug || '').trim())}`, { signal: controller.signal })
        const json = await res.json().catch(() => null)
        window.clearTimeout(t)
        if (res.ok && json?.success && json?.shop?.slug) {
          const data = json.shop
          const localSchedule = readLocalScheduleForSlug(data?.slug || shopSlug)
          const localContacts = readLocalContactsForSlug(data?.slug || shopSlug)
          const statusRaw = String(data?.status || 'pending').trim().toLowerCase()
          const normalizedStatus = (statusRaw === 'approved' || statusRaw === 'rejected' || statusRaw === 'suspended') ? statusRaw : 'pending'

          const ownerEmail = String(data?.owner_email || data?.email || '').trim().toLowerCase()
          const currentEmail = String(currentUser?.email || '').trim().toLowerCase()
          const isOwner = Boolean(ownerEmail && currentEmail && ownerEmail === currentEmail)
          const isAdmin = currentUser?.role === 'admin'

          setShopOwnerEmail(ownerEmail)
          setCanManageProducts(Boolean(isOwner || isAdmin))

          if (normalizedStatus !== 'approved' && !isOwner && !isAdmin) {
            setError('Boutique en attente d’approbation')
            setLoading(false)
            return
          }

          setShop({
            ...demoShop,
            id: String(data?.id || demoShop.id),
            name: String(data?.name || demoShop.name),
            slug: String(data?.slug || shopSlug),
            description: String(data?.description || demoShop.description),
            status: normalizedStatus,
            business_type: String(data?.business_type || demoShop.business_type),
            email: String(data?.email || localContacts?.email || ownerEmail || '').trim(),
            contact_email: String(data?.contact_email || localContacts?.email || ownerEmail || '').trim(),
            phone: String(data?.phone || data?.contact_phone || localContacts?.phone || '').trim(),
            contact_phone: String(data?.contact_phone || data?.phone || localContacts?.phone || '').trim(),
            address: { city: String(data?.city || 'Douala'), country: String(data?.country || 'Cameroun') },
            created_at: String(data?.created_at || demoShop.created_at),
            primaryColor: '#0EA5E9',
            secondaryColor: '#38BDF8',
            logoDataUrl: String(data?.logo_url || ''),
            openTime: String(data?.open_time || data?.openTime || localSchedule?.openTime || ''),
            closeTime: String(data?.close_time || data?.closeTime || localSchedule?.closeTime || ''),
            timezone: String(data?.timezone || data?.timeZone || localSchedule?.timezone || ''),
          })

          void loadBoostStatus(String(data?.id || demoShop.id), ownerEmail)

          const localProducts = (() => {
            try {
              const raw = localStorage.getItem('demo_products');
              const map = raw ? JSON.parse(raw) : {};
              const list = map && typeof map === 'object' ? map[String(shopSlug || '').trim()] : [];
              return Array.isArray(list) ? list : [];
            } catch {
              return [];
            }
          })();
          setProducts(localProducts);
          setError(null)
          setLoading(false)
          return
        }
      } catch {
      }

      const hasSupabase = Boolean(supabaseConfig?.hasUrl && supabaseConfig?.hasAnonKey)
      if (hasSupabase) {
        try {
          const { data, error } = await supabase
            .from('shops')
            .select('*')
            .eq('slug', String(shopSlug || '').trim())
            .maybeSingle()

          if (!error && data?.slug) {
            const localSchedule = readLocalScheduleForSlug(data?.slug || shopSlug)
            const localContacts = readLocalContactsForSlug(data?.slug || shopSlug)
            const statusRaw = String(data?.status || 'pending').trim().toLowerCase()
            const normalizedStatus = (statusRaw === 'approved' || statusRaw === 'rejected' || statusRaw === 'suspended') ? statusRaw : 'pending'

            const ownerEmail = String(data?.email || '').trim().toLowerCase()
            const currentEmail = String(currentUser?.email || '').trim().toLowerCase()
            const isOwner = Boolean(ownerEmail && currentEmail && ownerEmail === currentEmail)
            const isAdmin = currentUser?.role === 'admin'

            setShopOwnerEmail(ownerEmail)
            setCanManageProducts(Boolean(isOwner || isAdmin))

            if (normalizedStatus !== 'approved' && !isOwner && !isAdmin) {
              setError('Boutique en attente d’approbation')
              setLoading(false)
              return
            }

            setShop({
              ...demoShop,
              id: String(data?.id || demoShop.id),
              name: String(data?.name || demoShop.name),
              slug: String(data?.slug || shopSlug),
              description: String(data?.description || demoShop.description),
              status: normalizedStatus,
              business_type: String(data?.business_type || demoShop.business_type),
              email: String(data?.email || localContacts?.email || ownerEmail || '').trim(),
              contact_email: String(data?.contact_email || localContacts?.email || ownerEmail || '').trim(),
              phone: String(data?.phone || data?.contact_phone || localContacts?.phone || '').trim(),
              contact_phone: String(data?.contact_phone || data?.phone || localContacts?.phone || '').trim(),
              address: { city: String(data?.city || 'Douala'), country: String(data?.country || 'Cameroun') },
              created_at: String(data?.created_at || demoShop.created_at),
              primaryColor: '#0EA5E9',
              secondaryColor: '#38BDF8',
              logoDataUrl: String(data?.logo_url || ''),
              openTime: String(data?.open_time || data?.openTime || localSchedule?.openTime || ''),
              closeTime: String(data?.close_time || data?.closeTime || localSchedule?.closeTime || ''),
              timezone: String(data?.timezone || data?.timeZone || localSchedule?.timezone || ''),
            })

            void loadBoostStatus(String(data?.id || demoShop.id), ownerEmail)

            const localProducts = (() => {
              try {
                const raw = localStorage.getItem('demo_products');
                const map = raw ? JSON.parse(raw) : {};
                const list = map && typeof map === 'object' ? map[String(shopSlug || '').trim()] : [];
                return Array.isArray(list) ? list : [];
              } catch {
                return [];
              }
            })();
            setProducts(localProducts);
            setError(null)
            setLoading(false)
            return
          }
        } catch {
        }
      }

      const localShop = (() => {
        try {
          const raw = localStorage.getItem('demo_shops');
          const shops = raw ? JSON.parse(raw) : [];
          if (!Array.isArray(shops)) return null;
          return shops.find((s) => s?.slug === shopSlug) || null;
        } catch {
          return null;
        }
      })();

      if (isLocalSyncEnabled()) {
        try {
          const resp = await localSync.getShopBySlug(shopSlug)
          const s = resp?.shop
          if (s?.slug) {
            let canManage = false
            if (!forceClientView) {
              try {
                const me = await localSync.me()
                const uid = String(me?.user?.id || '').trim()
                const ownerId = String(s?.userId || s?.user_id || '').trim()
                canManage = Boolean(uid && ownerId && uid === ownerId)
              } catch {
                canManage = false
              }
            }

            const status = String(s?.status || 'pending').trim().toLowerCase()
            const normalizedStatus = status === 'approved' || status === 'rejected' ? status : 'pending'
            const isAdmin = currentUser?.role === 'admin'

            if (normalizedStatus !== 'approved' && !canManage && !isAdmin) {
              setError('Boutique en attente d’approbation')
              setLoading(false)
              return
            }

            setShop({
              ...demoShop,
              id: s.id || demoShop.id,
              name: s.name || demoShop.name,
              slug: s.slug || shopSlug,
              description: String(s?.description || demoShop.description || '').trim(),
              status: normalizedStatus,
              email: String(s?.email || '').trim(),
              contact_email: String(s?.contact_email || '').trim(),
              phone: String(s?.phone || s?.contact_phone || '').trim(),
              contact_phone: String(s?.contact_phone || s?.phone || '').trim(),
              address: { city: 'Paris', country: 'France' },
              created_at: String(s?.createdAt || s?.created_at || demoShop.created_at),
              primaryColor: '#0EA5E9',
              secondaryColor: '#38BDF8',
              logoDataUrl: String(s?.logo_url || s?.logoUrl || ''),
              openTime: String(s?.open_time || s?.openTime || ''),
              closeTime: String(s?.close_time || s?.closeTime || ''),
              timezone: String(s?.timezone || s?.timeZone || ''),
            })
            const localProducts = (() => {
              try {
                const raw = localStorage.getItem('demo_products');
                const map = raw ? JSON.parse(raw) : {};
                const list = map && typeof map === 'object' ? map[String(shopSlug || '').trim()] : [];
                return Array.isArray(list) ? list : [];
              } catch {
                return [];
              }
            })();
            setProducts(localProducts);
            setCanManageProducts(Boolean(!forceClientView && (canManage || isAdmin)))
            setShopOwnerEmail('')
            setError(null)
            setLoading(false)
            return
          }
        } catch {
        }
      }

      const localPlusVendor = (() => {
        const slugify = (value) => {
          return String(value || '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
        };
        try {
          const rawLegacy = localStorage.getItem('mangoo_vendors');
          const legacyParsed = rawLegacy ? JSON.parse(rawLegacy) : [];
          const legacy = Array.isArray(legacyParsed) ? legacyParsed : [];
          const rawCustom = localStorage.getItem('mangoo_custom_vendors');
          const customParsed = rawCustom ? JSON.parse(rawCustom) : [];
          const custom = Array.isArray(customParsed) ? customParsed : [];
          const list = [...legacy, ...custom];

          return list.find((v) => {
            const kind = String(v?.kind || 'shop').trim().toLowerCase();
            if (kind !== 'shop') return false;
            const id = String(v?.id ?? '').trim();
            const name = String(v?.name || '').trim();
            if (!id || !name) return false;
            const base = slugify(name) || `boutique-${id}`;
            const candidates = new Set([
              base,
              `${base}-${id}`,
              `boutique-${id}`
            ]);
            return candidates.has(String(shopSlug || '').trim());
          }) || null;
        } catch {
          return null;
        }
      })();

      if (localShop) {
        const approvalStatus = String(localShop?.approvalStatus || 'pending');
        const localProducts = (() => {
          try {
            const raw = localStorage.getItem('demo_products');
            const map = raw ? JSON.parse(raw) : {};
            const list = map && typeof map === 'object' ? map[shopSlug] : [];
            return Array.isArray(list) ? list : [];
          } catch {
            return [];
          }
        })();

        const primary = localShop.primaryColor || '#F97316';
        const secondary = localShop.secondaryColor || '#FBBF24';

        const ownerEmail = String(localShop?.ownerEmail || '').trim().toLowerCase();
        const currentEmail = String(currentUser?.email || '').trim().toLowerCase();
        setShopOwnerEmail(ownerEmail);
        setCanManageProducts(currentUser?.role === 'vendor' && Boolean(currentEmail) && Boolean(ownerEmail) && currentEmail === ownerEmail);

        const isOwner = currentUser?.role === 'vendor' && Boolean(currentEmail) && Boolean(ownerEmail) && currentEmail === ownerEmail;
        const isAdmin = currentUser?.role === 'admin';
        if (approvalStatus !== 'approved' && !isOwner && !isAdmin) {
          setError('Boutique en attente d’approbation');
          setLoading(false);
          return;
        }

        setShop({
          ...demoShop,
          id: localShop.id || demoShop.id,
          name: localShop.name || demoShop.name,
          slug: localShop.slug || demoShop.slug,
          description: localShop.description || demoShop.description,
          contact_email: localShop.ownerEmail || demoShop.contact_email,
          primaryColor: primary,
          secondaryColor: secondary,
          logoDataUrl: localShop.logoDataUrl || '',
          openTime: String(localShop.openTime || localShop.open_time || ''),
          closeTime: String(localShop.closeTime || localShop.close_time || ''),
          timezone: String(localShop.timezone || localShop.timeZone || ''),
          sourceVendorId: localShop.sourceVendorId ?? localShop.source_vendor_id ?? null
        });
        setProducts(localProducts);
        setError(null);
        setLoading(false);
        return;
      }

      if (localPlusVendor) {
        const normalizeCategory = (raw) => {
          const c = String(raw || '').trim().toLowerCase();
          if (!c) return 'general';
          if (c.includes('épicer') || c.includes('epicer') || c.includes('vivre') || c.includes('aliment') || c.includes('food')) return 'food';
          if (c.includes('tech') || c.includes('elect') || c.includes('teleph') || c.includes('téléph') || c.includes('electron')) return 'tech';
          if (c.includes('mode') || c.includes('fashion') || c.includes('vêt') || c.includes('vet') || c.includes('tailleur')) return 'fashion';
          if (c.includes('beaut') || c.includes('cosm')) return 'beauty';
          if (c.includes('maison') || c.includes('home')) return 'home';
          if (c.includes('service') || c.includes('métier') || c.includes('metier')) return 'services';
          return 'general';
        };

        const localProducts = (() => {
          try {
            const raw = localStorage.getItem('demo_products');
            const map = raw ? JSON.parse(raw) : {};
            const list = map && typeof map === 'object' ? map[shopSlug] : [];
            return Array.isArray(list) ? list : [];
          } catch {
            return [];
          }
        })();

        const description = String(localPlusVendor?.voicePitch || '').trim()
          || `Bienvenue dans ma nouvelle boutique ${String(localPlusVendor?.name || 'Boutique')} ! Venez découvrir mes produits.`;

        setShop({
          ...demoShop,
          id: `localplus-${String(localPlusVendor?.id ?? shopSlug)}`,
          name: String(localPlusVendor?.name || demoShop.name),
          slug: shopSlug,
          description,
          category: normalizeCategory(localPlusVendor?.category),
          status: 'approved',
          contact_email: '',
          address: { city: 'Douala', country: 'Cameroun' },
          primaryColor: '#0EA5E9',
          secondaryColor: '#38BDF8',
          review_count: 0,
          followers_count: 0,
          total_sales: 0,
          total_revenue: 0,
          created_at: new Date().toISOString(),
          logoDataUrl: ''
        });
        setProducts(localProducts);
        setCanManageProducts(false);
        setShopOwnerEmail('');
        setError(null);
        setLoading(false);
        return;
      }

      if (shopSlug === 'boutique-demo') {
        const extraProducts = (() => {
          try {
            const raw = localStorage.getItem('demo_products');
            const map = raw ? JSON.parse(raw) : {};
            const list = map && typeof map === 'object' ? map[shopSlug] : [];
            return Array.isArray(list) ? list : [];
          } catch {
            return [];
          }
        })();
        setShop(demoShop);
        setProducts(extraProducts.length ? extraProducts : demoProducts);
        setCanManageProducts(false);
        setShopOwnerEmail('');
        setError(null);
        setLoading(false);
        return;
      }

      setError('Boutique non trouvée');
      setLoading(false);
      
    } catch (err) {
      setError(err.message || 'Erreur lors du chargement de la boutique');
      setLoading(false);
    }
  }, [demoProducts, demoShop, forceClientView, loadBoostStatus, shopSlug]);

  useEffect(() => {
    void loadShopData();
  }, [loadShopData]);

  const activateVendorMode = () => {
    const owner = String(shopOwnerEmail || '').trim().toLowerCase();
    const provided = String(vendorEmail || '').trim().toLowerCase();
    if (!owner) {
      toast.error('Cette boutique n’est pas encore associée à un compte vendeur.');
      return;
    }
    if (!provided) {
      toast.error('Entrez votre email vendeur.');
      return;
    }
    if (provided !== owner) {
      setPendingMismatch(true);
      toast.error(`Email vendeur non reconnu. Email attendu: ${maskEmail(owner)}`);
      return;
    }
    const userData = { role: 'vendor', name: 'Vendeur', avatar: '🏪', email: provided };
    try {
      localStorage.setItem('mangoo-current-user', JSON.stringify(userData));
      localStorage.setItem(`mangoo_vendor_email:${String(shopSlug || '')}`, provided)
    } catch {
      // ignore
    }
    setCanManageProducts(true);
    setShowVendorMode(false);
    setVendorEmail('');
    setShowVendorManager(true);
    toast.success('Mode vendeur activé');
  };

  const claimShopForEmail = () => {
    const provided = String(vendorEmail || '').trim().toLowerCase();
    if (!provided) {
      toast.error('Entrez votre email vendeur.');
      return;
    }
    try {
      const raw = localStorage.getItem('demo_shops');
      const shops = raw ? JSON.parse(raw) : [];
      const list = Array.isArray(shops) ? shops : [];
      const next = list.map((s) => (s?.slug === shopSlug ? { ...s, ownerEmail: provided } : s));
      localStorage.setItem('demo_shops', JSON.stringify(next));
      localStorage.setItem(`mangoo_vendor_email:${String(shopSlug || '')}`, provided)
      window.dispatchEvent(new Event('demo-shops-updated'));
      setShopOwnerEmail(provided);
      setPendingMismatch(false);
      toast.success('Boutique associée à cet email');
    } catch {
      toast.error('Impossible de modifier la boutique.');
    }
  };

  useEffect(() => {
    const loadFromApi = async () => {
      try {
        const controller = new AbortController()
        const t = window.setTimeout(() => controller.abort(), 7000)
        const res = await fetch(`/api/shops/slug/${encodeURIComponent(String(shopSlug || '').trim())}/products`, { signal: controller.signal })
        const json = await res.json().catch(() => null)
        window.clearTimeout(t)
        if (res.ok && json?.success && Array.isArray(json?.products)) {
          setProducts(json.products)
          return true
        }
      } catch {
      }
      return false
    }

    const loadFromDemo = () => {
      try {
        const raw = localStorage.getItem('demo_products');
        const map = raw ? JSON.parse(raw) : {};
        const list = map && typeof map === 'object' ? map[shopSlug] : [];
        if (Array.isArray(list)) setProducts(list);
      } catch {
      }
    }

    const reloadProducts = async () => {
      const ok = await loadFromApi()
      if (!ok) loadFromDemo()
    }

    void reloadProducts()
    const onUpdated = () => void reloadProducts();
    const onStorage = (e) => {
      if (e?.key === 'demo_products') void reloadProducts();
    };
    window.addEventListener('demo_products_updated', onUpdated);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('demo_products_updated', onUpdated);
      window.removeEventListener('storage', onStorage);
    };
  }, [shopSlug]);

  const toggleFollow = () => {
    const slug = shop?.slug || shopSlug;
    if (!slug) {
      toast.error('Boutique invalide');
      return;
    }

    setIsFollowing((prev) => {
      const nextValue = !prev;
      try {
        const raw = localStorage.getItem('followed_shops');
        const followed = raw ? JSON.parse(raw) : [];
        const list = Array.isArray(followed) ? followed : [];
        const next = nextValue
          ? Array.from(new Set([...list, slug]))
          : list.filter((s) => s !== slug);
        localStorage.setItem('followed_shops', JSON.stringify(next));
      } catch {
        try {
          localStorage.setItem('followed_shops', JSON.stringify(nextValue ? [slug] : []));
        } catch {
          toast.error('Impossible d’enregistrer le suivi (stockage local)');
        }
      }

      setShop((current) => {
        if (!current) return current;
        const currentCount = Number(current.followers_count || 0);
        const updatedCount = nextValue ? currentCount + 1 : Math.max(0, currentCount - 1);
        return { ...current, followers_count: updatedCount };
      });

      toast.success(nextValue ? 'Boutique suivie' : 'Suivi retiré');
      return nextValue;
    });
  };

  const contactShop = () => {
    const phone = String(shop?.phone || shop?.contact_phone || shop?.contactPhone || '').trim()

    if (phone) {
      toast.info('Ouverture de votre application téléphone…')
      window.location.href = `tel:${phone}`
      return
    }
    toast.error('Contact indisponible (téléphone manquant)')
  };

  const shareShop = () => {
    if (navigator.share) {
      navigator.share({
        title: shop.name,
        text: shop.description,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Lien copié dans le presse-papiers');
    }
  };

  const backToAllShops = () => {
    try {
      localStorage.setItem('mangoo-last-view', 'shops');
    } catch {
      // ignore
    }
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen py-8">
        <div className="container">
          <div className="text-center">
            <div className="spinner w-12 h-12 mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement de la boutique...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen py-8">
        <div className="container">
          <div className="max-w-md mx-auto">
            <div className="card text-center">
              <div className="card-body">
                <Store className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Erreur</h1>
                <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
                <div className="space-y-3">
                  <Link
                    to="/shop/create"
                    className="btn-primary w-full"
                  >
                    Créer ma boutique
                  </Link>
                  <Link
                    to="/marketplace"
                    className="btn-secondary w-full"
                  >
                    Retour au marketplace
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="min-h-screen py-8">
        <div className="container">
          <div className="max-w-md mx-auto">
            <div className="card text-center">
              <div className="card-body">
                <Store className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Boutique non trouvée</h1>
                <p className="text-gray-600 dark:text-gray-400 mb-6">La boutique que vous recherchez n&apos;existe pas.</p>
                <div className="space-y-3">
                  <Link
                    to="/shop/create"
                    className="btn-primary w-full"
                  >
                    Créer ma boutique
                  </Link>
                  <Link
                    to="/marketplace"
                    className="btn-secondary w-full"
                  >
                    Retour au marketplace
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const openMeta = computeOpenMeta(shop, nowMs);
  const phoneNumber = String(shop?.phone || shop?.contact_phone || shop?.contactPhone || '').trim();

  return (
    <div className="min-h-screen">
      {/* Shop Header - Style conforme */}
      <section
        className="relative overflow-hidden pt-24 pb-16 lg:pt-32 lg:pb-24"
        style={{
          backgroundColor: '#0f172a'
        }}
      >
        <div className="absolute top-6 left-6 z-20">
          <button
            type="button"
            onClick={backToAllShops}
            className="px-4 py-2 rounded-full bg-white/15 text-white border border-white/30 hover:bg-white/25 transition-colors backdrop-blur-sm"
          >
            ← Toutes les boutiques
          </button>
        </div>
        <div className="absolute inset-0 bg-black/20 pointer-events-none"></div>
        
        {/* Éléments décoratifs statiques pour garder une page stable */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-white/10 rounded-full pointer-events-none"></div>
        <div className="absolute top-40 right-20 w-16 h-16 bg-white/10 rounded-full pointer-events-none"></div>
        <div className="absolute bottom-20 left-1/4 w-12 h-12 bg-white/10 rounded-full pointer-events-none"></div>
        
        <div className="container relative z-10">
          <div className="max-w-4xl mx-auto text-center text-white">
            <div className="mb-8">
              <div className="w-20 h-20 mx-auto mb-6 bg-white/20 rounded-full flex items-center justify-center overflow-hidden">
                {shop.logoDataUrl ? (
                  <img src={shop.logoDataUrl} alt="Logo" className="w-20 h-20 object-cover" />
                ) : (
                  <Store className="w-10 h-10" />
                )}
              </div>
              <div className="flex items-center justify-center gap-3 mb-4">
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold">{shop.name}</h1>
                {shop.status === 'approved' && (
                  <div className="flex items-center gap-1 bg-green-100/20 text-green-100 px-3 py-1 rounded-full text-sm">
                    <Shield className="w-4 h-4" />
                    Vérifié
                  </div>
                )}
                {liveRoom.live && (
                  <div className="bg-red-100/20 text-red-50 px-3 py-1 rounded-full text-sm border border-red-200/30">
                    LIVE
                  </div>
                )}
                {(openMeta?.hasSchedule || (!forceClientView && canManageProducts)) && (
                  <button
                    type="button"
                    onClick={() => {
                      if (!forceClientView && canManageProducts) setShowHoursModal(true)
                    }}
                    className={`flex items-center gap-3 px-4 py-2 rounded-2xl text-sm border transition-colors ${
                      openMeta?.hasSchedule
                        ? (openMeta?.isOpen === true
                          ? 'bg-[#1b5e20]/30 text-[#ecf7e7] border-[#2e5d34]/40 hover:bg-[#1b5e20]/35'
                          : 'bg-red-100/15 text-red-50 border-red-200/25 hover:bg-red-100/20')
                        : 'bg-white/10 text-white/90 border-white/20 hover:bg-white/15'
                    }`}
                  >
                    <span
                      className={`w-3 h-3 rounded-full ${
                        openMeta?.hasSchedule
                          ? (openMeta?.isOpen === true ? 'bg-[#66bb6a]' : 'bg-red-300')
                          : 'bg-white/60'
                      }`}
                    />
                    <div className="text-left leading-tight">
                      <div className="font-extrabold tracking-wide">
                        {openMeta?.hasSchedule ? (openMeta?.isOpen === true ? 'EN LIGNE' : 'HORS LIGNE') : 'HORAIRES'}
                      </div>
                      {openMeta?.hasSchedule && (
                        <div className="text-xs text-white/90 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{openMeta?.openRaw}–{openMeta?.closeRaw}</span>
                        </div>
                      )}
                    </div>
                  </button>
                )}
                {boostStatus.sponsored && (
                  <div className="bg-amber-100/20 text-amber-50 px-3 py-1 rounded-full text-sm border border-amber-200/30">
                    Sponsorisé
                  </div>
                )}
                {boostStatus.promo && (
                  <div className="bg-[#1b5e20]/30 text-[#ecf7e7] px-3 py-1 rounded-full text-sm border border-[#2e5d34]/40">
                    Promo
                  </div>
                )}
                {boostStatus.neu && (
                  <div className="bg-[#1b5e20]/30 text-[#ecf7e7] px-3 py-1 rounded-full text-sm border border-[#2e5d34]/40">
                    Nouveau
                  </div>
                )}
              </div>
              {String(shop.description || '').trim() && (
                <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl mx-auto">{shop.description}</p>
              )}
              <div className="flex flex-wrap justify-center items-center gap-6 text-sm text-white/80">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>{shop.address?.city}, {shop.address?.country}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>Depuis {new Date(shop.created_at).toLocaleDateString('fr-FR')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  <span>{shop.total_sales} ventes</span>
                </div>
                {phoneNumber && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    <span>{phoneNumber}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                type="button"
                onClick={() => {
                  const slug = String(shopSlug || '').trim()
                  const roomId = `shop:${slug}`
                  if (!liveRoom.live) {
                    toast.info('Live hors ligne')
                    return
                  }
                  navigate(`/live-shopping?role=client&roomId=${encodeURIComponent(roomId)}&ui=simple&shopSlug=${encodeURIComponent(slug)}`)
                }}
                className={`px-8 py-4 inline-flex items-center justify-center rounded-2xl font-extrabold transition-all duration-200 backdrop-blur-sm hover:-translate-y-0.5 ${
                  liveRoom.live ? 'bg-[#ffa726] text-[#16381a] hover:bg-[#ff6f00] shadow-lg shadow-[#1b5e20]/20' : 'bg-[#1b5e20]/85 text-white border border-[#66bb6a]/40 hover:bg-[#2e7d32]'
                }`}
              >
                <ShoppingCart className="w-6 h-6 mr-3" />
                <span className="text-left leading-tight">
                  <span className="block text-lg">Live Shopping</span>
                  <span className={`block text-xs ${liveRoom.live ? 'text-[#16381a]/80' : 'text-white/90'}`}>{liveRoom.live ? 'En direct' : 'Hors ligne'}</span>
                </span>
              </button>
              {!forceClientView && canManageProducts && (
                <button
                  type="button"
                  onClick={() => {
                    openVendorDashboard('overview')
                  }}
                  className="text-lg px-8 py-4 inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-200 backdrop-blur-sm bg-[#fff4d6] text-[#16381a] hover:bg-[#ffe082] hover:-translate-y-0.5"
                >
                  Tableau de bord
                </button>
              )}
              {!forceClientView && canManageProducts && (
                <button
                  type="button"
                  onClick={() => {
                    const slug = String(shopSlug || '').trim()
                    const roomId = `shop:${slug}`
                    navigate(`/live-shopping?role=vendor&roomId=${encodeURIComponent(roomId)}&ui=simple&shopSlug=${encodeURIComponent(slug)}`)
                  }}
                  className="text-lg px-8 py-4 inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-200 backdrop-blur-sm bg-[#1b5e20]/85 text-white border border-[#66bb6a]/40 hover:bg-[#2e7d32] hover:-translate-y-0.5"
                >
                  Démarrer LIVE
                </button>
              )}
              {!forceClientView && canManageProducts && (
                <button
                  type="button"
                  onClick={() => openConnectPlusCall('vendor')}
                  className="text-lg px-8 py-4 inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-200 backdrop-blur-sm bg-[#fff4d6] text-[#16381a] hover:bg-[#ffe082] hover:-translate-y-0.5"
                >
                  Recevoir appels
                </button>
              )}

              {!forceClientView && canManageProducts && (
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => openVendorDashboard('boosts')}
                    className="px-4 py-2 rounded-full bg-[#fff4d6] text-[#16381a] font-semibold hover:bg-[#ffe082] transition-all"
                  >
                    Booster
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      openVendorDashboard('settings', { edit: true })
                    }}
                    className="px-4 py-2 rounded-full bg-[#1b5e20]/85 text-white border border-[#66bb6a]/35 hover:bg-[#2e7d32] transition-colors"
                  >
                    Réglages
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowHoursModal(true)}
                    className="px-4 py-2 rounded-full bg-[#1b5e20]/85 text-white border border-[#66bb6a]/35 hover:bg-[#2e7d32] transition-colors"
                  >
                    Horaires
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('products');
                      setShowVendorManager(true);
                    }}
                    className="px-4 py-2 rounded-full bg-[#fff4d6] text-[#16381a] font-semibold hover:bg-[#ffe082] transition-all"
                  >
                    Nouveau
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      openVendorDashboard('supply')
                    }}
                    className="px-4 py-2 rounded-full bg-[#1b5e20]/85 text-white border border-[#66bb6a]/35 hover:bg-[#2e7d32] transition-colors"
                  >
                    S'approvisionner
                  </button>
                </div>
              )}
              <button
                type="button"
                onClick={toggleFollow}
                className={`text-lg px-8 py-4 inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-200 backdrop-blur-sm hover:-translate-y-0.5 ${
                  isFollowing
                    ? 'bg-[#fff4d6] text-[#16381a] hover:bg-[#ffe082]'
                    : 'bg-[#1b5e20]/85 text-white border border-[#66bb6a]/40 hover:bg-[#2e7d32]'
                }`}
              >
                <Users className="w-5 h-5 mr-2" />
                {isFollowing ? 'Suivi' : 'Suivre'}
              </button>
              <button
                type="button"
                onClick={shareShop}
                className="text-lg px-8 py-4 inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-200 backdrop-blur-sm bg-[#1b5e20]/85 text-white border border-[#66bb6a]/35 hover:bg-[#2e7d32] hover:-translate-y-0.5"
              >
                <Share2 className="w-5 h-5 mr-2" />
                Partager
              </button>
              <button
                type="button"
                onClick={() => openConnectPlusCall('client')}
                className="text-lg px-8 py-4 inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-200 backdrop-blur-sm bg-[#fff4d6] text-[#16381a] hover:bg-[#ffe082] hover:-translate-y-0.5"
              >
                <Phone className="w-5 h-5 mr-2" />
                Appeler (gratuit)
              </button>
              <button
                type="button"
                onClick={contactShop}
                disabled={!phoneNumber}
                className={`text-lg px-8 py-4 inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-200 backdrop-blur-sm hover:-translate-y-0.5 ${
                  phoneNumber
                    ? 'bg-[#fff4d6] text-[#16381a] hover:bg-[#ffe082]'
                    : 'bg-[#1b5e20]/65 text-white/70 border border-[#66bb6a]/20 cursor-not-allowed opacity-70'
                }`}
              >
                <Phone className="w-5 h-5 mr-2" />
                Téléphone (portable)
              </button>
            </div>
          </div>
        </div>
      </section>

      {showHoursModal && (
        <div className="fixed inset-0 z-[90] bg-black/70 p-4 flex items-center justify-center">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-gray-950/90 backdrop-blur overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <div className="text-white font-semibold">Horaires boutique</div>
              <button
                type="button"
                onClick={() => setShowHoursModal(false)}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/15 text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-gray-300 font-semibold mb-1">Ouverture</div>
                  <input
                    type="time"
                    value={hoursOpen}
                    onChange={(e) => setHoursOpen(e.target.value)}
                    className="w-full rounded-xl px-3 py-2 bg-black/30 border border-white/10 text-white outline-none focus:border-white/20"
                  />
                </div>
                <div>
                  <div className="text-xs text-gray-300 font-semibold mb-1">Fermeture</div>
                  <input
                    type="time"
                    value={hoursClose}
                    onChange={(e) => setHoursClose(e.target.value)}
                    className="w-full rounded-xl px-3 py-2 bg-black/30 border border-white/10 text-white outline-none focus:border-white/20"
                  />
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-300 font-semibold mb-1">Fuseau horaire</div>
                <select
                  value={hoursTimezone || (openMeta?.timezone || '')}
                  onChange={(e) => setHoursTimezone(e.target.value)}
                  className="w-full rounded-xl px-3 py-2 bg-black/30 border border-white/10 text-white outline-none focus:border-white/20"
                >
                  <option value="">Auto</option>
                  <option value="Africa/Dakar">Afrique/Dakar (SN)</option>
                  <option value="Africa/Abidjan">Afrique/Abidjan (CI)</option>
                  <option value="Africa/Douala">Afrique/Douala (CM)</option>
                  <option value="Etc/UTC">UTC</option>
                </select>
              </div>
            </div>
            <div className="px-4 pb-4 flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setShowHoursModal(false)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={saveHours}
                disabled={hoursSaving}
                className={`px-4 py-2 rounded-xl font-semibold text-white ${
                  hoursSaving ? 'bg-white/10 opacity-60 cursor-not-allowed' : 'bg-white text-slate-950 hover:bg-slate-100'
                }`}
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shop Stats - Style conforme */}
      <section className="py-16 bg-white dark:bg-gray-800">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="card text-center hover-scale">
              <div className="card-body">
                <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="w-8 h-8 text-white" />
                </div>
                <div className="text-3xl font-bold text-primary-600 mb-2">{shop.review_count}</div>
                <div className="text-gray-600 dark:text-gray-400">Avis clients</div>
              </div>
            </div>
            <div className="card text-center hover-scale">
              <div className="card-body">
                <div className="w-16 h-16 bg-secondary-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <div className="text-3xl font-bold text-secondary-600 mb-2">{shop.followers_count}</div>
                <div className="text-gray-600 dark:text-gray-400">Abonnés</div>
              </div>
            </div>
            <div className="card text-center hover-scale">
              <div className="card-body">
                <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="w-8 h-8 text-white" />
                </div>
                <div className="text-3xl font-bold text-primary-700 mb-2">{shop.total_sales}</div>
                <div className="text-gray-600 dark:text-gray-400">Ventes totales</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Shop Policies - Style conforme */}
      <section className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="card hover-scale">
              <div className="card-body text-center">
                <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Truck className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Livraison</h3>
                <p className="text-gray-600 dark:text-gray-400">{shop.policies?.shipping || 'Livraison standard avec délais variables selon le produit.'}</p>
              </div>
            </div>
            <div className="card hover-scale">
              <div className="card-body text-center">
                <div className="w-16 h-16 bg-secondary-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Retours</h3>
                <p className="text-gray-600 dark:text-gray-400">{shop.policies?.returns || 'Retours acceptés dans les conditions générales de vente.'}</p>
              </div>
            </div>
            <div className="card hover-scale">
              <div className="card-body text-center">
                <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Garantie</h3>
                <p className="text-gray-600 dark:text-gray-400">{shop.policies?.warranty || 'Garantie fabricant selon les produits.'}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs - Style conforme */}
      <section className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container">
          <nav className="flex space-x-8">
            {[
              { id: 'products', label: 'Produits', icon: Package },
              { id: 'reviews', label: 'Avis', icon: Star },
              { id: 'about', label: 'À propos', icon: Store }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </section>

      {/* Tab Content - Style conforme */}
      <section className="py-16">
        <div className="container">
          {activeTab === 'products' && (
            <div className="px-4 sm:px-0">
              <div className="flex flex-col gap-3 md:flex-row md:justify-between md:items-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {products.length} produit(s)
                </h2>
                <div className="flex flex-wrap items-center justify-start md:justify-end gap-2">
                  {canManageProducts && (
                    <button
                      type="button"
                      onClick={() => setShowVendorManager(true)}
                      className="btn-primary whitespace-nowrap"
                    >
                      Ajouter un produit
                    </button>
                  )}
                  {canManageProducts && (
                    <button
                      type="button"
                      onClick={openBoost}
                      className="btn-primary whitespace-nowrap"
                    >
                      🚀 Booster
                    </button>
                  )}
                  {!forceClientView && !canManageProducts && shopOwnerEmail && (
                    <button
                      type="button"
                      onClick={() => setShowVendorMode(true)}
                      className="btn-primary whitespace-nowrap"
                    >
                      Je suis le vendeur
                    </button>
                  )}
                  <select className="form-input w-full sm:w-auto">
                    <option>Tri: Pertinence</option>
                    <option>Prix: croissant</option>
                    <option>Prix: décroissant</option>
                    <option>Plus récents</option>
                    <option>Mieux notés</option>
                  </select>
                </div>
              </div>

              {products.length === 0 ? (
                <div className="card">
                  <div className="card-body text-center py-12">
                    <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      Aucun produit disponible
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Cette boutique n&apos;a pas encore de produits en vente.
                    </p>
                    {canManageProducts && (
                      <div className="mt-6">
                        <button
                          type="button"
                          onClick={() => setShowVendorManager(true)}
                          className="btn-primary whitespace-nowrap"
                        >
                          Ajouter mon premier produit
                        </button>
                      </div>
                    )}
                    {!forceClientView && !canManageProducts && shopOwnerEmail && (
                      <div className="mt-6">
                        <button
                          type="button"
                          onClick={() => setShowVendorMode(true)}
                          className="btn-primary whitespace-nowrap"
                        >
                          Je suis le vendeur
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-6">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} shop={shop} />
                  ))}
                </div>
              )}
            </div>
          )}

          {showVendorMode && (
            <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
              <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-2xl">
                <div className="p-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
                  <div className="font-semibold text-gray-900 dark:text-white">Activer le mode vendeur</div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowVendorMode(false);
                      setVendorEmail('');
                      setPendingMismatch(false);
                    }}
                    className="px-3 py-2 rounded-lg text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    Fermer
                  </button>
                </div>
                <div className="p-4 space-y-3">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Entrez l’email utilisé lors de la création de cette boutique pour gérer vos produits.
                  </div>
                  {shopOwnerEmail && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Email actuellement associé à cette boutique: {maskEmail(shopOwnerEmail)}
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Email vendeur</label>
                    <input
                      value={vendorEmail}
                      onChange={(e) => setVendorEmail(e.target.value)}
                      type="email"
                      placeholder="ex: vous@exemple.com"
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    />
                  </div>
                  {pendingMismatch && (
                    <div className="rounded-xl border border-orange-200 bg-orange-50 text-orange-800 p-3 text-sm">
                      <div className="font-semibold">Vous n’avez pas le bon email ?</div>
                      <div className="text-xs mt-1">Si nécessaire, vous pouvez associer cette boutique à l’email saisi.</div>
                      <div className="mt-3 flex justify-end">
                        <button
                          type="button"
                          onClick={claimShopForEmail}
                          className="px-4 py-2 rounded-xl text-sm font-semibold bg-slate-950 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
                        >
                          Associer à cet email
                        </button>
                      </div>
                    </div>
                  )}
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowVendorMode(false);
                        setVendorEmail('');
                        setPendingMismatch(false);
                      }}
                      className="px-4 py-2 rounded-xl text-sm font-semibold border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200"
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      onClick={activateVendorMode}
                      className="px-4 py-2 rounded-xl text-sm font-semibold bg-slate-950 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
                    >
                      Activer
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {showVendorManager && (
            <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
              <div className="w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-2xl">
                <div className="p-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
                  <div className="font-semibold text-gray-900 dark:text-white">Gestion des produits</div>
                  <button
                    type="button"
                    onClick={() => setShowVendorManager(false)}
                    className="px-3 py-2 rounded-lg text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    Fermer
                  </button>
                </div>
                <div className="p-4">
                  <VendorProductManager
                    shops={[{
                      id: shop?.id || shopSlug,
                      slug: shopSlug,
                      name: shop?.name || 'Boutique',
                      category: shop?.category || 'general',
                      primaryColor: shop?.primaryColor,
                      secondaryColor: shop?.secondaryColor,
                      logoDataUrl: shop?.logoDataUrl || ''
                    }]}
                    defaultShopSlug={shopSlug}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div>
              <div className="card mb-8">
                <div className="card-body">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Note moyenne: {shop.review_count > 0 ? '4.5' : 'N/A'}
                    </h3>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-5 h-5 ${
                              i < 4 ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-gray-600 dark:text-gray-400">
                        {shop.review_count} avis
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                {/* Avis simulés */}
                {[
                  { name: 'Marie L.', rating: 5, comment: 'Excellent service, produit conforme à la description. Je recommande !', date: '2024-01-15' },
                  { name: 'Jean D.', rating: 4, comment: 'Bonne qualité, livraison rapide. Satisfait de mon achat.', date: '2024-01-10' },
                  { name: 'Sophie M.', rating: 5, comment: 'Produit exceptionnel, vendeur très professionnel.', date: '2024-01-08' }
                ].map((review, index) => (
                  <div key={index} className="card">
                    <div className="card-body">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                            <span className="text-primary-600 dark:text-primary-400 font-medium">{review.name.charAt(0)}</span>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">{review.name}</div>
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">{review.date}</span>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300">{review.comment}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'about' && (
            <div className="max-w-4xl">
              <div className="card mb-8">
                <div className="card-body">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    À propos de {shop.name}
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 mb-6">
                    {shop.description} Nous sommes spécialisés dans la vente de produits de qualité 
                    avec un service client exceptionnel. Notre objectif est de satisfaire tous nos clients 
                    avec des produits soigneusement sélectionnés.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-3">Informations</h4>
                      <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                        <div>Type: {shop.business_type === 'individual' ? 'Vendeur individuel' : 'Entreprise'}</div>
                        <div>Commission: {shop.commission_rate}%</div>
                        <div>Statut: {shop.status === 'approved' ? 'Approuvé' : 'En attente'}</div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-3">Statistiques</h4>
                      <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                        <div>Ventes totales: {shop.total_sales}</div>
                        <div>Chiffre d&apos;affaires: {shop.total_revenue.toFixed(2)} €</div>
                        <div>Avis clients: {shop.review_count}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-body">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-4">Politiques de la boutique</h4>
                  <div className="space-y-6">
                    <div>
                      <h5 className="font-medium text-gray-900 dark:text-white mb-2">Livraison</h5>
                      <p className="text-gray-600 dark:text-gray-400">{shop.policies?.shipping || 'Livraison standard avec délais variables selon le produit.'}</p>
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-900 dark:text-white mb-2">Retours</h5>
                      <p className="text-gray-600 dark:text-gray-400">{shop.policies?.returns || 'Retours acceptés dans les conditions générales de vente.'}</p>
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-900 dark:text-white mb-2">Garantie</h5>
                      <p className="text-gray-600 dark:text-gray-400">{shop.policies?.warranty || 'Garantie fabricant selon les produits.'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

// Composant ProductCard - Style conforme
const ProductCard = ({ product, shop }) => {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const productName = String(product?.name || 'Produit').trim() || 'Produit'
  const productSlug = (() => {
    const raw = String(product?.slug || product?.handle || '').trim()
    if (raw) return raw
    const id = String(product?.id || '').trim()
    return id || 'produit'
  })()

  const categoryLabel = String(
    product?.category?.name
    || product?.category_name
    || product?.category
    || product?.type
    || ''
  ).trim() || 'Produit'

  const shortDescription = String(product?.short_description || product?.shortDescription || product?.description || '').trim()

  const averageRating = (() => {
    const v = Number(product?.average_rating ?? product?.averageRating ?? product?.rating ?? 0)
    return Number.isFinite(v) ? Math.max(0, Math.min(5, v)) : 0
  })()

  const reviewCount = (() => {
    const v = Number(product?.review_count ?? product?.reviewCount ?? 0)
    return Number.isFinite(v) ? Math.max(0, v) : 0
  })()

  const priceText = (() => {
    const amount = Number(product?.price ?? product?.price_amount ?? product?.amount)
    const currency = String(product?.currency || product?.currency_code || '').trim().toUpperCase()
    if (!Number.isFinite(amount)) return '—'
    if (currency === 'EUR' || currency === '€' || currency === 'EURO') {
      return `${amount.toFixed(2)} €`
    }
    if (currency) return `${Math.round(amount).toLocaleString('fr-FR')} ${currency}`
    return `${Math.round(amount).toLocaleString('fr-FR')}`
  })()

  const legacyImageUrl = String(
    product?.image
    || product?.image_url
    || product?.imageUrl
    || product?.thumbnail
    || product?.thumbnail_url
    || ''
  ).trim()

  const images = (() => {
    const list = Array.isArray(product?.images) ? product.images : [];
    const normalized = list
      .map((img) => ({
        url: String(img?.url || '').trim(),
        alt_text: String(img?.alt_text || '').trim(),
      }))
      .filter((img) => Boolean(img.url));
    if (legacyImageUrl && !normalized.some((x) => x.url === legacyImageUrl)) {
      normalized.unshift({ url: legacyImageUrl, alt_text: productName })
    }
    return normalized
  })();

  useEffect(() => {
    setActiveImageIndex(0);
  }, [product?.id]);

  const toggleWishlist = () => {
    setIsWishlisted(!isWishlisted);
  };

  const addToCart = () => {
    toast.success(`Produit "${product.name}" ajouté au panier`);
  };

  return (
    <div className="card hover-scale overflow-hidden">
      <div className="relative bg-gray-50 dark:bg-gray-800">
        <Link to={`/shop/${shop.slug}/product/${productSlug}`}>
          <div className="w-full aspect-[4/3] overflow-hidden">
            <img
              src={images[activeImageIndex]?.url || 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=800'}
              alt={images[activeImageIndex]?.alt_text || productName}
              className="w-full h-full object-contain"
              loading="lazy"
            />
          </div>
        </Link>
        {product.featured && (
          <div className="absolute top-2 left-2 bg-secondary-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
            Vedette
          </div>
        )}
        <button
          onClick={toggleWishlist}
          className="absolute top-2 right-2 p-2 bg-white/90 dark:bg-gray-800/90 rounded-full shadow-md hover:shadow-lg transition-shadow"
        >
          <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
        </button>
      </div>

      {images.length > 1 && (
        <div className="px-4 pb-3">
          <div className="flex items-center gap-2 overflow-x-auto">
            {images.slice(0, 3).map((img, idx) => (
              <button
                key={`${img.url}-${idx}`}
                type="button"
                onClick={() => setActiveImageIndex(idx)}
                className={`shrink-0 rounded-xl border ${idx === activeImageIndex ? 'border-orange-400' : 'border-gray-200 dark:border-gray-700'} bg-white dark:bg-gray-900 p-1`}
                aria-label={`Image ${idx + 1}`}
              >
                <img src={img.url} alt={img.alt_text || product.name} className="w-14 h-14 rounded-lg object-cover" loading="lazy" />
              </button>
            ))}
          </div>
        </div>
      )}
      
      <div className="card-body">
        <div className="mb-2">
          <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            {categoryLabel}
          </span>
        </div>
        
        <Link to={`/shop/${shop.slug}/product/${productSlug}`}>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 hover:text-primary-600 dark:hover:text-primary-400 line-clamp-2">
            {productName}
          </h3>
        </Link>
        
        <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-2">
          {shortDescription || 'Disponible en boutique.'}
        </p>
        
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < Math.floor(averageRating)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {averageRating.toFixed(1)} ({reviewCount})
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-xl font-bold text-gray-900 dark:text-white">
            {priceText}
          </span>
          <button
            onClick={addToCart}
            className="btn-primary p-2"
          >
            <ShoppingCart className="w-5 h-5" />
          </button>
        </div>
        
        {(() => {
          const list = Array.isArray(product?.variants) ? product.variants : []
          const qty = Number(list?.[0]?.inventory_quantity)
          if (!Number.isFinite(qty)) return null
          if (qty > 5) return null
          return (
          <div className="mt-2 text-xs text-orange-600 font-medium">
            {qty} restants
          </div>
          )
        })()}
      </div>
    </div>
  );
};

export default ShopPage;
