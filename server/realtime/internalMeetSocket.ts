import type { Server as HttpServer } from 'http'
import { getSocketIO } from './socketio'

type JoinPayload = {
  meetingId: string
  userId: string
  userName?: string
}

type ChatPayload = {
  meetingId: string
  text?: string
  attachmentUrl?: string
  attachmentName?: string
  attachmentMime?: string
}

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

const makeId = () => `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`

const rooms = new Map<string, { messages: MeetMessage[] }>()

const getOrCreateRoom = (meetingId: string) => {
  const id = String(meetingId || '').trim()
  if (!id) return null
  const existing = rooms.get(id)
  if (existing) return existing
  const next = { messages: [] as MeetMessage[] }
  rooms.set(id, next)
  return next
}

export function attachInternalMeetSocket(server: HttpServer) {
  const io = getSocketIO(server)
  const anyIo = io as any
  if (anyIo.__mangoo_internalMeetAttached) return
  anyIo.__mangoo_internalMeetAttached = true

  const nsp = io.of('/internal-meet')

  nsp.on('connection', (socket) => {
    socket.on('internal-meet:join', (payload: JoinPayload) => {
      const meetingId = String(payload?.meetingId || '').trim()
      const userId = String(payload?.userId || '').trim() || `user_${Math.random().toString(16).slice(2)}`
      const userName = String(payload?.userName || '').trim() || 'Membre'
      if (!meetingId) return

      socket.data.meetingId = meetingId
      socket.data.userId = userId
      socket.data.userName = userName

      socket.join(meetingId)

      const room = getOrCreateRoom(meetingId)
      socket.emit('internal-meet:state', {
        meetingId,
        messages: room ? room.messages.slice(-200) : [],
      })

      nsp.to(meetingId).emit('internal-meet:presence', {
        meetingId,
        kind: 'join',
        userId,
        userName,
        at: Date.now(),
      })
    })

    socket.on('internal-meet:chat', (payload: ChatPayload) => {
      const meetingId = String(payload?.meetingId || socket.data?.meetingId || '').trim()
      if (!meetingId) return

      const text = String(payload?.text || '').trim()
      const attachmentUrl = String(payload?.attachmentUrl || '').trim()
      const attachmentName = String(payload?.attachmentName || '').trim()
      const attachmentMime = String(payload?.attachmentMime || '').trim()
      if (!text && !attachmentUrl) return

      const fromUserId = String(socket.data?.userId || '').trim() || `user_${Math.random().toString(16).slice(2)}`
      const fromUserName = String(socket.data?.userName || '').trim() || 'Membre'

      const room = getOrCreateRoom(meetingId)
      const msg: MeetMessage = {
        id: makeId(),
        meetingId,
        at: Date.now(),
        fromUserId,
        fromUserName,
        ...(text ? { text } : {}),
        ...(attachmentUrl ? { attachmentUrl } : {}),
        ...(attachmentName ? { attachmentName } : {}),
        ...(attachmentMime ? { attachmentMime } : {}),
      }
      if (room) {
        room.messages.push(msg)
        if (room.messages.length > 500) room.messages = room.messages.slice(-500)
      }

      nsp.to(meetingId).emit('internal-meet:chat', msg)
    })

    socket.on('disconnect', () => {
      const meetingId = String(socket.data?.meetingId || '').trim()
      const userId = String(socket.data?.userId || '').trim()
      const userName = String(socket.data?.userName || '').trim()
      if (!meetingId || !userId) return
      nsp.to(meetingId).emit('internal-meet:presence', {
        meetingId,
        kind: 'leave',
        userId,
        userName,
        at: Date.now(),
      })
    })
  })
}
