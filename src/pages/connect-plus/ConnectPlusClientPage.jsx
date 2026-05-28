import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { QRCodeCanvas } from 'qrcode.react'
import { supabase } from '../../config/supabase'

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

function readLocalUser() {
  try {
    const raw = localStorage.getItem('mangoo-current-user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export default function ConnectPlusClientPage() {
  const navigate = useNavigate()
  const localUser = useMemo(() => readLocalUser(), [])
  const email = useMemo(() => String(localUser?.email || '').trim().toLowerCase(), [localUser?.email])
  const name = useMemo(() => String(localUser?.name || 'Client').trim(), [localUser?.name])

  const [pin, setPin] = useState('')
  const [roomId, setRoomId] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

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

  const ensureIdentity = useCallback(() => {
    const run = async () => {
      setError('')
      if (!email) {
        setError('Connexion requise')
        return
      }
      setBusy(true)
      try {
        const authHeaders = await getAuthHeaders()
        if (authHeaders === null) {
          setError('Connexion requise')
          return
        }
        const { res, json } = await fetchJson('/api/connect-plus/user/stable/ensure', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(authHeaders || {}),
          },
          body: JSON.stringify({ email, pinLen: 6 }),
        }, { timeoutMs: 8000 })
        if (res.ok && json?.success && json?.pin) {
          setPin(String(json.pin))
          setRoomId(String(json.roomId || `client:${normalizePin(json.pin)}`))
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
  }, [email, getAuthHeaders])

  useEffect(() => {
    void ensureIdentity()
  }, [ensureIdentity])

  const connectPlusUrl = useMemo(() => {
    const rid = String(roomId || '').trim()
    if (!rid) return ''
    const params = new URLSearchParams()
    params.set('role', 'client')
    params.set('roomId', rid)
    params.set('ui', 'simple')
    params.set('userId', rid)
    params.set('fromLabel', name)
    return `${window.location.origin}/webrtc?${params.toString()}`
  }, [name, roomId])

  const shareText = useMemo(() => {
    const p = normalizePin(pin)
    if (!p) return ''
    return `Mon ID Connect+ : ${p}`
  }, [pin])

  const copy = useCallback(async (text) => {
    const t = String(text || '').trim()
    if (!t) return
    try {
      await navigator.clipboard.writeText(t)
    } catch {
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4">
      <div className="max-w-xl mx-auto">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 font-bold"
          >
            ← Retour
          </button>
          <div className="text-sm text-gray-300">Mon Connect+</div>
        </div>

        <div className="mt-4 bg-white/5 border border-white/10 rounded-3xl p-5">
          <div className="text-lg font-black">Mon ID Connect+</div>
          <div className="text-sm text-gray-300 mt-1">À partager pour recevoir un appel gratuit</div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <div className="text-5xl font-black tracking-widest">{normalizePin(pin) || '— — — — — —'}</div>
            <div className="shrink-0 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => speakDigitsFR(pin)}
                className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/15 font-black"
                disabled={!pin}
              >
                🔊 Lire
              </button>
              <button
                type="button"
                onClick={() => copy(normalizePin(pin))}
                className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/15 font-black"
                disabled={!pin}
              >
                📋 Copier
              </button>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-4">
            <div className="bg-white p-2 rounded-2xl">
              <QRCodeCanvas value={shareText || 'Mangoo Connect+'} size={120} includeMargin />
            </div>
            <div className="min-w-0">
              <button
                type="button"
                onClick={() => {
                  if (!connectPlusUrl) return
                  window.open(connectPlusUrl, '_blank', 'noopener,noreferrer')
                }}
                disabled={!connectPlusUrl}
                className="w-full px-4 py-4 rounded-2xl bg-gradient-to-r from-orange-500 to-green-600 font-black disabled:opacity-50 disabled:cursor-not-allowed"
              >
                📞 Recevoir appels
              </button>
              <button
                type="button"
                onClick={() => copy(connectPlusUrl)}
                disabled={!connectPlusUrl}
                className="mt-3 w-full px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/15 font-black disabled:opacity-50 disabled:cursor-not-allowed"
              >
                🔗 Copier le lien
              </button>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => ensureIdentity()}
              className="flex-1 px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/15 font-black disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={busy}
            >
              {busy ? 'Chargement...' : 'Rafraîchir'}
            </button>
            <button
              type="button"
              onClick={() => {
                const url = connectPlusUrl
                if (!url) return
                window.location.href = url
              }}
              className="flex-1 px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/15 font-black disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!connectPlusUrl}
            >
              Ouvrir
            </button>
          </div>

          {error && <div className="mt-4 text-sm text-red-300">{error}</div>}
        </div>

        <div className="mt-4 bg-white/5 border border-white/10 rounded-3xl p-5">
          <div className="text-base font-black">Répondeur & Contacts</div>
          <div className="text-sm text-gray-300 mt-1">Ils sont dans l’écran Connect+ (boutons Répondeur / Contacts).</div>
          <button
            type="button"
            onClick={() => {
              if (!connectPlusUrl) return
              window.location.href = connectPlusUrl
            }}
            className="mt-4 w-full px-4 py-4 rounded-2xl bg-white/10 hover:bg-white/15 font-black disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!connectPlusUrl}
          >
            Aller à Connect+
          </button>
        </div>
      </div>
    </div>
  )
}

