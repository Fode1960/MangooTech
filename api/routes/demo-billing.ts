import express from 'express'
import { activateDemoUserPack, getDemoUserPack, quoteDemoUserPackChange } from '../services/demoBillingStore.js'

const router = express.Router()

router.get('/user-pack/:userId', (req, res) => {
  const userId = String(req.params.userId || '').trim()
  if (!userId) return res.status(400).json({ success: false, error: 'missing_user_id' })
  const data = getDemoUserPack(userId)
  res.json({ success: true, userPack: data })
})

router.get('/activate-pack', (req, res) => {
  const userId = String(req.query.userId || '').trim()
  const packId = String(req.query.packId || '').trim()
  const source = String(req.query.source || 'demo_api').trim()
  const transactionId = req.query.transactionId ? String(req.query.transactionId).trim() : null
  if (!userId) return res.status(400).json({ success: false, error: 'missing_user_id' })
  if (!packId) return res.status(400).json({ success: false, error: 'missing_pack_id' })
  const userPack = activateDemoUserPack({ userId, packId, source, transactionId })
  res.json({ success: true, userPack })
})

router.get('/prorata-quote', (req, res) => {
  const userId = String(req.query.userId || '').trim()
  const packId = String(req.query.packId || req.query.toPackId || '').trim()
  if (!userId) return res.status(400).json({ success: false, error: 'missing_user_id' })
  if (!packId) return res.status(400).json({ success: false, error: 'missing_pack_id' })
  const data = quoteDemoUserPackChange({ userId, packId })
  res.json({ success: true, ...data })
})

router.post('/activate-pack', (req, res) => {
  const userId = String(req.body?.userId || '').trim()
  const packId = String(req.body?.packId || '').trim()
  const source = String(req.body?.source || 'demo_api').trim()
  const transactionId = req.body?.transactionId ? String(req.body.transactionId).trim() : null
  if (!userId) return res.status(400).json({ success: false, error: 'missing_user_id' })
  if (!packId) return res.status(400).json({ success: false, error: 'missing_pack_id' })
  const userPack = activateDemoUserPack({ userId, packId, source, transactionId })
  res.json({ success: true, userPack })
})

export default router
