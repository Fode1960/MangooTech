import React, { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Phone, ShieldCheck, Truck, User } from 'lucide-react'
import { detectRegionKey, type LatLng } from '../utils/geo'
import CourierLayout from '../components/courier/CourierLayout'
import { useThemeStore } from '../stores/themeStore'

function saveCurrentUser(u: any) {
  try {
    localStorage.setItem('mangoo-current-user', JSON.stringify(u))
  } catch {
  }
}

export default function CourierRegister() {
  const navigate = useNavigate()
  const { isDark } = useThemeStore()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [region, setRegion] = useState<'cm' | 'ci' | 'sn' | ''>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSubmit = useMemo(() => {
    return name.trim().length >= 2 && email.trim().includes('@')
  }, [name, email])

  const detectFromGps = useCallback(async () => {
    setError(null)
    if (!('geolocation' in navigator)) {
      setError('Géolocalisation indisponible sur ce navigateur')
      return
    }
    setLoading(true)
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 9000,
          maximumAge: 120000,
        })
      })
      const p: LatLng = { lat: pos.coords.latitude, lng: pos.coords.longitude }
      const r = detectRegionKey(p)
      if (!r) {
        setError('Zone non détectée. Choisissez CM/CI/SN manuellement.')
        return
      }
      setRegion(r)
    } catch (e: any) {
      setError(String(e?.message || e))
    } finally {
      setLoading(false)
    }
  }, [])

  const onSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!canSubmit) return
    setLoading(true)
    try {
      const now = new Date().toISOString()
      const id = `courier_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
      const user = {
        id,
        email: email.trim(),
        full_name: name.trim(),
        phone: phone.trim() || null,
        role: 'livreur',
        roles: ['livreur'],
        region: region || null,
        created_at: now,
      }
      saveCurrentUser(user)
      navigate('/livreur', { replace: true })
    } catch (e: any) {
      setError(String(e?.message || e))
    } finally {
      setLoading(false)
    }
  }, [canSubmit, email, name, navigate, phone, region])

  return (
    <CourierLayout title="Inscription livreur" subtitle="Créez votre profil pour prendre des commandes en temps réel.">
      <div className="max-w-xl mx-auto">
        <div className={`rounded-2xl border p-5 ${isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-white shadow-xl'}`}>
          {error && (
            <div className={`px-4 py-3 rounded-2xl border text-sm ${isDark ? 'bg-rose-500/10 border-rose-500/20 text-rose-200' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
              {error}
            </div>
          )}

          <form onSubmit={onSubmit} className="mt-4 space-y-4">
            <div>
              <label className={`text-xs font-black ${isDark ? 'text-zinc-300' : 'text-gray-700'}`}>Nom</label>
              <div className={`mt-2 flex items-center gap-2 rounded-2xl border px-3 py-3 ${isDark ? 'border-white/10 bg-black/20' : 'border-gray-200 bg-gray-50'}`}>
                <User className={`w-5 h-5 ${isDark ? 'text-zinc-400' : 'text-gray-500'}`} />
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-transparent outline-none text-sm"
                  placeholder="Ex: Jean N." 
                  required
                />
              </div>
            </div>

            <div>
              <label className={`text-xs font-black ${isDark ? 'text-zinc-300' : 'text-gray-700'}`}>Email</label>
              <div className={`mt-2 flex items-center gap-2 rounded-2xl border px-3 py-3 ${isDark ? 'border-white/10 bg-black/20' : 'border-gray-200 bg-gray-50'}`}>
                <Mail className={`w-5 h-5 ${isDark ? 'text-zinc-400' : 'text-gray-500'}`} />
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent outline-none text-sm"
                  placeholder="livreur@example.com"
                  type="email"
                  required
                />
              </div>
            </div>

            <div>
              <label className={`text-xs font-black ${isDark ? 'text-zinc-300' : 'text-gray-700'}`}>Téléphone (optionnel)</label>
              <div className={`mt-2 flex items-center gap-2 rounded-2xl border px-3 py-3 ${isDark ? 'border-white/10 bg-black/20' : 'border-gray-200 bg-gray-50'}`}>
                <Phone className={`w-5 h-5 ${isDark ? 'text-zinc-400' : 'text-gray-500'}`} />
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-transparent outline-none text-sm"
                  placeholder="+237... / +225... / +221..."
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className={`text-xs font-black ${isDark ? 'text-zinc-300' : 'text-gray-700'}`}>Zone (CM / CI / SN)</label>
                <button
                  type="button"
                  onClick={detectFromGps}
                  className={`px-3 py-2 rounded-xl font-black text-xs transition-colors ${isDark ? 'bg-white/5 border border-white/10 hover:bg-white/10' : 'bg-gray-100 border border-gray-200 hover:bg-gray-200'}`}
                  disabled={loading}
                >
                  Détecter GPS
                </button>
              </div>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value as any)}
                className={`mt-2 w-full px-3 py-3 rounded-2xl outline-none text-sm border ${isDark ? 'bg-black/20 border-white/10' : 'bg-white border-gray-200'}`}
              >
                <option value="">Auto</option>
                <option value="cm">Cameroun</option>
                <option value="ci">Côte d'Ivoire</option>
                <option value="sn">Sénégal</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={!canSubmit || loading}
              className="w-full px-4 py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-emerald-500 text-white font-black hover:from-orange-600 hover:to-emerald-600 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Création…' : 'Créer mon compte livreur'}
            </button>
          </form>

          <div className={`mt-5 flex items-center gap-2 text-xs ${isDark ? 'text-zinc-300' : 'text-gray-600'}`}>
            <ShieldCheck className={`w-4 h-4 ${isDark ? 'text-emerald-300' : 'text-emerald-600'}`} />
            <div>Rôle attribué: <span className="font-black">livreur</span>.</div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/')}
            className={`mt-4 w-full px-4 py-3 rounded-2xl font-black transition-colors ${isDark ? 'bg-white/5 border border-white/10 hover:bg-white/10' : 'bg-white border border-gray-200 hover:bg-gray-50'}`}
          >
            Retour accueil
          </button>
        </div>
      </div>
    </CourierLayout>
  )
}
