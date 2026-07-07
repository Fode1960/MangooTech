import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../config/supabase'

type HashState = {
  error?: string | null
  errorCode?: string | null
  errorDescription?: string | null
  accessToken?: string | null
  refreshToken?: string | null
  type?: string | null
}

const readHashState = (): HashState => {
  const rawHash = typeof window !== 'undefined' ? String(window.location.hash || '') : ''
  const rawStored = (() => {
    try {
      return typeof window !== 'undefined' ? String(window.sessionStorage.getItem('mangoo_auth_hash') || '') : ''
    } catch {
      return ''
    }
  })()
  const raw = rawHash || rawStored
  const hash = raw.startsWith('#') ? raw.slice(1) : raw
  const params = new URLSearchParams(hash)
  return {
    error: params.get('error'),
    errorCode: params.get('error_code'),
    errorDescription: params.get('error_description'),
    accessToken: params.get('access_token'),
    refreshToken: params.get('refresh_token'),
    type: params.get('type'),
  }
}

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showPassword2, setShowPassword2] = useState(false)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [hasSession, setHasSession] = useState(false)

  const hashState = useMemo(() => readHashState(), [])

  const ensureSessionFromHash = useCallback(async () => {
    const { accessToken, refreshToken } = hashState
    if (!accessToken || !refreshToken) return
    try {
      const { data } = await supabase.auth.getSession()
      if (data.session?.access_token) {
        setHasSession(true)
        return
      }
      const res = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
      if (res.data.session?.access_token) {
        setHasSession(true)
        try {
          window.sessionStorage.removeItem('mangoo_auth_hash')
        } catch {
        }
      }
    } catch {
    }
  }, [hashState])

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      try {
        const { data } = await supabase.auth.getSession()
        if (cancelled) return
        if (data.session?.access_token) {
          setHasSession(true)
          return
        }
        await ensureSessionFromHash()
        const { data: data2 } = await supabase.auth.getSession()
        if (cancelled) return
        if (data2.session?.access_token) setHasSession(true)
      } catch {
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [ensureSessionFromHash])

  const submit = useCallback(async () => {
    setError(null)
    setNotice(null)

    if (!password || password.length < 8) {
      setError('Mot de passe trop court (min 8 caractères).')
      return
    }
    if (password !== password2) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }

    try {
      setBusy(true)
      const { data } = await supabase.auth.getSession()
      if (!data.session?.access_token) {
        throw new Error('Session manquante. Demandez un nouveau lien de réinitialisation.')
      }
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) throw updateError
      setNotice('Mot de passe mis à jour. Redirection vers la connexion…')
      try {
        window.history.replaceState({}, document.title, '/reset-password')
      } catch {
      }
      try {
        await supabase.auth.signOut()
      } catch {
      }
      window.setTimeout(() => {
        window.location.href = '/connexion'
      }, 600)
    } catch (e: any) {
      setError(e?.message || 'Erreur de mise à jour du mot de passe')
    } finally {
      setBusy(false)
    }
  }, [password, password2])

  const otpExpired = hashState.errorCode === 'otp_expired'
  const description = hashState.errorDescription ? decodeURIComponent(hashState.errorDescription) : null

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-950">
      <div className="w-full max-w-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-6">
        <div className="text-xl font-black text-gray-900 dark:text-white">Réinitialiser le mot de passe</div>
        <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">Pour votre compte MangooTech.</div>

        {(hashState.error || hashState.errorCode) && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 text-red-800 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-200 p-4 text-sm">
            <div className="font-bold">Lien invalide</div>
            <div className="mt-1">{otpExpired ? 'Le lien a expiré ou a déjà été utilisé.' : (description || 'Erreur de validation du lien.')}</div>
            <div className="mt-2">Dans Supabase, renvoyez un nouveau “password recovery” puis ouvrez le dernier email immédiatement (idéalement en navigation privée).</div>
          </div>
        )}

        {!hasSession && !(hashState.error || hashState.errorCode) && (
          <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-200 p-4 text-sm">
            En attente de session… Si rien ne se passe, renvoyez un nouveau lien de réinitialisation.
          </div>
        )}

        <div className="mt-6 grid grid-cols-1 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Nouveau mot de passe</label>
            <div className="relative mt-1">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 pr-20 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-white"
                placeholder="Minimum 8 caractères"
                disabled={!hasSession || busy}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                disabled={!hasSession || busy}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 rounded-md text-xs font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-60 dark:text-gray-200 dark:hover:bg-gray-800"
                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              >
                {showPassword ? 'Masquer' : 'Afficher'}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Confirmer le mot de passe</label>
            <div className="relative mt-1">
              <input
                type={showPassword2 ? 'text' : 'password'}
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
                className="w-full px-3 py-2 pr-20 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-white"
                disabled={!hasSession || busy}
              />
              <button
                type="button"
                onClick={() => setShowPassword2((v) => !v)}
                disabled={!hasSession || busy}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 rounded-md text-xs font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-60 dark:text-gray-200 dark:hover:bg-gray-800"
                aria-label={showPassword2 ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              >
                {showPassword2 ? 'Masquer' : 'Afficher'}
              </button>
            </div>
          </div>

          {error && <div className="text-sm text-red-600 dark:text-red-400">{error}</div>}
          {notice && <div className="text-sm text-[#1b5e20] dark:text-[#66bb6a]">{notice}</div>}

          <button
            type="button"
            onClick={submit}
            disabled={!hasSession || busy}
            className={`w-full py-3 rounded-xl font-bold transition-colors ${
              !hasSession || busy
                ? 'bg-gray-200 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                : 'bg-[#1b5e20] hover:bg-[#16381a] text-white'
            }`}
          >
            {busy ? 'Mise à jour…' : 'Mettre à jour le mot de passe'}
          </button>

          <a href="/connexion" className="text-center text-sm font-semibold text-[#1b5e20] hover:text-[#16381a]">
            Retour à la connexion
          </a>
        </div>
      </div>
    </div>
  )
}
