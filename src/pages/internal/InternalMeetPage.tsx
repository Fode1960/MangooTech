import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import { LiveKitRoom, RoomAudioRenderer, VideoConference } from '@livekit/components-react'
import '@livekit/components-styles'
import { supabase } from '../../config/supabase'
import { io, type Socket } from 'socket.io-client'
import { Paperclip, Send, X } from 'lucide-react'
import { Room } from 'livekit-client'
import mangooLogo from '../../assets/mangoo-logo.svg'

type MeetMessage = {
  id: string
  meetingId: string
  at: number
  fromUserId: string
  fromUserName: string
  text?: string
  attachmentUrl?: string
  attachmentName?: string
  attachmentMime?: string
}

export default function InternalMeetPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const enabled = useMemo(() => {
    const v = String((import.meta as any).env?.VITE_INTERNAL_MEET || '').trim()
    return Boolean((import.meta as any).env?.DEV) || v === '1'
  }, [])
  const initialMeetingId = useMemo(() => String(searchParams.get('id') || '').trim(), [searchParams])
  const [meetingId, setMeetingId] = useState(initialMeetingId || '')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [lkUrl, setLkUrl] = useState('')
  const [lkToken, setLkToken] = useState('')
  const [chatOnly, setChatOnly] = useState(false)
  const lkRoom = useMemo(() => new Room(), [])
  const [micEnabled, setMicEnabled] = useState(false)
  const [camEnabled, setCamEnabled] = useState(false)

  const [chatOpen, setChatOpen] = useState(true)
  const [chatText, setChatText] = useState('')
  const [messages, setMessages] = useState<MeetMessage[]>([])
  const socketRef = useRef<Socket | null>(null)
  const [uploadBusy, setUploadBusy] = useState(false)

  useEffect(() => {
    if (!initialMeetingId) return
    setMeetingId(initialMeetingId)
  }, [initialMeetingId])

  useEffect(() => {
    const id = String(meetingId || '').trim()
    const sp = new URLSearchParams(String(window.location.search || ''))
    if (id) sp.set('id', id)
    else sp.delete('id')
    setSearchParams(sp, { replace: true })
  }, [meetingId, setSearchParams])

  const join = async () => {
    const id = String(meetingId || '').trim()
    if (!id) return
    setBusy(true)
    setError('')
    try {
      const statusRes = await fetch('/api/internal/meet/status', { method: 'GET' })
      const statusJson = statusRes ? await statusRes.json().catch(() => null) : null
      const livekitConfigured = Boolean(statusJson?.livekitConfigured)
      if (!livekitConfigured) {
        setChatOnly(true)
        setChatOpen(true)
        setLkUrl('')
        setLkToken('')
        return
      }

      const { data } = await supabase.auth.getSession()
      const token = data?.session?.access_token ? String(data.session.access_token) : ''
      const emailTrim = String(email || '').trim()
      const useAuth = Boolean(token) && !emailTrim
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (useAuth) headers.Authorization = `Bearer ${token}`

      const url = useAuth ? '/api/internal/meet/token' : `/api/internal/meet/token?email=${encodeURIComponent(emailTrim)}`
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({ meetingId: id, name: String(name || '').trim() || undefined }),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok || !json?.success) {
        const err = String(json?.error || 'failed')
        if (err.toLowerCase() === 'forbidden') throw new Error('Email non autorisé (allowlist)')
        throw new Error(err)
      }
      setLkUrl(String(json.livekitUrl || '').trim())
      setLkToken(String(json.token || '').trim())
      setChatOnly(false)
      setChatOpen(true)
    } catch (e: any) {
      setError(String(e?.message || 'Erreur'))
    } finally {
      setBusy(false)
    }
  }

  const leave = () => {
    try {
      socketRef.current?.disconnect()
    } catch {
    }
    socketRef.current = null
    try {
      lkRoom.disconnect()
    } catch {
    }
    setMessages([])
    setLkToken('')
    setLkUrl('')
    setChatOnly(false)
    setChatText('')
    setMicEnabled(false)
    setCamEnabled(false)
  }

  const avAvailable = !chatOnly && Boolean(lkToken && lkUrl)
  const audioVideoDisabledReason = chatOnly ? 'Audio/vidéo indisponibles (LiveKit non configuré)' : avAvailable ? '' : 'Connexion en cours…'

  const toggleMic = async () => {
    if (!avAvailable) return
    try {
      const current = Boolean((lkRoom as any)?.localParticipant?.isMicrophoneEnabled)
      const next = !current
      await (lkRoom as any)?.localParticipant?.setMicrophoneEnabled(next)
      setMicEnabled(next)
    } catch (e: any) {
      setError(String(e?.message || 'Erreur micro'))
    }
  }

  const toggleCam = async () => {
    if (!avAvailable) return
    try {
      const current = Boolean((lkRoom as any)?.localParticipant?.isCameraEnabled)
      const next = !current
      await (lkRoom as any)?.localParticipant?.setCameraEnabled(next)
      setCamEnabled(next)
    } catch (e: any) {
      setError(String(e?.message || 'Erreur caméra'))
    }
  }

  useEffect(() => {
    if (chatOnly || !lkToken || !lkUrl) {
      try {
        lkRoom.disconnect()
      } catch {
      }
      setMicEnabled(false)
      setCamEnabled(false)
    }
  }, [chatOnly, lkToken, lkUrl, lkRoom])

  useEffect(() => {
    const canConnectChat = chatOnly || (lkToken && lkUrl)
    if (!canConnectChat) return
    const sid = `${Math.random().toString(16).slice(2)}`
    const s = io('/internal-meet', { transports: ['websocket', 'polling'] })
    socketRef.current = s

    const onState = (payload: any) => {
      const list = Array.isArray(payload?.messages) ? payload.messages : []
      setMessages(list as MeetMessage[])
    }
    const onChat = (msg: any) => {
      setMessages((prev) => [...prev, msg as MeetMessage].slice(-500))
    }

    s.on('internal-meet:state', onState)
    s.on('internal-meet:chat', onChat)

    s.emit('internal-meet:join', {
      meetingId: String(meetingId || '').trim(),
      userId: sid,
      userName: String(name || '').trim() || (email ? String(email || '').trim() : 'Membre'),
    })

    return () => {
      try {
        s.off('internal-meet:state', onState)
        s.off('internal-meet:chat', onChat)
        s.disconnect()
      } catch {
      }
      if (socketRef.current === s) socketRef.current = null
    }
  }, [chatOnly, email, lkToken, lkUrl, meetingId, name])

  const sendChat = () => {
    const s = socketRef.current
    if (!s) return
    const text = String(chatText || '').trim()
    if (!text) return
    s.emit('internal-meet:chat', { meetingId: String(meetingId || '').trim(), text })
    setChatText('')
  }

  const uploadAttachment = async (file: File) => {
    const id = String(meetingId || '').trim()
    if (!id) return
    setUploadBusy(true)
    setError('')
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const r = new FileReader()
        r.onerror = () => reject(new Error('Lecture fichier impossible'))
        r.onload = () => resolve(String(r.result || ''))
        r.readAsDataURL(file)
      })

      const { data } = await supabase.auth.getSession()
      const token = data?.session?.access_token ? String(data.session.access_token) : ''
      const emailTrim = String(email || '').trim()
      const useAuth = Boolean(token) && !emailTrim
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (useAuth) headers.Authorization = `Bearer ${token}`

      const url = useAuth ? '/api/internal/meet/upload' : `/api/internal/meet/upload?email=${encodeURIComponent(emailTrim)}`
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          meetingId: id,
          filename: file.name,
          dataUrl,
        }),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok || !json?.success) throw new Error(String(json?.error || 'Upload failed'))

      const att = json?.attachment
      const attachmentUrl = String(att?.url || '').trim()
      if (!attachmentUrl) return

      socketRef.current?.emit('internal-meet:chat', {
        meetingId: id,
        attachmentUrl,
        attachmentName: String(att?.filename || file.name || '').trim(),
        attachmentMime: String(att?.mime || file.type || '').trim(),
      })
    } catch (e: any) {
      setError(String(e?.message || 'Erreur upload'))
    } finally {
      setUploadBusy(false)
    }
  }

  if (!enabled) return <Navigate to="/" replace />

  const isInRoom = Boolean(chatOnly || (lkToken && lkUrl))

  return (
    <div className="h-dvh overflow-hidden bg-gradient-to-br from-orange-50 via-white to-green-50 text-gray-900">
      <div className="h-full flex flex-col">
        <div className="px-4 py-3 border-b border-black/10 bg-white/70 backdrop-blur flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <img src={mangooLogo} alt="Mangoo Tech" className="w-7 h-7 rounded-full" />
              <div className="min-w-0">
                <div className="font-black truncate">Mangoo Tech — Réunion interne</div>
                <div className="text-xs text-gray-600 truncate">
                  {isInRoom ? `Meeting: ${String(meetingId || '').trim()}` : 'Rejoindre une réunion'}
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={!avAvailable}
              onClick={() => void toggleMic()}
              title={audioVideoDisabledReason || (micEnabled ? 'Couper le micro' : 'Activer le micro')}
              className={`px-3 py-2 rounded-xl font-black text-sm border ${
                !avAvailable
                  ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                  : micEnabled
                    ? 'bg-gradient-to-r from-orange-500 to-green-600 text-white border-transparent'
                    : 'bg-white hover:bg-gray-50 border-gray-200'
              }`}
            >
              Audio
            </button>
            <button
              type="button"
              disabled={!avAvailable}
              onClick={() => void toggleCam()}
              title={audioVideoDisabledReason || (camEnabled ? 'Couper la caméra' : 'Activer la caméra')}
              className={`px-3 py-2 rounded-xl font-black text-sm border ${
                !avAvailable
                  ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                  : camEnabled
                    ? 'bg-gradient-to-r from-orange-500 to-green-600 text-white border-transparent'
                    : 'bg-white hover:bg-gray-50 border-gray-200'
              }`}
            >
              Vidéo
            </button>
            {isInRoom && (
              <button
                type="button"
                onClick={leave}
                className="bg-white hover:bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl font-black text-sm"
              >
                Quitter
              </button>
            )}
            <button
              type="button"
              onClick={() => setChatOpen((v) => !v)}
              className="bg-gradient-to-r from-orange-500 to-green-600 hover:from-orange-600 hover:to-green-700 text-white px-3 py-2 rounded-xl font-black text-sm"
            >
              Chat
            </button>
          </div>
        </div>

        {!isInRoom && (
          <div className="flex-1 overflow-auto p-4 flex items-center justify-center">
            <div className="w-full max-w-lg bg-white/80 border border-black/10 rounded-2xl p-5 shadow-lg">
              <div className="font-black text-xl">Rejoindre</div>
              <div className="mt-4 grid grid-cols-1 gap-3">
                <input
                  value={meetingId}
                  onChange={(e) => setMeetingId(e.target.value)}
                  placeholder="Meeting ID (ex: mangoo-tech)"
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-gray-300"
                />
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nom (optionnel)"
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-gray-300"
                />
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email (si pas connecté)"
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-gray-300"
                />
                <div className="text-xs text-gray-600">
                  Si LiveKit n’est pas configuré, la réunion s’ouvrira en mode “Chat uniquement” (audio/vidéo désactivés).
                </div>
                {error && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</div>}
                <button
                  type="button"
                  onClick={() => void join()}
                  disabled={busy || !String(meetingId || '').trim()}
                  className={`w-full px-4 py-3 rounded-xl font-black ${
                    busy || !String(meetingId || '').trim()
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-orange-500 to-green-600 hover:from-orange-600 hover:to-green-700 text-white'
                  }`}
                >
                  {busy ? 'Connexion…' : 'Rejoindre'}
                </button>
              </div>
            </div>
          </div>
        )}

        {isInRoom && (
          <div className="flex-1 min-h-0 flex">
            <div className={`min-h-0 flex-1 ${chatOpen ? 'hidden md:block' : ''}`}>
              {chatOnly ? (
                <div className="h-full flex items-center justify-center p-6">
                  <div className="max-w-md w-full bg-white/80 border border-black/10 rounded-2xl p-6 text-center shadow-lg">
                    <div className="font-black text-xl">Audio/vidéo indisponibles</div>
                    <div className="mt-3 text-sm text-gray-700">
                      LiveKit n’est pas encore configuré sur ce serveur. Vous pouvez utiliser le chat et les pièces jointes.
                    </div>
                  </div>
                </div>
              ) : (
                <LiveKitRoom
                  room={lkRoom as any}
                  token={lkToken}
                  serverUrl={lkUrl}
                  onConnected={() => {
                    try {
                      setMicEnabled(Boolean((lkRoom as any)?.localParticipant?.isMicrophoneEnabled))
                      setCamEnabled(Boolean((lkRoom as any)?.localParticipant?.isCameraEnabled))
                    } catch {
                    }
                  }}
                  onDisconnected={() => {
                    setMicEnabled(false)
                    setCamEnabled(false)
                  }}
                >
                  <RoomAudioRenderer />
                  <VideoConference />
                </LiveKitRoom>
              )}
            </div>

            {chatOpen && (
              <div className="w-full md:w-[420px] border-l border-black/10 bg-white/70 backdrop-blur flex flex-col min-h-0">
                <div className="p-3 flex items-center justify-between gap-2 border-b border-black/10">
                  <div className="font-black">Chat</div>
                  <button type="button" onClick={() => setChatOpen(false)} className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex-1 overflow-auto p-3 space-y-2">
                  {messages.map((m) => (
                    <div key={m.id} className="bg-white border border-gray-200 rounded-xl p-3">
                      <div className="text-xs text-gray-600 flex items-center justify-between gap-2">
                        <span className="font-semibold truncate">{m.fromUserName}</span>
                        <span className="shrink-0">{new Date(m.at).toLocaleTimeString()}</span>
                      </div>
                      {m.text && <div className="mt-2 text-sm whitespace-pre-wrap">{m.text}</div>}
                      {m.attachmentUrl && (
                        <a
                          className="mt-2 inline-flex items-center gap-2 text-sm font-semibold bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-xl"
                          href={m.attachmentUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <Paperclip className="w-4 h-4" />
                          <span className="truncate">{m.attachmentName || 'Pièce jointe'}</span>
                        </a>
                      )}
                    </div>
                  ))}
                </div>

                <div className="p-3 border-t border-white/10">
                  {error && <div className="mb-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</div>}
                  <div className="flex gap-2">
                    <label className={`px-3 py-2 rounded-xl font-black text-sm border border-gray-200 ${uploadBusy ? 'bg-gray-100 opacity-60' : 'bg-gray-100 hover:bg-gray-200'} cursor-pointer`}>
                      <input
                        type="file"
                        className="hidden"
                        disabled={uploadBusy}
                        onChange={(e) => {
                          const f = e.target.files?.[0]
                          e.target.value = ''
                          if (f) void uploadAttachment(f)
                        }}
                      />
                      <span className="inline-flex items-center gap-2">
                        <Paperclip className="w-4 h-4" />
                        {uploadBusy ? 'Upload…' : 'PJ'}
                      </span>
                    </label>
                    <input
                      value={chatText}
                      onChange={(e) => setChatText(e.target.value)}
                      placeholder="Message…"
                      className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-gray-300"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') sendChat()
                      }}
                    />
                    <button
                      type="button"
                      onClick={sendChat}
                      disabled={!String(chatText || '').trim()}
                      className={`px-3 py-2 rounded-xl font-black text-sm ${
                        !String(chatText || '').trim()
                          ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          : 'bg-gradient-to-r from-orange-500 to-green-600 hover:from-orange-600 hover:to-green-700 text-white'
                      }`}
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
