import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

const normalizePin = (value) => String(value || '').replace(/[^\d]/g, '').slice(0, 6)
const VOICE_ENABLED_KEY = 'connect_plus_voice_enabled'

const fetchJson = async (url, init = {}) => {
  const res = await fetch(url, init)
  const json = await res.json().catch(() => null)
  return { res, json }
}

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

const withClientView = (redirect) => {
  const r = String(redirect || '').trim()
  if (!r) return r
  const hasQuery = r.includes('?')
  if (r.includes('view=client') || r.includes('view%3Dclient')) return r
  return `${r}${hasQuery ? '&' : '?'}view=client`
}

export default function ConnectPlusEntryPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [pin, setPin] = useState(() => normalizePin(params.get('pin') || ''))
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(() => {
    try {
      const raw = localStorage.getItem(VOICE_ENABLED_KEY)
      if (raw === null || raw === undefined) return true
      return raw === '1' || raw === 'true'
    } catch {
      return true
    }
  })
  const [confirm, setConfirm] = useState(null)
  const navTimerRef = useRef(0)

  const canSubmit = useMemo(() => normalizePin(pin).length >= 4, [pin])

  useEffect(() => {
    try {
      localStorage.setItem(VOICE_ENABLED_KEY, voiceEnabled ? '1' : '0')
    } catch {
    }
  }, [voiceEnabled])

  useEffect(() => {
    if (!voiceEnabled) return
    try {
      if (navTimerRef.current) return
      speakFR('Entrez le code boutique')
    } catch {
    }
  }, [voiceEnabled])

  useEffect(() => {
    return () => {
      if (navTimerRef.current) {
        window.clearTimeout(navTimerRef.current)
        navTimerRef.current = 0
      }
    }
  }, [])

  const setPinAndSpeak = useCallback((next, spoken) => {
    setPin(next)
    if (!voiceEnabled) return
    if (spoken) speakFR(spoken)
  }, [voiceEnabled])

  const openAfterConfirm = useCallback((redirect, shopName) => {
    if (navTimerRef.current) {
      window.clearTimeout(navTimerRef.current)
      navTimerRef.current = 0
    }
    if (voiceEnabled) {
      if (shopName) speakFR(`Boutique ${shopName}. Ouverture`)
      else speakFR('Ouverture de la boutique')
    }
    navTimerRef.current = window.setTimeout(() => {
      navigate(String(redirect), { replace: true })
    }, 900)
  }, [navigate, voiceEnabled])

  const submit = useCallback(() => {
    const run = async () => {
      const p = normalizePin(pin)
      if (p.length < 4) return
      setError('')
      setBusy(true)
      try {
        const { res, json } = await fetchJson(`/api/connect-plus/resolve?pin=${encodeURIComponent(p)}`, { method: 'GET' })
        if (res.ok && json?.success && json?.redirect) {
          const shopSlug = String(json?.shopSlug || '').trim()
          const redirect = withClientView(String(json.redirect))
          setConfirm({ shopSlug, redirect, shopName: '', shopLogo: '' })
          let shopName = ''
          let shopLogo = ''
          if (shopSlug) {
            try {
              const r2 = await fetchJson(`/api/shops/slug/${encodeURIComponent(shopSlug)}`, { method: 'GET' })
              if (r2?.res?.ok && r2?.json?.success && r2?.json?.shop) {
                shopName = String(r2.json.shop?.name || r2.json.shop?.slug || '').trim()
                shopLogo = String(r2.json.shop?.logo_url || '').trim()
              }
            } catch {
            }
          }
          setConfirm((c) => (c ? { ...c, shopName, shopLogo } : c))
          openAfterConfirm(redirect, shopName)
          return
        }
        const msg = String(json?.error || 'Code invalide')
        setError(msg)
        if (voiceEnabled) {
          const low = msg.toLowerCase()
          if (low.includes('ambigu')) speakFR('Code ambigu. Régénérez un code')
          else speakFR('Code invalide')
        }
      } catch {
        setError('Erreur réseau')
        if (voiceEnabled) speakFR('Erreur réseau')
      } finally {
        setBusy(false)
      }
    }
    void run()
  }, [openAfterConfirm, pin, voiceEnabled])

  return (
    <div className="h-[100dvh] overflow-hidden flex items-center justify-center p-2 sm:p-4 bg-gradient-to-br from-orange-50 via-white to-emerald-50 relative">
      <button
        type="button"
        onClick={() => {
          try {
            if (window.history.length > 1) {
              navigate(-1)
              return
            }
          } catch {
          }
          navigate('/', { replace: true })
        }}
        className="absolute left-3 top-3 sm:left-4 sm:top-4 bg-white/90 border border-white/60 backdrop-blur px-4 py-2 rounded-2xl text-sm font-black text-gray-900 shadow-lg hover:bg-white transition-colors"
      >
        ← Retour
      </button>
      <div className="w-full max-w-sm sm:max-w-md h-[calc(100dvh-1rem)] sm:h-auto rounded-3xl shadow-2xl border border-white/60 bg-white/90 backdrop-blur flex flex-col overflow-hidden">
        <div className="px-4 sm:px-6 pt-4 sm:pt-6">
          <div className="text-center">
            <div className="text-[clamp(2rem,4.5vh,3rem)] leading-none">📱</div>
            <div className="mt-2 text-[clamp(1.15rem,3vh,1.6rem)] font-black text-gray-900">Entrer le code</div>
            <div className="mt-1 text-[clamp(0.72rem,1.9vh,0.9rem)] text-gray-600">Tapez le code PIN boutique (4 à 6 chiffres)</div>
          </div>

          {error && (
            <div className="mt-3 px-4 py-3 rounded-2xl bg-red-50 border border-red-100 text-red-700 text-sm font-semibold">
              {error}
            </div>
          )}

          <div className="mt-3">
            <input
              inputMode="numeric"
              value={pin}
              onChange={(e) => setPin(normalizePin(e.target.value))}
              placeholder="PIN boutique"
              className="w-full text-center text-[clamp(1.4rem,3.6vh,2rem)] tracking-[0.2em] font-black px-4 py-[clamp(0.6rem,1.8vh,0.9rem)] rounded-2xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>

          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => setVoiceEnabled((v) => !v)}
              className={`flex-1 px-4 py-3 rounded-2xl border ${voiceEnabled ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-gray-200 bg-gray-50 text-gray-800'} text-sm font-black`}
            >
              {voiceEnabled ? 'Vocal: ON' : 'Vocal: OFF'}
            </button>
            <button
              type="button"
              onClick={() => voiceEnabled ? speakDigitsFR(pin) : null}
              disabled={!voiceEnabled || !normalizePin(pin)}
              className="flex-1 px-4 py-3 rounded-2xl border border-gray-200 bg-white text-gray-900 text-sm font-black disabled:opacity-60"
            >
              🔊 Lire le code
            </button>
          </div>
        </div>

        <div className="flex-1 min-h-0 px-4 sm:px-6 pb-4 sm:pb-6 pt-3 sm:pt-4 flex flex-col">
          <div className="grid grid-cols-3 gap-[clamp(0.4rem,1.2vh,0.75rem)]">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setPinAndSpeak((v) => normalizePin(String(typeof v === 'function' ? '' : v || '') + String(n)), String(n))}
                className="h-[clamp(2.5rem,7vh,3.5rem)] rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-orange-50 text-[clamp(1.05rem,2.7vh,1.25rem)] font-black shadow-sm active:scale-[0.98] transition-transform"
              >
                {n}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPinAndSpeak('', 'Effacer')}
              className="h-[clamp(2.5rem,7vh,3.5rem)] rounded-2xl border border-gray-200 bg-gray-50 text-[clamp(0.85rem,2.2vh,0.95rem)] font-black shadow-sm active:scale-[0.98] transition-transform"
            >
              Effacer
            </button>
            <button
              type="button"
              onClick={() => setPinAndSpeak((v) => normalizePin(String(typeof v === 'function' ? '' : v || '') + '0'), '0')}
              className="h-[clamp(2.5rem,7vh,3.5rem)] rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-emerald-50 text-[clamp(1.05rem,2.7vh,1.25rem)] font-black shadow-sm active:scale-[0.98] transition-transform"
            >
              0
            </button>
            <button
              type="button"
              onClick={() => setPinAndSpeak((v) => normalizePin(String(typeof v === 'function' ? '' : v || '').slice(0, -1)), 'Retour')}
              className="h-[clamp(2.5rem,7vh,3.5rem)] rounded-2xl border border-gray-200 bg-gray-50 text-[clamp(0.85rem,2.2vh,0.95rem)] font-black shadow-sm active:scale-[0.98] transition-transform"
            >
              ⌫
            </button>
          </div>

          <button
            type="button"
            disabled={!canSubmit || busy}
            onClick={submit}
            className="mt-[clamp(0.5rem,1.6vh,0.75rem)] w-full bg-gradient-to-r from-orange-500 to-green-600 text-white py-[clamp(0.65rem,2vh,0.85rem)] px-4 rounded-2xl font-black shadow-lg disabled:opacity-60 active:scale-[0.99] transition-transform"
          >
            {busy ? 'Ouverture...' : 'Ouvrir la boutique'}
          </button>
        </div>
      </div>

      {confirm && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.72)' }}>
          <div className="w-full max-w-sm rounded-3xl shadow-2xl bg-white overflow-hidden">
            <div className="p-5">
              <div className="text-center">
                <div className="text-lg font-black text-gray-900">Confirmation</div>
                <div className="mt-1 text-sm text-gray-600">Ouverture de la boutique</div>
              </div>
              <div className="mt-4 flex items-center justify-center">
                {confirm?.shopLogo ? (
                  <img src={confirm.shopLogo} alt="" className="w-20 h-20 rounded-2xl object-cover border border-gray-200" />
                ) : (
                  <div className="w-20 h-20 rounded-2xl border border-gray-200 bg-gray-50 flex items-center justify-center text-3xl">🏪</div>
                )}
              </div>
              <div className="mt-3 text-center text-lg font-black text-gray-900">
                {String(confirm?.shopName || confirm?.shopSlug || '').trim() || 'Boutique'}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (navTimerRef.current) window.clearTimeout(navTimerRef.current)
                    navTimerRef.current = 0
                    setConfirm(null)
                    if (voiceEnabled) speakFR('Annulé')
                  }}
                  className="px-4 py-3 rounded-2xl border border-gray-200 bg-white text-gray-900 text-sm font-black"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const r = String(confirm?.redirect || '').trim()
                    if (!r) return
                    if (navTimerRef.current) window.clearTimeout(navTimerRef.current)
                    navTimerRef.current = 0
                    if (voiceEnabled) speakFR('Ouverture')
                    navigate(r, { replace: true })
                  }}
                  className="px-4 py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-green-600 text-white text-sm font-black"
                >
                  Ouvrir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
