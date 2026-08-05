import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase, supabaseConfig } from '../config/supabase'
import { localSync, isLocalSyncEnabled } from '../utils/localSyncClient'
import mangooLogoUrl from '../assets/mangoo-logo.svg'

function normalizePhone(value) {
  return String(value || '').replace(/[^\d+]/g, '').replace(/(?!^)\+/g, '').trim()
}

function phoneDigits(value) {
  return normalizePhone(value).replace(/\D/g, '')
}

function canonicalPhoneDigits(value) {
  const digits = phoneDigits(value)
  if (digits.length >= 9) return digits.slice(-9)
  if (digits.length >= 8) return digits.slice(-8)
  return digits
}

function hiddenEmailFromPhone(value) {
  const digits = canonicalPhoneDigits(value)
  if (!digits) return ''
  return `prestataire-${digits}@localplus.mangoo.tech`
}

function hiddenEmailFromPhoneRaw(value) {
  const digits = phoneDigits(value)
  if (!digits) return ''
  return `prestataire-${digits}@localplus.mangoo.tech`
}

function speakFR(text) {
  try {
    if (!('speechSynthesis' in window)) return
    const utter = new SpeechSynthesisUtterance(String(text || ''))
    utter.lang = 'fr-FR'
    utter.rate = 0.96
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utter)
  } catch {
  }
}

function isAbortError(error) {
  return String(error?.name || '').trim() === 'AbortError'
}

function isLocalLanHost() {
  try {
    const host = String(window.location.hostname || '').trim().toLowerCase()
    return host === 'localhost' || host === '127.0.0.1' || host.startsWith('192.168.') || host.startsWith('10.') || host.startsWith('172.')
  } catch {
    return false
  }
}

const mobileInputClassName = 'mt-1 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-lg font-semibold text-gray-900 shadow-sm outline-none appearance-none focus:border-[#cfe0c8] focus:ring-2 focus:ring-[#1b5e20]/30 placeholder:text-gray-400'
const mobileInputStyle = {
  colorScheme: 'light',
  WebkitAppearance: 'none',
  WebkitTextFillColor: '#111827',
}

export default function ProviderPhoneAccess() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [phone, setPhone] = useState(() => String(searchParams.get('phone') || '').trim())
  const [secret, setSecret] = useState('')
  const [step, setStep] = useState('phone')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [resolved, setResolved] = useState(null)

  const returnTo = String(searchParams.get('return') || '').trim()
  const defaultReturn = '/mangoo-local.html'

  const buildDashboardUrl = useCallback((opts) => {
    const ret = String(returnTo || defaultReturn).trim() || defaultReturn
    const params = new URLSearchParams()
    params.set('return', ret)
    const vendorId = String(opts?.vendorId || '').trim()
    if (vendorId) params.set('vendorId', vendorId)
    return `/provider/dashboard?${params.toString()}`
  }, [returnTo])

  const buildLocalVendorUrl = useCallback((opts) => {
    const fallback = '/mangoo-local.html'
    const rawTarget = String(returnTo || defaultReturn || fallback).trim() || fallback
    const looksHtml = rawTarget.includes('.html') || rawTarget.startsWith('/mangoo-local') || rawTarget.startsWith('http')
    const target = looksHtml ? rawTarget : fallback
    try {
      const url = new URL(target, window.location.origin)
      const vendorId = String(opts?.vendorId || '').trim()
      const pin = String(opts?.pin || '').trim()
      if (vendorId) url.searchParams.set('vendor', vendorId)
      if (pin) url.searchParams.set('pin', pin)
      return `${url.pathname}${url.search}${url.hash}`
    } catch {
      return fallback
    }
  }, [defaultReturn, returnTo])

  useEffect(() => {
    speakFR("Entrez votre numéro de téléphone pour ouvrir votre espace prestataire.")
    return () => {
      try { window.speechSynthesis.cancel() } catch {}
    }
  }, [])

  const normalizedPhone = useMemo(() => normalizePhone(phone), [phone])
  const digits = useMemo(() => canonicalPhoneDigits(phone), [phone])
  const allowLocalFallback = useMemo(() => {
    return isLocalSyncEnabled() || isLocalLanHost() || !supabaseConfig?.hasUrl || !supabaseConfig?.hasAnonKey
  }, [])

  const postLocalAccess = useCallback(async (path, body) => {
    const controller = new AbortController()
    const timer = window.setTimeout(() => controller.abort(), 10000)
    try {
      const res = await fetch(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body || {}),
        cache: 'no-store',
        signal: controller.signal,
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || data?.success === false) {
        return {
          ok: false,
          networkError: true,
          data,
          message: String(data?.error || 'Connexion impossible'),
        }
      }
      return { ok: true, networkError: false, data }
    } catch (error) {
      return {
        ok: false,
        networkError: true,
        data: null,
        message: isAbortError(error)
          ? 'Connexion trop lente. Réessayez.'
          : 'Connexion impossible. Vérifiez le réseau puis réessayez.',
      }
    } finally {
      window.clearTimeout(timer)
    }
  }, [])

  const persistPrestataireUser = useCallback((payload) => {
    try {
      const email = String(payload?.email || '').trim().toLowerCase()
      const role = String(payload?.role || 'prestataire').trim().toLowerCase() === 'vendor' ? 'vendor' : 'prestataire'
      const name = String(payload?.name || '').trim() || (role === 'vendor' ? 'Boutique' : 'Prestataire')
      const nextUser = {
        id: payload?.id || email || `prestataire-${Date.now()}`,
        email,
        phone: normalizedPhone,
        name,
        role,
        roles: role === 'vendor' ? ['vendor', 'client'] : ['prestataire', 'client'],
        avatar: role === 'vendor' ? '🏪' : '🧰'
      }
      localStorage.setItem('mangoo-current-user', JSON.stringify(nextUser))
      if (email) localStorage.setItem(`mangoo-active-role:${email}`, role)
    } catch {
    }
  }, [normalizedPhone])

  const goNext = useCallback((url) => {
    const target = String(url || '').trim()
    if (!target) {
      navigate('/provider/dashboard')
      return
    }
    if (target.startsWith('/mangoo-local.html') || target.includes('.html')) {
      window.location.href = target
      return
    }
    navigate(target)
  }, [navigate])

  const persistLocalModeUser = useCallback((payload) => {
    try {
      const email = String(payload?.email || '').trim().toLowerCase()
      const role = String(payload?.role || 'prestataire').trim().toLowerCase() === 'vendor' ? 'vendor' : 'prestataire'
      const name = String(payload?.name || (role === 'vendor' ? 'Boutique' : 'Prestataire')).trim()
      const localUser = {
        id: payload?.id || `local-user-${Date.now()}`,
        email,
        role,
        full_name: name,
        app_metadata: { provider: 'local' },
        user_metadata: {
          role,
          full_name: name,
          phone: normalizedPhone,
        },
        aud: 'authenticated',
        created_at: new Date().toISOString()
      }
      localStorage.setItem('local_mode', 'true')
      localStorage.setItem('local_user', JSON.stringify(localUser))
    } catch {
    }
  }, [normalizedPhone])

  const syncResolvedProviderOwner = useCallback(async ({ ownerEmail, secretUsed, userId, providerId, provider, kind }) => {
    try {
      const vendorId = String(providerId || provider?.id || resolved?.provider?.id || '').trim()
      if (!vendorId) return
      const source = provider && typeof provider === 'object' ? provider : (resolved?.provider || {})
      const vendorKind = String(kind || source?.kind || '').trim().toLowerCase() === 'shop' ? 'shop' : 'provider'
      const lat = Number(source?.lat)
      const lng = Number(source?.lng)
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return
      const { data: sessionData } = await supabase.auth.getSession()
      const accessToken = String(sessionData?.session?.access_token || '').trim()
      await fetch('/api/local-sync/localplus/vendors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({
          ownerEmail: String(ownerEmail || '').trim().toLowerCase(),
          vendor: {
            id: vendorId,
            kind: vendorKind,
            approvalStatus: 'approved',
            name: String(source?.name || '').trim() || (vendorKind === 'shop' ? 'Boutique' : 'Prestataire'),
            category: String(source?.category || '').trim() || 'general',
            lat,
            lng,
            status: String(source?.status || 'open').trim() || 'open',
            live: Boolean(source?.live),
            voicePitch: String(source?.voicePitch || '').trim(),
            voiceAudio: source?.voiceAudio || null,
            avatar: String(source?.avatar || '').trim(),
            trade: String(source?.trade || '').trim(),
            phone: String(source?.phone || '').trim() || normalizedPhone,
            city: String(source?.city || '').trim(),
            country: String(source?.country || '').trim(),
            isMobile: Boolean(source?.isMobile ?? source?.is_mobile),
            localPin: String(secretUsed || '').trim(),
            services: Array.isArray(source?.services) ? source.services : [],
            coverage: Array.isArray(source?.coverage) ? source.coverage : [],
            portfolio: Array.isArray(source?.portfolio) ? source.portfolio : [],
            shopSlug: String(source?.shopSlug || '').trim(),
            userId: String(userId || '').trim(),
          },
        }),
      }).catch(() => null)
    } catch {
    }
  }, [normalizedPhone, resolved?.provider])

  const trySupabaseSignInOrBootstrap = useCallback(async ({ email, password, displayName }) => {
    const ownerEmail = String(email || '').trim().toLowerCase()
    if (!ownerEmail || !password) throw new Error('INVALID')
    const attemptLogin = async () => {
      const { data, error } = await supabase.auth.signInWithPassword({ email: ownerEmail, password })
      if (error) throw error
      return data
    }
    try {
      return await attemptLogin()
    } catch (e) {
      const msg = String(e?.message || '').toLowerCase()
      const invalidCreds =
        msg.includes('invalid login credentials') ||
        msg.includes('invalid credentials') ||
        msg.includes('invalid')
      if (!invalidCreds) throw e
      const { error: signUpError } = await supabase.auth.signUp({
        email: ownerEmail,
        password,
        options: {
          data: {
            full_name: String(displayName || 'Prestataire').trim() || 'Prestataire',
            name: String(displayName || 'Prestataire').trim() || 'Prestataire',
            phone: normalizedPhone,
            user_type: 'prestataire',
            localplus_phone_first: true,
          }
        }
      })
      if (signUpError) {
        const m = String(signUpError?.message || '').toLowerCase()
        const alreadyExists = m.includes('already') || m.includes('exists') || m.includes('registered')
        if (!alreadyExists) throw signUpError
      }
      return await attemptLogin()
    }
  }, [normalizedPhone])

  const tryLocalSyncLoginOrBootstrap = useCallback(async ({ email, password, displayName }) => {
    const ownerEmail = String(email || '').trim().toLowerCase()
    if (!ownerEmail || !password) throw new Error('INVALID')
    try {
      return await localSync.login({ email: ownerEmail, password })
    } catch (loginError) {
      try {
        return await localSync.register({
          email: ownerEmail,
          password,
          name: String(displayName || 'Prestataire').trim() || 'Prestataire',
        })
      } catch (registerError) {
        const registerMsg = String(registerError?.message || '').toLowerCase()
        const alreadyExists = registerMsg.includes('already') || registerMsg.includes('exists') || registerMsg.includes('registered')
        if (alreadyExists) {
          return await localSync.login({ email: ownerEmail, password })
        }
        throw loginError || registerError
      }
    }
  }, [])

  const lookupPhone = useCallback(async () => {
    if (!digits || digits.length < 8) {
      setError('Entrez un numéro valide.')
      return
    }
    setError('')
    setInfo('')
    try {
      setLoading(true)
      const result = await postLocalAccess('/api/local-sync/localplus/provider-access', { phone: normalizedPhone })
      if (result.networkError) {
        setError(result.message)
        speakFR(result.message)
        return
      }
      const data = result.data
      setResolved({ ownerEmail: hiddenEmailFromPhone(normalizedPhone), provider: null })
      setStep('secret')
      setInfo('Entrez votre code secret.')
      speakFR('Entrez votre code secret.')
      if (data?.found && data?.ownerEmail) {
        setResolved({
          ownerEmail: String(data.ownerEmail || '').trim().toLowerCase(),
          provider: data.provider || null,
        })
        setInfo('Numéro reconnu. Entrez votre code secret.')
      }
    } finally {
      setLoading(false)
    }
  }, [digits, normalizedPhone, postLocalAccess])

  const checkPhoneExists = useCallback(async () => {
    const result = await postLocalAccess('/api/local-sync/localplus/provider-access', { phone: normalizedPhone })
    if (result.networkError) {
      return {
        found: false,
        ownerEmail: '',
        provider: null,
        networkError: true,
        message: result.message,
      }
    }
    const data = result.data
    if (data?.found && data?.ownerEmail) {
      return {
        found: true,
        ownerEmail: String(data.ownerEmail || '').trim().toLowerCase(),
        provider: data.provider || null,
        networkError: false,
        message: '',
      }
    }
    if (data?.found) {
      return {
        found: true,
        ownerEmail: hiddenEmailFromPhone(normalizedPhone),
        provider: data.provider || null,
        networkError: false,
        message: '',
      }
    }
    return { found: false, ownerEmail: '', provider: null, networkError: false, message: '' }
  }, [normalizedPhone, postLocalAccess])

  const verifyPinAgainstProvider = useCallback(async () => {
    const result = await postLocalAccess('/api/local-sync/localplus/provider-verify-pin', { phone: normalizedPhone, pin: secret })
    if (result.networkError) {
      return {
        found: false,
        verified: false,
        providerId: '',
        ownerEmail: '',
        provider: null,
        networkError: true,
        message: result.message,
      }
    }
    const data = result.data
    return {
      found: !!data?.found,
      verified: !!data?.verified,
      providerId: String(data?.providerId || '').trim(),
      ownerEmail: String(data?.ownerEmail || '').trim().toLowerCase(),
      provider: data?.provider && typeof data.provider === 'object' ? data.provider : null,
      networkError: false,
      message: '',
    }
  }, [normalizedPhone, postLocalAccess, secret])

  const signInExisting = useCallback(async () => {
    const primaryEmail = String(resolved?.ownerEmail || '').trim().toLowerCase()
    const canonicalEmail = hiddenEmailFromPhone(normalizedPhone)
    const rawEmail = hiddenEmailFromPhoneRaw(normalizedPhone)
    const defaultCandidates = Array.from(new Set([primaryEmail, canonicalEmail, rawEmail].filter(Boolean)))
    if (!defaultCandidates.length || !secret) {
      setError('Entrez votre code secret.')
      return
    }
    setLoading(true)
    setError('')
    setInfo('')
    // Detruire toute session Supabase anterieure (evite conflit de provider)
    try { await supabase.auth.signOut() } catch(e) {}
    try {
      const probe = await checkPhoneExists()
      if (probe?.networkError) {
        setError(probe.message || 'Connexion impossible. Vérifiez le réseau puis réessayez.')
        return
      }
      if (!probe?.found) {
        setStep('create')
        setResolved({ ownerEmail: canonicalEmail || rawEmail || defaultCandidates[0] || '', provider: null })
        setInfo('Aucun espace trouvé. Créez maintenant votre accès avec un code secret.')
        speakFR('Aucun espace trouvé. Créez maintenant votre accès avec un code secret.')
        return
      }

      let verifiedProviderId = ''
      let forcedEmail = ''
      let verifiedProvider = null
      let verifiedKind = ''
      const pinCheck = await verifyPinAgainstProvider()
      if (pinCheck?.networkError) {
        setError(pinCheck.message || 'Connexion impossible. Vérifiez le réseau puis réessayez.')
        return
      }
      if (!pinCheck?.verified) {
        setResolved({ ownerEmail: probe.ownerEmail, provider: probe.provider })
        setError('Code secret incorrect. Réessayez.')
        return
      }
      verifiedProviderId = String(pinCheck?.providerId || '').trim()
      forcedEmail = String(pinCheck?.ownerEmail || '').trim().toLowerCase()
      verifiedProvider = pinCheck?.provider && typeof pinCheck.provider === 'object' ? pinCheck.provider : null
      verifiedKind = String(pinCheck?.vendorKind || pinCheck?.provider?.kind || '').trim().toLowerCase()

      if (verifiedKind === 'shop' && verifiedProviderId) {
        const shopEmail = String(forcedEmail || probe.ownerEmail || '').trim().toLowerCase()
        const shopName = String(verifiedProvider?.name || resolved?.provider?.name || probe?.provider?.name || 'Boutique').trim() || 'Boutique'
        persistPrestataireUser({ id: verifiedProviderId, email: shopEmail, name: shopName, role: 'vendor' })
        persistLocalModeUser({ id: verifiedProviderId, email: shopEmail, name: shopName, role: 'vendor' })
        // Forcer le bon provider ID + nettoyer les vieilles donnees
        try { localStorage.setItem('mangoo_my_provider_id', String(verifiedProviderId || '')) } catch(e) {}
        try { localStorage.removeItem('mangoo_provider_services'); } catch(e) {}
        try { localStorage.removeItem('mangoo_provider_services_vendor'); } catch(e) {}
        try { localStorage.removeItem('mangoo_my_products'); } catch(e) {}
        try { localStorage.removeItem('mangoo_my_products_vendor'); } catch(e) {}
        try {
          localStorage.setItem('mangoo_my_shop_id', verifiedProviderId)
          if (shopEmail) {
            const key = `mangoo_my_shop_ids:${shopEmail}`
            const raw = localStorage.getItem(key)
            const parsed = raw ? JSON.parse(raw) : []
            const list = Array.isArray(parsed) ? parsed : []
            if (!list.some((x) => String(x) === String(verifiedProviderId))) {
              list.push(verifiedProviderId)
              localStorage.setItem(key, JSON.stringify(list))
            }
          }
          localStorage.setItem('mangoo-open-vendor-id', verifiedProviderId)
        } catch {
        }
        window.location.href = buildLocalVendorUrl({ vendorId: verifiedProviderId, pin: secret })
        return
      }

      const candidates = Array.from(new Set([forcedEmail, ...defaultCandidates].filter(Boolean)))
      let userId = ''
      let ownerEmailUsed = ''
      let fullName = String(verifiedProvider?.name || resolved?.provider?.name || probe?.provider?.name || 'Prestataire')
      let usedLocalSync = false

      let lastError = null
      for (const candidate of candidates) {
        try {
          const login = await trySupabaseSignInOrBootstrap({
            email: candidate,
            password: secret,
            displayName: String(verifiedProvider?.name || resolved?.provider?.name || probe?.provider?.name || `Prestataire ${digits}`),
          })
          userId = String(login?.user?.id || '').trim()
          fullName = String(login?.user?.user_metadata?.full_name || verifiedProvider?.name || resolved?.provider?.name || probe?.provider?.name || 'Prestataire').trim()
          ownerEmailUsed = candidate
          try {
            localStorage.removeItem('local_mode')
            localStorage.removeItem('local_user')
          } catch {
          }
          lastError = null
          break
        } catch (e) {
          lastError = e
        }
      }

      if (!userId && allowLocalFallback) {
        for (const candidate of candidates) {
          try {
            const auth = await tryLocalSyncLoginOrBootstrap({
              email: candidate,
              password: secret,
              displayName: String(verifiedProvider?.name || resolved?.provider?.name || probe?.provider?.name || `Prestataire ${digits}`),
            })
            userId = String(auth?.user?.id || '').trim()
            fullName = String(auth?.user?.name || verifiedProvider?.name || resolved?.provider?.name || probe?.provider?.name || 'Prestataire').trim()
            ownerEmailUsed = candidate
            usedLocalSync = true
            lastError = null
            break
          } catch (e) {
            lastError = e
          }
        }
      }

      if (!userId) {
        setResolved({ ownerEmail: forcedEmail || probe.ownerEmail, provider: verifiedProvider || probe.provider })
        throw lastError || new Error('CODE_INCORRECT')
      }

      persistPrestataireUser({ id: userId, email: ownerEmailUsed || candidates[0], name: fullName, role: 'prestataire' })
      if (usedLocalSync) persistLocalModeUser({ id: userId, email: ownerEmailUsed || candidates[0], name: fullName, role: 'prestataire' })
      // Forcer le bon provider ID pour eviter les conflits de doublons
      try { localStorage.setItem('mangoo_my_provider_id', String(verifiedProviderId || '')) } catch(e) {}
      // Nettoyer les donnees d'autres providers (evite contamination croisee)
      try { localStorage.removeItem('mangoo_provider_services'); } catch(e) {}
      try { localStorage.removeItem('mangoo_provider_services_vendor'); } catch(e) {}
      try { localStorage.removeItem('mangoo_my_products'); } catch(e) {}
      try { localStorage.removeItem('mangoo_my_products_vendor'); } catch(e) {}
      await syncResolvedProviderOwner({
        ownerEmail: ownerEmailUsed || candidates[0],
        secretUsed: secret,
        userId,
        providerId: verifiedProviderId || resolved?.provider?.id || '',
        provider: verifiedProvider || probe?.provider || resolved?.provider || null,
        kind: verifiedKind || 'service',
      })
      try {
        window.location.href = buildDashboardUrl({ vendorId: verifiedProviderId })
      } catch {
        navigate('/provider/dashboard')
      }
    } catch (e) {
      const msg = String(e?.message || '')
      if (msg === 'CODE_INCORRECT') setError('Code secret incorrect. Réessayez.')
      else setError('Code secret incorrect. Réessayez.')
    } finally {
      setLoading(false)
    }
  }, [allowLocalFallback, buildDashboardUrl, buildLocalVendorUrl, checkPhoneExists, digits, navigate, normalizedPhone, persistLocalModeUser, persistPrestataireUser, resolved?.ownerEmail, resolved?.provider, secret, syncResolvedProviderOwner, tryLocalSyncLoginOrBootstrap, trySupabaseSignInOrBootstrap, verifyPinAgainstProvider])

  const createAccess = useCallback(async () => {
    const ownerEmail = hiddenEmailFromPhone(normalizedPhone)
    if (!ownerEmail) {
      setError('Entrez un numéro valide.')
      return
    }
    if (!secret || String(secret).trim().length < 4) {
      setError('Choisissez un code secret de 4 caractères minimum.')
      return
    }
    setLoading(true)
    setError('')
    setInfo('')
    try {
      const displayName = `Prestataire ${digits.slice(-4)}`
      let userId = ''
      let usedLocalSync = false
      try {
        const { error } = await supabase.auth.signUp({
          email: ownerEmail,
          password: secret,
          options: {
            data: {
              full_name: displayName,
              name: displayName,
              phone: normalizedPhone,
              user_type: 'prestataire',
              localplus_phone_first: true,
            }
          }
        })
        if (error) {
          const msg = String(error.message || '').toLowerCase()
          const alreadyExists = msg.includes('already') || msg.includes('exists') || msg.includes('registered')
          if (!alreadyExists) throw error
        }
        const login = await supabase.auth.signInWithPassword({ email: ownerEmail, password: secret })
        if (login.error) throw login.error
        userId = String(login.data?.user?.id || '').trim()
        try {
          localStorage.removeItem('local_mode')
          localStorage.removeItem('local_user')
        } catch {
        }
      } catch (supabaseError) {
      if (allowLocalFallback) {
          try {
            const reg = await localSync.register({ email: ownerEmail, password: secret, name: displayName })
            userId = String(reg?.user?.id || '').trim()
          } catch {
            const auth = await localSync.login({ email: ownerEmail, password: secret })
            userId = String(auth?.user?.id || '').trim()
          }
          usedLocalSync = true
        } else {
          throw supabaseError
        }
      }
      persistPrestataireUser({ id: userId, email: ownerEmail, name: displayName })
      if (usedLocalSync) persistLocalModeUser({ id: userId, email: ownerEmail, name: displayName })
      const next = new URLSearchParams()
      next.set('phone', normalizedPhone)
      next.set('secret', String(secret || '').trim())
      if (returnTo) next.set('return', returnTo)
      goNext(`/provider/apply?${next.toString()}`)
    } catch (e) {
      setError(String(e?.message || 'Création de l’accès impossible'))
    } finally {
      setLoading(false)
    }
  }, [allowLocalFallback, digits, goNext, normalizedPhone, persistLocalModeUser, persistPrestataireUser, returnTo, secret])

  const onPrimary = useCallback(async () => {
    if (step === 'phone') {
      await lookupPhone()
      return
    }
    if (step === 'secret') {
      await signInExisting()
      return
    }
    await createAccess()
  }, [createAccess, lookupPhone, signInExisting, step])

  const primaryLabel = step === 'phone'
    ? 'Continuer'
    : step === 'secret'
      ? 'Entrer'
      : 'Créer mon accès'

  return (
    <div className="min-h-dvh bg-[#f6faf3] text-gray-900">
      <div className="max-w-md mx-auto p-4 sm:p-6">
        <div className="rounded-[28px] border border-[#cfe0c8] bg-white shadow-sm p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <img src={mangooLogoUrl} alt="Mangoo Tech" className="w-11 h-11 shrink-0" />
            <div className="min-w-0">
              <div className="text-2xl font-black leading-tight">Mon espace</div>
              <div className="text-sm text-gray-600">Connexion simple par téléphone</div>
            </div>
          </div>

          <div className="mt-5 rounded-2xl bg-[#eef6ea] border border-[#cfe0c8] px-4 py-3 text-sm font-semibold text-gray-700">
            Entrez votre numéro de téléphone.
          </div>

          {error ? (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {error}
            </div>
          ) : null}

          {info ? (
            <div className="mt-4 rounded-2xl border border-[#cfe0c8] bg-[#eef6ea] px-4 py-3 text-sm font-semibold text-[#1b5e20]">
              {info}
            </div>
          ) : null}

          <div className="mt-4 space-y-3">
            <div>
              <div className="text-sm font-black text-gray-700">Téléphone</div>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                inputMode="tel"
                autoFocus
                className={mobileInputClassName}
                style={mobileInputStyle}
                placeholder="Ex: +226 70 00 00 00"
                autoComplete="tel"
              />
            </div>

            {step !== 'phone' ? (
              <div>
                <div className="text-sm font-black text-gray-700">Code secret</div>
                <input
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
                  type="password"
                  inputMode="numeric"
                  className={mobileInputClassName}
                  style={mobileInputStyle}
                  placeholder="4 chiffres ou plus"
                  autoComplete="current-password"
                />
              </div>
            ) : null}
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={onPrimary}
            className="mt-5 w-full rounded-2xl bg-[#1b5e20] px-4 py-4 text-lg font-black text-white shadow-sm disabled:opacity-60"
          >
            {loading ? 'Patientez…' : primaryLabel}
          </button>

          <button
            type="button"
            onClick={() => goNext(returnTo || '/mangoo-local.html?v=166')}
            className="mt-3 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-base font-black text-gray-800"
          >
            Retour
          </button>
        </div>
      </div>
    </div>
  )
}
