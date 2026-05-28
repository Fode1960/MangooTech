import express from 'express'
import { addVoicemailMessage, listVoicemailMessages, markVoicemailMessageRead } from '../services/voicemailStore'

const router = express.Router()

router.get('/', async (req, res) => {
  const roomId = typeof req.query.roomId === 'string' ? req.query.roomId : undefined
  const status = typeof req.query.status === 'string' ? (req.query.status as any) : undefined
  const messages = await listVoicemailMessages({ roomId, status })
  res.json({ success: true, messages })
})

router.post('/', async (req, res) => {
  const roomId = String(req.body?.roomId || '').trim()
  const kind = String(req.body?.kind || '').trim()
  const fromRole = String(req.body?.fromRole || '').trim()
  const fromUserId = String(req.body?.fromUserId || '').trim()
  const fromLabel = String(req.body?.fromLabel || '').trim()
  const phone = String(req.body?.phone || '').trim()
  const connectPlusId = String(req.body?.connectPlusId || '').trim()
  const callbackPreferred = String(req.body?.callbackPreferred || '').trim().toLowerCase()
  const name = String(req.body?.name || '').trim()
  const dataUrl = String(req.body?.dataUrl || '').trim()

  if (!roomId) return res.status(400).json({ success: false, error: 'roomId requis' })
  if (kind !== 'voice' && kind !== 'callback') return res.status(400).json({ success: false, error: 'kind invalide' })
  if (kind === 'voice' && !dataUrl) return res.status(400).json({ success: false, error: 'dataUrl requis pour voice' })
  if (kind === 'callback' && !phone && !connectPlusId)
    return res.status(400).json({ success: false, error: 'phone ou connectPlusId requis pour callback' })

  const preferred =
    callbackPreferred === 'connectplus' || callbackPreferred === 'pstn'
      ? callbackPreferred
      : (connectPlusId ? 'connectplus' : 'pstn')

  const message = await addVoicemailMessage({
    roomId,
    kind: kind as any,
    fromRole: fromRole || undefined,
    fromUserId: fromUserId || undefined,
    fromLabel: fromLabel || undefined,
    callbackPreferred: kind === 'callback' ? (preferred as any) : undefined,
    connectPlusId: connectPlusId || undefined,
    phone: phone || undefined,
    name: name || undefined,
    dataUrl: dataUrl || undefined,
  })

  res.json({ success: true, message })
})

router.post('/:id/read', async (req, res) => {
  const id = String(req.params.id || '').trim()
  if (!id) return res.status(400).json({ success: false, error: 'id requis' })
  const updated = await markVoicemailMessageRead(id)
  if (!updated) return res.status(404).json({ success: false, error: 'introuvable' })
  res.json({ success: true, message: updated })
})

export default router
