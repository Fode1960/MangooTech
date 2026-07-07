import React, { useEffect, useState } from 'react'
import { Link2 } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'

const fetchJson = async (url, init = {}) => {
  const res = await fetch(url, init)
  const json = await res.json().catch(() => null)
  return { res, json }
}

const withClientView = (redirect) => {
  const r = String(redirect || '').trim()
  if (!r) return r
  const hasQuery = r.includes('?')
  if (r.includes('view=client') || r.includes('view%3Dclient')) return r
  return `${r}${hasQuery ? '&' : '?'}view=client`
}

export default function ConnectPlusRedirect() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const t = String(token || '').trim()
        if (!t) {
          setError('Code invalide')
          return
        }
        const { res, json } = await fetchJson(`/api/connect-plus/resolve?token=${encodeURIComponent(t)}`, { method: 'GET' })
        if (!cancelled && res.ok && json?.success && json?.redirect) {
          navigate(withClientView(String(json.redirect)), { replace: true })
          return
        }
        if (!cancelled) setError('Code invalide')
      } catch {
        if (!cancelled) setError('Erreur réseau')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [navigate, token])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f6faf3] p-4">
      <div className="max-w-md w-full rounded-2xl border border-[#d7e4d1] bg-white p-6 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eef6ea] text-[#1b5e20]">
          <Link2 className="h-7 w-7" aria-hidden="true" />
        </div>
        <div className="mt-2 text-2xl font-black text-gray-900">Ouverture...</div>
        {error && <div className="mt-3 text-sm font-bold text-red-600">{error}</div>}
      </div>
    </div>
  )
}
