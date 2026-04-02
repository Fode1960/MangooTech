import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../config/supabase'
import { useAuth } from '../hooks/useAuth'

export default function ProviderApply() {
  const navigate = useNavigate()
  const { user, loading } = useAuth()
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [phone, setPhone] = useState('')
  const [city, setCity] = useState('')
  const [country, setCountry] = useState('BF')
  const [services, setServices] = useState('')
  const [avatarDataUrl, setAvatarDataUrl] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const normalizedSlug = useMemo(() => {
    const base = slug.trim().toLowerCase()
    return base
      .replace(/[^a-z0-9\-\s]/g, '')
      .replace(/\s+/g, '-')
      .replace(/\-+/g, '-')
      .replace(/^\-+|\-+$/g, '')
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
      setSuccess('Profil soumis. En attente de validation par un administrateur.')
    } catch (e: any) {
      setError(e?.message || 'Erreur lors de la soumission')
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
    return <div className="p-6 text-gray-700 dark:text-gray-200">Chargement…</div>
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-2xl font-black text-gray-900 dark:text-white">Créer mon profil prestataire</div>
          <div className="text-sm text-gray-600 dark:text-gray-300">Votre profil sera invisible tant qu’il n’est pas approuvé.</div>
        </div>
        <button
          type="button"
          onClick={() => navigate('/provider/dashboard')}
          className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-bold"
        >
          Retour
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300">
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-200">
          {success}
        </div>
      )}

      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 space-y-3">
        <div>
          <div className="text-sm font-bold text-gray-700 dark:text-gray-200">Photo de profil (optionnel)</div>
          <div className="mt-2 flex items-center gap-3">
            <div className="h-14 w-14 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
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
              className="block w-full text-sm text-gray-700 dark:text-gray-200"
            />
          </div>
          <div className="mt-1 text-xs text-gray-600 dark:text-gray-300">PNG/JPG/WebP, max 1 MB.</div>
        </div>

        <div>
          <div className="text-sm font-bold text-gray-700 dark:text-gray-200">Nom</div>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            placeholder="Ex: Plomberie Diallo"
          />
        </div>

        <div>
          <div className="text-sm font-bold text-gray-700 dark:text-gray-200">Slug</div>
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            placeholder="Ex: plomberie-diallo"
          />
          <div className="mt-1 text-xs text-gray-600 dark:text-gray-300">Normalisé : {normalizedSlug || '—'}</div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <div className="text-sm font-bold text-gray-700 dark:text-gray-200">Téléphone</div>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              placeholder="Ex: +226 70 00 00 00"
            />
          </div>
          <div>
            <div className="text-sm font-bold text-gray-700 dark:text-gray-200">Ville</div>
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              placeholder="Ex: Ouagadougou"
            />
          </div>
        </div>

        <div>
          <div className="text-sm font-bold text-gray-700 dark:text-gray-200">Pays</div>
          <input
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            placeholder="BF"
          />
        </div>

        <div>
          <div className="text-sm font-bold text-gray-700 dark:text-gray-200">Services (séparés par des virgules)</div>
          <input
            value={services}
            onChange={(e) => setServices(e.target.value)}
            className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            placeholder="Ex: Dépannage, Installation, Entretien"
          />
        </div>

        <button
          type="button"
          onClick={submit}
          disabled={isSaving}
          className="w-full px-4 py-3 rounded-lg bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white font-black"
        >
          {isSaving ? 'Envoi…' : 'Soumettre pour validation'}
        </button>
      </div>
    </div>
  )
}

