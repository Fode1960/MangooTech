import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { QRCodeCanvas } from 'qrcode.react'
import { supabase } from '../../config/supabase'

const SELECTED_SHOP_STORAGE_KEY = 'connect_plus_selected_shop_slug'
const normalizePin = (value) => String(value || '').replace(/[^\d]/g, '').slice(0, 6)

const speakFR = (text) => {
  try {
    if (!('speechSynthesis' in window)) return
    const t = String(text || '').trim()
    if (!t) return
    const u = new SpeechSynthesisUtterance(t)
    u.lang = 'fr-FR'
    u.rate = 0.98
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(u)
  } catch {
  }
}

const speakDigitsFR = (pin) => {
  const p = normalizePin(pin)
  if (!p) return
  speakFR(p.split('').join(' '))
}

const fetchJson = async (url, init = {}, options = {}) => {
  const timeoutMs = Number(options?.timeoutMs || 0)
  if (!timeoutMs) {
    const res = await fetch(url, init)
    const json = await res.json().catch(() => null)
    return { res, json }
  }
  const controller = new AbortController()
  const t = window.setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, { ...init, signal: controller.signal })
    const json = await res.json().catch(() => null)
    return { res, json }
  } finally {
    window.clearTimeout(t)
  }
}

export default function ConnectPlusVendorPage({ shops = [], user }) {
  const navigate = useNavigate()
  const storageKey = useMemo(() => {
    const e = String(user?.email || '').trim().toLowerCase()
    return e ? `${SELECTED_SHOP_STORAGE_KEY}:${e}` : SELECTED_SHOP_STORAGE_KEY
  }, [user?.email])

  const [selectedShopSlug, setSelectedShopSlug] = useState('')
  const [pin, setPin] = useState('')
  const [url, setUrl] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const openVendorCall = useCallback(() => {
    const slug = String(selectedShopSlug || shops?.[0]?.slug || '').trim()
    if (!slug) return
    const roomId = `shop:${slug}`
    const qs = new URLSearchParams()
    qs.set('role', 'vendor')
    qs.set('roomId', roomId)
    qs.set('userId', roomId)
    qs.set('ui', 'ultra')
    navigate(`/webrtc?${qs.toString()}`)
  }, [navigate, selectedShopSlug, shops])

  useEffect(() => {
    if (!Array.isArray(shops) || shops.length === 0) {
      if (selectedShopSlug) setSelectedShopSlug('')
      if (pin) setPin('')
      if (url) setUrl('')
      try {
        localStorage.removeItem(storageKey)
        localStorage.removeItem(SELECTED_SHOP_STORAGE_KEY)
      } catch {
      }
      return
    }
    try {
      const legacy = String(localStorage.getItem(SELECTED_SHOP_STORAGE_KEY) || '').trim()
      const stored = String(localStorage.getItem(storageKey) || '').trim() || legacy
      if (stored && stored !== selectedShopSlug) {
        const exists = shops.some((s) => String(s?.slug || '').trim() === stored)
        if (exists) {
          const uEmail = String(user?.email || '').trim().toLowerCase()
          const match = shops.find((s) => String(s?.slug || '').trim() === stored) || null
          const sEmail = String(match?.ownerEmail || match?.owner_email || '').trim().toLowerCase()
          if (uEmail && sEmail && uEmail !== sEmail) {
            setSelectedShopSlug(String(shops?.[0]?.slug || '').trim())
            try {
              localStorage.removeItem(storageKey)
              localStorage.removeItem(SELECTED_SHOP_STORAGE_KEY)
            } catch {
            }
            return
          }
          setSelectedShopSlug(stored)
          try {
            localStorage.setItem(storageKey, stored)
            localStorage.removeItem(SELECTED_SHOP_STORAGE_KEY)
          } catch {
          }
          return
        }
      }
    } catch {
    }
    if (selectedShopSlug) {
      const exists = shops.some((s) => String(s?.slug || '').trim() === String(selectedShopSlug || '').trim())
      if (!exists) {
        const first = String(shops?.[0]?.slug || '').trim()
        if (first) setSelectedShopSlug(first)
        else setSelectedShopSlug('')
      }
      return
    }
    const first = String(shops?.[0]?.slug || '').trim()
    if (!selectedShopSlug && first) setSelectedShopSlug(first)
  }, [selectedShopSlug, shops, pin, storageKey, url, user?.email])

  const selectedShop = useMemo(() => {
    const slug = String(selectedShopSlug || '').trim()
    return shops.find((s) => String(s?.slug || '').trim() === slug) || null
  }, [selectedShopSlug, shops])

  const shopPublicUrl = useMemo(() => {
    const slug = String(selectedShopSlug || '').trim()
    if (!slug) return ''
    return `${window.location.origin}/shop/${encodeURIComponent(slug)}?view=client`
  }, [selectedShopSlug])

  const ownerEmailForRequest = useMemo(() => {
    const fromShop = selectedShop?.ownerEmail || selectedShop?.owner_email
    const fromUser = user?.email
    return String(fromShop || fromUser || '').trim()
  }, [selectedShop, user?.email])

  useEffect(() => {
    const slug = String(selectedShopSlug || '').trim()
    if (!slug) return
    try {
      localStorage.setItem(storageKey, slug)
    } catch {
    }
  }, [selectedShopSlug, storageKey])

  useEffect(() => {
    if (!shopPublicUrl) return
    setUrl(shopPublicUrl)
  }, [shopPublicUrl])

  const getAuthHeaders = useCallback(async () => {
    const host = (() => {
      try {
        return String(window.location.hostname || '').trim().toLowerCase()
      } catch {
        return ''
      }
    })()
    const isDevHost = host === 'localhost' || host === '127.0.0.1' || host.startsWith('192.168.') || host.startsWith('10.') || host.startsWith('172.')
    if (isDevHost) return {}
    const { data } = await supabase.auth.getSession()
    const token = String(data?.session?.access_token || '')
    if (!token) return null
    return { Authorization: `Bearer ${token}` }
  }, [])

  const ensure = useCallback(() => {
    const run = async () => {
      const slug = String(selectedShopSlug || '').trim()
      if (!slug) return
      setError('')
      setBusy(true)
      try {
        const authHeaders = await getAuthHeaders()
        if (authHeaders === null) {
          setError('Connexion requise')
          return
        }
        const { res, json } = await fetchJson('/api/connect-plus/stable/ensure', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(authHeaders || {}),
          },
          body: JSON.stringify({
            shopSlug: slug,
            ownerEmail: ownerEmailForRequest,
            pinLen: 6,
          }),
        }, { timeoutMs: 8000 })
        if (res.ok && json?.success && json?.pin && json?.url) {
          setPin(String(json.pin))
          return
        }
        setError(String(json?.error || `HTTP ${res.status}`))
      } catch {
        setError('Erreur réseau / délai dépassé')
      } finally {
        setBusy(false)
      }
    }
    void run()
  }, [getAuthHeaders, ownerEmailForRequest, selectedShopSlug])

  const issue = useCallback(() => {
    const run = async () => {
      const slug = String(selectedShopSlug || '').trim()
      if (!slug) return
      setError('')
      setBusy(true)
      try {
        const authHeaders = await getAuthHeaders()
        if (authHeaders === null) {
          setError('Connexion requise')
          return
        }
        const { res, json } = await fetchJson('/api/connect-plus/stable/change', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(authHeaders || {}),
          },
          body: JSON.stringify({
            shopSlug: slug,
            ownerEmail: ownerEmailForRequest,
            pinLen: 6,
          }),
        }, { timeoutMs: 8000 })
        if (res.ok && json?.success && json?.pin && json?.url) {
          setPin(String(json.pin))
          return
        }
        setError(String(json?.error || `HTTP ${res.status}`))
      } catch {
        setError('Erreur réseau / délai dépassé')
      } finally {
        setBusy(false)
      }
    }
    void run()
  }, [getAuthHeaders, ownerEmailForRequest, selectedShopSlug])

  const openPinKeypad = useCallback(() => {
    try {
      const p = String(pin || '').trim()
      const url = p ? `/connect-plus?pin=${encodeURIComponent(p)}` : '/connect-plus'
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch {
    }
  }, [pin])

  const readPin = useCallback(() => {
    const p = normalizePin(pin)
    if (!p) return
    speakFR('Votre code est')
    speakDigitsFR(p)
  }, [pin])

  useEffect(() => {
    if (!selectedShopSlug) return
    if (!Array.isArray(shops) || shops.length === 0) return
    const exists = shops.some((s) => String(s?.slug || '').trim() === String(selectedShopSlug || '').trim())
    if (!exists) return
    ensure()
  }, [ensure, selectedShopSlug, shops])

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-end gap-3 justify-between">
        <div>
          <div className="text-lg font-semibold text-gray-900 dark:text-white">Connect+</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">QR + PIN pour ouvrir la boutique sans compte</div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
          <select
            value={selectedShopSlug}
            onChange={(e) => setSelectedShopSlug(e.target.value)}
            disabled={!shops.length || busy}
            className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white"
          >
            {shops.map((s) => (
              <option key={s.slug} value={s.slug}>{s.name}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={openPinKeypad}
            disabled={busy || !String(pin || '').trim()}
            className={`${busy ? 'opacity-60' : ''} ${String(pin || '').trim() ? 'bg-white border border-gray-200 hover:bg-gray-50 text-gray-900' : 'bg-white border border-gray-200 text-gray-500'} px-4 py-2 rounded-lg text-sm font-semibold transition-colors`}
          >
            Clavier PIN
          </button>
          <button
            type="button"
            onClick={readPin}
            disabled={busy || !normalizePin(pin)}
            className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-900 px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-60"
          >
            🔊 Lire le PIN
          </button>
          <button
            type="button"
            onClick={issue}
            disabled={!selectedShopSlug || busy}
            className="bg-gradient-to-r from-orange-500 to-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-60"
          >
            {busy ? 'Chargement...' : 'Changer PIN'}
          </button>
          <button
            type="button"
            onClick={openVendorCall}
            disabled={busy || !String(selectedShopSlug || shops?.[0]?.slug || '').trim()}
            className={`${busy ? 'opacity-60' : ''} ${String(selectedShopSlug || shops?.[0]?.slug || '').trim() ? 'bg-white border border-gray-200 hover:bg-gray-50 text-gray-900' : 'bg-white border border-gray-200 text-gray-500'} px-4 py-2 rounded-lg text-sm font-semibold transition-colors`}
          >
            📞 Appeler (Connect+)
          </button>
        </div>
      </div>

      {!shops.length && (
        <div className="px-4 py-3 rounded-2xl border border-amber-200 bg-amber-50 text-amber-900 text-sm font-semibold">
          Aucune boutique trouvée pour ce compte. Allez dans « Mes boutiques » et vérifiez que la boutique est bien liée à votre email vendeur.
        </div>
      )}

      {error && (
        <div className="px-4 py-3 rounded-2xl border border-red-200 bg-red-50 text-red-700 text-sm font-semibold">
          {error}
        </div>
      )}

      {(pin || url) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="border border-gray-200 dark:border-gray-700 rounded-2xl p-5 bg-white dark:bg-gray-800">
            <div className="text-sm font-semibold text-gray-700 dark:text-gray-200">PIN</div>
            <div className="mt-2 text-5xl font-black tracking-widest text-gray-900 dark:text-white">{pin || '----'}</div>
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">Valable indéfiniment (modifiable)</div>
          </div>

          <div className="border border-gray-200 dark:border-gray-700 rounded-2xl p-5 bg-white dark:bg-gray-800">
            <div className="text-sm font-semibold text-gray-700 dark:text-gray-200">QR Code</div>
            <div className="mt-3 flex items-center justify-center">
              <div className="bg-white p-3 rounded-xl">
                <QRCodeCanvas value={url || window.location.origin} size={220} includeMargin />
              </div>
            </div>
            <div className="mt-3 text-xs break-all text-gray-600 dark:text-gray-300">{url}</div>
          </div>
        </div>
      )}
    </div>
  )
}
