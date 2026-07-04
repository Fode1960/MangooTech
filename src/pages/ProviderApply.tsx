import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../config/supabase'
import { useAuth } from '../hooks/useAuth'
import mangooLogoUrl from '../assets/mangoo-logo.svg'

const safeParseJson = <T,>(raw: string | null, fallback: T): T => {
  try {
    const parsed = raw ? JSON.parse(raw) : fallback
    return parsed
  } catch {
    return fallback
  }
}

const reserveLocalPin = (vendorId: string) => {
  const key = 'mangoo_local_pin_map'
  const m = safeParseJson<Record<string, string>>(localStorage.getItem(key), {})
  const exists = (pin: string) => Object.prototype.hasOwnProperty.call(m, pin)
  let tries = 0
  while (tries < 60) {
    tries += 1
    let pin = ''
    for (let i = 0; i < 4; i += 1) pin += String(Math.floor(Math.random() * 10))
    if (pin.replace(/0/g, '').length < 1) continue
    if (exists(pin)) continue
    m[pin] = vendorId
    localStorage.setItem(key, JSON.stringify(m))
    return pin
  }
  const fallback = String(Date.now()).slice(-4)
  m[fallback] = vendorId
  localStorage.setItem(key, JSON.stringify(m))
  return fallback
}

const getLocalLatLng = () => {
  const fallback = { lat: 4.051056, lng: 9.767869 }
  try {
    const rawConsent = localStorage.getItem('user_geolocation_consent')
    const consent = rawConsent ? JSON.parse(rawConsent) : null
    const loc = consent?.locationData || consent?.location_data || null
    const lat = typeof loc?.latitude === 'number' ? loc.latitude : Number(loc?.latitude)
    const lng = typeof loc?.longitude === 'number' ? loc.longitude : Number(loc?.longitude)
    if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng }
  } catch {
  }
  return fallback
}

export default function ProviderApply() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user, loading } = useAuth()
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [phone, setPhone] = useState(() => String(searchParams.get('phone') || '').trim())
  const [city, setCity] = useState('')
  const [country, setCountry] = useState('BF')
  const [services, setServices] = useState('')
  const [avatarDataUrl, setAvatarDataUrl] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    try {
      if (!('speechSynthesis' in window)) return
      const text = "Bienvenue. Remplissez ce formulaire pour ouvrir votre espace prestataire. Commencez par votre nom de métier."
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'fr-FR'
      utterance.rate = 0.95
      window.speechSynthesis.cancel()
      window.speechSynthesis.speak(utterance)
      return () => {
        try { window.speechSynthesis.cancel() } catch {}
      }
    } catch {
    }
  }, [])

  const normalizedSlug = useMemo(() => {
    const base = slug.trim().toLowerCase()
    return base
      .replace(/[^a-z0-9-\s]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '')
  }, [slug])

  const submit = useCallback(async () => {
    if (isSaving) return
    setError(null)
    setSuccess(null)

    if (!user?.id) {
      setError('Connectez-vous avant de soumettre un profil prestataire.')
      return
    }
    if (!name.trim()) {
      setError('Le nom est obligatoire.')
      return
    }
    if (!normalizedSlug) {
      setError('Le slug est obligatoire (ex: plombier-ouaga).')
      return
    }

    const servicesList = services
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    const { lat, lng } = getLocalLatLng()

    setIsSaving(true)
    try {
      const { error: dbError } = await supabase
        .from('providers')
        .upsert(
          {
            user_id: user.id,
            name: name.trim(),
            slug: normalizedSlug,
            avatar_url: avatarDataUrl,
            phone: phone.trim() || null,
            email: user.email || null,
            city: city.trim() || null,
            country: country.trim() || 'BF',
            services: servicesList,
            status: 'pending',
            is_visible: false
          },
          { onConflict: 'user_id' }
        )

      if (dbError) throw dbError
      try {
        await supabase.auth.updateUser({
          data: {
            full_name: name.trim(),
            location_data: {
              latitude: lat,
              longitude: lng,
              timestamp: new Date().toISOString(),
              source: 'provider_apply'
            }
          }
        })
      } catch {
      }
      try {
        const { data: sessionData } = await supabase.auth.getSession()
        const accessToken = String(sessionData?.session?.access_token || '').trim()
        await fetch('/api/local-sync/localplus/vendors', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
          body: JSON.stringify({
            ownerEmail: String(user.email || '').trim().toLowerCase(),
            vendor: {
              id: `provider-${String(user.id || '').trim() || normalizedSlug}`,
              name: name.trim(),
              slug: normalizedSlug,
              category: '🔧 Services',
              trade: servicesList[0] || 'Prestataire',
              kind: 'provider',
              approvalStatus: 'approved',
              status: 'open',
              lat,
              lng,
              phone: phone.trim() || '',
              city: city.trim() || '',
              country: country.trim() || 'BF',
              services: servicesList,
              portfolio: [],
              coverage: [],
              isMobile: false,
              userId: String(user.id || '').trim(),
              ownerName: String((user as any)?.user_metadata?.full_name || name || '').trim(),
              avatar: avatarDataUrl || undefined,
            },
          }),
        }).catch(() => null)
      } catch {
      }
      setSuccess('Profil soumis. En attente de validation par un administrateur.')
    } catch (e: any) {
      const msg = String(e?.message || '')
      const isMissingProvidersTable =
        msg.includes("Could not find the table 'public.providers'") ||
        msg.includes('schema cache') ||
        msg.toLowerCase().includes('public.providers')

      if (isMissingProvidersTable) {
        try {
          const id = String(Date.now())
          const pin = reserveLocalPin(id)
          const servicesList = services
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)

          const record: any = {
            id,
            name: name.trim(),
            slug: normalizedSlug,
            category: '🔧 Services',
            trade: servicesList[0] || 'Prestataire',
            kind: 'service',
            approvalStatus: 'approved',
            status: 'open',
            lat,
            lng,
            phone: phone.trim() || '',
            city: city.trim() || '',
            country: country.trim() || 'BF',
            services: servicesList,
            portfolio: [],
            coverage: [],
            isMobile: false,
            ownerEmail: String(user.email || '').trim().toLowerCase(),
            ownerName: String((user as any)?.user_metadata?.full_name || '').trim(),
            isUserOwned: true,
            localPin: pin,
            avatar: avatarDataUrl || undefined
          }

          const customKey = 'mangoo_custom_vendors'
          const legacyKey = 'mangoo_vendors'
          const list = safeParseJson<any[]>(localStorage.getItem(customKey), [])
          const next = Array.isArray(list) ? list : []
          next.push(record)
          localStorage.setItem(customKey, JSON.stringify(next))

          try {
            const rawLegacy = safeParseJson<any[]>(localStorage.getItem(legacyKey), [])
            if (Array.isArray(rawLegacy)) {
              rawLegacy.push(record)
              localStorage.setItem(legacyKey, JSON.stringify(rawLegacy))
            }
          } catch {
          }

          try {
            localStorage.setItem('mangoo_my_provider_id', id)
          } catch {
          }
          try {
            const email = String(user.email || '').trim().toLowerCase()
            if (email) {
              const k = `mangoo_my_provider_ids:${email}`
              const ids = safeParseJson<any[]>(localStorage.getItem(k), [])
              const arr = Array.isArray(ids) ? ids : []
              if (!arr.some((x) => String(x) === id)) arr.push(id)
              localStorage.setItem(k, JSON.stringify(arr))
            }
          } catch {
          }
          try {
            const { data: sessionData } = await supabase.auth.getSession()
            const accessToken = String(sessionData?.session?.access_token || '').trim()
            await fetch('/api/local-sync/localplus/vendors', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
              },
              body: JSON.stringify({
                ownerEmail: record.ownerEmail,
                vendor: {
                  ...record,
                  kind: 'provider',
                  category: '🔧 Services',
                  approvalStatus: 'approved'
                }
              })
            }).catch(() => null)
          } catch {
          }

          setSuccess(`Mode local : profil créé. Votre code PIN est ${pin}.`)
          navigate(`/provider/dashboard?vendorId=${encodeURIComponent(id)}`)
          return
        } catch {
          setError('Mode local indisponible : impossible de sauvegarder sur cet appareil.')
          return
        }
      }

      setError(msg || 'Erreur lors de la soumission')
    } finally {
      setIsSaving(false)
    }
  }, [avatarDataUrl, city, country, isSaving, name, normalizedSlug, phone, services, user?.email, user?.id])

  const onPickAvatar = useCallback((file: File | null) => {
    setError(null)
    if (!file) {
      setAvatarDataUrl(null)
      return
    }
    if (!file.type.startsWith('image/')) {
      setError('Veuillez choisir une image (PNG/JPG/WebP).')
      return
    }
    const maxBytes = 1024 * 1024
    if (file.size > maxBytes) {
      setError('Image trop lourde. Maximum 1 MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : null
      setAvatarDataUrl(result)
    }
    reader.onerror = () => {
      setError('Impossible de lire l’image sélectionnée.')
    }
    reader.readAsDataURL(file)
  }, [])

  if (loading) {
    return (
      <div className="min-h-dvh bg-gradient-to-br from-orange-50 via-white to-green-50 text-gray-900 flex items-center justify-center p-6">
        Chargement…
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-gradient-to-br from-orange-50 via-white to-green-50 text-gray-900">
      <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <img src={mangooLogoUrl} alt="Mangoo Tech" className="w-10 h-10 shrink-0" />
            <div className="min-w-0">
              <div className="text-xl sm:text-2xl font-black leading-tight">Créer mon profil prestataire</div>
              <div className="text-sm text-gray-600">Votre profil sera invisible tant qu’il n’est pas approuvé.</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/provider/dashboard')}
            className="px-3 py-2 rounded-xl bg-white hover:bg-gray-50 border border-gray-200 text-gray-900 font-black shrink-0"
          >
            Retour
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-2xl border border-red-200 bg-red-50 text-red-700 font-semibold">
            {error}
          </div>
        )}
        {success && (
          <div className="p-3 rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-800 font-semibold">
            {success}
          </div>
        )}

        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-4 sm:p-5 space-y-3">
          <div>
            <div className="text-sm font-black text-gray-700">Photo de profil (optionnel)</div>
            <div className="mt-2 flex items-center gap-3">
              <div className="h-14 w-14 rounded-full overflow-hidden bg-gray-100 border border-gray-200">
                {avatarDataUrl ? (
                  <img src={avatarDataUrl} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full" />
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => onPickAvatar(e.target.files?.[0] || null)}
                className="block w-full text-sm text-gray-700 file:mr-3 file:px-3 file:py-2 file:rounded-xl file:border file:border-gray-200 file:bg-gray-100 file:text-gray-900 file:font-black"
              />
            </div>
            <div className="mt-1 text-xs text-gray-600">PNG/JPG/WebP, max 1 MB.</div>
          </div>

          <div>
            <div className="text-sm font-black text-gray-700">Nom</div>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-orange-400/40"
              placeholder="Ex: Plomberie Diallo"
            />
          </div>

          <div>
            <div className="text-sm font-black text-gray-700">Slug</div>
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-orange-400/40"
              placeholder="Ex: plomberie-diallo"
            />
            <div className="mt-1 text-xs text-gray-600">Normalisé : {normalizedSlug || '—'}</div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="text-sm font-black text-gray-700">Téléphone</div>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-orange-400/40"
                placeholder="Ex: +226 70 00 00 00"
              />
            </div>
            <div>
              <div className="text-sm font-black text-gray-700">Ville</div>
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-orange-400/40"
                placeholder="Ex: Ouagadougou"
              />
            </div>
          </div>

          <div>
            <div className="text-sm font-black text-gray-700">Pays</div>
            <input
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-orange-400/40"
              placeholder="BF"
            />
          </div>

          <div>
            <div className="text-sm font-black text-gray-700">Services (séparés par des virgules)</div>
            <input
              value={services}
              onChange={(e) => setServices(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-orange-400/40"
              placeholder="Ex: Dépannage, Installation, Entretien"
            />
          </div>

          <button
            type="button"
            onClick={submit}
            disabled={isSaving}
            className="w-full px-4 py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-green-600 hover:from-orange-600 hover:to-green-700 disabled:opacity-60 text-white font-black"
          >
            {isSaving ? 'Envoi…' : 'Soumettre pour validation'}
          </button>
        </div>
      </div>
    </div>
  )
}
