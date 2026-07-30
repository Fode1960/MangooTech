import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Camera, Clock, Hash, Maximize2, Minimize2, Phone, PhoneOff, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import mangooLogoUrl from '../assets/mangoo-logo.svg'
import { getWsUrl } from '../utils/realtimeUrls'

type Role = 'vendor' | 'client'
type UI = 'full' | 'simple' | 'ultra'
type CallMode = 'audio' | 'video'
type CallModeHint = CallMode | 'auto'

type CallHistoryEntry = {
  id: string
  at: number
  roomId: string
  peerRoomId: string
  peerLabel: string
  direction: 'outgoing' | 'incoming'
  status: 'dialing' | 'ringing' | 'connected' | 'ended' | 'missed' | 'rejected'
  startedAt?: number
  endedAt?: number
  durationSec?: number
}

type Props = {
  role: Role
  roomId: string
  userId: string
  ui?: UI
  callMode?: CallModeHint
  fromLabel?: string
  returnRoomId?: string
  returnUi?: UI
  returnUserId?: string
  returnFromLabel?: string
  forceOffline?: boolean
  videoFit?: 'cover' | 'contain'
  pipSize?: 'sm' | 'md' | 'lg' | 'xl'
  hangupSignal?: number
  startCallSignal?: number
  onIncomingCall?: (payload: { from: string; label: string }) => void
  onCallEnd?: () => void
}

const RINGTONE_DATA_URI =
  'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT'

function formatTimer(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds || 0))
  const mm = String(Math.floor(s / 60)).padStart(2, '0')
  const ss = String(s % 60).padStart(2, '0')
  return `${mm}:${ss}`
}

export default function WebRTCManagerConnectPlus({
  role,
  roomId,
  userId,
  ui = 'full',
  callMode = 'auto',
  fromLabel,
  returnRoomId,
  returnUi,
  returnUserId,
  returnFromLabel,
  forceOffline,
  videoFit = 'cover',
  pipSize = 'sm',
  hangupSignal,
  startCallSignal,
  onIncomingCall,
  onCallEnd,
}: Props) {
  const navigate = useNavigate()
  const [isConnected, setIsConnected] = useState(false)
  const [status, setStatus] = useState('Déconnecté')
  const [isCalling, setIsCalling] = useState(false)
  const [incomingCall, setIncomingCall] = useState(false)
  const [callFrom, setCallFrom] = useState('')
  const [callFromLabel, setCallFromLabel] = useState('')
  const [isInCall, setIsInCall] = useState(false)
  const [callStartedAt, setCallStartedAt] = useState<number | null>(null)
  const [callElapsedSeconds, setCallElapsedSeconds] = useState(0)
  const [onlineUsers, setOnlineUsers] = useState<Array<{ userId: string; role: string }>>([])
  const [rosterReady, setRosterReady] = useState(false)
  const [offlineHint, setOfflineHint] = useState(false)
  const [offlinePromptOpen, setOfflinePromptOpen] = useState(false)
  const [offlineMessageOpen, setOfflineMessageOpen] = useState(false)
  const [offlineNoAnswer, setOfflineNoAnswer] = useState(false)
  const [audioUnlocked, setAudioUnlocked] = useState(false)
  const [ringtoneBlocked, setRingtoneBlocked] = useState(false)
  const [callbackPreferred, setCallbackPreferred] = useState<'pstn' | 'connectplus'>('pstn')
  const [callbackPhone, setCallbackPhone] = useState('')
  const [callbackConnectPlusId, setCallbackConnectPlusId] = useState('')
  const [callbackName, setCallbackName] = useState('')
  const [callbackStatus, setCallbackStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [voiceStatus, setVoiceStatus] = useState<'idle' | 'recording' | 'ready' | 'sending' | 'sent' | 'error'>('idle')
  const [voiceDataUrl, setVoiceDataUrl] = useState<string | null>(null)
  const [vendorMessages, setVendorMessages] = useState<any[]>([])
  const [showVendorInbox, setShowVendorInbox] = useState(false)
  const [showVendorContacts, setShowVendorContacts] = useState(false)
  const [vendorInboxFilter, setVendorInboxFilter] = useState<'new' | 'all'>('new')
  const [vendorUnreadCount, setVendorUnreadCount] = useState(0)
  const [showCallHistory, setShowCallHistory] = useState(false)
  const [activeCallMode, setActiveCallMode] = useState<CallMode>(() => {
    const allowVideo = ui === 'full'
    if (callMode === 'audio') return 'audio'
    if (callMode === 'video') return allowVideo ? 'video' : 'audio'
    return allowVideo ? 'video' : 'audio'
  })
  const [callHistory, setCallHistory] = useState<CallHistoryEntry[]>([])
  const [showDialPad, setShowDialPad] = useState(false)
  const [dialPin, setDialPin] = useState('')
  const [dialBusy, setDialBusy] = useState(false)
  const [dialError, setDialError] = useState('')
  const [lastTargetRoomId, setLastTargetRoomId] = useState('')

  const wsRef = useRef<WebSocket | null>(null)
  const pcRef = useRef<RTCPeerConnection | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const localVideoRef = useRef<HTMLVideoElement | null>(null)
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null)
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null)
  const activeCallModeRef = useRef<CallMode>(activeCallMode)
  const callModeHintRef = useRef<CallModeHint>(callMode)
  const incomingCallModeRef = useRef<CallMode | null>(null)
  const pendingOfferRef = useRef<RTCSessionDescriptionInit | null>(null)
  const pendingIceRef = useRef<RTCIceCandidateInit[]>([])
  const pendingAnswerRef = useRef<RTCSessionDescriptionInit | null>(null)
  const pendingCallAcceptedRef = useRef<any | null>(null)
  const ringtoneRef = useRef<HTMLAudioElement | null>(null)
  const audioUnlockedRef = useRef(false)
  const ringtoneBlockedRef = useRef(false)
  const autoAnswerRef = useRef(false)
  const callInviteSentRef = useRef(false)
  const isCallingRef = useRef(false)
  const isInCallRef = useRef(false)
  const incomingCallRef = useRef(false)
  const incomingTimeoutRef = useRef<number | null>(null)
  const callHardStopTimerRef = useRef<number | null>(null)
  const ringTokenRef = useRef(0)
  const ringCtxRef = useRef<AudioContext | null>(null)
  const ringOscRef = useRef<OscillatorNode | null>(null)
  const ringGainRef = useRef<GainNode | null>(null)
  const ringIntervalRef = useRef<number | null>(null)
  const ringTimeoutsRef = useRef<number[]>([])
  const ringbackMutedRef = useRef(false)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const recorderChunksRef = useRef<BlobPart[]>([])
  const recorderStreamRef = useRef<MediaStream | null>(null)
  const videoDeviceIdRef = useRef<string | null>(null)
  const videoFacingRef = useRef<'user' | 'environment' | null>(null)
  const fullscreenTargetRef = useRef<HTMLDivElement | null>(null)
  const wsReconnectTimerRef = useRef<number | null>(null)
  const wsReconnectAttemptRef = useRef(0)
  const wsShouldReconnectRef = useRef(true)
  const hangupSignalRef = useRef(0)
  const startCallSignalRef = useRef(0)
  const autoCallKeyRef = useRef('')
  const pendingStartCallAtRef = useRef(0)
  const pendingStartCallSignalRef = useRef(0)
  const pendingAutoCallKeyRef = useRef('')
  const wsPingTimerRef = useRef<number | null>(null)
  const wsLastPongAtRef = useRef(0)
  const answerStartedAtRef = useRef(0)
  const callAttemptStartedAtRef = useRef(0)
  const callIntentRef = useRef(false)
  const callRetryCountRef = useRef(0)
  const lastOfferSentAtRef = useRef(0)
  const vibrateTimerRef = useRef<number | null>(null)
  const pcDisconnectTimerRef = useRef<number | null>(null)
  const ringKillUntilRef = useRef(0)
  const lastResolvedPinRef = useRef<{ pin: string; roomId: string; at: number } | null>(null)
  const activePeerIdRef = useRef('')
  const incomingCallIdRef = useRef('')
  const pendingAnswerCallIdRef = useRef<string | null>(null)
  const pendingCallEndedRef = useRef<any | null>(null)
  const callHistoryCallIdRef = useRef('')
  const callHistoryEntryIdRef = useRef('')
  const callHistoryConnectedAtRef = useRef(0)
  const closeOfflineUiRef = useRef<() => void>(() => {})
  const loadCallHistoryRef = useRef<() => CallHistoryEntry[]>(() => [])
  const saveCallHistoryRef = useRef<(next: CallHistoryEntry[]) => void>(() => {})
  const loadLastTargetRef = useRef<() => string>(() => '')
  const loadVendorMessagesRef = useRef<() => Promise<void>>(async () => {})
  const loadVendorUnreadCountRef = useRef<() => Promise<void>>(async () => {})
  const tryPlayRingtoneRef = useRef<() => Promise<void>>(async () => {})
  const unlockAudioRef = useRef<() => Promise<void>>(async () => {})
  const cleanupPeerRef = useRef<() => void>(() => {})
  const startCallRef = useRef<() => Promise<void>>(async () => {})
  const rejectCallRef = useRef<() => void>(() => {})
  const endCallRef = useRef<() => void>(() => {})
  const lastIncomingHistoryCallIdRef = useRef('')
  const isRenegotiatingRef = useRef(false)
  const remoteAudioStreamRef = useRef<MediaStream | null>(null)
  const remoteVideoStreamRef = useRef<MediaStream | null>(null)
  const rosterReadyRef = useRef(false)
  const offlineHintRef = useRef(false)
  const pendingStartCallAfterRosterAtRef = useRef(0)
  const offlinePromptOpenRef = useRef(false)
  const offlineMessageOpenRef = useRef(false)

  useEffect(() => {
    callModeHintRef.current = callMode
  }, [callMode])

  useEffect(() => {
    activeCallModeRef.current = activeCallMode
  }, [activeCallMode])

  const setActiveCallModeSafe = (mode: CallMode) => {
    activeCallModeRef.current = mode
    setActiveCallMode(mode)
  }

  const getDesiredCallMode = (hint: CallModeHint, allowVideo: boolean): CallMode => {
    if (hint === 'audio' || hint === 'video') return hint === 'video' && allowVideo ? 'video' : 'audio'
    return allowVideo ? 'video' : 'audio'
  }

  const inferOfferCallMode = (offer: any): CallMode => {
    try {
      const sdp = String(offer?.sdp || '')
      if (/m=video\s/i.test(sdp)) return 'video'
    } catch {
    }
    return 'audio'
  }

  const returnNavRef = useRef({
    roomId: String(returnRoomId || '').trim(),
    ui: returnUi,
    userId: String(returnUserId || '').trim(),
    fromLabel: String(returnFromLabel || '').trim(),
  })

  useEffect(() => {
    returnNavRef.current = {
      roomId: String(returnRoomId || '').trim(),
      ui: returnUi,
      userId: String(returnUserId || '').trim(),
      fromLabel: String(returnFromLabel || '').trim(),
    }
  }, [returnRoomId, returnUi, returnUserId, returnFromLabel])

  const maybeReturnToStart = () => {
    const r = returnNavRef.current
    const rid = String(r?.roomId || '').trim()
    if (!rid) return
    if (rid === String(roomId || '').trim()) return
    if (incomingCallRef.current || isCallingRef.current || isInCallRef.current) return
    if (offlinePromptOpenRef.current || offlineMessageOpenRef.current) return
    try {
      const qs = new URLSearchParams()
      qs.set('role', role)
      qs.set('roomId', rid)
      qs.set('ui', (r?.ui || ui) as any)
      if (String(r?.userId || '').trim()) qs.set('userId', String(r.userId).trim())
      if (String(r?.fromLabel || '').trim()) qs.set('fromLabel', String(r.fromLabel).trim())
      navigate(`/webrtc?${qs.toString()}`)
    } catch {
    }
  }

  const showVideoUi = ui === 'full' && activeCallMode === 'video'

  useEffect(() => {
    if (role !== 'vendor') return
    if (String(returnRoomId || '').trim()) return
    const rid = String(roomId || '').trim()
    const low = rid.toLowerCase()
    const uid = String(userId || '').trim()
    const uidLow = uid.toLowerCase()
    if (!low.startsWith('client:')) return
    if (!uidLow.startsWith('shop:') && !uidLow.startsWith('support:')) return
    if (incomingCall || isCalling || isInCall) return
    if (offlinePromptOpen || offlineMessageOpen) return
    window.setTimeout(() => {
      if (incomingCallRef.current || isCallingRef.current || isInCallRef.current) return
      if (offlinePromptOpenRef.current || offlineMessageOpenRef.current) return
      const nowRid = String(roomId || '').trim()
      if (nowRid.toLowerCase().startsWith('client:')) {
        try {
          const qs = new URLSearchParams()
          qs.set('role', 'vendor')
          qs.set('roomId', uid)
          qs.set('ui', ui)
          qs.set('userId', uid)
          if (String(fromLabel || '').trim()) qs.set('fromLabel', String(fromLabel || '').trim())
          navigate(`/webrtc?${qs.toString()}`)
        } catch {
        }
      }
    }, 200)
  }, [role, roomId, userId, returnRoomId, ui, fromLabel, incomingCall, isCalling, isInCall, offlineMessageOpen, offlinePromptOpen, navigate])

  const hasVendorOnline = useMemo(() => onlineUsers.some((u) => u.role === 'vendor'), [onlineUsers])
  const hasClientOnline = useMemo(() => onlineUsers.some((u) => u.role === 'client'), [onlineUsers])
  const callTargetLabel = useMemo(() => {
    const rid = String(roomId || '').trim()
    const low = rid.toLowerCase()
    if (low.startsWith('shop:')) return `Boutique ${rid.slice(5)}`
    if (low.startsWith('client:')) return `Client ${rid.slice(7)}`
    if (low.startsWith('support:')) return `Support ${rid.slice(8)}`
    return rid ? `Salon ${rid}` : 'Inconnu'
  }, [roomId])

  const selfTitle = useMemo(() => {
    const uid = String(userId || '').trim()
    const rid = String(roomId || '').trim()
    const base = uid || rid || ''
    const low = base.toLowerCase()
    if (low.startsWith('shop:')) return `Boutique ${base.slice(5)}`
    if (low.startsWith('client:')) return `Client ${base.slice(7)}`
    if (low.startsWith('support:')) return `Support ${base.slice(8)}`
    if (String(fromLabel || '').trim()) return String(fromLabel || '').trim()
    return base || (role === 'vendor' ? 'Vendeur' : 'Client')
  }, [fromLabel, role, roomId, userId])

  useEffect(() => {
    const caller = String(callFromLabel || callFrom || '').trim()
    if (incomingCall) {
      document.title = caller ? `🔔 Appel entrant — ${caller} | ${selfTitle} | Mangoo Connect+` : `🔔 Appel entrant | ${selfTitle} | Mangoo Connect+`
      return
    }
    if (isCalling) {
      document.title = `⏳ Appel — ${callTargetLabel} | ${selfTitle} | Mangoo Connect+`
      return
    }
    if (isInCall) {
      document.title = `🟢 En appel | ${selfTitle} | Mangoo Connect+`
      return
    }
    document.title = `${selfTitle} | Mangoo Connect+`
  }, [callFrom, callFromLabel, callTargetLabel, incomingCall, isCalling, isInCall, selfTitle])
  const vendorContacts = useMemo(() => {
    const list = Array.isArray(vendorMessages) ? vendorMessages : []
    const byKey = new Map<string, any>()
    const norm = (v: any) => String(v || '').trim()
    const parseMs = (v: any) => {
      const x = v ? Date.parse(String(v)) : NaN
      return Number.isFinite(x) ? x : 0
    }
    for (const m of list) {
      const phone = norm(m?.phone)
      const connectPlusId = norm(m?.connectPlusId)
      const fromUserId = norm(m?.fromUserId)
      const key = phone ? `pstn:${phone}` : (connectPlusId ? `cp:${connectPlusId}` : (fromUserId ? `uid:${fromUserId}` : ''))
      if (!key) continue
      const prev = byKey.get(key)
      const curAt = parseMs(m?.createdAt)
      const prevAt = prev ? parseMs(prev?.createdAt) : 0
      if (!prev || curAt >= prevAt) byKey.set(key, m)
    }
    const out = Array.from(byKey.entries()).map(([key, m]) => ({
      key,
      phone: norm(m?.phone),
      connectPlusId: norm(m?.connectPlusId),
      fromUserId: norm(m?.fromUserId),
      fromLabel: norm(m?.fromLabel),
      name: norm(m?.name),
      createdAt: norm(m?.createdAt),
    }))
    out.sort((a, b) => (String(a.createdAt) < String(b.createdAt) ? 1 : -1))
    return out
  }, [vendorMessages])

  const offlineStatusLabel = useMemo(() => {
    if (offlineNoAnswer) return 'Aucune réponse'
    const rid = String(roomId || '').trim().toLowerCase()
    if (forceOffline) return 'Boutique fermée'
    if (role === 'client' && rid.startsWith('shop:')) return 'Vendeur hors ligne'
    if (role === 'vendor' && rid.startsWith('client:')) return 'Client hors ligne'
    return 'Hors ligne'
  }, [forceOffline, offlineNoAnswer, role, roomId])

  const shouldOfferOfflineMessage = useMemo(() => {
    if (offlineNoAnswer) return true
    if (forceOffline) return true
    return status === offlineStatusLabel
  }, [forceOffline, offlineNoAnswer, offlineStatusLabel, status])

  const callPrimaryLabel = useMemo(() => {
    const rid = String(roomId || '').trim().toLowerCase()
    if (role === 'vendor' && rid.startsWith('shop:')) return 'Appeler'
    if (role === 'client' && (forceOffline || status === 'Boutique fermée')) return 'Message'
    return 'Appeler'
  }, [forceOffline, role, roomId, status])

  const openOfflineMessageFlow = () => {
    resetOfflineFlow()
    setOfflineNoAnswer(false)
    const rid = String(roomId || '').trim().toLowerCase()
    if (forceOffline) setStatus('Boutique fermée')
    else if (role === 'client' && rid.startsWith('shop:')) setStatus('Vendeur hors ligne')
    else if (role === 'vendor' && rid.startsWith('client:')) setStatus('Client hors ligne')
    else setStatus('Hors ligne')
    setOfflinePromptOpen(true)
  }

  const openOfflineComposer = () => {
    setOfflinePromptOpen(false)
    setOfflineMessageOpen(true)
  }

  const closeOfflineUi = () => {
    callIntentRef.current = false
    resetOfflineFlow()
    window.setTimeout(() => {
      maybeReturnToStart()
    }, 120)
  }

  closeOfflineUiRef.current = closeOfflineUi

  const requestCallOrOffline = () => {
    const ridLow = String(roomId || '').trim().toLowerCase()
    const isIdentityRoom = ridLow.startsWith('shop:') || ridLow.startsWith('client:')
    const canDirectCall =
      (role === 'client' && ridLow.startsWith('shop:')) || (role === 'vendor' && ridLow.startsWith('client:'))
    if (!canDirectCall) {
      callIntentRef.current = true
      const normPeer = (v: any) => {
        const s = String(v || '').trim()
        const low = s.toLowerCase()
        if (low.startsWith('shop:') || low.startsWith('client:') || low.startsWith('support:')) return s
        return ''
      }
      const selfId = normPeer(String(userId || '').trim())
      const curRoom = normPeer(String(roomId || '').trim())
      const last = normPeer(String(lastTargetRoomId || loadLastTarget() || '').trim())
      const pickFromHistory = () => {
        try {
          const uid = String(userId || '').trim()
          const rid = String(roomId || '').trim()
          const historyKey = `connectplus_call_history_${uid || `${role}_${rid}`}`
          const raw = localStorage.getItem(historyKey)
          const parsed = raw ? JSON.parse(raw) : null
          const list = Array.isArray(parsed) ? parsed : []
          const entries = list
            .map((h: any) => ({
              dir: String(h?.direction || '').trim(),
              peer: normPeer(h?.peerRoomId),
              at: Number(h?.at || 0),
            }))
            .filter((x: any) => x.peer && x.peer !== curRoom && x.peer !== selfId)
            .sort((a: any, b: any) => (b.at || 0) - (a.at || 0))
          const incoming = entries.find((e: any) => e.dir === 'incoming')
          return (incoming?.peer || entries[0]?.peer || '').trim()
        } catch {
          return ''
        }
      }
      const candidate = last && last !== curRoom && last !== selfId ? last : pickFromHistory()
      if (candidate) {
        try {
          const qs = new URLSearchParams()
          qs.set('role', role)
          qs.set('roomId', candidate)
          qs.set('ui', ui)
          qs.set('autoCall', '1')
          qs.set('call', activeCallModeRef.current === 'video' && ui === 'full' ? 'video' : 'audio')
          qs.set('returnRoomId', String(roomId || '').trim())
          qs.set('returnUi', ui)
          if (String(userId || '').trim()) qs.set('returnUserId', String(userId || '').trim())
          if (String(fromLabel || '').trim()) qs.set('returnFromLabel', String(fromLabel || '').trim())
          if (String(userId || '').trim()) qs.set('userId', String(userId || '').trim())
          if (String(fromLabel || '').trim()) qs.set('fromLabel', String(fromLabel || '').trim())
          navigate(`/webrtc?${qs.toString()}`)
          return
        } catch {
        }
      }
      setStatus(role === 'vendor' ? 'Choisir un client' : 'Choisir une boutique')
      openDialPad()
      return
    }
    callIntentRef.current = true
    if (forceOffline) {
      openOfflineMessageFlow()
      return
    }
    if (isIdentityRoom && !rosterReadyRef.current) {
      pendingStartCallAfterRosterAtRef.current = Date.now()
      setStatus('Connexion...')
      return
    }
    if (isIdentityRoom && offlineHintRef.current) {
      openOfflineMessageFlow()
      return
    }
    void startCall()
  }

  useEffect(() => {
    if (role !== 'client') return
    if (!forceOffline) return
    resetOfflineFlow()
    setStatus('Boutique fermée')
  }, [forceOffline, role])

  useEffect(() => {
    if (forceOffline) return
    if (!offlinePromptOpen && !offlineMessageOpen) return
    if (offlineNoAnswer) return
    if (role === 'client' && hasVendorOnline) closeOfflineUiRef.current()
    if (role === 'vendor' && hasClientOnline) closeOfflineUiRef.current()
  }, [forceOffline, offlineMessageOpen, offlineNoAnswer, offlinePromptOpen, hasClientOnline, hasVendorOnline, role])

  const iceServers = useMemo(
    () => [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      {
        urls: 'turn:openrelay.metered.ca:80',
        username: 'openrelayproject',
        credential: 'openrelayproject',
      },
      {
        urls: 'turn:openrelay.metered.ca:443?transport=tcp',
        username: 'openrelayproject',
        credential: 'openrelayproject',
      },
    ],
    [],
  )

  useEffect(() => {
    if (!isInCall) {
      setCallStartedAt(null)
      setCallElapsedSeconds(0)
      return
    }
    setCallStartedAt((prev) => prev ?? Date.now())
  }, [isInCall])

  useEffect(() => {
    isCallingRef.current = isCalling
  }, [isCalling])

  useEffect(() => {
    isInCallRef.current = isInCall
  }, [isInCall])

  useEffect(() => {
    incomingCallRef.current = incomingCall
  }, [incomingCall])

  useEffect(() => {
    offlinePromptOpenRef.current = offlinePromptOpen
  }, [offlinePromptOpen])

  useEffect(() => {
    offlineMessageOpenRef.current = offlineMessageOpen
  }, [offlineMessageOpen])

  const createCallId = () => `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
  const createHistoryId = () => `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`

  const getCallHistoryKey = () => {
    const uid = String(userId || '').trim()
    const rid = String(roomId || '').trim()
    return `connectplus_call_history_${uid || `${role}_${rid}`}`
  }

  const loadCallHistory = () => {
    try {
      const raw = localStorage.getItem(getCallHistoryKey())
      if (!raw) return []
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? (parsed as CallHistoryEntry[]) : []
    } catch {
      return []
    }
  }

  const saveCallHistory = (next: CallHistoryEntry[]) => {
    const list = Array.isArray(next) ? next : []
    const pruned = list.slice(0, 100)
    setCallHistory(pruned)
    try {
      localStorage.setItem(getCallHistoryKey(), JSON.stringify(pruned))
    } catch {
    }
  }

  loadCallHistoryRef.current = loadCallHistory
  saveCallHistoryRef.current = saveCallHistory

  const appendCallHistory = (entry: CallHistoryEntry) => {
    const prev = loadCallHistory()
    saveCallHistory([entry, ...prev].slice(0, 100))
  }

  const updateCallHistory = (id: string, patch: Partial<CallHistoryEntry>) => {
    const prev = loadCallHistory()
    const next = prev.map((e) => (e.id === id ? { ...e, ...patch } : e))
    saveCallHistory(next)
  }

  const ensureHistoryForCall = (opts: {
    callId: string
    direction: CallHistoryEntry['direction']
    status: CallHistoryEntry['status']
    peerRoomId: string
    peerLabel: string
  }) => {
    const callId = String(opts.callId || '').trim()
    if (!callId) return
    if (callHistoryCallIdRef.current === callId && callHistoryEntryIdRef.current) return
    callHistoryCallIdRef.current = callId
    callHistoryEntryIdRef.current = createHistoryId()
    callHistoryConnectedAtRef.current = 0
    appendCallHistory({
      id: callHistoryEntryIdRef.current,
      at: Date.now(),
      roomId: String(roomId || '').trim(),
      peerRoomId: String(opts.peerRoomId || '').trim(),
      peerLabel: String(opts.peerLabel || '').trim(),
      direction: opts.direction,
      status: opts.status,
    })
  }

  const markHistoryConnected = () => {
    const id = String(callHistoryEntryIdRef.current || '').trim()
    if (!id) return
    if (callHistoryConnectedAtRef.current) return
    const at = Date.now()
    callHistoryConnectedAtRef.current = at
    updateCallHistory(id, { status: 'connected', startedAt: at })
  }

  const finalizeHistory = (status: CallHistoryEntry['status']) => {
    const id = String(callHistoryEntryIdRef.current || '').trim()
    if (!id) return
    const endedAt = Date.now()
    const startedAt = Number(callHistoryConnectedAtRef.current || 0)
    const durationSec = startedAt ? Math.max(0, Math.round((endedAt - startedAt) / 1000)) : undefined
    updateCallHistory(id, { status, endedAt, ...(durationSec !== undefined ? { durationSec } : {}) })
    callHistoryCallIdRef.current = ''
    callHistoryEntryIdRef.current = ''
    callHistoryConnectedAtRef.current = 0
  }

  useEffect(() => {
    saveCallHistoryRef.current(loadCallHistoryRef.current())
  }, [role, roomId, userId])

  const clearIncomingTimeout = () => {
    const t = incomingTimeoutRef.current
    if (t) {
      try {
        window.clearTimeout(t)
      } catch {
      }
    }
    incomingTimeoutRef.current = null
  }

  const armIncomingTimeout = () => {
    clearIncomingTimeout()
    incomingTimeoutRef.current = window.setTimeout(() => {
      if (!incomingCallRef.current) return
      if (isInCallRef.current) return
      finalizeHistory('missed')
      answerStartedAtRef.current = 0
      pendingStartCallAtRef.current = 0
      pendingStartCallSignalRef.current = 0
      pendingAutoCallKeyRef.current = ''
      const callId = String(incomingCallIdRef.current || activePeerIdRef.current || '').trim()
      const endedPayload = { type: 'call-ended', roomId, from: userId, timestamp: Date.now(), ...(callId ? { callId } : {}) }
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        try {
          wsRef.current.send(JSON.stringify(endedPayload))
        } catch {
        }
      } else {
        pendingCallEndedRef.current = endedPayload
      }
      stopRingtone()
      stopVibrate()
      pendingOfferRef.current = null
      autoAnswerRef.current = false
      incomingCallIdRef.current = ''
      activePeerIdRef.current = ''
      setIncomingCall(false)
      setCallFrom('')
      setCallFromLabel('')
      setStatus('Appel manqué')
    }, 25000)
  }

  const clearCallHardStop = () => {
    const t = callHardStopTimerRef.current
    if (t) {
      try {
        window.clearTimeout(t)
      } catch {
      }
    }
    callHardStopTimerRef.current = null
  }

  const clearPcDisconnectTimer = () => {
    const t = pcDisconnectTimerRef.current
    pcDisconnectTimerRef.current = null
    if (!t) return
    try {
      window.clearTimeout(t)
    } catch {
    }
  }

  const armCallHardStop = () => {
    clearCallHardStop()
    callHardStopTimerRef.current = window.setTimeout(() => {
      if (!isCallingRef.current) return
      if (isInCallRef.current) return
      pendingStartCallAtRef.current = 0
      pendingStartCallSignalRef.current = 0
      pendingAutoCallKeyRef.current = ''
      stopRingtone()
      stopVibrate()
      pendingOfferRef.current = null
      setIncomingCall(false)
      setIsCalling(false)
      setCallFrom('')
      setCallFromLabel('')
      setStatus('Appel interrompu')
      finalizeHistory('ended')
      cleanupPeer()
    }, 30000)
  }

  useEffect(() => {
    if (!isInCall || !callStartedAt) return
    const tick = () => setCallElapsedSeconds(Math.floor((Date.now() - callStartedAt) / 1000))
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [isInCall, callStartedAt])

  useEffect(() => {
    const stopAll = () => {
      try {
        stopRingtone()
        stopVibrate()
      } catch {
      }
      try {
        clearIncomingTimeout()
        clearCallHardStop()
      } catch {
      }
    }
    window.addEventListener('beforeunload', stopAll)
    window.addEventListener('pagehide', stopAll)
    return () => {
      window.removeEventListener('beforeunload', stopAll)
      window.removeEventListener('pagehide', stopAll)
    }
  }, [])

  const resetOfflineFlow = () => {
    setOfflinePromptOpen(false)
    setOfflineMessageOpen(false)
    setOfflineNoAnswer(false)
    setCallbackPreferred('pstn')
    setCallbackPhone('')
    setCallbackConnectPlusId('')
    setCallbackName('')
    setCallbackStatus('idle')
    setVoiceStatus('idle')
    setVoiceDataUrl(null)
  }

  const getLastTargetKey = () => {
    const uid = String(userId || '').trim()
    return `connectplus_last_target_${uid || role}`
  }

  const loadLastTarget = () => {
    try {
      const raw = localStorage.getItem(getLastTargetKey())
      const rid = String(raw || '').trim()
      return rid
    } catch {
      return ''
    }
  }

  loadLastTargetRef.current = loadLastTarget

  const saveLastTarget = (rid: string) => {
    const next = String(rid || '').trim()
    if (!next) return
    try {
      localStorage.setItem(getLastTargetKey(), next)
    } catch {
    }
    setLastTargetRoomId(next)
  }

  useEffect(() => {
    setLastTargetRoomId(loadLastTargetRef.current())
  }, [role, userId])

  useEffect(() => {
    if (incomingCallRef.current || isInCallRef.current || isCallingRef.current) return
    callIntentRef.current = false
    resetOfflineFlow()
    closeDialPad()
  }, [roomId, role, userId])

  const normalizePin = (value: any) => String(value || '').replace(/[^\d]/g, '').slice(0, 6)

  const openDialPad = () => {
    setDialPin('')
    setDialBusy(false)
    setDialError('')
    setShowDialPad(true)
  }

  const closeDialPad = () => {
    setShowDialPad(false)
    setDialPin('')
    setDialBusy(false)
    setDialError('')
  }

  const pushDialDigit = (digit: string) => {
    const d = String(digit || '').replace(/[^\d]/g, '')
    if (!d) return
    setDialPin((prev) => {
      const next = normalizePin(`${prev}${d}`)
      return next
    })
  }

  const backspaceDial = () => setDialPin((prev) => normalizePin(String(prev || '').slice(0, -1)))

  const clearDial = () => setDialPin('')

  const dialConnectPlusId = async () => {
    const pin = normalizePin(dialPin)
    if (pin.length < 4) return
    setDialError('')
    setDialBusy(true)
    let targetRoomId = ''
    try {
      const cached = lastResolvedPinRef.current
      if (cached && cached.pin === pin && cached.roomId && Date.now() - cached.at < 60000) {
        targetRoomId = cached.roomId
      } else {
      const controller = new AbortController()
      const timeoutId = window.setTimeout(() => controller.abort(), 15000)
      const res = await fetch(`/api/connect-plus/resolve-id?pin=${encodeURIComponent(pin)}`, { method: 'GET', signal: controller.signal })
      window.clearTimeout(timeoutId)
      const json = res ? await res.json().catch(() => null) : null
      if (!res?.ok || !json?.success || !String(json?.roomId || '').trim()) {
        const msg = String(json?.error || (res?.status ? `HTTP ${res.status}` : 'Erreur'))
        setDialError(msg || 'Code invalide')
        setDialBusy(false)
        return
      }
      targetRoomId = String(json.roomId).trim()
      lastResolvedPinRef.current = { pin, roomId: targetRoomId, at: Date.now() }
      }
    } catch (e: any) {
      const name = e?.name ? String(e.name) : ''
      if (name === 'AbortError') setDialError('Délai dépassé. Serveur local trop lent ou indisponible.')
      else setDialError('Serveur indisponible. Vérifiez le serveur local.')
      setDialBusy(false)
      return
    }
    if (String(targetRoomId || '').trim() === String(roomId || '').trim()) {
      setShowDialPad(false)
      setDialPin('')
      setDialBusy(false)
      setDialError('')
      saveLastTarget(String(targetRoomId || '').trim())
      if (!incomingCallRef.current && !isInCallRef.current && !isCallingRef.current) {
        requestCallOrOffline()
      }
      return
    }
    saveLastTarget(String(targetRoomId || '').trim())
    try {
      const qs = new URLSearchParams()
      qs.set('role', role)
      qs.set('roomId', targetRoomId)
      qs.set('ui', ui)
      qs.set('autoCall', '1')
      qs.set('call', activeCallModeRef.current === 'video' && ui === 'full' ? 'video' : 'audio')
      qs.set('returnRoomId', String(roomId || '').trim())
      qs.set('returnUi', ui)
      if (String(userId || '').trim()) qs.set('returnUserId', String(userId || '').trim())
      if (String(fromLabel || '').trim()) qs.set('returnFromLabel', String(fromLabel || '').trim())
      if (String(userId || '').trim()) qs.set('userId', String(userId || '').trim())
      if (String(fromLabel || '').trim()) qs.set('fromLabel', String(fromLabel || '').trim())
      navigate(`/webrtc?${qs.toString()}`)
      setShowDialPad(false)
      setDialPin('')
      setDialBusy(false)
    } catch {
      navigate(
        `/webrtc?role=${encodeURIComponent(role)}&roomId=${encodeURIComponent(targetRoomId)}&ui=${encodeURIComponent(ui)}&autoCall=1&call=${encodeURIComponent(activeCallModeRef.current === 'video' && ui === 'full' ? 'video' : 'audio')}&returnRoomId=${encodeURIComponent(String(roomId || '').trim())}&returnUi=${encodeURIComponent(ui)}${String(userId || '').trim() ? `&returnUserId=${encodeURIComponent(String(userId || '').trim())}` : ''}${String(fromLabel || '').trim() ? `&returnFromLabel=${encodeURIComponent(String(fromLabel || '').trim())}` : ''}${String(userId || '').trim() ? `&userId=${encodeURIComponent(String(userId || '').trim())}` : ''}${String(fromLabel || '').trim() ? `&fromLabel=${encodeURIComponent(String(fromLabel || '').trim())}` : ''}`,
      )
      setShowDialPad(false)
      setDialPin('')
      setDialBusy(false)
    }
  }

  const blobToDataUrl = (blob: Blob) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result || ''))
      reader.onerror = () => reject(new Error('read_failed'))
      reader.readAsDataURL(blob)
    })

  const stopRecording = async () => {
    const rec = recorderRef.current
    if (!rec) return
    try {
      rec.stop()
    } catch {
    }
  }

  const startRecording = async () => {
    try {
      setVoiceStatus('recording')
      setVoiceDataUrl(null)
      recorderChunksRef.current = []

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      recorderStreamRef.current = stream

      const rec = new MediaRecorder(stream)
      recorderRef.current = rec

      rec.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) recorderChunksRef.current.push(e.data)
      }
      rec.onstop = async () => {
        const chunks = recorderChunksRef.current
        recorderChunksRef.current = []
        try {
          recorderStreamRef.current?.getTracks().forEach((t) => t.stop())
        } catch {
        }
        recorderStreamRef.current = null
        recorderRef.current = null

        const blob = new Blob(chunks, { type: 'audio/webm' })
        try {
          const dataUrl = await blobToDataUrl(blob)
          setVoiceDataUrl(dataUrl)
          setVoiceStatus('ready')
        } catch {
          setVoiceStatus('error')
        }
      }

      rec.start()
      window.setTimeout(() => {
        if (recorderRef.current) void stopRecording()
      }, 30000)
    } catch {
      setVoiceStatus('error')
      try {
        recorderStreamRef.current?.getTracks().forEach((t) => t.stop())
      } catch {
      }
      recorderStreamRef.current = null
      recorderRef.current = null
    }
  }

  const sendVoicemail = async (payload: any) => {
    const res = await fetch('/api/voicemail', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const json = await res.json().catch(() => null)
    if (!res.ok || !json?.success) throw new Error(json?.error || 'failed')
    return json
  }

  const submitVoiceMessage = async () => {
    if (!voiceDataUrl) return
    try {
      setVoiceStatus('sending')
      await sendVoicemail({
        roomId,
        kind: 'voice',
        fromRole: role,
        fromUserId: userId,
        fromLabel: String(fromLabel || '').trim() || (role === 'client' ? 'Client' : 'Vendeur'),
        dataUrl: voiceDataUrl,
      })
      setVoiceStatus('sent')
    } catch {
      setVoiceStatus('error')
    }
  }

  const submitCallbackRequest = async () => {
    const phone = String(callbackPhone || '').trim()
    const connectPlusId = String(callbackConnectPlusId || '').trim()
    if (callbackPreferred === 'connectplus' && !connectPlusId) return
    if (callbackPreferred === 'pstn' && !phone) return
    try {
      setCallbackStatus('sending')
      await sendVoicemail({
        roomId,
        kind: 'callback',
        fromRole: role,
        fromUserId: userId,
        fromLabel: String(fromLabel || '').trim() || (role === 'client' ? 'Client' : 'Vendeur'),
        callbackPreferred,
        phone: phone || undefined,
        connectPlusId: connectPlusId || undefined,
        name: String(callbackName || '').trim() || undefined,
      })
      setCallbackStatus('sent')
    } catch {
      setCallbackStatus('error')
    }
  }

  const loadVendorMessages = async () => {
    const qs = new URLSearchParams()
    qs.set('roomId', roomId)
    if (vendorInboxFilter === 'new') qs.set('status', 'new')
    const res = await fetch(`/api/voicemail?${qs.toString()}`)
    const json = await res.json().catch(() => null)
    if (!res.ok || !json?.success) throw new Error(json?.error || 'failed')
    const list = Array.isArray(json.messages) ? json.messages : []
    setVendorMessages(list)
    return list
  }

  loadVendorMessagesRef.current = loadVendorMessages

  const loadVendorUnreadCount = async () => {
    const qs = new URLSearchParams()
    qs.set('roomId', roomId)
    qs.set('status', 'new')
    const res = await fetch(`/api/voicemail?${qs.toString()}`)
    const json = await res.json().catch(() => null)
    if (!res.ok || !json?.success) throw new Error(json?.error || 'failed')
    const list = Array.isArray(json.messages) ? json.messages : []
    setVendorUnreadCount(list.length)
    return list.length
  }

  loadVendorUnreadCountRef.current = loadVendorUnreadCount

  const markMessageRead = async (id: string) => {
    const res = await fetch(`/api/voicemail/${encodeURIComponent(id)}/read`, { method: 'POST' })
    const json = await res.json().catch(() => null)
    if (!res.ok || !json?.success) throw new Error(json?.error || 'failed')
    await loadVendorMessages()
    await loadVendorUnreadCount()
  }

  const getClientConnectPlusRoomId = (connectPlusId: string) => {
    const cid = String(connectPlusId || '').trim()
    const pin = cid.replace(/[^\d]/g, '').slice(0, 6)
    if (!pin) return ''
    return `client:${pin}`
  }

  const getConnectPlusLink = (opts: { role: 'client' | 'vendor'; connectPlusId: string }) => {
    const rid = getClientConnectPlusRoomId(opts.connectPlusId)
    if (!rid) return ''
    const qs = opts.role === 'client'
      ? `role=${encodeURIComponent(opts.role)}&roomId=${encodeURIComponent(rid)}&userId=${encodeURIComponent(rid)}&ui=simple`
      : `role=${encodeURIComponent(opts.role)}&roomId=${encodeURIComponent(rid)}&ui=simple`
    try {
      const origin = String(window.location.origin || '').trim()
      if (origin) return `${origin}/webrtc?${qs}`
    } catch {
    }
    return `/webrtc?${qs}`
  }

  useEffect(() => {
    if (role !== 'vendor' && role !== 'client') return
    if (!showVendorInbox && !showVendorContacts) return
    let cancelled = false
    void loadVendorMessagesRef.current().catch(() => {})
    const id = window.setInterval(() => {
      if (cancelled) return
      void loadVendorMessagesRef.current().catch(() => {})
    }, 5000)
    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [role, roomId, showVendorContacts, showVendorInbox, vendorInboxFilter])

  useEffect(() => {
    if (role !== 'vendor') {
      setVendorUnreadCount(0)
      return
    }
    if (!String(roomId || '').trim()) return
    let cancelled = false
    const run = async () => {
      if (cancelled) return
      void loadVendorUnreadCountRef.current().catch(() => {})
    }
    void run()
    const id = window.setInterval(run, 6000)
    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [role, roomId])

  const stopRingtone = () => {
    ringTokenRef.current += 1
    try {
      const w: any = window as any
      if (w?.ringtoneInterval) {
        try {
          window.clearInterval(w.ringtoneInterval)
        } catch {
        }
        w.ringtoneInterval = null
      }
      try {
        const c = w?.ringtoneContext
        const g = w?.ringtoneGain
        if (c && g?.gain?.setValueAtTime) g.gain.setValueAtTime(0, c.currentTime)
      } catch {
      }
      try {
        w?.ringtoneOscillator?.stop?.()
      } catch {
      }
      try {
        w?.ringtoneOscillator?.disconnect?.()
      } catch {
      }
      try {
        w?.ringtoneGain?.disconnect?.()
      } catch {
      }
      try {
        w?.ringtoneContext?.close?.().catch?.(() => {})
      } catch {
      }
      if (w) {
        w.ringtoneOscillator = null
        w.ringtoneGain = null
        w.ringtoneContext = null
      }
    } catch {
    }
    if (ringIntervalRef.current) {
      window.clearInterval(ringIntervalRef.current)
      ringIntervalRef.current = null
    }
    if (ringTimeoutsRef.current.length) {
      ringTimeoutsRef.current.forEach((t) => window.clearTimeout(t))
      ringTimeoutsRef.current = []
    }
    try {
      const ctx = ringCtxRef.current
      const gain = ringGainRef.current
      if (ctx && gain) gain.gain.setValueAtTime(0, ctx.currentTime)
    } catch {
    }
    try {
      ringOscRef.current?.stop()
    } catch {
    }
    try {
      ringOscRef.current?.disconnect()
    } catch {
    }
    try {
      ringGainRef.current?.disconnect()
    } catch {
    }
    ringOscRef.current = null
    ringGainRef.current = null

    const ctx = ringCtxRef.current
    ringCtxRef.current = null
    if (ctx) {
      try {
        ;(ctx as any).close?.().catch?.(() => {})
      } catch {
      }
    }

    const a = ringtoneRef.current
    ringtoneRef.current = null
    if (!a) return
    try {
      a.pause()
      a.currentTime = 0
      a.loop = false
      a.src = ''
      a.load()
    } catch {
    }
  }

  const ensureRingContext = async () => {
    const Ctx = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext | undefined
    if (!Ctx) return null
    const ctx = ringCtxRef.current ?? new Ctx()
    ringCtxRef.current = ctx
    if (ctx.state === 'suspended') {
      try {
        await ctx.resume()
      } catch {
      }
    }
    return ctx
  }

  const unlockAudio = async () => {
    audioUnlockedRef.current = true
    setAudioUnlocked(true)
    try {
      await ensureRingContext()
    } catch {
    }
  }

  unlockAudioRef.current = unlockAudio

  useEffect(() => {
    if (incomingCall || isInCall || isCalling) return
    try {
      const u = new URL(String(window.location.href || ''))
      if (u.searchParams.get('autoCall') === '1' && autoCallKeyRef.current) {
        u.searchParams.delete('autoCall')
        window.history.replaceState(null, '', u.toString())
      }
    } catch {
    }
  }, [incomingCall, isInCall, isCalling])

  const startVibrate = () => {
    try {
      if (!navigator.vibrate) return
      navigator.vibrate([200, 120, 200, 120, 200])
      if (vibrateTimerRef.current) window.clearInterval(vibrateTimerRef.current)
      vibrateTimerRef.current = window.setInterval(() => {
        try {
          navigator.vibrate([200, 120, 200, 120, 200])
        } catch {
        }
      }, 2500)
    } catch {
    }
  }

  const stopVibrate = () => {
    try {
      if (vibrateTimerRef.current) window.clearInterval(vibrateTimerRef.current)
    } catch {
    }
    vibrateTimerRef.current = null
    try {
      if (navigator.vibrate) navigator.vibrate(0)
    } catch {
    }
  }

  const armRingKill = (ms: number) => {
    ringKillUntilRef.current = Date.now() + Math.max(0, Math.floor(ms || 0))
    stopRingtone()
    stopVibrate()
  }

  const tryPlayRingtone = async () => {
    if (Date.now() < (ringKillUntilRef.current || 0)) return
    stopRingtone()
    const token = ++ringTokenRef.current
    const ctx = await ensureRingContext()
    if (ctx && ctx.state === 'running') {
      try {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        ringOscRef.current = osc
        ringGainRef.current = gain
        osc.type = 'sine'
        osc.frequency.value = 800
        gain.gain.value = 0
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start()

        const pattern = () => {
          if (token !== ringTokenRef.current) return
          const c = ringCtxRef.current
          const g = ringGainRef.current
          if (!c || !g) return
          g.gain.setValueAtTime(0.6, c.currentTime)
          const to = window.setTimeout(() => {
            if (token !== ringTokenRef.current) return
            const c2 = ringCtxRef.current
            const g2 = ringGainRef.current
            if (!c2 || !g2) return
            g2.gain.setValueAtTime(0, c2.currentTime)
          }, 1000)
          ringTimeoutsRef.current.push(to)
        }

        pattern()
        ringIntervalRef.current = window.setInterval(pattern, 3000)
        ringtoneBlockedRef.current = false
        setRingtoneBlocked(false)
        return
      } catch {
      }
    }

    try {
      const a = new Audio(RINGTONE_DATA_URI)
      a.loop = true
      a.volume = 1.0
      ringtoneRef.current = a
      a.currentTime = 0
      a.play().then(() => {
        ringtoneBlockedRef.current = false
        setRingtoneBlocked(false)
      }).catch(() => {
        ringtoneBlockedRef.current = true
        setRingtoneBlocked(true)
      })
    } catch {
      ringtoneBlockedRef.current = true
      setRingtoneBlocked(true)
    }
  }

  tryPlayRingtoneRef.current = tryPlayRingtone

  useEffect(() => {
    const unlock = () => {
      if (audioUnlockedRef.current && !ringtoneBlockedRef.current) return
      void unlockAudioRef.current().then(() => {
        if (incomingCall && !isInCall && Date.now() >= (ringKillUntilRef.current || 0)) void tryPlayRingtoneRef.current()
      })
    }
    window.addEventListener('pointerdown', unlock)
    window.addEventListener('keydown', unlock)
    return () => {
      window.removeEventListener('pointerdown', unlock as any)
      window.removeEventListener('keydown', unlock as any)
    }
  }, [incomingCall, isCalling, isInCall])

  useEffect(() => {
    if (!incomingCall || isInCall) return
    if (Date.now() < (ringKillUntilRef.current || 0)) {
      stopRingtone()
      stopVibrate()
      return
    }
    startVibrate()
    void tryPlayRingtoneRef.current()
    return () => {
      stopRingtone()
      stopVibrate()
    }
  }, [incomingCall, isInCall])

  useEffect(() => {
    if (!isCalling || isInCall) return
    return () => stopRingtone()
  }, [isCalling, isInCall])

  const cleanupPeer = () => {
    ringKillUntilRef.current = 0
    stopRingtone()
    stopVibrate()
    clearIncomingTimeout()
    clearCallHardStop()
    clearPcDisconnectTimer()
    pendingOfferRef.current = null
    pendingIceRef.current = []
    pendingAnswerRef.current = null
    pendingCallAcceptedRef.current = null
    pendingAnswerCallIdRef.current = null
    pendingCallEndedRef.current = null

    const pc = pcRef.current
    pcRef.current = null
    if (pc) {
      try {
        pc.onicecandidate = null
        pc.ontrack = null
        pc.onconnectionstatechange = null
        pc.onsignalingstatechange = null
        pc.onnegotiationneeded = null
        pc.close()
      } catch {
      }
    }

    const stream = localStreamRef.current
    localStreamRef.current = null
    if (stream) {
      try {
        stream.getTracks().forEach((t) => t.stop())
      } catch {
      }
    }

    // Nettoyer les streams distants persistants
    if (remoteAudioStreamRef.current) {
      remoteAudioStreamRef.current.getTracks().forEach((t) => t.stop())
      remoteAudioStreamRef.current = null
    }
    if (remoteVideoStreamRef.current) {
      remoteVideoStreamRef.current.getTracks().forEach((t) => t.stop())
      remoteVideoStreamRef.current = null
    }

    if (localVideoRef.current) localVideoRef.current.srcObject = null
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null
    if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null
  }

  cleanupPeerRef.current = cleanupPeer

  const getLocalMediaStream = async () => {
    const isLocalhost =
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')

    if (typeof window !== 'undefined' && !window.isSecureContext && !isLocalhost) {
      const err = new Error(
        'Micro/caméra nécessitent HTTPS (ou localhost). Ouvrez via https:// ou utilisez http://localhost:3015 sur PC.',
      )
      ;(err as any).name = 'InsecureContext'
      throw err
    }

    if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== 'function') {
      const err = new Error('getUserMedia indisponible: autorisez micro/caméra et utilisez HTTPS (ou localhost).')
      ;(err as any).name = 'MediaDevicesUnavailable'
      throw err
    }

    const audioConstraints: MediaTrackConstraints = {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    }

    const wantVideo = ui === 'full' && activeCallModeRef.current === 'video'
    const videoConstraints: boolean | MediaTrackConstraints = !wantVideo
      ? false
      : {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30, max: 30 },
          ...(videoDeviceIdRef.current ? { deviceId: { exact: videoDeviceIdRef.current } } : {}),
          ...(!videoDeviceIdRef.current && videoFacingRef.current ? { facingMode: { ideal: videoFacingRef.current } } : {}),
        }

    return await navigator.mediaDevices.getUserMedia({ video: videoConstraints, audio: audioConstraints })
  }

  const listVideoInputs = async () => {
    try {
      if (!navigator.mediaDevices || typeof navigator.mediaDevices.enumerateDevices !== 'function') return []
      const devices = await navigator.mediaDevices.enumerateDevices()
      return devices.filter((d) => d.kind === 'videoinput' && d.deviceId).map((d) => ({ deviceId: d.deviceId, label: d.label || '' }))
    } catch {
      return []
    }
  }

  const replaceVideoTrack = async (track: MediaStreamTrack) => {
    const pc = pcRef.current
    if (pc) {
      const sender = pc.getSenders().find((s) => s.track && s.track.kind === 'video')
      if (sender) {
        try {
          await sender.replaceTrack(track)
        } catch {
        }
      }
    }
    const current = localStreamRef.current
    if (current) {
      try {
        current.getVideoTracks().forEach((t) => {
          try {
            t.stop()
          } catch {
          }
          current.removeTrack(t)
        })
      } catch {
      }
      try {
        current.addTrack(track)
      } catch {
      }
    } else {
      localStreamRef.current = new MediaStream([track])
    }

    if (localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current
      localVideoRef.current.muted = true
      localVideoRef.current.volume = 0
      localVideoRef.current.play().catch(() => {})
    }
  }

  const switchCamera = async () => {
    if (ui !== 'full' || activeCallModeRef.current !== 'video') return
    try {
      const nextFacing: 'user' | 'environment' =
        videoFacingRef.current === 'environment' ? 'user' : 'environment'
      videoFacingRef.current = nextFacing

      try {
        const s = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: nextFacing },
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30, max: 30 },
          },
          audio: false,
        })
        const vt = s.getVideoTracks()[0]
        if (vt) {
          videoDeviceIdRef.current = null
          await replaceVideoTrack(vt)
          try {
            s.getTracks().forEach((t) => {
              if (t.kind !== 'video') t.stop()
            })
          } catch {
          }
          return
        }
      } catch {
      }

      const list = await listVideoInputs()
      if (list.length <= 0) return
      const currentId = videoDeviceIdRef.current
      const idx = currentId ? list.findIndex((d) => d.deviceId === currentId) : -1
      const next = list[(idx + 1 + list.length) % list.length]
      videoDeviceIdRef.current = next.deviceId
      videoFacingRef.current = null

      const s = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: { exact: next.deviceId },
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30, max: 30 },
        },
        audio: false,
      })
      const vt = s.getVideoTracks()[0]
      if (!vt) return
      await replaceVideoTrack(vt)
      try {
        s.getTracks().forEach((t) => {
          if (t.kind !== 'video') t.stop()
        })
      } catch {
      }
    } catch {
    }
  }

  const toggleFullscreen = async () => {
    const el = fullscreenTargetRef.current
    if (!el) return
    try {
      const d: any = document as any
      if (d.fullscreenElement) {
        await d.exitFullscreen?.()
        return
      }
      await (el as any).requestFullscreen?.()
    } catch {
    }
  }

  const ensurePeerConnection = () => {
    if (pcRef.current) return pcRef.current
    const pc = new RTCPeerConnection({ iceServers })
    pcRef.current = pc

    const armDisconnectCleanup = () => {
      if (pcDisconnectTimerRef.current) return
      pcDisconnectTimerRef.current = window.setTimeout(() => {
        pcDisconnectTimerRef.current = null
        if (pcRef.current !== pc) return
        if (!isInCallRef.current && !isCallingRef.current) return
        const cs = pc.connectionState
        const ics = pc.iceConnectionState
        const disconnected =
          cs === 'disconnected' ||
          cs === 'failed' ||
          cs === 'closed' ||
          ics === 'disconnected' ||
          ics === 'failed' ||
          ics === 'closed'
        if (!disconnected) return
        endCall()
      }, 3500)
    }

    pc.onicecandidate = (event) => {
      if (!event.candidate) return
      if (wsRef.current?.readyState !== WebSocket.OPEN) return
      const callId = String(activePeerIdRef.current || '').trim()
      wsRef.current.send(JSON.stringify({ type: 'ice-candidate', roomId, data: event.candidate, ...(callId ? { callId } : {}) }))
    }

    pc.ontrack = (event) => {
      armRingKill(20000)
      clearPcDisconnectTimer()
      const track = event.track
      if (!track) return
      try {
        if (typeof track.addEventListener === 'function') {
          track.addEventListener(
            'ended',
            () => {
              if (pcRef.current !== pc) return
              if (!isInCallRef.current && !isCallingRef.current) return
              endCall()
            },
            { once: true } as any,
          )
        }
      } catch {
      }
      if (!isInCallRef.current) {
        stopRingtone()
        setIsInCall(true)
        setIsCalling(false)
        setIncomingCall(false)
        setStatus('En appel')
        markHistoryConnected()
        clearIncomingTimeout()
        clearCallHardStop()
      }
      // Gérer audio et vidéo dans des streams séparés pour éviter
      // que la renégociation vidéo n'écrase le stream audio
      if (track.kind === 'audio') {
        if (!remoteAudioStreamRef.current) {
          remoteAudioStreamRef.current = new MediaStream()
        }
        // Remplacer les anciennes pistes audio
        remoteAudioStreamRef.current.getAudioTracks().forEach((t) => {
          if (t.id !== track.id) remoteAudioStreamRef.current!.removeTrack(t)
        })
        if (!remoteAudioStreamRef.current.getAudioTracks().some((t) => t.id === track.id)) {
          remoteAudioStreamRef.current.addTrack(track)
        }
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = remoteAudioStreamRef.current
          remoteAudioRef.current.muted = false
          remoteAudioRef.current.volume = 1.0
          remoteAudioRef.current.play().catch(() => {})
        }
      } else if (track.kind === 'video') {
        if (!remoteVideoStreamRef.current) {
          remoteVideoStreamRef.current = new MediaStream()
        }
        // Remplacer les anciennes pistes vidéo
        remoteVideoStreamRef.current.getVideoTracks().forEach((t) => {
          if (t.id !== track.id) remoteVideoStreamRef.current!.removeTrack(t)
        })
        if (!remoteVideoStreamRef.current.getVideoTracks().some((t) => t.id === track.id)) {
          remoteVideoStreamRef.current.addTrack(track)
        }
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteVideoStreamRef.current
          remoteVideoRef.current.muted = true
          remoteVideoRef.current.play().catch((e) => {
            console.warn('[WebRTC] Echec autoplay video distante:', e.message)
            // Fallback Android : tap pour declencher le play
            if (remoteVideoRef.current) {
              const vid = remoteVideoRef.current
              const tapToPlay = () => { vid.play().catch(() => {}); vid.removeEventListener('click', tapToPlay) }
              vid.addEventListener('click', tapToPlay)
              vid.style.cursor = 'pointer'
            }
          })
        }
        // Nettoyer quand la piste vidéo se termine
        track.onended = () => {
          if (remoteVideoStreamRef.current) {
            remoteVideoStreamRef.current.getVideoTracks().forEach((t) => {
              if (t.id === track.id) remoteVideoStreamRef.current!.removeTrack(t)
            })
          }
        }
      }
    }

    pc.onconnectionstatechange = () => {
      if (!pcRef.current) return
      if (pc.connectionState === 'connected') {
        clearPcDisconnectTimer()
        stopRingtone()
        setIsInCall(true)
        setIsCalling(false)
        setIncomingCall(false)
        setStatus('En appel')
        markHistoryConnected()
        armRingKill(20000)
        clearCallHardStop()
      }
      if (pc.connectionState === 'disconnected') {
        armDisconnectCleanup()
      }
      if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        clearPcDisconnectTimer()
        endCall()
      }
    }

    pc.oniceconnectionstatechange = () => {
      if (pcRef.current !== pc) return
      const s = pc.iceConnectionState
      if (s === 'connected' || s === 'completed') {
        clearPcDisconnectTimer()
        return
      }
      if (s === 'disconnected') {
        armDisconnectCleanup()
        return
      }
      if (s === 'failed' || s === 'closed') {
        clearPcDisconnectTimer()
        endCall()
      }
    }

    pc.onnegotiationneeded = async () => {
      if (isRenegotiatingRef.current) return
      if (pc.signalingState !== 'stable') return
      isRenegotiatingRef.current = true
      try {
        const offer = await pc.createOffer()
        await pc.setLocalDescription(offer)
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          const callId = String(activePeerIdRef.current || '').trim()
          wsRef.current.send(
            JSON.stringify({
              type: 'offer',
              roomId,
              data: offer,
              from: userId,
              fromLabel: String(fromLabel || '').trim() || undefined,
              callMode: activeCallModeRef.current,
              ...(callId ? { callId } : {}),
            }),
          )
        }
      } catch (e) {
        console.error('[WebRTC] Renegotiation error:', e)
      } finally {
        isRenegotiatingRef.current = false
      }
    }

    return pc
  }

  const flushPendingIce = async (pc: RTCPeerConnection) => {
    const list = pendingIceRef.current
    if (!list.length) return
    pendingIceRef.current = []
    for (const c of list) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(c))
      } catch {
      }
    }
  }

  const handleOffer = async (offer: RTCSessionDescriptionInit, callId?: string) => {
    const pc = ensurePeerConnection()
    const cid = String(callId || '').trim()
    if (cid) activePeerIdRef.current = cid

    try {
      const inferred = inferOfferCallMode(offer as any)
      incomingCallModeRef.current = inferred
      if (callModeHintRef.current === 'auto') {
        const desired = inferred === 'video' && ui === 'full' ? 'video' : 'audio'
        if (activeCallModeRef.current !== desired) setActiveCallModeSafe(desired)
      }
    } catch {
    }

    if (!localStreamRef.current) {
      const stream = await getLocalMediaStream()
      localStreamRef.current = stream
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
        localVideoRef.current.muted = true
        localVideoRef.current.volume = 0
        localVideoRef.current.play().catch(() => {})
      }
      for (const t of stream.getTracks()) {
        const sender = pc.addTrack(t, stream)
        if (t.kind === 'video') {
          try {
            const p = sender.getParameters()
            ;(p as any).degradationPreference = 'maintain-resolution'
            p.encodings = p.encodings && p.encodings.length ? p.encodings : [{}]
            ;(p.encodings[0] as any).maxBitrate = 2_500_000
            sender.setParameters(p).catch(() => {})
          } catch {
          }
        }
      }
    }

    await pc.setRemoteDescription(new RTCSessionDescription(offer))
    await flushPendingIce(pc)

    const answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify({ type: 'answer', roomId, data: answer, ...(cid ? { callId: cid } : {}) }))
        pendingAnswerRef.current = null
        pendingAnswerCallIdRef.current = null
      } catch {
        pendingAnswerRef.current = answer
        pendingAnswerCallIdRef.current = cid || null
      }
    } else {
      pendingAnswerRef.current = answer
      pendingAnswerCallIdRef.current = cid || null
    }

    setIsInCall(true)
    setIsCalling(false)
    setIncomingCall(false)
    setCallFrom('')
    setCallFromLabel('')
    setStatus('En appel')
    markHistoryConnected()
    stopRingtone()
  }

  const startCall = async () => {
    callIntentRef.current = true
    if (wsRef.current?.readyState !== WebSocket.OPEN) {
      pendingStartCallAtRef.current = Date.now()
      setStatus('Connexion...')
      return
    }
    try {
      const desiredMode = getDesiredCallMode(callModeHintRef.current, ui === 'full')
      if (activeCallModeRef.current !== desiredMode) setActiveCallModeSafe(desiredMode)
      const ridLow = String(roomId || '').trim().toLowerCase()
      const isIdentityRoom = ridLow.startsWith('shop:') || ridLow.startsWith('client:')
      if (!forceOffline && isIdentityRoom && !rosterReadyRef.current) {
        pendingStartCallAfterRosterAtRef.current = Date.now()
        setStatus('Connexion...')
        return
      }
      if (forceOffline || (!forceOffline && rosterReadyRef.current && offlineHintRef.current)) {
        setIsCalling(false)
        openOfflineMessageFlow()
        return
      }
      ringbackMutedRef.current = false
      try {
        const u = new URL(String(window.location.href || ''))
        if (u.searchParams.get('autoCall') === '1') {
          u.searchParams.delete('autoCall')
          window.history.replaceState(null, '', u.toString())
        }
      } catch {
      }
      if (!forceOffline) resetOfflineFlow()
      pendingStartCallAtRef.current = 0
      pendingStartCallSignalRef.current = 0
      pendingAutoCallKeyRef.current = ''
      callInviteSentRef.current = false
      void unlockAudio()
      if (role === 'client' && forceOffline) {
        resetOfflineFlow()
        setStatus('Boutique fermée')
        setIsCalling(false)
        return
      }
      if (!isCallingRef.current) {
        callAttemptStartedAtRef.current = Date.now()
        callRetryCountRef.current = 0
        lastOfferSentAtRef.current = 0
        activePeerIdRef.current = createCallId()
      }
      if (!forceOffline) {
        const normPeer = (v: any) => {
          const s = String(v || '').trim()
          const low = s.toLowerCase()
          if (low.startsWith('shop:') || low.startsWith('client:') || low.startsWith('support:')) return s
          return ''
        }
        const peer = normPeer(String(roomId || '').trim())
        const self = normPeer(String(userId || '').trim())
        if (peer && peer !== self) saveLastTarget(peer)
      }
      const callId = String(activePeerIdRef.current || '').trim() || createCallId()
      activePeerIdRef.current = callId
      incomingCallIdRef.current = ''
      ensureHistoryForCall({
        callId,
        direction: 'outgoing',
        status: 'dialing',
        peerRoomId: String(roomId || '').trim(),
        peerLabel: String(callTargetLabel || '').trim() || String(roomId || '').trim(),
      })
      setIsCalling(true)
      setStatus('Appel en cours...')
      cleanupPeer()
      armCallHardStop()

      const cleanedFromLabel = String(fromLabel || '').trim()
      try {
        wsRef.current.send(
          JSON.stringify({
            type: 'call-notification',
            roomId,
            from: userId,
            fromLabel: cleanedFromLabel || undefined,
            callMode: desiredMode,
            message: 'incoming',
            timestamp: Date.now(),
            ...(callId ? { callId } : {}),
          }),
        )
        callInviteSentRef.current = true
      } catch {
      }

      const stream = await getLocalMediaStream()
      localStreamRef.current = stream
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
        localVideoRef.current.muted = true
        localVideoRef.current.volume = 0
        localVideoRef.current.play().catch(() => {})
      }

      const pc = ensurePeerConnection()
      for (const t of stream.getTracks()) {
        const sender = pc.addTrack(t, stream)
        if (t.kind === 'video') {
          try {
            const p = sender.getParameters()
            ;(p as any).degradationPreference = 'maintain-resolution'
            p.encodings = p.encodings && p.encodings.length ? p.encodings : [{}]
            ;(p.encodings[0] as any).maxBitrate = 2_500_000
            sender.setParameters(p).catch(() => {})
          } catch {
          }
        }
      }

      const offer = await pc.createOffer(callRetryCountRef.current > 0 ? { iceRestart: true } : undefined)
      await pc.setLocalDescription(offer)

      wsRef.current.send(
        JSON.stringify({
          type: 'offer',
          roomId,
          data: offer,
          from: userId,
          fromLabel: cleanedFromLabel || undefined,
          callMode: desiredMode,
          ...(callId ? { callId } : {}),
        }),
      )
      lastOfferSentAtRef.current = Date.now()
    } catch (e: any) {
      setIsCalling(false)
      const name = e?.name ? String(e.name) : ''
      const msg = e?.message ? String(e.message) : ''
      setStatus(name ? `Erreur appel (${name})${msg ? `: ${msg}` : ''}` : (msg ? `Erreur appel: ${msg}` : 'Erreur appel'))
      if (callInviteSentRef.current && wsRef.current?.readyState === WebSocket.OPEN) {
        try {
          const callId = String(activePeerIdRef.current || '').trim()
          wsRef.current.send(
            JSON.stringify({ type: 'call-ended', roomId, from: userId, timestamp: Date.now(), ...(callId ? { callId } : {}) }),
          )
        } catch {
        }
      }
      cleanupPeer()
    }
  }

  startCallRef.current = startCall

  const answerCall = async () => {
    clearIncomingTimeout()
    answerStartedAtRef.current = Date.now()
    armRingKill(20000)
    const offer = pendingOfferRef.current
    const callId = String(incomingCallIdRef.current || activePeerIdRef.current || '').trim()
    if (callId) activePeerIdRef.current = callId
    if (!offer) {
      autoAnswerRef.current = true
      void unlockAudio()
      stopRingtone()
      setIncomingCall(false)
      const acceptedPayload = {
        type: 'call-accepted',
        roomId,
        from: userId,
        fromLabel: String(fromLabel || '').trim() || undefined,
        timestamp: Date.now(),
        ...(callId ? { callId } : {}),
      }
      pendingCallAcceptedRef.current = acceptedPayload
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        try {
          wsRef.current.send(JSON.stringify(acceptedPayload))
          pendingCallAcceptedRef.current = null
        } catch {
        }
      }
      setStatus('Réponse en attente…')
      return
    }
    try {
      stopRingtone()
      setIncomingCall(false)
      const acceptedPayload = {
        type: 'call-accepted',
        roomId,
        from: userId,
        fromLabel: String(fromLabel || '').trim() || undefined,
        timestamp: Date.now(),
        ...(callId ? { callId } : {}),
      }
      pendingCallAcceptedRef.current = acceptedPayload
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        try {
          wsRef.current.send(JSON.stringify(acceptedPayload))
          pendingCallAcceptedRef.current = null
        } catch {
        }
      }
      setStatus('Réponse en cours...')
      await handleOffer(offer, callId || undefined)
      pendingOfferRef.current = null
      answerStartedAtRef.current = 0
    } catch (e: any) {
      const name = e?.name ? String(e.name) : ''
      const msg = e?.message ? String(e.message) : ''
      setStatus(name ? `Erreur réponse (${name})${msg ? `: ${msg}` : ''}` : (msg ? `Erreur réponse: ${msg}` : 'Erreur réponse'))
      cleanupPeer()
      setIncomingCall(false)
    }
  }

  const rejectCall = () => {
    clearIncomingTimeout()
    finalizeHistory('rejected')
    answerStartedAtRef.current = 0
    ringbackMutedRef.current = false
    pendingStartCallAtRef.current = 0
    pendingStartCallSignalRef.current = 0
    pendingAutoCallKeyRef.current = ''
    const callId = String(incomingCallIdRef.current || activePeerIdRef.current || '').trim()
    const endedPayload = { type: 'call-ended', roomId, from: userId, timestamp: Date.now(), ...(callId ? { callId } : {}) }
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const payload = JSON.stringify(endedPayload)
      try {
        wsRef.current.send(payload)
      } catch {
      }
      window.setTimeout(() => {
        if (wsRef.current?.readyState !== WebSocket.OPEN) return
        try {
          wsRef.current.send(payload)
        } catch {
        }
      }, 180)
      window.setTimeout(() => {
        if (wsRef.current?.readyState !== WebSocket.OPEN) return
        try {
          wsRef.current.send(payload)
        } catch {
        }
      }, 420)
    } else {
      pendingCallEndedRef.current = endedPayload
    }
    stopRingtone()
    stopVibrate()
    pendingOfferRef.current = null
    autoAnswerRef.current = false
    incomingCallIdRef.current = ''
    activePeerIdRef.current = ''
    callIntentRef.current = false
    setIncomingCall(false)
    setCallFrom('')
    setCallFromLabel('')
    setStatus('Appel refusé')
  }

  rejectCallRef.current = rejectCall

  const endCall = () => {
    const ridLow = String(roomId || '').trim().toLowerCase()
    const canDirectCall =
      (role === 'client' && ridLow.startsWith('shop:')) ||
      (role === 'vendor' && ridLow.startsWith('client:')) ||
      ((role === 'client' || role === 'vendor') && ridLow.startsWith('support:'))
    const shouldPromptNoAnswer =
      canDirectCall &&
      isCallingRef.current &&
      !isInCallRef.current &&
      !incomingCallRef.current &&
      !callHistoryConnectedAtRef.current
    clearCallHardStop()
    finalizeHistory('ended')
    answerStartedAtRef.current = 0
    ringbackMutedRef.current = false
    pendingStartCallAtRef.current = 0
    pendingStartCallSignalRef.current = 0
    pendingAutoCallKeyRef.current = ''
    const callId = String(incomingCallIdRef.current || activePeerIdRef.current || '').trim()
    const endedPayload = { type: 'call-ended', roomId, from: userId, timestamp: Date.now(), ...(callId ? { callId } : {}) }
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const payload = JSON.stringify(endedPayload)
      try {
        wsRef.current.send(payload)
      } catch {
      }
      window.setTimeout(() => {
        if (wsRef.current?.readyState !== WebSocket.OPEN) return
        try {
          wsRef.current.send(payload)
        } catch {
        }
      }, 180)
      window.setTimeout(() => {
        if (wsRef.current?.readyState !== WebSocket.OPEN) return
        try {
          wsRef.current.send(payload)
        } catch {
        }
      }, 420)
    } else {
      pendingCallEndedRef.current = endedPayload
    }
    cleanupPeer()
    incomingCallIdRef.current = ''
    activePeerIdRef.current = ''
    isInCallRef.current = false
    isCallingRef.current = false
    incomingCallRef.current = false
    setIsInCall(false)
    setIsCalling(false)
    setIncomingCall(false)
    setCallFrom('')
    setCallFromLabel('')
    setStatus(shouldPromptNoAnswer ? 'Aucune réponse' : 'Appel terminé')
    callAttemptStartedAtRef.current = 0
    callRetryCountRef.current = 0
    lastOfferSentAtRef.current = 0
    callIntentRef.current = false
    if (shouldPromptNoAnswer) {
      resetOfflineFlow()
      setOfflineNoAnswer(true)
      setOfflinePromptOpen(true)
    }
    if (onCallEnd) onCallEnd()
    if (!shouldPromptNoAnswer) {
      window.setTimeout(() => {
        maybeReturnToStart()
      }, 120)
    }
  }

  endCallRef.current = endCall

  useEffect(() => {
    const s = Number(hangupSignal || 0)
    if (!Number.isFinite(s) || s <= 0) return
    if (s === hangupSignalRef.current) return
    hangupSignalRef.current = s
    if (incomingCall) {
      rejectCallRef.current()
      return
    }
    if (isInCall || isCalling) endCallRef.current()
  }, [hangupSignal, incomingCall, isInCall, isCalling])

  useEffect(() => {
    const s = Number(startCallSignal || 0)
    if (!Number.isFinite(s) || s <= 0) return
    if (incomingCall || isInCall || isCalling) return
    if (wsRef.current?.readyState !== WebSocket.OPEN) {
      pendingStartCallAtRef.current = Date.now()
      pendingStartCallSignalRef.current = s
      setStatus('Connexion...')
      return
    }
    if (s === startCallSignalRef.current) return
    startCallSignalRef.current = s
    void startCallRef.current()
  }, [startCallSignal, isConnected, incomingCall, isInCall, isCalling])

  useEffect(() => {
    if (incomingCall || isInCall || isCalling) return
    let shouldAutoCall = false
    let key = ''
    try {
      const sp = new URLSearchParams(String(window.location.search || ''))
      shouldAutoCall = String(sp.get('autoCall') || '').trim() === '1'
      if (shouldAutoCall) key = `${role}|${userId}|${roomId}|${sp.get('autoCall')}`
    } catch {
      shouldAutoCall = false
      key = ''
    }
    if (!shouldAutoCall || !key) return
    if (key === autoCallKeyRef.current) return
    try {
      const u = new URL(String(window.location.href || ''))
      if (u.searchParams.get('autoCall') === '1') {
        u.searchParams.delete('autoCall')
        window.history.replaceState(null, '', u.toString())
      }
    } catch {
    }
    if (wsRef.current?.readyState !== WebSocket.OPEN) {
      pendingStartCallAtRef.current = Date.now()
      pendingAutoCallKeyRef.current = key
      setStatus('Connexion...')
      return
    }
    autoCallKeyRef.current = key
    void startCallRef.current()
  }, [isConnected, incomingCall, isInCall, isCalling, role, roomId, userId])

  useEffect(() => {
    if (!isCalling || incomingCall || isInCall) return
    if (!isConnected) return
    const startedAt = callAttemptStartedAtRef.current || 0
    if (!startedAt) return
    if (Date.now() - startedAt > 25000) return
    const last = lastOfferSentAtRef.current || 0
    if (!last) return
    if (Date.now() - last < 4500) return
    if (callRetryCountRef.current >= 3) return
    callRetryCountRef.current += 1
    lastOfferSentAtRef.current = Date.now()
    setStatus('Relance appel...')
    void startCallRef.current()
  }, [onlineUsers.length, isCalling, incomingCall, isInCall, isConnected])

  useEffect(() => {
    if (!isCalling || incomingCall || isInCall) return
    const startedAt = callAttemptStartedAtRef.current || 0
    if (!startedAt) return
    const remaining = Math.max(0, 26000 - (Date.now() - startedAt))
    const id = window.setTimeout(() => {
      if (!isCallingRef.current || isInCallRef.current) return
      if (pendingOfferRef.current) return
      const rid = String(roomId || '').trim().toLowerCase()
      resetOfflineFlow()
      if (role === 'client' && rid.startsWith('shop:')) setStatus('Vendeur hors ligne')
      else if (role === 'vendor' && rid.startsWith('client:')) setStatus('Client hors ligne')
      else setStatus('Hors ligne')
      if (callIntentRef.current) setOfflinePromptOpen(true)
      setIsCalling(false)
      cleanupPeerRef.current()
    }, remaining)
    return () => window.clearTimeout(id)
  }, [isCalling, incomingCall, isInCall, role, roomId])

  /* eslint-disable react-hooks/exhaustive-deps */
  // This effect owns one WebSocket lifecycle per identity tuple; reactive helper deps would reconnect mid-call and break validated behavior.
  useEffect(() => {
    wsShouldReconnectRef.current = true
    wsReconnectAttemptRef.current = 0
    pendingStartCallAtRef.current = 0
    pendingStartCallSignalRef.current = 0
    pendingAutoCallKeyRef.current = ''
    incomingCallIdRef.current = ''
    activePeerIdRef.current = ''
    answerStartedAtRef.current = 0
    resetOfflineFlow()
    stopRingtone()
    stopVibrate()
    clearIncomingTimeout()
    clearCallHardStop()
    pendingOfferRef.current = null
    pendingIceRef.current = []
    autoAnswerRef.current = false
    callInviteSentRef.current = false
    callAttemptStartedAtRef.current = 0
    callRetryCountRef.current = 0
    lastOfferSentAtRef.current = 0
    setIncomingCall(false)
    setIsCalling(false)
    setIsInCall(false)
    setCallFrom('')
    setCallFromLabel('')
    cleanupPeer()

    const clearTimer = () => {
      const t = wsReconnectTimerRef.current
      wsReconnectTimerRef.current = null
      if (!t) return
      try {
        window.clearTimeout(t)
      } catch {
      }
    }

    const scheduleReconnect = () => {
      if (!wsShouldReconnectRef.current) return
      clearTimer()
      wsReconnectAttemptRef.current += 1
      const attempt = wsReconnectAttemptRef.current
      const delay = Math.min(5000, 600 + attempt * 500)
      wsReconnectTimerRef.current = window.setTimeout(() => {
        connect()
      }, delay)
    }

    const connect = () => {
      if (!wsShouldReconnectRef.current) return
      clearTimer()

      try {
        const prev = wsRef.current
        if (prev) {
          try {
            ;(prev as any).onopen = null
            ;(prev as any).onmessage = null
            ;(prev as any).onerror = null
            ;(prev as any).onclose = null
          } catch {
          }
          try {
            prev.close()
          } catch {
          }
        }
      } catch {
      }

      setIsConnected(false)
      const ws = new WebSocket(getWsUrl(0, '/webrtc-ws'))
      wsRef.current = ws

      setStatus('Connexion...')
      ws.onopen = () => {
        wsReconnectAttemptRef.current = 0
        setIsConnected(true)
        setStatus(role === 'client' && forceOffline ? 'Boutique fermée' : (isCallingRef.current ? 'Appel en cours...' : 'Connecté'))
        setOnlineUsers([])
      setRosterReady(false)
      rosterReadyRef.current = false
      setOfflineHint(false)
      offlineHintRef.current = false
      pendingStartCallAfterRosterAtRef.current = 0
        if (!forceOffline) resetOfflineFlow()
        wsLastPongAtRef.current = Date.now()
        if (wsPingTimerRef.current) {
          try {
            window.clearInterval(wsPingTimerRef.current)
          } catch {
          }
          wsPingTimerRef.current = null
        }
        wsPingTimerRef.current = window.setInterval(() => {
          if (wsRef.current?.readyState !== WebSocket.OPEN) return
          const last = wsLastPongAtRef.current || 0
          if (last && Date.now() - last > 35000) {
            try {
              wsRef.current?.close()
            } catch {
            }
            return
          }
          try {
            wsRef.current.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }))
          } catch {
          }
        }, 12000)
        try {
          ws.send(JSON.stringify({ type: 'join-room', roomId, role, userId }))
        } catch {
        }
        try {
          const uid = String(userId || '').trim()
          const rid = String(roomId || '').trim()
          const low = uid.toLowerCase()
          const isIdentity = low.startsWith('client:') || low.startsWith('shop:')
          if (isIdentity && uid !== rid) ws.send(JSON.stringify({ type: 'join-room', roomId: uid, role, userId: uid }))
        } catch {
        }

        const accepted = pendingCallAcceptedRef.current
        if (accepted && wsRef.current?.readyState === WebSocket.OPEN) {
          try {
            wsRef.current.send(JSON.stringify(accepted))
            pendingCallAcceptedRef.current = null
          } catch {
          }
        }

        const pendingAnswer = pendingAnswerRef.current
        if (pendingAnswer && wsRef.current?.readyState === WebSocket.OPEN) {
          try {
            const callId = String(pendingAnswerCallIdRef.current || '').trim()
            wsRef.current.send(
              JSON.stringify({ type: 'answer', roomId, data: pendingAnswer, ...(callId ? { callId } : {}) }),
            )
            pendingAnswerRef.current = null
            pendingAnswerCallIdRef.current = null
          } catch {
          }
        }

        const pendingEnded = pendingCallEndedRef.current
        if (pendingEnded && wsRef.current?.readyState === WebSocket.OPEN) {
          try {
            const payload = JSON.stringify(pendingEnded)
            wsRef.current.send(payload)
            window.setTimeout(() => {
              if (wsRef.current?.readyState !== WebSocket.OPEN) return
              try {
                wsRef.current.send(payload)
              } catch {
              }
            }, 180)
            window.setTimeout(() => {
              if (wsRef.current?.readyState !== WebSocket.OPEN) return
              try {
                wsRef.current.send(payload)
              } catch {
              }
            }, 420)
            pendingCallEndedRef.current = null
          } catch {
          }
        }

        const pendingAt = pendingStartCallAtRef.current || 0
        if (pendingAt && Date.now() - pendingAt < 8000) {
          if (!incomingCallRef.current && !isInCallRef.current && !isCallingRef.current) {
            let shouldTry = false
            try {
              const sp = new URLSearchParams(String(window.location.search || ''))
              const shouldAutoCall = String(sp.get('autoCall') || '').trim() === '1'
              const key = shouldAutoCall ? `${role}|${userId}|${roomId}|${sp.get('autoCall')}` : ''
              const pendingKey = String(pendingAutoCallKeyRef.current || '')
              if (pendingKey && key && pendingKey === key && key !== autoCallKeyRef.current) {
                autoCallKeyRef.current = key
                pendingAutoCallKeyRef.current = ''
                shouldTry = true
              }
            } catch {
            }
            const pendingSignal = Number(pendingStartCallSignalRef.current || 0)
            if (!shouldTry && Number.isFinite(pendingSignal) && pendingSignal > 0 && pendingSignal !== startCallSignalRef.current) {
              startCallSignalRef.current = pendingSignal
              pendingStartCallSignalRef.current = 0
              shouldTry = true
            }
            if (shouldTry) {
              pendingStartCallAtRef.current = 0
              void startCall()
            }
          }
        }
      }

      ws.onmessage = async (event) => {
        let data: any
        try {
          data = JSON.parse(event.data)
        } catch {
          return
        }

        if (data.type === 'pong') {
          wsLastPongAtRef.current = Date.now()
          return
        }

        if (data.type === 'other-users') {
          const msgRoomId = String(data.roomId || '').trim()
          if (msgRoomId && msgRoomId !== roomId) return
          const users = Array.isArray(data.users) ? data.users : []
          const normalized = users
            .map((u: any) => ({ userId: String(u.userId || ''), role: String(u.role || '') }))
            .filter((u: any) => u.userId)
          setOnlineUsers(normalized)
          if (!rosterReadyRef.current) {
            rosterReadyRef.current = true
            setRosterReady(true)
          }
          let isOffline = false
          try {
            const rid = String(roomId || '').trim().toLowerCase()
            if (role === 'client' && rid.startsWith('shop:')) isOffline = !normalized.some((u) => u.role === 'vendor')
            else if (role === 'vendor' && rid.startsWith('client:')) isOffline = !normalized.some((u) => u.role === 'client')
          } catch {
            isOffline = false
          }
          offlineHintRef.current = isOffline
          setOfflineHint(isOffline)
          if (isOffline && !incomingCallRef.current && !isInCallRef.current && !offlinePromptOpen && !offlineMessageOpen) {
            if (isCallingRef.current) {
              try {
                clearCallHardStop()
              } catch {
              }
              try {
                stopRingtone()
                stopVibrate()
              } catch {
              }
              try {
                cleanupPeer()
              } catch {
              }
              setIsCalling(false)
            }
            setStatus(offlineStatusLabel)
            if (callIntentRef.current) setOfflinePromptOpen(true)
          }
          const pendingAt = Number(pendingStartCallAfterRosterAtRef.current || 0)
          if (pendingAt && Date.now() - pendingAt < 2500) {
            pendingStartCallAfterRosterAtRef.current = 0
            if (!incomingCallRef.current && !isInCallRef.current && !isCallingRef.current) {
              if (offlineHintRef.current) {
                setStatus(offlineStatusLabel)
                if (callIntentRef.current) setOfflinePromptOpen(true)
              }
              else void startCall()
            }
          }
          return
        }

        if (data.type === 'joined-room') {
          const msgRoomId = String(data.roomId || '').trim()
          if (msgRoomId && msgRoomId !== roomId) return
          const u = { userId: String(data.userId || ''), role: String(data.role || '') }
          if (!u.userId) return
          setOnlineUsers((prev) => (prev.some((x) => x.userId === u.userId) ? prev : [...prev, u]))
          return
        }

        if (data.type === 'user-left') {
          const msgRoomId = String(data.roomId || '').trim()
          if (msgRoomId && msgRoomId !== roomId) return
          const uid = String(data.userId || '')
          if (!uid) return
          setOnlineUsers((prev) => prev.filter((x) => x.userId !== uid))
          return
        }

        const isActuallyConnectedCall = () => {
          const pc = pcRef.current
          if (!pc) return false
          const cs = pc.connectionState
          const ics = pc.iceConnectionState
          const connected = cs === 'connected' || ics === 'connected' || ics === 'completed'
          if (!connected) return false
          try {
            const liveRemote = pc.getReceivers().some((r) => r?.track && r.track.readyState === 'live')
            return liveRemote
          } catch {
            return true
          }
        }

        if (data.type === 'incoming-call') {
          const msgRoomId = String((data as any).roomId || '').trim()
          if (msgRoomId && msgRoomId !== String(roomId || '').trim()) return
          const answeredAt = Number(answerStartedAtRef.current || 0)
          const incomingCallId = String(data.callId || '').trim()
          const activeCallId = String(activePeerIdRef.current || '').trim()
          if (answeredAt && Date.now() - answeredAt < 1200 && (!incomingCallId || (activeCallId && incomingCallId === activeCallId))) return
          {
            const cm = String((data as any).callMode || '').trim().toLowerCase()
            if (cm === 'audio' || cm === 'video') {
              incomingCallModeRef.current = cm as any
              if (callModeHintRef.current === 'auto') {
                const desired = cm === 'video' && ui === 'full' ? 'video' : 'audio'
                if (activeCallModeRef.current !== desired) setActiveCallModeSafe(desired)
              }
            }
          }
          if (incomingCallId && incomingCallId !== lastIncomingHistoryCallIdRef.current) {
            lastIncomingHistoryCallIdRef.current = incomingCallId
            const from = String(data.from || '').trim()
            const low = from.toLowerCase()
            const peerRoomId = low.startsWith('client:') || low.startsWith('shop:') || low.startsWith('support:') ? from : ''
            const label = String(data.fromLabel || '').trim() || from || peerRoomId
            ensureHistoryForCall({
              callId: incomingCallId,
              direction: 'incoming',
              status: 'ringing',
              peerRoomId,
              peerLabel: label,
            })
          }
          if (incomingCallId) {
            incomingCallIdRef.current = incomingCallId
            if ((isInCallRef.current || isCallingRef.current) && incomingCallId !== activeCallId) {
              cleanupPeer()
              setIsInCall(false)
              setIsCalling(false)
              setIncomingCall(false)
              setCallFrom('')
              setCallFromLabel('')
              activePeerIdRef.current = incomingCallId
            } else if ((isInCallRef.current || isCallingRef.current) && activeCallId && incomingCallId === activeCallId) {
              return
            }
          }
          if ((isInCallRef.current || isCallingRef.current) && !isActuallyConnectedCall()) {
            cleanupPeer()
            setIsInCall(false)
            setIsCalling(false)
            setIncomingCall(false)
            setCallFrom('')
            setCallFromLabel('')
          } else if (isInCallRef.current || isCallingRef.current) {
            return
          }
          armIncomingTimeout()
          setIncomingCall(true)
          {
            const from = String(data.from || '')
            setCallFrom(from)
            const low = from.toLowerCase()
            const peerRoomId = low.startsWith('client:') || low.startsWith('shop:') || low.startsWith('support:') ? from : ''
            if (peerRoomId) saveLastTarget(peerRoomId)
          }
          const label = String(data.fromLabel || '').trim()
          setCallFromLabel(label)
          try {
            onIncomingCall?.({ from: String(data.from || ''), label })
          } catch {
          }
          resetOfflineFlow()
          return
        }

        if (data.type === 'offer') {
          const msgRoomId = String((data as any).roomId || '').trim()
          if (msgRoomId && msgRoomId !== String(roomId || '').trim()) return
          const incomingCallId = String(data.callId || '').trim()
          const activeCallId = String(activePeerIdRef.current || '').trim()
          if (incomingCallId) {
            activePeerIdRef.current = incomingCallId
            incomingCallIdRef.current = incomingCallId
            if (incomingCallId !== lastIncomingHistoryCallIdRef.current) {
              lastIncomingHistoryCallIdRef.current = incomingCallId
              const from = String(data.from || '').trim()
              const peerRoomId =
                from.toLowerCase().startsWith('client:') || from.toLowerCase().startsWith('shop:') ? from : ''
              const label = String(data.fromLabel || '').trim() || from || peerRoomId
              ensureHistoryForCall({
                callId: incomingCallId,
                direction: 'incoming',
                status: 'ringing',
                peerRoomId,
                peerLabel: label,
              })
            }
            if ((isInCallRef.current || isCallingRef.current) && incomingCallId !== activeCallId) {
              cleanupPeer()
              setIsInCall(false)
              setIsCalling(false)
              setIncomingCall(false)
              setCallFrom('')
              setCallFromLabel('')
            } else if ((isInCallRef.current || isCallingRef.current) && activeCallId && incomingCallId === activeCallId) {
              // Renégociation : traiter l'offre sur la connexion existante
              const offer = data.data
              pendingOfferRef.current = null
              try {
                await handleOffer(offer, incomingCallId || undefined)
              } catch {
              }
              return
            }
          }
          if ((isInCallRef.current || isCallingRef.current) && !isActuallyConnectedCall()) {
            cleanupPeer()
            setIsInCall(false)
            setIsCalling(false)
            setIncomingCall(false)
            setCallFrom('')
            setCallFromLabel('')
          } else if (isInCallRef.current || isCallingRef.current) {
            // Renégociation sans callId explicite : traiter l'offre
            const offer = data.data
            pendingOfferRef.current = null
            try {
              await handleOffer(offer)
            } catch {
            }
            return
          }
          const offer = data.data
          try {
            const cm = String((data as any).callMode || '').trim().toLowerCase()
            const inferred = cm === 'audio' || cm === 'video' ? (cm as any) : inferOfferCallMode(offer)
            incomingCallModeRef.current = inferred
            if (callModeHintRef.current === 'auto') {
              const desired = inferred === 'video' && ui === 'full' ? 'video' : 'audio'
              if (activeCallModeRef.current !== desired) setActiveCallModeSafe(desired)
            }
          } catch {
          }
          pendingOfferRef.current = offer
          const answeredAt = Number(answerStartedAtRef.current || 0)
          const shouldAuto =
            autoAnswerRef.current || (answeredAt && Date.now() - answeredAt < 20000)
          if (shouldAuto) {
            autoAnswerRef.current = false
            try {
              clearIncomingTimeout()
              stopRingtone()
              setIncomingCall(false)
              if (wsRef.current?.readyState === WebSocket.OPEN) {
                try {
                  const callId = String(incomingCallIdRef.current || activePeerIdRef.current || '').trim()
                  wsRef.current.send(
                    JSON.stringify({
                      type: 'call-accepted',
                      roomId,
                      from: userId,
                      fromLabel: String(fromLabel || '').trim() || undefined,
                      timestamp: Date.now(),
                      ...(callId ? { callId } : {}),
                    }),
                  )
                } catch {
                }
              }
              setStatus('Réponse en cours...')
              const callId = String(incomingCallIdRef.current || activePeerIdRef.current || '').trim()
              await handleOffer(offer, callId || undefined)
              pendingOfferRef.current = null
              answerStartedAtRef.current = 0
            } catch (e: any) {
              const name = e?.name ? String(e.name) : ''
              const msg = e?.message ? String(e.message) : ''
              setStatus(name ? `Erreur réponse (${name})${msg ? `: ${msg}` : ''}` : (msg ? `Erreur réponse: ${msg}` : 'Erreur réponse'))
              cleanupPeer()
              setIncomingCall(false)
            }
            return
          }
          armIncomingTimeout()
          setIncomingCall(true)
          {
            const from = String(data.from || '')
            setCallFrom(from)
            const peerRoomId =
              from.toLowerCase().startsWith('client:') || from.toLowerCase().startsWith('shop:') ? from : ''
            if (peerRoomId) saveLastTarget(peerRoomId)
          }
          const label = String(data.fromLabel || '').trim()
          setCallFromLabel(label)
          try {
            onIncomingCall?.({ from: String(data.from || ''), label })
          } catch {
          }
          resetOfflineFlow()
          return
        }

        if (data.type === 'answer') {
          const msgRoomId = String((data as any).roomId || '').trim()
          if (msgRoomId && msgRoomId !== String(roomId || '').trim()) return
          const msgCallId = String(data.callId || '').trim()
          const activeCallId = String(activePeerIdRef.current || '').trim()
          if (msgCallId && activeCallId && msgCallId !== activeCallId) return
          const pc = pcRef.current
          if (!pc) return
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(data.data))
            await flushPendingIce(pc)
            stopRingtone()
            setIsInCall(true)
            setIsCalling(false)
            setStatus('En appel')
            markHistoryConnected()
            armRingKill(20000)
            ringbackMutedRef.current = false
            clearCallHardStop()
            callAttemptStartedAtRef.current = 0
            callRetryCountRef.current = 0
            lastOfferSentAtRef.current = 0
          } catch {
          }
          return
        }

        if (data.type === 'call-accepted') {
          const msgRoomId = String((data as any).roomId || '').trim()
          if (msgRoomId && msgRoomId !== String(roomId || '').trim()) return
          const msgCallId = String(data.callId || '').trim()
          const activeCallId = String(activePeerIdRef.current || '').trim()
          if (msgCallId && activeCallId && msgCallId !== activeCallId) return
          if (!isCallingRef.current || isInCallRef.current) return
          stopRingtone()
          ringbackMutedRef.current = true
          armRingKill(20000)
          setStatus('Connexion...')
          return
        }

        if (data.type === 'ice-candidate') {
          const msgRoomId = String((data as any).roomId || '').trim()
          if (msgRoomId && msgRoomId !== String(roomId || '').trim()) return
          const msgCallId = String(data.callId || '').trim()
          const activeCallId = String(activePeerIdRef.current || '').trim()
          if (msgCallId && activeCallId && msgCallId !== activeCallId) return
          const pc = pcRef.current
          if (!pc) return
          const cand = data.data as RTCIceCandidateInit
          if (pc.remoteDescription) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(cand))
            } catch {
            }
          } else {
            pendingIceRef.current.push(cand)
          }
          return
        }

        if (data.type === 'call-ended') {
          const msgRoomId = String((data as any).roomId || '').trim()
          if (msgRoomId && msgRoomId !== String(roomId || '').trim()) return
          const msgCallId = String(data.callId || '').trim()
          const activeCallId = String(activePeerIdRef.current || '').trim()
          const incomingCallId = String(incomingCallIdRef.current || '').trim()
          if (msgCallId && (activeCallId || incomingCallId) && msgCallId !== activeCallId && msgCallId !== incomingCallId) return
          const ridLow = String(roomId || '').trim().toLowerCase()
          const canDirectCall =
            (role === 'client' && ridLow.startsWith('shop:')) ||
            (role === 'vendor' && ridLow.startsWith('client:')) ||
            ((role === 'client' || role === 'vendor') && ridLow.startsWith('support:'))
          const shouldPromptNoAnswer =
            canDirectCall &&
            isCallingRef.current &&
            !isInCallRef.current &&
            !incomingCallRef.current &&
            !callHistoryConnectedAtRef.current
          const endedStatus = callHistoryConnectedAtRef.current
            ? 'ended'
            : (incomingCallRef.current ? 'missed' : 'ended')
          finalizeHistory(endedStatus)
          pendingStartCallAtRef.current = 0
          pendingStartCallSignalRef.current = 0
          pendingAutoCallKeyRef.current = ''
          ringbackMutedRef.current = false
          pendingAnswerRef.current = null
          pendingCallAcceptedRef.current = null
          pendingAnswerCallIdRef.current = null
          answerStartedAtRef.current = 0
          armRingKill(20000)
          cleanupPeer()
          incomingCallIdRef.current = ''
          activePeerIdRef.current = ''
          isInCallRef.current = false
          isCallingRef.current = false
          incomingCallRef.current = false
          setIsInCall(false)
          setIsCalling(false)
          setIncomingCall(false)
          setCallFrom('')
          setCallFromLabel('')
          if (shouldPromptNoAnswer) {
            resetOfflineFlow()
            setOfflineNoAnswer(true)
            setOfflinePromptOpen(true)
            setStatus('Aucune réponse')
          } else {
            setStatus("Appel terminé par l'autre utilisateur")
          }
          autoAnswerRef.current = false
          callAttemptStartedAtRef.current = 0
          callRetryCountRef.current = 0
          lastOfferSentAtRef.current = 0
          if (!shouldPromptNoAnswer) {
            window.setTimeout(() => {
              maybeReturnToStart()
            }, 120)
          }
          return
        }
      }

      ws.onclose = () => {
        if (wsRef.current !== ws) return
        setIsConnected(false)
        setStatus('Déconnecté')
        answerStartedAtRef.current = 0
        setRosterReady(false)
        rosterReadyRef.current = false
        setOfflineHint(false)
        offlineHintRef.current = false
        pendingStartCallAfterRosterAtRef.current = 0
        stopRingtone()
        stopVibrate()
        clearIncomingTimeout()
        clearCallHardStop()
        pendingOfferRef.current = null
        pendingIceRef.current = []
        autoAnswerRef.current = false
        callInviteSentRef.current = false
        callAttemptStartedAtRef.current = 0
        callRetryCountRef.current = 0
        lastOfferSentAtRef.current = 0
        incomingCallIdRef.current = ''
        activePeerIdRef.current = ''
        setIncomingCall(false)
        setIsCalling(false)
        setIsInCall(false)
        setCallFrom('')
        setCallFromLabel('')
        cleanupPeer()
        if (wsPingTimerRef.current) {
          try {
            window.clearInterval(wsPingTimerRef.current)
          } catch {
          }
          wsPingTimerRef.current = null
        }
        scheduleReconnect()
      }

      ws.onerror = () => {
        if (wsRef.current !== ws) return
        setStatus('Erreur de connexion')
        setIsConnected(false)
      }
    }

    connect()

    return () => {
      wsShouldReconnectRef.current = false
      clearTimer()
      if (wsPingTimerRef.current) {
        try {
          window.clearInterval(wsPingTimerRef.current)
        } catch {
        }
        wsPingTimerRef.current = null
      }
      try {
        wsRef.current?.close()
      } catch {
      }
      pendingStartCallAtRef.current = 0
      pendingStartCallSignalRef.current = 0
      pendingAutoCallKeyRef.current = ''
      answerStartedAtRef.current = 0
      stopRingtone()
      stopVibrate()
      clearIncomingTimeout()
      clearCallHardStop()
      pendingOfferRef.current = null
      pendingIceRef.current = []
      autoAnswerRef.current = false
      callInviteSentRef.current = false
      callAttemptStartedAtRef.current = 0
      callRetryCountRef.current = 0
      lastOfferSentAtRef.current = 0
      incomingCallIdRef.current = ''
      activePeerIdRef.current = ''
      setIncomingCall(false)
      setIsCalling(false)
      setIsInCall(false)
      setCallFrom('')
      setCallFromLabel('')
      cleanupPeer()
    }
  }, [roomId, role, userId])
  /* eslint-enable react-hooks/exhaustive-deps */

  return (
    <div ref={fullscreenTargetRef as any} className="flex flex-col h-full min-h-0 bg-gradient-to-b from-gray-950 to-gray-900 text-white">
      <div className="bg-gray-900/60 backdrop-blur border-b border-white/10 p-4 flex justify-between items-center gap-3">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm">{status}</span>
          {isInCall && <span className="text-sm text-gray-300">• {formatTimer(callElapsedSeconds)}</span>}
        </div>
        <div className="flex items-center gap-2">
          {(isInCall || isCalling) && (
            <button
              type="button"
              onClick={endCall}
              className="px-3 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-semibold flex items-center gap-2"
            >
              <PhoneOff className="w-4 h-4" />
              Raccrocher
            </button>
          )}
          {showVideoUi && (
            <>
              <button
                type="button"
                onClick={switchCamera}
                className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold flex items-center gap-2"
              >
                <Camera className="w-4 h-4" />
                Caméra
              </button>
              <button
                type="button"
                onClick={toggleFullscreen}
                className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold flex items-center gap-2"
              >
                {(document as any)?.fullscreenElement ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                Plein écran
              </button>
            </>
          )}
          <div className="text-sm font-medium">
            {role === 'vendor' ? 'Vendeur' : 'Client'} • ID: {String(fromLabel || userId || '').trim() || (role === 'vendor' ? 'Vendeur' : 'Client')} • Salon: {roomId}
          </div>
        </div>
      </div>

      <div className="flex-1 relative bg-black">
        <audio ref={remoteAudioRef as any} autoPlay playsInline className="absolute w-0 h-0 opacity-0 pointer-events-none" />
        <video
          ref={remoteVideoRef as any}
          autoPlay
          playsInline
          muted
          x5-video-player-type="h5"
          x5-video-player-fullscreen="true"
          webkit-playsinline="true"
          className={
            !showVideoUi
              ? 'hidden'
              : `w-full h-full ${String(videoFit || 'cover') === 'contain' ? 'object-contain' : 'object-cover'}`
          }
        />
        <div
          className={
            !showVideoUi
              ? 'hidden'
              : `absolute top-4 right-4 ${
                  pipSize === 'xl'
                    ? 'w-72 h-52'
                    : pipSize === 'lg'
                      ? 'w-60 h-44'
                      : pipSize === 'md'
                        ? 'w-44 h-32'
                        : 'w-32 h-24'
                } bg-gray-800 rounded-lg overflow-hidden z-20`
          }
        >
          <video
            ref={localVideoRef as any}
            autoPlay
            playsInline
            muted
            className={`w-full h-full ${String(videoFit || 'cover') === 'contain' ? 'object-contain' : 'object-cover'}`}
          />
        </div>

        {ui === 'full' && activeCallMode === 'audio' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
            <img src={mangooLogoUrl} alt="Mangoo Tech" className="w-14 h-14 opacity-95" />
            <div className="mt-4 text-xs font-semibold tracking-wide uppercase text-gray-300">Mangoo Connect+</div>
            <div className="mt-6 w-36 h-36 rounded-full bg-[#1b5e20] p-[4px] shadow-2xl">
              <div className="w-full h-full rounded-full bg-gray-950 flex items-center justify-center text-6xl font-black">
                {role === 'vendor' ? 'V' : 'C'}
              </div>
            </div>
            <div className="mt-6 text-2xl font-black">{role === 'vendor' ? 'Vendeur' : 'Client'}</div>
            <div className="mt-3 text-gray-200 text-lg font-semibold">
              {incomingCall
                ? 'Ça sonne'
                : isCalling
                  ? 'Appel...'
                  : (isInCall ? 'En appel' : (shouldOfferOfflineMessage ? offlineStatusLabel : (isConnected ? 'Prêt' : 'Connexion...')))}
            </div>
            {isInCall && <div className="text-3xl font-mono mt-3">{formatTimer(callElapsedSeconds)}</div>}
          </div>
        )}

        {ui === 'simple' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
            <img src={mangooLogoUrl} alt="Mangoo Tech" className="w-12 h-12 opacity-95" />
            <div className="mt-3 text-xs font-semibold tracking-wide uppercase text-gray-300">Mangoo Connect+</div>
            <div className="mt-5 w-28 h-28 rounded-full bg-[#1b5e20] p-[3px] shadow-2xl">
              <div className="w-full h-full rounded-full bg-gray-950 flex items-center justify-center text-4xl font-bold">
                {role === 'vendor' ? 'V' : 'C'}
              </div>
            </div>
            <div className="mt-5 text-xl font-semibold">{role === 'vendor' ? 'Vendeur' : 'Client'}</div>
            <div className="text-gray-300 mt-2">{isInCall ? 'En appel' : status}</div>
            {isInCall && <div className="text-2xl font-mono mt-2">{formatTimer(callElapsedSeconds)}</div>}
            <div className="text-gray-500 mt-2 break-all">ID: {String(fromLabel || userId || '').trim() || (role === 'vendor' ? 'Vendeur' : 'Client')}</div>
            <div className="text-gray-500 mt-1 break-all">Salon: {roomId}</div>
          </div>
        )}

        {ui === 'ultra' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
            <img src={mangooLogoUrl} alt="Mangoo Tech" className="w-14 h-14 opacity-95" />
            <div className="mt-4 w-36 h-36 rounded-full bg-[#1b5e20] p-[4px] shadow-2xl">
              <div className="w-full h-full rounded-full bg-gray-950 flex items-center justify-center text-6xl font-black">
                {role === 'vendor' ? 'V' : 'C'}
              </div>
            </div>
            <div className="mt-6 text-2xl font-black">{role === 'vendor' ? 'Vendeur' : 'Client'}</div>
            <div className="mt-3 text-gray-200 text-lg font-semibold">
              {incomingCall
                ? 'Ça sonne'
                : isCalling
                  ? 'Appel...'
                  : (isInCall ? 'En appel' : (shouldOfferOfflineMessage ? offlineStatusLabel : (isConnected ? 'Prêt' : 'Connexion...')))}
            </div>
            {isInCall && <div className="text-3xl font-mono mt-3">{formatTimer(callElapsedSeconds)}</div>}
          </div>
        )}
        {incomingCall && (
          <div className="absolute inset-0 bg-black/75 flex items-center justify-center">
            <div className="bg-gray-900/70 backdrop-blur border border-white/10 p-6 rounded-2xl text-center max-w-sm w-[92%]">
              <img src={mangooLogoUrl} alt="Mangoo Tech" className="w-10 h-10 mx-auto opacity-95" />
              <div className="mt-3 text-xs font-semibold tracking-wide uppercase text-gray-300">Mangoo Connect+</div>
              <div className="mt-4 text-xl font-black">Appel entrant</div>
              <div className="mt-4 w-24 h-24 rounded-full bg-[#1b5e20] p-[3px] shadow-2xl mx-auto">
                <div className="w-full h-full rounded-full bg-gray-950 flex items-center justify-center text-3xl font-black">
                  {String((callFromLabel || callFrom || 'I').trim()).slice(0, 1).toUpperCase()}
                </div>
              </div>
              <div className="mt-4 text-lg font-semibold">
                {callFromLabel || 'Inconnu'}
              </div>
              <div className="text-sm text-gray-300 mt-1 break-all">
                {callFrom ? `ID: ${callFrom}` : ''}
              </div>
              {(!audioUnlocked || ringtoneBlocked) && (
                <div className="mt-4 text-sm text-gray-200">
                  Sonnerie peut être bloquée par le navigateur — touchez l’écran une fois
                </div>
              )}
              <div className="mt-5 flex space-x-4">
                <button
                  onClick={answerCall}
                  className="flex-1 bg-[#1b5e20] hover:bg-[#16381a] px-6 py-3 rounded-xl flex items-center justify-center space-x-2 font-semibold"
                >
                  <Phone className="w-5 h-5" />
                  <span>Répondre</span>
                </button>
                <button
                  onClick={rejectCall}
                  className="flex-1 bg-white/10 hover:bg-white/15 px-6 py-3 rounded-xl flex items-center justify-center space-x-2 font-semibold"
                >
                  <PhoneOff className="w-5 h-5" />
                  <span>Refuser</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {isCalling && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10 pointer-events-none">
            <div className="text-center">
              <div className="animate-pulse text-2xl mb-4"><Phone className="w-10 h-10 mx-auto text-[#1b5e20]" /></div>
              <div className="text-lg">Appel en cours...</div>
              <div className="text-sm text-gray-200 mt-2">Vous appelez : {callTargetLabel}</div>
            </div>
          </div>
        )}

        {offlinePromptOpen && !offlineMessageOpen && !isInCall && !incomingCall && !isCalling && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
            <div className="bg-gray-900/70 backdrop-blur border border-white/10 p-6 rounded-2xl max-w-md w-full">
              <img src={mangooLogoUrl} alt="Mangoo Tech" className="w-10 h-10 opacity-95" />
              <div className="mt-3 text-xs font-semibold tracking-wide uppercase text-gray-300">Mangoo Connect+</div>
              <div className="mt-4 text-2xl font-black">{offlineStatusLabel}</div>
              <div className="text-sm text-gray-300 mt-2">L’autre personne est indisponible.</div>
              <div className="mt-6 space-y-3">
                <button
                  onClick={openOfflineComposer}
                  className="w-full bg-[#1b5e20] hover:bg-[#16381a] px-6 py-3 rounded-xl font-black text-lg"
                >
                  Laisser un message
                </button>
                <button onClick={closeOfflineUi} className="w-full bg-white/10 hover:bg-white/15 px-6 py-3 rounded-xl font-semibold">
                  Fermer
                </button>
              </div>
            </div>
          </div>
        )}

        {offlineMessageOpen && !isInCall && !incomingCall && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
            <div className="bg-gray-900/70 backdrop-blur border border-white/10 p-6 rounded-2xl max-w-md w-full max-h-[85vh] overflow-y-auto">
              <div className="text-xl font-semibold">
                {offlineStatusLabel}
              </div>
              <div className="text-sm text-gray-300 mt-1">Laissez un message vocal ou demandez un rappel.</div>

              <div className="mt-5 space-y-4">
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="font-semibold">Message vocal</div>
                  <div className="text-xs text-gray-400 mt-1">30 secondes max</div>
                  <div className="mt-3 flex flex-wrap gap-3">
                    {voiceStatus !== 'recording' && (
                      <button
                        onClick={startRecording}
                        className="bg-white/10 hover:bg-white/15 px-4 py-2 rounded-lg font-semibold"
                      >
                        Enregistrer
                      </button>
                    )}
                    {voiceStatus === 'recording' && (
                      <button onClick={stopRecording} className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg font-semibold">
                        Stop
                      </button>
                    )}
                    <button
                      onClick={submitVoiceMessage}
                      disabled={!voiceDataUrl || voiceStatus === 'sending' || voiceStatus === 'sent'}
                      className={`px-4 py-2 rounded-lg font-semibold ${
                        !voiceDataUrl || voiceStatus === 'sending' || voiceStatus === 'sent'
                          ? 'bg-white/10 opacity-50 cursor-not-allowed'
                          : 'bg-[#1b5e20] hover:bg-[#16381a]'
                      }`}
                    >
                      {voiceStatus === 'sending' ? 'Envoi...' : voiceStatus === 'sent' ? 'Envoyé' : 'Envoyer'}
                    </button>
                  </div>
                  {voiceDataUrl && (
                    <div className="mt-3">
                      <audio controls src={voiceDataUrl} className="w-full" />
                    </div>
                  )}
                  {voiceStatus === 'recording' && <div className="text-sm text-gray-200 mt-2">Enregistrement…</div>}
                  {voiceStatus === 'error' && <div className="text-sm text-red-300 mt-2">Erreur micro ou enregistrement</div>}
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="font-semibold">Demander rappel</div>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => setCallbackPreferred('pstn')}
                      className={`px-3 py-2 rounded-lg text-sm font-semibold ${
                        callbackPreferred === 'pstn' ? 'bg-white/15' : 'bg-white/10 hover:bg-white/15'
                      }`}
                    >
                      Téléphone
                    </button>
                    <button
                      onClick={() => setCallbackPreferred('connectplus')}
                      className={`px-3 py-2 rounded-lg text-sm font-semibold ${
                        callbackPreferred === 'connectplus' ? 'bg-white/15' : 'bg-white/10 hover:bg-white/15'
                      }`}
                    >
                      Connect+
                    </button>
                  </div>
                  <div className="mt-3 space-y-2">
                    {callbackPreferred === 'pstn' ? (
                      <input
                        value={callbackPhone}
                        onChange={(e) => setCallbackPhone(e.target.value)}
                        placeholder="Téléphone (secours)"
                        className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 outline-none focus:border-white/20"
                        inputMode="tel"
                      />
                    ) : (
                      <input
                        value={callbackConnectPlusId}
                        onChange={(e) => setCallbackConnectPlusId(e.target.value)}
                        placeholder="ID Connect+ / PIN client"
                        className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 outline-none focus:border-white/20"
                      />
                    )}
                    <input
                      value={callbackName}
                      onChange={(e) => setCallbackName(e.target.value)}
                      placeholder="Nom (optionnel)"
                      className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 outline-none focus:border-white/20"
                    />
                  </div>
                  <div className="mt-3 flex gap-3">
                    <button
                      onClick={submitCallbackRequest}
                      disabled={
                        callbackStatus === 'sending' ||
                        callbackStatus === 'sent' ||
                        (callbackPreferred === 'pstn' ? !String(callbackPhone || '').trim() : !String(callbackConnectPlusId || '').trim())
                      }
                      className={`px-4 py-2 rounded-lg font-semibold ${
                        callbackStatus === 'sending' ||
                        callbackStatus === 'sent' ||
                        (callbackPreferred === 'pstn' ? !String(callbackPhone || '').trim() : !String(callbackConnectPlusId || '').trim())
                          ? 'bg-white/10 opacity-50 cursor-not-allowed'
                          : 'bg-[#1b5e20] hover:bg-[#16381a]'
                      }`}
                    >
                      {callbackStatus === 'sending' ? 'Envoi...' : callbackStatus === 'sent' ? 'Envoyé' : 'Envoyer'}
                    </button>
                  </div>
                  {callbackStatus === 'error' && <div className="text-sm text-red-300 mt-2">Erreur envoi rappel</div>}
                </div>
              </div>

              <div className="mt-5 pt-4 sticky bottom-0 bg-gray-900/70 backdrop-blur flex justify-end">
                <button onClick={closeOfflineUi} className="bg-white/10 hover:bg-white/15 px-4 py-2 rounded-lg font-semibold">
                  Fermer
                </button>
              </div>
            </div>
          </div>
        )}

        {showVendorInbox && (role === 'vendor' || role === 'client') && !incomingCall && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
            <div className="bg-gray-900/70 backdrop-blur border border-white/10 p-6 rounded-2xl max-w-lg w-full">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-xl font-semibold">Répondeur Connect+</div>
                  <div className="text-sm text-gray-300 mt-1">{vendorInboxFilter === 'new' ? 'Messages non lus' : 'Tous les messages'}</div>
                </div>
                <button
                  onClick={() => setShowVendorInbox(false)}
                  className="bg-white/10 hover:bg-white/15 px-4 py-2 rounded-lg font-semibold"
                >
                  Fermer
                </button>
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => setVendorInboxFilter('new')}
                  className={`px-3 py-2 rounded-lg text-sm font-semibold ${
                    vendorInboxFilter === 'new' ? 'bg-white/15' : 'bg-white/10 hover:bg-white/15'
                  }`}
                >
                  Non lus
                </button>
                <button
                  type="button"
                  onClick={() => setVendorInboxFilter('all')}
                  className={`px-3 py-2 rounded-lg text-sm font-semibold ${
                    vendorInboxFilter === 'all' ? 'bg-white/15' : 'bg-white/10 hover:bg-white/15'
                  }`}
                >
                  Tous
                </button>
              </div>

              <div className="mt-5 space-y-3 max-h-[55vh] overflow-auto">
                {vendorMessages.length === 0 && <div className="text-sm text-gray-300">Aucun message</div>}
                {vendorMessages.map((m: any) => (
                  <div key={String(m.id || '')} className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="font-semibold">
                          {String(m.kind || '') === 'callback' ? 'Demande de rappel' : 'Message vocal'}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {m.fromLabel ? String(m.fromLabel) : 'Client'}{m.fromUserId ? ` • ${String(m.fromUserId)}` : ''}{m.createdAt ? ` • ${String(m.createdAt).slice(0, 19).replace('T', ' ')}` : ''}
                        </div>
                      </div>
                      <button
                        onClick={() => void markMessageRead(String(m.id || '')).catch(() => {})}
                        className="bg-white/10 hover:bg-white/15 px-3 py-2 rounded-lg text-sm font-semibold"
                      >
                        Marquer lu
                      </button>
                    </div>
                    {String(m.kind || '') === 'voice' && m.dataUrl && (
                      <div className="mt-3">
                        <audio controls src={String(m.dataUrl)} className="w-full" />
                      </div>
                    )}
                    {String(m.kind || '') === 'callback' && (
                      <div className="mt-3 text-sm">
                        <div className="text-gray-200">
                          {m.callbackPreferred === 'connectplus' ? 'Préférence: Connect+' : 'Préférence: Téléphone'}
                        </div>
                        {m.connectPlusId && (
                          <div className="mt-2">
                            <div className="text-gray-200">ID Connect+: {String(m.connectPlusId)}</div>
                            <a
                              href={getConnectPlusLink({ role: 'client', connectPlusId: String(m.connectPlusId) })}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-block mt-2 bg-white/10 hover:bg-white/15 px-3 py-2 rounded-lg text-sm font-semibold"
                            >
                              Ouvrir lien client
                            </a>
                          </div>
                        )}
                        {m.phone && <div className="mt-2 text-gray-200">{String(m.phone)}</div>}
                        {m.name && <div className="text-gray-400">{String(m.name)}</div>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {showVendorContacts && (role === 'vendor' || role === 'client') && !incomingCall && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
            <div className="bg-gray-900/70 backdrop-blur border border-white/10 p-6 rounded-2xl max-w-lg w-full">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-xl font-semibold">Contacts Connect+</div>
                  <div className="text-sm text-gray-300 mt-1">Derniers clients (dédupliqués)</div>
                </div>
                <button
                  onClick={() => setShowVendorContacts(false)}
                  className="bg-white/10 hover:bg-white/15 px-4 py-2 rounded-lg font-semibold"
                >
                  Fermer
                </button>
              </div>

              <div className="mt-5 space-y-3 max-h-[55vh] overflow-auto">
                {vendorContacts.length === 0 && <div className="text-sm text-gray-300">Aucun contact</div>}
                {vendorContacts.map((c: any) => (
                  <div key={String(c.key)} className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="font-semibold truncate">{c.name || c.fromLabel || 'Client'}</div>
                        <div className="text-xs text-gray-400 mt-1 break-all">
                          {c.phone ? `Téléphone: ${c.phone}` : (c.connectPlusId ? `ID Connect+: ${c.connectPlusId}` : (c.fromUserId ? `ID: ${c.fromUserId}` : ''))}
                          {c.createdAt ? ` • ${String(c.createdAt).slice(0, 19).replace('T', ' ')}` : ''}
                        </div>
                      </div>
                      <div className="shrink-0 flex flex-col gap-2">
                        {c.phone && (
                          <a
                            href={`tel:${String(c.phone)}`}
                            className="bg-white/10 hover:bg-white/15 px-3 py-2 rounded-lg text-sm font-semibold text-center"
                          >
                            Appeler
                          </a>
                        )}
                        {c.connectPlusId && role === 'vendor' && (
                          <a
                            href={getConnectPlusLink({ role: 'vendor', connectPlusId: String(c.connectPlusId) })}
                            target="_blank"
                            rel="noreferrer"
                            className="bg-white/10 hover:bg-white/15 px-3 py-2 rounded-lg text-sm font-semibold text-center"
                          >
                            Appeler (Connect+)
                          </a>
                        )}
                        {c.connectPlusId && (
                          <a
                            href={getConnectPlusLink({ role: 'client', connectPlusId: String(c.connectPlusId) })}
                            target="_blank"
                            rel="noreferrer"
                            className="bg-white/10 hover:bg-white/15 px-3 py-2 rounded-lg text-sm font-semibold text-center"
                          >
                            Lien
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {showCallHistory && (role === 'vendor' || role === 'client') && !incomingCall && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
            <div className="bg-gray-900/70 backdrop-blur border border-white/10 p-6 rounded-2xl max-w-lg w-full">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-xl font-semibold">Historique des appels</div>
                  <div className="text-sm text-gray-300 mt-1">Derniers appels</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      try {
                        localStorage.removeItem(getCallHistoryKey())
                      } catch {
                      }
                      setCallHistory([])
                    }}
                    className="bg-white/10 hover:bg-white/15 px-4 py-2 rounded-lg font-semibold"
                  >
                    Vider
                  </button>
                  <button
                    onClick={() => setShowCallHistory(false)}
                    className="bg-white/10 hover:bg-white/15 px-4 py-2 rounded-lg font-semibold"
                  >
                    Fermer
                  </button>
                </div>
              </div>

              <div className="mt-5 space-y-3 max-h-[55vh] overflow-auto">
                {callHistory.length === 0 && <div className="text-sm text-gray-300">Aucun appel</div>}
                {callHistory.map((h) => (
                  <div key={h.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="font-semibold truncate">
                          {h.direction === 'incoming' ? 'Entrant' : 'Sortant'} • {h.peerLabel || h.peerRoomId || 'Inconnu'}
                        </div>
                        <div className="text-xs text-gray-400 mt-1 break-all">
                          {h.peerRoomId ? `ID: ${h.peerRoomId}` : ''}
                          {h.at ? ` • ${new Date(h.at).toLocaleString()}` : ''}
                          {typeof h.durationSec === 'number' ? ` • ${formatTimer(h.durationSec)}` : ''}
                          {h.status ? ` • ${h.status}` : ''}
                        </div>
                      </div>
                      <div className="shrink-0 flex flex-col gap-2">
                        {h.peerRoomId && !isInCall && !isCalling && !incomingCall && (
                          <button
                            onClick={() => {
                              const rid = String(h.peerRoomId || '').trim()
                              if (!rid) return
                              saveLastTarget(rid)
                              setShowCallHistory(false)
                              if (rid === String(roomId || '').trim()) {
                                if (!incomingCallRef.current && !isInCallRef.current && !isCallingRef.current) void startCall()
                                return
                              }
                              const qs = new URLSearchParams()
                              qs.set('role', role)
                              qs.set('roomId', rid)
                              qs.set('ui', ui)
                              qs.set('autoCall', '1')
                              qs.set('call', activeCallModeRef.current === 'video' && ui === 'full' ? 'video' : 'audio')
                              qs.set('returnRoomId', String(roomId || '').trim())
                              qs.set('returnUi', ui)
                              if (String(userId || '').trim()) qs.set('returnUserId', String(userId || '').trim())
                              if (String(fromLabel || '').trim()) qs.set('returnFromLabel', String(fromLabel || '').trim())
                              if (String(userId || '').trim()) qs.set('userId', String(userId || '').trim())
                              if (String(fromLabel || '').trim()) qs.set('fromLabel', String(fromLabel || '').trim())
                              navigate(`/webrtc?${qs.toString()}`)
                            }}
                            className="bg-white/10 hover:bg-white/15 px-3 py-2 rounded-lg text-sm font-semibold text-center"
                          >
                            Rappeler
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {showDialPad && !incomingCall && !isInCall && !isCalling && (
          <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
            <div className="bg-gray-900/70 backdrop-blur border border-white/10 rounded-2xl max-w-sm w-full max-h-[95vh] overflow-y-auto">
              <div className="p-4 flex items-center justify-between gap-4">
                <div>
                  <div className="text-xl font-semibold">Appeler un ID (PIN)</div>
                  <div className="text-sm text-gray-300 mt-1">Tapez le code (boutique ou client)</div>
                </div>
                <button
                  onClick={closeDialPad}
                  disabled={dialBusy}
                  className="bg-white/10 hover:bg-white/15 px-4 py-2 rounded-lg font-semibold"
                >
                  Fermer
                </button>
              </div>

              <div className="px-4 pb-4">
                <div className="mt-1 flex justify-center gap-2">
                  {Array.from({ length: 6 }).map((_, i) => {
                    const v = normalizePin(dialPin)[i] || ''
                    return (
                      <div
                        key={i}
                        className="w-9 h-11 sm:w-10 sm:h-12 rounded-xl bg-black/30 border border-white/10 flex items-center justify-center text-2xl font-black"
                      >
                        {v || '•'}
                      </div>
                    )
                  })}
                </div>

                {dialError && (
                  <div className="mt-3 text-sm text-red-200 bg-red-950/30 border border-red-500/20 rounded-xl px-3 py-2">
                    {dialError}
                  </div>
                )}

                <div className="mt-4 grid grid-cols-3 gap-2">
                  {['1','2','3','4','5','6','7','8','9'].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => pushDialDigit(d)}
                      disabled={dialBusy}
                      className="bg-white/10 hover:bg-white/15 rounded-2xl h-14 sm:h-16 text-2xl sm:text-3xl font-black disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {d}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={clearDial}
                    disabled={dialBusy}
                    className="bg-white/10 hover:bg-white/15 rounded-2xl h-14 sm:h-16 text-base font-black disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Effacer
                  </button>
                  <button
                    type="button"
                    onClick={() => pushDialDigit('0')}
                    disabled={dialBusy}
                    className="bg-white/10 hover:bg-white/15 rounded-2xl h-14 sm:h-16 text-2xl sm:text-3xl font-black disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    0
                  </button>
                  <button
                    type="button"
                    onClick={backspaceDial}
                    disabled={dialBusy}
                    className="bg-white/10 hover:bg-white/15 rounded-2xl h-14 sm:h-16 text-2xl font-black disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ←
                  </button>
                </div>
              </div>

              <div className="px-4 pb-3 sticky bottom-0 bg-gray-900/70 backdrop-blur">
                <button
                  type="button"
                  onClick={() => void dialConnectPlusId()}
                  disabled={dialBusy || normalizePin(dialPin).length < 4}
                  className={`w-full px-4 py-3.5 rounded-2xl font-black ${
                    dialBusy || normalizePin(dialPin).length < 4
                      ? 'bg-white/10 opacity-50 cursor-not-allowed'
                      : 'bg-[#1b5e20] hover:bg-[#16381a]'
                  }`}
                >
                  {dialBusy ? 'Recherche...' : 'Appeler'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-gray-900/60 backdrop-blur border-t border-white/10 p-4">
        {ui === 'ultra' ? (
          <div className="max-w-xl mx-auto w-full">
            {!incomingCall && !isCalling && !isInCall && (
              <button
                onClick={() => {
                  requestCallOrOffline()
                }}
                className="w-full bg-[#1b5e20] hover:bg-[#16381a] px-7 py-4 rounded-2xl flex items-center justify-center gap-3 font-black text-xl shadow-lg shadow-black/30"
              >
                <Phone className="w-7 h-7" />
                <span>{shouldOfferOfflineMessage || offlinePromptOpen || offlineMessageOpen ? 'Message' : callPrimaryLabel}</span>
              </button>
            )}

            {shouldOfferOfflineMessage && !offlinePromptOpen && !offlineMessageOpen && !incomingCall && !isCalling && !isInCall && (
              <button
                onClick={openOfflineMessageFlow}
                className="w-full mt-3 bg-white/10 hover:bg-white/15 px-7 py-4 rounded-2xl flex items-center justify-center gap-3 font-black text-xl"
              >
                <Phone className="w-7 h-7" />
                <span>Laisser un message</span>
              </button>
            )}

            {(isInCall || isCalling) && (
              <button
                onClick={endCall}
                className="w-full bg-red-500 hover:bg-red-600 px-7 py-4 rounded-2xl flex items-center justify-center gap-3 font-black text-xl"
              >
                <PhoneOff className="w-7 h-7" />
                <span>Raccrocher</span>
              </button>
            )}

            {!incomingCall && !isCalling && !isInCall && (
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <button
                  onClick={() => {
                    setShowVendorInbox(false)
                    setShowVendorContacts(false)
                    setShowCallHistory(false)
                    openDialPad()
                  }}
                  className="bg-white/10 hover:bg-white/15 rounded-2xl px-4 py-4 font-black flex flex-col items-center gap-2"
                >
                  <Hash className="w-7 h-7" />
                  <span>ID</span>
                </button>
                <button
                  onClick={() => {
                    setVendorInboxFilter('new')
                    setShowVendorContacts(false)
                    setShowCallHistory(false)
                    setShowVendorInbox(true)
                  }}
                  className="bg-white/10 hover:bg-white/15 rounded-2xl px-4 py-4 font-black flex flex-col items-center gap-2"
                >
                  <div className="relative">
                    <Phone className="w-7 h-7" />
                    {vendorUnreadCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-black rounded-full min-w-[22px] h-[22px] px-1 flex items-center justify-center">
                        {vendorUnreadCount > 99 ? '99+' : vendorUnreadCount}
                      </span>
                    )}
                  </div>
                  <span>Répondeur</span>
                </button>
                <button
                  onClick={() => {
                    setVendorInboxFilter('all')
                    setShowVendorInbox(false)
                    setShowCallHistory(false)
                    setShowVendorContacts(true)
                  }}
                  className="bg-white/10 hover:bg-white/15 rounded-2xl px-4 py-4 font-black flex flex-col items-center gap-2"
                >
                  <Users className="w-7 h-7" />
                  <span>Contacts</span>
                </button>
                <button
                  onClick={() => {
                    setShowVendorInbox(false)
                    setShowVendorContacts(false)
                    setShowCallHistory(true)
                  }}
                  className="bg-white/10 hover:bg-white/15 rounded-2xl px-4 py-4 font-black flex flex-col items-center gap-2"
                >
                  <Clock className="w-7 h-7" />
                  <span>Historique</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex justify-center items-center gap-4">
            {!isInCall && !isCalling && !incomingCall && (
              <button
                onClick={() => {
                  requestCallOrOffline()
                }}
                className="bg-[#1b5e20] hover:bg-[#16381a] px-7 py-3.5 rounded-xl flex items-center space-x-2 font-semibold shadow-lg shadow-black/30"
              >
                <Phone className="w-5 h-5" />
                <span>{shouldOfferOfflineMessage || offlinePromptOpen || offlineMessageOpen ? 'Laisser un message' : callPrimaryLabel}</span>
              </button>
            )}

            {shouldOfferOfflineMessage && !offlinePromptOpen && !offlineMessageOpen && !incomingCall && !isCalling && !isInCall && (
              <button onClick={openOfflineMessageFlow} className="bg-white/10 hover:bg-white/15 px-6 py-3 rounded-lg font-semibold">
                Laisser un message
              </button>
            )}

            {(isInCall || isCalling) && (
              <button onClick={endCall} className="bg-red-500 hover:bg-red-600 px-6 py-3 rounded-lg flex items-center space-x-2">
                <PhoneOff className="w-5 h-5" />
                <span>Raccrocher</span>
              </button>
            )}

            {(role === 'vendor' || role === 'client') && !isInCall && !isCalling && !incomingCall && (
              <>
                <button onClick={openDialPad} className="bg-white/10 hover:bg-white/15 px-6 py-3 rounded-lg font-semibold">
                  Appeler un ID
                </button>
                <button
                  onClick={() => {
                    setVendorInboxFilter('new')
                    setShowVendorContacts(false)
                    setShowVendorInbox(true)
                  }}
                  className="bg-white/10 hover:bg-white/15 px-6 py-3 rounded-lg font-semibold"
                >
                  <span className="inline-flex items-center gap-2">
                    Répondeur
                    {vendorUnreadCount > 0 && (
                      <span className="bg-red-500 text-white text-xs font-black rounded-full min-w-[22px] h-[22px] px-1 inline-flex items-center justify-center">
                        {vendorUnreadCount > 99 ? '99+' : vendorUnreadCount}
                      </span>
                    )}
                  </span>
                </button>
                <button
                  onClick={() => {
                    setVendorInboxFilter('all')
                    setShowVendorInbox(false)
                    setShowVendorContacts(true)
                    setShowCallHistory(false)
                  }}
                  className="bg-white/10 hover:bg-white/15 px-6 py-3 rounded-lg font-semibold"
                >
                  Contacts
                </button>
                <button
                  onClick={() => {
                    setShowVendorInbox(false)
                    setShowVendorContacts(false)
                    setShowCallHistory(true)
                  }}
                  className="bg-white/10 hover:bg-white/15 px-6 py-3 rounded-lg font-semibold flex items-center gap-2"
                >
                  <Clock className="w-4 h-4" />
                  Historique
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
