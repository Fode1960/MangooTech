import express from 'express'
import { getRoom, listActiveRooms } from '../services/localLiveShoppingStore'

const router = express.Router()

const safeString = (v: any) => String(v ?? '').trim()

router.get('/room/:roomId', (req, res) => {
  const roomId = safeString(req.params.roomId)
  if (!roomId) return res.status(400).json({ success: false, error: 'missing_roomId' })
  const room = getRoom(roomId)
  if (!room) return res.status(404).json({ success: false, error: 'not_found' })
  res.json({ success: true, room })
})

router.get('/rooms/active', (req, res) => {
  const rooms = listActiveRooms()
  res.json({ success: true, rooms })
})

export default router
